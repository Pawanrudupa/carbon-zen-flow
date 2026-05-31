import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import HouseholdHeader from "@/components/household/HouseholdHeader";
import HouseholdOverview from "@/components/household/HouseholdOverview";
import MemberCards from "@/components/household/MemberCards";
import Leaderboard from "@/components/household/Leaderboard";
import ActivityFeed from "@/components/household/ActivityFeed";
import SharedChallenges from "@/components/household/SharedChallenges";
import InviteSection from "@/components/household/InviteSection";
import InviteModal from "@/components/household/InviteModal";
import SkeletonCard from "@/components/ui/SkeletonCard";
import ErrorCard from "@/components/ui/ErrorCard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Plus, Key, Loader2 } from "lucide-react";
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
  const [createGoal, setCreateGoal] = useState("800");
  const [joinCode, setJoinCode] = useState("");
  const [joiningHouseholdName, setJoiningHouseholdName] = useState<string | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  // Auto-populate join code from URL (?join=ABCD1234)
  useEffect(() => {
    const codeFromUrl = searchParams.get("join");
    if (codeFromUrl && codeFromUrl.length >= 6) {
      const upper = codeFromUrl.toUpperCase();
      setJoinCode(upper);
      // Auto-validate after a tick so UI is ready
      setTimeout(() => validateCode(upper), 100);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fetch membership ──────────────────────────────────────────────────────
  const { data: membership, isLoading, isError, error: membershipError, refetch } = useQuery({
    queryKey: ["household-membership", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("household_members" as any)
        .select("household_id, role, households(name, goal_monthly_kg)")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as {
        household_id: string;
        role: string;
        households: { name: string; goal_monthly_kg: number };
      } | null;
    },
    enabled: !!user,
  });

  // ── Fetch member count ────────────────────────────────────────────────────
  const { data: memberCount = 0 } = useQuery({
    queryKey: ["household-member-count", membership?.household_id],
    queryFn: async () => {
      if (!membership?.household_id) return 0;
      const { count } = await supabase
        .from("household_members" as any)
        .select("id", { count: "exact", head: true })
        .eq("household_id", membership.household_id);
      return count || 0;
    },
    enabled: !!membership?.household_id,
  });

  // ── Create household ──────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async ({ name, goal }: { name: string; goal: number }) => {
      if (!user) throw new Error("No user");

      // 1. Insert household
      const { data: hh, error: hhErr } = await supabase
        .from("households" as any)
        .insert({ name, goal_monthly_kg: goal, created_by: user.id })
        .select()
        .single();
      if (hhErr) throw hhErr;

      // 2. Add user as owner
      const { error: memErr } = await supabase
        .from("household_members" as any)
        .insert({ household_id: (hh as any).id, user_id: user.id, role: "owner" });
      if (memErr) throw memErr;

      // 3. Auto-generate invite code
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      await supabase
        .from("household_invites" as any)
        .insert({ household_id: (hh as any).id, invite_code: code, created_by: user.id });
    },
    onSuccess: () => {
      toast.success("Household created!");
      queryClient.invalidateQueries({ queryKey: ["household-membership"] });
    },
    onError: (err: any) => {
      toast.error("Failed to create: " + err.message);
    },
  });

  // ── Validate invite code ──────────────────────────────────────────────────
  const validateCode = async (code: string) => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;

    const { data, error } = await supabase
      .from("household_invites" as any)
      .select("household_id, households(name)")
      .eq("invite_code", trimmed)
      .maybeSingle();

    if (error || !data) {
      toast.error("Invalid or expired invite code.");
      return;
    }

    setJoiningHouseholdName((data as any).households?.name || "this household");
  };

  // ── Join household ────────────────────────────────────────────────────────
  const joinMutation = useMutation({
    mutationFn: async (code: string) => {
      if (!user) throw new Error("No user");
      const trimmed = code.trim().toUpperCase();

      // Lookup invite
      const { data: invite, error: invErr } = await supabase
        .from("household_invites" as any)
        .select("household_id")
        .eq("invite_code", trimmed)
        .maybeSingle();

      if (invErr || !invite) throw new Error("Invalid or expired invite code.");

      const householdId = (invite as any).household_id;

      // Check not already a member
      const { data: existing } = await supabase
        .from("household_members" as any)
        .select("id")
        .eq("household_id", householdId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) throw new Error("You are already a member of this household.");

      // Join
      const { error: joinErr } = await supabase
        .from("household_members" as any)
        .insert({ household_id: householdId, user_id: user.id, role: "member" });
      if (joinErr) throw joinErr;
    },
    onSuccess: () => {
      toast.success(`Joined ${joiningHouseholdName || "household"}!`);
      setJoinCode("");
      setJoiningHouseholdName(null);
      queryClient.invalidateQueries({ queryKey: ["household-membership"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to join household.");
    },
  });

  const household = membership?.households;
  const isOwner = membership?.role === "owner";

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
          {isLoading ? (
            <div className="space-y-6">
              <SkeletonCard className="h-32" />
              <SkeletonCard className="h-64" />
            </div>
          ) : isError ? (
            <ErrorCard onRetry={() => refetch()} message={`Failed to load household data: ${(membershipError as any)?.message || "Unknown error"}`} />
          ) : !membership ? (
            /* ── NO HOUSEHOLD: Onboarding ───────────────────────────────── */
            <motion.div variants={fadeSlide} className="max-w-2xl mx-auto mt-8">
              <div className="glass-card rounded-2xl p-8 text-center flex flex-col items-center">
                {/* Icon */}
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 text-4xl">
                  👨‍👩‍👧‍👦
                </div>
                <h2 className="text-2xl font-heading font-bold text-foreground mb-2">
                  Track Together, Save Together
                </h2>
                <p className="text-muted-foreground text-sm mb-8 max-w-md leading-relaxed">
                  Create a household to track your family's carbon footprint, compete on
                  leaderboards, and achieve shared climate goals.
                </p>

                <div className="w-full max-w-sm space-y-6 text-left">
                  {/* Create */}
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase text-muted-foreground/70 tracking-wider">
                      Create New Household
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. The Green Team"
                      value={createName}
                      onChange={(e) => setCreateName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg bg-input border border-primary/10 text-sm focus:border-primary/30 outline-none"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="Monthly goal (kg)"
                        value={createGoal}
                        onChange={(e) => setCreateGoal(e.target.value)}
                        className="flex-1 px-4 py-2.5 rounded-lg bg-input border border-primary/10 text-sm focus:border-primary/30 outline-none font-mono"
                        min="0"
                      />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">kg CO₂/mo</span>
                    </div>
                    <button
                      onClick={() =>
                        createMutation.mutate({
                          name: createName.trim(),
                          goal: parseFloat(createGoal) || 800,
                        })
                      }
                      disabled={createMutation.isPending || !createName.trim()}
                      className="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {createMutation.isPending ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Plus size={16} />
                      )}
                      Create Household
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="relative border-t border-primary/10">
                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-[10px] font-mono text-muted-foreground">
                      OR
                    </span>
                  </div>

                  {/* Join */}
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase text-muted-foreground/70 tracking-wider">
                      Join with Invite Code
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter 8-char code"
                        value={joinCode}
                        maxLength={8}
                        onChange={(e) => {
                          setJoinCode(e.target.value.toUpperCase());
                          setJoiningHouseholdName(null);
                        }}
                        onBlur={() => joinCode.length >= 6 && validateCode(joinCode)}
                        className="flex-1 px-4 py-2.5 rounded-lg bg-input border border-primary/10 text-sm focus:border-primary/30 outline-none font-mono tracking-widest uppercase"
                      />
                      <button
                        onClick={() => joinMutation.mutate(joinCode)}
                        disabled={joinMutation.isPending || joinCode.length < 6}
                        className="px-4 py-2.5 bg-muted/30 text-muted-foreground rounded-lg text-sm font-semibold hover:bg-muted/50 transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        {joinMutation.isPending ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Key size={16} />
                        )}
                        Join
                      </button>
                    </div>

                    {/* Show household name preview */}
                    {joiningHouseholdName && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-primary font-mono"
                      >
                        ✓ Join "{joiningHouseholdName}"?
                      </motion.p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            /* ── HAS HOUSEHOLD: Full Dashboard ──────────────────────────── */
            <>
              <motion.div variants={fadeSlide}>
                <HouseholdHeader
                  onInvite={() => setInviteOpen(true)}
                  householdId={membership.household_id}
                  householdName={household?.name ?? "My Household"}
                  goalMonthlyKg={household?.goal_monthly_kg ?? 800}
                  memberCount={memberCount as number}
                  isOwner={isOwner}
                />
              </motion.div>

              <motion.div variants={fadeSlide} className="mt-6">
                <HouseholdOverview householdId={membership.household_id} />
              </motion.div>

              <motion.div variants={fadeSlide} className="mt-8">
                <Leaderboard householdId={membership.household_id} />
              </motion.div>

              <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div variants={fadeSlide}>
                  <MemberCards householdId={membership.household_id} />
                </motion.div>
                <motion.div variants={fadeSlide}>
                  <ActivityFeed householdId={membership.household_id} />
                </motion.div>
              </div>

              <motion.div variants={fadeSlide} className="mt-8">
                <SharedChallenges householdId={membership.household_id} memberCount={memberCount as number} />
              </motion.div>

              <motion.div variants={fadeSlide} className="mt-8 mb-8">
                <InviteSection
                  householdId={membership.household_id}
                  memberCount={memberCount as number}
                />
              </motion.div>
            </>
          )}
        </motion.main>
      </div>

      {membership && (
        <InviteModal
          open={inviteOpen}
          onOpenChange={setInviteOpen}
          householdId={membership.household_id}
        />
      )}
    </div>
  );
};

export default Household;
