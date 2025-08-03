import { Calculator, Globe2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const ServicesSection = () => {
  const services = [
    {
      icon: Calculator,
      title: "Adaptive AHP Calculator",
      description: "Our platform is optimized for speed and security to ensure your website performs excellently.",
      color: "text-primary-glow"
    },
    {
      icon: Globe2,
      title: "Geo-HISS",
      description: "Professional, modern designs that will make your website stand out in the digital landscape.",
      color: "text-accent"
    },
    {
      icon: TrendingUp,
      title: "Scalable Agricultural Approach",
      description: "Built to scale as your business grows, handling more traffic seamlessly with advanced infrastructure.",
      color: "text-secondary"
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            What We Offer
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Comprehensive geospatial solutions powered by advanced remote sensing and GIS technologies
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div 
              key={service.title}
              className="group relative p-8 rounded-2xl bg-gradient-card backdrop-blur-sm border border-border/50 hover:shadow-elegant transition-all duration-500 animate-scale-in"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-500" />
              
              <div className="relative z-10">
                <div className="mb-6">
                  <service.icon className={`w-12 h-12 ${service.color} group-hover:scale-110 transition-transform duration-300`} />
                </div>
                
                <h3 className="text-2xl font-bold mb-4 text-foreground group-hover:text-primary-glow transition-colors duration-300">
                  {service.title}
                </h3>
                
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {service.description}
                </p>
                
                <Button variant="outline" className="group-hover:border-primary group-hover:text-primary transition-all duration-300">
                  Learn More
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;