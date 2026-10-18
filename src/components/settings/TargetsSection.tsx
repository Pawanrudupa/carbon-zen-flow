import { useState, useEffect } from "react";
import { Info, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const TargetsSection = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [monthly, setMonthly] = useState(350);
  const [annual, setAnnual] = useState(4200);
  const [netZeroYear, setNetZeroYear] = useState(2035);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadTargets() {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("monthly_target, yearly_target")
          .eq("id", user.id)
          .maybeSingle();

        if (data && !error) {
          if (data.monthly_target) setMonthly(Number(data.monthly_target));
          if (data.yearly_target) setAnnual(Number(data.yearly_target));
        }
      } catch (err) {
        console.error("Failed to load targets:", err);
      } finally {
        setLoading(false);
      }
    }
    loadTargets();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          monthly_target: monthly,
          yearly_target: annual,
        })
        .eq("id", user.id);

      if (error) throw error;
      toast.success("Targets updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["user-targets"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to update targets.");
    } finally {
      setSaving(false);
    }
  };

  const daily = (monthly / 30).toFixed(1);

  const currentYear = 2026;
  const totalSpan = netZeroYear - currentYear;
  const elapsed = 0.15;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-semibold text-foreground">Targets & goals</h2>
        <p className="text-sm text-muted-foreground mt-1">Set your monthly limits — we'll track your progress automatically</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            Monthly CO₂ target
            <Tooltip>
              <TooltipTrigger asChild>
                <Info size={14} className="text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="bg-card border-primary/20 text-foreground text-xs max-w-[220px]">
                Based on global per-capita averages adjusted for your region and lifestyle factors.
              </TooltipContent>
            </Tooltip>
          </label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={monthly}
              onChange={(e) => setMonthly(Number(e.target.value))}
              className="bg-card border-primary/20 font-mono w-32"
            />
            <span className="text-sm text-muted-foreground">kg/month</span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Daily average target</label>
          <div className="flex items-center gap-2">
            <Input value={daily} readOnly className="bg-card border-primary/20 font-mono w-32 opacity-60" />
            <span className="text-sm text-muted-foreground">kg/day (auto-calculated)</span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Annual target</label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={annual}
              onChange={(e) => setAnnual(Number(e.target.value))}
              className="bg-card border-primary/20 font-mono w-32"
            />
            <span className="text-sm text-muted-foreground">kg/year</span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Target year to reach net zero</label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={netZeroYear}
              onChange={(e) => setNetZeroYear(Number(e.target.value))}
              className="bg-card border-primary/20 font-mono w-32"
            />
          </div>
        </div>
      </div>

      {/* Target timeline */}
      <div className="bg-card border border-primary/10 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-medium text-foreground">Target timeline</h3>
        <div className="relative h-3 bg-muted rounded-full overflow-hidden">
          <div className="absolute inset-y-0 left-0 bg-primary/30 rounded-full" style={{ width: `${elapsed * 100}%` }} />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary shadow-[0_0_8px_rgba(34,197,94,0.5)]"
            style={{ left: `${elapsed * 100}%` }}
          />
          <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-destructive bg-background" style={{ left: "100%" , transform: "translate(-100%, -50%)" }} />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground font-mono">
          <span>{currentYear} (now)</span>
          <span>{netZeroYear} (net zero)</span>
        </div>
      </div>

      <Button 
        onClick={handleSave} 
        disabled={saving}
        className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2"
      >
        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
        {saving ? "Saving..." : "Save changes"}
      </Button>
    </div>
  );
};

export default TargetsSection;
