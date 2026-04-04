import { useState } from "react";
import { UserPlus, Copy, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const INVITE_URL = "https://carbonledger.app/invite/ch3n-h0us3";

const InviteSection = () => {
  const [email, setEmail] = useState("");

  const copyLink = () => {
    navigator.clipboard.writeText(INVITE_URL);
    toast.success("Invite link copied!");
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
          Share this link or send an email invite
        </p>

        {/* Copy link */}
        <div className="flex w-full gap-2 mb-3">
          <Input
            value={INVITE_URL}
            readOnly
            className="h-9 bg-muted/30 border-primary/15 text-xs font-mono text-muted-foreground flex-1"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={copyLink}
            className="h-9 border-primary/30 text-primary hover:bg-primary/10 gap-1.5"
          >
            <Copy size={13} />
            Copy link
          </Button>
        </div>

        <div className="text-[10px] text-muted-foreground/50 my-2">OR</div>

        {/* Email invite */}
        <div className="flex w-full gap-2">
          <Input
            type="email"
            placeholder="name@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-9 bg-muted/30 border-primary/15 text-xs flex-1"
          />
          <Button
            size="sm"
            className="h-9 bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
            onClick={() => {
              toast.success("Invite sent!");
              setEmail("");
            }}
          >
            <Send size={13} />
            Send invite
          </Button>
        </div>

        <p className="text-[10px] text-muted-foreground/50 mt-4 font-mono">
          3/5 member slots used
        </p>
      </div>
    </div>
  );
};

export default InviteSection;
