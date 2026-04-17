import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ScanLine, BellRing, ChefHat, Leaf } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ONBOARDED_KEY = "inventory-pulse:onboarded";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "Welcome — Inventory Pulse" },
      {
        name: "description",
        content: "Get started with Inventory Pulse — track food, prevent waste, cook smarter.",
      },
    ],
  }),
  component: WelcomePage,
});

const slides = [
  {
    icon: ScanLine,
    title: "Track inventory effortlessly",
    body: "Scan barcodes or add items manually. Inventory Pulse keeps your kitchen organized in seconds.",
  },
  {
    icon: BellRing,
    title: "Smart expiry alerts",
    body: "Get timely notifications before food goes bad. A color-coded freshness gauge shows what needs attention.",
  },
  {
    icon: ChefHat,
    title: "AI recipes from what you have",
    body: "Turn what's expiring into delicious meals. Business Mode suggests 15-minute recipes when you're short on time.",
  },
];

function WelcomePage() {
  const navigate = useNavigate();
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  const finish = () => {
    try {
      window.localStorage.setItem(ONBOARDED_KEY, "true");
    } catch {
      /* ignore */
    }
    navigate({ to: "/dashboard", replace: true });
  };

  const isLast = current === slides.length - 1;

  const next = () => {
    if (isLast) finish();
    else api?.scrollNext();
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex items-center justify-between px-5 pt-6">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Leaf className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold tracking-tight">Inventory Pulse</span>
        </div>
        <button
          type="button"
          onClick={finish}
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Skip
        </button>
      </div>

      <div className="flex flex-1 items-center">
        <Carousel setApi={setApi} className="w-full" opts={{ loop: false }}>
          <CarouselContent>
            {slides.map((slide) => {
              const Icon = slide.icon;
              return (
                <CarouselItem key={slide.title}>
                  <div className="flex flex-col items-center gap-6 px-8 py-10 text-center">
                    <div className="flex h-32 w-32 items-center justify-center rounded-full bg-primary/10">
                      <Icon className="h-14 w-14 text-primary" />
                    </div>
                    <div className="space-y-3">
                      <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        {slide.title}
                      </h1>
                      <p className="mx-auto max-w-xs text-base text-muted-foreground">
                        {slide.body}
                      </p>
                    </div>
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>
        </Carousel>
      </div>

      <div className="space-y-6 px-6 pb-10 pt-4">
        <div className="flex items-center justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => api?.scrollTo(i)}
              className={cn(
                "h-2 rounded-full transition-all",
                i === current ? "w-6 bg-primary" : "w-2 bg-muted",
              )}
            />
          ))}
        </div>
        <Button onClick={next} size="lg" className="h-12 w-full text-base font-semibold">
          {isLast ? "Get started" : "Next"}
        </Button>
      </div>
    </div>
  );
}
