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

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const fadeSlide = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="ml-16 min-h-screen flex flex-col">
        <DashboardHeader />
        <motion.main
          className="flex-1 p-5 md:p-8 overflow-auto"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          {/* Row 1 — CarbonOrb + CategoryBreakdown + Challenges */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6 mb-6">
            <motion.div variants={fadeSlide} className="lg:col-span-5">
              <CarbonOrb />
            </motion.div>
            <motion.div variants={fadeSlide} className="lg:col-span-4">
              <CategoryBreakdown />
            </motion.div>
            <motion.div variants={fadeSlide} className="lg:col-span-3">
              <ChallengesPanel />
            </motion.div>
          </div>

          {/* Row 2 — Trends + Recent Entries */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6 mb-6">
            <motion.div variants={fadeSlide} className="lg:col-span-5">
              <TrendSparklines />
            </motion.div>
            <motion.div variants={fadeSlide} className="lg:col-span-7">
              <LogTimeline />
            </motion.div>
          </div>

          {/* Row 3 — AI Insights full width */}
          <motion.div variants={fadeSlide} className="mb-6">
            <AIInsightPanel />
          </motion.div>

          {/* Row 4 — Heatmap */}
          <motion.div variants={fadeSlide}>
            <MonthlyHeatmap />
          </motion.div>
        </motion.main>
      </div>
    </div>
  );
};

export default Dashboard;
