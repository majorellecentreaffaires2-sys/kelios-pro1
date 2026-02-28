import express from 'express';
import pool from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';
import crypto from 'crypto';

const router = express.Router();

// Get user notifications
router.get('/', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC LIMIT 50',
            [req.user.id]
        );
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Mark notification as read
router.put('/:id/read', authenticateToken, async (req, res) => {
    try {
        await pool.query(
            'UPDATE notifications SET isRead = 1 WHERE id = ? AND userId = ?',
            [req.params.id, req.user.id]
        );
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Mark all as read
router.put('/read-all', authenticateToken, async (req, res) => {
    try {
        await pool.query(
            'UPDATE notifications SET isRead = 1 WHERE userId = ?',
            [req.user.id]
        );
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Helper function to create notification (not a route, but for internal use)
export const createNotification = async (userId, type, title, message, link = null) => {
    try {
        const id = crypto.randomUUID();
        await pool.query(
            'INSERT INTO notifications (id, userId, type, title, message, link) VALUES (?, ?, ?, ?, ?, ?)',
            [id, userId, type, title, message, link]
        );
        return id;
    } catch (e) {
        console.error('Failed to create notification', e);
    }
};

export default router;
