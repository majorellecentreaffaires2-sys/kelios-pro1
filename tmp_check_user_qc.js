
import mysql from 'mysql2/promise';
import 'dotenv/config';
async function test() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'majorlle_erp'
    });
    const [rows] = await pool.query('SELECT id, username, subscriptionStatus, plan, role FROM users WHERE id = "qc3fhhczs"');
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
}
test();
