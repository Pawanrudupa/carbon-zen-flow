import { useState } from "react";
import { Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const ProfileSection = () => {
  const [name, setName] = useState("Alex Chen");
  const [email] = useState("alex@example.com");
  const [location, setLocation] = useState("Bangalore, India");
  const [bio, setBio] = useState("");

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-xl font-semibold text-foreground">Profile</h2>

      <div className="flex items-center gap-5">
        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
          <span className="text-primary font-heading font-bold text-2xl">AC</span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-foreground">{name}</span>
            <Pencil size={14} className="text-muted-foreground" />
          </div>
          <button className="text-xs text-primary hover:underline mt-1">Change photo</button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Display name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-card border-primary/20 focus:ring-primary/40" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            Email <Badge className="bg-primary/20 text-primary border-0 text-[10px]">Verified</Badge>
          </label>
          <Input value={email} readOnly className="bg-card border-primary/20 opacity-60" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Location</label>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} className="bg-card border-primary/20 focus:ring-primary/40" />
          <p className="text-xs text-muted-foreground">Used for regional emission factors</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Joined</label>
          <Input value="January 2026" readOnly className="bg-card border-primary/20 opacity-60" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Bio</label>
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about your sustainability journey..."
            className="bg-card border-primary/20 focus:ring-primary/40 min-h-[100px]"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button onClick={() => toast.success("Settings saved.")} className="bg-primary text-primary-foreground hover:bg-primary/90">
          Save changes
        </Button>
        <button className="text-sm text-muted-foreground hover:text-foreground">Cancel</button>
      </div>
    </div>
  );
};

export default ProfileSection;
