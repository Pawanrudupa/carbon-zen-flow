import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Bot, Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ProfileSection() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // 1. Fetch current profile values on mount
  useEffect(() => {
    async function getProfile() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          setEmail(user.email || "");
          
          // Get profile details from public.profiles table
          const { data, error } = await supabase
            .from("profiles")
            .select("username, avatar_url")
            .eq("id", user.id)
            .single();

          if (error && error.code !== "PGRST116") throw error; // Ignore missing row error codes
          
          if (data) {
            setDisplayName(data.username || "");
            setAvatarUrl(data.avatar_url || null);
          }

          // Fetch location from user_metadata under auth
          if (user.user_metadata) {
            setLocation(user.user_metadata.location || "");
          }
        }
      } catch (error: any) {
        console.error("Error loading profile:", error.message);
        toast.error("Failed to load profile data.");
      } finally {
        setLoading(false);
      }
    }

    getProfile();
  }, []);

  // 2. Avatar upload handler
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) return;
    
    const file = fileList[0];
    
    // Validate file size (limit to 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File is too large. Maximum size is 2MB.");
      return;
    }
    
    try {
      setUploading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user.");
      
      const fileExt = file.name.split('.').pop() || 'png';
      const timestamp = new Date().getTime();
      const filePath = `${user.id}/avatar_${timestamp}.${fileExt}`;
      
      // 1. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { 
          upsert: true,
          contentType: file.type 
        });
        
      if (uploadError) throw uploadError;
      
      // 2. Fetch Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
        
      // 3. Update profiles table
      const { error: dbError } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id,
          avatar_url: publicUrl,
          username: displayName 
        });
        
      if (dbError) throw dbError;
      
      // 4. Update local state
      setAvatarUrl(publicUrl);
      toast.success("Profile photo updated successfully!");
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast.error("Failed to upload avatar: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  // 3. Save profile handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error("No authenticated user session.");

      // Update public.profiles table (username and avatar_url)
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          username: displayName,
          avatar_url: avatarUrl,
          created_at: user.created_at || new Date().toISOString(),
        });

      if (profileError) throw profileError;

      // Update user_metadata in auth with location
      const { error: authError } = await supabase.auth.updateUser({
        data: { location }
      });

      if (authError) throw authError;

      toast.success("Profile updated successfully!");
    } catch (error: any) {
      console.error("Error saving profile:", error.message);
      toast.error("Could not update profile details.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-foreground/50 text-xs animate-pulse">Loading profile data...</div>;
  }

  // Derive initials cleanly
  const initials = displayName
    ? displayName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
    : email ? email.substring(0, 2).toUpperCase() : "??";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col max-w-xl"
    >
      {/* Dynamic Header Section */}
      <div className="flex items-center gap-4 mb-6">
        <div 
          onClick={() => !uploading && fileInputRef.current?.click()}
          className="relative w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-heading font-[600] text-lg uppercase cursor-pointer overflow-hidden group transition-all duration-300 hover:border-primary/40 shadow-sm flex-shrink-0"
        >
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt="Profile Avatar" 
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
            />
          ) : (
            <span className="transition-transform duration-300 group-hover:scale-105">
              {initials}
            </span>
          )}
          
          {/* Overlay hover state */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center">
            <span className="text-[8px] text-white font-mono uppercase tracking-wider text-center">Change</span>
          </div>

          {/* Loader Overlay */}
          {uploading && (
            <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px] rounded-full flex items-center justify-center z-10">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading font-[600] text-foreground text-base tracking-wide uppercase">
              {displayName || "Set Display Name"}
            </h2>
            <Pencil 
              onClick={() => fileInputRef.current?.click()}
              size={12} 
              className="text-muted-foreground hover:text-primary cursor-pointer transition-colors" 
            />
          </div>
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="text-primary hover:underline text-[11px] font-mono mt-0.5 focus:outline-none disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Change photo"}
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSave} className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-foreground/70 font-mono text-[10px] uppercase tracking-wider">Display name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. Tejas N"
            className="w-full px-3 py-2 rounded-lg bg-input border border-primary/10 text-foreground text-[11px] focus:outline-none focus:border-primary/30 transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-foreground/70 font-mono text-[10px] uppercase tracking-wider">Email (Verified)</label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full px-3 py-2 rounded-lg bg-muted/20 border border-primary/5 text-muted-foreground text-[11px] cursor-not-allowed"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-foreground/70 font-mono text-[10px] uppercase tracking-wider">Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Bengaluru, India"
            className="w-full px-3 py-2 rounded-lg bg-input border border-primary/10 text-foreground text-[11px] focus:outline-none focus:border-primary/30 transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground text-[11px] font-[600] rounded-lg transition-colors shadow-sm self-start mt-2 flex items-center justify-center gap-1.5 min-w-[100px]"
        >
          {saving ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            "Save Changes"
          )}
        </button>
      </form>
    </motion.div>
  );
}
