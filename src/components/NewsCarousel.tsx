import { useState, useCallback, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight, Satellite, Globe, TrendingUp, MapPin, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";

const NewsCarousel = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start" },
    [Autoplay({ delay: 4000, stopOnInteraction: false })]
  );

  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true);
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const newsItems = [
    {
      icon: <Globe className="w-5 h-5" />,
      title: "Our Lead Researcher Joining International Dual Doctorate Degree.",
      description: "Our lead researcher joins the AIT–IIT Roorkee Dual Doctoral Degree Program, advancing global collaboration and innovation.",
      category: "Research",
      time: "Today",
      href: "https://ait.ac.th/2022/08/ait-and-iit-roorkee-celebrate-one-year-of-dual-doctoral-degree-program/"
    },
    {
      icon: <Satellite className="w-5 h-5" />,
      title: "Sentinel-2 Environmental Data",
      description: "New high-resolution satellite data now available for comprehensive environmental monitoring and analysis.",
      category: "Satellite Data",
      time: "2 hours ago"
    },
    {
      icon: <Globe className="w-5 h-5" />,
      title: "Climate Change Assessment",
      description: "Advanced multi-temporal satellite imagery reveals critical climate patterns and environmental changes.",
      category: "Climate",
      time: "4 hours ago"
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: "AI Land Classification",
      description: "Machine learning algorithms achieve 95% accuracy in automated land cover classification systems.",
      category: "AI Technology",
      time: "6 hours ago"
    },
    {
      icon: <Camera className="w-5 h-5" />,
      title: "Real-time Disaster Monitoring",
      description: "MODIS thermal data enables immediate response capabilities for natural disaster detection and tracking.",
      category: "Emergency Response",
      time: "8 hours ago"
    },
    {
      icon: <MapPin className="w-5 h-5" />,
      title: "Urban Expansion Analysis",
      description: "Comprehensive study reveals 23% growth in metropolitan areas using advanced geospatial analytics.",
      category: "Urban Planning",
      time: "12 hours ago"
    }
  ];

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setPrevBtnDisabled(!emblaApi.canScrollPrev());
    setNextBtnDisabled(!emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  return (
    <div className="w-full bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border-y border-border/30 py-4">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-accent rounded-full animate-pulse" />
            <h3 className="text-primary-glow font-semibold text-lg">Latest News</h3>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={scrollPrev}
              disabled={prevBtnDisabled}
              className="h-8 w-8 p-0 border-primary/30 hover:bg-primary/10"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={scrollNext}
              disabled={nextBtnDisabled}
              className="h-8 w-8 p-0 border-primary/30 hover:bg-primary/10"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="embla overflow-hidden" ref={emblaRef}>
          <div className="embla__container flex">
            {newsItems.map((item, index) => (
              <div
                key={index}
                className="embla__slide flex-shrink-0 w-full md:w-1/2 lg:w-1/3 px-2"
              >
                <div className="bg-card/50 backdrop-blur-sm border border-border/30 rounded-lg p-4 h-full hover:bg-card/70 transition-all duration-300 hover:shadow-glow cursor-pointer group">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-primary/20 text-primary-glow group-hover:bg-primary/30 transition-colors">
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-accent font-medium bg-accent/20 px-2 py-1 rounded">
                          {item.category}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {item.time}
                        </span>
                      </div>
                      <h4 className="font-semibold text-foreground text-sm mb-2 group-hover:text-primary-glow transition-colors">
                        {item.href ? (
                          <a
                            href={item.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="story-link"
                            aria-label={item.title}
                          >
                            {item.title}
                          </a>
                        ) : (
                          item.title
                        )}
                      </h4>
                      <p className="text-muted-foreground text-xs leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pagination dots */}
        <div className="flex justify-center gap-2 mt-4">
          {newsItems.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === selectedIndex
                  ? "bg-primary-glow w-6"
                  : "bg-border hover:bg-primary/50"
              }`}
              onClick={() => emblaApi?.scrollTo(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default NewsCarousel;