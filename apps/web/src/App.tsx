import React, { useState, useEffect, useCallback } from 'react';
import { Pandal, PandalRecommendation, RecommendationMode } from '@pujofy/types';
import {
  checkBackendHealth,
  fetchNearbyPandals,
  fetchRecommendations,
} from './services/api';
import { useLocation } from './hooks/useLocation';
import { Header } from './components/Header';
import { ModeSelector } from './components/ModeSelector';
import { HeroRecommendationCard } from './components/HeroRecommendationCard';
import { PandalCard } from './components/PandalCard';
import { MapView } from './components/MapView';
import { SearchFilterScreen } from './components/SearchFilterScreen';
import { TonightTripScreen, TripStop } from './components/TonightTripScreen';
import { SavedPandalsScreen } from './components/SavedPandalsScreen';
import { PandalDetailModal } from './components/PandalDetailModal';
import { CrowdReportModal } from './components/CrowdReportModal';
import { Navbar, TabType } from './components/Navbar';
import { HeroSkeleton, CardSkeleton } from './components/SkeletonLoader';
import { LocationFallbackBanner } from './components/LocationFallbackBanner';
import { Sparkles, MapPin, RefreshCw, AlertTriangle } from 'lucide-react';

export const App: React.FC = () => {
  // Navigation & View State
  const [activeTab, setActiveTab] = useState<TabType>('HOME');

  // Robust Geolocation Hook
  const {
    location,
    isGPSActive,
    error: locationError,
    requestGPS,
    setCustomLocation,
    clearError: clearLocationError,
  } = useLocation();

  // Recommendation Mode & Data
  const [mode, setMode] = useState<RecommendationMode>('BALANCED');
  const [pandals, setPandals] = useState<Pandal[]>([]);
  const [recommendations, setRecommendations] = useState<PandalRecommendation[]>([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [isMocking, setIsMocking] = useState(false);

  // Saved Pandals & Trip Progress (LocalStorage Persistence)
  const [savedIds, setSavedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('pujofy_saved');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [tripStops, setTripStops] = useState<TripStop[]>(() => {
    try {
      const stored = localStorage.getItem('pujofy_trip');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Modal States
  const [selectedPandalDetail, setSelectedPandalDetail] = useState<Pandal | null>(null);
  const [crowdReportPandalId, setCrowdReportPandalId] = useState<string | null>(null);

  // Active Route Destination State
  const [activeRouteDestination, setActiveRouteDestination] = useState<Pandal | null>(null);
  const [isRouteFromRecommendation, setIsRouteFromRecommendation] = useState<boolean>(false);

  // Load Data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    const health = await checkBackendHealth();
    setIsBackendConnected(health);

    const nearbyRes = await fetchNearbyPandals(location.lat, location.lng);
    setPandals(nearbyRes.data);

    const recRes = await fetchRecommendations(location.lat, location.lng, mode);
    setIsMocking(recRes.isMock);

    if (recRes.response.recommended) {
      const allRecs = [recRes.response.recommended, ...recRes.response.alternatives];
      setRecommendations(allRecs);
      setHeroIndex(0);

      // Refresh active route when mode / recommendation changes if "GO THERE" is active from recommendation
      if (isRouteFromRecommendation && recRes.response.recommended) {
        setActiveRouteDestination(recRes.response.recommended.pandal);
      }
    } else {
      setRecommendations([]);
    }
    setIsLoading(false);
  }, [location, mode, isRouteFromRecommendation]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Persist Saved IDs & Trip Stops
  useEffect(() => {
    localStorage.setItem('pujofy_saved', JSON.stringify(savedIds));
  }, [savedIds]);

  useEffect(() => {
    localStorage.setItem('pujofy_trip', JSON.stringify(tripStops));
  }, [tripStops]);

  // Cycle Next Recommendation ("NOT NOW")
  const handleNotNow = () => {
    if (recommendations.length > 1) {
      setHeroIndex((prev) => (prev + 1) % recommendations.length);
    }
  };

  // Toggle Save Bookmark
  const handleToggleSave = (pandalId: string) => {
    setSavedIds((prev) =>
      prev.includes(pandalId) ? prev.filter((id) => id !== pandalId) : [...prev, pandalId]
    );
  };

  // Add to Trip ("GO THERE")
  const handleGoThere = (pandal: Pandal | PandalRecommendation) => {
    const targetPandal = 'pandal' in pandal ? pandal.pandal : pandal;
    const queueMin = 'queueMinutes' in pandal ? pandal.queueMinutes : 20;

    setTripStops((prev) => {
      if (prev.some((s) => s.pandal.id === targetPandal.id)) {
        return prev;
      }
      return [...prev, { pandal: targetPandal, status: 'UPCOMING', queueMinutes: queueMin }];
    });

    setActiveRouteDestination(targetPandal);
    setIsRouteFromRecommendation('pandal' in pandal);
    setActiveTab('MAP');
  };

  // Mark Visited in Trip
  const handleMarkVisited = (pandalId: string) => {
    setTripStops((prev) =>
      prev.map((s) =>
        s.pandal.id === pandalId
          ? { ...s, status: 'VISITED', visitedAt: new Date().toISOString() }
          : s
      )
    );
  };

  // Remove Stop from Trip
  const handleRemoveStop = (pandalId: string) => {
    setTripStops((prev) => prev.filter((s) => s.pandal.id !== pandalId));
  };

  const currentHeroRec = recommendations[heroIndex] || null;

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2B1B15] flex flex-col font-sans">
      {/* Sticky Top Header */}
      <Header
        currentLocation={location}
        onSelectLocation={setCustomLocation}
        isBackendConnected={isBackendConnected}
        onRequestGPSLocation={requestGPS}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        savedCount={savedIds.length}
        tripCount={tripStops.length}
      />

      {/* Main Screen Container */}
      <main className="flex-1 w-full max-w-md sm:max-w-xl md:max-w-3xl lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1536px] mx-auto px-3.5 sm:px-6 lg:px-8 pt-3 pb-24 lg:pb-10">
        {/* Geolocation Notification Toast / Alert */}
        {locationError && (
          <div className="mb-3 p-3 bg-[#FFFDF9] border border-[#B87352] text-[#3A2118] text-xs rounded-2xl flex items-center justify-between shadow-warm-sm">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-[#B87352] shrink-0" />
              <span>{locationError}</span>
            </div>
            <button
              onClick={clearLocationError}
              className="text-xs font-bold text-[#B87352] hover:text-[#5A3426] px-2 py-0.5"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Location Fallback Info Banner */}
        <LocationFallbackBanner
          locationName={location.name}
          onRequestGPS={requestGPS}
          isGPSActive={isGPSActive}
        />

        {/* Tab 1: Home / Discovery */}
        {activeTab === 'HOME' && (
          <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-12 lg:gap-6 lg:items-start">
            {/* Left Column: Mode Selector & Hero Recommendation */}
            <div className="space-y-4 lg:col-span-5 lg:sticky lg:top-20">
              {/* Mode Selector */}
              <ModeSelector currentMode={mode} onSelectMode={setMode} />

              {/* Offline Mock Notice Banner */}
              {isMocking && (
                <div className="bg-[#FFFDF9] rounded-2xl border border-[#E9DED2] p-2.5 text-xs text-[#7A665B] flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-[#B87352]" />
                    <span>Using Kolkata Durga Puja 2026 Live Dataset</span>
                  </div>
                  <button onClick={loadData} className="p-1 hover:text-[#3A2118]">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Hero Recommendation Card */}
              {isLoading ? (
                <HeroSkeleton />
              ) : currentHeroRec ? (
                <HeroRecommendationCard
                  recommendation={currentHeroRec}
                  onGoThere={() => handleGoThere(currentHeroRec)}
                  onNotNow={handleNotNow}
                  onOpenDetail={(id) => {
                    const p = pandals.find((item) => item.id === id) || currentHeroRec.pandal;
                    setSelectedPandalDetail(p);
                  }}
                  isSaved={savedIds.includes(currentHeroRec.pandal.id)}
                  onToggleSave={handleToggleSave}
                />
              ) : (
                <div className="bg-[#FFFDF9] rounded-3xl p-6 text-center border border-[#E9DED2] space-y-2">
                  <Sparkles className="w-8 h-8 text-[#C59A62] mx-auto" />
                  <h3 className="font-serif text-lg font-bold text-[#3A2118]">
                    No Recommendations Nearby
                  </h3>
                  <p className="text-xs text-[#7A665B]">
                    Try switching your Puja hub location or adjusting your mode filter.
                  </p>
                </div>
              )}
            </div>

            {/* Right Column: Nearby Pandals List / Grid */}
            <div className="pt-2 lg:pt-0 space-y-3 lg:col-span-7">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <MapPin className="w-4 h-4 text-[#B87352]" />
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#3A2118]">
                    Nearby Pandals
                  </h3>
                </div>
                <button
                  onClick={() => setActiveTab('SEARCH')}
                  className="text-xs sm:text-sm font-semibold text-[#B87352] hover:text-[#5A3426] p-1"
                >
                  View All ({pandals.length})
                </button>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <CardSkeleton />
                  <CardSkeleton />
                  <CardSkeleton />
                  <CardSkeleton />
                </div>
              ) : pandals.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {pandals.slice(0, 8).map((pandal) => (
                    <PandalCard
                      key={pandal.id}
                      pandal={pandal}
                      onClick={() => setSelectedPandalDetail(pandal)}
                      isSaved={savedIds.includes(pandal.id)}
                      onToggleSave={handleToggleSave}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-[#FFFDF9] rounded-2xl p-6 text-center border border-[#E9DED2] text-xs text-[#7A665B]">
                  No pandals found within nearby radius.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Map View */}
        {activeTab === 'MAP' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#3A2118]">Interactive Map</h2>
              <span className="text-xs sm:text-sm text-[#7A665B] font-medium">{pandals.length} Pins</span>
            </div>
            <MapView
              pandals={pandals}
              userLocation={{ lat: location.lat, lng: location.lng }}
              recommended={currentHeroRec}
              selectedPandal={selectedPandalDetail}
              activeRouteDestination={activeRouteDestination}
              onSelectPandal={(pandal) => setSelectedPandalDetail(pandal)}
              onGoThere={handleGoThere}
              onClearRoute={() => setActiveRouteDestination(null)}
              onReCenter={requestGPS}
              locationError={locationError}
            />
          </div>
        )}

        {/* Tab 3: Search & Filter */}
        {activeTab === 'SEARCH' && (
          <SearchFilterScreen
            pandals={pandals}
            onSelectPandal={(pandal) => setSelectedPandalDetail(pandal)}
            savedIds={savedIds}
            onToggleSave={handleToggleSave}
          />
        )}

        {/* Tab 4: Tonight's Puja Trip */}
        {activeTab === 'TONIGHT' && (
          <TonightTripScreen
            tripStops={tripStops}
            onMarkVisited={handleMarkVisited}
            onRemoveStop={handleRemoveStop}
            onGoToPandal={(pandal) => setSelectedPandalDetail(pandal)}
            onClearTrip={() => setTripStops([])}
          />
        )}

        {/* Tab 5: Saved Pandals */}
        {activeTab === 'SAVED' && (
          <SavedPandalsScreen
            pandals={pandals}
            savedIds={savedIds}
            onSelectPandal={(pandal) => setSelectedPandalDetail(pandal)}
            onToggleSave={handleToggleSave}
          />
        )}
      </main>

      {/* Detail Modal */}
      <PandalDetailModal
        pandal={selectedPandalDetail}
        recommendation={selectedPandalDetail ? recommendations.find((r) => r.pandal.id === selectedPandalDetail.id) : null}
        onClose={() => setSelectedPandalDetail(null)}
        onGoThere={handleGoThere}
        isSaved={selectedPandalDetail ? savedIds.includes(selectedPandalDetail.id) : false}
        onToggleSave={handleToggleSave}
        onOpenCrowdReport={(id) => setCrowdReportPandalId(id)}
      />

      {/* Live Crowd Reporting Modal */}
      <CrowdReportModal
        pandalId={crowdReportPandalId}
        pandalName={pandals.find((p) => p.id === crowdReportPandalId)?.name}
        onClose={() => setCrowdReportPandalId(null)}
        onSubmitted={loadData}
      />

      {/* Bottom Navigation */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        savedCount={savedIds.length}
        tripCount={tripStops.length}
      />
    </div>
  );
};

export default App;
