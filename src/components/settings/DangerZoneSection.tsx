import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";

const DangerZoneSection = () => {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-semibold text-destructive">Danger zone</h2>
        <p className="text-sm text-muted-foreground mt-1">Irreversible actions. Proceed with caution.</p>
      </div>

      <div className="space-y-3">
        <Button
          variant="outline"
          onClick={() => toast("This action is not available in demo mode.")}
          className="w-full justify-start border-destructive/30 text-destructive hover:bg-destructive/10"
        >
          Reset all data
        </Button>
        <p className="text-xs text-muted-foreground ml-1">Clears all entries but keeps your account active.</p>

        <Button
          variant="outline"
          onClick={() => setOpen(true)}
          className="w-full justify-start border-destructive/30 text-destructive hover:bg-destructive/10"
        >
          Delete account
        </Button>
        <p className="text-xs text-muted-foreground ml-1">Permanently delete your account and all associated data.</p>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
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
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => { setOpen(false); setConfirm(""); }}>Cancel</Button>
            <Button
              disabled={confirm !== "DELETE"}
              onClick={() => { toast("This action is not available in demo mode."); setOpen(false); setConfirm(""); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-30"
            >
              Delete account
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DangerZoneSection;
