import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

const DangerZoneSection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 1. Reset all data entries for the current user
  const handleResetData = async () => {
    if (!user) {
      toast.error("You must be logged in to reset data.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete all your carbon entries? This action cannot be undone."
    );
    if (!confirmed) return;

    try {
      setIsResetting(true);
      const { error } = await supabase
        .from("entries")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("All data entries successfully cleared.");
      // Dispatch a custom event to notify other components/dashboards to clear/reload their state
      window.dispatchEvent(new Event("entriesCleared"));
    } catch (error: any) {
      console.error("Error resetting data:", error.message);
      toast.error(error.message || "Could not reset data entries.");
    } finally {
      setIsResetting(false);
    }
  };

  // 2. Delete user account from the profiles table and sign out
  const handleDeleteAccount = async () => {
    if (!user) {
      toast.error("You must be logged in to delete your account.");
      return;
    }

    const confirmed = window.confirm(
      "WARNING: This will permanently delete your CarbonLedger account and all associated logs. Proceed?"
    );
    if (!confirmed) return;

    try {
      setIsDeleting(true);

      // Delete profile. PostgreSQL trigger cascades deletion to auth.users
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Sign out user immediately to clear auth session, local tokens, and cookies
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;

      toast.success("Account successfully deleted.");
      setOpen(false);
      setConfirm("");
      navigate("/");
    } catch (error: any) {
      console.error("Error deleting account:", error.message);
      toast.error(error.message || "Failed to delete account.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-semibold text-destructive">Danger zone</h2>
        <p className="text-sm text-muted-foreground mt-1">Irreversible actions. Proceed with caution.</p>
      </div>

      <div className="space-y-3">
        <Button
          variant="outline"
          disabled={isResetting || isDeleting}
          onClick={handleResetData}
          className="w-full justify-start border-destructive/30 text-destructive hover:bg-destructive/10 gap-2"
        >
          {isResetting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Resetting all data...</span>
            </>
          ) : (
            "Reset all data"
          )}
        </Button>
        <p className="text-xs text-muted-foreground ml-1">Clears all entries but keeps your account active.</p>

        <Button
          variant="outline"
          disabled={isResetting || isDeleting}
          onClick={() => setOpen(true)}
          className="w-full justify-start border-destructive/30 text-destructive hover:bg-destructive/10"
        >
          Delete account
        </Button>
        <p className="text-xs text-muted-foreground ml-1">Permanently delete your account and all associated data.</p>
      </div>

      <Dialog open={open} onOpenChange={(val) => { if (!isDeleting) setOpen(val); }}>
        <DialogContent className="bg-card border-destructive/20">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete account</DialogTitle>
            <DialogDescription>
              This action is permanent and cannot be undone. Type <span className="font-mono font-bold text-foreground">DELETE</span> to confirm.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder='Type "DELETE" to confirm'
            className="bg-background border-destructive/20 font-mono"
            disabled={isDeleting}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" disabled={isDeleting} onClick={() => { setOpen(false); setConfirm(""); }}>Cancel</Button>
            <Button
              disabled={confirm !== "DELETE" || isDeleting}
              onClick={handleDeleteAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-30 flex items-center gap-1.5 min-w-[120px] justify-center"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                "Delete account"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DangerZoneSection;
