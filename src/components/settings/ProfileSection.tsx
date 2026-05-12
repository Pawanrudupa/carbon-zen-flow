import { useState, useEffect } from "react";
import { Pencil, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Autocomplete from "react-google-autocomplete";

const ProfileSection = () => {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      setEmail(user.email || "");
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
        
      if (data) {
        setName(data.username || "");
      } else if (error && error.code !== "PGRST116") {
        console.error("Error loading profile:", error);
      }

      // Read location and bio from user_metadata
      const metadata = user.user_metadata || {};
      setLocation(metadata.location || "");
      setBio(metadata.bio || "");
      
      setLoading(false);
    };
    
    loadProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    
    // 1. Update username in profiles table
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ username: name })
      .eq("id", user.id);
      
    // 2. Update location and bio in user_metadata
    const { error: authError } = await supabase.auth.updateUser({
      data: { location, bio }
    });
      
    if (profileError || authError) {
      toast.error("Failed to save profile: " + (profileError?.message || authError?.message));
    } else {
      toast.success("Settings saved.");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // derive initials
  const initials = name
    ? name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
    : email ? email.substring(0, 2).toUpperCase() : "U";

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-xl font-semibold text-foreground">Profile</h2>

      <div className="flex items-center gap-5">
        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
          <span className="text-primary font-heading font-bold text-2xl">{initials}</span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-foreground">{name || "User"}</span>
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
          <Autocomplete
            apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""}
            onPlaceSelected={(place) => {
              setLocation(place.formatted_address || place.name || "");
            }}
            defaultValue={location}
            className="flex h-10 w-full rounded-md border border-input px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 bg-card border-primary/20 focus:ring-primary/40"
          />
          <p className="text-xs text-muted-foreground">Used for regional emission factors</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Joined</label>
          <Input 
            value={user?.created_at ? new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : ""} 
            readOnly 
            className="bg-card border-primary/20 opacity-60" 
          />
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
        <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90 min-w-[120px]">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save changes"}
        </Button>
        <button className="text-sm text-muted-foreground hover:text-foreground">Cancel</button>
      </div>
    </div>
  );
};

export default ProfileSection;
