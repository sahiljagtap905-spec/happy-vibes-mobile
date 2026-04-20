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
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult>({});
  const [manualName, setManualName] = useState("");

  const stopCamera = useCallback(() => {
    try {
      stopFnRef.current?.();
    } catch {
      /* noop */
    }
    stopFnRef.current = null;
    const stream = videoRef.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((t) => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const startScanning = useCallback(async () => {
    setError(null);
    setStatus("starting");
    setResult({});
    try {
      readerRef.current = new BrowserMultiFormatReader();
      const controls = await readerRef.current.decodeFromVideoDevice(
        undefined,
        videoRef.current!,
        (res: Result | undefined, err) => {
          if (res) {
            setResult((r) => ({ ...r, barcode: res.getText() }));
            setStatus("result");
            controls.stop();
            stopFnRef.current = null;
          }
          // ignore NotFound errors during continuous scanning
          if (err && err.name !== "NotFoundException") {
            // keep scanning
          }
        },
      );
      stopFnRef.current = () => controls.stop();
      setStatus("scanning");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Camera unavailable";
      setError(msg);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const captureForOCR = useCallback(async () => {
    if (!videoRef.current) return;
    setStatus("ocr");
    const video = videoRef.current;
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
    navigate({
      to: "/inventory",
      search: { q: manualName || result.barcode || "", freshness: "all", category: "all", sort: "expiry" },
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
        </Card>
      )}

      {(status === "starting" || status === "scanning" || status === "ocr") && (
        <Card className="overflow-hidden p-0">
          <div className="relative aspect-[3/4] bg-black">
            <video
              ref={videoRef}
              className="absolute inset-0 h-full w-full object-cover"
              playsInline
              muted
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
            </p>
            <Button
              variant="secondary"
              onClick={captureForOCR}
              disabled={status !== "scanning"}
            >
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
            <p className="mt-1 text-sm text-muted-foreground">
              Review and add to your inventory.
            </p>
          </div>

          <div className="grid gap-3">
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
        {status === "ocr" && (
          <span className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </span>
        )}
      </div>
    </div>
  );
}

// Tries common date formats: 12/05/2025, 12-05-2025, 2025-05-12, 12 May 2025, MAY 2025
function extractExpiryDate(text: string): string | null {
  const cleaned = text.replace(/\s+/g, " ");
  const patterns = [
    /\b(\d{4}[-/.]\d{1,2}[-/.]\d{1,2})\b/,
    /\b(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})\b/,
    /\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})\b/i,
    /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})\b/i,
  ];
  for (const p of patterns) {
    const m = cleaned.match(p);
    if (m) return m[1];
  }
  return null;
}
