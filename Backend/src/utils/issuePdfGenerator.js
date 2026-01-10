// import PDFDocument from "pdfkit";
// import fs from "fs";
// import path from "path";

// export const generateIssueResolutionPDF = async ({ issue, report }) => {
//   const dir = path.join("uploads", "resolution-pdfs");
//   if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

//   const fileName = `issue_${issue._id}_resolution.pdf`;
//   const filePath = path.join(dir, fileName);

//   const doc = new PDFDocument({ margin: 40 });
//   doc.pipe(fs.createWriteStream(filePath));

//   doc.fontSize(18).text("Citizen Voice – Resolution Report", { align: "center" });
//   doc.moveDown();

//   doc.fontSize(12).text(`Issue ID: ${issue.issueId}`);
//   doc.text(`Title: ${issue.title}`);
//   doc.text(`Category: ${issue.category}`);
//   doc.text(`Priority: ${issue.priority}`);
//   doc.text(`Status: Resolved`);
//   doc.moveDown();

//   doc.text(`Reported By: ${issue.reportedBy.username} (${issue.reportedBy.email})`);
//   doc.text(`Resolved By: ${report.submittedBy.username}`);
//   doc.text(`Approved By Official`);
//   doc.moveDown();

//   doc.text("Problem Description:");
//   doc.text(issue.description);
//   doc.moveDown();

//   doc.text("Work Summary:");
//   doc.text(report.workSummary || "N/A");
//   doc.moveDown();

//   doc.text("Steps Taken:");
//   doc.text(report.stepsTaken || "N/A");
//   doc.moveDown();

//   doc.text("Resources Used:");
//   doc.text(report.resourcesUsed || "N/A");
//   doc.moveDown();

//   doc.text("Resolution Evidence Images:");
//   (report.proof || []).forEach((img, i) => {
//     doc.text(`${i + 1}. ${img}`);
//   });

//   doc.end();

//   return `/uploads/resolution-pdfs/${fileName}`;
// };


import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ✅ Required for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateIssueResolutionPDF = async ({ issue, report }) => {
  // 🔥 ABSOLUTE PATH (FIX)
  const dir = path.join(__dirname, "../../uploads/resolution-pdfs");

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const fileName = `issue_${issue.issueId}_resolution.pdf`;
  const filePath = path.join(dir, fileName);

  const doc = new PDFDocument({ margin: 40 });
  doc.pipe(fs.createWriteStream(filePath));

  // ---------------- HEADER ----------------
  doc.fontSize(18).text("Citizen Voice – Resolution Report", { align: "center" });
  doc.moveDown(2);

  // ---------------- ISSUE INFO ----------------
  doc.fontSize(12).text(`Issue ID: ${issue.issueId}`);
  doc.text(`Title: ${issue.title}`);
  doc.text(`Category: ${issue.category}`);
  doc.text(`Priority: ${issue.priority}`);
  doc.text(`Status: RESOLVED`);
  doc.moveDown();

  doc.text(
    `Reported By: ${issue.reportedBy?.username} (${issue.reportedBy?.email})`
  );
  doc.text(`Resolved By: ${report.submittedBy?.username}`);
  doc.text(`Approved By: Official Authority`);
  doc.moveDown();

  // ---------------- DETAILS ----------------
  doc.text("Problem Description:");
  doc.text(issue.description);
  doc.moveDown();

  doc.text("Work Summary:");
  doc.text(report.workSummary || "N/A");
  doc.moveDown();

  doc.text("Steps Taken:");
  doc.text(report.stepsTaken || "N/A");
  doc.moveDown();

  doc.text("Resources Used:");
  doc.text(report.resourcesUsed || "N/A");
  doc.moveDown();

  doc.text("Resolution Evidence Images:");
  (report.proof || []).forEach((img, i) => {
    doc.text(`${i + 1}. ${img}`);
  });

  doc.end();

  // ✅ PUBLIC URL (IMPORTANT)
  return `/uploads/resolution-pdfs/${fileName}`;
};
