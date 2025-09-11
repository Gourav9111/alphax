import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Banner } from "@shared/schema";

interface PromoBannerProps {
  className?: string;
}

export default function PromoBanner({ className = "" }: PromoBannerProps) {
  const [currentBanner, setCurrentBanner] = useState(0);
  const [, navigate] = useLocation();

  const { data: banners = [], isLoading } = useQuery<Banner[]>({
    queryKey: ["/api/banners"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const activeBanners = banners.filter(banner => banner.isActive);

  // Auto-rotate banners every 8 seconds
  useEffect(() => {
    if (activeBanners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % activeBanners.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [activeBanners.length]);

  // Reset to first banner when banners change
  useEffect(() => {
    setCurrentBanner(0);
  }, [banners]);

  const nextBanner = () => {
    setCurrentBanner(prev => (prev + 1) % activeBanners.length);
  };

  const prevBanner = () => {
    setCurrentBanner(prev => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  if (isLoading || activeBanners.length === 0) {
    return null;
  }

  const banner = activeBanners[currentBanner];

  const handleBannerClick = () => {
    if (banner.redirectUrl) {
      // Check if it's an external URL
      if (banner.redirectUrl.startsWith('http')) {
        window.open(banner.redirectUrl, '_blank', 'noopener,noreferrer');
      } else {
        // Internal navigation using wouter
        navigate(banner.redirectUrl);
      }
    }
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Card className="relative overflow-hidden border-0 shadow-lg">
        <div className="relative">
          {/* Main Banner Content */}
          <div 
            className="relative h-48 sm:h-64 md:h-80 bg-gradient-to-r from-[#E30613] to-[#FF1F2F] flex items-center cursor-pointer group"
            onClick={handleBannerClick}
            data-testid={`banner-${banner.id}`}
          >
            {/* Background Image */}
            {banner.image && (
              <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 group-hover:opacity-30 transition-opacity duration-300"
                style={{ backgroundImage: `url(${banner.image})` }}
                aria-hidden="true"
              />
            )}
            
            {/* Overlay for better text readability */}
            <div className="absolute inset-0 bg-black/20" />
            
            {/* Content */}
            <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-3xl text-white">
                <div className="mb-2">
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs">
                    Limited Time Offer
                  </Badge>
                </div>
                
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 leading-tight" data-testid={`banner-title-${banner.id}`}>
                  {banner.title}
                </h2>
                
                <p className="text-base sm:text-lg md:text-xl text-white/90 mb-4 sm:mb-6 leading-relaxed max-w-2xl" data-testid={`banner-description-${banner.id}`}>
                  {banner.description}
                </p>
                
                <Button 
                  size="lg" 
                  className="bg-white text-[#E30613] hover:bg-white/90 font-semibold px-6 sm:px-8 py-3 text-base sm:text-lg group-hover:scale-105 transition-transform duration-200"
                  data-testid={`banner-button-${banner.id}`}
                >
                  {banner.buttonText}
                  <ExternalLink className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Navigation Arrows (only show if multiple banners) */}
          {activeBanners.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white border-white/20 z-20"
                onClick={(e) => {
                  e.stopPropagation();
                  prevBanner();
                }}
                data-testid="banner-prev"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white border-white/20 z-20"
                onClick={(e) => {
                  e.stopPropagation();
                  nextBanner();
                }}
                data-testid="banner-next"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </>
          )}

          {/* Dots Indicator (only show if multiple banners) */}
          {activeBanners.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
              {activeBanners.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-200 ${
                    index === currentBanner 
                      ? 'bg-white scale-110' 
                      : 'bg-white/50 hover:bg-white/70'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentBanner(index);
                  }}
                  data-testid={`banner-dot-${index}`}
                  aria-label={`Go to banner ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </Card>
      
      {/* Banner Info (visible only on larger screens) */}
      <div className="hidden lg:block mt-2 text-center">
        <p className="text-xs text-muted-foreground">
          {activeBanners.length > 1 && (
            <>Banner {currentBanner + 1} of {activeBanners.length} • </>
          )}
          Click banner to learn more
        </p>
      </div>
    </div>
  );
}