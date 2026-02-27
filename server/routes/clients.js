import express from 'express';
import pool from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { checkPlanLimits } from '../middleware/checkPlanLimits.js';

const router = express.Router();

router.get('/all', authenticateToken, async (req, res) => {
    if (req.user.role !== 'SuperAdmin') return res.sendStatus(403);
    try {
        const [rows] = await pool.query(`
            SELECT c.*, comp.name as companyName, u.username as ownerName 
            FROM clients c 
            LEFT JOIN companies comp ON c.companyId = comp.id
            LEFT JOIN users u ON comp.userId = u.id
        `);
        res.json(rows.map(r => ({ ...r, isBlocked: r.isBlocked === 1 || r.isBlocked === true })));
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM clients WHERE companyId = ?', [req.query.companyId]);
        res.json(rows.map(r => ({ ...r, isBlocked: r.isBlocked === 1 || r.isBlocked === true })));
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', authenticateToken, checkPlanLimits('client'), async (req, res) => {
    const c = req.body;
    try {
        const data = { ...c, isBlocked: c.isBlocked ? 1 : 0 };
        await pool.query('INSERT INTO clients SET ?', data);
        res.json(c);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', authenticateToken, async (req, res) => {
    const updates = req.body;
    try {
        const data = { ...updates, isBlocked: updates.isBlocked ? 1 : 0 };
        delete data.id;
        await pool.query('UPDATE clients SET ? WHERE id = ?', [data, req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM clients WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
