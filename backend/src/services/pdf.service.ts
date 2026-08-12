import PDFDocument from 'pdfkit';

export interface PDFChallanData {
  id: string;
  challanNumber: string;
  status: string;
  totalQuantity: number;
  paymentStatus: string;
  paidAmount: number | string;
  outstandingBalance: number | string;
  createdAt: string | Date;
  taxType?: 'INTRA_STATE' | 'INTER_STATE' | 'EXEMPT';
  customer?: {
    name?: string;
    businessName?: string;
    mobile?: string;
    email?: string | null;
    address?: string;
    gstNumber?: string | null;
  };
  createdBy?: {
    name?: string;
  };
  items?: Array<{
    productNameSnapshot?: string;
    skuSnapshot?: string;
    unitPriceSnapshot?: number | string;
    quantity?: number;
  }>;
}

export function generateChallanPDF(docType: 'CHALLAN' | 'INVOICE', data: PDFChallanData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Header
      doc.fontSize(20).fillColor('#064e3b').text('OMNIFLOW ENTERPRISE ERP', { align: 'center' });
      doc.fontSize(13).fillColor('#0f766e').text(`${docType === 'INVOICE' ? 'OFFICIAL TAX INVOICE (GST COMPLIANT)' : 'DELIVERY CHALLAN & DESPATCH NOTE'}`, { align: 'center' });
      doc.moveDown(0.5);

      // Divider
      doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(50, 95).lineTo(550, 95).stroke();

      // Metadata Box (Left)
      doc.fontSize(10).fillColor('#0f172a');
      doc.text(`Doc No: ${data.challanNumber || 'CH-2026-0001'}`, 50, 110);
      doc.text(`Date: ${new Date(data.createdAt || Date.now()).toLocaleDateString('en-IN')}`, 50, 125);
      doc.text(`Status: ${data.status || 'APPROVED'} | Payment: ${data.paymentStatus || 'UNPAID'}`, 50, 140);
      doc.text(`Sales Rep: ${data.createdBy?.name || 'Sales Representative'}`, 50, 155);

      // Customer Details (Right)
      doc.fontSize(11).fillColor('#064e3b').text('BILLED TO / SHIP TO:', 320, 110);
      doc.fontSize(10).fillColor('#334155');
      doc.text(`Client: ${data.customer?.name || 'Valued Client'}`, 320, 125);
      doc.text(`Business: ${data.customer?.businessName || 'N/A'}`, 320, 140);
      doc.text(`Mobile: ${data.customer?.mobile || 'N/A'}`, 320, 155);
      doc.text(`GSTIN: ${data.customer?.gstNumber || '33AAAAA0000A1Z5 (Registered)'}`, 320, 170);
      doc.text(`Address: ${data.customer?.address || 'Main Commercial Office'}`, 320, 185, { width: 220 });

      doc.moveDown(4);

      // Table Header
      const startY = 230;
      doc.fillColor('#f1f5f9').rect(50, startY, 500, 22).fill();
      doc.fillColor('#0f172a').fontSize(9);
      doc.text('Item Description', 60, startY + 6);
      doc.text('SKU', 230, startY + 6);
      doc.text('Qty', 310, startY + 6);
      doc.text('Unit Price', 360, startY + 6);
      doc.text('Taxable Value', 460, startY + 6);

      let currentY = startY + 28;
      let subtotal = 0;

      const itemsList = data.items || [];
      if (itemsList.length === 0) {
        doc.fontSize(9).fillColor('#64748b').text('No line items recorded.', 60, currentY);
        currentY += 20;
      } else {
        itemsList.forEach((item) => {
          const unitPrice = Number(item.unitPriceSnapshot || 0);
          const qty = Number(item.quantity || 1);
          const lineTotal = unitPrice * qty;
          subtotal += lineTotal;

          doc.fontSize(9).fillColor('#334155');
          doc.text(item.productNameSnapshot || 'Stationery / Office Item', 60, currentY, { width: 160 });
          doc.text(item.skuSnapshot || 'SKU-001', 230, currentY);
          doc.text(String(qty), 310, currentY);
          doc.text(`₹${unitPrice.toFixed(2)}`, 360, currentY);
          doc.text(`₹${lineTotal.toFixed(2)}`, 460, currentY);

          currentY += 20;
        });
      }

      // GST Calculations
      const taxMode = data.taxType || 'INTRA_STATE';
      let cgst = 0;
      let sgst = 0;
      let igst = 0;

      if (taxMode === 'INTRA_STATE') {
        cgst = subtotal * 0.09;
        sgst = subtotal * 0.09;
      } else if (taxMode === 'INTER_STATE') {
        igst = subtotal * 0.18;
      }

      const totalTax = cgst + sgst + igst;
      const grandTotal = subtotal + totalTax;

      // Summary Box
      doc.strokeColor('#e2e8f0').rect(280, currentY + 10, 270, 110).stroke();

      doc.fontSize(10).fillColor('#334155');
      doc.text(`Taxable Subtotal:`, 290, currentY + 20);
      doc.text(`₹${subtotal.toFixed(2)}`, 460, currentY + 20);

      if (taxMode === 'INTRA_STATE') {
        doc.text(`CGST (9%):`, 290, currentY + 36);
        doc.text(`₹${cgst.toFixed(2)}`, 460, currentY + 36);
        doc.text(`SGST (9%):`, 290, currentY + 52);
        doc.text(`₹${sgst.toFixed(2)}`, 460, currentY + 52);
      } else if (taxMode === 'INTER_STATE') {
        doc.text(`IGST (18%):`, 290, currentY + 36);
        doc.text(`₹${igst.toFixed(2)}`, 460, currentY + 36);
      } else {
        doc.text(`GST Exempt (0%):`, 290, currentY + 36);
        doc.text(`₹0.00`, 460, currentY + 36);
      }

      doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(290, currentY + 72).lineTo(540, currentY + 72).stroke();

      doc.fontSize(11).fillColor('#064e3b');
      doc.text(`Grand Total (Incl. GST):`, 290, currentY + 80);
      doc.text(`₹${grandTotal.toFixed(2)}`, 460, currentY + 80);

      doc.fontSize(9).fillColor('#475569');
      doc.text(`Total Qty: ${data.totalQuantity || 0}`, 50, currentY + 20);
      doc.text(`Paid Amount: ₹${Number(data.paidAmount || 0).toFixed(2)}`, 50, currentY + 38);
      doc.text(`Outstanding Due: ₹${Number(data.outstandingBalance || 0).toFixed(2)}`, 50, currentY + 56);

      // Footer
      doc.fontSize(8).fillColor('#94a3b8').text('OmniFlow ERP • Computer-generated Tax Invoice compliant with GST Rules, 2017.', 50, 720, { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
