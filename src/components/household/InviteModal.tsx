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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const InviteModal = ({ open, onOpenChange }: Props) => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");

  const handleSend = () => {
    if (!email) return;
    toast.success(`Invite sent to ${email}`);
    setEmail("");
    setRole("member");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-primary/10 max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-heading text-foreground">Invite Member</DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs">
            Send an invite to join your household
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Email address</label>
            <Input
              type="email"
              placeholder="name@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-9 bg-muted/30 border-primary/15 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Role</label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="h-9 bg-muted/30 border-primary/15 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleSend}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Send invite
          </Button>
          <button
            onClick={() => onOpenChange(false)}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InviteModal;
