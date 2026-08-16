"use client";

import {
  ChevronLeft,
  ChevronRight,
  FileWarning,
  Loader2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

type Props = {
  fileUrl: string;
  title: string;
  initialPage?: number | null;
  onPageChange?: (pageNo: number, pageCount: number) => void;
  onReady?: (pageCount: number) => void;
};

type PdfDocumentProxy = {
  numPages: number;
  getPage: (pageNo: number) => Promise<any>;
  destroy?: () => Promise<void>;
};

export default function EmployeeDocumentPdfReader({
  fileUrl,
  title,
  initialPage,
  onPageChange,
  onReady,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pdfRef = useRef<PdfDocumentProxy | null>(null);
  const renderTaskRef = useRef<any>(null);

  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState("");
  const [pageNo, setPageNo] = useState(
    Math.max(1, Number(initialPage || 1))
  );
  const [pageCount, setPageCount] = useState(0);
  const [scale, setScale] = useState(1.2);

  const renderPage = useCallback(
    async (targetPage: number, targetScale = scale) => {
      const pdf = pdfRef.current;
      const canvas = canvasRef.current;

      if (!pdf || !canvas) return;

      const safePage = Math.min(
        Math.max(1, targetPage),
        pdf.numPages
      );

      try {
        setRendering(true);

        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
          } catch {}
          renderTaskRef.current = null;
        }

        const page = await pdf.getPage(safePage);
        const viewport = page.getViewport({
          scale: targetScale,
        });

        const outputScale = Math.max(
          1,
          Math.min(2, window.devicePixelRatio || 1)
        );

        const context = canvas.getContext("2d");

        if (!context) {
          throw new Error("PDF canvas hazırlanamadı.");
        }

        canvas.width = Math.floor(
          viewport.width * outputScale
        );
        canvas.height = Math.floor(
          viewport.height * outputScale
        );

        canvas.style.width = `${Math.floor(
          viewport.width
        )}px`;
        canvas.style.height = `${Math.floor(
          viewport.height
        )}px`;

        const renderContext = {
          canvasContext: context,
          viewport,
          transform:
            outputScale !== 1
              ? [outputScale, 0, 0, outputScale, 0, 0]
              : undefined,
        };

        const task = page.render(renderContext);
        renderTaskRef.current = task;

        await task.promise;

        renderTaskRef.current = null;
        setPageNo(safePage);
        onPageChange?.(safePage, pdf.numPages);
      } catch (cause: any) {
        if (
          cause?.name !== "RenderingCancelledException"
        ) {
          setError(
            cause instanceof Error
              ? cause.message
              : "PDF sayfası görüntülenemedi."
          );
        }
      } finally {
        setRendering(false);
      }
    },
    [onPageChange, scale]
  );

  useEffect(() => {
    let disposed = false;

    void (async () => {
      try {
        setLoading(true);
        setError("");

        const pdfjs = await import("pdfjs-dist");

        pdfjs.GlobalWorkerOptions.workerSrc =
          `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

        const loadingTask = pdfjs.getDocument({
          url: fileUrl,
          withCredentials: true,
        });

        const pdf =
          (await loadingTask.promise) as PdfDocumentProxy;

        if (disposed) {
          await pdf.destroy?.();
          return;
        }

        pdfRef.current = pdf;
        setPageCount(pdf.numPages);
        onReady?.(pdf.numPages);

        const firstPage = Math.min(
          Math.max(1, Number(initialPage || 1)),
          pdf.numPages
        );

        await renderPage(firstPage);
      } catch (cause) {
        if (!disposed) {
          setError(
            cause instanceof Error
              ? cause.message
              : "PDF yüklenemedi."
          );
        }
      } finally {
        if (!disposed) {
          setLoading(false);
        }
      }
    })();

    return () => {
      disposed = true;

      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {}
      }

      const pdf = pdfRef.current;
      pdfRef.current = null;

      if (pdf?.destroy) {
        void pdf.destroy();
      }
    };
  }, [fileUrl, initialPage, onReady, renderPage]);

  const goPrevious = () => {
    if (pageNo <= 1 || rendering) return;
    void renderPage(pageNo - 1);
  };

  const goNext = () => {
    if (
      pageCount <= 0 ||
      pageNo >= pageCount ||
      rendering
    ) {
      return;
    }

    void renderPage(pageNo + 1);
  };

  const changeScale = (nextScale: number) => {
    const safeScale = Math.max(
      0.7,
      Math.min(2.2, nextScale)
    );

    setScale(safeScale);
    void renderPage(pageNo, safeScale);
  };

  if (error) {
    return (
      <div style={errorStyle}>
        <FileWarning size={28} />
        <strong>PDF görüntülenemedi.</strong>
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div style={readerShell}>
      <div style={toolbar}>
        <div style={toolbarGroup}>
          <button
            type="button"
            onClick={goPrevious}
            disabled={pageNo <= 1 || rendering}
            style={toolButton}
            title="Önceki sayfa"
          >
            <ChevronLeft size={18} />
          </button>

          <strong style={pageIndicator}>
            {pageNo} / {pageCount || "-"}
          </strong>

          <button
            type="button"
            onClick={goNext}
            disabled={
              rendering ||
              pageCount <= 0 ||
              pageNo >= pageCount
            }
            style={toolButton}
            title="Sonraki sayfa"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div style={toolbarTitle}>{title}</div>

        <div style={toolbarGroup}>
          <button
            type="button"
            onClick={() =>
              changeScale(scale - 0.1)
            }
            style={toolButton}
            title="Uzaklaştır"
          >
            <ZoomOut size={17} />
          </button>

          <span style={zoomLabel}>
            %{Math.round(scale * 100)}
          </span>

          <button
            type="button"
            onClick={() =>
              changeScale(scale + 0.1)
            }
            style={toolButton}
            title="Yakınlaştır"
          >
            <ZoomIn size={17} />
          </button>
        </div>
      </div>

      <div style={canvasViewport}>
        {loading ? (
          <div style={loadingStyle}>
            <Loader2 size={24} />
            PDF hazırlanıyor...
          </div>
        ) : null}

        <canvas
          ref={canvasRef}
          style={{
            display: loading ? "none" : "block",
            maxWidth: "none",
            background: "#ffffff",
            boxShadow:
              "0 8px 30px rgba(15,23,42,.14)",
          }}
        />
      </div>
    </div>
  );
}

const readerShell: React.CSSProperties = {
  minHeight: 720,
  display: "grid",
  gridTemplateRows: "auto 1fr",
  background: "#e2e8f0",
};

const toolbar: React.CSSProperties = {
  minHeight: 52,
  display: "grid",
  gridTemplateColumns: "auto minmax(0,1fr) auto",
  alignItems: "center",
  gap: 12,
  padding: "7px 10px",
  background: "#0f172a",
  color: "#ffffff",
};

const toolbarGroup: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 7,
};

const toolbarTitle: React.CSSProperties = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  textAlign: "center",
  fontSize: 12,
  fontWeight: 800,
  color: "#cbd5e1",
};

const toolButton: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 8,
  border: "1px solid #334155",
  background: "#1e293b",
  color: "#ffffff",
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
};

const pageIndicator: React.CSSProperties = {
  minWidth: 62,
  textAlign: "center",
  fontSize: 12,
};

const zoomLabel: React.CSSProperties = {
  minWidth: 48,
  textAlign: "center",
  fontSize: 11,
  color: "#cbd5e1",
  fontWeight: 800,
};

const canvasViewport: React.CSSProperties = {
  minHeight: 668,
  overflow: "auto",
  padding: 20,
  display: "grid",
  justifyContent: "center",
  alignContent: "start",
};

const loadingStyle: React.CSSProperties = {
  minHeight: 500,
  display: "grid",
  placeItems: "center",
  alignContent: "center",
  gap: 9,
  color: "#475569",
  fontWeight: 800,
};

const errorStyle: React.CSSProperties = {
  minHeight: 620,
  display: "grid",
  placeItems: "center",
  alignContent: "center",
  gap: 9,
  textAlign: "center",
  padding: 30,
  background: "#fef2f2",
  color: "#b91c1c",
};