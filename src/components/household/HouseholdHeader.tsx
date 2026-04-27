import { useState } from "react";
import { Plus, Pencil, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  onInvite: () => void;
  householdName: string;
}

const HouseholdHeader = ({ onInvite, householdName }: Props) => {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(householdName);

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-[32px] font-bold text-foreground">Household</h1>
          <p className="text-muted-foreground text-sm mt-1">Track your impact together</p>
          <div className="mt-3 flex items-center gap-2 group">
            {editing ? (
              <div className="flex items-center gap-2">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-8 w-64 bg-muted/30 border-primary/20 font-heading text-sm text-foreground"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && setEditing(false)}
                />
                <button onClick={() => setEditing(false)} className="text-primary hover:text-primary/80">
                  <Check size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 text-foreground/80 hover:text-foreground transition-colors"
              >
                <span className="font-heading text-sm">{name}</span>
                <Pencil size={13} className="opacity-0 group-hover:opacity-60 transition-opacity" />
              </button>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          onClick={onInvite}
          className="border-primary/30 text-primary hover:bg-primary/10 hover:text-primary gap-2"
        >
          <Plus size={16} />
          Invite Member
        </Button>
      </div>
    </div>
  );
};

export default HouseholdHeader;
