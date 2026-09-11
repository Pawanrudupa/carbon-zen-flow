import { motion } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
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
    <DashboardLayout>
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="w-full max-w-full overflow-x-hidden"
      >
        {/* Page Title (Exactly one h1 per page) */}
        <motion.div variants={fadeInUp} className="mb-6">
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Real-time carbon tracking & insights</p>
        </motion.div>

        <motion.div variants={staggerContainer} initial="initial" animate="animate">
          {/* Row 1 — CarbonOrb + CategoryBreakdown + Challenges */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6 mb-6">
            <motion.div variants={fadeInUp} className="min-w-0 lg:col-span-5">
              <CarbonOrb />
            </motion.div>
            <motion.div variants={fadeInUp} className="min-w-0 lg:col-span-4">
              <CategoryBreakdown />
            </motion.div>
            <motion.div variants={fadeInUp} className="min-w-0 lg:col-span-3">
              <ChallengesPanel />
            </motion.div>
          </div>

          {/* Row 2 — Trends + Recent Entries */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6 mb-6">
            <motion.div variants={fadeInUp} className="min-w-0 lg:col-span-5">
              <TrendSparklines />
            </motion.div>
            <motion.div variants={fadeInUp} className="min-w-0 lg:col-span-7">
              <LogTimeline />
            </motion.div>
          </div>

          {/* Row 3 — AI Insights full width */}
          <motion.div variants={fadeInUp} className="mb-6 min-w-0">
            <AIInsightPanel />
          </motion.div>

          {/* Row 4 — Heatmap */}
          <motion.div variants={fadeInUp} className="min-w-0">
            <MonthlyHeatmap />
          </motion.div>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
};

export default Dashboard;
