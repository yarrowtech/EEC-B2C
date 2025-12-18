import React, { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import pdfWorker from "pdfjs-dist/legacy/build/pdf.worker?url";
import { FileText, X, ZoomIn, ZoomOut } from "lucide-react";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function SecurePdfViewer({ pdfUrl, subject, title, onClose }) {
  const containerRef = useRef(null);
  const canvasRefs = useRef([]);
  const visibleRatios = useRef({});

  const [pdfDoc, setPdfDoc] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const [scale, setScale] = useState(1);
  const [fitMode, setFitMode] = useState("width"); // width | height | free
  const [ready, setReady] = useState(false);
  const MIN_ZOOM = 0.5; // 50%
  const MAX_ZOOM = 4;   // 400%

  /* ---------------- LOAD PDF ---------------- */
  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const res = await fetch(pdfUrl);
        const buffer = await res.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

        if (!mounted) return;

        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        canvasRefs.current = new Array(pdf.numPages);

        requestAnimationFrame(() => setReady(true));
      } catch (err) {
        console.error("PDF LOAD ERROR:", err);
      }
    }

    load();
    return () => (mounted = false);
  }, [pdfUrl]);

  /* ---------------- RENDER ALL PAGES ---------------- */
  useEffect(() => {
    if (!pdfDoc || !ready) return;

    const renderAll = async () => {
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const canvas = canvasRefs.current[i - 1];
        if (!canvas) continue;

        const ctx = canvas.getContext("2d");
        const container = containerRef.current;

        const baseViewport = page.getViewport({ scale: 1, rotation: 0 });

        let finalScale = scale;
        if (fitMode === "width") {
          finalScale = container.clientWidth / baseViewport.width;
        }
        if (fitMode === "height") {
          finalScale = container.clientHeight / baseViewport.height;
        }

        const viewport = page.getViewport({
          scale: finalScale,
          rotation: 0,
        });

        const dpr = window.devicePixelRatio || 1;

        canvas.width = viewport.width * dpr;
        canvas.height = viewport.height * dpr;
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        await page.render({ canvasContext: ctx, viewport }).promise;
      }
    };

    renderAll();
  }, [pdfDoc, scale, fitMode, ready]);

  /* ---------------- PAGE TRACKING (FIXED) ---------------- */
  useEffect(() => {
    if (!containerRef.current || !totalPages) return;

    visibleRatios.current = {};

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const page = Number(entry.target.dataset.page);
          visibleRatios.current[page] = entry.intersectionRatio;
        });

        // pick page with highest visibility
        const mostVisible = Object.entries(visibleRatios.current)
          .sort((a, b) => b[1] - a[1])[0];

        if (mostVisible) {
          setCurrentPage(Number(mostVisible[0]));
        }
      },
      {
        root: containerRef.current,
        threshold: Array.from({ length: 101 }, (_, i) => i / 100),
      }
    );

    canvasRefs.current.forEach((canvas, i) => {
      if (!canvas) return;
      canvas.dataset.page = i + 1;
      observer.observe(canvas);
    });

    return () => observer.disconnect();
  }, [totalPages]);

  /* ---------------- ZOOM ---------------- */
  // const zoomIn = () => {
  //   setFitMode("free");
  //   setScale((s) => Math.min(3, s + 0.2));
  // };

  // const zoomOut = () => {
  //   setFitMode("free");
  //   setScale((s) => Math.max(0.5, s - 0.2));
  // };

  const zoomIn = () => {
    setFitMode("free");
    setScale((s) => Math.min(MAX_ZOOM, Number((s + 0.2).toFixed(2))));
  };

  const zoomOut = () => {
    setFitMode("free");
    setScale((s) => Math.max(MIN_ZOOM, Number((s - 0.2).toFixed(2))));
  };

  /* ---------------- SECURITY ---------------- */
  useEffect(() => {
    const blockContext = (e) => e.preventDefault();
    const blockKeys = (e) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        ["c", "p", "s", "u", "a"].includes(e.key.toLowerCase())
      )
        e.preventDefault();
      if (e.key === "F12") e.preventDefault();
    };

    document.addEventListener("contextmenu", blockContext);
    document.addEventListener("keydown", blockKeys);

    return () => {
      document.removeEventListener("contextmenu", blockContext);
      document.removeEventListener("keydown", blockKeys);
    };
  }, []);

  const handleZoomSelect = (value) => {
    // If it's percentage
    if (value.endsWith("%")) {
      const percent = parseInt(value.replace("%", ""), 10);
      setFitMode("free");
      setScale(percent / 100);
    } else {
      // width / height / free
      setFitMode(value);
    }
  };


  /* ---------------- UI ---------------- */
  return (
    <div className="fixed inset-0 z-50 bg-[#2a2a2e] flex flex-col select-none">
      {/* HEADER */}
      <div className="relative flex items-center justify-between px-5 py-3 bg-[#38383d] text-white shadow-lg">
        {/* LEFT */}
        <div className="font-semibold truncate text-sm md:text-base max-w-[40%]">
          <FileText className="w-4 h-4 inline mr-2" /> {subject ? `${subject} •` : ""} {title}
        </div>

        {/* CENTER PAGE INDICATOR */}
        <div className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold bg-[#4a4a4f] px-4 py-1 rounded-full">
          Page: {currentPage} / {totalPages}
        </div>

        {/* RIGHT CONTROLS */}
        <div className="flex items-center gap-3">
          <button onClick={zoomOut}
            disabled={scale <= MIN_ZOOM}
            className={`hover:text-yellow-300 ${scale <= MIN_ZOOM ? "opacity-40 cursor-not-allowed" : ""
              }`}>
            <ZoomOut />
          </button>

          <button onClick={zoomIn}
            disabled={scale >= MAX_ZOOM}
            className={`hover:text-yellow-300 ${scale >= MAX_ZOOM ? "opacity-40 cursor-not-allowed" : ""
              }`}>
            <ZoomIn />
          </button>

          <select
            value={fitMode === "free" ? `${Math.round(scale * 100)}%` : fitMode}
            onChange={(e) => handleZoomSelect(e.target.value)}
            className="bg-[#4a4a4f] text-white text-sm px-3 py-1 rounded-md outline-none"
          >
            {/* Fit options */}
            <option value="width">Fit to Width</option>
            <option value="height">Fit to Height</option>
            <option value="free">Actual Size</option>

            <option disabled>──────────</option>

            {/* Percentage zoom */}
            <option value="50%">50%</option>
            <option value="75%">75%</option>
            <option value="100%">100%</option>
            <option value="125%">125%</option>
            <option value="150%">150%</option>
            <option value="200%">200%</option>
            <option value="300%">300%</option>
            <option value="400%">400%</option>
          </select>


          <button onClick={onClose} className="hover:text-red-300">
            <X />
          </button>
        </div>
      </div>

      {/* CONTINUOUS SCROLL */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto px-6 py-8 space-y-8 flex flex-col items-center"
      >
        {Array.from({ length: totalPages }).map((_, i) => (
          <canvas
            key={i}
            ref={(el) => (canvasRefs.current[i] = el)}
            className="bg-white rounded-lg shadow-xl select-none"
          />
        ))}
      </div>
    </div>
  );
}
