import express from 'express';
import pool from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM articles WHERE companyId = ?', [req.query.companyId]);
        res.json(rows.map(r => ({ ...r, trackStock: r.trackStock === 1, type: r.type || 'product' })));
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', authenticateToken, async (req, res) => {
    const a = req.body;
    try {
        const data = { ...a, trackStock: a.trackStock ? 1 : 0 };
        await pool.query('INSERT INTO articles SET ?', data);
        res.json(a);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', authenticateToken, async (req, res) => {
    const updates = req.body;
    try {
        const data = { ...updates, trackStock: updates.trackStock ? 1 : 0 };
        await pool.query('UPDATE articles SET ? WHERE id = ?', [data, req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM articles WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/import', authenticateToken, async (req, res) => {
    const { companyId, articles } = req.body;
    try {
        let imported = 0;
        for (const a of articles) {
            const data = {
                id: Math.random().toString(36).substr(2, 9),
                companyId,
                code: a.code || '',
                description: a.description || '',
                priceHt: parseFloat(a.priceHt) || 0,
                defaultVat: parseFloat(a.defaultVat) || 20,
                unit: a.unit || 'U',
                trackStock: a.trackStock ? 1 : 0
            };
            await pool.query('INSERT INTO articles SET ?', data);
            imported++;
        }
        res.json({ success: true, imported });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
