import express from 'express';
import pool from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/reports/monthly', authenticateToken, async (req, res) => {
    const { companyId, month, year } = req.query;
    try {
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = new Date(year, month, 0).toISOString().split('T')[0];

        const [invoices] = await pool.query('SELECT * FROM invoices WHERE companyId = ? AND date BETWEEN ? AND ?', [companyId, startDate, endDate]);

        let stats = { ht: 0, tva: 0, ttc: 0, paid: 0, count: 0 };

        invoices.forEach(inv => {
            if (inv.status === 'Brouillon' || inv.status === 'Annulée') return;

            const items = JSON.parse(inv.items || '[]');
            const payments = JSON.parse(inv.payments || '[]');

            let invHT = 0;
            let invTVA = 0;

            items.forEach(item => {
                (item.subItems || []).forEach(sub => {
                    const lineHT = sub.quantity * sub.price * (1 - (sub.discount || 0) / 100);
                    invHT += lineHT;
                    invTVA += lineHT * (sub.taxRate / 100);
                });
            });

            stats.ht += invHT;
            stats.tva += invTVA;
            stats.ttc += (invHT + invTVA);
            stats.paid += payments.reduce((s, p) => s + p.amount, 0);
            stats.count++;
        });

        res.json({ success: true, summary: stats });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/logs', authenticateToken, async (req, res) => {
    try {
        const { companyId } = req.query;
        let query = 'SELECT * FROM audit_logs';
        let params = [];
        if (companyId) {
            query += ' WHERE companyId = ?';
            params.push(companyId);
        }
        query += ' ORDER BY timestamp DESC LIMIT 200';
        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
