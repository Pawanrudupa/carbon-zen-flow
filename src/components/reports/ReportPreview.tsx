import { Download, Link2, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const heatmapColors = [
  "hsl(142,71%,45%)", "hsl(142,71%,35%)", "hsl(142,71%,25%)", "hsl(142,71%,15%)",
  "hsl(142,71%,40%)", "hsl(142,71%,30%)", "hsl(142,71%,20%)",
  "hsl(142,71%,45%)", "hsl(142,71%,38%)", "hsl(142,71%,28%)", "hsl(142,71%,18%)",
  "hsl(142,71%,42%)", "hsl(142,71%,32%)", "hsl(142,71%,22%)",
  "hsl(142,71%,45%)", "hsl(142,71%,36%)", "hsl(142,71%,26%)", "hsl(142,71%,16%)",
  "hsl(142,71%,44%)", "hsl(142,71%,34%)", "hsl(142,71%,24%)",
  "hsl(142,71%,41%)", "hsl(142,71%,31%)", "hsl(142,71%,21%)", "hsl(142,71%,11%)",
  "hsl(142,71%,39%)", "hsl(142,71%,29%)", "hsl(142,71%,19%)",
];

const donutSegments = [
  { pct: 38, color: "hsl(142,71%,45%)", label: "Food" },
  { pct: 29, color: "hsl(217,91%,60%)", label: "Transport" },
  { pct: 22, color: "hsl(38,95%,51%)", label: "Energy" },
  { pct: 11, color: "hsl(255,82%,76%)", label: "Shopping" },
];

const ReportPreview = () => {
  let cumulativeOffset = 0;

  return (
    <div
      className="rounded-xl border bg-card p-5"
      style={{ borderColor: "rgba(34,197,94,0.12)" }}
    >
      <h3 className="font-heading text-base font-semibold text-foreground mb-4">
        April 2026 Report
      </h3>

      {/* Document preview */}
      <div
        className="rounded-lg p-5"
        style={{ background: "rgba(34,197,94,0.03)", border: "1px solid rgba(34,197,94,0.08)" }}
      >
        {/* Doc header */}
        <div className="flex items-center justify-between border-b border-primary/10 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Leaf size={14} className="text-primary" />
            <span className="text-xs font-heading font-semibold text-foreground">CarbonLedger</span>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground">
            Personal Carbon Report — April 2026
          </span>
          <span className="text-[10px] text-muted-foreground">Alex Chen</span>
        </div>

        {/* 2x2 mini sections */}
        <div className="grid grid-cols-2 gap-3">
          {/* Summary */}
          <div className="rounded-lg bg-muted/20 p-3">
            <p className="text-[10px] text-muted-foreground mb-1">Summary</p>
            <p className="font-mono text-sm font-bold text-foreground">312 kg</p>
            <p className="text-[10px] text-primary font-mono">-18% vs last month</p>
            <span className="inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono">
              On track
            </span>
          </div>

          {/* Donut */}
          <div className="rounded-lg bg-muted/20 p-3 flex items-center justify-center">
            <svg viewBox="0 0 36 36" className="w-16 h-16">
              {donutSegments.map((seg) => {
                const offset = cumulativeOffset;
                cumulativeOffset += seg.pct;
                return (
                  <circle
                    key={seg.label}
                    cx="18"
                    cy="18"
                    r="15.9"
                    fill="none"
                    stroke={seg.color}
                    strokeWidth="3"
                    strokeDasharray={`${seg.pct} ${100 - seg.pct}`}
                    strokeDashoffset={-offset}
                    className="transition-all"
                  />
                );
              })}
            </svg>
          </div>

          {/* Mini heatmap */}
          <div className="rounded-lg bg-muted/20 p-3">
            <p className="text-[10px] text-muted-foreground mb-1.5">Activity</p>
            <div className="grid grid-cols-7 gap-[2px]">
              {heatmapColors.map((c, i) => (
                <div key={i} className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>

          {/* Insight */}
          <div className="rounded-lg bg-muted/20 p-3">
            <p className="text-[10px] text-muted-foreground mb-1">Top insight</p>
            <p className="text-[10px] text-foreground leading-relaxed">
              Weekend food emissions <span className="font-mono text-[hsl(var(--warning))]">2.3×</span> higher
              than weekdays
            </p>
          </div>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground/50 text-center mt-3 mb-4">
        This is a preview of your April 2026 report
      </p>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          className="flex-1 h-9 bg-primary text-primary-foreground hover:bg-primary/90 gap-2 text-xs"
          onClick={() => toast.success("PDF downloaded!")}
        >
          <Download size={14} />
          Download PDF
        </Button>
        <Button
          variant="outline"
          className="flex-1 h-9 border-primary/30 text-primary hover:bg-primary/10 gap-2 text-xs"
          onClick={() => toast.success("CSV downloaded!")}
        >
          <Download size={14} />
          Download CSV
        </Button>
        <Button
          variant="outline"
          className="h-9 border-primary/30 text-primary hover:bg-primary/10 gap-2 text-xs px-4"
          onClick={() => {
            navigator.clipboard.writeText("https://carbonledger.app/report/apr-2026-axch");
            toast.success("Report link copied!");
          }}
        >
          <Link2 size={14} />
          Share
        </Button>
      </div>
    </div>
  );
};

export default ReportPreview;
