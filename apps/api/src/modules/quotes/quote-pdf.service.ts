import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';

type PdfQuote = {
  number: number;
  status: string;
  subtotal: { toString(): string };
  discount: { toString(): string };
  total: { toString(): string };
  validUntil?: Date | null;
  tenant?: {
    name: string;
    phone?: string | null;
    document?: string | null;
  };
  customer: {
    name: string;
    phone?: string | null;
    email?: string | null;
    document?: string | null;
  };
  items: Array<{
    description: string;
    quantity: { toString(): string };
    unitPrice: { toString(): string };
    discount: { toString(): string };
    total: { toString(): string };
    notes?: string | null;
  }>;
};

@Injectable()
export class QuotePdfService {
  async generate(quote: PdfQuote): Promise<Buffer> {
    const doc = new PDFDocument({ size: 'A4', margin: 48 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    const done = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    this.renderDocument(doc, quote);
    doc.end();

    return done;
  }

  private renderDocument(doc: PDFKit.PDFDocument, quote: PdfQuote) {
    const tenantName = quote.tenant?.name ?? 'AtendePix';

    doc.fontSize(20).fillColor('#17211b').text(tenantName);
    doc.moveDown(0.25);
    doc.fontSize(10).fillColor('#667067').text(this.companyLine(quote));

    doc.moveDown(1.5);
    doc.fontSize(18).fillColor('#17211b').text(`Orcamento #${quote.number}`);
    doc.fontSize(10).fillColor('#667067').text(`Status: ${quote.status}`);

    if (quote.validUntil) {
      doc.text(`Validade: ${this.formatDate(quote.validUntil)}`);
    }

    doc.moveDown(1.5);
    doc.fontSize(12).fillColor('#17211b').text('Cliente', { underline: true });
    doc.moveDown(0.4);
    doc.fontSize(10).fillColor('#17211b').text(quote.customer.name);
    doc.fillColor('#667067').text(this.customerLine(quote));

    doc.moveDown(1.5);
    doc.fontSize(12).fillColor('#17211b').text('Itens', { underline: true });
    doc.moveDown(0.5);

    quote.items.forEach((item, index) => {
      doc
        .fontSize(10)
        .fillColor('#17211b')
        .text(`${index + 1}. ${item.description}`);
      doc
        .fillColor('#667067')
        .text(
          `${this.toNumber(item.quantity)} x ${this.formatCurrency(item.unitPrice)} | Desconto ${this.formatCurrency(item.discount)} | Total ${this.formatCurrency(item.total)}`
        );

      if (item.notes) {
        doc.text(`Obs.: ${item.notes}`);
      }

      doc.moveDown(0.5);
    });

    doc.moveDown(1);
    doc.fontSize(11).fillColor('#17211b');
    doc.text(`Subtotal: ${this.formatCurrency(quote.subtotal)}`, { align: 'right' });
    doc.text(`Desconto: ${this.formatCurrency(quote.discount)}`, { align: 'right' });
    doc.fontSize(14).text(`Total: ${this.formatCurrency(quote.total)}`, { align: 'right' });

    doc.moveDown(2);
    doc.fontSize(9).fillColor('#667067').text('Documento gerado pelo AtendePix.', {
      align: 'center'
    });
  }

  private companyLine(quote: PdfQuote) {
    return (
      [quote.tenant?.document, quote.tenant?.phone].filter(Boolean).join(' | ') ||
      'Orcamento comercial'
    );
  }

  private customerLine(quote: PdfQuote) {
    return [quote.customer.document, quote.customer.phone, quote.customer.email]
      .filter(Boolean)
      .join(' | ');
  }

  private formatCurrency(value: { toString(): string }) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Number(value.toString()));
  }

  private formatDate(value: Date) {
    return new Intl.DateTimeFormat('pt-BR').format(value);
  }

  private toNumber(value: { toString(): string }) {
    return Number(value.toString()).toLocaleString('pt-BR');
  }
}
