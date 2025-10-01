import React, { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';

interface SponsorBannerProps {
  banners: Array<{
    id: string;
    sponsor_name: string;
    banner_url: string;
    click_url?: string;
  }>;
  autoRotate?: boolean;
  rotationInterval?: number;
  className?: string;
}

export default function SponsorBanner({ 
  banners, 
  autoRotate = true, 
  rotationInterval = 5000,
  className = '' 
}: SponsorBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!autoRotate || banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, rotationInterval);

    return () => clearInterval(interval);
  }, [autoRotate, banners.length, rotationInterval]);

  if (!banners || banners.length === 0) {
    return null;
  }

  const currentBanner = banners[currentIndex];

  const handleBannerClick = () => {
    if (currentBanner.click_url) {
      window.open(currentBanner.click_url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className={`glass rounded-xl overflow-hidden ${className}`}>
      <div 
        className={`relative group ${currentBanner.click_url ? 'cursor-pointer' : ''}`}
        onClick={handleBannerClick}
      >
        <img
          src={currentBanner.banner_url}
          alt={`Sponsor: ${currentBanner.sponsor_name}`}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Overlay for clickable banners */}
        {currentBanner.click_url && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 glass-strong p-2 rounded-lg">
              <ExternalLink className="h-4 w-4 text-white" />
            </div>
          </div>
        )}
        
        {/* Sponsor label */}
        <div className="absolute bottom-2 left-2 glass-strong px-2 py-1 rounded text-xs text-white/90">
          Sponsor: {currentBanner.sponsor_name}
        </div>
      </div>

      {/* Rotation indicators */}
      {banners.length > 1 && (
        <div className="flex justify-center space-x-1 p-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                index === currentIndex ? 'bg-frog-primary' : 'bg-white/30'
              }`}
              aria-label={`Voir le sponsor ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}