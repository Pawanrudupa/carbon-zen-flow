import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Leaf, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#08160a] flex items-center justify-center p-4 font-body">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="flex flex-col items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center animate-pulse">
            <Leaf className="text-primary" size={40} />
          </div>
          <div className="space-y-2">
            <h1 className="text-8xl font-heading font-800 text-white tracking-tighter opacity-20 leading-none">404</h1>
            <h2 className="text-3xl font-heading font-700 text-foreground">Lost in the forest?</h2>
            <p className="text-muted-foreground max-w-[280px] mx-auto">
              The page you're looking for doesn't exist or has been moved to a new ecosystem.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Link to="/">
            <Button className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground gap-2 font-heading font-600">
              <ArrowLeft size={18} />
              Return to Home
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="ghost" className="w-full h-12 text-muted-foreground hover:text-foreground">
              Sign In to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
