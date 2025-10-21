import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { VideoPlayerControl } from './pages/VideoPlayerControl';
import { BroadcastView } from './pages/BroadcastView';
import { Monitor, Tv } from 'lucide-react';

function HomePage() {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      <div className="max-w-2xl w-full p-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-neutral-900 mb-2">YouTube Video Player</h1>
          <p className="text-lg text-neutral-600">Smart video queue management for live streams</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            to="/video-player"
            className="bg-white border-2 border-neutral-300 hover:border-primary-500 rounded-lg p-8 text-center transition-all duration-250 hover:shadow-card-hover hover:-translate-y-1 group"
          >
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-500 transition-colors">
              <Monitor className="w-8 h-8 text-primary-600 group-hover:text-white" />
            </div>
            <h2 className="text-xl font-bold text-neutral-900 mb-2">Control Dashboard</h2>
            <p className="text-neutral-600">Search, queue, and manage videos</p>
          </Link>

          <Link
            to="/broadcast/video-player"
            className="bg-white border-2 border-neutral-300 hover:border-primary-500 rounded-lg p-8 text-center transition-all duration-250 hover:shadow-card-hover hover:-translate-y-1 group"
          >
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-500 transition-colors">
              <Tv className="w-8 h-8 text-primary-600 group-hover:text-white" />
            </div>
            <h2 className="text-xl font-bold text-neutral-900 mb-2">Broadcast View</h2>
            <p className="text-neutral-600">OBS full-screen player</p>
          </Link>
        </div>

        <div className="mt-8 p-6 bg-white rounded-lg border border-neutral-300">
          <h3 className="font-semibold text-neutral-900 mb-3">Quick Start:</h3>
          <ol className="list-decimal list-inside space-y-2 text-neutral-700">
            <li>Use the Control Dashboard to search and queue YouTube videos</li>
            <li>Adjust start/end times to clip videos</li>
            <li>Add the Broadcast View as a browser source in OBS (1920x1080)</li>
            <li>Control playback from the dashboard</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/video-player" element={<VideoPlayerControl />} />
        <Route path="/broadcast/video-player" element={<BroadcastView />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
