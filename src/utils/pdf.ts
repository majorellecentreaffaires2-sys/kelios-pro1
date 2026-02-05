import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export const generatePdfBase64 = async (element: HTMLElement, primaryColor: string = '#2563eb'): Promise<string> => {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
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
        :root {
          --color-primary: ${primaryColor};
          --color-blue-50: #eff6ff; --color-blue-100: #dbeafe; --color-blue-500: #3b82f6; --color-blue-600: #2563eb;
          --color-gray-50: #f9fafb; --color-gray-100: #f3f4f6; --color-gray-200: #e5e7eb; --color-gray-300: #d1d5db;
          --color-gray-400: #9ca3af; --color-gray-500: #6b7280; --color-gray-600: #4b5563;
          --color-gray-700: #374151; --color-gray-800: #1f2937; --color-gray-900: #111827;
          --color-emerald-50: #ecfdf5; --color-emerald-600: #059669; --color-purple-600: #9333ea;
        }
        * { border-color: #e5e7eb !important; }
        .print-area { background: white !important; color: black !important; }
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
