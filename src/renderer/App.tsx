import { Routes, Route } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import SearchPage from './components/search/SearchPage';
import PlayerProfilePage from './components/profile/PlayerProfilePage';
import CareerStatsPage from './components/career/CareerStatsPage';
import HeroDetailPage from './components/heroes/HeroDetailPage';
import HeroComparisonPage from './components/heroes/HeroComparisonPage';
import HeroEncyclopediaPage from './components/heroes/HeroEncyclopediaPage';
import HeroMetaPage from './components/heroes/HeroMetaPage';
import PlayerComparisonPage from './components/compare/PlayerComparisonPage';
import ProgressTrackingPage from './components/progress/ProgressTrackingPage';
import SessionTrackerPage from './components/progress/SessionTrackerPage';
import MapGalleryPage from './components/explore/MapGalleryPage';
import GamemodesPage from './components/explore/GamemodesPage';
import AboutPage from './components/about/AboutPage';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 pb-8">
        <Routes>
          <Route path="/" element={<SearchPage />} />
          <Route path="/player/:playerId" element={<PlayerProfilePage />} />
          <Route path="/player/:playerId/career/:heroKey?" element={<CareerStatsPage />} />
          <Route path="/player/:playerId/hero/:heroKey" element={<HeroDetailPage />} />
          <Route path="/player/:playerId/hero-comparison" element={<HeroComparisonPage />} />
          <Route path="/player/:playerId/progress" element={<ProgressTrackingPage />} />
          <Route path="/player/:playerId/session" element={<SessionTrackerPage />} />
          <Route path="/compare" element={<PlayerComparisonPage />} />
          <Route path="/heroes" element={<HeroEncyclopediaPage />} />
          <Route path="/heroes/:heroKey" element={<HeroEncyclopediaPage />} />
          <Route path="/meta" element={<HeroMetaPage />} />
          <Route path="/maps" element={<MapGalleryPage />} />
          <Route path="/gamemodes" element={<GamemodesPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
