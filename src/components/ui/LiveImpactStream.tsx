import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Activity, CheckCircle, Zap, Leaf } from 'lucide-react';

// Simulated live data feed
const MOCK_EVENTS = [
  { text: "Syncing household data...", icon: <Activity className="w-4 h-4 text-blue-400" />, type: "system" },
  { text: "Green Squad saved 42kg CO2 today. [VERIFIED]", icon: <CheckCircle className="w-4 h-4 text-emerald-400" />, type: "success" },
  { text: "Anomaly detected: Energy usage spike.", icon: <Zap className="w-4 h-4 text-amber-400" />, type: "warning" },
  { text: "Recalculating global offset metrics...", icon: <Activity className="w-4 h-4 text-blue-400" />, type: "system" },
  { text: "New custom challenge accepted by household.", icon: <Leaf className="w-4 h-4 text-emerald-400" />, type: "success" },
  { text: "Transport emissions dropped 12% this week.", icon: <CheckCircle className="w-4 h-4 text-emerald-400" />, type: "success" },
  { text: "Awaiting new log entries...", icon: <Terminal className="w-4 h-4 text-gray-500" />, type: "system" },
];

export default function LiveImpactStream() {
  const [logs, setLogs] = useState<typeof MOCK_EVENTS>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Simulates a live websocket or database stream
  useEffect(() => {
    let currentIndex = 0;
    
    // Start with the first log safely
    setLogs([MOCK_EVENTS[0]].filter(Boolean));
    currentIndex++;

    const interval = setInterval(() => {
      if (currentIndex < MOCK_EVENTS.length) {
        const nextEvent = MOCK_EVENTS[currentIndex];
        if (nextEvent) {
          setLogs(prev => [...prev, nextEvent]);
        }
        currentIndex++;
      } else {
        // Reset or loop for the sake of the demo, safely advancing after reset
        currentIndex = 0;
        setLogs([MOCK_EVENTS[0]].filter(Boolean));
        currentIndex++;
      }
    }, 3500); // New event every 3.5 seconds

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="w-full max-w-md bg-black/40 backdrop-blur-md border border-white/10 rounded-lg shadow-2xl overflow-hidden font-mono flex flex-col">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-500" />
          <span className="text-xs font-semibold text-gray-300 tracking-wider">LIVE_IMPACT_STREAM</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] text-emerald-500 tracking-widest uppercase">Connected</span>
        </div>
      </div>

      {/* Log Window */}
      <div 
        ref={scrollRef}
        className="h-64 p-4 overflow-y-auto scroll-smooth flex flex-col justify-end"
        style={{ scrollbarWidth: 'none' }} // Hides scrollbar on Firefox
      >
        <div className="flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {logs.filter(Boolean).map((log, index) => (
              <motion.div
                key={`${index}-${log?.text || ""}`}
                initial={{ opacity: 0, x: -10, y: 10 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="flex items-start gap-3"
              >
                <div className="mt-0.5 opacity-80 shrink-0">
                  {log?.icon || <Terminal className="w-4 h-4 text-gray-500" />}
                </div>
                <div className="flex flex-col">
                  <span className={`text-sm ${
                    log?.type === 'success' ? 'text-emerald-300' : 
                    log?.type === 'warning' ? 'text-amber-300' : 
                    'text-gray-400'
                  }`}>
                    <span className="text-gray-600 mr-2">{'>'}</span>
                    {log?.text || ""}
                  </span>
                  {/* Subtle timestamp */}
                  <span className="text-[10px] text-gray-600 mt-0.5">
                    {new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
