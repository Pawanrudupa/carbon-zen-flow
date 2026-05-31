import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import AnalyticsHeader from "@/components/analytics/AnalyticsHeader";
import TrendChart from "@/components/analytics/TrendChart";
import CategoryDeepDive from "@/components/analytics/CategoryDeepDive";
import ActivityHeatmap from "@/components/analytics/ActivityHeatmap";
import PatternInsights from "@/components/analytics/PatternInsights";
import EntriesTable from "@/components/analytics/EntriesTable";
import SkeletonCard from "@/components/ui/SkeletonCard";
import ErrorCard from "@/components/ui/ErrorCard";

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
  const [dateRange, setDateRange] = useState("Last 3 Months");
  const { user } = useAuth();

  const { data: entries = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["analytics-entries", user?.id, dateRange],
    queryFn: async () => {
      if (!user) return [];
      
      let startDate = new Date();
      if (dateRange === "This Month") {
        startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      } else if (dateRange === "Last 3 Months") {
        startDate.setMonth(startDate.getMonth() - 3);
      } else if (dateRange === "This Year") {
        startDate = new Date(startDate.getFullYear(), 0, 1);
      } else {
        startDate = new Date(2000, 0, 1); // All Time
      }

      const { data, error } = await supabase
        .from("entries")
        .select("*")
        .eq("user_id", user.id)
        .gte("logged_at", startDate.toISOString())
        .order("logged_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar />
      <div className="flex-1 ml-0 md:ml-[64px] min-h-screen flex flex-col pb-24 md:pb-0 w-full overflow-x-hidden px-4 md:px-0">
        <DashboardHeader />
        <motion.main
          className="flex-1 p-5 pb-24 md:p-8 overflow-auto"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={fadeSlide}>
            <AnalyticsHeader dateRange={dateRange} setDateRange={setDateRange} entries={entries} />
          </motion.div>

          {isLoading ? (
            <div className="mt-6 space-y-6">
              <SkeletonCard className="h-64 w-full" />
              <SkeletonCard className="h-64 w-full" />
            </div>
          ) : isError ? (
            <div className="mt-6">
              <ErrorCard message="Failed to load analytics data" onRetry={() => refetch()} />
            </div>
          ) : (
            <>
              <motion.div variants={fadeSlide} className="mt-6">
                <TrendChart entries={entries} dateRange={dateRange} />
              </motion.div>

              <motion.div variants={fadeSlide} className="mt-6">
                <CategoryDeepDive entries={entries} />
              </motion.div>

              <motion.div variants={fadeSlide} className="mt-6">
                <ActivityHeatmap entries={entries} />
              </motion.div>

              <motion.div variants={fadeSlide} className="mt-6">
                <PatternInsights entries={entries} />
              </motion.div>

              <motion.div variants={fadeSlide} className="mt-6 mb-8">
                <EntriesTable entries={entries} />
              </motion.div>
            </>
          )}
        </motion.main>
      </div>
    </div>
  );
};

export default Analytics;
