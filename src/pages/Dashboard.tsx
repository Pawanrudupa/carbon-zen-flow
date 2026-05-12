import { motion } from "framer-motion";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import CarbonOrb from "@/components/dashboard/CarbonOrb";
import TrendSparklines from "@/components/dashboard/TrendSparklines";
import AIInsightPanel from "@/components/dashboard/AIInsightPanel";
import CategoryBreakdown from "@/components/dashboard/CategoryBreakdown";
import LogTimeline from "@/components/dashboard/LogTimeline";
import ChallengesPanel from "@/components/dashboard/ChallengesPanel";
import MonthlyHeatmap from "@/components/dashboard/MonthlyHeatmap";
import { pageVariants, staggerContainer, fadeInUp } from "@/lib/animations";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="ml-16 md:ml-20 min-h-screen flex flex-col transition-all duration-300">
        <DashboardHeader />
        <motion.main
          className="flex-1 p-5 md:p-8 overflow-auto"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <motion.div variants={staggerContainer} initial="initial" animate="animate">
            {/* Row 1 — CarbonOrb + CategoryBreakdown + Challenges */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6 mb-6">
              <motion.div variants={fadeInUp} className="lg:col-span-5">
                <CarbonOrb />
              </motion.div>
              <motion.div variants={fadeInUp} className="lg:col-span-4">
                <CategoryBreakdown />
              </motion.div>
              <motion.div variants={fadeInUp} className="lg:col-span-3">
                <ChallengesPanel />
              </motion.div>
            </div>

            {/* Row 2 — Trends + Recent Entries */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6 mb-6">
              <motion.div variants={fadeInUp} className="lg:col-span-5">
                <TrendSparklines />
              </motion.div>
              <motion.div variants={fadeInUp} className="lg:col-span-7">
                <LogTimeline />
              </motion.div>
            </div>

            {/* Row 3 — AI Insights full width */}
            <motion.div variants={fadeInUp} className="mb-6">
              <AIInsightPanel />
            </motion.div>

            {/* Row 4 — Heatmap */}
            <motion.div variants={fadeInUp}>
              <MonthlyHeatmap />
            </motion.div>
          </motion.div>
        </motion.main>
      </div>
    </div>
  );
};

export default Dashboard;
