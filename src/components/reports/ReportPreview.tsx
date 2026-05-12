import { useState } from "react";
import { Download, Link2, Leaf, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { generatePDF } from "@/utils/generatePDF";
import { generateCSV } from "@/utils/generateCSV";

const ReportPreview = () => {
  const { user } = useAuth()
  const [pdfLoading, setPdfLoading] = useState(false)
  const [csvLoading, setCsvLoading] = useState(false)

  const { data: reportData } = useQuery({
    queryKey: ["report-preview", user?.id],
    queryFn: async () => {
      if (!user) return null
      
      // Get current month entries
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const { data: entries } = await supabase
        .from("entries")
        .select("*")
        .eq("user_id", user.id)
        .gte("logged_at", startOfMonth)
      
      // Calculate total
      const total = (entries||[]).reduce((s,e) => s+(e.co2_kg||0), 0)
      
      // Group by category for donut
      const catTotals: Record<string,number> = {}
      ;(entries||[]).forEach(e => {
        const cat = e.category || "other"
        catTotals[cat] = (catTotals[cat]||0) + (e.co2_kg||0)
      })
      const totalCat = Object.values(catTotals).reduce((a,b) => a+b, 0)
      
      const colorMap: Record<string, string> = {
        food: "hsl(142,71%,45%)", 
        transport: "hsl(217,91%,60%)",
        energy: "hsl(38,95%,51%)", 
        shopping: "hsl(255,82%,76%)"
      }
      
      const donutSegments = Object.entries(catTotals).map(([cat,val]) => ({
        label: cat.charAt(0).toUpperCase() + cat.slice(1),
        value: val,
        pct: totalCat > 0 ? Math.round((val/totalCat)*100) : 0,
        color: colorMap[cat] || "hsl(142,71%,45%)"
      }))
      
      // Build heatmap colors for last 28 days
      const dateMap: Record<string,number> = {}
      ;(entries||[]).forEach(e => {
        const day = e.logged_at.slice(0,10)
        dateMap[day] = (dateMap[day]||0) + (e.co2_kg||0)
      })
      const maxDaily = Math.max(...Object.values(dateMap), 1)
      const heatmapColors = Array(28).fill(0).map((_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (27 - i))
        const key = d.toISOString().slice(0,10)
        const val = dateMap[key] || 0
        const intensity = Math.round((val / maxDaily) * 5)
        return `hsl(142,71%,${45 - intensity*7}%)`
      })
      
      // Get last month total for delta
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth()-1, 1).toISOString()
      const { data: lastMonth } = await supabase
        .from("entries")
        .select("co2_kg")
        .eq("user_id", user.id)
        .gte("logged_at", lastMonthStart)
        .lt("logged_at", startOfMonth)
      const lastTotal = (lastMonth||[]).reduce((s,e) => s+(e.co2_kg||0), 0)
      const delta = lastTotal > 0 ? Math.round(((total-lastTotal)/lastTotal)*100) : 0
      
      return { total, delta, donutSegments, heatmapColors, entries: entries || [] }
    },
    enabled: !!user
  })
  
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null
      const { data } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single()
      return data
    },
    enabled: !!user
  })

  // ── Helper: build shared data for both PDF and CSV ────
  const buildExportData = async () => {
    if (!user || !reportData) throw new Error("No data available")

    const now = new Date()

    // Fetch 6-month trend
    const { data: allEntries } = await supabase
      .from("entries")
      .select("*")
      .eq("user_id", user.id)
      .gte("logged_at", new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString())

    const monthlyData = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      const monthKey = d.toISOString().slice(0, 7)
      const monthEntries = (allEntries || []).filter(e => e.logged_at.slice(0, 7) === monthKey)
      const total = monthEntries.reduce((s, e) => s + (e.co2_kg || 0), 0)
      return { month: d.toLocaleDateString("en-US", { month: "short" }), total }
    })

    const username = profile?.username || user.email?.split("@")[0] || "User"
    const period = now.toLocaleDateString("en-US", { month: "long", year: "numeric" })

    return { username, period, monthlyData }
  }

  // ── PDF ───────────────────────────────────────────────
  const handleDownloadPDF = async () => {
    if (!user || !reportData) return
    setPdfLoading(true)
    try {
      const { username, period, monthlyData } = await buildExportData()

      generatePDF({
        username,
        period,
        total: reportData.total,
        delta: reportData.delta,
        entries: reportData.entries,
        categoryTotals: reportData.donutSegments,
        monthlyData,
        insights: [
          "Weekend food emissions are typically 2.3× higher than weekdays. Try meal prepping on Sundays.",
          `You are on track to finish at approximately ${Math.round(reportData.total * 1.1)} kg this month.`,
          "Transport is a key lever — consider combining errands to reduce per-trip emissions.",
        ],
      })
      toast.success("PDF downloaded successfully!")
    } catch {
      toast.error("Failed to generate PDF. Please try again.")
    } finally {
      setPdfLoading(false)
    }
  }

  // ── CSV ───────────────────────────────────────────────
  const handleDownloadCSV = async () => {
    if (!user || !reportData) return
    setCsvLoading(true)
    try {
      const { period } = await buildExportData()

      generateCSV({
        period,
        entries: reportData.entries,
        categoryTotals: reportData.donutSegments,
        total: reportData.total,
      })
      toast.success("CSV downloaded successfully!")
    } catch {
      toast.error("Failed to generate CSV. Please try again.")
    } finally {
      setCsvLoading(false)
    }
  }

  let cumulativeOffset = 0;

  return (
    <div
      className="rounded-xl border bg-card p-5"
      style={{ borderColor: "rgba(34,197,94,0.12)" }}
    >
      <h3 className="font-heading text-base font-semibold text-foreground mb-4">
        {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })} Report
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
            Personal Carbon Report — {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </span>
          <span className="text-[10px] text-muted-foreground">{profile?.username || user?.email?.split("@")[0] || "User"}</span>
        </div>

        {/* 2x2 mini sections */}
        <div className="grid grid-cols-2 gap-3">
          {/* Summary */}
          <div className="rounded-lg bg-muted/20 p-3">
            <p className="text-[10px] text-muted-foreground mb-1">Summary</p>
            <p className="font-mono text-sm font-bold text-foreground">{Math.round(reportData?.total || 0)} kg</p>
            <p className="text-[10px] text-primary font-mono">{reportData?.delta && reportData.delta > 0 ? "+" : ""}{reportData?.delta || 0}% vs last month</p>
            <span className="inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono">
              {(reportData?.total || 0) < 350 ? "On track" : "Over target"}
            </span>
          </div>

          {/* Donut */}
          <div className="rounded-lg bg-muted/20 p-3 flex items-center justify-center">
            <svg viewBox="0 0 36 36" className="w-16 h-16">
              {(reportData?.donutSegments || []).map((seg) => {
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
              {(reportData?.heatmapColors || []).map((c, i) => (
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
        Preview of your {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })} report · {reportData?.entries?.length || 0} entries
      </p>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          className="flex-1 h-9 bg-primary text-primary-foreground hover:bg-primary/90 gap-2 text-xs"
          onClick={handleDownloadPDF}
          disabled={pdfLoading || !reportData}
        >
          {pdfLoading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          {pdfLoading ? "Generating…" : "Download PDF"}
        </Button>
        <Button
          variant="outline"
          className="flex-1 h-9 border-primary/30 text-primary hover:bg-primary/10 gap-2 text-xs"
          onClick={handleDownloadCSV}
          disabled={csvLoading || !reportData}
        >
          {csvLoading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          {csvLoading ? "Exporting…" : "Download CSV"}
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
