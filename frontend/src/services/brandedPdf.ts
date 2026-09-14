import jsPDF from 'jspdf';
import autoTable, { UserOptions } from 'jspdf-autotable';

const NAVY: [number, number, number] = [15, 23, 42];
const BLUE: [number, number, number] = [2, 132, 199];
const GREY: [number, number, number] = [226, 232, 240];
const ZEBRA: [number, number, number] = [248, 250, 252];

const imageToDataUrl = async (imageUrl: string): Promise<string | null> => {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const sourceUrl = URL.createObjectURL(blob);
    return await new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext('2d');
        if (!context) {
          URL.revokeObjectURL(sourceUrl);
          resolve(null);
          return;
        }
        context.drawImage(image, 0, 0);
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
        for (let index = 0; index < pixels.data.length; index += 4) {
          const red = pixels.data[index];
          const green = pixels.data[index + 1];
          const blue = pixels.data[index + 2];
          if (red < 32 && green < 32 && blue < 32) pixels.data[index + 3] = 0;
        }
        context.putImageData(pixels, 0, 0);
        URL.revokeObjectURL(sourceUrl);
        resolve(canvas.toDataURL('image/png'));
      };
      image.onerror = () => {
        URL.revokeObjectURL(sourceUrl);
        resolve(null);
      };
      image.src = sourceUrl;
    });
  } catch {
    return null;
  }
};

export interface BrandedPdfOptions {
  title: string;
  subtitle?: string;
  logoUrl: string;
  filename: string;
  orientation?: 'portrait' | 'landscape';
}

export const createBrandedPdf = async ({ title, subtitle, logoUrl, orientation = 'landscape' }: Omit<BrandedPdfOptions, 'filename'>) => {
  const pdf = new jsPDF({ orientation });
  const logoData = await imageToDataUrl(logoUrl);
  const pageWidth = pdf.internal.pageSize.getWidth();

  const drawHeader = (pageNumber: number) => {
    pdf.setFillColor(...NAVY);
    pdf.rect(0, 0, pageWidth, 29, 'F');
    pdf.setFillColor(...BLUE);
    pdf.rect(0, 29, pageWidth, 2, 'F');

    if (logoData) {
      pdf.addImage(logoData, 'PNG', 12, 5, 29, 18);
    }
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.text('ZIVEKA ONLINE CAMPUS', 46, 12);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.text('District Representative CRM', 46, 18);
    pdf.setTextColor(203, 213, 225);
    pdf.setFontSize(7);
    pdf.text('Head Office: Colombo, Sri Lanka  |  info@zivekacampus.com  |  Helpdesk@zivekaCampus.com', 46, 24);

    pdf.setTextColor(15, 23, 42);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(15);
    pdf.text(title, 14, 42);
    if (subtitle) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      pdf.setTextColor(71, 85, 105);
      pdf.text(subtitle, 14, 49);
    }
    pdf.setDrawColor(...BLUE);
    pdf.setLineWidth(0.6);
    pdf.line(14, 54, pageWidth - 14, 54);
    pdf.setTextColor(100, 116, 139);
    pdf.setFontSize(7);
    pdf.text(`Generated ${new Date().toLocaleString('en-LK')}`, pageWidth - 14, 42, { align: 'right' });
    pdf.text(`Page ${pageNumber}`, pageWidth - 14, 49, { align: 'right' });
  };

  const drawFooter = (pageNumber: number, totalPages: number) => {
    const pageHeight = pdf.internal.pageSize.getHeight();
    pdf.setDrawColor(...GREY);
    pdf.setLineWidth(0.35);
    pdf.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15);
    pdf.setTextColor(100, 116, 139);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.text('Confidential - For authorized Ziveka Online Campus use only', 14, pageHeight - 8);
    pdf.text(`Ziveka Campus CRM  |  Page ${pageNumber} of ${totalPages}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
  };

  drawHeader(1);
  return { pdf, drawHeader, drawFooter, tableStartY: 61 };
};

export const brandedTable = (pdf: jsPDF, options: UserOptions) => {
  const optionMargin = typeof options.margin === 'object' && options.margin !== null ? options.margin : {};
  const optionDidParseCell = options.didParseCell;
  autoTable(pdf, {
    ...options,
    startY: options.startY || 61,
    margin: { top: 59, bottom: 21, left: 14, right: 14, ...optionMargin },
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: 2.5,
      textColor: NAVY,
      lineColor: GREY,
      lineWidth: 0.2,
      overflow: 'linebreak',
      ...(options.styles || {}),
    },
    headStyles: {
      fillColor: NAVY,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      lineColor: BLUE,
      lineWidth: 0.35,
      ...(options.headStyles || {}),
    },
    alternateRowStyles: {
      fillColor: ZEBRA,
      ...(options.alternateRowStyles || {}),
    },
    didParseCell: (data) => {
      optionDidParseCell?.(data);
      if (data.section !== 'body') return;
      const value = String(data.cell.raw ?? '').toLowerCase();
      if (/^(paid|approved|confirmed|verified|active|completed)$/.test(value)) {
        data.cell.styles.fillColor = [220, 252, 231];
        data.cell.styles.textColor = [22, 101, 52];
        data.cell.styles.fontStyle = 'bold';
      } else if (/^(pending|eligible|awaiting|waitlisted)$/.test(value)) {
        data.cell.styles.fillColor = [254, 243, 199];
        data.cell.styles.textColor = [146, 64, 14];
        data.cell.styles.fontStyle = 'bold';
      } else if (/^(refunded|reversed|rejected|terminated)$/.test(value)) {
        data.cell.styles.fillColor = [255, 228, 230];
        data.cell.styles.textColor = [159, 18, 57];
        data.cell.styles.fontStyle = 'bold';
      }
      if (typeof data.cell.raw === 'number' || /%$/.test(value) || /\b(lkr|amount|revenue|commission|fee|balance)\b/i.test(String(data.column?.dataKey ?? ''))) {
        data.cell.styles.halign = 'right';
      }
    },
  });
};

export const finishBrandedPdf = (pdf: jsPDF, drawHeader: (pageNumber: number) => void, drawFooter: (pageNumber: number, totalPages: number) => void, filename: string) => {
  const totalPages = pdf.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    pdf.setPage(page);
    drawHeader(page);
    drawFooter(page, totalPages);
  }
  pdf.save(filename);
};
