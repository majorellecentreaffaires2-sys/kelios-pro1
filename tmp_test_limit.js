/**
 * Live API test — creates a trial user token and tries to create 2 companies.
 * Expects: 1st succeeds, 2nd returns LIMIT_REACHED.
 */
import 'dotenv/config';
import pool from './server/config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PLANS } from './server/config/plans.js';

const JWT_SECRET = process.env.JWT_SECRET || 'majorlle-erp-default-dev-key-change-me';
const BASE = 'http://localhost:' + (process.env.PORT || 5000) + '/api';

async function main() {
    // 1. Create a temporary trial test user directly in DB
    const testId = 'test_' + Date.now();
    const hash = await bcrypt.hash('test1234', 10);
    await pool.query(
        'INSERT INTO users (id, username, email, password, role, subscriptionStatus, plan, isVerified) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [testId, 'test_limit_user', 'test_limit@test.com', hash, 'User', 'trial', 'monthly_200', 1]
    );

    // 2. Generate JWT for this user
    const token = jwt.sign({ id: testId, username: 'test_limit_user', role: 'User' }, JWT_SECRET, { expiresIn: '1h' });

    console.log('\n🧪 Testing with fresh trial user:', testId);
    console.log('   Token plan context: trial (status=trial overrides plan)\n');

    // 3. Try to create company #1 → should succeed
    const r1 = await fetch(`${BASE}/companies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: 'co1_' + Date.now(), name: 'Societe Test 1', currency: 'MAD' })
    });
    const j1 = await r1.json();
    console.log(`✅ Company #1 → HTTP ${r1.status}: ${r1.status === 200 ? 'CREATED ✓' : 'FAILED ✗ ' + JSON.stringify(j1)}`);

    // 4. Try to create company #2 → should return 403 LIMIT_REACHED
    const r2 = await fetch(`${BASE}/companies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: 'co2_' + Date.now(), name: 'Societe Test 2', currency: 'MAD' })
    });
    const j2 = await r2.json();
    console.log(`🚫 Company #2 → HTTP ${r2.status}: ${j2.error === 'LIMIT_REACHED' ? 'LIMIT_REACHED ✓ (blocked correctly!)' : 'NOT BLOCKED ✗ ' + JSON.stringify(j2)}`);
    if (j2.message) console.log('   Message:', j2.message);

    // Cleanup
    await pool.query('DELETE FROM companies WHERE userId = ?', [testId]);
    await pool.query('DELETE FROM users WHERE id = ?', [testId]);
    await pool.end();
    console.log('\n🧹 Cleaned up test data.');
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
