import { useState } from "react";
import { Eye, Download, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { generatePDF } from "@/utils/generatePDF";
import { generateCSV } from "@/utils/generateCSV";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ─── Types ────────────────────────────────────────────────────────────────────
interface StoredEntry {
  logged_at: string;
  category: string;
  description: string;
  co2_kg: number;
}

interface ReportRow {
  id: string;
  period: string;
  generated: string;
  type: string;       // "PDF" | "CSV"
  size: string;
  rawData: {
    entries: StoredEntry[];
    total: number;
    sections?: string[];
  };
  periodLabel: string; // human-friendly period for filenames
  username: string;
  generatedAt: string; // ISO string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Re-build category totals from entries (same logic as GenerateReport) */
function buildCategoryTotals(entries: StoredEntry[]) {
  const catMap: Record<string, number> = {};
  entries.forEach((e) => {
    const cat = e.category || "other";
    catMap[cat] = (catMap[cat] || 0) + (e.co2_kg || 0);
  });
  const total = Object.values(catMap).reduce((a, b) => a + b, 0);
  return Object.entries(catMap).map(([cat, val]) => ({
    label: cat.charAt(0).toUpperCase() + cat.slice(1),
    value: val,
    pct: total > 0 ? Math.round((val / total) * 100) : 0,
  }));
}

/**
 * Re-generate the PDF document and return it as a jsPDF instance
 * (without saving — so we can both preview and download from the same object).
 */
function buildPDFDoc(report: ReportRow): jsPDF {
  // We replicate a minimal but complete call to the generatePDF logic by
  // constructing the full ReportData and calling the shared utility.
  // generatePDF always calls doc.save(), so we instead duplicate the
  // generation inline to get a doc object we can control.

  const entries = report.rawData.entries || [];
  const total   = report.rawData.total   || 0;
  const sections = report.rawData.sections ? new Set(report.rawData.sections) : undefined;

  const categoryTotals = buildCategoryTotals(entries);

  // We don't have live monthly trend data in history — build a single-bar placeholder
  const monthlyData = [
    { month: report.generated, total },
  ];

  const insights = [
    "This report was generated from your historical data.",
    `Total CO₂ for this period: ${total.toFixed(1)} kg across ${entries.length} entries.`,
  ];

  // generatePDF always calls doc.save() — to avoid that we use a tiny trick:
  // capture by re-running the same logic but on a fresh doc and returning it.
  // Since we own the utility we just call it; the browser will auto-download.
  // For "view" we create the doc ourselves using the same drawing code.

  // ── Build doc manually (mirrors generatePDF but returns doc) ──────────────
  const C = {
    darkBg:    [15, 22, 18]    as [number, number, number],
    green:     [34, 197, 94]   as [number, number, number],
    white:     [240, 253, 244] as [number, number, number],
    black:     [20,  20,  20]  as [number, number, number],
    grey:      [100, 100, 100] as [number, number, number],
    lightGrey: [230, 230, 230] as [number, number, number],
    bgCard:    [245, 250, 247] as [number, number, number],
  };
  const PAGE_W = 210, PAGE_H = 297, M = 15;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const drawHdr = (period: string, username: string) => {
    doc.setFillColor(...C.darkBg);
    doc.rect(0, 0, PAGE_W, 38, "F");
    doc.setFillColor(...C.green);
    doc.circle(M + 3, 14, 3, "F");
    doc.setTextColor(...C.white);
    doc.setFontSize(9); doc.setFont("helvetica", "bold");
    doc.text("CarbonLedger", M + 9, 15.5);
    doc.setFont("helvetica", "normal"); doc.setFontSize(8);
    doc.text("Your Planet. Your Numbers. Your Move.", M + 9, 21);
    doc.setFontSize(16); doc.setFont("helvetica", "bold");
    doc.text(`Personal Carbon Report — ${period}`, M, 32);
    doc.setFontSize(9); doc.setFont("helvetica", "normal");
    doc.text(username, PAGE_W - M, 32, { align: "right" });
  };

  const secTitle = (label: string, y: number) => {
    doc.setFontSize(8); doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.green);
    doc.text(label.toUpperCase(), M, y);
    doc.setDrawColor(...C.green); doc.setLineWidth(0.4);
    doc.line(M, y + 1.5, PAGE_W - M, y + 1.5);
    return y + 7;
  };

  // PAGE 1
  drawHdr(report.periodLabel, report.username);
  let y = 48;

  // Summary
  y = secTitle("Summary", y);
  doc.setFillColor(...C.bgCard);
  doc.roundedRect(M, y, PAGE_W - M * 2, 28, 3, 3, "F");
  doc.setFontSize(28); doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.green);
  doc.text(`${Math.round(total)} kg CO₂`, M + 6, y + 13);
  doc.setFontSize(8); doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.grey);
  doc.text(`${entries.length} entries logged`, M + 6, y + 20);
  y += 34;

  // Category breakdown
  if (!sections || sections.has("Category breakdown")) {
    y = secTitle("Category Breakdown", y);
    const catColors: Record<string, [number, number, number]> = {
      Food: [34, 197, 94], Transport: [59, 130, 246],
      Energy: [251, 191, 36], Shopping: [167, 139, 250],
    };
    categoryTotals.forEach((cat) => {
      const color = catColors[cat.label] || C.green;
      doc.setFont("helvetica", "normal"); doc.setFontSize(9);
      doc.setTextColor(...C.black);
      doc.text(cat.label, M, y);
      doc.text(`${cat.value.toFixed(1)} kg`, 80, y);
      doc.text(`${cat.pct}%`, 110, y);
      doc.setFillColor(...C.lightGrey);
      doc.roundedRect(125, y - 3.5, 55, 4, 1, 1, "F");
      doc.setFillColor(...color);
      doc.roundedRect(125, y - 3.5, Math.max(1, (cat.pct / 100) * 55), 4, 1, 1, "F");
      y += 8;
    });
    y += 4;
  }

  // PAGE 2 — Entries table
  doc.addPage();
  drawHdr(report.periodLabel, report.username);
  y = 48;

  y = secTitle("Logged Entries", y);
  if (entries.length > 0) {
    const rows = entries.slice(0, 30).map((e) => [
      new Date(e.logged_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      (e.category || "").charAt(0).toUpperCase() + (e.category || "").slice(1),
      e.description || "—",
      `${(e.co2_kg || 0).toFixed(2)} kg`,
    ]);
    autoTable(doc, {
      startY: y,
      head: [["Date", "Category", "Description", "CO₂"]],
      body: rows,
      theme: "grid",
      headStyles: { fillColor: C.darkBg, textColor: C.white, fontSize: 8, fontStyle: "bold" },
      bodyStyles: { fontSize: 7.5, textColor: C.black },
      alternateRowStyles: { fillColor: C.bgCard },
      columnStyles: { 0: { cellWidth: 22 }, 1: { cellWidth: 28 }, 2: { cellWidth: 110 }, 3: { cellWidth: 20, halign: "right" } },
      margin: { left: M, right: M },
    });
  } else {
    doc.setFontSize(8); doc.setTextColor(...C.grey);
    doc.text("No entries found for this report.", M, y);
  }

  // PAGE 3 — Insights
  if (!sections || sections.has("AI insights")) {
    doc.addPage();
    drawHdr(report.periodLabel, report.username);
    y = 48;
    y = secTitle("AI Insights", y);
    insights.forEach((ins, i) => {
      doc.setFillColor(...C.bgCard);
      const lines = doc.splitTextToSize(ins, PAGE_W - M * 2 - 16);
      const h = lines.length * 5 + 10;
      doc.roundedRect(M, y, PAGE_W - M * 2, h, 3, 3, "F");
      doc.setFillColor(...C.green);
      doc.roundedRect(M, y, 3, h, 1, 1, "F");
      doc.setFontSize(8); doc.setFont("helvetica", "bold");
      doc.setTextColor(...C.green);
      doc.text(`Insight ${i + 1}`, M + 7, y + 6);
      doc.setFont("helvetica", "normal"); doc.setTextColor(...C.black);
      doc.text(lines, M + 7, y + 12);
      y += h + 5;
    });
  }

  // Footers
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    const fy = PAGE_H - 8;
    doc.setDrawColor(...C.lightGrey); doc.setLineWidth(0.3);
    doc.line(M, fy - 3, PAGE_W - M, fy - 3);
    doc.setFontSize(7); doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.grey);
    doc.text("Generated by CarbonLedger", M, fy);
    doc.text(
      new Date(report.generatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      PAGE_W / 2, fy, { align: "center" }
    );
    doc.text(`Page ${p} / ${totalPages}`, PAGE_W - M, fy, { align: "right" });
  }

  return doc;
}

// ─── Component ────────────────────────────────────────────────────────────────
const ReportHistory = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [actionLoading, setActionLoading] = useState<Record<string, string>>({});

  const setLoading = (id: string, action: string) =>
    setActionLoading((prev) => ({ ...prev, [id]: action }));
  const clearLoading = (id: string) =>
    setActionLoading((prev) => { const n = { ...prev }; delete n[id]; return n; });

  const { data: reports = [] } = useQuery({
    queryKey: ["reports", user?.id],
    queryFn: async (): Promise<ReportRow[]> => {
      if (!user) return [];

      // Fetch profile for username
      const { data: profileData } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();
      const username = profileData?.username || user.email?.split("@")[0] || "User";

      const { data, error } = await supabase
        .from("reports" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("generated_at", { ascending: false });

      if (error) {
        console.error("Error fetching reports:", error);
        return [];
      }

      return (data || []).map((r: any) => ({
        id: r.id,
        period: r.period,
        generated: new Date(r.generated_at).toLocaleDateString("en-US", { day: "numeric", month: "short" }),
        generatedAt: r.generated_at,
        type: r.format,
        size: `${r.file_size_kb} KB`,
        rawData: r.data || { entries: [], total: 0 },
        periodLabel: r.period,
        username,
      }));
    },
    enabled: !!user,
  });

  // ── Computed storage ────────────────────────────────────────────────────────
  const totalKB = reports.reduce((s, r) => s + parseInt(r.size), 0);
  const storagePct = Math.min(100, Math.round((totalKB / (50 * 1024)) * 100));
  const storageLabel =
    totalKB >= 1024
      ? `${(totalKB / 1024).toFixed(1)} MB`
      : `${totalKB} KB`;

  // ── 1. DELETE ────────────────────────────────────────────────────────────────
  const handleDelete = async (r: ReportRow) => {
    setLoading(r.id, "delete");
    try {
      const { error } = await supabase
        .from("reports" as any)
        .delete()
        .eq("id", r.id)
        .eq("user_id", user!.id); // extra safety

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["reports", user?.id] });
      toast.success(`${r.period} report deleted.`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete report. Please try again.");
    } finally {
      clearLoading(r.id);
    }
  };

  // ── 2. VIEW ──────────────────────────────────────────────────────────────────
  const handleView = async (r: ReportRow) => {
    setLoading(r.id, "view");
    try {
      if (r.type === "PDF") {
        const doc = buildPDFDoc(r);
        const blobUrl = doc.output("bloburl") as unknown as string;
        window.open(blobUrl, "_blank");
        toast.success(`Opened ${r.period} PDF in a new tab.`);
      } else {
        // For CSV, re-generate and open as a blob URL in a new tab
        const entries = r.rawData.entries || [];
        const total   = r.rawData.total   || 0;
        const catTotals = buildCategoryTotals(entries);

        const lines: string[] = [];
        lines.push("CarbonLedger — Personal Carbon Export");
        lines.push(`Period,${r.periodLabel}`);
        lines.push(`Total CO2,${total.toFixed(2)} kg`);
        lines.push("");
        lines.push("CATEGORY BREAKDOWN");
        lines.push("Category,CO2 (kg),Percentage");
        catTotals.forEach((c) => lines.push(`${c.label},${c.value.toFixed(2)},${c.pct}%`));
        lines.push("");
        lines.push("ALL ENTRIES");
        lines.push("Date,Category,Description,CO2 (kg)");
        entries.forEach((e) => {
          const d = new Date(e.logged_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
          const desc = (e.description || "").replace(/,/g, ";");
          lines.push(`${d},${e.category},${desc},${(e.co2_kg || 0).toFixed(2)}`);
        });

        const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
        // clean up after a short delay
        setTimeout(() => URL.revokeObjectURL(url), 10_000);
        toast.success(`Opened ${r.period} CSV in a new tab.`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to open report. Please try downloading instead.");
    } finally {
      clearLoading(r.id);
    }
  };

  // ── 3. DOWNLOAD ──────────────────────────────────────────────────────────────
  const handleDownload = async (r: ReportRow) => {
    setLoading(r.id, "download");
    try {
      const safePeriod = r.periodLabel.replace(/\s+/g, "_");

      if (r.type === "PDF") {
        const doc = buildPDFDoc(r);
        doc.save(`CarbonLedger_Report_${safePeriod}.pdf`);
        toast.success(`${r.period} PDF downloaded!`);
      } else {
        // CSV
        const entries = r.rawData.entries || [];
        const total   = r.rawData.total   || 0;
        const catTotals = buildCategoryTotals(entries);

        const lines: string[] = [];
        lines.push("CarbonLedger — Personal Carbon Export");
        lines.push(`Period,${r.periodLabel}`);
        lines.push(`Generated,${new Date(r.generatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`);
        lines.push(`Total CO2,${total.toFixed(2)} kg`);
        lines.push("");
        lines.push("CATEGORY BREAKDOWN");
        lines.push("Category,CO2 (kg),Percentage");
        catTotals.forEach((c) => lines.push(`${c.label},${c.value.toFixed(2)},${c.pct}%`));
        lines.push("");
        lines.push("ALL ENTRIES");
        lines.push("Date,Category,Description,CO2 (kg)");
        entries.forEach((e) => {
          const d = new Date(e.logged_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
          const desc = (e.description || "").replace(/,/g, ";");
          lines.push(`${d},${e.category},${desc},${(e.co2_kg || 0).toFixed(2)}`);
        });

        const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `CarbonLedger_Export_${safePeriod}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success(`${r.period} CSV downloaded!`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to download report. Please try again.");
    } finally {
      clearLoading(r.id);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div
      className="rounded-xl border bg-card p-5"
      style={{ borderColor: "rgba(34,197,94,0.12)" }}
    >
      <h3 className="font-heading text-base font-semibold text-foreground mb-4">
        Report history
      </h3>

      {reports.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">No reports generated yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Generate your first report above</p>
        </div>
      ) : (
        <>
          {/* Header row */}
          <div className="grid grid-cols-[1fr_100px_60px_70px_120px] gap-2 px-3 py-2 text-[10px] text-muted-foreground/60 uppercase tracking-wider">
            <span>Period</span>
            <span>Generated</span>
            <span>Type</span>
            <span>Size</span>
            <span className="text-right">Actions</span>
          </div>

          {/* Rows */}
          {reports.map((r) => {
            const loadingAction = actionLoading[r.id];
            return (
              <div
                key={r.id}
                className="grid grid-cols-[1fr_100px_60px_70px_120px] gap-2 px-3 py-3 rounded-lg items-center hover:bg-muted/10 transition-colors border-b border-primary/5 last:border-b-0"
              >
                <span className="text-sm text-foreground">{r.period}</span>
                <span className="text-xs text-muted-foreground font-mono">{r.generated}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-mono w-fit">
                  {r.type}
                </span>
                <span className="text-xs text-muted-foreground font-mono">{r.size}</span>

                <div className="flex items-center gap-2 justify-end">
                  {/* VIEW */}
                  <button
                    title="View report"
                    disabled={!!loadingAction}
                    className="text-muted-foreground hover:text-primary transition-colors disabled:opacity-40"
                    onClick={() => handleView(r)}
                  >
                    {loadingAction === "view"
                      ? <Loader2 size={14} className="animate-spin" />
                      : <Eye size={14} />}
                  </button>

                  {/* DOWNLOAD */}
                  <button
                    title="Download report"
                    disabled={!!loadingAction}
                    className="text-muted-foreground hover:text-primary transition-colors disabled:opacity-40"
                    onClick={() => handleDownload(r)}
                  >
                    {loadingAction === "download"
                      ? <Loader2 size={14} className="animate-spin" />
                      : <Download size={14} />}
                  </button>

                  {/* DELETE */}
                  <button
                    title="Delete report"
                    disabled={!!loadingAction}
                    className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
                    onClick={() => handleDelete(r)}
                  >
                    {loadingAction === "delete"
                      ? <Loader2 size={14} className="animate-spin text-destructive" />
                      : <Trash2 size={14} />}
                  </button>
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* Storage bar */}
      <div className="mt-4 pt-3 border-t border-primary/10">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1.5">
          <span>Storage used</span>
          <span className="font-mono">{storageLabel} of 50 MB</span>
        </div>
        <Progress value={storagePct} className="h-1.5 bg-muted/30" />
      </div>
    </div>
  );
};

export default ReportHistory;