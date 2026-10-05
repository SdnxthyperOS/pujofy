import React, { useState } from 'react';
import { MapPin, Sparkles, ChevronDown, Check, Wifi, WifiOff, Home, Map, Search, Moon, Bookmark } from 'lucide-react';
import { KOLKATA_HUBS } from '../services/api';
import { TabType } from './Navbar';

interface HeaderProps {
  currentLocation: { lat: number; lng: number; name: string };
  onSelectLocation: (loc: { lat: number; lng: number; name: string }) => void;
  isBackendConnected: boolean;
  onRequestGPSLocation: () => void;
  activeTab?: TabType;
  onSelectTab?: (tab: TabType) => void;
  savedCount?: number;
  tripCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentLocation,
  onSelectLocation,
  isBackendConnected,
  onRequestGPSLocation,
  activeTab = 'HOME',
  onSelectTab,
  savedCount = 0,
  tripCount = 0,
}) => {
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  const desktopNavItems: { id: TabType; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'HOME', label: 'Discover', icon: <Home className="w-4 h-4" /> },
    { id: 'MAP', label: 'Map', icon: <Map className="w-4 h-4" /> },
    { id: 'SEARCH', label: 'Explore', icon: <Search className="w-4 h-4" /> },
    {
      id: 'TONIGHT',
      label: 'Tonight Trip',
      icon: <Moon className="w-4 h-4" />,
      badge: tripCount > 0 ? tripCount : undefined,
    },
    {
      id: 'SAVED',
      label: 'Saved',
      icon: <Bookmark className="w-4 h-4" />,
      badge: savedCount > 0 ? savedCount : undefined,
    },
  ];

  return (
    <header className="sticky top-0 z-30 bg-[#FAF7F2]/90 backdrop-blur-md border-b border-[#E9DED2] px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Left: App Brand & Greeting */}
        <div className="flex items-center space-x-2.5 shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#3A2118] flex items-center justify-center text-[#C59A62] shadow-warm-sm border border-[#5A3426] shrink-0">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#3A2118]">Pujofy</span>
              <span className="text-[10px] sm:text-[11px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded bg-[#E9DED2] text-[#5A3426]">
                2026
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-[#7A665B] font-medium flex items-center gap-1">
              <span>Shubho Nabami</span>
              <span className="text-xs">•</span>
              <span className="truncate max-w-[110px] sm:max-w-[160px]">{currentLocation.name.split('/')[0]}</span>
            </p>
          </div>
        </div>

        {/* Center: Desktop Navigation Bar (visible lg+) */}
        {onSelectTab && (
          <nav className="hidden lg:flex items-center bg-[#FFFDF9] p-1 rounded-2xl border border-[#E9DED2] shadow-warm-sm space-x-1">
            {desktopNavItems.map((item) => {
              const isSelected = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`relative flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-[#3A2118] text-[#FFFDF9] shadow-warm-sm'
                      : 'text-[#7A665B] hover:text-[#3A2118] hover:bg-[#FAF7F2]'
                  }`}
                >
                  <span className={isSelected ? 'text-[#C59A62]' : ''}>{item.icon}</span>
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ml-1 ${
                        isSelected ? 'bg-[#C59A62] text-[#3A2118]' : 'bg-[#B87352] text-[#FFFDF9]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        )}

        {/* Right: Location Selector & Backend Status */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
          {/* Backend Status Indicator */}
          <div
            title={isBackendConnected ? 'Connected to Fastify API' : 'Using Kolkata Live Mock Fallback'}
            className={`flex items-center space-x-1 px-2 sm:px-2.5 py-1.5 rounded-full text-xs border ${
              isBackendConnected
                ? 'bg-[#FFFDF9] border-[#C59A62] text-[#5A3426]'
                : 'bg-[#FFFDF9] border-[#E9DED2] text-[#7A665B]'
            }`}
          >
            {isBackendConnected ? (
              <Wifi className="w-3.5 h-3.5 text-[#B87352]" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-[#7A665B]" />
            )}
            <span className="text-[10px] font-semibold hidden md:inline">
              {isBackendConnected ? 'Live API' : 'Mock'}
            </span>
          </div>

          {/* Location Picker Trigger */}
          <div className="relative">
            <button
              onClick={() => setShowLocationDropdown(!showLocationDropdown)}
              className="flex items-center space-x-1.5 min-h-[38px] px-3 py-1.5 bg-[#FFFDF9] hover:bg-[#E9DED2]/50 border border-[#E9DED2] rounded-full text-xs font-medium text-[#3A2118] shadow-warm-sm transition active:scale-95"
            >
              <MapPin className="w-3.5 h-3.5 text-[#B87352] shrink-0" />
              <span className="truncate max-w-[85px] sm:max-w-[140px] font-semibold">
                {currentLocation.name.split('/')[0]}
              </span>
              <ChevronDown className="w-3 h-3 text-[#7A665B] shrink-0" />
            </button>

            {/* Dropdown Menu */}
            {showLocationDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowLocationDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-72 bg-[#FFFDF9] rounded-2xl shadow-warm-lg border border-[#E9DED2] p-2 z-50 animate-fadeIn">
                  <div className="px-3 py-2 border-b border-[#E9DED2]">
                    <p className="text-xs font-bold text-[#3A2118]">Puja Hub Location</p>
                    <p className="text-[11px] text-[#7A665B]">Select a Kolkata neighborhood hub</p>
                  </div>

                  <div className="py-1 space-y-1">
                    <button
                      onClick={() => {
                        onRequestGPSLocation();
                        setShowLocationDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center space-x-2 hover:bg-[#E9DED2]/40 text-[#B87352] font-semibold min-h-[44px]"
                    >
                      <MapPin className="w-4 h-4 shrink-0" />
                      <span>Use My Live GPS Location</span>
                    </button>

                    {KOLKATA_HUBS.map((hub) => (
                      <button
                        key={hub.name}
                        onClick={() => {
                          onSelectLocation(hub);
                          setShowLocationDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between min-h-[40px] transition ${
                          currentLocation.name === hub.name
                            ? 'bg-[#E9DED2]/60 text-[#3A2118] font-bold'
                            : 'hover:bg-[#E9DED2]/30 text-[#7A665B]'
                        }`}
                      >
                        <span className="truncate">{hub.name}</span>
                        {currentLocation.name === hub.name && (
                          <Check className="w-3.5 h-3.5 text-[#B87352] shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
