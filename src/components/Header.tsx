import { Button } from "@/components/ui/button";
import { Satellite } from "lucide-react";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Satellite className="w-8 h-8 text-primary-glow" />
            <span className="text-xl font-bold text-foreground">GeoSpaDa Sci-Hub</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="#services" className="text-muted-foreground hover:text-primary-glow transition-colors">
              Services
            </a>
            <a href="#about" className="text-muted-foreground hover:text-primary-glow transition-colors">
              About
            </a>
            <a href="#team" className="text-muted-foreground hover:text-primary-glow transition-colors">
              Team
            </a>
          </nav>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" className="hover:text-primary-glow">
              Login
            </Button>
            <Button variant="satellite">
              Register
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;