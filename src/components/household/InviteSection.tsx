import { useState } from "react";
import { Copy, Check, UserPlus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface InviteSectionProps {
  householdId: string;
  memberCount: number;
}

const InviteSection = ({ householdId, memberCount }: InviteSectionProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  // ── Fetch existing active invite code ─────────────────────────────────────
  const { data: invite, isLoading } = useQuery({
    queryKey: ["household-invite", householdId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("household_invites" as any)
        .select("invite_code, id")
        .eq("household_id", householdId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as { invite_code: string; id: string } | null;
    },
    enabled: !!householdId,
  });

  // ── Generate a new invite code ────────────────────────────────────────────
  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");

      // Delete old invites for this household first
      await supabase
        .from("household_invites" as any)
        .delete()
        .eq("household_id", householdId);

      // Generate new code (8 chars, uppercase)
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();

      const { data, error } = await supabase
        .from("household_invites" as any)
        .insert({
          household_id: householdId,
          invite_code: code,
          created_by: user.id,
        })
        .select("invite_code, id")
        .single();
      if (error) throw error;
      return data as { invite_code: string; id: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["household-invite", householdId] });
      toast.success("New invite code generated!");
    },
    onError: (err: any) => {
      toast.error("Failed to generate invite: " + err.message);
    },
  });

  // ── Auto-generate if none exists ─────────────────────────────────────────
  if (!isLoading && !invite && !generateMutation.isPending) {
    generateMutation.mutate();
  }

  const inviteUrl = invite?.invite_code
    ? `${window.location.origin}/household?join=${invite.invite_code}`
    : "";

  const handleCopy = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    toast.success("Invite link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="rounded-xl border-2 border-dashed p-6"
      style={{ borderColor: "rgba(34,197,94,0.25)", background: "rgba(17,26,20,0.6)" }}
    >
      <div className="flex flex-col items-center text-center max-w-md mx-auto">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
          <UserPlus size={20} className="text-primary" />
        </div>
        <h3 className="font-heading text-base font-semibold text-foreground">
          Invite someone to your household
        </h3>
        <p className="text-xs text-muted-foreground mt-1 mb-4">
          Share this link — anyone who opens it can join
        </p>

        {/* Invite link */}
        <div className="flex w-full gap-2 mb-3">
          <Input
            value={isLoading || generateMutation.isPending ? "Generating…" : inviteUrl}
            readOnly
            onFocus={(e) => e.target.select()}
            className="h-9 bg-muted/30 border-primary/15 text-xs font-mono text-muted-foreground flex-1"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            disabled={!inviteUrl}
            className="h-9 border-primary/30 text-primary hover:bg-primary/10 gap-1.5 flex-shrink-0"
          >
            {copied ? <Check size={13} className="text-primary" /> : <Copy size={13} />}
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>

        {/* Invite code (compact) */}
        {invite?.invite_code && (
          <p className="text-[10px] text-muted-foreground font-mono mb-3">
            Code:{" "}
            <span className="text-primary tracking-widest">{invite.invite_code}</span>
          </p>
        )}

        {/* Refresh code */}
        <button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
        >
          <RefreshCw size={10} className={generateMutation.isPending ? "animate-spin" : ""} />
          Generate new code
        </button>

        <p className="text-[10px] text-muted-foreground/50 mt-4 font-mono">
          {memberCount} member{memberCount !== 1 ? "s" : ""} in this household
        </p>
      </div>
    </div>
  );
};

export default InviteSection;
