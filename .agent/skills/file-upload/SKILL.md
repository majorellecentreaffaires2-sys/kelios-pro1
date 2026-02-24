---
name: file-upload
description: Add logo and file upload functionality to companies using multer. Stores files locally with a public URL endpoint.
---

# Skill: File / Logo Upload

## Overview
Companies have a `logoUrl` field but there is no upload mechanism. Users must paste a URL. This skill adds a `POST /api/upload` endpoint using `multer` and updates the Coordonnees/CompanyManager to use a file picker.

## Prerequisites
```bash
npm install multer
```
Add to `.env`:
```
UPLOAD_DIR=./uploads
APP_URL=http://localhost:5000
```

## Step 1 — Create `server/routes/upload.js`

```js
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateToken } from '../middleware/auth.js';
import pool from '../config/db.js';
import 'dotenv/config';

const router = express.Router();

const uploadDir = process.env.UPLOAD_DIR || './uploads';
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
    const url = `${process.env.APP_URL || 'http://localhost:5000'}/uploads/${req.file.filename}`;
    // Optionally log upload to DB
    const id = Math.random().toString(36).substr(2, 9);
    await pool.query(
      'INSERT INTO uploads (id, userId, companyId, filename, originalName, mimeType, size, path) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, req.user.id, req.body.companyId || null, req.file.filename, req.file.originalname, req.file.mimetype, req.file.size, url]
    ).catch(() => {}); // Non-blocking — uploads table is optional
    res.json({ success: true, url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
```

## Step 2 — Update `server.js`

```js
import uploadRoutes from './server/routes/upload.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Serve uploaded files as static
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Register route
app.use('/api/upload', uploadRoutes);
```

## Step 3 — Add to `src/apiClient.ts`

```ts
uploadFile: async (file: File, companyId?: string): Promise<{ url: string }> => {
  const token = getAuthToken();
  const formData = new FormData();
  formData.append('file', file);
  if (companyId) formData.append('companyId', companyId);

  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Upload échoué');
  }
  return res.json();
},
```

## Step 4 — Add Logo Upload UI to `Coordonnees.tsx`

In the logo section of `Coordonnees.tsx`, replace the URL input with a file picker:

```tsx
const [uploading, setUploading] = useState(false);

const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  setUploading(true);
  try {
    const { url } = await api.uploadFile(file, company.id);
    onUpdateCompany(company.id, { logoUrl: url });
  } catch (err) {
    alert(err instanceof Error ? err.message : 'Erreur upload');
  } finally {
    setUploading(false);
  }
};

// In JSX:
<div className="flex items-center gap-4">
  {company.logoUrl && <img src={company.logoUrl} className="w-16 h-16 object-contain rounded-xl border" alt="Logo" />}
  <label className="cursor-pointer px-6 py-3 bg-blue-50 text-blue-600 font-bold text-sm rounded-2xl border border-blue-100 hover:bg-blue-100 transition-all">
    {uploading ? 'Envoi...' : '📎 Choisir un logo'}
    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
  </label>
  {company.logoUrl && (
    <button onClick={() => onUpdateCompany(company.id, { logoUrl: '' })} className="text-red-400 text-sm font-bold hover:text-red-600">
      Supprimer
    </button>
  )}
</div>
```

## Step 5 — DB Table (optional but recommended)

```sql
CREATE TABLE IF NOT EXISTS uploads (
  id VARCHAR(36) PRIMARY KEY,
  userId VARCHAR(36) NOT NULL,
  companyId VARCHAR(36) NULL,
  filename VARCHAR(255) NOT NULL,
  originalName VARCHAR(255) NOT NULL,
  mimeType VARCHAR(100),
  size INT,
  path VARCHAR(500) NOT NULL,
  createdAt DATETIME DEFAULT NOW()
);
```

## Production Notes
- For production, use **Cloudinary** or **AWS S3** instead of local disk storage
- Cloudinary: `npm install cloudinary` — upload with `cloudinary.uploader.upload()`
- Set `CLOUDINARY_URL=cloudinary://...` in `.env`
- Local disk uploads are lost when the server restarts/redeploys on platforms like Railway/Heroku
