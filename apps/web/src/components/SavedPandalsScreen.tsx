import React from 'react';
import { Pandal } from '@pujofy/types';
import { PandalCard } from './PandalCard';
import { Bookmark, Sparkles } from 'lucide-react';

interface SavedPandalsScreenProps {
  pandals: Pandal[];
  savedIds: string[];
  onSelectPandal: (pandal: Pandal) => void;
  onToggleSave: (id: string) => void;
}

export const SavedPandalsScreen: React.FC<SavedPandalsScreenProps> = ({
  pandals,
  savedIds,
  onSelectPandal,
  onToggleSave,
}) => {
  const savedPandals = pandals.filter((p) => savedIds.includes(p.id));

  return (
    <div className="space-y-4 pb-20 lg:pb-10 w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bookmark className="w-5 h-5 text-[#B87352]" />
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#3A2118]">Saved Pandals</h2>
        </div>
        <span className="text-xs sm:text-sm font-medium text-[#7A665B]">{savedPandals.length} Bookmarked</span>
      </div>

      {savedPandals.length === 0 ? (
        <div className="text-center py-12 bg-[#FFFDF9] rounded-3xl border border-[#E9DED2] p-6 space-y-3">
          <Sparkles className="w-10 h-10 text-[#C59A62] mx-auto opacity-80" />
          <h3 className="font-serif text-lg sm:text-xl font-bold text-[#3A2118]">No Saved Pandals Yet</h3>
          <p className="text-xs sm:text-sm text-[#7A665B] max-w-sm mx-auto">
            Tap the bookmark icon on any pandal card to save it for quick access during your Puja trip.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {savedPandals.map((pandal) => (
            <PandalCard
              key={pandal.id}
              pandal={pandal}
              onClick={() => onSelectPandal(pandal)}
              isSaved={true}
              onToggleSave={onToggleSave}
            />
          ))}
        </div>
      )}
    </div>
  );
};
