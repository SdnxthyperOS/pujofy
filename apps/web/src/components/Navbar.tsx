import React from 'react';
import { Home, Map, Search, Moon, Bookmark } from 'lucide-react';

export type TabType = 'HOME' | 'MAP' | 'SEARCH' | 'TONIGHT' | 'SAVED';

interface NavbarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  savedCount: number;
  tripCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  savedCount,
  tripCount,
}) => {
  const tabs: { id: TabType; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'HOME', label: 'Home', icon: <Home className="w-5 h-5" /> },
    { id: 'MAP', label: 'Map', icon: <Map className="w-5 h-5" /> },
    { id: 'SEARCH', label: 'Search', icon: <Search className="w-5 h-5" /> },
    {
      id: 'TONIGHT',
      label: 'Tonight',
      icon: <Moon className="w-5 h-5" />,
      badge: tripCount > 0 ? tripCount : undefined,
    },
    {
      id: 'SAVED',
      label: 'Saved',
      icon: <Bookmark className="w-5 h-5" />,
      badge: savedCount > 0 ? savedCount : undefined,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-[#FFFDF9]/95 backdrop-blur-lg border-t border-[#E9DED2] px-2 sm:px-4 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-warm-sheet transition-all">
      <div className="max-w-md sm:max-w-lg mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`relative flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 rounded-2xl transition-all ${
                isSelected
                  ? 'text-[#3A2118] font-bold scale-105'
                  : 'text-[#7A665B] hover:text-[#3A2118]'
              }`}
            >
              <div className="relative">
                <span className={isSelected ? 'text-[#B87352]' : ''}>{tab.icon}</span>
                {tab.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2.5 bg-[#B87352] text-[#FFFDF9] text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-[#FFFDF9]">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-0.5 ${isSelected ? 'font-bold text-[#3A2118]' : 'font-medium text-[#7A665B]'}`}>
                {tab.label}
              </span>
              {isSelected && (
                <span className="w-1 h-1 rounded-full bg-[#B87352] mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
