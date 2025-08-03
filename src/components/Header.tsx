import { Button } from "@/components/ui/button";
import { Satellite, Menu, X } from "lucide-react";
import { useState } from "react";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border/30">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 animate-fade-in">
            <div className="relative">
              <Satellite className="w-8 h-8 text-primary-glow animate-float" />
              <div className="absolute inset-0 w-8 h-8 bg-primary-glow/20 rounded-full animate-ping" />
            </div>
            <span className="text-lg md:text-xl font-bold text-foreground">GeoSpaDa Sci-Hub</span>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#services" className="relative text-muted-foreground hover:text-primary-glow transition-all duration-300 group">
              Services
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-glow transition-all duration-300 group-hover:w-full" />
            </a>
            <a href="#about" className="relative text-muted-foreground hover:text-primary-glow transition-all duration-300 group">
              About
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-glow transition-all duration-300 group-hover:w-full" />
            </a>
            <a href="#team" className="relative text-muted-foreground hover:text-primary-glow transition-all duration-300 group">
              Team
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-glow transition-all duration-300 group-hover:w-full" />
            </a>
          </nav>
          
          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" className="hover:text-primary-glow hover:bg-primary/10">
              Login
            </Button>
            <Button variant="satellite" className="shadow-glow">
              Register
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button 
            variant="ghost" 
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-border/30 animate-fade-in">
            <nav className="container mx-auto px-4 py-6 flex flex-col gap-4">
              <a href="#services" className="text-muted-foreground hover:text-primary-glow transition-colors py-2" onClick={() => setIsMenuOpen(false)}>
                Services
              </a>
              <a href="#about" className="text-muted-foreground hover:text-primary-glow transition-colors py-2" onClick={() => setIsMenuOpen(false)}>
                About
              </a>
              <a href="#team" className="text-muted-foreground hover:text-primary-glow transition-colors py-2" onClick={() => setIsMenuOpen(false)}>
                Team
              </a>
              <div className="flex flex-col gap-3 pt-4 border-t border-border/30">
                <Button variant="ghost" className="justify-start">
                  Login
                </Button>
                <Button variant="satellite">
                  Register
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;