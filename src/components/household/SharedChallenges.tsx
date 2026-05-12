import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface SharedChallengesProps {
  householdId: string;
  memberCount: number;
}

const SharedChallenges = ({ householdId, memberCount }: SharedChallengesProps) => {
  const [challengeName, setChallengeName] = useState("");
  const [category, setCategory] = useState("");
  const [duration, setDuration] = useState("");
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: activeChallenges = [], isLoading: isLoadingActive } = useQuery({
    queryKey: ["household-active-challenges", householdId],
    queryFn: async () => {
      const { data: challenges, error: chError } = await supabase
        .from("challenges")
        .select("*")
        .eq("household_id", householdId);
      
      if (chError) throw chError;
      if (!challenges?.length) return [];

      const challengeIds = challenges.map((c) => c.id);
      const { data: userChallenges, error: ucError } = await supabase
        .from("user_challenges")
        .select("challenge_id, progress, user_id")
        .in("challenge_id", challengeIds);
      
      if (ucError) throw ucError;

      const { data: members, error: memError } = await supabase
        .from("household_members")
        .select("user_id")
        .eq("household_id", householdId);
      
      if (memError) throw memError;
      const memberIds = new Set(members.map((m) => m.user_id));

      const colors = ["hsl(142,71%,45%)", "hsl(217,91%,60%)", "hsl(255,82%,76%)", "hsl(38,95%,51%)"];

      return challenges.map((ch) => {
        const ucs = userChallenges.filter((uc) => uc.challenge_id === ch.id && memberIds.has(uc.user_id));
        const participants = ucs.length;
        const progressList = ucs.map((uc) => uc.progress || 0);
        const avgProgress = participants > 0 ? progressList.reduce((a, b) => a + b, 0) / participants : 0;
        
        return {
          id: ch.id,
          name: ch.title,
          participantsCount: participants,
          progress: Math.round(avgProgress),
          memberProgress: progressList.map((p, i) => ({
            progress: p,
            color: colors[i % colors.length]
          }))
        };
      });
    },
    enabled: !!householdId
  });

  const { data: suggestions = [], isLoading: isLoadingSuggestions } = useQuery({
    queryKey: ["household-suggestions", householdId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("household_challenge_suggestions")
        .select("id, title, category, duration_days, created_by")
        .eq("household_id", householdId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Error fetching suggestions:", error);
        throw error;
      }
      if (!data?.length) return [];

      const userIds = [...new Set(data.map((d) => d.created_by))];
      const { data: profilesData, error: profError } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", userIds);

      if (profError) {
        console.error("Error fetching profiles:", profError);
      }

      const profileMap = new Map(profilesData?.map((p) => [p.id, p.username]) || []);

      return data.map((d) => ({
        ...d,
        profiles: { username: profileMap.get(d.created_by) || "Unknown" }
      }));
    },
    enabled: !!householdId
  });

  const suggestMutation = useMutation({
    mutationFn: async () => {
      if (!challengeName || !category || !duration) throw new Error("Please fill all fields");
      const { error } = await supabase
        .from("household_challenge_suggestions")
        .insert({
          household_id: householdId,
          created_by: user!.id,
          title: challengeName,
          category,
          duration_days: parseInt(duration, 10),
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Suggestion submitted!");
      setChallengeName("");
      setCategory("");
      setDuration("");
      queryClient.invalidateQueries({ queryKey: ["household-suggestions", householdId] });
    },
    onError: (err: any) => toast.error(err.message)
  });

  const acceptMutation = useMutation({
    mutationFn: async (suggestion: any) => {
      const { data: ch, error: chErr } = await supabase
        .from("challenges")
        .insert({
          title: suggestion.title,
          description: `Custom household challenge: ${suggestion.title}`,
          category: suggestion.category,
          duration_days: suggestion.duration_days,
          household_id: householdId,
          is_custom: true,
          xp_reward: 200,
          badge_emoji: "🌟",
        })
        .select()
        .single();
      
      if (chErr) throw chErr;

      const { error: sugErr } = await supabase
        .from("household_challenge_suggestions")
        .update({ status: "accepted" })
        .eq("id", suggestion.id);
      
      if (sugErr) throw sugErr;
    },
    onSuccess: () => {
      toast.success("Suggestion accepted and added to active challenges!");
      queryClient.invalidateQueries({ queryKey: ["household-suggestions", householdId] });
      queryClient.invalidateQueries({ queryKey: ["household-active-challenges", householdId] });
    },
    onError: (err: any) => toast.error("Failed to accept suggestion: " + err.message)
  });

  const declineMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("household_challenge_suggestions")
        .update({ status: "declined" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.info("Suggestion declined.");
      queryClient.invalidateQueries({ queryKey: ["household-suggestions", householdId] });
    },
    onError: (err: any) => toast.error("Failed to decline suggestion: " + err.message)
  });

  return (
    <div>
      <h3 className="font-heading text-lg font-semibold text-foreground mb-4">As a household</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Active Challenges */}
        <div
          className="rounded-xl border bg-card p-5 flex flex-col"
          style={{ borderColor: "rgba(34,197,94,0.12)" }}
        >
          <h4 className="text-sm font-semibold text-foreground mb-4">Active household challenges</h4>
          <div className="space-y-4 flex-1">
            {isLoadingActive ? (
              <div className="animate-pulse flex flex-col gap-3">
                <div className="h-10 bg-muted/20 rounded-md"></div>
                <div className="h-10 bg-muted/20 rounded-md"></div>
              </div>
            ) : activeChallenges.length === 0 ? (
              <p className="text-xs text-muted-foreground font-mono">No active custom challenges yet.</p>
            ) : (
              activeChallenges.map((c) => (
                <div key={c.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-foreground">{c.name}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {c.participantsCount}/{memberCount} members
                    </span>
                  </div>
                  {/* Multi-segment progress bar */}
                  <div className="h-2 rounded-full bg-muted/30 overflow-hidden flex">
                    {c.memberProgress.length > 0 ? (
                      c.memberProgress.map((mp, ci) => (
                        <motion.div
                          key={ci}
                          className="h-full"
                          style={{ backgroundColor: mp.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${(mp.progress / 100) * (100 / c.memberProgress.length)}%` }}
                          transition={{ duration: 0.8, delay: ci * 0.1 }}
                        />
                      ))
                    ) : (
                      <div className="h-full w-0" />
                    )}
                  </div>
                  <p className="text-[10px] font-mono text-muted-foreground mt-1">{c.progress}% overall</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Suggest a challenge */}
        <div
          className="rounded-xl border bg-card p-5 flex flex-col"
          style={{ borderColor: "rgba(34,197,94,0.12)" }}
        >
          <h4 className="text-sm font-semibold text-foreground mb-4">Suggest a challenge</h4>
          <div className="space-y-3">
            <Input
              placeholder="Challenge name"
              value={challengeName}
              onChange={(e) => setChallengeName(e.target.value)}
              className="h-9 bg-muted/30 border-primary/15 text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-9 bg-muted/30 border-primary/15 text-xs">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="food">Food</SelectItem>
                  <SelectItem value="transport">Transport</SelectItem>
                  <SelectItem value="energy">Energy</SelectItem>
                  <SelectItem value="shopping">Shopping</SelectItem>
                </SelectContent>
              </Select>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="h-9 bg-muted/30 border-primary/15 text-xs">
                  <SelectValue placeholder="Duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => suggestMutation.mutate()}
              disabled={suggestMutation.isPending || !challengeName || !category || !duration}
              className="w-full h-9 text-xs bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {suggestMutation.isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
              Suggest to household
            </Button>
          </div>

          {/* Recent suggestions */}
          <div className="mt-4 pt-3 border-t border-primary/10 flex-1 overflow-auto">
            <p className="text-[10px] text-muted-foreground mb-2">Recent suggestions</p>
            {isLoadingSuggestions ? (
              <div className="animate-pulse space-y-2">
                <div className="h-6 bg-muted/20 rounded"></div>
                <div className="h-6 bg-muted/20 rounded"></div>
              </div>
            ) : suggestions.length === 0 ? (
              <p className="text-[10px] font-mono text-muted-foreground/50">No pending suggestions.</p>
            ) : (
              suggestions.map((s: any) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between py-2 border-b last:border-b-0 border-primary/5"
                >
                  <div className="flex flex-col">
                    <span className="text-xs text-foreground/80 truncate max-w-[140px]">{s.title}</span>
                    <span className="text-[9px] text-muted-foreground">
                      by {s.profiles?.username || "Unknown"} • {s.duration_days}d
                    </span>
                  </div>
                  <div className="flex gap-2 shrink-0 ml-2">
                    <button
                      onClick={() => acceptMutation.mutate(s)}
                      disabled={acceptMutation.isPending || declineMutation.isPending}
                      className="text-[10px] font-semibold text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => declineMutation.mutate(s.id)}
                      disabled={acceptMutation.isPending || declineMutation.isPending}
                      className="text-[10px] font-semibold text-destructive/80 hover:text-destructive transition-colors disabled:opacity-50"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharedChallenges;
