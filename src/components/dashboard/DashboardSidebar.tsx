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
  ChevronRight,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: PenLine, label: "Log Entry", path: "/log" },
  { icon: BarChart3, label: "Analytics", path: "/analytics" },
  { icon: Flame, label: "Challenges", path: "/dashboard" },
  { icon: Users, label: "Household", path: "/dashboard" },
  { icon: FileText, label: "Reports", path: "/dashboard" },
  { icon: Settings, label: "Settings", path: "/dashboard" },
];

const DashboardSidebar = () => {
  const [expanded, setExpanded] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={`fixed left-0 top-0 h-full z-40 flex flex-col transition-all duration-300 bg-sidebar border-r border-primary/10 ${
        expanded ? "w-[220px]" : "w-16"
      }`}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      style={{
        borderImage: "linear-gradient(to bottom, rgba(34,197,94,0.15), transparent) 1",
      }}
    >
      <div className="flex items-center gap-2 px-4 py-5">
        <Leaf className="text-primary flex-shrink-0" size={20} />
        {expanded && (
          <span className="font-heading font-700 text-foreground text-sm whitespace-nowrap">CarbonLedger</span>
        )}
      </div>

      <nav className="flex-1 flex flex-col gap-1 px-2 mt-4">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.label}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                active
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              }`}
            >
              <item.icon size={18} className="flex-shrink-0" />
              {expanded && <span className="whitespace-nowrap">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-primary/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <span className="text-primary font-heading font-700 text-xs">A</span>
          </div>
          {expanded && (
            <div className="min-w-0">
              <p className="text-xs text-foreground truncate">Alex Chen</p>
              <p className="text-[10px] text-primary font-mono">🔥 14 day streak</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
