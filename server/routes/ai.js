import express from 'express';
import rateLimit from 'express-rate-limit';
import { GoogleGenAI, Type } from '@google/genai';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes IA. Réessayez dans une minute.' },
});

const modelId = () => process.env.GEMINI_MODEL || 'gemini-2.0-flash';

function getClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  return new GoogleGenAI({ apiKey: key });
}

function requireGemini(req, res, next) {
  if (!process.env.GEMINI_API_KEY?.trim()) {
    return res.status(503).json({
      error: 'Fonctionnalité IA non configurée (GEMINI_API_KEY).',
      code: 'AI_DISABLED',
    });
  }
  next();
}

router.post(
  '/enhance-description',
  authenticateToken,
  aiLimiter,
  requireGemini,
  async (req, res) => {
    const { text } = req.body || {};
    if (typeof text !== 'string') {
      return res.status(400).json({ error: 'Champ text requis' });
    }
    if (!text.trim()) {
      return res.json({ text });
    }

    try {
      const ai = getClient();
      const response = await ai.models.generateContent({
        model: modelId(),
        contents: `Transforme ce texte informel ou bref pour une facture en un texte de business professionnel, concis, poli et formel en FRANÇAIS : "${text}"`,
        config: { temperature: 0.7 },
      });
      const out = response.text?.trim() || text;
      res.json({ text: out });
    } catch (err) {
      console.error('Gemini enhance-description:', err.message);
      res.status(500).json({ error: 'Erreur du service IA' });
    }
  }
);

router.post(
  '/invoice-email',
  authenticateToken,
  aiLimiter,
  requireGemini,
  async (req, res) => {
    const invoice = req.body;
    if (!invoice || typeof invoice !== 'object') {
      return res.status(400).json({ error: 'Corps de requête invalide' });
    }

    const fallback = {
      subject:
        invoice.language === 'en'
          ? `Commercial Document ${invoice.invoiceNumber}`
          : `Document commercial ${invoice.invoiceNumber}`,
      body:
        invoice.language === 'en'
          ? 'Please find attached your document.'
          : 'Veuillez trouver ci-joint votre document.',
    };

    try {
      const prompt = `Génère un email professionnel d'accompagnement pour l'envoi d'un document commercial.
    Type : ${invoice.type}
    Numéro : ${invoice.invoiceNumber}
    Client : ${invoice.client?.name}
    Montant : ${invoice.totalTtc} ${invoice.currency}
    Date : ${invoice.date}
    Langue : ${invoice.language === 'en' ? 'Anglais' : 'Français'}
    
    Règles : Ton poli, professionnel, cordial. 
    Retourne uniquement un JSON avec "subject" et "body".
    Le corps doit contenir des sauts de ligne (\\n).`;

      const ai = getClient();
      const response = await ai.models.generateContent({
        model: modelId(),
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subject: { type: Type.STRING },
              body: { type: Type.STRING },
            },
          },
        },
      });
      const parsed = JSON.parse(response.text || '{}');
      if (!parsed.subject || !parsed.body) {
        return res.json(fallback);
      }
      res.json(parsed);
    } catch (err) {
      console.error('Gemini invoice-email:', err.message);
      res.json(fallback);
    }
  }
);

router.post(
  '/translate-invoice',
  authenticateToken,
  aiLimiter,
  requireGemini,
  async (req, res) => {
    const { items, notes, sender, client, targetLang } = req.body || {};
    if (!Array.isArray(items) || !sender || !client) {
      return res.status(400).json({ error: 'Données de traduction invalides' });
    }
    const lang = targetLang === 'en' ? 'en' : 'fr';

    try {
      const prompt = `Act as a master business translator for corporate documents. 
    Translate EVERYTHING provided in the following document into ${lang === 'en' ? 'English' : 'French'}. 
    
    CRITICAL RULES:
    1. Translate descriptions, categories, and custom notes.
    2. Convert professional units if applicable (e.g., "Mois" -> "Month").
    3. Ensure the tone remains formal business style.
    4. Keep numerical values, dates, and currency codes (MAD, EUR, USD) exactly as they are.
    5. Return ONLY a JSON object matching the requested schema.
    
    Data:
    - Sender: ${JSON.stringify({ name: sender.name, address: sender.address })}
    - Client: ${JSON.stringify({ name: client.name, address: client.address })}
    - Items: ${JSON.stringify(
      items.map((i) => ({
        title: i.title,
        subItems: (i.subItems || []).map((s) => ({
          description: s.description,
          unit: s.unit,
        })),
      }))
    )}
    - Notes: ${notes || ''}`;

      const ai = getClient();
      const response = await ai.models.generateContent({
        model: modelId(),
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              sender: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  address: { type: Type.STRING },
                },
              },
              client: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  address: { type: Type.STRING },
                },
              },
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    subItems: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          description: { type: Type.STRING },
                          unit: { type: Type.STRING },
                        },
                      },
                    },
                  },
                },
              },
              notes: { type: Type.STRING },
            },
          },
        },
      });

      const translated = JSON.parse(response.text || '{}');
      const newItems = items.map((origItem, idx) => ({
        ...origItem,
        title: translated.items?.[idx]?.title || origItem.title,
        subItems: (origItem.subItems || []).map((origSub, sIdx) => ({
          ...origSub,
          description:
            translated.items?.[idx]?.subItems?.[sIdx]?.description ||
            origSub.description,
          unit:
            translated.items?.[idx]?.subItems?.[sIdx]?.unit || origSub.unit,
        })),
      }));

      res.json({
        items: newItems,
        notes: translated.notes ?? notes,
        sender: {
          ...sender,
          name: translated.sender?.name || sender.name,
          address: translated.sender?.address || sender.address,
        },
        client: {
          ...client,
          name: translated.client?.name || client.name,
          address: translated.client?.address || client.address,
        },
      });
    } catch (err) {
      console.error('Gemini translate-invoice:', err.message);
      res.json({ items, notes, sender, client });
    }
  }
);

export default router;
