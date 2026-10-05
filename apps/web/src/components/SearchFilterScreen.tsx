import React, { useState, useMemo } from 'react';
import { Pandal } from '@pujofy/types';
import { PandalCard } from './PandalCard';
import { Search, SlidersHorizontal, MapPin } from 'lucide-react';

interface SearchFilterScreenProps {
  pandals: Pandal[];
  onSelectPandal: (pandal: Pandal) => void;
  savedIds: string[];
  onToggleSave: (id: string) => void;
}

export const SearchFilterScreen: React.FC<SearchFilterScreenProps> = ({
  pandals,
  onSelectPandal,
  savedIds,
  onToggleSave,
}) => {
  const [query, setQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState<string>('ALL');

  const areas = useMemo(() => {
    const set = new Set<string>();
    pandals.forEach((p) => {
      if (p.area) set.add(p.area);
    });
    return ['ALL', ...Array.from(set)];
  }, [pandals]);

  const filteredPandals = useMemo(() => {
    return pandals.filter((p) => {
      const matchesQuery =
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.category?.toLowerCase().includes(query.toLowerCase()) ||
        p.description?.toLowerCase().includes(query.toLowerCase()) ||
        p.address?.toLowerCase().includes(query.toLowerCase());

      const matchesArea = selectedArea === 'ALL' || p.area === selectedArea;

      return matchesQuery && matchesArea;
    });
  }, [pandals, query, selectedArea]);

  return (
    <div className="space-y-4 pb-20 lg:pb-10 w-full">
      {/* Title Bar */}
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#3A2118]">Search & Explore</h2>
        <span className="text-xs sm:text-sm font-medium text-[#7A665B]">{filteredPandals.length} pandals</span>
      </div>

      {/* Search Input & Locality Bar */}
      <div className="bg-[#FFFDF9] p-3 sm:p-4 rounded-3xl border border-[#E9DED2] shadow-warm-sm space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-[#7A665B] absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search by pandal name, neighborhood, theme, or award category..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-[#FAF7F2] border border-[#E9DED2] rounded-2xl text-xs sm:text-sm text-[#3A2118] placeholder-[#7A665B] focus:outline-none focus:border-[#C59A62] transition"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3.5 top-3.5 text-xs font-semibold text-[#7A665B] hover:text-[#3A2118]"
            >
              Clear
            </button>
          )}
        </div>

        {/* Locality Filter Chips */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#7A665B] mb-2 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-[#B87352]" /> Kolkata Locality Hub
          </p>
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
            {areas.map((area) => (
              <button
                key={area}
                onClick={() => setSelectedArea(area)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap min-h-[36px] transition active:scale-95 ${
                  selectedArea === area
                    ? 'bg-[#3A2118] text-[#FFFDF9] shadow-warm-sm'
                    : 'bg-[#FAF7F2] text-[#7A665B] border border-[#E9DED2] hover:bg-[#E9DED2]/40'
                }`}
              >
                {area === 'ALL' ? 'All Kolkata' : area}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Multi-Column Grid */}
      {filteredPandals.length === 0 ? (
        <div className="text-center py-12 bg-[#FFFDF9] rounded-3xl border border-[#E9DED2] p-6 space-y-2">
          <SlidersHorizontal className="w-10 h-10 text-[#C59A62] mx-auto opacity-70" />
          <h3 className="font-serif text-lg font-bold text-[#3A2118]">No Pandals Found</h3>
          <p className="text-xs text-[#7A665B]">
            Try searching with another keyword or resetting the locality filter.
          </p>
          <button
            onClick={() => {
              setQuery('');
              setSelectedArea('ALL');
            }}
            className="mt-2 text-xs font-bold text-[#B87352] underline"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {filteredPandals.map((pandal) => (
            <PandalCard
              key={pandal.id}
              pandal={pandal}
              onClick={() => onSelectPandal(pandal)}
              isSaved={savedIds.includes(pandal.id)}
              onToggleSave={onToggleSave}
            />
          ))}
        </div>
      )}
    </div>
  );
};
