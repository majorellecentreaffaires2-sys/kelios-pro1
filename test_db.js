
import { execSync } from 'child_process';
import 'dotenv/config';

async function test() {
    console.log('Testing database connection via SSH tunnel...');

    try {
        // Test SSH connection first
        const sshTest = execSync('ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no devadmin@194.164.77.52 "echo SSH_OK"', { encoding: 'utf8' });
        if (!sshTest.includes('SSH_OK')) {
            throw new Error('SSH connection failed');
        }
        console.log('SSH connection: SUCCESS');

        // Test MySQL connection on remote server
        const mysqlTest = execSync(`ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no devadmin@194.164.77.52 "mysql -u root -p'MaRouane2121@' -e 'SELECT 1 as test'"`, { encoding: 'utf8' });
        if (mysqlTest.includes('1')) {
            console.log('MySQL connection: SUCCESS');
        } else {
            throw new Error('MySQL connection failed');
        }

        // Test database access
        const dbTest = execSync(`ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no devadmin@194.164.77.52 "mysql -u root -p'MaRouane2121@' majorlle_erp -e 'SHOW TABLES'"`, { encoding: 'utf8' });
        console.log('Database access: SUCCESS');
        // Test data access
        const userCount = execSync(`ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no devadmin@194.164.77.52 "mysql -u root -p'MaRouane2121@' majorlle_erp -e 'SELECT COUNT(*) as count FROM users'"`, { encoding: 'utf8' });
        const count = userCount.split('\n')[1].trim();
        console.log('Users in database:', count);

    } catch (error) {
        console.error('Database connectivity test: FAILED');
        console.error('Error:', error.message);
        process.exit(1);
    }
}

test();
