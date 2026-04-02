import { Bell, Plus, Leaf } from "lucide-react";
import { Link } from "react-router-dom";

const quickCategories = [
  { label: "Food", emoji: "🍔" },
  { label: "Transport", emoji: "🚗" },
  { label: "Energy", emoji: "⚡" },
  { label: "Shopping", emoji: "🛍️" },
];

const DashboardHeader = () => {
  const month = new Date().toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-primary/10 bg-background/80 backdrop-blur-md sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <Leaf className="text-primary md:hidden" size={18} />
        <span className="font-heading font-600 text-foreground text-sm hidden md:inline">CarbonLedger</span>
        <span className="text-muted-foreground text-xs font-mono hidden md:inline">/ {month}</span>
      </div>

      <div className="flex items-center gap-2">
        {quickCategories.map((c) => (
          <Link
            key={c.label}
            to="/log"
            className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted/30 text-xs text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
          >
            <span>{c.emoji}</span>
            <span>{c.label}</span>
          </Link>
        ))}
        <Link
          to="/log"
          className="sm:hidden flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs"
        >
          <Plus size={14} /> Log
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg hover:bg-muted/30 transition-colors">
          <Bell size={16} className="text-muted-foreground" />
          <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
        </button>
        <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-mono font-600 hidden sm:inline">
          On Track
        </span>
        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
          <span className="text-primary font-heading font-700 text-xs">A</span>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
