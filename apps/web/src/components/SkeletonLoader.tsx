import React from 'react';

export const HeroSkeleton: React.FC = () => {
  return (
    <div className="bg-[#FFFDF9] rounded-3xl border border-[#E9DED2] shadow-warm-md overflow-hidden p-4 space-y-4 animate-warm-shimmer">
      <div className="h-6 w-32 bg-[#E9DED2] rounded-full" />
      <div className="h-44 w-full bg-[#E9DED2] rounded-2xl" />
      <div className="grid grid-cols-3 gap-2">
        <div className="h-12 bg-[#E9DED2] rounded-xl" />
        <div className="h-12 bg-[#E9DED2] rounded-xl" />
        <div className="h-12 bg-[#E9DED2] rounded-xl" />
      </div>
      <div className="h-14 bg-[#E9DED2] rounded-2xl" />
    </div>
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-[#FFFDF9] rounded-2xl border border-[#E9DED2] p-3 flex space-x-3 animate-warm-shimmer">
      <div className="w-24 h-24 bg-[#E9DED2] rounded-xl shrink-0" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-5 w-3/4 bg-[#E9DED2] rounded-lg" />
        <div className="h-4 w-1/2 bg-[#E9DED2] rounded-lg" />
        <div className="h-4 w-2/3 bg-[#E9DED2] rounded-lg" />
      </div>
    </div>
  );
};
