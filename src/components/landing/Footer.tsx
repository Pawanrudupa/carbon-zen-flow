import { Leaf } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-primary/10 py-16 px-4">
    <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-12">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Leaf className="text-primary" size={20} />
          <span className="font-heading font-700 text-foreground text-lg">CarbonLedger</span>
        </div>
        <p className="text-muted-foreground text-sm">Your planet. Your numbers. Your move.</p>
      </div>
      <div className="flex gap-8">
        <div className="space-y-2">
          {["Features", "Pricing", "Blog"].map((l) => (
            <a key={l} href="#" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
              {l}
            </a>
          ))}
        </div>
        <div className="space-y-2">
          {["Privacy", "Terms", "Contact"].map((l) => (
            <a key={l} href="#" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
              {l}
            </a>
          ))}
        </div>
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-3">Stay in the loop</p>
        <div className="flex gap-2">
          <input
            type="email"
            placeholder="your@email.com"
            className="flex-1 px-4 py-2 rounded-lg bg-input border border-primary/10 text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/30"
          />
          <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-heading font-600">
            Join
          </button>
        </div>
      </div>
    </div>
    <div className="max-w-6xl mx-auto mt-12 pt-6 border-t border-primary/5">
      <p className="text-xs text-muted-foreground/50 text-center">
        Built for the planet. Designed for humans.
      </p>
    </div>
  </footer>
);

export default Footer;
