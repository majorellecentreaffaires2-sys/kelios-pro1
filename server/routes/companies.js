import express from 'express';
import pool from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { checkPlanLimits } from '../middleware/checkPlanLimits.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
    try {
        let query = 'SELECT * FROM companies';
        let params = [];
        if (req.user.role !== 'SuperAdmin') {
            query += ' WHERE userId = ?';
            params.push(req.user.id);
        }
        const [rows] = await pool.query(query, params);
        res.json(rows.map(row => ({
            ...row,
            defaultVatRates: typeof row.defaultVatRates === 'string' ? JSON.parse(row.defaultVatRates) : (row.defaultVatRates || [20, 14, 10, 7, 0]),
            accountingPlan: typeof row.accountingPlan === 'string' ? JSON.parse(row.accountingPlan) : (row.accountingPlan || [])
        })));
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/', authenticateToken, checkPlanLimits('company'), async (req, res) => {
    const c = req.body;
    try {
        // Explicit mapping to avoid null userId or extra fields
        const companyData = {
            id: c.id || Math.random().toString(36).substr(2, 9),
            userId: req.user.id,
            name: c.name,
            address: c.address,
            email: c.email,
            phone: c.phone,
            website: c.website,
            ice: c.ice,
            ifNum: c.ifNum,
            rc: c.rc,
            taxePro: c.taxePro,
            tp: c.tp,
            bp: c.bp,
            rcs: c.rcs,
            siren: c.siren,
            naf: c.naf,
            tvaIntra: c.tvaIntra,
            logoUrl: c.logoUrl,
            currency: c.currency || 'MAD',
            defaultVatRates: JSON.stringify(c.defaultVatRates || [20, 14, 10, 7, 0]),
            numberingFormat: c.numberingFormat || 'FAC-{YYYY}-{000}',
            primaryColor: c.primaryColor || '#007AFF',
            active: 1,
            accountingPlan: JSON.stringify(c.accountingPlan || []),
            country: c.country || 'maroc',
            bankAccount: c.bankAccount,
            bankName: c.bankName,
            swiftCode: c.swiftCode,
            companyType: c.companyType || 'Standard'
        };

        await pool.query('INSERT INTO companies SET ?', companyData);
        res.json(companyData);
    } catch (e) {
        console.error('Create company error:', e);
        res.status(500).json({ error: e.message });
    }
});

router.put('/:id', authenticateToken, async (req, res) => {
    const { id, ...updates } = req.body;
    if (req.user.role !== 'SuperAdmin') {
        const [existing] = await pool.query('SELECT userId FROM companies WHERE id = ?', [req.params.id]);
        if (existing.length === 0 || existing[0].userId !== req.user.id) return res.status(403).json({ error: "Interdit" });
    }

    const allowed = [
        'name', 'address', 'email', 'phone', 'website', 'ice', 'ifNum', 'rc', 'taxePro',
        'logoUrl', 'currency', 'defaultVatRates', 'numberingFormat', 'primaryColor',
        'active', 'accountingPlan', 'country', 'bankAccount', 'bankName', 'swiftCode',
        'tp', 'bp', 'rcs', 'companyType'
    ];

    const filtered = {};
    allowed.forEach(k => { if (updates[k] !== undefined) filtered[k] = updates[k]; });

    if (filtered.defaultVatRates) filtered.defaultVatRates = JSON.stringify(filtered.defaultVatRates);
    if (filtered.accountingPlan) filtered.accountingPlan = JSON.stringify(filtered.accountingPlan);
    if (filtered.active !== undefined) filtered.active = filtered.active ? 1 : 0;

    try {
        await pool.query('UPDATE companies SET ? WHERE id = ?', [filtered, req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
