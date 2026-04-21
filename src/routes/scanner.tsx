import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import type { Result } from "@zxing/library";
import { ScanLine, Camera, X, Loader2, RefreshCw, Type, Sparkles } from "lucide-react";
import Tesseract from "tesseract.js";
import { PageHeader } from "@/components/ui-app/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/scanner")({
  head: () => ({
    meta: [
      { title: "Scanner — Inventory Pulse" },
      { name: "description", content: "Scan barcodes and expiry dates to add items quickly." },
    ],
  }),
  component: ScannerPage,
});

type Status = "idle" | "starting" | "scanning" | "ocr" | "lookup" | "result" | "error";

interface ScanResult {
  barcode?: string;
  expiry?: string;
  raw?: string;
  productName?: string;
  productCategory?: string;
  productImage?: string;
}

function ScannerPage() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const stopFnRef = useRef<(() => void) | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult>({});
  const [manualName, setManualName] = useState("");

  const stopCamera = useCallback(() => {
    // Stop ZXing decoding loop
    try {
      stopFnRef.current?.();
    } catch {
      /* noop */
    }
    stopFnRef.current = null;

    // Stop all tracks on the stream we created
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    } catch {
      /* noop */
    }
    streamRef.current = null;

    // Also stop any tracks bound to the video element (belt & suspenders)
    const videoStream = videoRef.current?.srcObject as MediaStream | null;
    videoStream?.getTracks().forEach((t) => t.stop());
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const lookupBarcode = useCallback(async (barcode: string) => {
    setStatus("lookup");
    try {
      const { data, error } = await supabase.functions.invoke("lookup-product", {
        body: { barcode },
      });
      if (error) throw new Error(error.message);
      if (data?.found && data.product) {
        setResult((r) => ({
          ...r,
          productName: data.product.name ?? undefined,
          productCategory: data.product.category ?? undefined,
          productImage: data.product.imageUrl ?? undefined,
        }));
        if (data.product.name) setManualName(data.product.name);
      } else {
        toast("Product not found", { description: "Enter the name manually below." });
      }
    } catch (e) {
      console.error("OFF lookup failed", e);
      toast("Lookup failed", {
        description: e instanceof Error ? e.message : "Try again",
      });
    } finally {
      setStatus("result");
    }
  }, []);

  const startScanning = useCallback(async () => {
    setError(null);
    setStatus("starting");
    setResult({});
    setManualName("");

    try {
      // STEP A: Check camera API support
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera API not supported in this browser");
      }

      // STEP B: Manually request rear camera stream first
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;

      // STEP C: Attach stream to video element
      if (!videoRef.current) {
        // If video element isn't mounted yet, clean up and bail
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        throw new Error("Video element not ready");
      }

      videoRef.current.srcObject = stream;

      // STEP D: Force playback (iOS / autoplay policies)
      try {
        await videoRef.current.play();
      } catch (playErr) {
        console.warn("Initial play blocked, will retry on metadata:", playErr);
      }

      // STEP E: Grab deviceId from the active track so ZXing reuses the SAME camera
      const videoTrack = stream.getVideoTracks()[0];
      const deviceId = videoTrack?.getSettings().deviceId;

      // STEP F: Let ZXing decode frames from the same video element / device
      readerRef.current = new BrowserMultiFormatReader();
      const controls = await readerRef.current.decodeFromVideoDevice(
        deviceId ?? undefined,
        videoRef.current,
        (res: Result | undefined, err) => {
          if (res) {
            const code = res.getText();
            setResult((r) => ({ ...r, barcode: code }));
            // Stop decoding loop, but keep video alive briefly
            try {
              controls.stop();
            } catch {
              /* noop */
            }
            stopFnRef.current = null;
            void lookupBarcode(code);
          }
          // Ignore NotFoundException — it just means "no barcode this frame"
          if (err && err.name && err.name !== "NotFoundException") {
            // keep scanning; optionally log
            // console.debug("decode err:", err.name);
          }
        },
      );

      stopFnRef.current = () => {
        try {
          controls.stop();
        } catch {
          /* noop */
        }
      };
      setStatus("scanning");
    } catch (e) {
      console.error("Camera start failed:", e);
      // Make sure we don't leak a stream
      try {
        streamRef.current?.getTracks().forEach((t) => t.stop());
      } catch {
        /* noop */
      }
      streamRef.current = null;

      const err = e as Error & { name?: string };
      const msg =
        err.name === "NotAllowedError"
          ? "Camera permission denied. Please allow camera access in your browser settings."
          : err.name === "NotFoundError"
            ? "No camera found on this device."
            : err.name === "NotReadableError"
              ? "Camera is in use by another app. Close other apps and try again."
              : err.name === "OverconstrainedError"
                ? "No camera matches the requested settings."
                : err.message || "Camera unavailable";
      setError(msg);
      setStatus("error");
    }
  }, [lookupBarcode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const captureForOCR = useCallback(async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    if (!video.videoWidth || !video.videoHeight) {
      toast("Video not ready", { description: "Wait a moment and try again." });
      return;
    }

    setStatus("ocr");
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setStatus("scanning");
      return;
    }
    ctx.drawImage(video, 0, 0);

    try {
      const { data } = await Tesseract.recognize(canvas, "eng");
      const expiry = extractExpiryDate(data.text);
      setResult((r) => ({ ...r, expiry: expiry ?? undefined, raw: data.text }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "OCR failed");
    } finally {
      setStatus("result");
      stopCamera();
    }
  }, [stopCamera]);

  const reset = useCallback(() => {
    stopCamera();
    setResult({});
    setStatus("idle");
    setError(null);
  }, [stopCamera]);

  const goAdd = () => {
    stopCamera();
    const expiryISO = result.expiry ? normalizeExpiryToISO(result.expiry) : "";
    navigate({
      to: "/inventory/add",
      search: {
        name: manualName || result.productName || "",
        expiry: expiryISO,
        barcode: result.barcode || "",
        category: result.productCategory || "",
        imageUrl: result.productImage || "",
      },
    });
  };

  const goManual = () => {
    stopCamera();
    navigate({
      to: "/inventory/add",
      search: { name: "", expiry: "", barcode: "", category: "", imageUrl: "" },
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Scanner" description="Point your camera at a barcode or expiry date" />

      {status === "idle" && (
        <Card className="flex flex-col items-center gap-4 p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <ScanLine className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Ready to scan</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Allow camera access to detect barcodes. Then capture expiry text with OCR.
            </p>
          </div>
          <Button onClick={startScanning} className="w-full max-w-xs">
            <Camera className="h-4 w-4" />
            Start camera
          </Button>
          <Button onClick={goManual} variant="outline" className="w-full max-w-xs">
            <Type className="h-4 w-4" />
            Enter manually
          </Button>
        </Card>
      )}

      {(status === "starting" ||
        status === "scanning" ||
        status === "ocr" ||
        status === "lookup") && (
        <Card className="overflow-hidden p-0">
          <div className="relative aspect-[3/4] bg-black">
            <video
              ref={videoRef}
              className="absolute inset-0 h-full w-full object-cover"
              autoPlay
              playsInline
              muted
              onLoadedMetadata={(e) => {
                const video = e.currentTarget;
                video.play().catch((err) => {
                  console.error("Video play failed:", err);
                  setError("Could not start video playback. Tap 'Start camera' again.");
                });
              }}
            />
            <ScannerOverlay status={status} />
            <button
              onClick={reset}
              aria-label="Close scanner"
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition-colors hover:bg-black/70"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex flex-col gap-2 p-4">
            <p className="text-center text-xs text-muted-foreground">
              {status === "scanning" && "Searching for a barcode…"}
              {status === "starting" && "Starting camera…"}
              {status === "ocr" && "Reading text…"}
              {status === "lookup" && "Looking up product…"}
            </p>
            <Button variant="secondary" onClick={captureForOCR} disabled={status !== "scanning"}>
              <Type className="h-4 w-4" />
              Capture expiry text (OCR)
            </Button>
          </div>
        </Card>
      )}

      {status === "result" && (
        <Card className="space-y-4 p-5">
          <div>
            <h2 className="text-base font-semibold text-foreground">Scan result</h2>
            <p className="mt-1 text-sm text-muted-foreground">Review and add to your inventory.</p>
          </div>

          <div className="grid gap-3">
            {result.productName && (
              <div className="flex items-start gap-3 rounded-lg border border-fresh/30 bg-fresh/5 p-3">
                {result.productImage ? (
                  <img
                    src={result.productImage}
                    alt={result.productName}
                    className="h-14 w-14 rounded-md object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-md bg-muted text-2xl">
                    📦
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-fresh">
                    <Sparkles className="h-3 w-3" /> Found via Open Food Facts
                  </p>
                  <p className="truncate text-sm font-semibold text-foreground">
                    {result.productName}
                  </p>
                  {result.productCategory && (
                    <p className="text-xs text-muted-foreground">{result.productCategory}</p>
                  )}
                </div>
              </div>
            )}
            <div>
              <Label className="text-xs text-muted-foreground">Barcode</Label>
              <p className="mt-1 rounded-md border border-border bg-muted/40 px-3 py-2 font-mono text-sm">
                {result.barcode ?? "Not detected"}
              </p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Detected expiry</Label>
              <p className="mt-1 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
                {result.expiry ?? "—"}
              </p>
            </div>
            <div>
              <Label htmlFor="manual-name" className="text-xs text-muted-foreground">
                Item name
              </Label>
              <Input
                id="manual-name"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                placeholder="e.g. Whole Milk"
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={reset} className="flex-1">
              <RefreshCw className="h-4 w-4" />
              Scan again
            </Button>
            <Button onClick={goAdd} className="flex-1">
              Add to inventory
            </Button>
          </div>
        </Card>
      )}

      {status === "error" && (
        <Card className="space-y-3 p-5 text-center">
          <p className="text-sm font-medium text-destructive">Camera error</p>
          <p className="text-xs text-muted-foreground">{error}</p>
          <Button onClick={reset} variant="outline">
            Try again
          </Button>
        </Card>
      )}
    </div>
  );
}

function ScannerOverlay({ status }: { status: Status }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div className="relative h-48 w-64 rounded-2xl border-2 border-primary/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]">
        <span className="absolute -left-0.5 -top-0.5 h-6 w-6 rounded-tl-2xl border-l-4 border-t-4 border-primary" />
        <span className="absolute -right-0.5 -top-0.5 h-6 w-6 rounded-tr-2xl border-r-4 border-t-4 border-primary" />
        <span className="absolute -bottom-0.5 -left-0.5 h-6 w-6 rounded-bl-2xl border-b-4 border-l-4 border-primary" />
        <span className="absolute -bottom-0.5 -right-0.5 h-6 w-6 rounded-br-2xl border-b-4 border-r-4 border-primary" />
        {status === "scanning" && (
          <span className="absolute left-2 right-2 top-1/2 h-0.5 -translate-y-1/2 animate-pulse bg-primary" />
        )}
        {(status === "ocr" || status === "lookup") && (
          <span className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </span>
        )}
      </div>
    </div>
  );
}

// Tries common date formats and returns the matched raw string.
function extractExpiryDate(text: string): string | null {
  const cleaned = text.replace(/\s+/g, " ");
  const patterns = [
    /\b(\d{4}[-/.]\d{1,2}[-/.]\d{1,2})\b/, // 2025-05-12
    /\b(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})\b/, // 12/05/2025 or 12/05/25
    /\b(\d{1,2}[-/.]\d{4})\b/, // 05/2025 (MM/YYYY)
    /\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})\b/i,
    /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})\b/i,
  ];
  for (const p of patterns) {
    const m = cleaned.match(p);
    if (m) return m[1];
  }
  return null;
}

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

// Normalize a detected expiry string to ISO (YYYY-MM-DD). Returns "" if invalid.
export function normalizeExpiryToISO(raw: string): string {
  if (!raw) return "";
  const s = raw.trim();

  // ISO YYYY-MM-DD or YYYY/MM/DD
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (m) return buildISO(+m[1], +m[2], +m[3]);

  // DD/MM/YYYY (assume non-US)
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
  if (m) {
    let y = +m[3];
    if (y < 100) y += 2000;
    return buildISO(y, +m[2], +m[1]);
  }

  // MM/YYYY -> last day of month
  m = s.match(/^(\d{1,2})[-/.](\d{4})$/);
  if (m) {
    const month = +m[1];
    const year = +m[2];
    if (month < 1 || month > 12) return "";
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    return buildISO(year, month, lastDay);
  }

  // 12 May 2025
  m = s.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{2,4})$/);
  if (m) {
    const month = MONTHS[m[2].slice(0, 3).toLowerCase()];
    if (month === undefined) return "";
    let y = +m[3];
    if (y < 100) y += 2000;
    return buildISO(y, month + 1, +m[1]);
  }

  // May 2025 -> last day of month
  m = s.match(/^([A-Za-z]+)\s+(\d{2,4})$/);
  if (m) {
    const month = MONTHS[m[1].slice(0, 3).toLowerCase()];
    if (month === undefined) return "";
    let y = +m[2];
    if (y < 100) y += 2000;
    const lastDay = new Date(Date.UTC(y, month + 1, 0)).getUTCDate();
    return buildISO(y, month + 1, lastDay);
  }

  return "";
}

function buildISO(year: number, month: number, day: number): string {
  if (month < 1 || month > 12 || day < 1 || day > 31) return "";
  const d = new Date(Date.UTC(year, month - 1, day));
  if (
    d.getUTCFullYear() !== year ||
    d.getUTCMonth() !== month - 1 ||
    d.getUTCDate() !== day
  ) {
    return "";
  }
  return d.toISOString();
}
