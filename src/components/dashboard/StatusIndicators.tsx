import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Cloud, Zap } from "lucide-react";

type StatusType = "operational" | "calculating" | "error";

interface ServiceStatus {
  label: string;
  status: StatusType;
  Icon: typeof Activity;
  detail: string;
}

const statuses: ServiceStatus[] = [
  { label: "TRACKING", status: "operational", Icon: Activity, detail: "All systems operational" },
  { label: "SYNC", status: "operational", Icon: Cloud, detail: "Last sync: just now" },
  { label: "AI", status: "calculating", Icon: Zap, detail: "Processing insights..." },
];

const getStatusColor = (status: StatusType) => {
  switch (status) {
    case "operational":
      return "green";
    case "calculating":
      return "amber";
    case "error":
      return "red";
  }
};

const StatusIndicators = () => {
  const [showPanel, setShowPanel] = useState(false);

  return (
    <div className="relative">
      {/* Status Dots Row */}
      <button
        onClick={() => setShowPanel((prev) => !prev)}
        className="flex items-center gap-3 px-3 py-1.5 rounded-lg border border-primary/10 bg-background/50 hover:bg-background/80 transition-all"
        aria-label="Toggle system status panel"
      >
        {statuses.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className={`status-dot ${getStatusColor(s.status)}`} />
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider hidden sm:inline">
              {s.label}
            </span>
          </div>
        ))}
      </button>

      {/* Status Panel Modal */}
      <AnimatePresence>
        {showPanel && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setShowPanel(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="absolute top-full right-0 mt-2 w-80 mission-card p-4 z-50 shadow-2xl"
            >
              {/* Panel Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-mono text-xs text-muted-foreground/60 uppercase tracking-widest">
                  System Status
                </h3>
                <span className="font-mono text-[10px] text-primary/60">
                  {new Date().toLocaleTimeString("en-US", { hour12: false })}
                </span>
              </div>

              {/* Services */}
              <div className="space-y-2">
                {statuses.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-lg bg-background/30 border border-primary/5"
                  >
                    <div className="mt-0.5 p-1.5 rounded-md bg-primary/10">
                      <s.Icon size={13} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-mono text-xs text-foreground font-medium">
                          {s.label}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className={`status-dot ${getStatusColor(s.status)}`} />
                          <span
                            className={`font-mono text-[10px] uppercase tracking-wide ${
                              s.status === "operational"
                                ? "text-green-400"
                                : s.status === "calculating"
                                ? "text-amber-400"
                                : "text-red-400"
                            }`}
                          >
                            {s.status}
                          </span>
                        </div>
                      </div>
                      <p className="font-mono text-[11px] text-muted-foreground">{s.detail}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="mt-3 pt-3 border-t border-primary/10">
                <p className="font-mono text-[10px] text-muted-foreground/40 text-center">
                  Last checked: {new Date().toLocaleTimeString("en-US", { hour12: false })}
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StatusIndicators;
