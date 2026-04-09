import { motion } from "framer-motion";
import CountUp from "./CountUp";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { PenLine } from "lucide-react";

const CarbonOrb = () => {
  const { user } = useAuth();
  const target = 350;

  const { data: total = 0, isLoading } = useQuery({
    queryKey: ["monthly-co2", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const { data, error } = await supabase
        .from("entries")
        .select("co2_kg")
        .eq("user_id", user.id)
        .gte("logged_at", startOfMonth);
      if (error) throw error;
      return (data || []).reduce((sum, e) => sum + (e.co2_kg || 0), 0);
    },
    enabled: !!user,
  });

  const ratio = total / target;
  const progress = Math.min(ratio * 100, 100);
  const color = ratio < 0.8 ? "text-primary" : ratio <= 1 ? "text-chart-amber" : "text-destructive";
  const strokeColor = ratio < 0.8 ? "hsl(142 71% 45%)" : ratio <= 1 ? "hsl(45 93% 47%)" : "hsl(0 84% 60%)";
  const circumference = 2 * Math.PI * 120;

  const hasEntries = total > 0;

  return (
    <div className="glass-card rounded-xl p-6 flex flex-col items-center justify-center h-full">
      <span className="font-mono text-xs text-muted-foreground/60 uppercase tracking-widest mb-4">
        This Month
      </span>

      {isLoading ? (
        <div className="w-[240px] h-[240px] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <motion.div
            className="relative w-[240px] h-[240px] md:w-[280px] md:h-[280px] flex items-center justify-center"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <div
              className="absolute rounded-full"
              style={{
                width: "60%",
                height: "60%",
                background: `radial-gradient(circle, hsl(142 71% 45% / 0.12) 0%, transparent 70%)`,
              }}
            />

            <motion.svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 300 300"
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <circle cx="150" cy="150" r="142" fill="none" stroke="hsl(142 71% 45% / 0.15)" strokeWidth="1" strokeDasharray="6 10" />
            </motion.svg>

            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 300 300">
              <circle cx="150" cy="150" r="120" fill="none" stroke="hsl(142 71% 45% / 0.06)" strokeWidth="3" />
              <motion.circle
                cx="150" cy="150" r="120" fill="none"
                stroke={strokeColor} strokeWidth="3" strokeLinecap="round"
                initial={{ strokeDasharray: `0 ${circumference}` }}
                animate={{ strokeDasharray: `${(progress / 100) * circumference} ${circumference}` }}
                transition={{ duration: 1.8, ease: "easeOut" }}
              />
            </svg>

            <motion.div
              className="absolute rounded-full border border-primary/10"
              style={{ width: "65%", height: "65%" }}
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />

            <div className="relative z-10 flex flex-col items-center">
              <CountUp end={Math.round(total)} className={`font-mono text-4xl md:text-5xl font-bold ${color}`} duration={1500} />
              <span className="font-mono text-sm text-muted-foreground mt-1">kg CO₂</span>
            </div>
          </motion.div>

          {!hasEntries ? (
            <Link
              to="/log"
              className="mt-6 flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-heading font-600 hover:bg-primary/20 transition-colors"
            >
              <PenLine size={14} />
              Log your first entry to start tracking
            </Link>
          ) : (
            <div className="flex gap-3 mt-6">
              <span className="px-3 py-1.5 rounded-full glass-card text-xs font-mono text-primary">
                Target: {target} kg
              </span>
              <span className="px-3 py-1.5 rounded-full glass-card text-xs font-mono text-primary">
                {Math.round(progress)}% used
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CarbonOrb;
