import { Download, Trash2, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const actions = [
  {
    icon: Download,
    title: "Export all data",
    desc: "Download a full JSON export of all your logged entries, challenges, and insights",
    btn: "Export",
    variant: "outline" as const,
    danger: false,
  },
  {
    icon: Trash2,
    title: "Delete all entries",
    desc: "Permanently remove all logged entries. Your account will remain active.",
    btn: "Delete entries",
    variant: "outline" as const,
    danger: true,
  },
  {
    icon: UserX,
    title: "Delete account",
    desc: "Permanently delete your CarbonLedger account and all data.",
    btn: "Delete account",
    variant: "default" as const,
    danger: true,
  },
];

const PrivacySection = () => (
  <div className="space-y-6">
    <h2 className="font-heading text-xl font-semibold text-foreground">Privacy & data</h2>

    <div className="space-y-4">
      {actions.map((a) => (
        <div key={a.title} className="bg-card border border-primary/10 rounded-xl p-5 flex items-start gap-4">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${a.danger ? "bg-destructive/10" : "bg-primary/10"}`}>
            <a.icon size={18} className={a.danger ? "text-destructive" : "text-primary"} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground">{a.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{a.desc}</p>
          </div>
          <Button
            variant={a.variant}
            size="sm"
            onClick={() => toast(a.danger ? "This action is not available in demo mode." : "Exporting data...")}
            className={a.danger ? (a.variant === "default" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : "border-destructive text-destructive hover:bg-destructive/10") : "border-primary/20 text-primary hover:bg-primary/10"}
          >
            {a.btn}
          </Button>
        </div>
      ))}
    </div>

    <p className="text-xs text-muted-foreground">
      Your data is stored securely. We never sell personal data. See our{" "}
      <span className="text-primary cursor-pointer hover:underline">Privacy Policy</span>.
    </p>
  </div>
);

export default PrivacySection;
