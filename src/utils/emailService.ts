import { api } from '../apiClient';
import { generateInvoiceEmail } from '../geminiService';
import { generatePdfBase64 } from './pdf';
import { Invoice } from '../types';

export const sendInvoiceEmailWithPdf = async (invoice: Invoice, element: HTMLElement) => {
  try {
    // 1. Calculate totals for AI
    let totalHt = 0;
    let totalTva = 0;
    invoice.items.forEach(item => {
      item.subItems.forEach(sub => {
        const lineHt = sub.price * sub.quantity * (1 - (sub.discount || 0) / 100);
        totalHt += lineHt;
        totalTva += lineHt * (sub.taxRate / 100);
      });
    });
    const totalTtc = totalHt + totalTva - (invoice.discount || 0);

    // 2. Generate PDF
    const pdfBase64 = await generatePdfBase64(element, invoice.primaryColor);

    // 3. Generate Email Content (AI)
    const ai = await generateInvoiceEmail({ ...invoice, totalTtc });

    // 4. Send
    await api.sendInvoiceByEmail(invoice.id, {
      recipientEmail: invoice.client.email,
      subject: ai.subject,
      body: ai.body,
      invoiceData: { ...invoice, totalTtc },
      pdfBase64,
      customFile: invoice.customFile
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to send email with PDF", error);
    throw error;
  }
};
