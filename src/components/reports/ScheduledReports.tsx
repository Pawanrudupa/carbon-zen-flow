import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Pencil, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const ScheduledReports = () => {
  const { user } = useAuth()
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [emailNotify, setEmailNotify] = useState(true);
  const [editingEmail, setEditingEmail] = useState(false);
  const [email, setEmail] = useState(user?.email || "");

  useEffect(() => {
    if (user?.email) setEmail(user.email)
  }, [user])

  return (
    <div
      className="rounded-xl border bg-card p-5"
      style={{ borderColor: "rgba(34,197,94,0.12)" }}
    >
      <h3 className="font-heading text-base font-semibold text-foreground mb-4">
        Auto-generate
      </h3>

      <div className="space-y-4">
        {/* Auto-generate toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-foreground">Auto-generate monthly report</p>
            {autoGenerate && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Every 1st of the month, a PDF report will be generated for the previous month
              </p>
            )}
          </div>
          <Switch checked={autoGenerate} onCheckedChange={setAutoGenerate} />
        </div>

        {autoGenerate && (
          <>
            {/* Email toggle */}
            <div className="flex items-center justify-between border-t border-primary/5 pt-4">
              <p className="text-sm text-foreground">Email me when ready</p>
              <Switch checked={emailNotify} onCheckedChange={setEmailNotify} />
            </div>

            {/* Email field */}
            {emailNotify && (
              <div className="flex items-center gap-2 border-t border-primary/5 pt-4">
                <span className="text-xs text-muted-foreground">Email:</span>
                {editingEmail ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-7 w-56 bg-muted/30 border-primary/20 text-xs font-mono"
                      autoFocus
                      onKeyDown={(e) => e.key === "Enter" && setEditingEmail(false)}
                    />
                    <button onClick={() => setEditingEmail(false)} className="text-primary">
                      <Check size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingEmail(true)}
                    className="flex items-center gap-1.5 text-xs font-mono text-foreground/70 hover:text-foreground group transition-colors"
                  >
                    {email}
                    <Pencil size={11} className="opacity-0 group-hover:opacity-60 transition-opacity" />
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ScheduledReports;
