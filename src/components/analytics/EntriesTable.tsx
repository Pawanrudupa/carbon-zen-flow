import { useState, useMemo } from "react";
import { Search, ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from "lucide-react";

interface EntriesTableProps {
  entries: any[];
}

const categoryMeta: Record<string, { color: string; emoji: string }> = {
  Food: { color: "#22C55E", emoji: "🍔" },
  Transport: { color: "#3B82F6", emoji: "🚗" },
  Energy: { color: "#F59E0B", emoji: "⚡" },
  Shopping: { color: "#A78BFA", emoji: "🛍️" },
  Other: { color: "#94a3b8", emoji: "📝" },
};

const PER_PAGE = 10;

const EntriesTable = ({ entries }: EntriesTableProps) => {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [sortBy, setSortBy] = useState("date");
  const [page, setPage] = useState(0);

  const mappedEntries = useMemo(() => {
    const catAvgs: Record<string, { sum: number; count: number }> = {};
    entries.forEach(e => {
      let cat = e.category;
      cat = cat ? cat.charAt(0).toUpperCase() + cat.slice(1) : "Other";
      if (!catAvgs[cat]) catAvgs[cat] = { sum: 0, count: 0 };
      catAvgs[cat].sum += e.co2_kg;
      catAvgs[cat].count++;
    });

    return entries.map(e => {
      let cat = e.category;
      cat = cat ? cat.charAt(0).toUpperCase() + cat.slice(1) : "Other";
      const d = new Date(e.logged_at);
      const dateStr = d.toISOString().split("T")[0];
      return {
        date: dateStr,
        cat: cat,
        desc: e.description || "",
        co2: e.co2_kg || 0,
        avg: catAvgs[cat] ? catAvgs[cat].sum / catAvgs[cat].count : 0,
      };
    });
  }, [entries]);

  const filtered = useMemo(() => {
    let items = mappedEntries;
    if (catFilter !== "All") items = items.filter((e) => e.cat === catFilter);
    if (search) items = items.filter((e) => e.desc.toLowerCase().includes(search.toLowerCase()));
    if (sortBy === "co2") items = [...items].sort((a, b) => b.co2 - a.co2);
    if (sortBy === "category") items = [...items].sort((a, b) => a.cat.localeCompare(b.cat));
    if (sortBy === "date") items = [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return items;
  }, [search, catFilter, sortBy, mappedEntries]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  return (
    <div className="glass-card rounded-xl p-5">
      <h3 className="font-mono text-[10px] text-muted-foreground/50 uppercase tracking-[0.2em] mb-4">
        All logged entries
      </h3>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search entries..."
            className="w-full pl-8 pr-3 py-2 rounded-lg bg-muted/20 text-sm font-mono text-foreground placeholder:text-muted-foreground/30 border border-primary/10 focus:border-primary/30 focus:outline-none transition-colors"
          />
        </div>
        <select
          value={catFilter}
          onChange={(e) => { setCatFilter(e.target.value); setPage(0); }}
          className="px-3 py-2 rounded-lg bg-muted/20 text-xs font-mono text-muted-foreground border border-primary/10 focus:outline-none"
        >
          <option value="All">All Categories</option>
          <option value="Food">Food</option>
          <option value="Transport">Transport</option>
          <option value="Energy">Energy</option>
          <option value="Shopping">Shopping</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 rounded-lg bg-muted/20 text-xs font-mono text-muted-foreground border border-primary/10 focus:outline-none"
        >
          <option value="date">Sort: Date</option>
          <option value="co2">Sort: CO₂</option>
          <option value="category">Sort: Category</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-primary/10">
              {["Date", "Category", "Description", "CO₂ (kg)", "vs avg"].map((h) => (
                <th key={h} className="text-left py-2 px-3 text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider font-normal">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((e, i) => {
              const diff = e.co2 - e.avg;
              const isBelow = diff < 0;
              const meta = categoryMeta[e.cat] || categoryMeta["Other"];
              return (
                <tr
                  key={i}
                  className="border-b border-primary/5 hover:bg-primary/5 transition-colors"
                >
                  <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground">{e.date}</td>
                  <td className="py-2.5 px-3">
                    <span className="inline-flex items-center gap-1.5 text-xs">
                      <span>{meta.emoji}</span>
                      <span className="font-mono" style={{ color: meta.color }}>{e.cat}</span>
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-xs text-foreground/70">{e.desc}</td>
                  <td className="py-2.5 px-3 font-mono text-xs text-foreground">{e.co2.toFixed(1)}</td>
                  <td className="py-2.5 px-3">
                    <span className={`inline-flex items-center gap-0.5 font-mono text-xs ${isBelow ? "text-primary" : "text-destructive"}`}>
                      {isBelow ? <ArrowDown size={12} /> : <ArrowUp size={12} />}
                      {Math.abs(diff).toFixed(1)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-1 mt-4">
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
          className="px-3 py-1.5 rounded-lg text-xs font-mono text-muted-foreground hover:bg-muted/30 disabled:opacity-30 transition-colors"
        >
          Previous
        </button>
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            onClick={() => setPage(i)}
            className={`w-7 h-7 rounded-lg text-xs font-mono transition-all ${
              page === i ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/30"
            }`}
          >
            {i + 1}
          </button>
        ))}
        <button
          onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          disabled={page === totalPages - 1}
          className="px-3 py-1.5 rounded-lg text-xs font-mono text-muted-foreground hover:bg-muted/30 disabled:opacity-30 transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default EntriesTable;
