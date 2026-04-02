import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import CarbonOrb from "@/components/dashboard/CarbonOrb";
import TrendSparklines from "@/components/dashboard/TrendSparklines";
import AIInsightPanel from "@/components/dashboard/AIInsightPanel";
import CategoryBreakdown from "@/components/dashboard/CategoryBreakdown";
import LogTimeline from "@/components/dashboard/LogTimeline";
import ChallengesPanel from "@/components/dashboard/ChallengesPanel";
import MonthlyHeatmap from "@/components/dashboard/MonthlyHeatmap";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="ml-16 min-h-screen flex flex-col">
        <DashboardHeader />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {/* Top row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 mb-4 md:mb-5">
            <div className="md:col-span-1">
              <CarbonOrb />
            </div>
            <div className="md:col-span-1">
              <TrendSparklines />
            </div>
            <div className="md:col-span-1">
              <AIInsightPanel />
            </div>
          </div>

          {/* Middle row */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5 mb-4 md:mb-5">
            <div className="md:col-span-4">
              <CategoryBreakdown />
            </div>
            <div className="md:col-span-5">
              <LogTimeline />
            </div>
            <div className="md:col-span-3">
              <ChallengesPanel />
            </div>
          </div>

          {/* Bottom row */}
          <MonthlyHeatmap />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
