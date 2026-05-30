export interface CSVData {
  period: string
  entries: Array<{
    logged_at: string
    category: string
    description: string
    co2_kg: number
  }>
  categoryTotals: Array<{ label: string; value: number; pct: number }>
  total: number
  householdData?: Array<{ memberName: string; role: string; total: number }>
}

function escapeCSV(value: string | number): string {
  const str = String(value)
  // Wrap in quotes if it contains commas, quotes, or newlines
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function row(...cells: (string | number)[]): string {
  return cells.map(escapeCSV).join(",")
}

export const generateCSV = (data: CSVData): void => {
  const lines: string[] = []

  // ── Header ────────────────────────────────────────────
  lines.push("CarbonLedger — Personal Carbon Export")
  lines.push(row("Period", data.period))
  lines.push(row("Generated", new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })))
  lines.push(row("Total CO₂", `${data.total.toFixed(2)} kg`))
  lines.push("")

  // ── Category Breakdown ────────────────────────────────
  lines.push("CATEGORY BREAKDOWN")
  lines.push(row("Category", "CO₂ (kg)", "Percentage"))
  data.categoryTotals.forEach(c => {
    lines.push(row(c.label, c.value.toFixed(2), `${c.pct}%`))
  })
  lines.push("")

  // ── All Entries ───────────────────────────────────────
  lines.push("ALL ENTRIES")
  lines.push(row("Date", "Category", "Description", "CO₂ (kg)"))
  data.entries.forEach(e => {
    const date = new Date(e.logged_at).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric"
    })
    lines.push(row(date, e.category, e.description || "", e.co2_kg?.toFixed(2) ?? "0.00"))
  })
  lines.push("")

  // ── Household Data ────────────────────────────────────
  if (data.householdData && data.householdData.length > 0) {
    lines.push("HOUSEHOLD EMISSIONS")
    lines.push(row("Member", "Role", "Total CO₂ (kg)"))
    data.householdData.forEach(m => {
      lines.push(row(m.memberName, m.role, m.total.toFixed(2)))
    })
    lines.push("")
  }

  // ── Build blob and trigger download ──────────────────
  const csv = lines.join("\n")
  const blob = new Blob(["\uFEFF" + csv, { type: "text/csv;charset=utf-8;" }] as BlobPart[])
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `CarbonLedger_Export_${data.period.replace(/\s+/g, "_")}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
