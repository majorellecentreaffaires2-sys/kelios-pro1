import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export const generatePdfBase64 = async (element: HTMLElement, primaryColor: string = '#2563eb'): Promise<string> => {
  const canvas = await html2canvas(element, {
    scale: 3,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    allowTaint: true,
    windowWidth: 794,
    windowHeight: 1123,
    onclone: (clonedDoc) => {
      let fullCss = '';
      Array.from(document.styleSheets).forEach(sheet => {
        try {
          const rules = sheet.cssRules;
          if (rules) {
            for (let i = 0; i < rules.length; i++) {
              fullCss += rules[i].cssText + '\n';
            }
          }
        } catch (e) {
          // Skip CORS-protected sheets
        }
      });

      clonedDoc.querySelectorAll('link[rel="stylesheet"], style').forEach(el => el.remove());

      const processCss = (input: string) => {
        const forbidden = ['oklch', 'oklab', 'display-p3', 'lch', 'lab', 'hwb', 'color', 'color-mix'];
        let output = '';
        let i = 0;
        const len = input.length;

        while (i < len) {
          let matchedFn = null;
          for (const fn of forbidden) {
            if (input.substr(i, fn.length).toLowerCase() === fn) {
              let j = i + fn.length;
              while (j < len && /\s/.test(input[j])) j++;
              if (j < len && input[j] === '(') {
                matchedFn = { name: fn, totalLength: j - i + 1 };
                break;
              }
            }
          }

          if (matchedFn) {
            output += primaryColor;
            i += matchedFn.totalLength;
            let depth = 1;
            while (i < len && depth > 0) {
              if (input[i] === '(') depth++;
              else if (input[i] === ')') depth--;
              i++;
            }
          } else {
            output += input[i];
            i++;
          }
        }
        return output;
      };

      const style = clonedDoc.createElement('style');
      style.textContent = processCss(fullCss);
      clonedDoc.head.appendChild(style);

      const attributesToCheck = ['style', 'fill', 'stroke', 'stop-color', 'flood-color', 'lighting-color'];
      clonedDoc.querySelectorAll('*').forEach(el => {
        attributesToCheck.forEach(attr => {
          const val = el.getAttribute(attr);
          if (val) {
            const lowerVal = val.toLowerCase();
            if (forbiddenKeywordsExist(lowerVal)) {
              el.setAttribute(attr, processCss(val));
            }
          }
        });
      });

      const fallback = clonedDoc.createElement('style');
      fallback.innerHTML = `
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        html, body {
          margin: 0;
          padding: 0;
          width: 210mm;
          height: 297mm;
          background: white;
          color: #000;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
          line-height: 1.5;
        }
        .print-area {
          width: 210mm !important;
          min-height: 297mm !important;
          margin: 0 !important;
          padding: 0 !important;
          background: white !important;
          color: #000 !important;
          box-shadow: none !important;
          page-break-after: always;
        }
        img {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          max-width: 100%;
          height: auto;
        }
        table {
          width: 100%;
          border-collapse: collapse !important;
          border-spacing: 0;
        }
        td, th {
          display: table-cell;
          vertical-align: middle;
          border-collapse: collapse !important;
        }
        /* Ensure text is always black unless specifically styled */
        p, span, div, h1, h2, h3, h4, h5, h6, td, th {
          color: inherit;
        }
        /* Override tailwind text colors for print */
        .text-white { color: white !important; }
        .text-gray-900 { color: #111827 !important; }
        .text-gray-800 { color: #1f2937 !important; }
        .text-gray-700 { color: #374151 !important; }
        .text-gray-600 { color: #4b5563 !important; }
        .text-gray-500 { color: #6b7280 !important; }
        .text-gray-400 { color: #9ca3af !important; }
      `;
      clonedDoc.head.appendChild(fallback);
    }
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const imgWidth = 210;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
  return pdf.output('datauristring');
};

const forbiddenKeywordsExist = (val: string) => {
  return ['oklch', 'oklab', 'display-p3', 'lch', 'lab', 'hwb'].some(k => val.includes(k));
};
