import { useState } from "react";
import {
  LayoutDashboard,
  PenLine,
  BarChart3,
  Flame,
  Users,
  FileText,
  Settings,
  Leaf,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { SPRING } from "@/lib/animations";

export const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: PenLine, label: "Log Entry", path: "/log" },
  { icon: BarChart3, label: "Analytics", path: "/analytics" },
  { icon: Flame, label: "Challenges", path: "/challenges" },
  { icon: Users, label: "Household", path: "/household" },
  { icon: FileText, label: "Reports", path: "/reports" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export interface DashboardSidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const DashboardSidebar = ({
  collapsed: externalCollapsed,
  onToggleCollapse,
  mobileOpen = false,
  onCloseMobile,
}: DashboardSidebarProps) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const isControlled = externalCollapsed !== undefined;
  const isCollapsed = isControlled ? externalCollapsed : internalCollapsed;

  const toggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed((prev) => !prev);
    }
  };

  const displayName = user?.user_metadata?.display_name || user?.email || "User";
  const initial = displayName.charAt(0).toUpperCase();

  const handleSignOut = async () => {
    if (onCloseMobile) onCloseMobile();
    await signOut();
    navigate("/login");
  };

  return (
    <>
      {/* ─── DESKTOP SIDEBAR (md and up) ─── */}
      <aside
        className={`hidden md:flex flex-col flex-shrink-0 sticky top-0 h-screen bg-sidebar border-r border-primary/10 transition-all duration-300 z-30 select-none ${
          isCollapsed ? "w-16" : "w-60"
        }`}
        style={{
          borderImage: "linear-gradient(to bottom, rgba(34,197,94,0.15), transparent) 1",
        }}
      >
        {/* Header / Logo + Collapse Toggle */}
        <div className="flex items-center justify-between px-3.5 py-4 border-b border-primary/10 min-h-[57px]">
          <Link to="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
              <Leaf size={18} />
            </div>
            {!isCollapsed && (
              <span className="font-heading font-bold text-foreground text-sm tracking-tight whitespace-nowrap">
                CarbonLedger
              </span>
            )}
          </Link>
          <button
            onClick={toggleCollapse}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 flex flex-col gap-1 p-2 mt-2 overflow-y-auto">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.label}
                to={item.path}
                title={isCollapsed ? item.label : undefined}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors overflow-hidden ${
                  active
                    ? "text-primary font-semibold bg-primary/10 border-l-2 border-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
                } ${isCollapsed ? "justify-center px-0" : ""}`}
              >
                <item.icon size={18} className="flex-shrink-0" />
                {!isCollapsed && (
                  <span className="truncate font-medium">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile & Sign Out Footer */}
        <div className="p-3 border-t border-primary/10 space-y-2 overflow-hidden">
          <div className={`flex items-center gap-2.5 ${isCollapsed ? "justify-center" : ""}`}>
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-heading font-bold text-xs">{initial}</span>
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground truncate">{displayName}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleSignOut}
            title={isCollapsed ? "Sign Out" : undefined}
            className={`flex items-center gap-2.5 py-2 rounded-lg text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors w-full ${
              isCollapsed ? "justify-center px-0" : "px-2.5"
            }`}
          >
            <LogOut size={16} className="flex-shrink-0" />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ─── MOBILE DRAWER (hidden on md and up) ─── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm md:hidden"
            />
            {/* Slide-out Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed left-0 top-0 bottom-0 w-[280px] max-w-[85vw] bg-card border-r border-primary/10 p-5 z-50 flex flex-col md:hidden shadow-2xl overflow-y-auto"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-primary/10 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Leaf size={18} />
                  </div>
                  <span className="font-heading font-bold text-foreground text-sm">CarbonLedger</span>
                </div>
                <button
                  onClick={onCloseMobile}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
                  aria-label="Close navigation menu"
                >
                  <X size={18} />
                </button>
              </div>

              {/* All 7 Navigation items */}
              <nav className="flex-1 flex flex-col gap-1.5">
                {navItems.map((item) => {
                  const active = location.pathname === item.path;
                  return (
                    <Link
                      key={item.label}
                      to={item.path}
                      onClick={onCloseMobile}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        active
                          ? "bg-primary/15 text-primary border-l-2 border-primary font-semibold"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
                      }`}
                    >
                      <item.icon size={18} className="flex-shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Drawer Footer / User info + Sign Out */}
              <div className="border-t border-primary/10 pt-4 mt-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-heading font-bold text-xs">{initial}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground truncate">{displayName}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors font-medium text-left"
                >
                  <LogOut size={16} className="flex-shrink-0" />
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

export default DashboardSidebar;
