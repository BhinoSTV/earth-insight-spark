import { Button } from "@/components/ui/button";
import { Satellite, Globe, MapPin } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen bg-gradient-hero flex items-center justify-center overflow-hidden">
      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(33, 150, 243, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(33, 150, 243, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />
      </div>
      
      {/* Floating elements */}
      <div className="absolute top-20 left-20 animate-float">
        <Satellite className="w-8 h-8 text-primary-glow" />
      </div>
      <div className="absolute top-40 right-32 animate-float" style={{ animationDelay: '2s' }}>
        <Globe className="w-6 h-6 text-accent" />
      </div>
      <div className="absolute bottom-32 left-32 animate-float" style={{ animationDelay: '4s' }}>
        <MapPin className="w-7 h-7 text-secondary" />
      </div>

      <div className="relative z-10 container mx-auto px-6 text-center">
        <div className="animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground via-primary-glow to-accent bg-clip-text text-transparent">
            Welcome to GeoSpaDa Sci-Hub
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-muted-foreground max-w-3xl mx-auto">
            "Transforming Ideas into Digital Reality"
          </p>
          <p className="text-lg mb-12 text-muted-foreground max-w-2xl mx-auto">
            Pioneering the future of geospatial intelligence through cutting-edge remote sensing 
            and GIS technologies. Unlock insights from Earth observation data.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button variant="hero" size="lg" className="animate-scale-in">
              Get Started
            </Button>
            <Button variant="glow" size="lg" className="animate-scale-in" style={{ animationDelay: '0.2s' }}>
              Learn More
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom gradient overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default HeroSection;