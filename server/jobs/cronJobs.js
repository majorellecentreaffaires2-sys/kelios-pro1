import cron from 'node-cron';
import pool from '../config/db.js';
import transporter from '../config/email.js';
import crypto from 'crypto';
import 'dotenv/config';
import { createNotification } from '../routes/notifications.js';

// ─── Helper: Log to audit_logs ───────────────────────────────────────
const logToAudit = async ({ companyId = null, userId = 'system', action, entity, details, severity = 'INFO' }) => {
    try {
        await pool.query(
            'INSERT INTO audit_logs (id, companyId, userId, timestamp, action, entity, details, severity) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [crypto.randomUUID(), companyId, userId, new Date(), action, entity, details, severity]
        );
    } catch (err) {
        console.error('❌ Failed to save audit log:', err.message);
    }
};

// ─── Helper: send email ──────────────────────────────────────────────
const sendEmail = async (to, subject, html) => {
    try {
        await transporter.sendMail({
            from: process.env.SMTP_FROM || '"Majorlle Pro" <noreply@majorlle.pro>',
            to,
            subject,
            html
        });
        return true;
    } catch (err) {
        console.error(`❌ [CRON] Failed to send email to ${to}:`, err.message);
        return false;
    }
};

// ─── JOB 1: Process recurring invoice schedules (daily at 07:00) ────
export const processRecurringSchedules = async () => {
    console.log('⏰ [CRON] Processing recurring schedules...');
    try {
        const today = new Date().toISOString().split('T')[0];
        const [schedules] = await pool.query(
            `SELECT rs.*, c.name as companyName 
       FROM recurring_schedules rs
       LEFT JOIN companies c ON rs.companyId = c.id
       WHERE rs.isActive = 1 AND rs.nextRunDate <= ?
       AND (rs.endDate IS NULL OR rs.endDate >= ?)`,
            [today, today]
        );

        let count = 0;
        for (const schedule of schedules) {
            try {
                const [templateInvoices] = await pool.query(
                    'SELECT * FROM invoices WHERE id = ?', [schedule.invoiceTemplateId]
                );
                if (templateInvoices.length === 0) continue;

                const template = templateInvoices[0];
                const newId = crypto.randomUUID();
                const newNumber = `REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

                const { id, invoiceNumber, date, status, payments, auditTrail, convertedFromId, ...rest } = template;

                await pool.query('INSERT INTO invoices SET ?', {
                    ...rest,
                    id: newId,
                    invoiceNumber: newNumber,
                    date: today,
                    status: 'En cours',
                    payments: '[]',
                    auditTrail: JSON.stringify([{ action: 'CREATED_RECURRING', date: today }]),
                    convertedFromId: template.id
                });

                const nextRun = new Date(schedule.nextRunDate);
                switch (schedule.frequency) {
                    case 'weekly': nextRun.setDate(nextRun.getDate() + 7); break;
                    case 'monthly': nextRun.setMonth(nextRun.getMonth() + 1); break;
                    case 'quarterly': nextRun.setMonth(nextRun.getMonth() + 3); break;
                    case 'yearly': nextRun.setFullYear(nextRun.getFullYear() + 1); break;
                    default: nextRun.setMonth(nextRun.getMonth() + 1);
                }

                await pool.query(
                    'UPDATE recurring_schedules SET nextRunDate = ?, lastRunDate = ? WHERE id = ?',
                    [nextRun.toISOString().split('T')[0], today, schedule.id]
                );

                count++;
                await logToAudit({
                    companyId: schedule.companyId,
                    action: 'AUTOMATION_EXECUTED',
                    entity: 'INVOICE',
                    details: `Facture récurrente générée : ${newNumber}`
                });
            } catch (err) {
                console.error(`❌ [CRON] Failed schedule ${schedule.id}:`, err.message);
            }
        }
        console.log(`✅ [CRON] Recurring process finished: ${count} invoices created`);
    } catch (e) {
        console.error('❌ [CRON] processRecurringSchedules error:', e.message);
    }
};

// ─── JOB 2: Send overdue invoice reminders (daily at 09:00) ─────────
export const processReminders = async () => {
    console.log('⏰ [CRON] Processing invoice reminders...');
    try {
        const [settings] = await pool.query(
            'SELECT * FROM reminder_settings WHERE enableAutoReminder = 1'
        );

        let count = 0;
        for (const setting of settings) {
            let reminderDays = [];
            try {
                reminderDays = typeof setting.reminderDays === 'string' ? JSON.parse(setting.reminderDays) : setting.reminderDays;
                if (!Array.isArray(reminderDays)) reminderDays = [7, 14, 30];
            } catch (e) {
                reminderDays = [7, 14, 30];
            }

            const today = new Date();
            for (const days of reminderDays) {
                const targetDate = new Date(today);
                targetDate.setDate(today.getDate() - days);
                const targetStr = targetDate.toISOString().split('T')[0];

                const [invoices] = await pool.query(
                    `SELECT i.*, cl.email as clientEmail, cl.name as clientName 
           FROM invoices i
           LEFT JOIN clients cl ON JSON_UNQUOTE(JSON_EXTRACT(i.client, '$.id')) = cl.id
           WHERE i.companyId = ? AND i.dueDate = ? 
           AND i.status NOT IN ('Payée', 'Annulée', 'Brouillon')`,
                    [setting.companyId, targetStr]
                );

                for (const invoice of invoices) {
                    let clientEmail = invoice.clientEmail;
                    if (!clientEmail) {
                        try {
                            const clientData = typeof invoice.client === 'string' ? JSON.parse(invoice.client) : invoice.client;
                            clientEmail = clientData.email;
                        } catch (e) { }
                    }
                    if (!clientEmail) continue;

                    try {
                        const subject = setting.reminderEmailSubject || `Rappel de paiement — ${invoice.invoiceNumber}`;
                        const body = setting.reminderEmailBody
                            ? setting.reminderEmailBody.replace(/{{invoiceNumber}}/g, invoice.invoiceNumber).replace(/{{clientName}}/g, invoice.clientName || 'Client')
                            : `<p>Rappel : La facture <strong>${invoice.invoiceNumber}</strong> est en attente de règlement depuis ${days} jours.</p>`;

                        const sent = await sendEmail(clientEmail, subject, body);
                        if (sent) {
                            count++;
                            let relanceHistory = [];
                            try {
                                relanceHistory = typeof invoice.relanceHistory === 'string' ? JSON.parse(invoice.relanceHistory || '[]') : invoice.relanceHistory || [];
                            } catch (e) { }
                            relanceHistory.push({ action: 'AUTO_REMINDER_SENT', date: today.toISOString(), days });
                            await pool.query('UPDATE invoices SET relanceHistory = ? WHERE id = ?', [JSON.stringify(relanceHistory), invoice.id]);

                            await logToAudit({
                                companyId: setting.companyId,
                                action: 'AUTOMATION_EXECUTED',
                                entity: 'REMINDER',
                            });

                            // Add in-app notification for the user
                            const [companyOwner] = await pool.query('SELECT userId FROM companies WHERE id = ?', [invoice.companyId]);
                            if (companyOwner.length > 0) {
                                await createNotification(
                                    companyOwner[0].userId,
                                    'invoice_overdue',
                                    'Facture en retard',
                                    `Un rappel automatique a été envoyé pour la facture ${invoice.invoiceNumber} (${days}j).`,
                                    `/ventes?id=${invoice.id}`
                                );
                            }
                        }
                    } catch (err) {
                        console.error(`❌ [CRON] Failed to send reminder to ${clientEmail}:`, err.message);
                    }
                }
            }
        }
        console.log(`✅ [CRON] Reminders process finished: ${count} emails sent`);
    } catch (e) {
        console.error('❌ [CRON] processReminders error:', e.message);
    }
};

// ─── JOB 3: Trial expiry warnings (daily at 08:00) ──────────────────
export const processTrialWarnings = async () => {
    console.log('⏰ [CRON] Checking trial expirations...');
    try {
        const warningDays = [3, 1];
        const today = new Date();

        for (const days of warningDays) {
            const targetDate = new Date(today);
            targetDate.setDate(today.getDate() + days);
            const targetStr = targetDate.toISOString().split('T')[0];

            const [users] = await pool.query(
                `SELECT id, username, email FROM users 
         WHERE subscriptionStatus = 'trial' AND DATE(trialEndsAt) = ?`,
                [targetStr]
            );

            for (const user of users) {
                const sent = await sendEmail(
                    user.email,
                    `⏰ Votre essai Majorlle Pro expire dans ${days} jour${days > 1 ? 's' : ''}`,
                    `<div style="font-family:sans-serif; max-width:600px; margin:0 auto; padding:30px; border: 1px solid #e2e8f0; border-radius: 16px;">
            <h2 style="color:#f59e0b;">⚠️ Votre période d'essai se termine bientôt</h2>
            <p>Bonjour <strong>${user.username}</strong>,</p>
            <p>Votre accès gratuit à <strong>Majorlle Pro</strong> expire dans <strong>${days} jour${days > 1 ? 's' : ''}</strong>.</p>
            <div style="margin: 30px 0;">
              <a href="${process.env.APP_URL || 'https://majorlle.pro'}/checkout" style="display:inline-block; background:#2563eb; color:white; padding:14px 28px; border-radius:12px; text-decoration:none; font-weight:bold;">
                Activer mon abonnement
              </a>
            </div>
            <p style="color:#94a3b8; font-size:13px; margin-top:20px;">Sans activation, vos données seront conservées mais l'accès sera suspendu.</p>
          </div>`
                );
                if (sent) {
                    await logToAudit({
                        userId: user.id,
                        action: 'TRIAL_WARNING',
                        entity: 'USER',
                    });

                    // Add in-app notification
                    await createNotification(
                        user.id,
                        'trial_expiry',
                        'Essai bientôt terminé',
                        `Votre période d'essai Majorlle Pro expire dans ${days} jour${days > 1 ? 's' : ''}. Pensez à activer votre abonnement !`,
                        '/checkout'
                    );
                }
            }
        }

        const [result] = await pool.query(
            `UPDATE users SET subscriptionStatus = 'locked' 
       WHERE (subscriptionStatus = 'trial' AND trialEndsAt < NOW())
          OR (subscriptionStatus = 'active' AND expiresAt < NOW())`
        );
        if (result.affectedRows > 0) {
            console.log(`🔒 [CRON] Locked ${result.affectedRows} expired accounts (trials + subscriptions)`);
        }
    } catch (e) {
        console.error('❌ [CRON] processTrialWarnings error:', e.message);
    }
};

// ─── JOB 4: Monthly Reports (daily at 00:30, checks day of month) ───
export const processMonthlyReports = async () => {
    console.log('⏰ [CRON] Checking for monthly reports...');
    try {
        const today = new Date();
        const dayOfMonth = today.getDate();

        const [settings] = await pool.query(
            'SELECT * FROM reminder_settings WHERE enableMonthlyReport = 1 AND monthlyReportDay = ?',
            [dayOfMonth]
        );

        for (const setting of settings) {
            if (!setting.monthlyReportEmail) continue;

            // Simple report stats for last 30 days
            const lastMonth = new Date();
            lastMonth.setDate(lastMonth.getDate() - 30);
            const lastMonthStr = lastMonth.toISOString().split('T')[0];

            const [stats] = await pool.query(
                `SELECT COUNT(*) as count, SUM(discount) as totalDiscount 
         FROM invoices WHERE companyId = ? AND date >= ?`,
                [setting.companyId, lastMonthStr]
            );

            const sent = await sendEmail(
                setting.monthlyReportEmail,
                `📊 Votre Rapport Mensuel Majorlle Pro — ${today.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}`,
                `<div style="font-family:sans-serif; max-width:600px; margin:0 auto; padding:30px; border: 1px solid #e2e8f0; border-radius: 16px;">
          <h2 style="color:#059669;">📊 Rapport Mensuel</h2>
          <p>Voici le résumé de votre activité pour les 30 derniers jours :</p>
          <div style="background:#f0fdf4; padding:20px; border-radius:12px; margin:20px 0;">
            <p><strong>Factures générées :</strong> ${stats[0].count || 0}</p>
            <p><strong>Activités d'automatisation :</strong> Active ✅</p>
          </div>
          <p>Consultez votre tableau de bord complet pour plus de détails.</p>
          <a href="${process.env.APP_URL || 'https://majorlle.pro'}/dashboard" style="display:inline-block; background:#059669; color:white; padding:14px 28px; border-radius:12px; text-decoration:none; font-weight:bold;">Voir mon Dashboard</a>
        </div>`
            );

            if (sent) {
                await logToAudit({
                    companyId: setting.companyId,
                    action: 'AUTOMATION_EXECUTED',
                    entity: 'REPORT',
                    details: `Rapport mensuel envoyé à ${setting.monthlyReportEmail}`
                });
            }
        }
    } catch (e) {
        console.error('❌ [CRON] processMonthlyReports error:', e.message);
    }
};

// ─── JOB 5: Cleanup (weekly) ─────────────────────────────────────────
export const cleanupOldTokens = async () => {
    try {
        const [result] = await pool.query('DELETE FROM password_resets WHERE expiresAt < NOW() OR usedAt IS NOT NULL');
        console.log(`🧹 [CRON] Cleared ${result.affectedRows} old password reset tokens`);
    } catch (e) {
        console.error('❌ [CRON] cleanupOldTokens error:', e.message);
    }
};

// ─── Register all cron jobs ───────────────────────────────────────────
export const initCronJobs = () => {
    cron.schedule('30 0 * * *', processMonthlyReports, { timezone: 'Africa/Casablanca' });
    cron.schedule('0 7 * * *', processRecurringSchedules, { timezone: 'Africa/Casablanca' });
    cron.schedule('0 8 * * *', processTrialWarnings, { timezone: 'Africa/Casablanca' });
    cron.schedule('0 9 * * *', processReminders, { timezone: 'Africa/Casablanca' });
    cron.schedule('0 2 * * 0', cleanupOldTokens, { timezone: 'Africa/Casablanca' });

    console.log('✅ Cron jobs initialized');
};
