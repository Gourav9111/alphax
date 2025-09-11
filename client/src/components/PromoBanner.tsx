
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface Banner {
  id: number;
  title: string;
  description: string;
  image_url: string;
  button_text: string;
  button_link: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function PromoBanner() {
  const [banner, setBanner] = useState<Banner | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Fetch active banner from API
    const fetchBanner = async () => {
      try {
        const response = await fetch("/api/banners/active");
        if (response.ok) {
          const data = await response.json();
          setBanner(data);
        }
      } catch (error) {
        console.error("Failed to fetch banner:", error);
      }
    };

    fetchBanner();
  }, []);

  if (!banner || !isVisible) return null;

  return (
    <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
          aria-label="Close banner"
        >
          <X className="h-6 w-6" />
        </button>
        
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-4">{banner.title}</h2>
            <p className="text-lg mb-6 text-blue-100">
              {banner.description}
            </p>
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => window.location.href = banner.button_link}
            >
              {banner.button_text}
            </Button>
          </div>
          
          {banner.image_url && (
            <div className="flex justify-center">
              <img
                src={banner.image_url}
                alt={banner.title}
                className="max-w-full h-auto rounded-lg shadow-lg"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
