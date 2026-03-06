import express from 'express';
import pool from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { checkPlanLimits } from '../middleware/checkPlanLimits.js';
import transporter from '../config/email.js';

const router = express.Router();

const formatDate = (d) => d ? new Date(d).toISOString().split('T')[0] : null;

const parseJson = (val, fallback) => {
    if (val === null || val === undefined) return fallback;
    return typeof val === 'string' ? JSON.parse(val) : val;
};

router.get('/', authenticateToken, async (req, res) => {
    const { companyId } = req.query;
    try {
        const [rows] = await pool.query('SELECT * FROM invoices WHERE companyId = ?', [companyId]);
        res.json(rows.map(row => ({
            ...row,
            sender: parseJson(row.sender, {}),
            client: parseJson(row.client, {}),
            items: parseJson(row.items, []),
            payments: parseJson(row.payments, []),
            auditTrail: parseJson(row.auditTrail, []),
            relanceHistory: parseJson(row.relanceHistory, []),
            discount: parseFloat(row.discount) || 0
        })));
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', authenticateToken, checkPlanLimits('invoice'), async (req, res) => {
    const i = req.body;
    try {
        const invoiceData = {
            id: i.id,
            companyId: i.companyId,
            invoiceNumber: i.invoiceNumber,
            type: i.type,
            documentNature: i.documentNature || 'Facture',
            status: i.status,
            date: formatDate(i.date),
            dueDate: formatDate(i.dueDate),
            sender: JSON.stringify(i.sender || {}),
            client: JSON.stringify(i.client || {}),
            items: JSON.stringify(i.items || []),
            payments: JSON.stringify(i.payments || []),
            auditTrail: JSON.stringify(i.auditTrail || []),
            relanceHistory: JSON.stringify(i.relanceHistory || []),
            discount: parseFloat(i.discount) || 0,
            subject: i.subject,
            notes: i.notes,
            currency: i.currency,
            language: i.language,
            primaryColor: i.primaryColor,
            visualTemplate: i.visualTemplate,
            convertedFromId: i.convertedFromId,
            validatedAt: formatDate(i.validatedAt),
            legalArchiveUntil: formatDate(i.legalArchiveUntil),
            paymentTerms: i.paymentTerms,
            paymentMethod: i.paymentMethod
        };
        await pool.query('INSERT INTO invoices SET ?', invoiceData);
        res.json({ success: true, invoice: i });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', authenticateToken, async (req, res) => {
    const i = req.body;
    const id = req.params.id;
    try {
        const invoiceData = {
            companyId: i.companyId,
            invoiceNumber: i.invoiceNumber,
            type: i.type,
            documentNature: i.documentNature || 'Facture',
            status: i.status,
            date: formatDate(i.date),
            dueDate: formatDate(i.dueDate),
            sender: JSON.stringify(i.sender || {}),
            client: JSON.stringify(i.client || {}),
            items: JSON.stringify(i.items || []),
            payments: JSON.stringify(i.payments || []),
            auditTrail: JSON.stringify(i.auditTrail || []),
            relanceHistory: JSON.stringify(i.relanceHistory || []),
            discount: parseFloat(i.discount) || 0,
            subject: i.subject,
            notes: i.notes,
            currency: i.currency,
            language: i.language,
            primaryColor: i.primaryColor,
            visualTemplate: i.visualTemplate,
            convertedFromId: i.convertedFromId,
            validatedAt: formatDate(i.validatedAt),
            legalArchiveUntil: formatDate(i.legalArchiveUntil),
            paymentTerms: i.paymentTerms,
            paymentMethod: i.paymentMethod
        };
        await pool.query('UPDATE invoices SET ? WHERE id = ?', [invoiceData, id]);
        res.json({ success: true, invoice: i });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM invoices WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Send Invoice Email
router.post('/:id/send', authenticateToken, async (req, res) => {
    const { recipientEmail, subject, body, invoiceData, pdfBase64 } = req.body;
    if (!recipientEmail) return res.status(400).json({ error: 'Email requis' });

    try {
        const mailOptions = {
            from: process.env.SMTP_FROM || '"Majorlle Pro" <noreply@majorlle.pro>',
            to: recipientEmail,
            subject: subject || `${invoiceData.type} ${invoiceData.invoiceNumber}`,
            html: `
        <div style="font-family: sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
          <h2 style="color: #2563eb;">${invoiceData.type} #${invoiceData.invoiceNumber}</h2>
          <p>Bonjour,</p>
          <p>${body || `Veuillez trouver ci-joint votre document ${invoiceData.invoiceNumber}.`}</p>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
            <p><strong>Montant:</strong> ${invoiceData.totalTTC?.toLocaleString()} ${invoiceData.currency}</p>
            <p><strong>Échéance:</strong> ${invoiceData.dueDate ? new Date(invoiceData.dueDate).toLocaleDateString() : 'N/A'}</p>
          </div>
          <p style="font-size: 12px; color: #94a3b8;">Envoyé via l'infrastructure Majorlle Pro.</p>
        </div>
      `,
            attachments: pdfBase64 ? [{
                filename: `${invoiceData.invoiceNumber}.pdf`,
                content: pdfBase64.split("base64,")[1] || pdfBase64,
                encoding: 'base64'
            }] : []
        };

        await transporter.sendMail(mailOptions);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Get overdue invoices
router.get('/overdue', authenticateToken, async (req, res) => {
    const { companyId } = req.query;
    try {
        const today = new Date().toISOString().split('T')[0];
        const [rows] = await pool.query(
            'SELECT * FROM invoices WHERE companyId = ? AND dueDate < ? AND status NOT IN (?, ?, ?)',
            [companyId, today, 'Payée', 'Annulée', 'Brouillon']
        );
        res.json(rows.map(row => ({
            ...row,
            sender: parseJson(row.sender, {}),
            client: parseJson(row.client, {}),
            items: parseJson(row.items, []),
            payments: parseJson(row.payments, [])
        })));
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Get invoices due soon
router.get('/due-soon', authenticateToken, async (req, res) => {
    const { companyId, days } = req.query;
    try {
        const today = new Date();
        const futureDate = new Date(today);
        futureDate.setDate(futureDate.getDate() + parseInt(days || '7'));

        const [rows] = await pool.query(
            'SELECT * FROM invoices WHERE companyId = ? AND dueDate BETWEEN ? AND ? AND status NOT IN (?, ?, ?)',
            [companyId, today.toISOString().split('T')[0], futureDate.toISOString().split('T')[0], 'Payée', 'Annulée', 'Brouillon']
        );
        res.json(rows.map(row => ({
            ...row,
            sender: parseJson(row.sender, {}),
            client: parseJson(row.client, {}),
            items: parseJson(row.items, []),
            payments: parseJson(row.payments, [])
        })));
    } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
