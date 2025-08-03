import { Mail, Linkedin, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import teamJulius from "@/assets/team-julius.jpg";
import teamJimmy from "@/assets/team-jimmy.jpg";
import teamJudith from "@/assets/team-judith.jpg";

const TeamSection = () => {
  const teamMembers = [
    {
      name: "Julius I. Jimenez, MSE, PhD",
      role: "Chief Executive Officer",
      description: "Leading innovation in geospatial technologies with over 15 years of experience in remote sensing and agricultural applications.",
      image: teamJulius,
      social: {
        email: "julius@geospadahub.com",
        linkedin: "#",
        github: "#"
      }
    },
    {
      name: "Jimmy I. Jimenez Jr, CpE",
      role: "CTO - Software Engineer", 
      description: "Expert in software architecture and GIS development, specializing in scalable geospatial data processing systems.",
      image: teamJimmy,
      social: {
        email: "jimmy@geospadahub.com",
        linkedin: "#",
        github: "#"
      }
    },
    {
      name: "Judith EA",
      role: "Chief Marketing Officer",
      description: "Strategic marketing leader focused on promoting geospatial solutions and building partnerships in the agricultural technology sector.",
      image: teamJudith,  
      social: {
        email: "judith@geospadahub.com",
        linkedin: "#",
        github: "#"
      }
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-background to-secondary/10">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12 md:mb-16 animate-fade-in">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 text-foreground">
            The People Behind GeoSpaDa-SciHub
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Meet our dedicated team of experts driving innovation in geospatial intelligence
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {teamMembers.map((member, index) => (
            <div 
              key={member.name}
              className="group relative overflow-hidden rounded-2xl bg-gradient-card backdrop-blur-sm border border-border/50 hover:shadow-elegant transition-all duration-500 animate-scale-in"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-5 transition-opacity duration-500" />
              
              <div className="relative h-48 md:h-64 overflow-hidden">
                <img 
                  src={member.image} 
                  alt={member.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              </div>
              
              <div className="relative z-10 p-4 md:p-6">
                <h3 className="text-lg md:text-xl font-bold mb-2 text-foreground group-hover:text-primary-glow transition-colors duration-300">
                  {member.name}
                </h3>
                
                <p className="text-accent font-semibold mb-3 text-sm md:text-base">
                  {member.role}
                </p>
                
                <p className="text-muted-foreground text-xs md:text-sm leading-relaxed mb-4 md:mb-6">
                  {member.description}
                </p>
                
                <div className="flex gap-2 md:gap-3">
                  <Button variant="ghost" size="icon" className="hover:text-primary-glow hover:bg-primary/10 transition-all duration-300">
                    <Mail className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="hover:text-primary-glow hover:bg-primary/10 transition-all duration-300">
                    <Linkedin className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="hover:text-primary-glow hover:bg-primary/10 transition-all duration-300">
                    <Github className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TeamSection;