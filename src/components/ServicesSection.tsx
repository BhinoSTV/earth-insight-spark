import { Calculator, Globe2, TrendingUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const ServicesSection = () => {
  const [hoveredService, setHoveredService] = useState<number | null>(null);

  const services = [
    {
      icon: Calculator,
      title: "Adaptive AHP Calculator",
      description: "Advanced multi-criteria decision analysis platform optimized for agricultural and environmental applications with real-time data processing.",
      features: ["Real-time Analysis", "Multi-criteria Support", "Data Visualization"],
      color: "text-primary-glow"
    },
    {
      icon: Globe2,
      title: "Geo-HISS",
      description: "Geospatial Health Information Surveillance System providing comprehensive spatial analysis for health and environmental monitoring.",
      features: ["Spatial Analytics", "Health Monitoring", "Environmental Tracking"],
      color: "text-accent"
    },
    {
      icon: TrendingUp,
      title: "Scalable Agricultural Approach",
      description: "AI-powered agricultural intelligence platform built to scale with precision farming capabilities and satellite integration.",
      features: ["Precision Farming", "Satellite Integration", "AI Analytics"],
      color: "text-secondary"
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12 md:mb-16 animate-fade-in">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 text-foreground">
            What We Offer
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Comprehensive geospatial solutions powered by advanced remote sensing and GIS technologies
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {services.map((service, index) => (
            <div 
              key={service.title}
              className="group relative p-6 md:p-8 rounded-2xl bg-gradient-card backdrop-blur-sm border border-border/50 hover:shadow-elegant transition-all duration-500 animate-scale-in cursor-pointer"
              style={{ animationDelay: `${index * 0.2}s` }}
              onMouseEnter={() => setHoveredService(index)}
              onMouseLeave={() => setHoveredService(null)}
            >
              <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-500" />
              
              {/* Animated border */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-primary opacity-0 ${hoveredService === index ? 'opacity-20' : ''} transition-opacity duration-300`} />
              
              <div className="relative z-10">
                <div className="mb-6 flex items-center justify-between">
                  <service.icon className={`w-10 md:w-12 h-10 md:h-12 ${service.color} group-hover:scale-110 transition-transform duration-300`} />
                  <ArrowRight className={`w-5 h-5 text-muted-foreground group-hover:text-primary-glow group-hover:translate-x-1 transition-all duration-300 ${hoveredService === index ? 'opacity-100' : 'opacity-0'}`} />
                </div>
                
                <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-foreground group-hover:text-primary-glow transition-colors duration-300">
                  {service.title}
                </h3>
                
                <p className="text-muted-foreground mb-4 md:mb-6 leading-relaxed text-sm md:text-base">
                  {service.description}
                </p>

                {/* Feature tags */}
                <div className="flex flex-wrap gap-2 mb-4 md:mb-6">
                  {service.features.map((feature) => (
                    <span 
                      key={feature}
                      className="px-2 md:px-3 py-1 text-xs md:text-sm bg-primary/10 text-primary-glow rounded-full border border-primary/20"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full group-hover:border-primary group-hover:text-primary group-hover:bg-primary/5 transition-all duration-300"
                >
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