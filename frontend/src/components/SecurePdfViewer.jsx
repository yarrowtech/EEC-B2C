import React, { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import pdfWorker from "pdfjs-dist/legacy/build/pdf.worker?url";
import { FileText, X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Maximize, Minimize } from "lucide-react";

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
  const [blocked, setBlocked] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pageInput, setPageInput] = useState("");
  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 4;

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

        const baseViewport = page.getViewport({ scale: 1 });

        let finalScale = scale;
        if (fitMode === "width") {
          finalScale = container.clientWidth / baseViewport.width;
        }
        if (fitMode === "height") {
          finalScale = container.clientHeight / baseViewport.height;
        }

        const viewport = page.getViewport({ scale: finalScale });
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

  /* ---------------- PAGE TRACKING ---------------- */
  useEffect(() => {
    if (!containerRef.current || !totalPages) return;

    visibleRatios.current = {};

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const page = Number(entry.target.dataset.page);
          visibleRatios.current[page] = entry.intersectionRatio;
        });

        const mostVisible = Object.entries(visibleRatios.current).sort(
          (a, b) => b[1] - a[1]
        )[0];

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

  /* ---------------- SCREENSHOT / SCREEN RECORD BLOCK ---------------- */
  useEffect(() => {
    const hideContent = () => setBlocked(true);
    const showContent = () => setBlocked(false);

    // Desktop: PrintScreen, DevTools, etc.
    const keyHandler = (e) => {
      if (
        e.key === "PrintScreen" ||
        (e.ctrlKey && e.shiftKey && ["i", "c", "j"].includes(e.key.toLowerCase()))
      ) {
        hideContent();
        setTimeout(showContent, 1500);
      }
    };

    // Mobile + Desktop: App switch / screenshot
    const visibilityHandler = () => {
      if (document.hidden) hideContent();
      else showContent();
    };

    // Mobile screenshot often triggers resize
    let lastWidth = window.innerWidth;
    let lastHeight = window.innerHeight;
    const resizeHandler = () => {
      if (
        Math.abs(window.innerWidth - lastWidth) > 50 ||
        Math.abs(window.innerHeight - lastHeight) > 50
      ) {
        hideContent();
        setTimeout(showContent, 1500);
      }
      lastWidth = window.innerWidth;
      lastHeight = window.innerHeight;
    };

    window.addEventListener("keydown", keyHandler);
    document.addEventListener("visibilitychange", visibilityHandler);
    window.addEventListener("resize", resizeHandler);

    return () => {
      window.removeEventListener("keydown", keyHandler);
      document.removeEventListener("visibilitychange", visibilityHandler);
      window.removeEventListener("resize", resizeHandler);
    };
  }, []);

  const handleZoomSelect = (value) => {
    if (value.endsWith("%")) {
      setFitMode("free");
      setScale(parseInt(value.replace("%", ""), 10) / 100);
    } else {
      setFitMode(value);
    }
  };

  /* ---------------- PAGE NAVIGATION ---------------- */
  const goToPage = (pageNum) => {
    if (pageNum < 1 || pageNum > totalPages) return;
    const targetCanvas = canvasRefs.current[pageNum - 1];
    if (targetCanvas && containerRef.current) {
      targetCanvas.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  const handlePageInputChange = (e) => {
    const value = e.target.value;
    if (value === "" || /^\d+$/.test(value)) {
      setPageInput(value);
    }
  };

  const handlePageInputSubmit = (e) => {
    e.preventDefault();
    const pageNum = parseInt(pageInput, 10);
    if (pageNum >= 1 && pageNum <= totalPages) {
      goToPage(pageNum);
      setPageInput("");
    }
  };

  /* ---------------- FULLSCREEN ---------------- */
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  /* ---------------- UI ---------------- */
  return (
    <div className="fixed inset-0 z-50 bg-[#2a2a2e] flex flex-col select-none">
      {/* HEADER */}
      <div className="relative flex flex-wrap items-center justify-between gap-2 px-3 md:px-5 py-2 md:py-3 bg-[#38383d] text-white shadow-lg">
        {/* LEFT */}
        <div className="flex items-center gap-2 font-semibold truncate text-xs sm:text-sm md:text-base max-w-full md:max-w-[40%]">
          <FileText className="w-4 h-4" />
          {subject ? `${subject} •` : ""} {title}
        </div>

        {/* CENTER PAGE NAVIGATION (DESKTOP) */}
        <div className="absolute left-1/2 -translate-x-1/2 hidden sm:flex items-center gap-2">
          <button
            onClick={prevPage}
            disabled={currentPage <= 1}
            className="p-1.5 rounded hover:bg-[#4a4a4f] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <form onSubmit={handlePageInputSubmit} className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-[#4a4a4f] px-3 py-1 rounded-full">
              <span className="text-xs sm:text-sm font-semibold">Page:</span>
              <input
                type="text"
                value={pageInput}
                onChange={handlePageInputChange}
                placeholder={currentPage.toString()}
                className="w-10 bg-transparent text-center outline-none text-xs sm:text-sm font-semibold"
              />
              <span className="text-xs sm:text-sm font-semibold">/ {totalPages}</span>
            </div>
          </form>

          <button
            onClick={nextPage}
            disabled={currentPage >= totalPages}
            className="p-1.5 rounded hover:bg-[#4a4a4f] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* RIGHT CONTROLS */}
        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          <button
            onClick={zoomOut}
            disabled={scale <= MIN_ZOOM}
            className="p-1.5 rounded hover:bg-[#4a4a4f] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <button
            onClick={zoomIn}
            disabled={scale >= MAX_ZOOM}
            className="p-1.5 rounded hover:bg-[#4a4a4f] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <select
            value={fitMode === "free" ? `${Math.round(scale * 100)}%` : fitMode}
            onChange={(e) => handleZoomSelect(e.target.value)}
            className="bg-[#4a4a4f] text-white text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-md outline-none cursor-pointer hover:bg-[#5a5a5f] transition-colors"
          >
            <option value="width">Fit to Width</option>
            <option value="height">Fit to Height</option>
            <option value="free">Actual Size</option>
            <option disabled>──────────</option>
            <option value="50%">50%</option>
            <option value="75%">75%</option>
            <option value="100%">100%</option>
            <option value="125%">125%</option>
            <option value="150%">150%</option>
            <option value="200%">200%</option>
            <option value="300%">300%</option>
            <option value="400%">400%</option>
          </select>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded hover:bg-[#4a4a4f] transition-colors"
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-[#4a4a4f] transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* PDF CONTENT */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto px-6 py-8 space-y-8 flex flex-col items-center relative"
      >
        {Array.from({ length: totalPages }).map((_, i) => (
          <div key={i} className="relative">
            <canvas
              ref={(el) => (canvasRefs.current[i] = el)}
              className="bg-white shadow-xl select-none"
            />
            {/* Watermark Overlay */}
            {/* <div className="absolute inset-0 pointer-events-none select-none overflow-hidden rounded-lg">
              <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-x-32 gap-y-24 p-8" style={{ transform: 'rotate(-45deg)', transformOrigin: 'center' }}>
                {Array.from({ length: 20 }).map((_, idx) => (
                  <div key={idx} className="text-gray-400/20 font-bold text-2xl md:text-3xl whitespace-nowrap text-center">
                    {userName && <div>{userName}</div>}
                    {board && <div>{board}</div>}
                    {className && <div>{className}</div>}
                  </div>
                ))}
              </div>
            </div> */}
          </div>
        ))}
      </div>

      {/* MOBILE PAGE NAVIGATION */}
      <div className="sm:hidden flex items-center justify-center gap-3 bg-[#38383d] py-2 px-3">
        <button
          onClick={prevPage}
          disabled={currentPage <= 1}
          className="p-1.5 rounded hover:bg-[#4a4a4f] disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-white"
          title="Previous page"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <form onSubmit={handlePageInputSubmit} className="flex items-center">
          <div className="flex items-center gap-1 bg-[#4a4a4f] text-white px-3 py-1 rounded-full">
            <span className="text-xs font-semibold">Page:</span>
            <input
              type="text"
              value={pageInput}
              onChange={handlePageInputChange}
              placeholder={currentPage.toString()}
              className="w-8 bg-transparent text-center outline-none text-xs font-semibold"
            />
            <span className="text-xs font-semibold">/ {totalPages}</span>
          </div>
        </form>

        <button
          onClick={nextPage}
          disabled={currentPage >= totalPages}
          className="p-1.5 rounded hover:bg-[#4a4a4f] disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-white"
          title="Next page"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
      {blocked && (
        <div className="absolute inset-0 z-[999] bg-black flex items-center justify-center">
          <p className="text-white text-lg font-semibold tracking-wide">
            🔒 Protected Content
          </p>
        </div>
      )}
    </div>
  );
}