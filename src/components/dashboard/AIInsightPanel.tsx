import { useState, useRef, useCallback } from "react";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Bot, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

type ChatRole = "user" | "ai";
type MessageStatus = "ok" | "error";

interface ChatMessage {
  role: ChatRole;
  text: string;
  status?: MessageStatus;
}

/** Shape of what the Edge Function returns on success */
interface AIChatSuccessResponse {
  response: string;
}

/** Shape of what the Edge Function returns on failure */
interface AIChatErrorResponse {
  error: string;
}

type AIChatResponse = AIChatSuccessResponse | AIChatErrorResponse;



// ─── Animations (unchanged) ──────────────────────────────────────────────────

const cardVariant = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.3 + i * 0.12, duration: 0.5, ease: "easeOut" as const },
  }),
};

// ─── Error bubble text ────────────────────────────────────────────────────────

const ERROR_MESSAGE_SESSION = "You need to be logged in to use the AI assistant.";
const ERROR_MESSAGE_GENERIC = "Insight engine currently syncing. Try again in a moment.";

// ─── Component ────────────────────────────────────────────────────────────────

const AIInsightPanel = () => {
  const [query, setQuery] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  
  // Dynamic Cards State
  const [cardInsights, setCardInsights] = useState<{ pattern: string; action: string; forecast: string } | null>(null);
  const [isCardsLoading, setIsCardsLoading] = useState<boolean>(true);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // ─── Fetch Cards on Mount ───────────────────────────────────────────────────
  React.useEffect(() => {
    let isMounted = true;
    
    const fetchCards = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) return;

        const { data, error } = await supabase.functions.invoke<AIChatResponse>("ai-chat", {
          body: { query: "", type: "cards" },
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (error) throw error;
        if (!isMounted) return;

        if (data && !("error" in data)) {
          const rawText = (data as AIChatSuccessResponse).response;
          // The edge function might return markdown blocks if it disobeyed, so safely strip if needed
          const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanJson);
          
          setCardInsights({
            pattern: parsed.pattern || "Pattern data unavailable.",
            action: parsed.action || "Action data unavailable.",
            forecast: parsed.forecast || "Forecast data unavailable.",
          });
        }
      } catch (err) {
        console.error("Failed to load AI cards:", err);
      } finally {
        if (isMounted) setIsCardsLoading(false);
      }
    };

    fetchCards();
    return () => { isMounted = false; };
  }, []);

  /** Smooth-scroll the chat thread to the bottom */
  const scrollToBottom = useCallback(() => {
    setTimeout(
      () =>
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: "smooth",
        }),
      50
    );
  }, []);

  /** Append an AI error bubble without crashing the React tree */
  const appendErrorBubble = useCallback((message: string) => {
    setMessages((prev) => [
      ...prev,
      { role: "ai", text: message, status: "error" },
    ]);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== "Enter" || !query.trim() || isTyping) return;

      const userMsg = query.trim();
      setQuery("");

      // Optimistically append the user message
      const updatedMessages: ChatMessage[] = [
        ...messages,
        { role: "user", text: userMsg, status: "ok" },
      ];
      setMessages(updatedMessages);
      setIsTyping(true);
      scrollToBottom();

      try {
        // Explicitly fetch session and inject the token — most reliable approach
        // as supabase.functions.invoke auto-injection can fail if session isn't
        // hydrated yet at call time.
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
          throw new Error("NO_SESSION");
        }

        const { data, error: fnError } = await supabase.functions.invoke<AIChatResponse>(
          "ai-chat",
          {
            body: { query: userMsg },
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        );

        if (fnError) {
          console.error("Edge Function invocation error:", fnError);
          throw fnError;
        }

        // ── 4. Type-narrow the response
        if (!data) {
          throw new Error("Edge Function returned an empty payload.");
        }

        if ("error" in data) {
          // Server returned a structured error — surface gracefully
          console.error("Edge Function returned error payload:", data.error);
          throw new Error(data.error);
        }

        const reply = (data as AIChatSuccessResponse).response;
        if (!reply || typeof reply !== "string") {
          throw new Error("Malformed reply from AI service.");
        }

        setMessages((prev) => [
          ...prev,
          { role: "ai", text: reply, status: "ok" },
        ]);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("AI connection error:", message);

        appendErrorBubble(
          message === "NO_SESSION" ? ERROR_MESSAGE_SESSION : ERROR_MESSAGE_GENERIC
        );
      } finally {
        setIsTyping(false);
        scrollToBottom();
      }
    },
    [query, messages, isTyping, scrollToBottom, appendErrorBubble]
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="glass-card rounded-xl p-5 flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <motion.div
          animate={{ rotate: [0, 15, -15, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles className="text-primary" size={14} />
        </motion.div>
        <h3 className="font-heading font-600 text-foreground/80 text-xs">AI Insights</h3>
        <motion.div
          className="w-1.5 h-1.5 rounded-full bg-primary ml-auto"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </div>

      {(() => {
        const displayInsights = [
          {
            type: "PATTERN",
            text: cardInsights?.pattern || "Scanning 30-day emission patterns...",
            color: "text-chart-amber",
            bg: "bg-chart-amber/10",
          },
          {
            type: "ACTION",
            text: cardInsights?.action || "Computing high-impact reduction strategies...",
            color: "text-primary",
            bg: "bg-primary/10",
          },
          {
            type: "FORECAST",
            text: cardInsights?.forecast || "Projecting month-end carbon footprint...",
            color: "text-info",
            bg: "bg-info/10",
          },
        ];

        return (
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-3 mb-3 ${isCardsLoading ? 'opacity-60 animate-pulse' : ''}`}>
            {displayInsights.map((ins, i) => (
              <motion.div
                key={i}
                className="glass-card rounded-lg p-4 group hover:border-primary/20 transition-colors"
                variants={cardVariant}
                initial="hidden"
                animate="show"
                custom={i}
                whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              >
                <span
                  className={`font-mono text-[9px] uppercase tracking-[0.15em] ${ins.color} ${ins.bg} px-1.5 py-0.5 rounded`}
                >
                  {ins.type}
                </span>
                <p className="text-foreground/60 text-[11px] mt-2 leading-relaxed">{ins.text}</p>
              </motion.div>
            ))}
          </div>
        );
      })()}

      {/* Chat thread */}
      <AnimatePresence>
        {messages.length > 0 && (
          <motion.div
            ref={scrollRef}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="mb-3 max-h-48 overflow-y-auto space-y-2 scrollbar-thin"
          >
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "ai" && (
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      msg.status === "error"
                        ? "bg-destructive/15"
                        : "bg-primary/15"
                    }`}
                  >
                    {msg.status === "error" ? (
                      <AlertTriangle size={10} className="text-destructive" />
                    ) : (
                      <Bot size={10} className="text-primary" />
                    )}
                  </div>
                )}
                <div
                  className={`rounded-lg px-3 py-2 text-[11px] leading-relaxed max-w-[80%] whitespace-pre-line ${
                    msg.role === "user"
                      ? "bg-primary/15 text-foreground/80"
                      : msg.status === "error"
                      ? "bg-destructive/10 text-destructive/80 border border-destructive/20"
                      : "bg-muted/30 text-foreground/70 border border-primary/5"
                  }`}
                >
                  {msg.text.replace(/\*\*(.*?)\*\*/g, "$1")}
                </div>
              </motion.div>
            ))}

            {/* Typing indicator — Framer Motion pulse dots (unchanged animation) */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2"
              >
                <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center">
                  <Bot size={10} className="text-primary" />
                </div>
                <div className="flex gap-1">
                  {[0, 1, 2].map((d) => (
                    <motion.div
                      key={d}
                      className="w-1.5 h-1.5 rounded-full bg-primary/40"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: d * 0.2 }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleSubmit}
        disabled={isTyping}
        placeholder="Ask your data anything…"
        className="w-full px-3 py-2 rounded-lg bg-input border border-primary/10 text-foreground text-[11px] placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/30 transition-colors disabled:opacity-50"
      />
    </div>
  );
};

export default AIInsightPanel;