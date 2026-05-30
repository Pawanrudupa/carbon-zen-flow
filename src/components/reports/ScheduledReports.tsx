import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Pencil, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const ScheduledReports = () => {
  const { user } = useAuth();
  
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [emailNotify, setEmailNotify] = useState(true);
  const [editingEmail, setEditingEmail] = useState(false);
  const [email, setEmail] = useState("");

  // Fetch initial settings from Supabase
  useEffect(() => {
    const fetchPreferences = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('auto_generate_reports, report_email')
        .eq('id', user.id)
        .single();
        
      if (!error && data) {
        if (data.auto_generate_reports !== null) {
          setAutoGenerate(data.auto_generate_reports);
        }
        if (data.report_email) {
          setEmail(data.report_email);
        } else if (user.email) {
          // Fallback to user auth email if no preference saved
          setEmail(user.email);
        }
      }
    };
    
    fetchPreferences();
  }, [user]);

  const toggleAutoGenerate = async (newValue: boolean) => {
    const currentValue = autoGenerate;
    
    // 1. Instantly update the UI (Optimistic update)
    setAutoGenerate(newValue); 

    // 2. Save to Supabase
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({ 
        auto_generate_reports: newValue,
        report_email: email // Save the email they typed in the input box
      } as any)
      .eq('id', user.id);

    if (error) {
      console.error("Failed to save preference:", error);
      toast.error("Failed to save preference");
      // Revert UI if database fails
      setAutoGenerate(currentValue); 
    } else {
      console.log("Preferences saved successfully!");
      toast.success("Preferences saved successfully!");
    }
  };

  const saveEmailPreference = async (newEmail: string) => {
    const currentEmail = email;
    setEmail(newEmail);
    setEditingEmail(false);

    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({ report_email: newEmail } as any)
      .eq('id', user.id);

    if (error) {
      console.error("Failed to save email:", error);
      toast.error("Failed to save email");
      setEmail(currentEmail);
    } else {
      toast.success("Email address updated in Supabase!");
    }
  };

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
          <Switch checked={autoGenerate} onCheckedChange={toggleAutoGenerate} />
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
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          saveEmailPreference(email);
                        }
                      }}
                    />
                    <button 
                      onClick={() => saveEmailPreference(email)} 
                      className="text-primary"
                    >
                      <Check size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingEmail(true)}
                    className="flex items-center gap-1.5 text-xs font-mono text-foreground/70 hover:text-foreground group transition-colors"
                  >
                    {email || "Set email address"}
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
