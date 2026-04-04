import { Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  isPremium: boolean;
}

const ReportsHeader = ({ isPremium }: Props) => {
  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-[32px] font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Your carbon story, beautifully documented
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))] text-xs font-mono font-semibold">
          <Crown size={13} />
          Premium
        </span>
      </div>

      {!isPremium && (
        <div
          className="mt-4 flex items-center justify-between rounded-xl px-4 py-3"
          style={{
            background: "rgba(251,191,36,0.06)",
            border: "1px solid rgba(251,191,36,0.15)",
          }}
        >
          <span className="text-xs text-[hsl(var(--warning))]">
            Unlock full reports with CarbonLedger Premium — ₹299/month
          </span>
          <Button
            size="sm"
            className="h-7 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Upgrade
          </Button>
        </div>
      )}
    </div>
  );
};

export default ReportsHeader;
