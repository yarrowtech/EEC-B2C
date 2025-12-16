import React, { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from "lucide-react";

export default function SecurePdfViewer({ pdfUrl, title, onClose }) {
    const canvasRef = useRef(null);
    const [pdfDoc, setPdfDoc] = useState(null);
    const [pageNum, setPageNum] = useState(1);
    const [scale, setScale] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [fitMode, setFitMode] = useState("width"); // width | height | free
    const containerRef = useRef(null);
    const lastTouchDistance = useRef(null);

    useEffect(() => {
        const loadPdf = async () => {
            try {
                const res = await fetch(pdfUrl);
                const data = await res.arrayBuffer();

                // const loadingTask = pdfjsLib.getDocument({
                //   data,
                //   disableWorker: true, // ✅ ONLY place allowed in v5
                // });

                const loadingTask = pdfjsLib.getDocument({ data });

                const pdf = await loadingTask.promise;
                setPdfDoc(pdf);
                setTotalPages(pdf.numPages);
                setPageNum(1);
            } catch (err) {
                console.error("PDF LOAD ERROR:", err);
            }
        };

        loadPdf();
    }, [pdfUrl]);

    //   useEffect(() => {
    //     if (!pdfDoc) return;

    //     const render = async () => {
    //       const page = await pdfDoc.getPage(pageNum);
    //       const viewport = page.getViewport({ scale });
    //       const canvas = canvasRef.current;
    //       const ctx = canvas.getContext("2d");

    //       canvas.width = viewport.width;
    //       canvas.height = viewport.height;

    //       await page.render({ canvasContext: ctx, viewport }).promise;
    //     };

    //     render();
    //   }, [pdfDoc, pageNum, scale]);

    // useEffect(() => {
    //     if (!pdfDoc) return;

    //     const render = async () => {
    //         const page = await pdfDoc.getPage(pageNum);

    //         const container = containerRef.current;
    //         const canvas = canvasRef.current;
    //         const ctx = canvas.getContext("2d");

    //         // Get original page size
    //         const unscaledViewport = page.getViewport({ scale: 1 });

    //         let finalScale = scale;

    //         if (fitMode === "width") {
    //             finalScale = container.clientWidth / unscaledViewport.width;
    //         } else if (fitMode === "height") {
    //             finalScale = container.clientHeight / unscaledViewport.height;
    //         }

    //         const viewport = page.getViewport({ scale: finalScale });

    //         canvas.width = viewport.width;
    //         canvas.height = viewport.height;

    //         await page.render({
    //             canvasContext: ctx,
    //             viewport,
    //         }).promise;
    //     };

    //     render();
    // }, [pdfDoc, pageNum, scale, fitMode]);


    useEffect(() => {
        if (!pdfDoc) return;

        const render = async () => {
            const page = await pdfDoc.getPage(pageNum);

            const container = containerRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");

            const baseViewport = page.getViewport({ scale: 1 });

            let finalScale = scale;

            if (fitMode === "width") {
                finalScale = container.clientWidth / baseViewport.width;
            } else if (fitMode === "height") {
                finalScale = container.clientHeight / baseViewport.height;
            }

            const viewport = page.getViewport({ scale: finalScale });

            canvas.width = viewport.width;
            canvas.height = viewport.height;

            await page.render({
                canvasContext: ctx,
                viewport,
            }).promise;
        };

        render();
    }, [pdfDoc, pageNum, scale, fitMode]);
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const onWheel = (e) => {
            if (!e.ctrlKey) return;

            e.preventDefault();
            setFitMode("free");

            setScale((s) =>
                Math.min(3, Math.max(0.5, s + (e.deltaY < 0 ? 0.1 : -0.1)))
            );
        };

        el.addEventListener("wheel", onWheel, { passive: false });
        return () => el.removeEventListener("wheel", onWheel);
    }, []);
    const handleDoubleClick = () => {
        setFitMode("free");
        setScale((s) => (s < 1.5 ? 2 : 1));
    };
    const getTouchDistance = (touches) => {
        const [a, b] = touches;
        return Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
    };

    const onTouchMove = (e) => {
        if (e.touches.length !== 2) return;

        e.preventDefault();
        setFitMode("free");

        const dist = getTouchDistance(e.touches);

        if (lastTouchDistance.current) {
            const diff = dist - lastTouchDistance.current;
            setScale((s) => Math.min(3, Math.max(0.5, s + diff / 300)));
        }

        lastTouchDistance.current = dist;
    };

    const onTouchEnd = () => {
        lastTouchDistance.current = null;
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
            <div className="flex justify-between items-center px-4 py-3 bg-indigo-600 text-white">
                <span className="truncate font-semibold">{title}</span>
                <div className="flex gap-2">
                    <div className="flex gap-2 items-center">
                        <button
                            onClick={() => {
                                setFitMode("free");
                                setScale((s) => Math.max(0.5, s - 0.2));
                            }}
                        >
                            <ZoomOut />
                        </button>

                        <button
                            onClick={() => {
                                setFitMode("free");
                                setScale((s) => Math.min(3, s + 0.2));
                            }}
                        >
                            <ZoomIn />
                        </button>

                        <button
                            onClick={() => setFitMode("width")}
                            className={fitMode === "width" ? "text-yellow-300" : ""}
                        >
                            Fit W
                        </button>

                        <button
                            onClick={() => setFitMode("height")}
                            className={fitMode === "height" ? "text-yellow-300" : ""}
                        >
                            Fit H
                        </button>

                        <button onClick={onClose}>
                            <X />
                        </button>
                    </div>
                </div>
            </div>

            <div
                ref={containerRef}
                onDoubleClick={handleDoubleClick}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                className="flex-1 overflow-auto flex justify-center items-start p-6"
            >
                <canvas ref={canvasRef} className="bg-white rounded shadow-xl" />
            </div>

            <div className="flex justify-center gap-4 py-3 text-white">
                <button disabled={pageNum <= 1} onClick={() => setPageNum(p => p - 1)}>
                    <ChevronLeft />
                </button>
                <span>Page {pageNum} / {totalPages}</span>
                <button disabled={pageNum >= totalPages} onClick={() => setPageNum(p => p + 1)}>
                    <ChevronRight />
                </button>
            </div>
        </div>
    );
}
