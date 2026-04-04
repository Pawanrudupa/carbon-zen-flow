import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const activeChallenges = [
  {
    name: "Meat-free Mondays together",
    participants: "3/3",
    progress: 60,
    colors: ["hsl(142,71%,45%)", "hsl(217,91%,60%)", "hsl(255,82%,76%)"],
  },
  {
    name: "Household energy audit",
    participants: "2/3",
    progress: 66,
    colors: ["hsl(142,71%,45%)", "hsl(217,91%,60%)"],
  },
];

const suggestions = [
  { name: "No-car Sundays", by: "Priya" },
  { name: "Local produce only", by: "Sam" },
];

const SharedChallenges = () => {
  const [challengeName, setChallengeName] = useState("");

  return (
    <div>
      <h3 className="font-heading text-lg font-semibold text-foreground mb-4">As a household</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Active */}
        <div
          className="rounded-xl border bg-card p-5"
          style={{ borderColor: "rgba(34,197,94,0.12)" }}
        >
          <h4 className="text-sm font-semibold text-foreground mb-4">Active household challenges</h4>
          <div className="space-y-4">
            {activeChallenges.map((c) => (
              <div key={c.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-foreground">{c.name}</span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {c.participants} members
                  </span>
                </div>
                {/* Multi-segment progress bar */}
                <div className="h-2 rounded-full bg-muted/30 overflow-hidden flex">
                  {c.colors.map((color, ci) => (
                    <motion.div
                      key={ci}
                      className="h-full"
                      style={{ backgroundColor: color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${c.progress / c.colors.length}%` }}
                      transition={{ duration: 0.8, delay: ci * 0.1 }}
                    />
                  ))}
                </div>
                <p className="text-[10px] font-mono text-muted-foreground mt-1">{c.progress}%</p>
              </div>
            ))}
          </div>
        </div>

        {/* Suggest */}
        <div
          className="rounded-xl border bg-card p-5"
          style={{ borderColor: "rgba(34,197,94,0.12)" }}
        >
          <h4 className="text-sm font-semibold text-foreground mb-4">Suggest a challenge</h4>
          <div className="space-y-3">
            <Input
              placeholder="Challenge name"
              value={challengeName}
              onChange={(e) => setChallengeName(e.target.value)}
              className="h-9 bg-muted/30 border-primary/15 text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <Select>
                <SelectTrigger className="h-9 bg-muted/30 border-primary/15 text-xs">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="food">Food</SelectItem>
                  <SelectItem value="transport">Transport</SelectItem>
                  <SelectItem value="energy">Energy</SelectItem>
                  <SelectItem value="shopping">Shopping</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="h-9 bg-muted/30 border-primary/15 text-xs">
                  <SelectValue placeholder="Duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full h-9 text-xs bg-primary text-primary-foreground hover:bg-primary/90">
              Suggest to household
            </Button>
          </div>

          {/* Recent suggestions */}
          <div className="mt-4 pt-3 border-t border-primary/10">
            <p className="text-[10px] text-muted-foreground mb-2">Recent suggestions</p>
            {suggestions.map((s) => (
              <div
                key={s.name}
                className="flex items-center justify-between py-2 border-b last:border-b-0 border-primary/5"
              >
                <div>
                  <span className="text-xs text-foreground/60">{s.name}</span>
                  <span className="text-[10px] text-muted-foreground ml-2">by {s.by}</span>
                </div>
                <div className="flex gap-2">
                  <button className="text-[10px] text-primary hover:text-primary/80">Accept</button>
                  <button className="text-[10px] text-muted-foreground hover:text-foreground">
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharedChallenges;
