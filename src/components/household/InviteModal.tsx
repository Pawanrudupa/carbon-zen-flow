import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  householdId: string;
}

const InviteModal = ({ open, onOpenChange, householdId }: Props) => {
  const [copied, setCopied] = useState(false);

  const { data: invite } = useQuery({
    queryKey: ["household-invite", householdId],
    queryFn: async () => {
      const { data } = await supabase
        .from("household_invites" as any)
        .select("invite_code")
        .eq("household_id", householdId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data as { invite_code: string } | null;
    },
    enabled: !!householdId && open,
  });

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-primary/10 max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-heading text-foreground">Invite a Member</DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs">
            Share this link — anyone with it can join your household
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Invite URL */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Invite link</label>
            <div className="flex gap-2">
              <Input
                value={inviteUrl || "Generating…"}
                readOnly
                onFocus={(e) => e.target.select()}
                className="h-9 bg-muted/30 border-primary/15 text-xs font-mono text-muted-foreground flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                disabled={!inviteUrl}
                className="h-9 border-primary/30 text-primary hover:bg-primary/10 flex-shrink-0"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </Button>
            </div>
          </div>

          {invite?.invite_code && (
            <p className="text-[10px] text-muted-foreground text-center font-mono">
              Code: <span className="text-primary tracking-widest">{invite.invite_code}</span>
            </p>
          )}

          <Button
            onClick={() => onOpenChange(false)}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InviteModal;
