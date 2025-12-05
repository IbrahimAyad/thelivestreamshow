import { useState } from 'react'
import { MorningNewsControl } from './MorningNewsControl'
import { TTSQueuePanel } from './TTSQueuePanel'
import { EpisodeInfoPanel } from './EpisodeInfoPanel'
import { Layout, MessageSquare, Newspaper, Info } from 'lucide-react'

export function MorningShowDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'news' | 'chat'>('overview')

  return (
    <div className="bg-gray-900 border-2 border-cyan-900/50 rounded-xl overflow-hidden shadow-2xl">
      {/* Dashboard Header */}
      <div className="bg-gradient-to-r from-cyan-900/80 to-blue-900/80 p-6 border-b border-cyan-700/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-500/20 rounded-lg border border-cyan-400/30">
              <Layout className="w-8 h-8 text-cyan-300" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-wide">Morning Show Dashboard</h2>
              <p className="text-cyan-200/70 text-sm">Unified Command Center</p>
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex bg-gray-900/50 p-1 rounded-lg border border-gray-700/50">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'overview' 
                  ? 'bg-cyan-600 text-white shadow-lg' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Info className="w-4 h-4" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('news')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'news' 
                  ? 'bg-cyan-600 text-white shadow-lg' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Newspaper className="w-4 h-4" />
              News Feed
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'chat' 
                  ? 'bg-cyan-600 text-white shadow-lg' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Ultra Chat
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6 bg-gray-900/95 min-h-[600px]">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="lg:col-span-2">
              <EpisodeInfoPanel />
            </div>
            <div className="h-full">
              <TTSQueuePanel />
            </div>
            <div className="h-full">
              <MorningNewsControl />
            </div>
          </div>
        )}

        {activeTab === 'news' && (
          <div className="h-full">
            <MorningNewsControl />
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="h-full">
            <TTSQueuePanel />
          </div>
        )}
      </div>
    </div>
  )
}
