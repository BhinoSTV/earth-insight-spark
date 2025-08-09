import Header from "@/components/Header";
import CryptoTicker from "@/components/CryptoTicker";
import NewsCarousel from "@/components/NewsCarousel";
import HeroSection from "@/components/HeroSection";
import ServicesSection from "@/components/ServicesSection";
import AboutSection from "@/components/AboutSection";
import TeamSection from "@/components/TeamSection";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <NewsCarousel />
      <div id="services">
        <ServicesSection />
      </div>
      <div id="about">
        <AboutSection />
      </div>
      <div id="team">
        <TeamSection />
      </div>
      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default Index;
