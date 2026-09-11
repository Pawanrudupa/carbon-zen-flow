import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  // Reset scroll position to top when navigating between pages
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location.pathname]);

  return (
    <div className="h-screen h-[100dvh] bg-background flex w-full max-w-full overflow-hidden">
      {/* Shared Desktop Sidebar & Mobile Drawer */}
      <DashboardSidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((prev) => !prev)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area: flex-1 min-w-0 flex flex-col prevents grid/flex blowout */}
      <div className="flex-1 min-w-0 flex flex-col h-screen h-[100dvh] w-full max-w-full overflow-hidden">
        <DashboardHeader onOpenMobileMenu={() => setMobileMenuOpen(true)} />
        <main
          ref={mainRef}
          className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 w-full max-w-full"
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
