import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import pool from '../config/db.js';
import transporter from '../config/email.js';
import 'dotenv/config';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'majorlle-erp-default-dev-key-change-me';

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { success: false, message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.' }
});

// REGISTER
router.post('/register', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Champs requis' });

    try {
        const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) return res.status(400).json({ success: false, message: 'Cet email est déjà utilisé' });

        const hashedPassword = await bcrypt.hash(password, 12);
        const userId = Math.random().toString(36).substr(2, 9);
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const trialEndsAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

        await pool.query(
            'INSERT INTO users (id, username, email, password, role, subscriptionStatus, trialEndsAt, plan, isVerified, verificationCode) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [userId, email, email, hashedPassword, 'User', 'trial', trialEndsAt, 'monthly_200', 0, verificationCode]
        );

        const mailOptions = {
            from: process.env.SMTP_FROM || '"Majorlle Pro" <no-reply@majorlle.pro>',
            to: email,
            subject: 'Code de vérification - Majorlle Pro',
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #f1f5f9; border-radius: 20px; background: #ffffff;">
          <h2 style="color: #2563eb; text-align: center; font-size: 24px;">Activez votre compte Cloud</h2>
          <p style="color: #64748b; text-align: center;">Merci de rejoindre l'infrastructure <strong>Majorlle Pro</strong>.</p>
          <div style="background-color: #f8fafc; padding: 30px; text-align: center; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #0f172a; border-radius: 16px; margin: 25px 0; border: 1px solid #e2e8f0;">
            ${verificationCode}
          </div>
          <p style="color: #94a3b8; font-size: 13px; text-align: center;">Ce code de sécurité est personnel et expire prochainement.</p>
        </div>
      `
        };

        transporter.sendMail(mailOptions).catch(err => console.error('Mail delivery fail:', err));

        res.json({ success: true, message: 'Code envoyé.', email });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});

// LOGIN
router.post('/login', loginLimiter, [
    body('username').trim().notEmpty(),
    body('password').notEmpty()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Données invalides' });

    const { username: identifier, password } = req.body;

    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE username = ? OR email = ?', [identifier, identifier]);
        if (rows.length === 0) return res.json({ success: false, message: 'Identifiants invalides' });

        const user = rows[0];
        if (!user.isVerified) return res.json({ success: false, message: 'Compte non vérifié', needsVerification: true, email: user.email });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.json({ success: false, message: 'Identifiants invalides' });

        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ success: true, user: { id: user.id, username: user.username, role: user.role }, token });
    } catch (e) {
        res.status(500).json({ error: 'Erreur interne' });
    }
});

// VERIFY EMAIL
router.post('/verify-email', async (req, res) => {
    const { email, code } = req.body;
    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ? AND verificationCode = ?', [email, code]);
        if (rows.length === 0) return res.status(400).json({ success: false, message: 'Code invalide' });

        const user = rows[0];
        await pool.query('UPDATE users SET isVerified = 1, verificationCode = NULL WHERE id = ?', [user.id]);

        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ success: true, user: { id: user.id, username: user.username, email: user.email, role: user.role }, token });
    } catch (e) {
        res.status(500).json({ success: false });
    }
});

export default router;
