import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { GREEN_THEME_STYLE } from "@/contexts/ThemeContext";
import AuthRedirectScreen from "@/components/auth/AuthRedirectScreen";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import ProblemSection from "@/components/landing/ProblemSection";
import SolutionSection from "@/components/landing/SolutionSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import ComparisonSection from "@/components/landing/ComparisonSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import PricingSection from "@/components/landing/PricingSection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  const navigate = useNavigate();
  const { session, user } = useAuth();
  const [isOAuthCallback, setIsOAuthCallback] = useState(() => {
    const hash = typeof window !== "undefined" ? window.location.hash || "" : "";
    const search = typeof window !== "undefined" ? window.location.search || "" : "";
    const hasOAuthParams =
      hash.includes("access_token") ||
      hash.includes("type=recovery") ||
      search.includes("code=");
    const hasOAuthFlag = typeof window !== "undefined" && sessionStorage.getItem("cz_oauth_in_progress") === "true";
    return hasOAuthParams || hasOAuthFlag;
  });

  useEffect(() => {
    if (!isOAuthCallback) return;

    // If session or user is detected, complete redirect to dashboard
    if (session?.user || user) {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("cz_oauth_in_progress");
      }
      navigate("/dashboard", { replace: true });
      return;
    }

    // Check for error in callback
    const hash = typeof window !== "undefined" ? window.location.hash || "" : "";
    const search = typeof window !== "undefined" ? window.location.search || "" : "";
    if (hash.includes("error=") || search.includes("error=")) {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("cz_oauth_in_progress");
      }
      setIsOAuthCallback(false);
      navigate("/login", { replace: true });
      return;
    }

    // Safety timeout: if auth doesn't resolve within 8s, fall back to landing page
    const timeout = setTimeout(() => {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("cz_oauth_in_progress");
      }
      setIsOAuthCallback(false);
    }, 8000);

    return () => clearTimeout(timeout);
  }, [isOAuthCallback, session, user, navigate]);

  if (isOAuthCallback) {
    return <AuthRedirectScreen />;
  }

  return (
    <div className="landing-theme min-h-screen bg-background" style={GREEN_THEME_STYLE}>
      <Navbar />
      <HeroSection />
      <div id="problem">
        <ProblemSection />
      </div>
      <div id="features">
        <SolutionSection />
      </div>
      <HowItWorksSection />
      <ComparisonSection />
      <div id="testimonials">
        <TestimonialsSection />
      </div>
      <div id="pricing">
        <PricingSection />
      </div>
      <Footer />
    </div>
  );
};

export default Index;
