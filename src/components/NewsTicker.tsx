import { useState, useEffect } from "react";
import { Satellite, Globe, TrendingUp } from "lucide-react";

const NewsTicker = () => {
  const [isPaused, setIsPaused] = useState(false);

  const newsItems = [
    {
      icon: <Satellite className="w-4 h-4" />,
      text: "New Sentinel-2 data now available for environmental monitoring"
    },
    {
      icon: <Globe className="w-4 h-4" />,
      text: "Climate change assessment using multi-temporal satellite imagery"
    },
    {
      icon: <TrendingUp className="w-4 h-4" />,
      text: "AI-powered land cover classification achieving 95% accuracy"
    },
    {
      icon: <Satellite className="w-4 h-4" />,
      text: "Real-time disaster monitoring with MODIS thermal data"
    },
    {
      icon: <Globe className="w-4 h-4" />,
      text: "Urban expansion analysis reveals 23% growth in metropolitan areas"
    }
  ];

  return (
    <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border-y border-border/30 overflow-hidden">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-primary-glow font-semibold text-sm whitespace-nowrap">
            <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
            <span>BREAKING</span>
          </div>
          
          <div 
            className="flex-1 overflow-hidden"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div className={`flex gap-8 ${isPaused ? 'animate-pause' : 'animate-scroll'}`}>
              {/* Duplicate the items for seamless loop */}
              {[...newsItems, ...newsItems].map((item, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary-glow transition-colors whitespace-nowrap"
                >
                  <span className="text-primary-glow">{item.icon}</span>
                  <span>{item.text}</span>
                  <span className="text-border">•</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsTicker;