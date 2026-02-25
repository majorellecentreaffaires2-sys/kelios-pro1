import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateToken } from '../middleware/auth.js';
import pool from '../config/db.js';
import crypto from 'crypto';
import 'dotenv/config';

const router = express.Router();

const uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads');
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

router.post('/', authenticateToken, upload.single('file'), async (req, res) => {
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
        res.json({ success: true, url: fullUrl });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
