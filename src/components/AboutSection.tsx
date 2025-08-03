import { Target, Eye, Users } from "lucide-react";

const AboutSection = () => {
  const aboutItems = [
    {
      icon: Target,
      title: "Our Mission",
      description: "Deliver world-class solutions to help farmers, researchers, and students grow in the evolving agricultural digitalization. Focus on introducing GIS and adaptive decision making solutions.",
      color: "text-accent"
    },
    {
      icon: Eye,
      title: "Our Vision", 
      description: "Enable every business to access secure, scalable services to unlock full potential through innovative geospatial technologies and remote sensing solutions.",
      color: "text-primary-glow"
    },
    {
      icon: Users,
      title: "Our Team",
      description: "Talented professionals with expertise in web development, design & digital strategy, committed to delivering excellence in every project.",
      color: "text-secondary"
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12 md:mb-16 animate-fade-in">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 text-foreground">
            About Us
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Pioneering the future of geospatial intelligence and agricultural innovation
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {aboutItems.map((item, index) => (
            <div 
              key={item.title}
              className="group relative p-6 md:p-8 rounded-2xl bg-gradient-card backdrop-blur-sm border border-border/50 hover:shadow-card transition-all duration-500 animate-scale-in"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <div className="absolute inset-0 bg-gradient-secondary opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-500" />
              
              <div className="relative z-10 text-center">
                <div className="mb-4 md:mb-6 flex justify-center">
                  <div className="relative">
                    <item.icon className={`w-12 md:w-16 h-12 md:h-16 ${item.color} group-hover:scale-110 transition-transform duration-300`} />
                    <div className={`absolute inset-0 ${item.color} opacity-20 rounded-full animate-ping group-hover:animate-none`} />
                  </div>
                </div>
                
                <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-foreground group-hover:text-secondary transition-colors duration-300">
                  {item.title}
                </h3>
                
                <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutSection;