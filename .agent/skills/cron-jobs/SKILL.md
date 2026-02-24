---
name: cron-jobs
description: Set up automated recurring invoice generation, overdue reminders, and trial expiry warning emails using node-cron.
---

# Skill: Cron Jobs / Automation Engine

## Overview
The `recurring_schedules` and `reminder_settings` tables exist and are managed via the Automation Center UI, but **nothing actually processes them**. This skill wires up a background job runner.

## Prerequisites
```bash
npm install node-cron
```

## Step 1 — Create `server/jobs/cronJobs.js`

```js
import cron from 'node-cron';
import pool from '../config/db.js';
import transporter from '../config/email.js';
import 'dotenv/config';

// ─── Helper: send email ──────────────────────────────────────────────
const sendEmail = async (to, subject, html) => {
  await transporter.sendMail({
    from: process.env.SMTP_FROM || '"Majorlle Pro" <noreply@majorlle.pro>',
    to, subject, html
  });
};

// ─── JOB 1: Process recurring invoice schedules (daily at 07:00) ────
const processRecurringSchedules = async () => {
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

    for (const schedule of schedules) {
      try {
        // Get the template invoice
        const [templateInvoices] = await pool.query(
          'SELECT * FROM invoices WHERE id = ?', [schedule.invoiceTemplateId]
        );
        if (templateInvoices.length === 0) continue;

        const template = templateInvoices[0];
        const newId = Math.random().toString(36).substr(2, 9);
        const newNumber = `REC-${Date.now()}`;

        // Create new invoice from template
        await pool.query('INSERT INTO invoices SET ?', {
          ...template,
          id: newId,
          invoiceNumber: newNumber,
          date: today,
          status: 'En cours',
          payments: '[]',
          auditTrail: JSON.stringify([{ action: 'CREATED_RECURRING', date: today }]),
          convertedFromId: template.id
        });

        // Calculate next run date
        const nextRun = new Date(schedule.nextRunDate);
        switch (schedule.frequency) {
          case 'weekly': nextRun.setDate(nextRun.getDate() + 7); break;
          case 'monthly': nextRun.setMonth(nextRun.getMonth() + 1); break;
          case 'quarterly': nextRun.setMonth(nextRun.getMonth() + 3); break;
          case 'yearly': nextRun.setFullYear(nextRun.getFullYear() + 1); break;
        }

        await pool.query(
          'UPDATE recurring_schedules SET nextRunDate = ?, lastRunDate = ? WHERE id = ?',
          [nextRun.toISOString().split('T')[0], today, schedule.id]
        );

        console.log(`✅ [CRON] Recurring invoice created: ${newNumber} for company ${schedule.companyId}`);
      } catch (err) {
        console.error(`❌ [CRON] Failed schedule ${schedule.id}:`, err.message);
      }
    }
  } catch (e) {
    console.error('❌ [CRON] processRecurringSchedules error:', e.message);
  }
};

// ─── JOB 2: Send overdue invoice reminders (daily at 09:00) ─────────
const processReminders = async () => {
  console.log('⏰ [CRON] Processing invoice reminders...');
  try {
    const [settings] = await pool.query(
      'SELECT * FROM reminder_settings WHERE enableAutoReminder = 1'
    );

    for (const setting of settings) {
      const reminderDays = JSON.parse(setting.reminderDays || '[7, 14, 30]');
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
          if (!invoice.clientEmail) continue;
          try {
            await sendEmail(
              invoice.clientEmail,
              setting.reminderEmailSubject || `Rappel de paiement — ${invoice.invoiceNumber}`,
              setting.reminderEmailBody?.replace('{{invoiceNumber}}', invoice.invoiceNumber) ||
              `<p>Rappel: La facture <strong>${invoice.invoiceNumber}</strong> est en attente de règlement depuis ${days} jours.</p>`
            );
            console.log(`📧 [CRON] Reminder sent to ${invoice.clientEmail} for invoice ${invoice.invoiceNumber}`);
          } catch (err) {
            console.error(`❌ [CRON] Failed to send reminder to ${invoice.clientEmail}:`, err.message);
          }
        }
      }
    }
  } catch (e) {
    console.error('❌ [CRON] processReminders error:', e.message);
  }
};

// ─── JOB 3: Trial expiry warnings (daily at 08:00) ──────────────────
const processTrialWarnings = async () => {
  console.log('⏰ [CRON] Checking trial expirations...');
  try {
    const warningDays = [3, 1]; // Send warning at D-3 and D-1
    const today = new Date();

    for (const days of warningDays) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + days);
      const targetStr = targetDate.toISOString().split('T')[0];

      const [users] = await pool.query(
        `SELECT id, username, email, trialEndsAt FROM users 
         WHERE subscriptionStatus = 'trial' AND DATE(trialEndsAt) = ?`,
        [targetStr]
      );

      for (const user of users) {
        try {
          await sendEmail(
            user.email,
            `⏰ Votre essai Majorlle Pro expire dans ${days} jour${days > 1 ? 's' : ''}`,
            `
            <div style="font-family:sans-serif; max-width:600px; margin:0 auto; padding:30px;">
              <h2 style="color:#f59e0b;">⚠️ Votre période d'essai se termine bientôt</h2>
              <p>Bonjour <strong>${user.username}</strong>,</p>
              <p>Votre accès gratuit à <strong>Majorlle Pro</strong> expire dans <strong>${days} jour${days > 1 ? 's' : ''}</strong>.</p>
              <a href="${process.env.APP_URL}/checkout" style="display:inline-block; background:#2563eb; color:white; padding:14px 28px; border-radius:12px; text-decoration:none; font-weight:bold;">
                Activer mon abonnement
              </a>
              <p style="color:#94a3b8; font-size:13px; margin-top:20px;">
                Sans activation, vos données seront conservées mais l'accès sera suspendu.
              </p>
            </div>
            `
          );
          console.log(`📧 [CRON] Trial warning sent to ${user.email} (${days} days left)`);
        } catch (err) {
          console.error(`❌ [CRON] Failed trial warning to ${user.email}:`, err.message);
        }
      }
    }

    // Lock expired trials
    await pool.query(
      `UPDATE users SET subscriptionStatus = 'locked' 
       WHERE subscriptionStatus = 'trial' AND trialEndsAt < NOW()`
    );
  } catch (e) {
    console.error('❌ [CRON] processTrialWarnings error:', e.message);
  }
};

// ─── JOB 4: Cleanup — delete old password reset tokens (weekly) ──────
const cleanupOldTokens = async () => {
  try {
    await pool.query('DELETE FROM password_resets WHERE expiresAt < NOW() OR usedAt IS NOT NULL');
    console.log('🧹 [CRON] Old password reset tokens cleaned up');
  } catch (e) {
    console.error('❌ [CRON] cleanupOldTokens error:', e.message);
  }
};

// ─── Register all cron jobs ───────────────────────────────────────────
export const initCronJobs = () => {
  // Every day at 07:00
  cron.schedule('0 7 * * *', processRecurringSchedules, { timezone: 'Africa/Casablanca' });
  // Every day at 08:00
  cron.schedule('0 8 * * *', processTrialWarnings, { timezone: 'Africa/Casablanca' });
  // Every day at 09:00
  cron.schedule('0 9 * * *', processReminders, { timezone: 'Africa/Casablanca' });
  // Every Sunday at 02:00
  cron.schedule('0 2 * * 0', cleanupOldTokens, { timezone: 'Africa/Casablanca' });

  console.log('✅ Cron jobs initialized (recurring, reminders, trial warnings, cleanup)');
};
```

## Step 2 — Wire into `server.js`

```js
import { initCronJobs } from './server/jobs/cronJobs.js';

// After initDb():
initDb().then(() => {
  initCronJobs();
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
```

## Step 3 — Create the jobs directory

```bash
mkdir server/jobs
```

## Testing Jobs Manually

To test a job without waiting for the cron schedule, add a temporary debug route:
```js
// In server.js (REMOVE BEFORE PRODUCTION)
app.get('/api/debug/run-cron', async (req, res) => {
  const { processRecurringSchedules } = await import('./server/jobs/cronJobs.js');
  await processRecurringSchedules();
  res.json({ done: true });
});
```

## Notes
- Timezone set to `Africa/Casablanca` (Morocco) — change as needed
- node-cron runs in the same process as Express — for high-load production, consider a separate worker process or BullMQ queue
- For very large scale, use **BullMQ** + Redis for job queuing
