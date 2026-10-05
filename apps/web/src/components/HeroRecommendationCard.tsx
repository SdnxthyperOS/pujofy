import React, { useState } from 'react';
import { PandalRecommendation } from '@pujofy/types';
import { DEFAULT_PANDAL_PHOTO } from '../services/api';
import { MapPin, Clock, Users, Navigation, ArrowRight, Bookmark, BookmarkCheck, Sparkles } from 'lucide-react';

interface HeroRecommendationCardProps {
  recommendation: PandalRecommendation;
  onGoThere: (rec: PandalRecommendation) => void;
  onNotNow: () => void;
  onOpenDetail: (pandalId: string) => void;
  isSaved?: boolean;
  onToggleSave?: (pandalId: string) => void;
}

export const HeroRecommendationCard: React.FC<HeroRecommendationCardProps> = ({
  recommendation,
  onGoThere,
  onNotNow,
  onOpenDetail,
  isSaved = false,
  onToggleSave,
}) => {
  const { pandal, estimatedTravelMinutes, crowdLevel, queueMinutes, estimatedVisitDurationMinutes, explanation } =
    recommendation;

  const [imgError, setImgError] = useState(false);
  const photoUrl = imgError || !pandal.imageUrl ? DEFAULT_PANDAL_PHOTO : pandal.imageUrl;
  const altText = pandal.imageAlt || `Festive Durga Puja pandal at ${pandal.name}`;

  // Format crowd text & color styling
  const getCrowdBadge = (level: string) => {
    switch (level) {
      case 'LOW':
        return { label: 'Low Crowd', bg: 'bg-[#FAF7F2]', text: 'text-[#B87352]', border: 'border-[#B87352]/40' };
      case 'MEDIUM':
        return { label: 'Moderate Crowd', bg: 'bg-[#FFFDF9]', text: 'text-[#5A3426]', border: 'border-[#C59A62]/60' };
      case 'HIGH':
        return { label: 'High Crowd', bg: 'bg-[#E9DED2]', text: 'text-[#3A2118]', border: 'border-[#B87352]' };
      case 'VERY_HIGH':
        return { label: 'Very Heavy Queue', bg: 'bg-[#3A2118]', text: 'text-[#FFFDF9]', border: 'border-[#3A2118]' };
      default:
        return { label: 'Moderate Crowd', bg: 'bg-[#FFFDF9]', text: 'text-[#5A3426]', border: 'border-[#C59A62]' };
    }
  };

  const crowdBadge = getCrowdBadge(crowdLevel);

  return (
    <div className="relative bg-[#FFFDF9] rounded-3xl border border-[#E9DED2] shadow-warm-lg overflow-hidden transition-all duration-300 hover:border-[#C59A62]">
      {/* Top Banner Tag */}
      <div className="bg-[#3A2118] text-[#C59A62] px-4 py-2 flex items-center justify-between text-xs font-semibold tracking-wide">
        <div className="flex items-center space-x-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#C59A62] animate-spin" style={{ animationDuration: '6s' }} />
          <span className="uppercase tracking-widest text-[11px]">Your Next Stop</span>
        </div>
        <span className="text-[10px] text-[#E9DED2]/80 bg-[#5A3426] px-2 py-0.5 rounded-full">
          AI Recommendation
        </span>
      </div>

      {/* Hero Image Container */}
      <div
        className="relative h-48 w-full bg-[#5A3426] cursor-pointer group"
        onClick={() => onOpenDetail(pandal.id)}
      >
        <img
          src={photoUrl}
          alt={altText}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#3A2118] via-[#3A2118]/40 to-transparent" />

        {/* Save Bookmark Button */}
        {onToggleSave && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave(pandal.id);
            }}
            className="absolute top-3 right-3 p-2.5 rounded-full bg-[#FFFDF9]/80 backdrop-blur-md text-[#3A2118] hover:bg-[#FFFDF9] transition shadow-warm-md"
            title={isSaved ? 'Saved in trip' : 'Save pandal'}
          >
            {isSaved ? (
              <BookmarkCheck className="w-4 h-4 text-[#B87352] fill-[#B87352]" />
            ) : (
              <Bookmark className="w-4 h-4 text-[#5A3426]" />
            )}
          </button>
        )}

        {/* Category Badge on Photo */}
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#3A2118]/80 backdrop-blur-md text-[#FFFDF9] text-[11px] font-medium border border-[#C59A62]/40">
          {pandal.category || 'Puja Theme'}
        </div>

        {/* Overlay Title & Area */}
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

      {/* Content Section */}
      <div className="p-4 space-y-3">
        {/* Metrics Pill Grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-[#FAF7F2] p-2 rounded-xl border border-[#E9DED2] text-center">
            <div className="flex items-center justify-center space-x-1 text-[#B87352] text-xs font-semibold mb-0.5">
              <Navigation className="w-3 h-3" />
              <span>{estimatedTravelMinutes} min away</span>
            </div>
            <p className="text-[10px] text-[#7A665B]">Walk distance</p>
          </div>

          <div className={`p-2 rounded-xl border text-center ${crowdBadge.bg} ${crowdBadge.border}`}>
            <div className={`flex items-center justify-center space-x-1 text-xs font-semibold mb-0.5 ${crowdBadge.text}`}>
              <Users className="w-3 h-3" />
              <span className="truncate">{crowdBadge.label}</span>
            </div>
            <p className="text-[10px] text-[#7A665B]">~{queueMinutes}m queue</p>
          </div>

          <div className="bg-[#FAF7F2] p-2 rounded-xl border border-[#E9DED2] text-center">
            <div className="flex items-center justify-center space-x-1 text-[#5A3426] text-xs font-semibold mb-0.5">
              <Clock className="w-3 h-3" />
              <span>~{estimatedVisitDurationMinutes} min</span>
            </div>
            <p className="text-[10px] text-[#7A665B]">Visit duration</p>
          </div>
        </div>

        {/* Explanation Reason Box */}
        <div className="bg-[#FAF7F2] p-3 rounded-2xl border border-[#E9DED2]/80 flex items-start space-x-2">
          <div className="w-2 h-2 rounded-full bg-[#B87352] mt-1.5 shrink-0" />
          <p className="text-xs text-[#2B1B15] leading-relaxed italic">
            "{explanation}"
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 pt-1">
          <button
            onClick={() => onGoThere(recommendation)}
            className="flex-1 py-3 px-4 bg-[#3A2118] hover:bg-[#5A3426] active:scale-[0.98] text-[#FFFDF9] rounded-2xl text-xs font-bold shadow-warm-md flex items-center justify-center space-x-2 transition-all"
          >
            <span>GO THERE</span>
            <ArrowRight className="w-4 h-4 text-[#C59A62]" />
          </button>

          <button
            onClick={onNotNow}
            className="py-3 px-4 bg-[#E9DED2]/50 hover:bg-[#E9DED2] text-[#5A3426] rounded-2xl text-xs font-semibold transition"
          >
            NOT NOW
          </button>
        </div>
      </div>
    </div>
  );
};
