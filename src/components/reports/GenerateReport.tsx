import { useState } from "react";
import { FileText, Table, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const periods = ["This Month", "Last Month", "Last 3 Months", "This Year", "Custom"];
const includes = [
  { label: "Overview summary", default: true },
  { label: "Category breakdown", default: true },
  { label: "Daily heatmap", default: true },
  { label: "AI insights", default: true },
  { label: "Challenges", default: true },
  { label: "Household data", default: false },
];

const GenerateReport = () => {
  const [period, setPeriod] = useState("This Month");
  const [selected, setSelected] = useState<Set<string>>(
    new Set(includes.filter((i) => i.default).map((i) => i.label))
  );
  const [format, setFormat] = useState<"pdf" | "csv">("pdf");
  const [loading, setLoading] = useState(false);

  const toggleInclude = (label: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  };

  const generate = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Report generated! Ready to download.");
    }, 1500);
  };

  return (
    <div
      className="rounded-xl border bg-card p-5"
      style={{ borderColor: "rgba(34,197,94,0.12)" }}
    >
      <h3 className="font-heading text-base font-semibold text-foreground mb-5">
        Build your report
      </h3>

      {/* Period */}
      <div className="mb-4">
        <label className="text-xs text-muted-foreground mb-2 block">Period</label>
        <div className="flex flex-wrap gap-2">
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all ${
                period === p
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Include */}
      <div className="mb-4">
        <label className="text-xs text-muted-foreground mb-2 block">Include</label>
        <div className="flex flex-wrap gap-2">
          {includes.map((item) => {
            const active = selected.has(item.label);
            return (
              <button
                key={item.label}
                onClick={() => toggleInclude(item.label)}
                className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all flex items-center gap-1.5 ${
                  active
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "bg-muted/20 text-muted-foreground/60 border border-transparent hover:border-primary/15"
                }`}
              >
                <span className="text-[10px]">{active ? "✓" : "○"}</span>
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Format */}
      <div className="mb-5">
        <label className="text-xs text-muted-foreground mb-2 block">Format</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setFormat("pdf")}
            className={`rounded-xl border p-4 text-left transition-all ${
              format === "pdf"
                ? "border-primary/40 bg-primary/5"
                : "border-primary/10 bg-muted/10 hover:border-primary/20"
            }`}
          >
            <FileText size={20} className={format === "pdf" ? "text-primary" : "text-muted-foreground"} />
            <p className="text-sm font-semibold text-foreground mt-2">PDF</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Beautifully formatted, shareable
            </p>
          </button>
          <button
            onClick={() => setFormat("csv")}
            className={`rounded-xl border p-4 text-left transition-all ${
              format === "csv"
                ? "border-primary/40 bg-primary/5"
                : "border-primary/10 bg-muted/10 hover:border-primary/20"
            }`}
          >
            <Table size={20} className={format === "csv" ? "text-primary" : "text-muted-foreground"} />
            <p className="text-sm font-semibold text-foreground mt-2">CSV</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Raw data for spreadsheets
            </p>
          </button>
        </div>
      </div>

      {/* Generate */}
      <Button
        onClick={generate}
        disabled={loading}
        className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-sm gap-2"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Generating…
          </>
        ) : (
          "Generate Report"
        )}
      </Button>
      <p className="text-[10px] text-muted-foreground/50 text-center mt-2">
        Reports are generated instantly and stored for 30 days
      </p>
    </div>
  );
};

export default GenerateReport;
