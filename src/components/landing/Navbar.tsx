import { Link } from "react-router-dom";
import { Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center p-4">
      <div className="w-full max-w-7xl h-16 px-6 flex items-center justify-between rounded-2xl border border-white/5 bg-black/20 backdrop-blur-xl">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Leaf className="text-primary" size={18} />
          </div>
          <span className="font-heading font-700 text-lg text-foreground tracking-tight">
            Carbon<span className="text-primary">Zen</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body">Features</a>
          <a href="#problem" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body">The Issue</a>
          <a href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body">Impact</a>
          <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body">Pricing</a>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" className="text-sm font-heading font-500">
              Sign In
            </Button>
          </Link>
          <Link to="/login">
            <Button className="text-sm font-heading font-600 bg-primary hover:bg-primary/90 text-primary-foreground">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
