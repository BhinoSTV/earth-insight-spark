import { Button } from "@/components/ui/button";
import { Satellite, Mail, Phone, MapPin, Linkedin, Github, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gradient-to-b from-background to-muted/50 border-t border-border/30">
      <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Satellite className="w-8 h-8 text-primary-glow" />
              <span className="text-xl font-bold text-foreground">GeoSpaDa Sci-Hub</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Transforming ideas into digital reality through innovative geospatial intelligence and remote sensing technologies.
            </p>
            <div className="flex gap-3">
              <Button variant="ghost" size="icon" className="hover:text-primary-glow hover:bg-primary/10">
                <Linkedin className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:text-primary-glow hover:bg-primary/10">
                <Github className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:text-primary-glow hover:bg-primary/10">
                <Twitter className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Services</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-muted-foreground hover:text-primary-glow transition-colors text-sm">AHP Calculator</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary-glow transition-colors text-sm">Geo-HISS</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary-glow transition-colors text-sm">Agricultural Solutions</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary-glow transition-colors text-sm">Consulting</a></li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Company</h3>
            <ul className="space-y-2">
              <li><a href="#about" className="text-muted-foreground hover:text-primary-glow transition-colors text-sm">About Us</a></li>
              <li><a href="#team" className="text-muted-foreground hover:text-primary-glow transition-colors text-sm">Our Team</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary-glow transition-colors text-sm">Careers</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary-glow transition-colors text-sm">Blog</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-muted-foreground text-sm">
                <Mail className="w-4 h-4 text-primary-glow" />
                info@geospadahub.com
              </li>
              <li className="flex items-center gap-2 text-muted-foreground text-sm">
                <Phone className="w-4 h-4 text-primary-glow" />
                +1 (555) 123-4567
              </li>
              <li className="flex items-start gap-2 text-muted-foreground text-sm">
                <MapPin className="w-4 h-4 text-primary-glow mt-0.5" />
                <span>123 Innovation Drive<br />Tech Valley, CA 94000</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/30 mt-12 pt-8 text-center">
          <p className="text-muted-foreground text-sm">
            © 2024 GeoSpaDa Sci-Hub. All rights reserved. | Privacy Policy | Terms of Service
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;