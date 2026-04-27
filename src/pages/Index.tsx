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
  return (
    <div className="min-h-screen bg-background">
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
