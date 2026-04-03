import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import AnalyticsHeader from "@/components/analytics/AnalyticsHeader";
import TrendChart from "@/components/analytics/TrendChart";
import CategoryDeepDive from "@/components/analytics/CategoryDeepDive";
import ActivityHeatmap from "@/components/analytics/ActivityHeatmap";
import PatternInsights from "@/components/analytics/PatternInsights";
import EntriesTable from "@/components/analytics/EntriesTable";

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

const Analytics = () => {
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
          <motion.div variants={fadeSlide}>
            <AnalyticsHeader />
          </motion.div>

          <motion.div variants={fadeSlide} className="mt-6">
            <TrendChart />
          </motion.div>

          <motion.div variants={fadeSlide} className="mt-6">
            <CategoryDeepDive />
          </motion.div>

          <motion.div variants={fadeSlide} className="mt-6">
            <ActivityHeatmap />
          </motion.div>

          <motion.div variants={fadeSlide} className="mt-6">
            <PatternInsights />
          </motion.div>

          <motion.div variants={fadeSlide} className="mt-6 mb-8">
            <EntriesTable />
          </motion.div>
        </motion.main>
      </div>
    </div>
  );
};

export default Analytics;
