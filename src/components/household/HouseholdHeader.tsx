import { useState } from "react";
import { Pencil, Check, X, LogOut, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface Props {
  onInvite: () => void;
  householdId: string;
  householdName: string;
  goalMonthlyKg: number;
  memberCount: number;
  isOwner: boolean;
}

const HouseholdHeader = ({
  onInvite,
  householdId,
  householdName,
  goalMonthlyKg,
  memberCount,
  isOwner,
}: Props) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(householdName);
  const [goal, setGoal] = useState(String(goalMonthlyKg || 800));
  const [saving, setSaving] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // ── Save name/goal ────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("households" as any)
        .update({
          name: name.trim(),
          goal_monthly_kg: parseFloat(goal) || 800,
        })
        .eq("id", householdId);
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["household-membership"] });
      queryClient.invalidateQueries({ queryKey: ["household-overview", householdId] });
      toast.success("Household updated!");
      setEditing(false);
    } catch (err: any) {
      toast.error("Failed to update: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setName(householdName);
    setGoal(String(goalMonthlyKg || 800));
    setEditing(false);
  };

  // ── Leave household ───────────────────────────────────────────────────────
  const handleLeave = async () => {
    if (!user) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("household_members" as any)
        .delete()
        .eq("household_id", householdId)
        .eq("user_id", user.id);
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["household-membership"] });
      toast.success("You have left the household.");
      setShowLeaveDialog(false);
      navigate("/household");
    } catch (err: any) {
      toast.error("Failed to leave: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ── Delete household (owner only) ─────────────────────────────────────────
  const handleDelete = async () => {
    if (!user || !isOwner) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("households" as any)
        .delete()
        .eq("id", householdId);
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["household-membership"] });
      toast.success("Household deleted.");
      setShowDeleteDialog(false);
      navigate("/household");
    } catch (err: any) {
      toast.error("Failed to delete: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-start justify-between flex-wrap gap-4">
        {/* Left: title + name */}
        <div>
          <h1 className="font-heading text-[32px] font-bold text-foreground">Household</h1>
          <p className="text-muted-foreground text-sm mt-1 flex items-center gap-2">
            Track your impact together
            <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              <Users size={10} />
              {memberCount} {memberCount === 1 ? "member" : "members"}
            </span>
          </p>

          {/* Household name (editable by owner) */}
          <div className="mt-3 flex items-start gap-2 group">
            {editing ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-8 w-64 bg-muted/30 border-primary/20 font-heading text-sm text-foreground"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && handleSave()}
                    placeholder="Household name"
                  />
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="text-primary hover:text-primary/80 disabled:opacity-50"
                  >
                    <Check size={16} />
                  </button>
                  <button onClick={handleCancelEdit} className="text-muted-foreground hover:text-foreground">
                    <X size={16} />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[10px] text-muted-foreground font-mono uppercase w-24">
                    Monthly Goal
                  </label>
                  <Input
                    type="number"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    className="h-7 w-28 bg-muted/30 border-primary/20 text-xs text-foreground"
                    placeholder="800"
                    min="0"
                  />
                  <span className="text-[10px] text-muted-foreground">kg CO₂/month</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-heading text-sm text-foreground/80">{name}</span>
                {isOwner && (
                  <button
                    onClick={() => setEditing(true)}
                    className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                  >
                    <Pencil size={13} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={onInvite}
            className="border-primary/30 text-primary hover:bg-primary/10 gap-1.5 h-9"
          >
            <Users size={14} />
            Invite
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLeaveDialog(true)}
            className="border-muted text-muted-foreground hover:text-foreground hover:bg-muted/20 gap-1.5 h-9"
          >
            <LogOut size={14} />
            Leave
          </Button>

          {isOwner && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="border-destructive/30 text-destructive hover:bg-destructive/10 gap-1.5 h-9"
            >
              <Trash2 size={14} />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Leave dialog */}
      <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <DialogContent className="bg-card border-primary/10 max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-foreground">Leave household?</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              You will lose access to all shared household data. You can rejoin later with an invite link.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-2">
            <Button
              variant="outline"
              className="flex-1 border-primary/20"
              onClick={() => setShowLeaveDialog(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleLeave}
              disabled={actionLoading}
            >
              {actionLoading ? "Leaving…" : "Yes, Leave"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-card border-primary/10 max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-foreground text-destructive">
              Delete household?
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              This will permanently delete <strong className="text-foreground">{name}</strong> and remove
              all members. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-2">
            <Button
              variant="outline"
              className="flex-1 border-primary/20"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={actionLoading}
            >
              {actionLoading ? "Deleting…" : "Yes, Delete Forever"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default HouseholdHeader;
