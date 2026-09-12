import { Leaf } from "lucide-react";
import { GREEN_THEME_STYLE } from "@/contexts/ThemeContext";

interface AuthRedirectScreenProps {
  message?: string;
}

const AuthRedirectScreen = ({ message = "Signing you in…" }: AuthRedirectScreenProps) => {
  return (
    <div
      className="landing-theme min-h-screen bg-background flex flex-col items-center justify-center p-4 transition-colors"
      style={GREEN_THEME_STYLE}
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_30px_rgba(34,197,94,0.2)] animate-pulse">
          <Leaf className="text-primary" size={28} />
        </div>
        <div className="flex items-center gap-2.5 mt-2">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="font-heading font-600 text-base text-foreground tracking-tight">
            {message}
          </span>
        </div>
        <p className="text-xs font-mono text-muted-foreground">
          Carbon<span className="text-primary">Zen</span>
        </p>
      </div>
    </div>
  );
};

export default AuthRedirectScreen;
