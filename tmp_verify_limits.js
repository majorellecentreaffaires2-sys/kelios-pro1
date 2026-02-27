import 'dotenv/config';
import pool from './server/config/db.js';
import { PLANS } from './server/config/plans.js';

const [users] = await pool.query("SELECT id, username, subscriptionStatus, plan, role FROM users WHERE role != 'SuperAdmin'");
for (const u of users) {
    const s = (u.subscriptionStatus || 'trial').toLowerCase().trim();
    const pk = s === 'active' ? (u.plan || 'trial') : 'trial';
    const max = PLANS[pk]?.maxCompanies ?? 1;
    const [[{ count }]] = await pool.query('SELECT COUNT(*) AS count FROM companies WHERE userId = ?', [u.id]);
    const blocked = count >= max;
    process.stdout.write(`[${u.username}] status=${s} planKey=${pk} max=${max} owned=${count} BLOCKED=${blocked}\n`);
}
await pool.end();
process.exit(0);
