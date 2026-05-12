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
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion, AnimatePresence } from "framer-motion";
import { SPRING, staggerContainer, fadeInUp, hoverScale } from "@/lib/animations";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: PenLine, label: "Log Entry", path: "/log" },
  { icon: BarChart3, label: "Analytics", path: "/analytics" },
  { icon: Flame, label: "Challenges", path: "/challenges" },
  { icon: Users, label: "Household", path: "/household" },
  { icon: FileText, label: "Reports", path: "/reports" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const DashboardSidebar = () => {
  const [expanded, setExpanded] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();

  const displayName = user?.user_metadata?.display_name || user?.email || "U";
  const initial = displayName.charAt(0).toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  if (isMobile) {
    return (
      <motion.nav 
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-t border-primary/10 flex items-center justify-around px-2 py-2 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.1)]"
      >
        {navItems.slice(0, 5).map((item) => {
          const active = location.pathname === item.path;
          return (
            <motion.div key={item.label} variants={fadeInUp} whileTap={{ scale: 0.9 }}>
              <Link
                to={item.path}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all relative ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="mobile-nav-indicator"
                    className="absolute inset-0 bg-primary/10 rounded-xl"
                    transition={SPRING.smooth}
                  />
                )}
                <motion.div whileHover={{ scale: 1.15, rotate: active ? [0, -10, 10, 0] : 0 }}>
                  <item.icon size={20} className={`relative z-10 ${active ? "drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]" : ""}`} />
                </motion.div>
                <span className="text-[10px] font-medium relative z-10">{item.label}</span>
              </Link>
            </motion.div>
          );
        })}
      </motion.nav>
    );
  }

  return (
    <motion.aside
      className={`fixed left-0 top-0 h-full z-40 flex flex-col transition-all duration-300 bg-sidebar border-r border-primary/10 ${
        expanded ? "w-[220px]" : "w-16"
      }`}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      style={{
        borderImage: "linear-gradient(to bottom, rgba(34,197,94,0.15), transparent) 1",
      }}
      initial={{ x: -100 }}
      animate={{ x: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="flex items-center gap-2 px-4 py-5 overflow-hidden">
        <motion.div
          animate={{ rotate: expanded ? 360 : 0 }}
          transition={{ duration: 1, ease: "easeInOut" }}
        >
          <Leaf className="text-primary flex-shrink-0" size={20} />
        </motion.div>
        <AnimatePresence>
          {expanded && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="font-heading font-700 text-foreground text-sm whitespace-nowrap"
            >
              CarbonLedger
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <nav className="flex-1 flex flex-col gap-1 px-2 mt-4 relative">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.label}
              to={item.path}
              className={`relative flex items-center px-3 py-2.5 rounded-lg text-sm transition-colors overflow-hidden ${
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active-indicator"
                  className="absolute inset-0 bg-primary/10 rounded-lg border-l-2 border-primary"
                  initial={false}
                  transition={SPRING.smooth}
                />
              )}
              
              <motion.div 
                className="relative z-10 flex items-center gap-3 w-full"
                whileHover={!active ? { x: 4, transition: { duration: 0.15 } } : {}}
              >
                <motion.div whileHover={{ scale: 1.15, rotate: 5 }}>
                  <item.icon size={18} className="flex-shrink-0" />
                </motion.div>
                <AnimatePresence>
                  {expanded && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-primary/10 space-y-3 overflow-hidden">
        <div className="flex items-center gap-2">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 cursor-pointer"
          >
            <span className="text-primary font-heading font-700 text-xs">{initial}</span>
          </motion.div>
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="min-w-0"
              >
                <p className="text-xs text-foreground truncate">{displayName}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <motion.button
          onClick={handleSignOut}
          whileHover={{ x: 4, backgroundColor: "rgba(239, 68, 68, 0.1)" }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-destructive transition-colors w-full relative overflow-hidden"
        >
          <motion.div whileHover={{ rotate: 15 }}>
            <LogOut size={16} className="flex-shrink-0" />
          </motion.div>
          <AnimatePresence>
            {expanded && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="whitespace-nowrap"
              >
                Sign Out
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.aside>
  );
};

export default DashboardSidebar;
