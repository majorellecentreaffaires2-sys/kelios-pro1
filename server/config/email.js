import nodemailer from 'nodemailer';
import 'dotenv/config';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.example.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
    },
});

transporter.verify((error) => {
    if (error) {
        console.warn('⚠️ Config Email non valide:', error.message);
    } else {
        console.log('✅ Serveur Email prêt');
    }
});

export default transporter;
