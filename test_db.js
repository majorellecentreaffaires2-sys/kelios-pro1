
import mysql from 'mysql2/promise';
import 'dotenv/config';

async function test() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'majorlle_erp',
    });

    try {
        const [rows] = await pool.query('SELECT username, role, subscriptionStatus FROM users');
        console.log('USERS IN DB:', rows);
    } catch (e) {
        console.error('DB ERROR:', e);
    } finally {
        await pool.end();
    }
}

test();
