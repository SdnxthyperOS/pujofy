import React from 'react';
import { MapPin, Navigation, Info } from 'lucide-react';

interface LocationFallbackBannerProps {
  locationName: string;
  onRequestGPS: () => void;
  isGPSActive: boolean;
}

export const LocationFallbackBanner: React.FC<LocationFallbackBannerProps> = ({
  locationName,
  onRequestGPS,
  isGPSActive,
}) => {
  if (isGPSActive) return null;

  return (
    <div className="bg-[#FFFDF9] rounded-2xl border border-[#C59A62]/60 p-3 shadow-warm-sm flex items-center justify-between gap-3 text-xs my-3">
      <div className="flex items-center space-x-2.5">
        <div className="p-2 bg-[#FAF7F2] text-[#B87352] rounded-xl border border-[#E9DED2] shrink-0">
          <Info className="w-4 h-4" />
        </div>
        <div>
          <p className="font-semibold text-[#3A2118]">Browsing near {locationName}</p>
          <p className="text-[11px] text-[#7A665B]">Enable GPS for precise walking ETA</p>
        </div>
      </div>

      <button
        onClick={onRequestGPS}
        className="px-3 py-1.5 bg-[#3A2118] text-[#FFFDF9] hover:bg-[#5A3426] rounded-xl text-[11px] font-bold shrink-0 shadow-warm-sm flex items-center space-x-1 transition"
      >
        <Navigation className="w-3 h-3 text-[#C59A62]" />
        <span>Use GPS</span>
      </button>
    </div>
  );
};
