import { createFileRoute } from "@tanstack/react-router";
import { ScanLine } from "lucide-react";
import { PageHeader } from "@/components/ui-app/PageHeader";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/scanner")({
  head: () => ({
    meta: [
      { title: "Scanner — Inventory Pulse" },
      { name: "description", content: "Scan barcodes to add items quickly." },
    ],
  }),
  component: ScannerPage,
});

function ScannerPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Scanner" description="Point your camera at a barcode" />
      <Card className="flex flex-col items-center gap-3 p-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <ScanLine className="h-6 w-6 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">
          Camera scanner coming soon.
        </p>
      </Card>
    </div>
  );
}
