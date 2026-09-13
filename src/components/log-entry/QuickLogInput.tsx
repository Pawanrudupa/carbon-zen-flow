import { useState, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, AlertCircle, CheckCircle2, X } from "lucide-react";
import {
  parseQuickLogText,
  mapQuickLogToForm,
  QuickLogConfidence,
  QuickLogCategory,
} from "@/services/quickLogService";

interface QuickLogInputProps {
  onParsed: (data: {
    activeTab: QuickLogCategory;
    formData: Record<string, string>;
    confidence: QuickLogConfidence;
  }) => void;
  onClear: () => void;
}

const MAX_CHARS = 200;

export const QuickLogInput = ({ onParsed, onClear }: QuickLogInputProps) => {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "success" | "low_confidence" | "error"
  >("idle");
  const [feedbackMessage, setFeedbackMessage] = useState("");

  const handleParse = async () => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setStatus("idle");
    setFeedbackMessage("");

    try {
      const result = await parseQuickLogText(trimmed);

      if (!result.category || result.confidence === "low") {
        console.error("QuickLog parse failed:", result);
        onClear();
        setStatus("error");
        setFeedbackMessage("Couldn't parse that — try the form below");
        return;
      }

      const mapped = mapQuickLogToForm(result);
      if (!mapped) {
        console.error("QuickLog parse failed (could not map result to form):", result);
        onClear();
        setStatus("error");
        setFeedbackMessage("Couldn't parse that — try the form below");
        return;
      }

      // Populate existing form fields
      onParsed({
        activeTab: mapped.activeTab,
        formData: mapped.formData,
        confidence: result.confidence,
      });

      if (result.confidence === "medium") {
        setStatus("low_confidence");
        setFeedbackMessage(
          "Double-check these — some values were estimated from your description"
        );
      } else {
        setStatus("success");
        setFeedbackMessage("Form pre-filled! Review and edit below.");
      }
    } catch (err: any) {
      console.error("QuickLog parse failed:", err);
      onClear();
      setStatus("error");
      setFeedbackMessage("Couldn't parse that — try the form below");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (loading) return;
      handleParse();
    }
  };

  const handleClear = () => {
    setText("");
    setStatus("idle");
    setFeedbackMessage("");
  };

  return (
    <div className="mb-6">
      <div className="glass-card rounded-xl p-4 md:p-5 border border-primary/20 bg-gradient-to-r from-primary/5 via-muted/10 to-transparent relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center text-primary">
              <Sparkles size={15} />
            </div>
            <span className="text-sm font-heading font-semibold text-foreground">
              Quick Log
            </span>
            <span className="hidden sm:inline-block text-[11px] font-mono text-muted-foreground/70 px-2 py-0.5 rounded-full bg-muted/40 border border-border/40">
              Natural Language AI
            </span>
          </div>

          <span className="text-[11px] font-mono text-muted-foreground/60">
            {text.length}/{MAX_CHARS}
          </span>
        </div>

        {/* Input Bar */}
        <div className="relative flex items-center">
          <input
            type="text"
            value={text}
            maxLength={MAX_CHARS}
            onChange={(e) => {
              setText(e.target.value);
              if (status !== "idle") setStatus("idle");
            }}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder="Try: 'drove 40km to office' or 'had a chicken burger for lunch'"
            className="w-full pl-4 pr-24 py-3 rounded-lg bg-input/80 border border-primary/20 text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/30 transition-all font-body"
          />

          <div className="absolute right-2 flex items-center gap-1">
            {text && !loading && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 text-muted-foreground/60 hover:text-foreground transition-colors"
                title="Clear input"
              >
                <X size={15} />
              </button>
            )}

            <button
              type="button"
              onClick={handleParse}
              disabled={loading || !text.trim()}
              className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-heading font-semibold hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Parsing…</span>
                </>
              ) : (
                <>
                  <span>Parse</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Feedback / Status Banners */}
        <AnimatePresence>
          {status === "error" && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mt-2.5 flex items-center gap-2 text-xs text-muted-foreground font-mono"
            >
              <AlertCircle size={14} className="text-muted-foreground/70 flex-shrink-0" />
              <span>{feedbackMessage}</span>
            </motion.div>
          )}

          {status === "low_confidence" && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mt-2.5 flex items-center gap-2 text-xs text-amber-500 font-mono bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg"
            >
              <AlertCircle size={14} className="flex-shrink-0" />
              <span>{feedbackMessage}</span>
            </motion.div>
          )}

          {status === "success" && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mt-2.5 flex items-center gap-2 text-xs text-primary font-mono bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-lg"
            >
              <CheckCircle2 size={14} className="flex-shrink-0" />
              <span>{feedbackMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default QuickLogInput;
