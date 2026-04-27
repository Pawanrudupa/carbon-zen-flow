import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

/**
 * Single shared hook for all dashboard components.
 * Uses query key "dashboard-entries" so React Query deduplicates the request —
 * no matter how many components call this hook, only ONE Supabase call is made.
 * Each component then derives its specific view from the cached data.
 */
export const useDashboardData = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["dashboard-entries", user?.id],
    queryFn: async () => {
      if (!user) return [];
      // 8 weeks covers: TrendSparklines (8wk), CategoryBreakdown (month),
      // CarbonOrb (month), and LogTimeline (10 most recent).
      const eightWeeksAgo = new Date();
      eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

      const { data, error } = await supabase
        .from("entries")
        .select("*")
        .eq("user_id", user.id)
        .gte("logged_at", eightWeeksAgo.toISOString())
        .order("logged_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
};
