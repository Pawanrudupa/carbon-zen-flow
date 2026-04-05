import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  { label: "Carbon logging", free: true, premium: true },
  { label: "Basic analytics", free: true, premium: true },
  { label: "Challenges", free: true, premium: true },
  { label: "Full PDF reports", free: false, premium: true },
  { label: "CSV data export", free: false, premium: true },
  { label: "AI insights", free: false, premium: true },
  { label: "Scheduled reports", free: false, premium: true },
];

const BillingSection = () => (
  <div className="space-y-6">
    <h2 className="font-heading text-xl font-semibold text-foreground">Billing</h2>

    <div className="bg-card border border-primary/10 rounded-xl p-6 space-y-4">
      <div>
        <span className="text-xs text-muted-foreground uppercase tracking-wider">Current plan</span>
        <h3 className="text-2xl font-heading font-bold text-foreground mt-1">Free tier</h3>
      </div>

      <div className="space-y-2">
        {features.map((f) => (
          <div key={f.label} className="flex items-center gap-2 text-sm">
            {f.free ? (
              <Check size={14} className="text-primary" />
            ) : (
              <X size={14} className="text-muted-foreground/40" />
            )}
            <span className={f.free ? "text-foreground" : "text-muted-foreground/40"}>{f.label}</span>
          </div>
        ))}
      </div>

      <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
        Upgrade to Premium — <span className="font-mono">₹299/month</span>
      </Button>
    </div>

    <div className="space-y-3">
      <h3 className="text-sm font-medium text-foreground">Usage</h3>
      <p className="text-xs text-muted-foreground font-mono">Reports generated: 0/0 (free tier)</p>
    </div>

    <div className="space-y-3">
      <h3 className="text-sm font-medium text-foreground">Payment method</h3>
      <p className="text-xs text-muted-foreground">No payment method added</p>
      <Button variant="outline" size="sm" className="border-primary/20 text-primary hover:bg-primary/10">
        Add card
      </Button>
    </div>
  </div>
);

export default BillingSection;
