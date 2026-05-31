import { useState } from "react";
import { motion } from "framer-motion";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import ReportsHeader from "@/components/reports/ReportsHeader";
import GenerateReport from "@/components/reports/GenerateReport";
import ReportPreview from "@/components/reports/ReportPreview";
import ReportHistory from "@/components/reports/ReportHistory";
import ScheduledReports from "@/components/reports/ScheduledReports";
import UpgradeCTA from "@/components/reports/UpgradeCTA";

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

const Reports = () => {
  const [isPremium] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="ml-0 md:ml-16 min-h-screen flex flex-col w-full overflow-x-hidden px-4 md:px-0">
        <DashboardHeader />
        <motion.main
          className="flex-1 p-5 pb-24 md:p-8 overflow-auto"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={fadeSlide}>
            <ReportsHeader isPremium={isPremium} />
          </motion.div>
          <motion.div variants={fadeSlide} className="mt-6">
            <GenerateReport />
          </motion.div>
          <motion.div variants={fadeSlide} className="mt-8">
            <ReportPreview />
          </motion.div>
          <motion.div variants={fadeSlide} className="mt-8">
            <ReportHistory />
          </motion.div>
          <motion.div variants={fadeSlide} className="mt-8">
            <ScheduledReports />
          </motion.div>
          {!isPremium && (
            <motion.div variants={fadeSlide} className="mt-8 mb-8">
              <UpgradeCTA />
            </motion.div>
          )}
        </motion.main>
      </div>
    </div>
  );
};

export default Reports;
