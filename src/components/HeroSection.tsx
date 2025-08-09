import { Button } from "@/components/ui/button";
import { Satellite, Globe, MapPin, Zap, Layers } from "lucide-react";
import { useEffect, useState } from "react";

const HeroSection = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <section className="relative min-h-screen bg-gradient-hero flex items-center justify-center overflow-hidden">
      {/* Dynamic animated grid background */}
      <div className="absolute inset-0 opacity-30">
        <div 
          className="absolute inset-0 transition-transform duration-1000 ease-out"
          style={{
            backgroundImage: `
              linear-gradient(rgba(33, 150, 243, 0.15) 1px, transparent 1px),
              linear-gradient(90deg, rgba(33, 150, 243, 0.15) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
            transform: `translate(${mousePosition.x * 0.01}px, ${mousePosition.y * 0.01}px)`
          }} 
        />
      </div>
      
      {/* Parallax floating elements */}
      <div 
        className="absolute top-10 md:top-20 left-4 md:left-20 animate-float"
        style={{ transform: `translateY(${scrollY * 0.2}px)` }}
      >
        <div className="relative">
          <Satellite className="w-6 md:w-8 h-6 md:h-8 text-primary-glow" />
          <div className="absolute inset-0 bg-primary-glow/30 rounded-full animate-ping" />
        </div>
      </div>
      
      <div 
        className="absolute top-32 md:top-40 right-8 md:right-32 animate-float" 
        style={{ animationDelay: '2s', transform: `translateY(${scrollY * 0.3}px)` }}
      >
        <Globe className="w-5 md:w-6 h-5 md:h-6 text-accent" />
      </div>
      
      <div 
        className="absolute bottom-24 md:bottom-32 left-8 md:left-32 animate-float" 
        style={{ animationDelay: '4s', transform: `translateY(${scrollY * 0.1}px)` }}
      >
        <MapPin className="w-6 md:w-7 h-6 md:h-7 text-secondary" />
      </div>

      <div 
        className="absolute top-1/2 right-4 md:right-16 animate-float" 
        style={{ animationDelay: '1s', transform: `translateY(${scrollY * 0.15}px)` }}
      >
        <Zap className="w-5 md:w-6 h-5 md:h-6 text-accent" />
      </div>

      <div 
        className="absolute bottom-1/3 left-4 md:left-16 animate-float" 
        style={{ animationDelay: '3s', transform: `translateY(${scrollY * 0.25}px)` }}
      >
        <Layers className="w-6 md:w-7 h-6 md:h-7 text-primary-glow" />
      </div>

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 md:px-6 text-center pt-16 md:pt-0">
        <div className="animate-fade-in">
          <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold mb-3 md:mb-5 bg-gradient-to-r from-foreground via-primary-glow to-accent bg-clip-text text-transparent leading-tight">
            Welcome to GeoSpaDa Sci-Hub
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl mb-6 md:mb-8 text-muted-foreground max-w-3xl mx-auto px-4">
            "Transforming Ideas into Digital Reality"
          </p>
          <p className="text-sm md:text-base lg:text-lg mb-8 md:mb-12 text-muted-foreground max-w-2xl mx-auto px-4 leading-relaxed">
            Pioneering the future of geospatial intelligence through cutting-edge remote sensing 
            and GIS technologies. Unlock insights from Earth observation data.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4">
            <Button 
              variant="hero" 
              size="lg" 
              className="animate-scale-in w-full sm:w-auto text-base md:text-lg px-6 md:px-8 py-3 md:py-4"
            >
              Get Started
            </Button>
            <Button 
              variant="glow" 
              size="lg" 
              className="animate-scale-in w-full sm:w-auto text-base md:text-lg px-6 md:px-8 py-3 md:py-4" 
              style={{ animationDelay: '0.2s' }}
            >
              Learn More
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced bottom gradient overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-24 md:h-32 bg-gradient-to-t from-background via-background/80 to-transparent" />
    </section>
  );
};

export default HeroSection;