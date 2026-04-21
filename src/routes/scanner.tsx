import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import type { Result } from "@zxing/library";
import { ScanLine, Camera, X, Loader2, RefreshCw, Type, Sparkles, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { PageHeader } from "@/components/ui-app/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useAddItem } from "@/hooks/useInventory";
import type { Category } from "@/lib/inventory-data";

export const Route = createFileRoute("/scanner")({
  head: () => ({
    meta: [
      { title: "Scanner — Inventory Pulse" },
      { name: "description", content: "Scan barcodes and expiry dates to add items quickly." },
    ],
  }),
  component: ScannerPage,
});

type Status = "idle" | "starting" | "scanning" | "lookup" | "result" | "error";

interface ScanResult {
  barcode?: string;
  productName?: string;
  productCategory?: string;
  productImage?: string;
}

function ScannerPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const addItem = useAddItem(user?.id);
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const stopFnRef = useRef<(() => void) | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult>({});
  const [manualName, setManualName] = useState("");
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(undefined);
  const [quantity, setQuantity] = useState("1");

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

  const reset = useCallback(() => {
    stopCamera();
    setResult({});
    setManualName("");
    setExpiryDate(undefined);
    setQuantity("1");
    setStatus("idle");
    setError(null);
  }, [stopCamera]);

  const goManual = () => {
    stopCamera();
    navigate({
      to: "/add-item",
      search: { name: "", expiry: "", barcode: "", category: "", imageUrl: "" },
    });
  };

  const handleAdd = async () => {
    if (!user) {
      toast("Sign in required", { description: "Please sign in to add items." });
      return;
    }
    const name = (manualName || result.productName || "").trim();
    if (!name) {
      toast("Name required", { description: "Enter a product name." });
      return;
    }
    if (!expiryDate) {
      toast("Expiry date required", { description: "Pick an expiry date before saving." });
      return;
    }
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      toast("Invalid quantity", { description: "Enter a positive number." });
      return;
    }

    try {
      await addItem.mutateAsync({
        name,
        category: (result.productCategory as Category) || "Other",
        quantity: qty,
        unit: "pcs",
        location: "Fridge",
        expiresAt: expiryDate.toISOString(),
        imageUrl: result.productImage || undefined,
      });
      toast.success("Item added", { description: `${name} is in your inventory.` });
      navigate({
        to: "/inventory",
        search: { q: "", freshness: "all", category: "all", sort: "expiry" },
      });
    } catch (e) {
      toast.error("Could not save", {
        description: e instanceof Error ? e.message : "Try again.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Scanner" description="Scan a barcode, then enter the expiry date" />

      {status === "idle" && (
        <Card className="flex flex-col items-center gap-4 p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <ScanLine className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Ready to scan</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Allow camera access to detect a barcode. You'll enter the expiry date afterwards.
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

      {(status === "starting" || status === "scanning" || status === "lookup") && (
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
              {status === "lookup" && "Looking up product…"}
            </p>
          </div>
        </Card>
      )}

      {status === "result" && (
        <Card className="space-y-4 p-5">
          <div>
            <h2 className="text-base font-semibold text-foreground">Confirm and add</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Review the product, set an expiry date, and save it to your inventory.
            </p>
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

            {result.barcode && (
              <div>
                <Label className="text-xs text-muted-foreground">Barcode</Label>
                <p className="mt-1 rounded-md border border-border bg-muted/40 px-3 py-2 font-mono text-sm">
                  {result.barcode}
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="manual-name">Product name *</Label>
              <Input
                id="manual-name"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                placeholder="e.g. Whole Milk"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Expiry date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "mt-1 w-full justify-start text-left font-normal",
                      !expiryDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {expiryDate ? format(expiryDate, "PPP") : "Pick an expiry date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={expiryDate}
                    onSelect={setExpiryDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="scan-qty">Quantity</Label>
              <Input
                id="scan-qty"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={reset} className="flex-1" disabled={addItem.isPending}>
              <RefreshCw className="h-4 w-4" />
              Scan again
            </Button>
            <Button onClick={handleAdd} className="flex-1" disabled={addItem.isPending}>
              {addItem.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Add to inventory"
              )}
            </Button>
          </div>
          {!user && (
            <p className="text-center text-xs text-muted-foreground">
              Sign in to save items to your inventory.
            </p>
          )}
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
        {status === "lookup" && (
          <span className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </span>
        )}
      </div>
    </div>
  );
}
