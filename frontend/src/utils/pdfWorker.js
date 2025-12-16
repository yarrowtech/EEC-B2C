// // import * as pdfjsLib from "pdfjs-dist";
// import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";

// // 🔥 Vite-safe worker (CDN)
// pdfjsLib.GlobalWorkerOptions.workerSrc =
//   "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.449/pdf.worker.min.js";

import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";

pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
