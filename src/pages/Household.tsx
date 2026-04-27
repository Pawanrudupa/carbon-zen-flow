import { useState } from "react";
import { motion } from "framer-motion";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import HouseholdHeader from "@/components/household/HouseholdHeader";
import HouseholdOverview from "@/components/household/HouseholdOverview";
import MemberCards from "@/components/household/MemberCards";
import Leaderboard from "@/components/household/Leaderboard";
import SharedChallenges from "@/components/household/SharedChallenges";
import InviteSection from "@/components/household/InviteSection";
import InviteModal from "@/components/household/InviteModal";
import SkeletonCard from "@/components/ui/SkeletonCard";
import ErrorCard from "@/components/ui/ErrorCard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Plus, Key } from "lucide-react";
import { toast } from "sonner";

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

const Household = () => {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: householdMember, isLoading, isError, refetch } = useQuery({
    queryKey: ["household-membership", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("household_members")
        .select("household_id, role, households(name)")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error("No user");
      const { data: hh, error: hhErr } = await supabase
        .from("households")
        .insert({ name })
        .select()
        .single();
      if (hhErr) throw hhErr;

      const { error: memErr } = await supabase
        .from("household_members")
        .insert({ household_id: hh.id, user_id: user.id, role: "owner" });
      if (memErr) throw memErr;
    },
    onSuccess: () => {
      toast.success("Household created!");
      queryClient.invalidateQueries({ queryKey: ["household-membership"] });
    },
    onError: (err) => {
      toast.error("Failed to create: " + err.message);
    }
  });

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar />
      <div className="flex-1 md:ml-[64px] min-h-screen flex flex-col pb-16 md:pb-0">
        <DashboardHeader />
        <motion.main
          className="flex-1 p-5 md:p-8 overflow-auto"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          {isLoading ? (
            <div className="space-y-6">
              <SkeletonCard className="h-32" />
              <SkeletonCard className="h-64" />
            </div>
          ) : isError ? (
            <ErrorCard onRetry={() => refetch()} message="Failed to load household data" />
          ) : !householdMember ? (
            <motion.div variants={fadeSlide} className="max-w-2xl mx-auto mt-8">
              <div className="glass-card rounded-xl p-8 text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <Users className="text-primary w-8 h-8" />
                </div>
                <h2 className="text-2xl font-heading font-700 text-foreground mb-2">Join or Create a Household</h2>
                <p className="text-muted-foreground text-sm mb-8 max-w-md">
                  Team up with your family or roommates to track collective emissions, compete on leaderboards, and take on shared challenges.
                </p>
                
                <div className="w-full max-w-sm space-y-6 text-left">
                  <div className="space-y-3">
                    <label className="text-xs font-mono uppercase text-muted-foreground/70">Create New Household</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="e.g. The Green Team"
                        value={createName}
                        onChange={(e) => setCreateName(e.target.value)}
                        className="flex-1 px-4 py-2.5 rounded-lg bg-input border border-primary/10 text-sm focus:border-primary/30 outline-none"
                      />
                      <button 
                        onClick={() => createMutation.mutate(createName)}
                        disabled={createMutation.isPending || !createName.trim()}
                        className="px-4 py-2.5 bg-primary/20 text-primary rounded-lg text-sm font-semibold hover:bg-primary/30 transition-colors flex items-center gap-2"
                      >
                        <Plus size={16} /> Create
                      </button>
                    </div>
                  </div>

                  <div className="relative border-t border-primary/10 my-4">
                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-sidebar px-2 text-[10px] font-mono text-muted-foreground">OR</span>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-mono uppercase text-muted-foreground/70">Join with Code</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Enter invite code"
                        className="flex-1 px-4 py-2.5 rounded-lg bg-input border border-primary/10 text-sm focus:border-primary/30 outline-none font-mono"
                      />
                      <button className="px-4 py-2.5 bg-muted/30 text-muted-foreground rounded-lg text-sm font-semibold hover:bg-muted/50 transition-colors flex items-center gap-2">
                        <Key size={16} /> Join
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <>
              <motion.div variants={fadeSlide}>
                <HouseholdHeader 
                  onInvite={() => setInviteOpen(true)} 
                  householdName={(householdMember.households as any)?.name ?? "My Household"} 
                />
              </motion.div>
              <motion.div variants={fadeSlide} className="mt-6">
                <HouseholdOverview householdId={householdMember.household_id} />
              </motion.div>
              <motion.div variants={fadeSlide} className="mt-8">
                <MemberCards householdId={householdMember.household_id} />
              </motion.div>
              <motion.div variants={fadeSlide} className="mt-8">
                <Leaderboard householdId={householdMember.household_id} />
              </motion.div>
              <motion.div variants={fadeSlide} className="mt-8">
                <SharedChallenges />
              </motion.div>
              <motion.div variants={fadeSlide} className="mt-8 mb-8">
                <InviteSection />
              </motion.div>
            </>
          )}
        </motion.main>
      </div>
      {householdMember && <InviteModal open={inviteOpen} onOpenChange={setInviteOpen} />}
    </div>
  );
};

export default Household;
