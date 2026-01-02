import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

/**
 * Generate PDF invoice for study material purchase
 * Returns the path to the generated PDF file
 */
export async function generateInvoicePdf({
  name,
  materialTitle,
  materialSubject,
  materialClass,
  amount,
  paymentMethod,
  transactionId,
  purchaseDate,
  userEmail,
  userPhone,
  invoiceNumber
}) {
  return new Promise((resolve, reject) => {
    try {
      // Create invoices directory if it doesn't exist
      const invoicesDir = path.join(process.cwd(), "temp", "invoices");
      if (!fs.existsSync(invoicesDir)) {
        fs.mkdirSync(invoicesDir, { recursive: true });
      }

      // Generate unique filename
      const filename = `invoice_${invoiceNumber}_${Date.now()}.pdf`;
      const filepath = path.join(invoicesDir, filename);

      // Create PDF document
      const doc = new PDFDocument({ margin: 50, size: "A4" });
      const stream = fs.createWriteStream(filepath);

      doc.pipe(stream);

      // Simple Header Background (EEC Theme)
      doc
        .rect(0, 0, 595, 100)
        .fillAndStroke("#f59e0b", "#f59e0b");

      // Company Header
      doc
        .fontSize(28)
        .fillColor("#ffffff")
        .font("Helvetica-Bold")
        .text("EEC - Electronic Educare", 50, 30, { align: "center", width: 495 });

      doc
        .fontSize(10)
        .fillColor("#fef3c7")
        .font("Helvetica")
        .text("Electronic Educare", 50, 62, { align: "center", width: 495 });

      doc
        .fontSize(9)
        .text("Email: contact@eeclearning.com | Phone: +91 9830590929", 50, 78, {
          align: "center",
          width: 495
        });

      // Reset position after header
      doc.y = 120;

      // Invoice Title
      doc
        .fontSize(22)
        .fillColor("#f59e0b")
        .font("Helvetica-Bold")
        .text("INVOICE", 50, doc.y, { align: "center", width: 495 });

      doc.y = doc.y + 35;

      // Invoice Number and Date (simple layout)
      const invoiceY = doc.y;

      doc
        .fontSize(10)
        .fillColor("#6b7280")
        .font("Helvetica");

      doc.text("Invoice Number:", 50, invoiceY);
      doc
        .fillColor("#111827")
        .font("Helvetica-Bold")
        .text(invoiceNumber, 150, invoiceY);

      doc
        .fillColor("#6b7280")
        .font("Helvetica")
        .text("Date:", 350, invoiceY);

      doc
        .fillColor("#111827")
        .font("Helvetica-Bold")
        .text(purchaseDate, 390, invoiceY);

      doc.y = invoiceY + 30;

      // Simple divider line
      doc
        .strokeColor("#e5e7eb")
        .lineWidth(1)
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .stroke();

      doc.moveDown(1.5);

      // Bill To Section (simple style)
      const billToY = doc.y;

      doc
        .fontSize(12)
        .fillColor("#f59e0b")
        .font("Helvetica-Bold")
        .text("Bill To:", 50, billToY);

      doc
        .fontSize(10)
        .fillColor("#374151")
        .font("Helvetica");

      doc.text(name, 50, billToY + 20);
      doc.text(userEmail, 50, billToY + 35);
      if (userPhone && userPhone !== "N/A") {
        doc.text(userPhone, 50, billToY + 50);
      }

      doc.y = billToY + 70;

      // Table with clean design
      const tableTop = doc.y;

      // Table Header
      doc
        .rect(50, tableTop, 495, 25)
        .fillAndStroke("#f59e0b", "#f59e0b");

      doc
        .fontSize(10)
        .fillColor("#ffffff")
        .font("Helvetica-Bold");

      // Column headers
      doc.text("Description", 60, tableTop + 7, { width: 220, align: "left" });
      doc.text("Subject/Class", 290, tableTop + 7, { width: 140, align: "center" });
      doc.text("Amount", 440, tableTop + 7, { width: 95, align: "right" });

      // Table Row
      const rowTop = tableTop + 25;

      doc
        .fontSize(10)
        .fillColor("#374151")
        .font("Helvetica");

      // Row data
      doc.text(materialTitle, 60, rowTop + 10, { width: 220, align: "left" });

      doc
        .fontSize(9)
        .fillColor("#6b7280");

      doc.text(
        `${materialSubject} / ${materialClass}`,
        290,
        rowTop + 10,
        { width: 140, align: "center" }
      );

      doc
        .fontSize(11)
        .fillColor("#111827")
        .font("Helvetica-Bold");

      doc.text(`Rs. ${amount}`, 440, rowTop + 10, { width: 95, align: "right" });

      // Bottom border
      doc
        .strokeColor("#e5e7eb")
        .lineWidth(1)
        .moveTo(50, rowTop + 30)
        .lineTo(545, rowTop + 30)
        .stroke();

      doc.y = rowTop + 50;

      // Total Section (simple layout)
      const totalY = doc.y;

      doc
        .fontSize(10)
        .fillColor("#6b7280")
        .font("Helvetica");

      // Subtotal
      doc.text("Subtotal:", 380, totalY);
      doc
        .fillColor("#111827")
        .font("Helvetica-Bold")
        .text(`Rs. ${amount}`, 480, totalY, { align: "right" });

      // Tax
      doc
        .fillColor("#6b7280")
        .font("Helvetica")
        .text("Tax:", 380, totalY + 20);

      doc
        .fillColor("#111827")
        .font("Helvetica-Bold")
        .text("Rs. 0.00", 480, totalY + 20, { align: "right" });

      // Grand Total
      const grandTotalY = totalY + 50;

      doc
        .rect(50, grandTotalY, 495, 35)
        .fillAndStroke("#f59e0b", "#f59e0b");

      doc
        .fontSize(14)
        .fillColor("#ffffff")
        .font("Helvetica-Bold")
        .text("GRAND TOTAL:", 60, grandTotalY + 10);

      doc
        .fontSize(16)
        .text(`Rs. ${amount}`, 400, grandTotalY + 9, { align: "right" });

      doc.y = grandTotalY + 50;

      // Payment Information (simple style)
      const paymentY = doc.y;

      doc
        .fontSize(12)
        .fillColor("#f59e0b")
        .font("Helvetica-Bold")
        .text("Payment Information", 50, paymentY);

      doc
        .fontSize(10)
        .fillColor("#374151")
        .font("Helvetica");

      doc.text(`Payment Method: ${paymentMethod}`, 50, paymentY + 20);
      doc.text(`Transaction ID: ${transactionId}`, 50, paymentY + 35);
      doc.text("Status: PAID", 50, paymentY + 50);

      doc.y = paymentY + 75;

      // Notes Section (simple style)
      const notesY = doc.y;

      doc
        .fontSize(9)
        .fillColor("#6b7280")
        .font("Helvetica-Oblique")
        .text(
          "Note: This is a computer-generated invoice and does not require a signature.",
          50,
          notesY,
          { align: "left", width: 495 }
        );

      doc
        .fontSize(9)
        .fillColor("#6b7280")
        .font("Helvetica")
        .text(
          "Thank you for choosing EEC Learning Platform. This material is for personal educational use only.",
          50,
          notesY + 20,
          { align: "left", width: 495 }
        );

      // Footer (simple design)
      const footerY = 720;

      doc
        .strokeColor("#e5e7eb")
        .lineWidth(1)
        .moveTo(50, footerY - 10)
        .lineTo(545, footerY - 10)
        .stroke();

      doc
        .fontSize(9)
        .fillColor("#6b7280")
        .font("Helvetica")
        .text(
          `© ${new Date().getFullYear()} EEC Learning Platform. All rights reserved.`,
          50,
          footerY,
          { align: "center", width: 495 }
        );

      doc
        .fontSize(8)
        .fillColor("#9ca3af")
        .text("Empowering Education, One Student at a Time", 50, footerY + 15, {
          align: "center",
          width: 495,
        });

      // Finalize PDF
      doc.end();

      stream.on("finish", () => {
        resolve(filepath);
      });

      stream.on("error", (err) => {
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Delete invoice PDF file after sending email
 */
export function deleteInvoicePdf(filepath) {
  try {
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  } catch (err) {
    console.error("Failed to delete invoice PDF:", err);
  }
}
