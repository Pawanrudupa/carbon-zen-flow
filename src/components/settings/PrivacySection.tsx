import { useState } from "react";
import { Download, Trash2, UserX, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

const PrivacySection = () => {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [isExporting, setIsExporting] = useState(false);
  const [isDeletingEntries, setIsDeletingEntries] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleExportData = async () => {
    if (!user) return;
    try {
      setIsExporting(true);
      toast.info("Preparing your data export...");

      // 1. Fetch Profiles
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        throw profileError;
      }

      // 2. Fetch Entries
      const { data: entries, error: entriesError } = await supabase
        .from("entries")
        .select("*")
        .eq("user_id", user.id);

      if (entriesError) throw entriesError;

      // 3. Fetch User Challenges
      const { data: userChallenges, error: challengesError } = await supabase
        .from("user_challenges")
        .select("*, challenges(*)")
        .eq("user_id", user.id);

      if (challengesError) throw challengesError;

      // Combine all data
      const exportPayload = {
        exportedAt: new Date().toISOString(),
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.created_at,
        },
        profile: profile || null,
        entries: entries || [],
        challenges: userChallenges || [],
      };

      // Create blob and download
      const jsonString = JSON.stringify(exportPayload, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `carbon_ledger_export_${new Date().getTime()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      toast.success("Data export downloaded successfully!");
    } catch (error: any) {
      console.error("Data export failed:", error);
      toast.error("Failed to export data: " + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAllEntries = async () => {
    if (!user) return;
    
    const confirmDelete = window.confirm(
      "Are you absolutely sure you want to permanently delete ALL your logged entries? This action cannot be undone and your active dashboards and statistics will be wiped."
    );
    
    if (!confirmDelete) return;

    try {
      setIsDeletingEntries(true);
      toast.info("Deleting entries...");

      const { error } = await supabase
        .from("entries")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;

      // Invalidate dashboard and analytics query caches to reload them instantly
      queryClient.invalidateQueries();

      toast.success("All your entries have been successfully deleted.");
    } catch (error: any) {
      console.error("Deletion of entries failed:", error);
      toast.error("Failed to delete entries: " + error.message);
    } finally {
      setIsDeletingEntries(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    const confirmDelete = window.confirm(
      "WARNING: This will permanently delete your account and all associated data, including your profile, entries, and progress. This action is completely irreversible.\n\nAre you absolutely sure you want to proceed?"
    );

    if (!confirmDelete) return;

    try {
      setIsDeletingAccount(true);
      toast.info("Deleting account...");

      // 1. Delete user from the public.profiles table (cascades automatically to related tables)
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", user.id);

      if (error) throw error;

      // 2. Log out the user to invalidate local session
      await signOut();

      toast.success("Your account and all associated data have been permanently deleted.");
      navigate("/login");
    } catch (error: any) {
      console.error("Account deletion failed:", error);
      toast.error("Failed to delete account: " + error.message);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-xl font-semibold text-foreground">Privacy & data</h2>

      <div className="space-y-4">
        {/* Export Data Card */}
        <div className="bg-card border border-primary/10 rounded-xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary/10">
            <Download size={18} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground">Export all data</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Download a full JSON export of all your logged entries, challenges, and insights
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportData}
            disabled={isExporting}
            className="border-primary/20 text-primary hover:bg-primary/10 min-w-[90px]"
          >
            {isExporting ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
            {isExporting ? "Exporting..." : "Export"}
          </Button>
        </div>

        {/* Delete All Entries Card */}
        <div className="bg-card border border-primary/10 rounded-xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-destructive/10">
            <Trash2 size={18} className="text-destructive" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground">Delete all entries</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Permanently remove all logged entries. Your account will remain active.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeleteAllEntries}
            disabled={isDeletingEntries}
            className="border-destructive text-destructive hover:bg-destructive/10 min-w-[120px]"
          >
            {isDeletingEntries ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
            {isDeletingEntries ? "Deleting..." : "Delete entries"}
          </Button>
        </div>

        {/* Delete Account Card */}
        <div className="bg-card border border-primary/10 rounded-xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-destructive/10">
            <UserX size={18} className="text-destructive" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground">Delete account</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Permanently delete your CarbonLedger account and all data.
            </p>
          </div>
          <Button
            variant="default"
            size="sm"
            onClick={handleDeleteAccount}
            disabled={isDeletingAccount}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 min-w-[120px]"
          >
            {isDeletingAccount ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
            {isDeletingAccount ? "Deleting..." : "Delete account"}
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Your data is stored securely. We never sell personal data. See our{" "}
        <span className="text-primary cursor-pointer hover:underline">Privacy Policy</span>.
      </p>
    </div>
  );
};

export default PrivacySection;
