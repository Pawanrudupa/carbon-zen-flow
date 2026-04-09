import { useState, useRef, useEffect } from "react";
import { Bell, Plus, Leaf, Flame, Trophy, TrendingDown, FileText, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

const quickCategories = [
  { label: "Food", emoji: "🍔" },
  { label: "Transport", emoji: "🚗" },
  { label: "Energy", emoji: "⚡" },
  { label: "Shopping", emoji: "🛍️" },
];

const notifications = [
  { id: 1, icon: Flame, color: "text-primary", title: "14-day streak!", desc: "You haven't missed a single day", time: "Just now", unread: true },
  { id: 2, icon: TrendingDown, color: "text-primary", title: "Weekly emissions down 12%", desc: "Great progress vs last week", time: "2h ago", unread: true },
  { id: 3, icon: Trophy, color: "hsl(var(--chart-amber))", title: "Challenge ending soon", desc: "Meatless Weekdays expires in 2 days", time: "5h ago", unread: true },
  { id: 4, icon: Users, color: "hsl(var(--chart-blue))", title: "Household update", desc: "Sam logged a transport entry", time: "Yesterday", unread: false },
  { id: 5, icon: FileText, color: "text-muted-foreground", title: "March report ready", desc: "Your monthly report has been generated", time: "2 days ago", unread: false },
];

const DashboardHeader = () => {
  const month = new Date().toLocaleString("default", { month: "long", year: "numeric" });
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const displayName = user?.user_metadata?.display_name || user?.email || "U";
  const initial = displayName.charAt(0).toUpperCase();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unreadCount = notifications.filter((n) => n.unread).length;

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
        <div ref={ref} className="relative">
          <button
            onClick={() => setOpen((prev) => !prev)}
            className="relative p-2 rounded-lg hover:bg-muted/30 transition-colors"
          >
            <Bell size={16} className="text-muted-foreground" />
            {unreadCount > 0 && (
              <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
            )}
          </button>

          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 top-full mt-2 w-80 bg-card border border-primary/10 rounded-xl shadow-2xl overflow-hidden z-50"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-primary/5">
                  <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>

                <div className="max-h-[340px] overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`flex items-start gap-3 px-4 py-3 hover:bg-muted/20 transition-colors border-b border-primary/5 last:border-0 ${
                        n.unread ? "bg-primary/[0.03]" : ""
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-muted/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <n.icon size={14} className={n.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-medium text-foreground truncate">{n.title}</p>
                          {n.unread && <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />}
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">{n.desc}</p>
                        <p className="text-[10px] text-muted-foreground/60 font-mono mt-0.5">{n.time}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Link
                  to="/settings"
                  onClick={() => setOpen(false)}
                  className="block text-center text-xs text-primary hover:underline py-2.5 border-t border-primary/5"
                >
                  Notification settings
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-mono font-600 hidden sm:inline">
          On Track
        </span>
        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
          <span className="text-primary font-heading font-700 text-xs">{initial}</span>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
