import express from 'express';
import pool from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

router.get('/me', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT id, username, email, role, subscriptionStatus, trialEndsAt, plan, planInterval, lastPaymentDate, avatarUrl, createdAt FROM users WHERE id = ?',
            [req.user.id]
        );
        if (rows.length === 0) return res.status(404).json({ success: false, error: 'Utilisateur introuvable' });
        res.json({ success: true, user: rows[0] });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

router.get('/subscription/status', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT subscriptionStatus, trialEndsAt, plan FROM users WHERE id = ?', [req.user.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Not found' });

        const user = rows[0];
        const isLocked = user.subscriptionStatus === 'locked' || (user.subscriptionStatus === 'trial' && new Date() > new Date(user.trialEndsAt));

        if (isLocked && user.subscriptionStatus !== 'locked') {
            await pool.query('UPDATE users SET subscriptionStatus = "locked" WHERE id = ?', [req.user.id]);
            user.subscriptionStatus = 'locked';
        }

        res.json({ success: true, status: user.subscriptionStatus, trialEndsAt: user.trialEndsAt, isLocked });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/subscription/pay', authenticateToken, async (req, res) => {
    try {
        await pool.query('UPDATE users SET subscriptionStatus = "active", lastPaymentDate = NOW() WHERE id = ?', [req.user.id]);
        res.json({ success: true, status: 'active' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/users/:id', authenticateToken, async (req, res) => {
    const { username, email, password, role, subscriptionStatus, avatarUrl } = req.body;
    const isSelf = req.user.id === req.params.id;
    const isSuperAdmin = req.user.role === 'SuperAdmin';

    if (!isSelf && !isSuperAdmin) return res.sendStatus(403);

    try {
        const updates = [];
        const values = [];

        // Allow users to update their own avatar
        if (avatarUrl !== undefined) {
            updates.push('avatarUrl = ?');
            values.push(avatarUrl);
        }

        if (password) {
            updates.push('password = ?');
            values.push(await bcrypt.hash(password, 12));
        }

        if (isSuperAdmin) {
            if (username !== undefined) {
                updates.push('username = ?');
                values.push(username);
            }
            if (email !== undefined) {
                updates.push('email = ?');
                values.push(email);
            }
            if (role !== undefined) {
                updates.push('role = ?');
                values.push(role);
            }
            if (subscriptionStatus !== undefined) {
                updates.push('subscriptionStatus = ?');
                values.push(subscriptionStatus);
            }
        } else if (isSelf) {
            // Regular users can update their own username/email
            if (username !== undefined) {
                updates.push('username = ?');
                values.push(username);
            }
            if (email !== undefined) {
                updates.push('email = ?');
                values.push(email);
            }
        }

        if (updates.length > 0) {
            values.push(req.params.id);
            await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
        }

        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Admin list
router.get('/users', authenticateToken, async (req, res) => {
    if (req.user.role !== 'SuperAdmin') return res.sendStatus(403);
    try {
        const [rows] = await pool.query(`
            SELECT u.id, u.username, u.email, u.role, u.subscriptionStatus, u.trialEndsAt,
            (SELECT COUNT(*) FROM companies WHERE userId = u.id) as companyCount
            FROM users u
        `);
        res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/users/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'SuperAdmin') return res.sendStatus(403);
    try {
        await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
