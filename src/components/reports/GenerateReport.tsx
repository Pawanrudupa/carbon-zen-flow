import { useState } from "react";
import { FileText, Table, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { generatePDF } from "@/utils/generatePDF";
import { generateCSV } from "@/utils/generateCSV";

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
  const { user } = useAuth();
  const queryClient = useQueryClient();

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

  // ── Date range helper ─────────────────────────────────
  const getDateRange = (p: string): { startDate: string; endDate: string } => {
    const now = new Date();
    let startDate: string;
    let endDate: string = now.toISOString();

    switch (p) {
      case "This Month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        break;
      case "Last Month":
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
        endDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        break;
      case "Last 3 Months": {
        const d = new Date();
        d.setMonth(d.getMonth() - 3);
        startDate = d.toISOString();
        break;
      }
      case "This Year":
        startDate = new Date(now.getFullYear(), 0, 1).toISOString();
        break;
      default:
        startDate = new Date(2020, 0, 1).toISOString();
    }

    return { startDate, endDate };
  };

  // ── Period label for file names ───────────────────────
  const getPeriodLabel = (p: string): string => {
    const now = new Date();
    switch (p) {
      case "This Month":
        return now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      case "Last Month": {
        const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      }
      case "Last 3 Months":
        return `Last 3 Months (${now.toLocaleDateString("en-US", { month: "short", year: "numeric" })})`;
      case "This Year":
        return `${now.getFullYear()} Annual`;
      default:
        return p;
    }
  };

  const generate = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { startDate, endDate } = getDateRange(period);
      const periodLabel = getPeriodLabel(period);
      const now = new Date();

      // Fetch entries for the period
      let query = supabase
        .from("entries")
        .select("*")
        .eq("user_id", user.id)
        .gte("logged_at", startDate)
        .order("logged_at", { ascending: false });

      if (period === "Last Month") {
        query = query.lt("logged_at", endDate);
      }

      const { data: entries, error: entriesError } = await query;
      if (entriesError) throw entriesError;

      const total = (entries || []).reduce((s: number, e: any) => s + (e.co2_kg || 0), 0);

      // Build category totals
      const catTotals: Record<string, number> = {};
      (entries || []).forEach((e: any) => {
        const cat = e.category || "other";
        catTotals[cat] = (catTotals[cat] || 0) + (e.co2_kg || 0);
      });
      const totalCat = Object.values(catTotals).reduce((a, b) => a + b, 0);
      const categoryTotals = Object.entries(catTotals).map(([cat, val]) => ({
        label: cat.charAt(0).toUpperCase() + cat.slice(1),
        value: val,
        pct: totalCat > 0 ? Math.round((val / totalCat) * 100) : 0,
      }));

      // Fetch 6-month trend
      const { data: trendEntries } = await supabase
        .from("entries")
        .select("logged_at, co2_kg")
        .eq("user_id", user.id)
        .gte("logged_at", new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString());

      const monthlyData = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        const monthKey = d.toISOString().slice(0, 7);
        const monthEntries = (trendEntries || []).filter((e: any) => e.logged_at.slice(0, 7) === monthKey);
        const mTotal = monthEntries.reduce((s: number, e: any) => s + (e.co2_kg || 0), 0);
        return { month: d.toLocaleDateString("en-US", { month: "short" }), total: mTotal };
      });

      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();

      const username = profileData?.username || user.email?.split("@")[0] || "User";

      // Fetch last period total for delta
      const prevStart = new Date(new Date(startDate).getTime() - (new Date(endDate).getTime() - new Date(startDate).getTime())).toISOString();
      const { data: prevEntries } = await supabase
        .from("entries")
        .select("co2_kg")
        .eq("user_id", user.id)
        .gte("logged_at", prevStart)
        .lt("logged_at", startDate);
      const prevTotal = (prevEntries || []).reduce((s: number, e: any) => s + (e.co2_kg || 0), 0);
      const delta = prevTotal > 0 ? Math.round(((total - prevTotal) / prevTotal) * 100) : 0;

      // Save report record
      const { error: saveError } = await supabase
        .from("reports" as any)
        .insert({
          user_id: user.id,
          period,
          format: format.toUpperCase(),
          file_size_kb: Math.round(total * 0.9 + 100),
          data: { entries, total, sections: Array.from(selected) },
        });
      if (saveError) throw saveError;

      queryClient.invalidateQueries({ queryKey: ["reports"] });

      // Trigger download
      if (format === "pdf") {
        generatePDF({
          username,
          period: periodLabel,
          total,
          delta,
          entries: entries || [],
          categoryTotals,
          monthlyData,
          insights: [
            "Weekend food emissions are typically 2.3× higher than weekdays. Try meal prepping on Sundays.",
            `You logged ${(entries || []).length} entries over this period, averaging ${((entries || []).length / 30).toFixed(1)} entries per day.`,
            "Transport is a key lever — consider combining errands to reduce per-trip emissions.",
          ],
          includeSections: selected,
        });
        toast.success("PDF generated and downloaded!");
      } else {
        generateCSV({
          period: periodLabel,
          entries: entries || [],
          categoryTotals,
          total,
        });
        toast.success("CSV generated and downloaded!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate report. Please try again.");
    } finally {
      setLoading(false);
    }
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
              className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all ${period === p
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
                className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all flex items-center gap-1.5 ${active
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
            className={`rounded-xl border p-4 text-left transition-all ${format === "pdf"
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
            className={`rounded-xl border p-4 text-left transition-all ${format === "csv"
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
          `Generate & Download ${format.toUpperCase()}`
        )}
      </Button>
      <p className="text-[10px] text-muted-foreground/50 text-center mt-2">
        Reports are generated instantly and stored for 30 days
      </p>
    </div>
  );
};

export default GenerateReport;
