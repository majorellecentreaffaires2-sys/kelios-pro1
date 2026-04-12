import express from 'express';
import pool from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// VAT Rates
router.get('/vat-rates', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM vat_rates WHERE companyId = ?', [req.query.companyId]);
        res.json(rows.map(r => ({ ...r, active: r.active === 1, defaultRate: r.defaultRate === 1 })));
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/vat-rates', authenticateToken, async (req, res) => {
    try {
        const v = req.body;
        await pool.query('INSERT INTO vat_rates SET ?', { ...v, active: v.active ? 1 : 0, defaultRate: v.defaultRate ? 1 : 0 });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/vat-rates/:id', authenticateToken, async (req, res) => {
    try {
        const updates = req.body;
        const data = { ...updates };
        if (data.active !== undefined) data.active = data.active ? 1 : 0;
        if (data.defaultRate !== undefined) data.defaultRate = data.defaultRate ? 1 : 0;
        await pool.query('UPDATE vat_rates SET ? WHERE id = ?', [data, req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/vat-rates/:id', authenticateToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM vat_rates WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Templates
router.get('/templates', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM templates WHERE companyId = ?', [req.query.companyId]);
        res.json(rows.map(r => ({ ...r, items: Array.isArray(r.items) ? r.items : (typeof r.items === 'string' ? JSON.parse(r.items || '[]') : (r.items || [])) })));
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/templates', authenticateToken, async (req, res) => {
    try {
        const t = req.body;
        await pool.query('INSERT INTO templates SET ?', { ...t, items: JSON.stringify(t.items || []) });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/templates/:id', authenticateToken, async (req, res) => {
    try {
        const updates = req.body;
        const data = { ...updates };
        if (data.items) data.items = JSON.stringify(data.items);
        await pool.query('UPDATE templates SET ? WHERE id = ?', [data, req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/templates/:id', authenticateToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM templates WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Shortcuts
router.get('/shortcuts', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM shortcuts WHERE companyId = ? AND userId = ?', [req.query.companyId, req.query.userId]);
        const shortcuts = rows[0]?.shortcuts;
        res.json(typeof shortcuts === 'string' ? JSON.parse(shortcuts || '[]') : (shortcuts || []));
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/shortcuts', authenticateToken, async (req, res) => {
    try {
        const { companyId, userId, shortcuts } = req.body;
        await pool.query('INSERT INTO shortcuts (companyId, userId, shortcuts) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE shortcuts = ?',
            [companyId, userId, JSON.stringify(shortcuts), JSON.stringify(shortcuts)]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
