import { useState, useRef, useEffect } from "react";
import { Bell, Plus, Leaf, Trophy, TrendingDown, AlertTriangle, Menu, X, Users, FileText, Settings, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardData } from "@/hooks/useDashboardData";
import { formatDistanceToNow } from "date-fns";

const quickCategories = [
  { label: "Food", emoji: "🍔" },
  { label: "Transport", emoji: "🚗" },
  { label: "Energy", emoji: "⚡" },
  { label: "Shopping", emoji: "🛍️" },
];

const DashboardHeader = () => {
  const month = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuth();
  const { data: entries } = useDashboardData();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const notifications = (entries || [])
    .slice(0, 5)
    .map((entry, index) => ({
      id: entry.id,
      icon: Leaf,
      color: "text-primary",
      title: "Activity Logged",
      desc: `You logged ${entry.co2_kg}kg CO2 for ${entry.category?.toLowerCase() || 'activity'}.`,
      time: entry.logged_at ? formatDistanceToNow(new Date(entry.logged_at), { addSuffix: true }) : "recently",
      unread: index === 0,
    }));

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
    <>
      <header className="h-14 flex items-center justify-between px-6 border-b border-primary/10 bg-background/80 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMenuOpen(true)}
            className="p-1.5 rounded-lg hover:bg-muted/30 transition-colors md:hidden mr-1"
            aria-label="Open menu"
          >
            <Menu size={18} className="text-foreground" />
          </button>
          <Leaf className="text-primary" size={18} />
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
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center flex flex-col items-center justify-center">
                      <Bell size={24} className="text-muted-foreground/30 mb-2" />
                      <p className="text-sm font-medium text-foreground">No new notifications</p>
                      <p className="text-xs text-muted-foreground mt-1">You're all caught up!</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
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
                    ))
                  )}
                </div>

                {notifications.length > 0 && (
                  <Link
                    to="/settings"
                    onClick={() => setOpen(false)}
                    className="block text-center text-xs text-primary hover:underline py-2.5 border-t border-primary/5"
                  >
                    Notification settings
                  </Link>
                )}
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

    {/* Slide-out mobile drawer backdrop & drawer */}
    <AnimatePresence>
      {menuOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
          />
          {/* Drawer */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 bottom-0 w-[280px] bg-card border-r border-primary/10 p-6 z-50 flex flex-col md:hidden shadow-2xl"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <Leaf className="text-primary" size={18} />
                <span className="font-heading font-700 text-foreground text-sm">CarbonLedger</span>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                className="p-1.5 rounded-lg hover:bg-muted/30 transition-colors"
              >
                <X size={18} className="text-muted-foreground" />
              </button>
            </div>

            {/* Navigation links */}
            <nav className="flex-1 flex flex-col gap-4">
              <Link
                to="/household"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-all font-medium"
              >
                <Users size={18} />
                <span>Household</span>
              </Link>
              <Link
                to="/reports"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-all font-medium"
              >
                <FileText size={18} />
                <span>Reports</span>
              </Link>
              <Link
                to="/settings"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-all font-medium"
              >
                <Settings size={18} />
                <span>Settings</span>
              </Link>
            </nav>

            {/* User profile & Sign Out at bottom */}
            <div className="border-t border-primary/10 pt-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-primary font-heading font-700 text-xs">{initial}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground truncate">{displayName}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  handleSignOut();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors font-medium text-left"
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  </>
);
};

export default DashboardHeader;
