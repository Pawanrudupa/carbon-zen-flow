import { Eye, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

const reports = [
  { period: "March 2026", generated: "1 Apr", type: "PDF", size: "284 KB" },
  { period: "Feb 2026", generated: "2 Mar", type: "PDF", size: "271 KB" },
  { period: "Q1 2026", generated: "31 Mar", type: "PDF", size: "890 KB" },
  { period: "Jan 2026", generated: "1 Feb", type: "CSV", size: "48 KB" },
];

const ReportHistory = () => {
  return (
    <div
      className="rounded-xl border bg-card p-5"
      style={{ borderColor: "rgba(34,197,94,0.12)" }}
    >
      <h3 className="font-heading text-base font-semibold text-foreground mb-4">
        Report history
      </h3>

      {/* Header row */}
      <div className="grid grid-cols-[1fr_100px_60px_70px_120px] gap-2 px-3 py-2 text-[10px] text-muted-foreground/60 uppercase tracking-wider">
        <span>Period</span>
        <span>Generated</span>
        <span>Type</span>
        <span>Size</span>
        <span className="text-right">Actions</span>
      </div>

      {/* Rows */}
      {reports.map((r) => (
        <div
          key={r.period}
          className="grid grid-cols-[1fr_100px_60px_70px_120px] gap-2 px-3 py-3 rounded-lg items-center hover:bg-muted/10 transition-colors border-b border-primary/5 last:border-b-0"
        >
          <span className="text-sm text-foreground">{r.period}</span>
          <span className="text-xs text-muted-foreground font-mono">{r.generated}</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-mono w-fit">
            {r.type}
          </span>
          <span className="text-xs text-muted-foreground font-mono">{r.size}</span>
          <div className="flex items-center gap-2 justify-end">
            <button
              className="text-muted-foreground hover:text-primary transition-colors"
              onClick={() => toast.info(`Viewing ${r.period} report`)}
            >
              <Eye size={14} />
            </button>
            <button
              className="text-muted-foreground hover:text-primary transition-colors"
              onClick={() => toast.success(`${r.period} report downloaded!`)}
            >
              <Download size={14} />
            </button>
            <button
              className="text-muted-foreground hover:text-destructive transition-colors"
              onClick={() => toast.error(`${r.period} report deleted`)}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}

      {/* Storage */}
      <div className="mt-4 pt-3 border-t border-primary/10">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1.5">
          <span>Storage used</span>
          <span className="font-mono">1.5 MB of 50 MB</span>
        </div>
        <Progress value={3} className="h-1.5 bg-muted/30" />
      </div>
    </div>
  );
};

export default ReportHistory;
