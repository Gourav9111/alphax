
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Link } from "wouter";

interface Banner {
  id: string;
  title: string;
  description: string;
  image: string;
  buttonText: string;
  buttonLink: string;
  discountText?: string;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
}

export default function PromoBanner() {
  const [banner, setBanner] = useState<Banner | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const fetchActiveBanner = async () => {
      try {
        const response = await fetch("/api/banners/active");
        if (response.ok) {
          const activeBanner = await response.json();
          if (activeBanner) {
            setBanner(activeBanner);
            setIsVisible(true);
          }
        }
      } catch (error) {
        console.error("Failed to fetch banner:", error);
      }
    };

    fetchActiveBanner();
  }, []);

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!banner || !isVisible) {
    return null;
  }

  return (
    <div className="relative bg-gradient-to-r from-primary/90 to-primary text-white overflow-hidden">
      <div className="absolute inset-0 bg-black/10"></div>
      
      {/* Close button */}
      <button
        onClick={handleClose}
        className="absolute top-2 right-2 z-20 p-1 hover:bg-white/20 rounded-full transition-colors"
        aria-label="Close banner"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="relative z-10 container mx-auto px-4 py-6">
        <div className="grid md:grid-cols-2 gap-6 items-center">
          {/* Content */}
          <div className="order-2 md:order-1">
            <div className="space-y-4">
              {banner.discountText && (
                <div className="inline-block bg-yellow-400 text-black px-3 py-1 rounded-full text-sm font-bold">
                  {banner.discountText}
                </div>
              )}
              
              <h2 className="text-2xl md:text-3xl font-bold leading-tight">
                {banner.title}
              </h2>
              
              <p className="text-white/90 text-sm md:text-base max-w-md">
                {banner.description}
              </p>
              
              <Link href={banner.buttonLink}>
                <Button 
                  size="lg" 
                  className="bg-white text-primary hover:bg-white/90 font-semibold px-6 py-3"
                >
                  {banner.buttonText}
                </Button>
              </Link>
            </div>
          </div>

          {/* Image */}
          <div className="order-1 md:order-2">
            <div className="relative max-w-sm mx-auto md:max-w-full">
              <img
                src={banner.image}
                alt={banner.title}
                className="w-full h-48 md:h-64 object-cover rounded-lg shadow-xl"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
