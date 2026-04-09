import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Leaf, Mail, Lock } from "lucide-react";
import { toast } from "sonner";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      navigate("/dashboard");
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error(result.error.message || "Google sign-in failed");
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Leaf className="text-primary" size={24} />
          </div>
          <h1 className="font-heading font-700 text-2xl text-foreground">Welcome back</h1>
          <p className="text-muted-foreground text-sm">Sign in to CarbonLedger</p>
        </div>

        {/* Google button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-white text-gray-800 font-medium text-sm hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" />
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.26c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" />
            <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" />
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" />
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-primary/10" />
          <span className="text-xs text-muted-foreground font-mono">or</span>
          <div className="flex-1 h-px bg-primary/10" />
        </div>

        {/* Email form */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1.5 block">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-input border border-primary/10 text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/30 font-body transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1.5 block">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-input border border-primary/10 text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/30 font-body transition-colors"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-heading font-600 text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/signup" className="text-primary hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
