import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const benefits = ["Full PDF exports", "CSV data access", "Scheduled auto-reports"];

const UpgradeCTA = () => {
  return (
    <div
      className="rounded-xl border p-6"
      style={{
        borderColor: "rgba(34,197,94,0.2)",
        background: "#111A14",
        boxShadow: "0 0 40px rgba(34,197,94,0.06)",
      }}
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h3 className="font-heading text-lg font-semibold text-foreground mb-3">
            Unlock unlimited reports
          </h3>
          <div className="space-y-2">
            {benefits.map((b) => (
              <div key={b} className="flex items-center gap-2">
                <CheckCircle size={14} className="text-primary" />
                <span className="text-sm text-foreground/80">{b}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <p className="font-mono text-2xl font-bold text-foreground">₹299<span className="text-sm text-muted-foreground">/month</span></p>
          <p className="text-[10px] text-muted-foreground mt-1">
            or ₹2,990/year (save 2 months)
          </p>
          <Button className="mt-3 bg-primary text-primary-foreground hover:bg-primary/90 text-sm px-6">
            Upgrade to Premium
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeCTA;
