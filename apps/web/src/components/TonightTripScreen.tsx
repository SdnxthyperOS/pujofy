import React from 'react';
import { Pandal } from '@pujofy/types';
import { DEFAULT_PANDAL_PHOTO } from '../services/api';
import { Moon, CheckCircle2, Clock, MapPin, Trash2, ArrowRight, Sparkles, Navigation } from 'lucide-react';

export interface TripStop {
  pandal: Pandal;
  status: 'UPCOMING' | 'VISITED';
  visitedAt?: string;
  queueMinutes: number;
}

interface TonightTripScreenProps {
  tripStops: TripStop[];
  onMarkVisited: (pandalId: string) => void;
  onRemoveStop: (pandalId: string) => void;
  onGoToPandal: (pandal: Pandal) => void;
  onClearTrip: () => void;
}

export const TonightTripScreen: React.FC<TonightTripScreenProps> = ({
  tripStops,
  onMarkVisited,
  onRemoveStop,
  onGoToPandal,
  onClearTrip,
}) => {
  const visitedCount = tripStops.filter((s) => s.status === 'VISITED').length;
  const totalCount = tripStops.length;
  const progressPercent = totalCount > 0 ? Math.round((visitedCount / totalCount) * 100) : 0;

  const totalWalkTimeMin = totalCount * 8; // approx 8m walk between stops
  const totalQueueTimeMin = tripStops.reduce((acc, s) => acc + s.queueMinutes, 0);

  return (
    <div className="space-y-4 pb-20 lg:pb-10 w-full">
      {/* Responsive 2-Column Split for Desktop (Stats left, timeline right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
        {/* Left Column: Progress & Stats Summary Card */}
        <div className="lg:col-span-4 lg:sticky lg:top-20 space-y-4">
          <div className="bg-[#3A2118] text-[#FFFDF9] rounded-3xl p-5 border border-[#5A3426] shadow-warm-lg space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Moon className="w-5 h-5 text-[#C59A62]" />
                <h2 className="font-serif text-2xl font-bold tracking-tight">Tonight's Puja Route</h2>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-[#5A3426] text-[#C59A62] px-2.5 py-1 rounded-full border border-[#C59A62]/30">
                Live Trip
              </span>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-xs text-[#E9DED2] mb-1">
                <span>Progress: {visitedCount} of {totalCount} Visited</span>
                <span className="font-bold text-[#C59A62]">{progressPercent}%</span>
              </div>
              <div className="w-full bg-[#5A3426] h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#C59A62] h-full transition-all duration-500 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#5A3426]">
              <div className="text-center">
                <p className="text-[10px] text-[#E9DED2]/80 uppercase font-semibold">Visited</p>
                <p className="text-sm font-bold text-[#FFFDF9]">{visitedCount} Stops</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-[#E9DED2]/80 uppercase font-semibold">Est. Walk</p>
                <p className="text-sm font-bold text-[#C59A62]">~{totalWalkTimeMin}m</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-[#E9DED2]/80 uppercase font-semibold">Est. Queue</p>
                <p className="text-sm font-bold text-[#FFFDF9]">~{totalQueueTimeMin}m</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Timeline Itinerary */}
        <div className="lg:col-span-8 space-y-3">
          {totalCount === 0 ? (
            <div className="text-center py-12 bg-[#FFFDF9] rounded-3xl border border-[#E9DED2] p-6 space-y-3">
              <Sparkles className="w-10 h-10 text-[#C59A62] mx-auto opacity-80" />
              <h3 className="font-serif text-lg font-bold text-[#3A2118]">No Stops Added Yet</h3>
              <p className="text-xs text-[#7A665B] max-w-sm mx-auto">
                Tap "GO THERE" on any pandal recommendation or card to add it to your Puja night route!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#7A665B]">
                  Planned Timeline ({totalCount} Stops)
                </h3>
                <button
                  onClick={onClearTrip}
                  className="text-xs font-semibold text-[#B87352] hover:text-[#3A2118] flex items-center space-x-1 min-h-[36px] px-2 py-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Route</span>
                </button>
              </div>

              <div className="space-y-3 relative before:absolute before:left-6 before:top-4 before:bottom-4 before:w-0.5 before:bg-[#E9DED2]">
                {tripStops.map((stop, idx) => {
                  const isVisited = stop.status === 'VISITED';
                  const photoUrl = stop.pandal.imageUrl || DEFAULT_PANDAL_PHOTO;
                  const altText = stop.pandal.imageAlt || `Festive Durga Puja pandal at ${stop.pandal.name}`;

                  return (
                    <div key={stop.pandal.id} className="relative flex items-start space-x-3 pl-2">
                      {/* Timeline Dot */}
                      <div
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 z-10 ${
                          isVisited
                            ? 'bg-[#3A2118] border-[#C59A62] text-[#C59A62]'
                            : 'bg-[#FFFDF9] border-[#B87352] text-[#B87352]'
                        }`}
                      >
                        {isVisited ? (
                          <CheckCircle2 className="w-4 h-4 fill-[#C59A62] text-[#3A2118]" />
                        ) : (
                          <span className="text-xs font-bold">{idx + 1}</span>
                        )}
                      </div>

                      {/* Stop Card */}
                      <div
                        className={`flex-1 bg-[#FFFDF9] rounded-2xl border p-3.5 shadow-warm-sm transition ${
                          isVisited
                            ? 'border-[#E9DED2] opacity-75 bg-[#FAF7F2]'
                            : 'border-[#E9DED2] hover:border-[#C59A62]'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                          <img
                            src={photoUrl}
                            alt={altText}
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = DEFAULT_PANDAL_PHOTO;
                            }}
                            className="w-full sm:w-20 h-24 sm:h-20 rounded-xl object-cover shrink-0 border border-[#E9DED2] bg-[#3A2118]"
                          />

                          <div className="flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-start">
                                <h4
                                  className={`font-serif text-base sm:text-lg font-bold leading-tight ${
                                    isVisited ? 'line-through text-[#7A665B]' : 'text-[#3A2118]'
                                  }`}
                                >
                                  {stop.pandal.name}
                                </h4>
                                <button
                                  onClick={() => onRemoveStop(stop.pandal.id)}
                                  className="text-[#7A665B] hover:text-[#B87352] p-1.5"
                                  aria-label={`Remove ${stop.pandal.name}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                              <p className="text-xs text-[#7A665B] flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3 text-[#B87352]" />
                                <span>{stop.pandal.area || stop.pandal.address}</span>
                              </p>
                            </div>

                            <div className="flex items-center justify-between text-xs text-[#5A3426] pt-2 border-t border-[#E9DED2]/40 mt-1">
                              <span className="flex items-center gap-1 text-[11px] font-medium">
                                <Clock className="w-3 h-3 text-[#C59A62]" /> ~{stop.queueMinutes}m queue
                              </span>

                              {isVisited ? (
                                <span className="text-[10px] font-bold text-[#B87352]">VISITED ✓</span>
                              ) : (
                                <button
                                  onClick={() => onMarkVisited(stop.pandal.id)}
                                  className="px-3 py-1.5 bg-[#3A2118] text-[#FFFDF9] rounded-xl text-[10px] font-bold hover:bg-[#5A3426] transition active:scale-95"
                                >
                                  MARK VISITED
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
