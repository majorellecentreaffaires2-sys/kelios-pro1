import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authenticateToken } from '../middleware/auth.js';
import pool from '../config/db.js';
import crypto from 'crypto';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

const defaultUploadDir = path.join(__dirname, '..', 'uploads');
const uploadDir = process.env.UPLOAD_DIR ? path.resolve(process.env.UPLOAD_DIR) : defaultUploadDir;
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const name = `${Date.now()}-${Math.random().toString(36).substr(2, 6)}${ext}`;
        cb(null, name);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB || '5')) * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif'];
        if (allowed.includes(file.mimetype)) cb(null, true);
        else cb(new Error('Type de fichier non autorisé. Utilisez JPG, PNG, WEBP ou SVG.'));
    }
});

router.post('/', authenticateToken, (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ error: `Erreur Multer: ${err.message}` });
        } else if (err) {
            return res.status(400).json({ error: err.message });
        }
        next();
    });
}, async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu' });
    try {
        const url = `/uploads/${req.file.filename}`;

        // Log upload to DB
        const id = crypto.randomBytes(16).toString('hex');
        await pool.query(
            'INSERT INTO uploads (id, userId, companyId, filename, originalName, mimeType, size, path) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [id, req.user.id, req.body.companyId || null, req.file.filename, req.file.originalname, req.file.mimetype, req.file.size, url]
        ).catch(err => console.error('[Upload] DB Log failed:', err.message));

        const fullUrl = process.env.APP_URL ? `${process.env.APP_URL}${url}` : url;
        // Return both relative and full URL, favoring relative for 'url' to fix previews
        res.json({ success: true, url: url, absoluteUrl: fullUrl });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
