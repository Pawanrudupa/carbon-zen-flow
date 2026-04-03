import { useState, useMemo } from "react";
import { Search, ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from "lucide-react";

const categoryMeta: Record<string, { color: string; emoji: string }> = {
  Food: { color: "#22C55E", emoji: "🍔" },
  Transport: { color: "#3B82F6", emoji: "🚗" },
  Energy: { color: "#F59E0B", emoji: "⚡" },
  Shopping: { color: "#A78BFA", emoji: "🛍️" },
};

const rawEntries = [
  { date: "2026-04-02", cat: "Food", desc: "Grocery run — organic veggies", co2: 4.2, avg: 6.1 },
  { date: "2026-04-01", cat: "Transport", desc: "Drove to office (32 km)", co2: 8.1, avg: 7.5 },
  { date: "2026-03-31", cat: "Energy", desc: "Heating — cold snap", co2: 12.4, avg: 9.0 },
  { date: "2026-03-30", cat: "Shopping", desc: "New running shoes", co2: 14.0, avg: 10.0 },
  { date: "2026-03-29", cat: "Food", desc: "Takeout sushi dinner", co2: 7.8, avg: 6.1 },
  { date: "2026-03-28", cat: "Transport", desc: "Bus commute", co2: 2.1, avg: 7.5 },
  { date: "2026-03-27", cat: "Food", desc: "Home-cooked lentil stew", co2: 1.9, avg: 6.1 },
  { date: "2026-03-26", cat: "Energy", desc: "Laundry + dryer cycle", co2: 5.2, avg: 9.0 },
  { date: "2026-03-25", cat: "Transport", desc: "Train to conference", co2: 3.4, avg: 7.5 },
  { date: "2026-03-24", cat: "Food", desc: "Steak dinner with friends", co2: 11.2, avg: 6.1 },
  { date: "2026-03-23", cat: "Shopping", desc: "Electronics — headphones", co2: 18.5, avg: 10.0 },
  { date: "2026-03-22", cat: "Transport", desc: "Uber to airport", co2: 9.8, avg: 7.5 },
  { date: "2026-03-21", cat: "Food", desc: "Veggie burrito bowl", co2: 2.8, avg: 6.1 },
  { date: "2026-03-20", cat: "Energy", desc: "AC running all day", co2: 11.0, avg: 9.0 },
  { date: "2026-03-19", cat: "Food", desc: "Coffee + pastry", co2: 1.4, avg: 6.1 },
  { date: "2026-03-18", cat: "Transport", desc: "Cycled to work", co2: 0.2, avg: 7.5 },
  { date: "2026-03-17", cat: "Shopping", desc: "Thrift store finds", co2: 3.1, avg: 10.0 },
  { date: "2026-03-16", cat: "Food", desc: "BBQ ribs", co2: 9.5, avg: 6.1 },
  { date: "2026-03-15", cat: "Energy", desc: "Water heater overnight", co2: 6.8, avg: 9.0 },
  { date: "2026-03-14", cat: "Transport", desc: "Road trip (180 km)", co2: 22.3, avg: 7.5 },
  { date: "2026-03-13", cat: "Food", desc: "Salad + smoothie", co2: 1.2, avg: 6.1 },
  { date: "2026-03-12", cat: "Shopping", desc: "Winter jacket", co2: 21.0, avg: 10.0 },
  { date: "2026-03-11", cat: "Transport", desc: "Walked to gym", co2: 0.0, avg: 7.5 },
  { date: "2026-03-10", cat: "Energy", desc: "Space heater — 6 hrs", co2: 8.4, avg: 9.0 },
  { date: "2026-03-09", cat: "Food", desc: "Pasta night", co2: 3.6, avg: 6.1 },
  { date: "2026-03-08", cat: "Transport", desc: "Carpool to event", co2: 4.1, avg: 7.5 },
  { date: "2026-03-07", cat: "Shopping", desc: "Books + stationery", co2: 2.2, avg: 10.0 },
  { date: "2026-03-06", cat: "Food", desc: "Fish tacos", co2: 5.0, avg: 6.1 },
  { date: "2026-03-05", cat: "Energy", desc: "Dishwasher + oven", co2: 4.5, avg: 9.0 },
  { date: "2026-03-04", cat: "Transport", desc: "E-scooter rental", co2: 0.8, avg: 7.5 },
];

const PER_PAGE = 10;

const EntriesTable = () => {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [sortBy, setSortBy] = useState("date");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    let items = rawEntries;
    if (catFilter !== "All") items = items.filter((e) => e.cat === catFilter);
    if (search) items = items.filter((e) => e.desc.toLowerCase().includes(search.toLowerCase()));
    if (sortBy === "co2") items = [...items].sort((a, b) => b.co2 - a.co2);
    if (sortBy === "category") items = [...items].sort((a, b) => a.cat.localeCompare(b.cat));
    return items;
  }, [search, catFilter, sortBy]);

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
              const meta = categoryMeta[e.cat];
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
