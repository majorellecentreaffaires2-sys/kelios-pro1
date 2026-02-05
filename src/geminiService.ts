
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const enhanceInvoiceDescription = async (text: string): Promise<string> => {
  if (!text) return text;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Transforme ce texte informel ou bref pour une facture en un texte de business professionnel, concis, poli et formel en FRANÇAIS : "${text}"`,
      config: {
        temperature: 0.7,
      }
    });
    return response.text?.trim() || text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return text;
  }
};

export const generateInvoiceEmail = async (invoice: any): Promise<{subject: string, body: string}> => {
  try {
    const prompt = `Génère un email professionnel d'accompagnement pour l'envoi d'un document commercial.
    Type : ${invoice.type}
    Numéro : ${invoice.invoiceNumber}
    Client : ${invoice.client.name}
    Montant : ${invoice.totalTtc} ${invoice.currency}
    Date : ${invoice.date}
    Langue : ${invoice.language === 'en' ? 'Anglais' : 'Français'}
    
    Règles : Ton poli, professionnel, cordial. 
    Retourne uniquement un JSON avec "subject" et "body".
    Le corps doit contenir des sauts de ligne (\\n).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING },
            body: { type: Type.STRING }
          }
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (e) {
    return { 
      subject: invoice.language === 'en' ? `Commercial Document ${invoice.invoiceNumber}` : `Document commercial ${invoice.invoiceNumber}`, 
      body: invoice.language === 'en' ? "Please find attached your document." : "Veuillez trouver ci-joint votre document." 
    };
  }
};

export const translateInvoiceData = async (
  items: any[], 
  notes: string, 
  sender: any, 
  client: any, 
  targetLang: 'fr' | 'en'
): Promise<{items: any[], notes: string, sender: any, client: any}> => {
  try {
    const prompt = `Act as a master business translator for corporate documents. 
    Translate EVERYTHING provided in the following document into ${targetLang === 'en' ? 'English' : 'French'}. 
    
    CRITICAL RULES:
    1. Translate descriptions, categories, and custom notes.
    2. Convert professional units if applicable (e.g., "Mois" -> "Month").
    3. Ensure the tone remains formal business style.
    4. Keep numerical values, dates, and currency codes (MAD, EUR, USD) exactly as they are.
    5. Return ONLY a JSON object matching the requested schema.
    
    Data:
    - Sender: ${JSON.stringify({ name: sender.name, address: sender.address })}
    - Client: ${JSON.stringify({ name: client.name, address: client.address })}
    - Items: ${JSON.stringify(items.map(i => ({ title: i.title, subItems: i.subItems.map((s: any) => ({ description: s.description, unit: s.unit })) })))}
    - Notes: ${notes}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sender: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                address: { type: Type.STRING }
              }
            },
            client: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                address: { type: Type.STRING }
              }
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
                        unit: { type: Type.STRING }
                      }
                    }
                  }
                }
              }
            },
            notes: { type: Type.STRING }
          }
        }
      }
    });

    const translated = JSON.parse(response.text || '{}');
    const newItems = items.map((origItem, idx) => ({
      ...origItem,
      title: translated.items?.[idx]?.title || origItem.title,
      subItems: origItem.subItems.map((origSub: any, sIdx: number) => ({
        ...origSub,
        description: translated.items?.[idx]?.subItems?.[sIdx]?.description || origSub.description,
        unit: translated.items?.[idx]?.subItems?.[sIdx]?.unit || origSub.unit
      }))
    }));

    return { 
      items: newItems, 
      notes: translated.notes || notes,
      sender: { ...sender, name: translated.sender?.name || sender.name, address: translated.sender?.address || sender.address },
      client: { ...client, name: translated.client?.name || client.name, address: translated.client?.address || client.address }
    };
  } catch (error) {
    console.error("Translation Error:", error);
    return { items, notes, sender, client };
  }
};
