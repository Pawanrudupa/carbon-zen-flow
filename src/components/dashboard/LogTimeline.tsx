import { useMemo } from "react";
import { motion } from "framer-motion";
import { UtensilsCrossed, Car, Zap, ShoppingBag, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import SkeletonCard from "@/components/ui/SkeletonCard";
import ErrorCard from "@/components/ui/ErrorCard";
import { useDashboardData } from "@/hooks/useDashboardData";

const icons: Record<string, typeof UtensilsCrossed> = {
  food: UtensilsCrossed,
  transport: Car,
  energy: Zap,
  shopping: ShoppingBag,
};

const colors: Record<string, string> = {
  food: "#22C55E",
  transport: "#3B82F6",
  energy: "#F59E0B",
  shopping: "#A78BFA",
};

const getRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return "just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return "Yesterday";
  return `${diffInDays}d ago`;
};

const entryVariant = {
  hidden: { opacity: 0, x: -20 },
  show: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: 0.15 + i * 0.08, duration: 0.5, ease: "easeOut" as const },
  }),
};

const LogTimeline = () => {
  const { data: allEntries = [], isLoading, isError, refetch } = useDashboardData();

  // Take the 10 most recent entries from the shared cache (already ordered desc)
  const entries = useMemo(() => allEntries.slice(0, 10), [allEntries]);

  return (
    <div className="glass-card rounded-xl p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-mono text-[10px] text-muted-foreground/50 uppercase tracking-[0.2em]">
          Recent Entries
        </h3>
        <Link
          to="/log"
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-[11px] font-heading font-600 hover:bg-primary/20 transition-colors"
        >
          <Plus size={11} /> Add
        </Link>
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto">
        {isLoading ? (
          <SkeletonCard className="h-full" />
        ) : isError ? (
          <ErrorCard onRetry={() => refetch()} />
        ) : entries.length > 0 ? (
          entries.map((e, i) => {
            const Icon = icons[e.category] || UtensilsCrossed;
            return (
              <motion.div
                key={e.id || i}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/20 transition-colors group cursor-pointer"
                variants={entryVariant}
                initial="hidden"
                animate="show"
                custom={i}
                whileHover={{ x: 4, transition: { duration: 0.15 } }}
              >
                <span className="font-mono text-[10px] text-muted-foreground/40 w-14 flex-shrink-0">
                  {getRelativeTime(e.logged_at)}
                </span>
                <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-shadow group-hover:shadow-[0_0_12px_rgba(34,197,94,0.15)]"
                    style={{ backgroundColor: `${colors[e.category] || "#94a3b8"}12` }}
                  >
                    <Icon size={12} style={{ color: colors[e.category] || "#94a3b8" }} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-foreground/70 block truncate">{e.description}</span>
                </div>
                <span className="font-mono text-xs text-foreground/90 flex-shrink-0">
                  {e.co2_kg}<span className="text-muted-foreground/40 ml-0.5">kg</span>
                </span>
                <span className="text-[10px] flex-shrink-0 text-muted-foreground/30">·</span>
              </motion.div>
            );
          })
        ) : (
          <div className="text-center py-4 text-xs text-muted-foreground">
            No recent entries
          </div>
        )}
      </div>
    </div>
  );
};

export default LogTimeline;
