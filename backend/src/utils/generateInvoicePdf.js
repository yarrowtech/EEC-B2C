import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { getWebsiteBranding } from "./websiteBranding.js";

// A4 dimensions in points
const PW = 595.28;
const PH = 841.89;
const ML = 50;              // left margin
const MR = 50;              // right margin
const CW = PW - ML - MR;   // content width ≈ 495

// Brand palette — mirrors website design system
const C = {
  navy:    "#1B1F3B",
  yellow:  "#FFD23F",
  coral:   "#F4736E",
  success: "#22c55e",
  white:   "#ffffff",
  bg:      "#f8fafc",
  border:  "#e2e8f0",
  dark:    "#1e293b",
  mid:     "#475569",
  light:   "#94a3b8",
};

// ── helpers ──────────────────────────────────────────────────────────────────

function hline(doc, x1, y, x2, color = C.border, w = 0.75) {
  doc.save().strokeColor(color).lineWidth(w).moveTo(x1, y).lineTo(x2, y).stroke().restore();
}

function vline(doc, x, y1, y2, color = C.border, w = 0.75) {
  doc.save().strokeColor(color).lineWidth(w).moveTo(x, y1).lineTo(x, y2).stroke().restore();
}

function labelValue(doc, label, value, x, y, colW, valueFont = "Helvetica-Bold", valueFontSize = 9.5) {
  doc.fontSize(7.5).fillColor(C.light).font("Helvetica").text(label, x, y, { width: colW, lineBreak: false });
  doc.fontSize(valueFontSize).fillColor(C.dark).font(valueFont).text(value, x, y + 13, { width: colW, lineBreak: false });
}

// ── main export ───────────────────────────────────────────────────────────────

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
  invoiceNumber,
  itemTypeLabel,
  itemTitle,
  itemMeta,
}) {
  const { siteName, siteTagline, websiteUrl, supportEmail, supportPhone } =
    await getWebsiteBranding();

  const resolvedItemTitle = itemTitle || materialTitle || "Purchase";
  const resolvedItemLabel = itemTypeLabel ? `${itemTypeLabel}: ` : "";
  const subjectClassLine = [materialSubject, materialClass].filter(Boolean).join(" / ");
  const metaLines = Array.isArray(itemMeta) ? itemMeta.filter(Boolean) : [];
  const resolvedDetails = subjectClassLine || (metaLines.length ? metaLines.join("\n") : "-");

  return new Promise((resolve, reject) => {
    try {
      const invoicesDir = path.join(process.cwd(), "temp", "invoices");
      if (!fs.existsSync(invoicesDir)) fs.mkdirSync(invoicesDir, { recursive: true });

      const filename = `invoice_${invoiceNumber}_${Date.now()}.pdf`;
      const filepath = path.join(invoicesDir, filename);

      const doc = new PDFDocument({ margin: 0, size: "A4" });
      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      // ── HEADER (y: 0–120) ──────────────────────────────────────────────────
      doc.rect(0, 0, PW, 114).fill(C.navy);
      doc.rect(0, 114, PW, 6).fill(C.yellow); // yellow accent stripe

      // "INVOICE" badge — top right
      doc.roundedRect(PW - MR - 90, 22, 90, 24, 5).fill(C.yellow);
      doc.fontSize(10).fillColor(C.navy).font("Helvetica-Bold")
         .text("INVOICE", PW - MR - 90, 30, { width: 90, align: "center" });

      // Site name
      doc.fontSize(21).fillColor(C.yellow).font("Helvetica-Bold")
         .text(siteName, ML, 24, { width: CW - 105, lineBreak: false });

      // Tagline
      if (siteTagline) {
        doc.fontSize(9.5).fillColor(C.light).font("Helvetica")
           .text(siteTagline, ML, 52, { width: CW - 105, lineBreak: false });
      }

      // Contact info row
      const contactParts = [supportEmail, supportPhone, websiteUrl].filter(Boolean);
      if (contactParts.length) {
        doc.fontSize(8).fillColor(C.light)
           .text(contactParts.join("   |   "), ML, 70, { width: CW - 105, lineBreak: false });
      }

      // ── INVOICE META CARDS (y: 130–188) ────────────────────────────────────
      const metaY = 130;
      const cardH = 52;

      // Card 1 — Invoice Number
      doc.roundedRect(ML, metaY, 220, cardH, 6).fill(C.bg);
      doc.rect(ML, metaY, 3, cardH).fill(C.yellow);
      labelValue(doc, "INVOICE NUMBER", invoiceNumber, ML + 14, metaY + 10, 200, "Helvetica-Bold", 9);

      // Card 2 — Date
      doc.roundedRect(ML + 232, metaY, 126, cardH, 6).fill(C.bg);
      doc.rect(ML + 232, metaY, 3, cardH).fill(C.navy);
      labelValue(doc, "DATE", purchaseDate, ML + 246, metaY + 10, 106);

      // Card 3 — Status
      doc.roundedRect(ML + 370, metaY, 125, cardH, 6).fill("#f0fdf4");
      doc.rect(ML + 370, metaY, 3, cardH).fill(C.success);
      doc.fontSize(7.5).fillColor(C.light).font("Helvetica")
         .text("STATUS", ML + 384, metaY + 10, { width: 90, lineBreak: false });
      doc.roundedRect(ML + 384, metaY + 25, 56, 18, 9).fill(C.success);
      doc.fontSize(9).fillColor(C.white).font("Helvetica-Bold")
         .text("PAID", ML + 384, metaY + 30, { width: 56, align: "center" });

      // ── SECTION DIVIDER (y: 198) ───────────────────────────────────────────
      hline(doc, ML, 198, ML + CW, C.border, 1);

      // ── BILLING SECTION (y: 210–285) ───────────────────────────────────────
      const billY = 210;

      // FROM
      doc.fontSize(7.5).fillColor(C.light).font("Helvetica")
         .text("FROM", ML, billY, { width: 220, lineBreak: false });
      doc.fontSize(11).fillColor(C.dark).font("Helvetica-Bold")
         .text(siteName, ML, billY + 13, { width: 220, lineBreak: false });

      let fromY = billY + 30;
      if (websiteUrl) {
        doc.fontSize(8.5).fillColor(C.mid).font("Helvetica")
           .text(websiteUrl, ML, fromY, { width: 220, lineBreak: false });
        fromY += 13;
      }
      if (supportEmail) {
        doc.fontSize(8.5).fillColor(C.mid)
           .text(supportEmail, ML, fromY, { width: 220, lineBreak: false });
        fromY += 13;
      }
      if (supportPhone) {
        doc.fontSize(8.5).fillColor(C.mid)
           .text(supportPhone, ML, fromY, { width: 220, lineBreak: false });
      }

      // Vertical separator
      vline(doc, ML + 247, billY, billY + 75, C.border, 1);

      // BILLED TO
      const toX = ML + 262;
      doc.fontSize(7.5).fillColor(C.light).font("Helvetica")
         .text("BILLED TO", toX, billY, { width: 230, lineBreak: false });
      doc.fontSize(11).fillColor(C.dark).font("Helvetica-Bold")
         .text(name, toX, billY + 13, { width: 230, lineBreak: false });
      doc.fontSize(8.5).fillColor(C.mid).font("Helvetica")
         .text(userEmail, toX, billY + 30, { width: 230, lineBreak: false });
      if (userPhone && userPhone !== "N/A") {
        doc.text(userPhone, toX, billY + 43, { width: 230, lineBreak: false });
      }

      // ── ITEMS TABLE (y: 303–390) ───────────────────────────────────────────
      const tableY = 303;

      // Outer border
      doc.roundedRect(ML, tableY, CW, 80, 4).stroke(C.border);

      // Header row
      doc.rect(ML, tableY, CW, 28).fill(C.navy);
      doc.fontSize(8.5).fillColor(C.white).font("Helvetica-Bold")
         .text("DESCRIPTION", ML + 14, tableY + 9, { width: 220 });
      doc.text("DETAILS", ML + 244, tableY + 9, { width: 130, align: "center" });
      doc.text("AMOUNT", ML + 384, tableY + 9, { width: 100, align: "right" });

      // Header corner radius clip (top corners only) — not trivial in pdfkit, so just draw on top
      // (The outer roundedRect border handles visual rounding)

      // Column separators in header
      vline(doc, ML + 240, tableY, tableY + 28, "rgba(255,255,255,0.15)", 1);
      vline(doc, ML + 380, tableY, tableY + 28, "rgba(255,255,255,0.15)", 1);

      // Item row background
      const rowY = tableY + 28;
      const rowH = 52;
      doc.rect(ML, rowY, CW, rowH).fill(C.bg);

      // Yellow left stripe
      doc.rect(ML, rowY, 4, rowH).fill(C.yellow);

      // Description
      doc.fontSize(9.5).fillColor(C.dark).font("Helvetica-Bold")
         .text(`${resolvedItemLabel}${resolvedItemTitle}`, ML + 14, rowY + 10, { width: 218, lineBreak: false });

      // Details (allow wrap for multi-line meta)
      doc.fontSize(8).fillColor(C.mid).font("Helvetica")
         .text(resolvedDetails, ML + 244, rowY + 10, { width: 130, align: "center", lineBreak: true, lineGap: 1 });

      // Amount
      doc.fontSize(12).fillColor(C.dark).font("Helvetica-Bold")
         .text(`Rs. ${amount}`, ML + 384, rowY + 16, { width: 100, align: "right" });

      // Column separators in row
      vline(doc, ML + 240, rowY, rowY + rowH, C.border);
      vline(doc, ML + 380, rowY, rowY + rowH, C.border);

      // ── TOTALS (y: 408–465) ────────────────────────────────────────────────
      const totalsStartY = tableY + rowH + 28 + 8; // after table row
      const tcX = ML + 300;
      const tcW = CW - 300;

      doc.fontSize(9).fillColor(C.mid).font("Helvetica")
         .text("Subtotal:", tcX, totalsStartY, { width: tcW - 80 });
      doc.fontSize(9).fillColor(C.dark).font("Helvetica-Bold")
         .text(`Rs. ${amount}`, tcX, totalsStartY, { width: tcW, align: "right" });

      doc.fontSize(9).fillColor(C.mid).font("Helvetica")
         .text("Tax (0%):", tcX, totalsStartY + 18, { width: tcW - 80 });
      doc.fontSize(9).fillColor(C.dark).font("Helvetica-Bold")
         .text("Rs. 0.00", tcX, totalsStartY + 18, { width: tcW, align: "right" });

      hline(doc, tcX, totalsStartY + 36, ML + CW, C.border);

      // Grand total bar
      const gtY = totalsStartY + 44;
      doc.rect(ML, gtY, CW, 36).fill(C.navy);
      doc.rect(ML, gtY, 4, 36).fill(C.yellow);
      doc.fontSize(10.5).fillColor(C.white).font("Helvetica-Bold")
         .text("TOTAL AMOUNT", ML + 14, gtY + 12, { width: 200, lineBreak: false });
      doc.fontSize(14).fillColor(C.yellow).font("Helvetica-Bold")
         .text(`Rs. ${amount}`, ML + 14, gtY + 10, { width: CW - 20, align: "right" });

      // ── PAYMENT DETAILS (y: gtY+52 → gtY+130) ────────────────────────────
      const payLabelY = gtY + 52;
      doc.fontSize(10.5).fillColor(C.dark).font("Helvetica-Bold")
         .text("Payment Details", ML, payLabelY, { lineBreak: false });
      // Yellow underline
      doc.rect(ML, payLabelY + 16, CW, 2).fill(C.yellow);

      const payBoxY = payLabelY + 26;
      const payBoxH = 62;
      doc.rect(ML, payBoxY, CW, payBoxH).fill(C.bg);
      hline(doc, ML, payBoxY, ML + CW, C.border, 1);
      hline(doc, ML, payBoxY + payBoxH, ML + CW, C.border, 1);

      const qCol = CW / 4; // ≈ 123.8 pt each

      // Col 1 — Method
      doc.fontSize(7.5).fillColor(C.light).font("Helvetica")
         .text("METHOD", ML + 12, payBoxY + 10, { width: qCol - 16, lineBreak: false });
      doc.fontSize(9.5).fillColor(C.dark).font("Helvetica-Bold")
         .text(paymentMethod, ML + 12, payBoxY + 24, { width: qCol - 16, lineBreak: false });

      vline(doc, ML + qCol, payBoxY, payBoxY + payBoxH, C.border);

      // Col 2 — Date
      doc.fontSize(7.5).fillColor(C.light).font("Helvetica")
         .text("PAYMENT DATE", ML + qCol + 12, payBoxY + 10, { width: qCol - 16, lineBreak: false });
      doc.fontSize(9.5).fillColor(C.dark).font("Helvetica-Bold")
         .text(purchaseDate, ML + qCol + 12, payBoxY + 24, { width: qCol - 16, lineBreak: false });

      vline(doc, ML + qCol * 2, payBoxY, payBoxY + payBoxH, C.border);

      // Col 3 — Transaction ID
      doc.fontSize(7.5).fillColor(C.light).font("Helvetica")
         .text("TRANSACTION ID", ML + qCol * 2 + 12, payBoxY + 10, { width: qCol - 16, lineBreak: false });
      doc.fontSize(7.5).fillColor(C.dark).font("Helvetica-Bold")
         .text(transactionId, ML + qCol * 2 + 12, payBoxY + 24, { width: qCol - 16, lineBreak: true });

      vline(doc, ML + qCol * 3, payBoxY, payBoxY + payBoxH, C.border);

      // Col 4 — Status badge
      doc.fontSize(7.5).fillColor(C.light).font("Helvetica")
         .text("STATUS", ML + qCol * 3 + 12, payBoxY + 10, { width: qCol - 16, lineBreak: false });
      doc.roundedRect(ML + qCol * 3 + 12, payBoxY + 22, 56, 20, 10).fill(C.success);
      doc.fontSize(9).fillColor(C.white).font("Helvetica-Bold")
         .text("PAID", ML + qCol * 3 + 12, payBoxY + 27, { width: 56, align: "center" });

      // ── NOTE (y: payBoxY+80 → payBoxY+124) ────────────────────────────────
      const noteY = payBoxY + payBoxH + 18;
      doc.roundedRect(ML, noteY, CW, 40, 5).fill(C.bg);
      doc.rect(ML, noteY, 3, 40).fill(C.yellow);
      doc.fontSize(8).fillColor(C.mid).font("Helvetica-Oblique")
         .text(
           `This is a computer-generated invoice and does not require a signature. ` +
           `Thank you for choosing ${siteName}. This material is for personal educational use only.`,
           ML + 14, noteY + 10,
           { width: CW - 24, lineGap: 2 }
         );

      // ── FOOTER (y: PH-55 → PH) ────────────────────────────────────────────
      doc.rect(0, PH - 55, PW, 6).fill(C.yellow);
      doc.rect(0, PH - 49, PW, 49).fill(C.navy);
      doc.fontSize(9).fillColor(C.yellow).font("Helvetica-Bold")
         .text(
           `© ${new Date().getFullYear()} ${siteName}. All rights reserved.`,
           0, PH - 36,
           { width: PW, align: "center" }
         );
      if (websiteUrl) {
        doc.fontSize(8).fillColor(C.light).font("Helvetica")
           .text(websiteUrl, 0, PH - 21, { width: PW, align: "center" });
      }

      doc.end();
      stream.on("finish", () => resolve(filepath));
      stream.on("error", (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
}

export function deleteInvoicePdf(filepath) {
  try {
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
  } catch (err) {
    console.error("Failed to delete invoice PDF:", err);
  }
}
