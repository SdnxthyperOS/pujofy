import React from 'react';
import { RecommendationMode } from '@pujofy/types';
import { Zap, Leaf, Compass } from 'lucide-react';

interface ModeSelectorProps {
  currentMode: RecommendationMode;
  onSelectMode: (mode: RecommendationMode) => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({ currentMode, onSelectMode }) => {
  const modes: { id: RecommendationMode; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'QUICK_HOP',
      label: 'Quick Hop',
      icon: <Zap className="w-3.5 h-3.5 text-[#B87352]" />,
      desc: 'Nearest next',
    },
    {
      id: 'LOW_CROWD',
      label: 'Low Crowd',
      icon: <Leaf className="w-3.5 h-3.5 text-[#C59A62]" />,
      desc: 'Shorter queue',
    },
    {
      id: 'BALANCED',
      label: 'Balanced',
      icon: <Compass className="w-3.5 h-3.5 text-[#5A3426]" />,
      desc: 'Optimal route',
    },
  ];

  return (
    <div className="bg-[#FFFDF9] p-1.5 rounded-2xl border border-[#E9DED2] shadow-warm-sm flex items-center justify-between gap-1 my-3">
      {modes.map((m) => {
        const isSelected = currentMode === m.id;
        return (
          <button
            key={m.id}
            onClick={() => onSelectMode(m.id)}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-semibold flex flex-col items-center justify-center transition-all ${
              isSelected
                ? 'bg-[#3A2118] text-[#FFFDF9] shadow-warm-md scale-[1.02]'
                : 'text-[#7A665B] hover:bg-[#E9DED2]/40 hover:text-[#3A2118]'
            }`}
          >
            <div className="flex items-center space-x-1 mb-0.5">
              <span className={isSelected ? 'text-[#C59A62]' : ''}>{m.icon}</span>
              <span>{m.label}</span>
            </div>
            <span
              className={`text-[10px] font-normal ${
                isSelected ? 'text-[#E9DED2]' : 'text-[#7A665B]/80'
              }`}
            >
              {m.desc}
            </span>
          </button>
        );
      })}
    </div>
  );
};
