import express from 'express';
import pool from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';
import archiver from 'archiver';
import transporter from '../config/email.js';

const router = express.Router();

router.get('/me', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT id, username, email, role, subscriptionStatus, trialEndsAt, plan, planInterval, lastPaymentDate, extraCompanies, totalMonthlyCost, avatarUrl, createdAt FROM users WHERE id = ?',
            [req.user.id]
        );
        if (rows.length === 0) return res.status(404).json({ success: false, error: 'Utilisateur introuvable' });
        res.json({ success: true, user: rows[0] });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/subscription/status', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT subscriptionStatus, trialEndsAt, plan, planInterval, expiresAt, extraCompanies, totalMonthlyCost FROM users WHERE id = ?', [req.user.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Not found' });

        const user = rows[0];
        let isLocked = false;
        
        // Vérifier si l'essai est expiré
        if (user.subscriptionStatus === 'trial' && new Date() > new Date(user.trialEndsAt)) {
            isLocked = true;
        }
        
        // Vérifier si l'abonnement est expiré
        if (user.subscriptionStatus === 'active' && user.expiresAt && new Date() > new Date(user.expiresAt)) {
            isLocked = true;
        }
        
        // Verrouiller le compte si nécessaire
        if (isLocked && user.subscriptionStatus !== 'locked') {
            await pool.query('UPDATE users SET subscriptionStatus = "locked" WHERE id = ?', [req.user.id]);
            user.subscriptionStatus = 'locked';
        }

        res.json({ 
            success: true, 
            status: user.subscriptionStatus, 
            trialEndsAt: user.trialEndsAt,
            expiresAt: user.expiresAt,
            isLocked,
            plan: user.plan,
            planInterval: user.planInterval,
            extraCompanies: user.extraCompanies,
            totalMonthlyCost: user.totalMonthlyCost
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/invoices/generate-subscription', authenticateToken, async (req, res) => {
    try {
        const invoiceData = req.body;
        
        // Générer un numéro de facture unique
        const invoiceNumber = `SUB-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
        
        // Récupérer l'entreprise de l'utilisateur
        const [companies] = await pool.query('SELECT * FROM companies WHERE userId = ? LIMIT 1', [req.user.id]);
        const company = companies[0];
        
        if (!company) {
            return res.status(400).json({ error: 'Aucune entreprise trouvée pour cet utilisateur' });
        }
        
        // Calculer les totaux
        let totalHt = 0;
        let totalTva = 0;
        let totalTtc = 0;
        
        const itemsWithTotals = invoiceData.items.map(item => {
            const itemTotalHt = item.unitPrice * item.quantity;
            const itemTva = itemTotalHt * (item.vatRate / 100);
            const itemTotalTtc = itemTotalHt + itemTva;
            
            totalHt += itemTotalHt;
            totalTva += itemTva;
            totalTtc += itemTotalTtc;
            
            return {
                ...item,
                totalHt: itemTotalHt,
                totalTva: itemTva,
                totalTtc: itemTotalTtc
            };
        });
        
        // Créer la facture
        const [result] = await pool.query(`
            INSERT INTO invoices (
                id, invoiceNumber, companyId, clientName, clientEmail, type, documentNature,
                date, dueDate, items, paymentMethod, notes, currency, totalHt, totalTva, totalTtc,
                status, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'EN_ATTENTE', NOW(), NOW())
        `, [
            `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            invoiceNumber,
            company.id,
            invoiceData.clientName,
            invoiceData.clientEmail,
            invoiceData.type,
            invoiceData.documentNature,
            invoiceData.date,
            invoiceData.dueDate,
            JSON.stringify(itemsWithTotals),
            invoiceData.paymentMethod,
            invoiceData.notes,
            invoiceData.currency,
            totalHt,
            totalTva,
            totalTtc
        ]);
        
        // Envoyer la facture par email
        const mailOptions = {
            from: process.env.SMTP_FROM || '"Majorlle Pro" <no-reply@majorlle.pro>',
            to: invoiceData.clientEmail,
            subject: `Facture KELIOS PRO - ${invoiceNumber}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #f1f5f9; border-radius: 20px; background: #ffffff;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h2 style="color: #2563eb; font-size: 24px; margin-bottom: 10px;">FACTURE</h2>
                        <h3 style="color: #1e293b; font-size: 20px;">KELIOS PRO</h3>
                        <p style="color: #6b7280; font-size: 16px;">Numéro: ${invoiceNumber}</p>
                        <p style="color: #6b7280; font-size: 16px;">Date: ${new Date(invoiceData.date).toLocaleDateString('fr-FR')}</p>
                    </div>
                    
                    <div style="background: #f8fafc; padding: 20px; border-radius: 15px; margin: 20px 0;">
                        <h4 style="color: #1e293b; font-size: 18px; margin-bottom: 15px;">DÉTAILS DE LA FACTURE</h4>
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background: #e5e7eb;">
                                    <th style="padding: 10px; text-align: left; border: 1px solid #d1d5db;">Description</th>
                                    <th style="padding: 10px; text-align: right; border: 1px solid #d1d5db;">Qté</th>
                                    <th style="padding: 10px; text-align: right; border: 1px solid #d1d5db;">Prix HT</th>
                                    <th style="padding: 10px; text-align: right; border: 1px solid #d1d5db;">Total HT</th>
                                    <th style="padding: 10px; text-align: right; border: 1px solid #d1d5db;">TVA</th>
                                    <th style="padding: 10px; text-align: right; border: 1px solid #d1d5db;">Total TTC</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsWithTotals.map(item => `
                                    <tr>
                                        <td style="padding: 10px; border: 1px solid #d1d5db;">${item.description}</td>
                                        <td style="padding: 10px; text-align: right; border: 1px solid #d1d5db;">${item.quantity}</td>
                                        <td style="padding: 10px; text-align: right; border: 1px solid #d1d5db;">${item.unitPrice.toFixed(2)} ${invoiceData.currency}</td>
                                        <td style="padding: 10px; text-align: right; border: 1px solid #d1d5db;">${item.totalHt.toFixed(2)} ${invoiceData.currency}</td>
                                        <td style="padding: 10px; text-align: right; border: 1px solid #d1d5db;">${item.totalTva.toFixed(2)} ${invoiceData.currency}</td>
                                        <td style="padding: 10px; text-align: right; border: 1px solid #d1d5db;">${item.totalTtc.toFixed(2)} ${invoiceData.currency}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                            <tfoot>
                                <tr style="background: #f3f4f6; font-weight: bold;">
                                    <td colspan="3" style="padding: 10px; text-align: right; border: 1px solid #d1d5db;">TOTAL</td>
                                    <td style="padding: 10px; text-align: right; border: 1px solid #d1d5db;">${totalHt.toFixed(2)} ${invoiceData.currency}</td>
                                    <td style="padding: 10px; text-align: right; border: 1px solid #d1d5db;">${totalTva.toFixed(2)} ${invoiceData.currency}</td>
                                    <td style="padding: 10px; text-align: right; border: 1px solid #d1d5db;">${totalTtc.toFixed(2)} ${invoiceData.currency}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    
                    <div style="background: #fef3c7; padding: 20px; border-radius: 15px; margin: 20px 0;">
                        <h4 style="color: #92400e; font-size: 18px; margin-bottom: 10px;">MODE DE PAIEMENT</h4>
                        <p style="color: #78350f; font-size: 16px;">
                            ${invoiceData.paymentMethod}${invoiceData.paymentMethod === 'Virement' ? ' - Veuillez suivre les instructions envoyées séparément' : ''}
                        </p>
                        <p style="color: #78350f; font-size: 16px;">
                            Date d'échéance: ${new Date(invoiceData.dueDate).toLocaleDateString('fr-FR')}
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                        <p style="color: #6b7280; font-size: 16px; margin-bottom: 10px;">
                            Merci de votre confiance dans KELIOS PRO !
                        </p>
                        <p style="color: #374151; font-size: 16px; font-weight: bold;">
                            Group Digital Concept
                        </p>
                        <p style="color: #6b7280; font-size: 14px; margin-top: 15px;">
                            Marrakesh, Maroc<br>
                            <a href="https://kelios-pro.com/" style="color: #2563eb;">https://kelios-pro.com/</a> | 
                            <a href="mailto:compta@groupdigitalconcept.com" style="color: #2563eb;">compta@groupdigitalconcept.com</a> | 
                            <a href="tel:+212764181061" style="color: #2563eb;">+212 7 64 18 10 61</a>
                        </p>
                    </div>
                </div>
            `
        };

        // Envoyer l'email
        await transporter.sendMail(mailOptions);
        
        res.json({ 
            success: true, 
            invoiceId: result.insertId,
            invoiceNumber,
            message: 'Facture générée et envoyée par email avec succès' 
        });
    } catch (e) {
        console.error('Error generating subscription invoice:', e);
        res.status(500).json({ error: e.message });
    }
});

router.post('/subscription/bank-transfer-instructions', authenticateToken, async (req, res) => {
    try {
        const { email, planInfo } = req.body;
        
        // Préparer le contenu de l'email
        const mailOptions = {
            from: process.env.SMTP_FROM || '"Majorlle Pro" <no-reply@majorlle.pro>',
            to: email,
            subject: 'Bienvenue sur KELIOS PRO - Instructions pour activer votre compte',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #f1f5f9; border-radius: 20px; background: #ffffff;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h2 style="color: #2563eb; font-size: 24px; margin-bottom: 10px;">Bienvenue sur KELIOS PRO</h2>
                        <h3 style="color: #1e293b; font-size: 20px;">Instructions pour activer votre compte</h3>
                    </div>
                    
                    <div style="background: #f8fafc; padding: 20px; border-radius: 15px; margin: 20px 0;">
                        <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                            Cher utilisateur,
                        </p>
                        <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                            Merci infiniment d'avoir choisi nos services ! Nous sommes ravis de vous accueillir sur KELIOS PRO, votre solution dédiée pour optimiser votre gestion professionnelle au quotidien.
                        </p>
                        <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                            Pour activer immédiatement votre compte et commencer à profiter de toutes les fonctionnalités, veuillez procéder à un virement bancaire unique à l'ordre de :
                        </p>
                    </div>
                    
                    <div style="background: #dbeafe; padding: 25px; border-radius: 15px; margin: 20px 0; border-left: 4px solid #2563eb;">
                        <h4 style="color: #1e40af; font-size: 18px; margin-bottom: 15px; text-align: center;">COORDONNÉES BANCAIRES</h4>
                        <div style="background: white; padding: 20px; border-radius: 10px;">
                            <p style="color: #374151; font-size: 16px; margin: 8px 0;"><strong>Bénéficiaire:</strong> SOCIETE GROUP DIGITAL CONCEPT</p>
                            <p style="color: #374151; font-size: 16px; margin: 8px 0;"><strong>Banque:</strong> GROUPE BANQUE POPULAIRE</p>
                            <p style="color: #374151; font-size: 16px; margin: 8px 0;"><strong>RIB:</strong> 145 450 2121176276650007 12</p>
                            <p style="color: #374151; font-size: 16px; margin: 8px 0;"><strong>SWIFT:</strong> BCPOMAMC</p>
                        </div>
                    </div>
                    
                    <div style="background: #fef3c7; padding: 20px; border-radius: 15px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                        <h4 style="color: #92400e; font-size: 18px; margin-bottom: 10px;">ÉTAPES SUIVANTES</h4>
                        <p style="color: #78350f; font-size: 16px; line-height: 1.6;">
                            Après le virement, merci de nous transmettre par email votre ordre de virement accompagné de votre identifiant utilisateur. Nous procéderons alors à l'activation de votre compte sous 24 à 48 heures ouvrables.
                        </p>
                    </div>
                    
                    <div style="background: #f0f9ff; padding: 20px; border-radius: 15px; margin: 20px 0;">
                        <h4 style="color: #0c4a6e; font-size: 18px; margin-bottom: 10px;">BESOIN D'AIDE ?</h4>
                        <p style="color: #0c4a6e; font-size: 16px; line-height: 1.6;">
                            Si vous avez la moindre question, n'hésitez pas à nous contacter à <a href="mailto:compta@groupdigitalconcept.com" style="color: #2563eb;">compta@groupdigitalconcept.com</a> ou au <a href="tel:+212764181061" style="color: #2563eb;">+212 7 64 18 10 61</a>. Nous sommes là pour vous accompagner !
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                        <p style="color: #6b7280; font-size: 16px; margin-bottom: 10px;">
                            À très bientôt sur KELIOS PRO,
                        </p>
                        <p style="color: #374151; font-size: 16px; font-weight: bold;">
                            l'équipe Group Digital Concept
                        </p>
                        <p style="color: #6b7280; font-size: 14px; margin-top: 15px;">
                            Marrakesh, Maroc<br>
                            <a href="https://kelios-pro.com/" style="color: #2563eb;">https://kelios-pro.com/</a> | 
                            <a href="mailto:compta@groupdigitalconcept.com" style="color: #2563eb;">compta@groupdigitalconcept.com</a> | 
                            <a href="tel:+212764181061" style="color: #2563eb;">+212 7 64 18 10 61</a>
                        </p>
                    </div>
                </div>
            `
        };

        // Envoyer l'email
        await transporter.sendMail(mailOptions);
        
        res.json({ 
            success: true, 
            message: 'Instructions de virement envoyées par email avec succès' 
        });
    } catch (e) {
        console.error('Error sending bank transfer instructions:', e);
        res.status(500).json({ error: e.message });
    }
});

router.post('/subscription/pay', authenticateToken, async (req, res) => {
    try {
        const { plan, extraCompanies, companyOption } = req.body;
        
        // Mettre à jour le statut d'abonnement
        let planType = 'monthly_200';
        if (plan === 'yearly') {
            planType = 'yearly_2200';
        }
        
        // Calculer le coût total
        const baseCost = plan === 'yearly' ? 2200 : 200;
        const companyCost = (extraCompanies || 0) * (companyOption === 'yearly' ? 1600 : 150);
        const totalCost = baseCost + companyCost;
        
        // Calculer la date d'expiration
        const now = new Date();
        let expiresAt;
        if (plan === 'yearly') {
            // 1 an pour l'abonnement annuel
            expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
        } else {
            // 1 mois pour l'abonnement mensuel
            expiresAt = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
        }
        
        // Mettre à jour l'utilisateur avec les nouvelles informations
        await pool.query(
            'UPDATE users SET subscriptionStatus = "active", lastPaymentDate = NOW(), plan = ?, planInterval = ?, extraCompanies = ?, totalMonthlyCost = ?, expiresAt = ? WHERE id = ?',
            [planType, plan, extraCompanies || 0, totalCost, expiresAt, req.user.id]
        );
        
        res.json({ 
            success: true, 
            status: 'active',
            plan: planType,
            extraCompanies: extraCompanies || 0,
            totalCost,
            expiresAt
        });
    } catch (e) { 
        res.status(500).json({ error: e.message }); 
    }
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

// GDPR Export Data
router.get('/export', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
        const [companies] = await pool.query('SELECT * FROM companies WHERE userId = ?', [userId]);

        const companyIds = companies.map(c => c.id);
        const placeholders = companyIds.map(() => '?').join(',');

        let clients = [], articles = [], invoices = [];
        if (companyIds.length > 0) {
            [clients] = await pool.query(`SELECT * FROM clients WHERE companyId IN (${placeholders})`, companyIds);
            [articles] = await pool.query(`SELECT * FROM articles WHERE companyId IN (${placeholders})`, companyIds);
            [invoices] = await pool.query(`SELECT * FROM invoices WHERE companyId IN (${placeholders})`, companyIds);
        }

        const exportData = {
            user: users[0],
            companies,
            clients,
            articles,
            invoices
        };

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="gdpr_export_${userId}.zip"`);

        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.on('error', (err) => { throw err; });
        archive.pipe(res);

        archive.append(JSON.stringify(exportData, null, 2), { name: 'donnees_personnelles.json' });

        await archive.finalize();
    } catch (e) {
        if (!res.headersSent) res.status(500).json({ error: e.message });
    }
});

// Delete account (Self)
router.delete('/me', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const userId = req.user.id;

        const [companies] = await connection.query('SELECT id FROM companies WHERE userId = ?', [userId]);
        const companyIds = companies.map(c => c.id);

        if (companyIds.length > 0) {
            const placeholders = companyIds.map(() => '?').join(',');

            await connection.query(`DELETE FROM clients WHERE companyId IN(${placeholders})`, companyIds);
            await connection.query(`DELETE FROM articles WHERE companyId IN(${placeholders})`, companyIds);
            await connection.query(`DELETE FROM invoices WHERE companyId IN(${placeholders})`, companyIds);
            await connection.query(`DELETE FROM recurring_schedules WHERE companyId IN(${placeholders})`, companyIds);
            await connection.query(`DELETE FROM vat_rates WHERE companyId IN(${placeholders})`, companyIds);
            await connection.query(`DELETE FROM templates WHERE companyId IN(${placeholders})`, companyIds);
            await connection.query(`DELETE FROM reminder_settings WHERE companyId IN(${placeholders})`, companyIds);
        }

        await connection.query('DELETE FROM companies WHERE userId = ?', [userId]);
        await connection.query('DELETE FROM shortcuts WHERE userId = ?', [userId]);
        await connection.query('DELETE FROM password_resets WHERE userId = ?', [userId]);
        await connection.query('DELETE FROM notifications WHERE userId = ?', [userId]);
        await connection.query('DELETE FROM uploads WHERE userId = ?', [userId]);
        await connection.query('DELETE FROM audit_logs WHERE userId = ?', [userId]);

        // Delete user
        await connection.query('DELETE FROM users WHERE id = ?', [userId]);

        await connection.commit();
        res.json({ success: true, message: 'Compte supprimé avec cascade avec succès' });
    } catch (e) {
        await connection.rollback();
        res.status(500).json({ error: e.message });
    } finally {
        connection.release();
    }
});

router.delete('/users/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'SuperAdmin') return res.sendStatus(403);
    try {
        await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
