import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Leaf, Lock, Eye, EyeOff, CheckCircle, Mail, ArrowLeft, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const UpdatePassword = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Email is passed via router state from ForgotPassword.
  // Fall back to a local state so the user can type it if they land here directly.
  const [email, setEmail] = useState<string>((location.state as any)?.email ?? "");
  const [otpCode, setOtpCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleVerifyAndUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (password !== confirm) {
      setErrorMsg("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      // STEP 1: Verify the 6-digit OTP the user received by email
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: "recovery",
      });
      if (verifyError) throw verifyError;

      // STEP 2: OTP verified → Supabase creates a temporary session.
      // Immediately push the new password.
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });
      if (updateError) throw updateError;

      setDone(true);
      setTimeout(() => navigate("/dashboard"), 2500);
    } catch (err: any) {
      setErrorMsg(err.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Subtle glow */}
      <div aria-hidden className="pointer-events-none fixed inset-0 flex items-center justify-center">
        <div className="w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md"
      >
        <div className="rounded-2xl border border-primary/10 bg-card/60 backdrop-blur-md p-8 shadow-xl space-y-7">
          {/* Logo */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Leaf className="text-primary" size={24} />
            </div>
            <h1 className="font-heading font-bold text-2xl text-foreground">
              Set New Password
            </h1>
            <p className="text-muted-foreground text-sm text-center max-w-xs">
              Enter the 6-digit code from your email and choose a new password.
            </p>
          </div>

          {done ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4 py-4 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle className="text-primary" size={32} />
              </div>
              <div>
                <p className="text-foreground font-semibold">Password updated!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Redirecting you to your dashboard…
                </p>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleVerifyAndUpdate} className="space-y-4">

              {/* Email — pre-filled from router state, editable if landed directly */}
              <div>
                <label className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1.5 block">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-input border border-primary/10 text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 font-body transition-colors"
                  />
                </div>
              </div>

              {/* 6-digit OTP */}
              <div>
                <label className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1.5 block">
                  6-Digit Code
                </label>
                <div className="relative">
                  <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="otp-code"
                    type="text"
                    inputMode="numeric"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    required
                    maxLength={6}
                    placeholder="123456"
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-input border border-primary/10 text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 font-mono tracking-widest transition-colors"
                  />
                </div>
              </div>

              {/* New password */}
              <div>
                <label className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1.5 block">
                  New Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 rounded-lg bg-input border border-primary/10 text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 font-body transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div>
                <label className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1.5 block">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-input border border-primary/10 text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 font-body transition-colors"
                  />
                </div>
                {confirm && password !== confirm && (
                  <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
                )}
              </div>

              {/* Error message */}
              {errorMsg && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                id="update-password-submit"
                disabled={loading || !otpCode || otpCode.length < 6 || !password || password !== confirm}
                className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading ? "Verifying…" : "Verify & Update Password"}
              </button>
            </form>
          )}

          <div className="text-center">
            <Link
              to="/forgot-password"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={14} />
              Request a new code
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default UpdatePassword;
