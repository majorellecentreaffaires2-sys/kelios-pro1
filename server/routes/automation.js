import express from 'express';
import pool from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

const parseJson = (val, fallback) => {
    if (val === null || val === undefined) return fallback;
    return typeof val === 'string' ? JSON.parse(val) : val;
};

// --- RECURRING SCHEDULES ---
router.get('/recurring-schedules', authenticateToken, async (req, res) => {
    const { companyId } = req.query;
    try {
        const [rows] = await pool.query('SELECT * FROM recurring_schedules WHERE companyId = ?', [companyId]);
        res.json(rows.map(row => ({ ...row, isActive: row.isActive === 1 })));
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/recurring-schedules', authenticateToken, async (req, res) => {
    const s = req.body;
    try {
        const data = { ...s, isActive: s.isActive ? 1 : 0 };
        await pool.query('INSERT INTO recurring_schedules SET ?', data);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- REMINDER SETTINGS ---
router.get('/reminder-settings', authenticateToken, async (req, res) => {
    const { companyId } = req.query;
    try {
        const [rows] = await pool.query('SELECT * FROM reminder_settings WHERE companyId = ?', [companyId]);
        if (rows.length > 0) {
            const s = rows[0];
            res.json({
                ...s,
                enableAutoReminder: s.enableAutoReminder === 1,
                reminderDays: parseJson(s.reminderDays, [7, 14, 30])
            });
        } else {
            res.json({ enableAutoReminder: false, reminderDays: [7, 14, 30] });
        }
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/reminder-settings', authenticateToken, async (req, res) => {
    const s = req.body;
    try {
        const data = {
            ...s,
            enableAutoReminder: s.enableAutoReminder ? 1 : 0,
            reminderDays: JSON.stringify(s.reminderDays || [7, 14, 30])
        };
        await pool.query('INSERT INTO reminder_settings SET ? ON DUPLICATE KEY UPDATE ?', [data, data]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- SCHEDULED EMAILS ---
router.get('/scheduled-emails', authenticateToken, async (req, res) => {
    const { companyId } = req.query;
    try {
        const [rows] = await pool.query('SELECT * FROM scheduled_emails WHERE companyId = ? ORDER BY scheduledDate DESC', [companyId]);
        res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
