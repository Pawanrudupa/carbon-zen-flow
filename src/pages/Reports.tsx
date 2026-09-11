import { useState } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
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
    <DashboardLayout>
      <motion.div
        className="w-full max-w-full overflow-x-hidden"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={fadeSlide}>
          <ReportsHeader isPremium={isPremium} />
        </motion.div>
        <motion.div variants={fadeSlide} className="mt-6 min-w-0">
          <GenerateReport />
        </motion.div>
        <motion.div variants={fadeSlide} className="mt-8 min-w-0">
          <ReportPreview />
        </motion.div>
        <motion.div variants={fadeSlide} className="mt-8 min-w-0">
          <ReportHistory />
        </motion.div>
        <motion.div variants={fadeSlide} className="mt-8 min-w-0">
          <ScheduledReports />
        </motion.div>
        {!isPremium && (
          <motion.div variants={fadeSlide} className="mt-8 mb-8 min-w-0">
            <UpgradeCTA />
          </motion.div>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default Reports;
