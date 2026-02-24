import express from 'express';
import pool from '../config/db.js';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { authenticateToken } from '../middleware/auth.js';
import 'dotenv/config';

const router = express.Router();

// Rate limit public view endpoints to prevent token brute-forcing
const publicLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60, // 60 requests per 15 min per IP
    message: { error: 'Trop de requêtes. Réessayez dans 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const respondLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: { error: 'Trop de tentatives. Réessayez dans 1 heure.' }
});

// ─── GENERATE PUBLIC LINK (requires auth — must be invoice owner) ──────────────
router.post('/invoices/:id/public-link', authenticateToken, async (req, res) => {
    try {
        const { expiryDays = 30 } = req.body;

        // Security: verify the invoice belongs to one of the user's companies
        const [invoiceRows] = await pool.query(
            `SELECT i.id FROM invoices i
             INNER JOIN companies c ON i.companyId = c.id
             WHERE i.id = ? AND c.userId = ?`,
            [req.params.id, req.user.id]
        );
        // SuperAdmin can generate links for any invoice
        if (invoiceRows.length === 0 && req.user.role !== 'SuperAdmin') {
            return res.status(403).json({ error: 'Accès refusé' });
        }

        // Use cryptographically secure random token
        const rawToken = crypto.randomBytes(40).toString('hex'); // 80 chars, very high entropy
        const expiresAt = expiryDays > 0
            ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000)
            : null;
        const id = crypto.randomUUID();

        // Remove old token for this invoice
        await pool.query('DELETE FROM invoice_tokens WHERE invoiceId = ?', [req.params.id]);
        await pool.query(
            'INSERT INTO invoice_tokens (id, invoiceId, token, expiresAt) VALUES (?, ?, ?, ?)',
            [id, req.params.id, rawToken, expiresAt]
        );

        const publicUrl = `${process.env.APP_URL || 'http://localhost:5173'}?view=${rawToken}`;
        res.json({ success: true, url: publicUrl, token: rawToken });
    } catch (e) {
        console.error('[Public] Generate link error:', e);
        res.status(500).json({ error: 'Erreur lors de la génération du lien' });
    }
});

// ─── PUBLIC VIEW (no auth needed) ─────────────────────────────────────────────
router.get('/view/:token', publicLimiter, async (req, res) => {
    try {
        // Basic token format validation (should be 80 hex chars)
        const token = req.params.token;
        if (!token || !/^[a-f0-9]{80}$/.test(token)) {
            return res.status(400).json({ error: 'Token invalide' });
        }

        const [tokens] = await pool.query(
            'SELECT * FROM invoice_tokens WHERE token = ? AND (expiresAt IS NULL OR expiresAt > NOW())',
            [token]
        );
        if (tokens.length === 0) {
            return res.status(404).json({ error: 'Lien invalide ou expiré' });
        }

        const tokenRecord = tokens[0];

        // Log first view with IP (for security audit)
        if (!tokenRecord.viewedAt) {
            const clientIp = req.ip || req.connection?.remoteAddress || null;
            await pool.query(
                'UPDATE invoice_tokens SET viewedAt = NOW(), clientIp = ? WHERE id = ?',
                [clientIp, tokenRecord.id]
            );
        }

        const [invoices] = await pool.query('SELECT * FROM invoices WHERE id = ?', [tokenRecord.invoiceId]);
        if (invoices.length === 0) return res.status(404).json({ error: 'Facture introuvable' });

        const inv = invoices[0];

        // Parse JSON fields safely
        const parseJson = (val, fallback = {}) => {
            try { return typeof val === 'string' ? JSON.parse(val) : (val || fallback); }
            catch { return fallback; }
        };

        res.json({
            invoice: {
                id: inv.id,
                invoiceNumber: inv.invoiceNumber,
                type: inv.type,
                status: inv.status,
                date: inv.date,
                dueDate: inv.dueDate,
                currency: inv.currency,
                language: inv.language,
                primaryColor: inv.primaryColor,
                visualTemplate: inv.visualTemplate,
                discount: inv.discount,
                notes: inv.notes,
                subject: inv.subject,
                paymentTerms: inv.paymentTerms,
                sender: parseJson(inv.sender),
                client: parseJson(inv.client),
                items: parseJson(inv.items, []),
                payments: parseJson(inv.payments, []),
            },
            tokenInfo: {
                viewedAt: tokenRecord.viewedAt || new Date(),
                response: tokenRecord.response,
                respondedAt: tokenRecord.respondedAt,
                expiresAt: tokenRecord.expiresAt,
            }
        });
    } catch (e) {
        console.error('[Public] View invoice error:', e);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ─── CLIENT RESPONSE (accept/decline quote) ────────────────────────────────────
router.post('/view/:token/respond', respondLimiter, async (req, res) => {
    const { response } = req.body;

    if (!['accepted', 'declined'].includes(response)) {
        return res.status(400).json({ error: 'Réponse invalide' });
    }

    const token = req.params.token;
    if (!token || !/^[a-f0-9]{80}$/.test(token)) {
        return res.status(400).json({ error: 'Token invalide' });
    }

    try {
        const [tokens] = await pool.query(
            'SELECT * FROM invoice_tokens WHERE token = ? AND (expiresAt IS NULL OR expiresAt > NOW())',
            [token]
        );
        if (tokens.length === 0) return res.status(404).json({ error: 'Lien invalide ou expiré' });

        const tokenRecord = tokens[0];

        // Prevent responding twice
        if (tokenRecord.respondedAt) {
            return res.status(409).json({
                error: 'Vous avez déjà répondu à ce document.',
                existingResponse: tokenRecord.response
            });
        }

        // Verify the invoice is a type that allows responses
        const [invoices] = await pool.query(
            'SELECT type, status FROM invoices WHERE id = ?', [tokenRecord.invoiceId]
        );
        if (invoices.length === 0) return res.status(404).json({ error: 'Facture introuvable' });

        const inv = invoices[0];
        const responseAllowedTypes = ['Devis', 'Proforma'];
        if (!responseAllowedTypes.includes(inv.type)) {
            return res.status(400).json({ error: 'Ce document ne supporte pas les réponses en ligne' });
        }

        // Update token record
        await pool.query(
            'UPDATE invoice_tokens SET response = ?, respondedAt = NOW() WHERE id = ?',
            [response, tokenRecord.id]
        );

        // Update invoice status
        const newStatus = response === 'accepted' ? 'Accepte' : 'Refuse';
        await pool.query(
            'UPDATE invoices SET status = ? WHERE id = ?',
            [newStatus, tokenRecord.invoiceId]
        );

        res.json({ success: true, response, message: response === 'accepted' ? 'Devis accepté avec succès.' : 'Devis décliné.' });
    } catch (e) {
        console.error('[Public] Respond error:', e);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

export default router;
