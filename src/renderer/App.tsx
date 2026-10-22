import { Routes, Route } from 'react-router-dom';
import TitleBar from './components/layout/TitleBar';
import Sidebar from './components/layout/Sidebar';
import StatusBar from './components/layout/StatusBar';
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
import FeedbackTipPage from './components/feedback/FeedbackTipPage';

/**
 * Desktop shell: a fixed title bar, a persistent sidebar, a status strip,
 * and exactly one scrolling region in the middle.
 *
 * The window never scrolls as a whole — that is the difference between an
 * app and a page in a frame.
 */
export default function App() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-ow-dark">
      <TitleBar />

      <div className="flex min-h-0 flex-1">
        <Sidebar />

        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="px-6 py-5">
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
              <Route path="/feedback" element={<FeedbackTipPage />} />
            </Routes>
          </div>
        </main>
      </div>

      <StatusBar />
    </div>
  );
}
