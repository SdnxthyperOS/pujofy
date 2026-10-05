import React, { useState } from 'react';
import { Pandal, PandalRecommendation } from '@pujofy/types';
import { DEFAULT_PANDAL_PHOTO } from '../services/api';
import {
  X,
  MapPin,
  Clock,
  Users,
  Navigation,
  Bookmark,
  BookmarkCheck,
  ShieldCheck,
  Share2,
  AlertCircle,
} from 'lucide-react';

interface PandalDetailModalProps {
  pandal: Pandal | null;
  recommendation?: PandalRecommendation | null;
  onClose: () => void;
  onGoThere: (pandal: Pandal) => void;
  isSaved?: boolean;
  onToggleSave?: (id: string) => void;
  onOpenCrowdReport: (pandalId: string) => void;
}

export const PandalDetailModal: React.FC<PandalDetailModalProps> = ({
  pandal,
  recommendation,
  onClose,
  onGoThere,
  isSaved = false,
  onToggleSave,
  onOpenCrowdReport,
}) => {
  const [imgError, setImgError] = useState(false);
  if (!pandal) return null;

  const photoUrl = imgError || !pandal.imageUrl ? DEFAULT_PANDAL_PHOTO : pandal.imageUrl;
  const altText = pandal.imageAlt || `Festive Durga Puja pandal at ${pandal.name}`;

  const crowdLevel = recommendation?.crowdLevel || (pandal as any)?.crowd?.crowdLevel || null;
  const queueMinutes = recommendation?.queueMinutes ?? (pandal as any)?.crowd?.queueMinutes ?? null;

  const getCrowdLabel = (level: string | null) => {
    switch (level) {
      case 'LOW':
        return 'Low Crowd';
      case 'MEDIUM':
        return 'Moderate Crowd';
      case 'HIGH':
        return 'High Crowd';
      case 'VERY_HIGH':
        return 'Very Heavy Queue';
      default:
        return 'Data Unavailable';
    }
  };

  const crowdLabel = getCrowdLabel(crowdLevel);
  const queueText = queueMinutes !== null ? `~${queueMinutes} Mins` : 'Queue Unknown';

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Pujofy: ${pandal.name}`,
        text: `Check out ${pandal.name} in ${pandal.area} on Pujofy!`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Pandal link copied to clipboard!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#3A2118]/60 backdrop-blur-sm animate-fadeIn">
      {/* Overlay Backdrop Click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Sheet Container */}
      <div className="relative w-full max-w-md sm:max-w-xl bg-[#FFFDF9] rounded-t-3xl sm:rounded-3xl border border-[#E9DED2] shadow-warm-lg max-h-[90vh] overflow-y-auto z-10 animate-slideUp">
        {/* Header Hero Image */}
        <div className="relative h-64 sm:h-72 w-full bg-[#3A2118]">
          <img
            src={photoUrl}
            alt={altText}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#3A2118] via-transparent to-[#3A2118]/30" />

          {/* Close Button */}
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-4 right-4 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-[#3A2118]/70 text-[#FFFDF9] backdrop-blur-md hover:bg-[#3A2118] transition"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            aria-label="Share pandal"
            className="absolute top-4 right-16 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-[#3A2118]/70 text-[#FFFDF9] backdrop-blur-md hover:bg-[#3A2118] transition"
          >
            <Share2 className="w-5 h-5 text-[#C59A62]" />
          </button>

          {/* Title Banner */}
          <div className="absolute bottom-4 left-4 right-4 text-[#FFFDF9]">
            <span className="px-2.5 py-1 bg-[#C59A62] text-[#3A2118] text-[10px] font-bold tracking-wider uppercase rounded-full border border-[#FFFDF9]/40 mb-1 inline-block">
              {pandal.category || 'Puja Pandals 2026'}
            </span>
            <h2 className="font-serif text-2xl font-bold leading-tight drop-shadow-md">
              {pandal.name}
            </h2>
            <p className="text-xs text-[#E9DED2] flex items-center space-x-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-[#C59A62]" />
              <span>{pandal.address}</span>
            </p>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Live Signals & Crowd Box */}
          <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E9DED2] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-[#3A2118]">
                <Users className="w-4 h-4 text-[#B87352]" />
                <span>Live Crowd & Queue Signal</span>
              </div>
              <span className="text-[10px] font-semibold text-[#B87352] bg-[#FFFDF9] px-2 py-0.5 rounded-full border border-[#E9DED2] flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> {crowdLevel ? 'Verified Live' : 'Pending Signal'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="bg-[#FFFDF9] p-2.5 rounded-xl border border-[#E9DED2] text-center">
                <p className="text-[10px] text-[#7A665B] uppercase font-bold">Crowd Level</p>
                <p className="text-sm font-bold text-[#B87352] mt-0.5">{crowdLabel}</p>
              </div>

              <div className="bg-[#FFFDF9] p-2.5 rounded-xl border border-[#E9DED2] text-center">
                <p className="text-[10px] text-[#7A665B] uppercase font-bold">Estimated Queue</p>
                <p className="text-sm font-bold text-[#5A3426] mt-0.5">{queueText}</p>
              </div>
            </div>

            <button
              onClick={() => onOpenCrowdReport(pandal.id)}
              className="w-full text-center text-xs font-semibold text-[#B87352] hover:text-[#5A3426] pt-1 flex items-center justify-center gap-1"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Are you here? Report current crowd</span>
            </button>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#7A665B] mb-1">
              About Theme & Artistry
            </h4>
            <p className="text-xs text-[#2B1B15] leading-relaxed bg-[#FFFDF9] p-3 rounded-2xl border border-[#E9DED2]">
              {pandal.description}
            </p>
          </div>

          {/* Key Logistics */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center space-x-2 p-3 bg-[#FAF7F2] rounded-2xl border border-[#E9DED2]">
              <Clock className="w-4 h-4 text-[#C59A62]" />
              <div>
                <p className="text-[10px] text-[#7A665B] uppercase font-bold">Opening Hours</p>
                <p className="font-semibold text-[#3A2118]">
                  {pandal.openingTime} - {pandal.closingTime}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 p-3 bg-[#FAF7F2] rounded-2xl border border-[#E9DED2]">
              <Clock className="w-4 h-4 text-[#B87352]" />
              <div>
                <p className="text-[10px] text-[#7A665B] uppercase font-bold">Recommended Visit</p>
                <p className="font-semibold text-[#3A2118]">
                  ~{pandal.estimatedVisitMinutes || 20} mins
                </p>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center space-x-2 pt-2">
            <button
              onClick={() => {
                onGoThere(pandal);
                onClose();
              }}
              className="flex-1 min-h-[44px] py-3 px-4 bg-[#3A2118] hover:bg-[#5A3426] text-[#FFFDF9] text-xs font-bold rounded-2xl shadow-warm-md flex items-center justify-center space-x-2 transition"
            >
              <Navigation className="w-4 h-4 text-[#C59A62]" />
              <span>GO THERE</span>
            </button>

            {onToggleSave && (
              <button
                onClick={() => onToggleSave(pandal.id)}
                className={`min-h-[44px] py-3 px-4 rounded-2xl text-xs font-semibold border transition flex items-center space-x-1.5 ${
                  isSaved
                    ? 'bg-[#E9DED2] text-[#3A2118] border-[#B87352]'
                    : 'bg-[#FFFDF9] text-[#5A3426] border-[#E9DED2]'
                }`}
              >
                {isSaved ? (
                  <>
                    <BookmarkCheck className="w-4 h-4 text-[#B87352]" />
                    <span>SAVED</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4 text-[#7A665B]" />
                    <span>SAVE</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
