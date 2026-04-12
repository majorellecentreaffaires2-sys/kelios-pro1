const getAuthToken = () => localStorage.getItem('mj_token');

async function aiPost<T>(path: string, body: unknown): Promise<T> {
  const token = getAuthToken();
  const res = await fetch(`/api/ai${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (res.status === 401) {
    localStorage.removeItem('mj_token');
    window.location.reload();
    throw new Error('Non autorisé');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Erreur IA : ${res.status}`);
  }

  return res.json();
}

export const enhanceInvoiceDescription = async (text: string): Promise<string> => {
  if (!text) return text;
  try {
    const data = await aiPost<{ text: string }>('/enhance-description', { text });
    return data.text?.trim() || text;
  } catch (error) {
    console.error('Gemini Error:', error);
    return text;
  }
};

export const generateInvoiceEmail = async (
  invoice: any
): Promise<{ subject: string; body: string }> => {
  try {
    return await aiPost<{ subject: string; body: string }>('/invoice-email', invoice);
  } catch {
    return {
      subject:
        invoice.language === 'en'
          ? `Commercial Document ${invoice.invoiceNumber}`
          : `Document commercial ${invoice.invoiceNumber}`,
      body:
        invoice.language === 'en'
          ? 'Please find attached your document.'
          : 'Veuillez trouver ci-joint votre document.',
    };
  }
};

export const translateInvoiceData = async (
  items: any[],
  notes: string,
  sender: any,
  client: any,
  targetLang: 'fr' | 'en'
): Promise<{ items: any[]; notes: string; sender: any; client: any }> => {
  try {
    return await aiPost<{
      items: any[];
      notes: string;
      sender: any;
      client: any;
    }>('/translate-invoice', { items, notes, sender, client, targetLang });
  } catch (error) {
    console.error('Translation Error:', error);
    return { items, notes, sender, client };
  }
};
