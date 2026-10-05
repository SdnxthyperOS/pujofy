import React, { useState } from 'react';
import { Pandal } from '@pujofy/types';
import { DEFAULT_PANDAL_PHOTO } from '../services/api';
import { MapPin, Clock, Bookmark, BookmarkCheck, Navigation, ArrowRight, Sparkles } from 'lucide-react';

export type PandalCardVariant = 'compact' | 'recommended' | 'detail';

export interface PandalCardProps {
  pandal: Pandal;
  variant?: PandalCardVariant;
  onClick?: () => void;
  isSaved?: boolean;
  onToggleSave?: (id: string) => void;
  onGoThere?: (pandal: Pandal) => void;
  onNotNow?: () => void;
  queueEstimate?: number;
  distanceMeters?: number;
  estimatedTravelMinutes?: number;
  crowdLevel?: string;
  explanation?: string;
  className?: string;
}

export const PandalCard: React.FC<PandalCardProps> = ({
  pandal,
  variant = 'compact',
  onClick,
  isSaved = false,
  onToggleSave,
  onGoThere,
  onNotNow,
  queueEstimate = 20,
  distanceMeters,
  estimatedTravelMinutes,
  crowdLevel = 'MEDIUM',
  explanation,
  className = '',
}) => {
  const [imgSrc, setImgSrc] = useState<string>(pandal.imageUrl || DEFAULT_PANDAL_PHOTO);
  const [hasError, setHasError] = useState<boolean>(false);

  const handleImageError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(DEFAULT_PANDAL_PHOTO);
    }
  };

  const altText = pandal.imageAlt || `Festive Durga Puja pandal at ${pandal.name}`;
  const distanceText = distanceMeters
    ? `${(distanceMeters / 1000).toFixed(1)} km`
    : estimatedTravelMinutes
    ? `${estimatedTravelMinutes} min walk`
    : 'Nearby';

  // Variant 1: Recommended / Hero Variant
  if (variant === 'recommended') {
    return (
      <div
        className={`relative bg-[#FFFDF9] rounded-3xl border border-[#E9DED2] shadow-warm-lg overflow-hidden transition-all duration-300 hover:border-[#C59A62] ${className}`}
      >
        {/* Top Tag */}
        <div className="bg-[#3A2118] text-[#C59A62] px-4 py-2 flex items-center justify-between text-xs font-semibold tracking-wide">
          <div className="flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#C59A62] animate-spin" style={{ animationDuration: '6s' }} />
            <span className="uppercase tracking-widest text-[11px]">Recommended Hop</span>
          </div>
          <span className="text-[10px] text-[#E9DED2]/80 bg-[#5A3426] px-2 py-0.5 rounded-full">
            AI Selection
          </span>
        </div>

        {/* Hero Image Container (16:10 aspect ratio) */}
        <div
          className="relative w-full aspect-[16/10] bg-[#3A2118] cursor-pointer group overflow-hidden"
          onClick={onClick}
        >
          <img
            src={imgSrc}
            alt={altText}
            loading="eager"
            onError={handleImageError}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#3A2118] via-[#3A2118]/40 to-transparent" />

          {/* Bookmark Button */}
          {onToggleSave && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleSave(pandal.id);
              }}
              className="absolute top-3 right-3 p-2.5 rounded-full bg-[#FFFDF9]/85 backdrop-blur-md text-[#3A2118] hover:bg-[#FFFDF9] transition shadow-warm-md"
              title={isSaved ? 'Saved in trip' : 'Save pandal'}
            >
              {isSaved ? (
                <BookmarkCheck className="w-4 h-4 text-[#B87352] fill-[#B87352]" />
              ) : (
                <Bookmark className="w-4 h-4 text-[#5A3426]" />
              )}
            </button>
          )}

          {/* Category Badge */}
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#3A2118]/85 backdrop-blur-md text-[#FFFDF9] text-[11px] font-medium border border-[#C59A62]/40">
            {pandal.category || 'Puja Theme'}
          </div>

          {/* Title & Area Overlay */}
          <div className="absolute bottom-3 left-4 right-4 text-[#FFFDF9]">
            <h2 className="font-serif text-2xl font-bold leading-tight drop-shadow-md">
              {pandal.name}
            </h2>
            <p className="text-xs text-[#E9DED2] flex items-center space-x-1 mt-0.5">
              <MapPin className="w-3 h-3 text-[#C59A62]" />
              <span>{pandal.area || pandal.address}</span>
            </p>
          </div>
        </div>

        {/* Content & Metrics */}
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#FAF7F2] p-2 rounded-xl border border-[#E9DED2] text-center">
              <div className="flex items-center justify-center space-x-1 text-[#B87352] text-xs font-semibold mb-0.5">
                <Navigation className="w-3 h-3" />
                <span>{distanceText}</span>
              </div>
              <p className="text-[10px] text-[#7A665B]">Walk distance</p>
            </div>

            <div className="bg-[#FAF7F2] p-2 rounded-xl border border-[#E9DED2] text-center">
              <div className="flex items-center justify-center space-x-1 text-[#3A2118] text-xs font-semibold mb-0.5">
                <Clock className="w-3 h-3 text-[#B87352]" />
                <span>~{queueEstimate}m queue</span>
              </div>
              <p className="text-[10px] text-[#7A665B]">Live wait</p>
            </div>

            <div className="bg-[#FAF7F2] p-2 rounded-xl border border-[#E9DED2] text-center">
              <div className="flex items-center justify-center space-x-1 text-[#5A3426] text-xs font-semibold mb-0.5">
                <Clock className="w-3 h-3 text-[#C59A62]" />
                <span>~{pandal.estimatedVisitMinutes || 20}m</span>
              </div>
              <p className="text-[10px] text-[#7A665B]">Visit time</p>
            </div>
          </div>

          {explanation && (
            <div className="bg-[#FAF7F2] p-3 rounded-2xl border border-[#E9DED2]/80 flex items-start space-x-2">
              <div className="w-2 h-2 rounded-full bg-[#B87352] mt-1.5 shrink-0" />
              <p className="text-xs text-[#2B1B15] leading-relaxed italic">
                "{explanation}"
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center space-x-2 pt-1">
            {onGoThere && (
              <button
                onClick={() => onGoThere(pandal)}
                className="flex-1 py-3 px-4 bg-[#3A2118] hover:bg-[#5A3426] active:scale-[0.98] text-[#FFFDF9] rounded-2xl text-xs font-bold shadow-warm-md flex items-center justify-center space-x-2 transition-all"
              >
                <span>GO THERE</span>
                <ArrowRight className="w-4 h-4 text-[#C59A62]" />
              </button>
            )}

            {onNotNow && (
              <button
                onClick={onNotNow}
                className="py-3 px-4 bg-[#E9DED2]/50 hover:bg-[#E9DED2] text-[#5A3426] rounded-2xl text-xs font-semibold transition"
              >
                NOT NOW
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Variant 2: Detail Variant
  if (variant === 'detail') {
    return (
      <div className={`relative bg-[#FFFDF9] rounded-3xl overflow-hidden border border-[#E9DED2] ${className}`}>
        <div className="relative w-full aspect-[16/10] bg-[#3A2118]">
          <img
            src={imgSrc}
            alt={altText}
            loading="lazy"
            onError={handleImageError}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#3A2118] via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 text-[#FFFDF9]">
            <span className="px-2.5 py-0.5 bg-[#C59A62] text-[#3A2118] text-[10px] font-bold uppercase rounded-full inline-block mb-1">
              {pandal.category}
            </span>
            <h2 className="font-serif text-2xl font-bold">{pandal.name}</h2>
            <p className="text-xs text-[#E9DED2] flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-[#C59A62]" /> {pandal.address}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Variant 3: Default Compact Card
  return (
    <div
      onClick={onClick}
      className={`bg-[#FFFDF9] rounded-2xl border border-[#E9DED2] p-3 flex space-x-3 cursor-pointer shadow-warm-sm hover:shadow-warm-md hover:border-[#C59A62] transition-all group ${className}`}
    >
      {/* Photo Thumbnail */}
      <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-[#3A2118] shrink-0 border border-[#E9DED2]">
        <img
          src={imgSrc}
          alt={altText}
          loading="lazy"
          onError={handleImageError}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-[#3A2118]/80 text-[#FFFDF9] text-[9px] rounded font-medium backdrop-blur-sm">
          {pandal.area || 'Kolkata'}
        </div>
      </div>

      {/* Info Details */}
      <div className="flex-1 flex flex-col justify-between py-0.5">
        <div>
          <div className="flex items-start justify-between">
            <h3 className="font-serif text-lg font-bold text-[#3A2118] leading-tight line-clamp-1 group-hover:text-[#B87352] transition-colors">
              {pandal.name}
            </h3>
            {onToggleSave && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSave(pandal.id);
                }}
                className="text-[#7A665B] hover:text-[#B87352] p-1"
                aria-label={isSaved ? `Remove ${pandal.name} from saved` : `Save ${pandal.name}`}
              >
                {isSaved ? (
                  <BookmarkCheck className="w-4 h-4 text-[#B87352] fill-[#B87352]" />
                ) : (
                  <Bookmark className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
          <p className="text-xs text-[#7A665B] line-clamp-1 mt-0.5">{pandal.category}</p>
        </div>

        {/* Bottom Specs Pill */}
        <div className="flex items-center space-x-3 text-xs text-[#5A3426] pt-1 border-t border-[#E9DED2]/50 mt-1">
          <div className="flex items-center space-x-1">
            <MapPin className="w-3 h-3 text-[#B87352]" />
            <span className="font-medium text-[11px]">{distanceText}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3 text-[#C59A62]" />
            <span className="font-medium text-[11px]">~{queueEstimate}m queue</span>
          </div>
        </div>
      </div>
    </div>
  );
};
