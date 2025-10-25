import { useState } from 'react'
import { Radio } from 'lucide-react'

// Simple test to verify tab switching works
function AppSimplified() {
  const [activeTab, setActiveTab] = useState('dashboard')

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', color: '#2563eb' },
    { id: 'live', label: 'Live Control', color: '#dc2626' },
    { id: 'production', label: 'Production', color: '#ca8a04' },
    { id: 'scenes', label: 'Scenes', color: '#2563eb' },
    { id: 'graphics', label: 'Graphics', color: '#db2777' },
    { id: 'audio', label: 'Audio', color: '#16a34a' },
  ]

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      <header className="bg-[#0a0a0a] border-b border-[#3a3a3a] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 p-2 rounded">
              <Radio className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Live Stream Dashboard - Simplified</h1>
              <p className="text-sm text-gray-400">Testing Tab Navigation</p>
            </div>
          </div>
          <div className="flex gap-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  alert(`Clicked: ${tab.id}. Current: ${activeTab}`)
                  console.log('Clicking tab:', tab.id)
                  setActiveTab(tab.id)
                  console.log('After setState, activeTab should be:', tab.id)
                }}
                className="px-4 py-2 rounded font-semibold transition-all"
                style={{
                  backgroundColor: activeTab === tab.id ? tab.color : '#2a2a2a',
                  color: '#fff'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="p-6">
        {activeTab === 'dashboard' && (
          <div className="bg-[#2a2a2a] p-8 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
            <p>This is the dashboard content. Tab switching is WORKING!</p>
            <p className="mt-4 text-gray-400">Current tab: {activeTab}</p>
          </div>
        )}

        {activeTab === 'live' && (
          <div className="bg-[#2a2a2a] p-8 rounded-lg">
            <h2 className="text-2xl font-bold mb-4 text-red-400">Live Control</h2>
            <p>Live control interface would go here.</p>
            <p className="mt-4 text-gray-400">Current tab: {activeTab}</p>
          </div>
        )}

        {activeTab === 'production' && (
          <div className="bg-[#2a2a2a] p-8 rounded-lg">
            <h2 className="text-2xl font-bold mb-4 text-yellow-400">Production</h2>
            <p>Show management, episodes, YouTube queue would go here.</p>
            <p className="mt-4 text-gray-400">Current tab: {activeTab}</p>
          </div>
        )}

        {activeTab === 'scenes' && (
          <div className="bg-[#2a2a2a] p-8 rounded-lg">
            <h2 className="text-2xl font-bold mb-4 text-blue-400">Scenes</h2>
            <p>Scene management would go here.</p>
            <p className="mt-4 text-gray-400">Current tab: {activeTab}</p>
          </div>
        )}

        {activeTab === 'graphics' && (
          <div className="bg-[#2a2a2a] p-8 rounded-lg">
            <h2 className="text-2xl font-bold mb-4 text-pink-400">Graphics</h2>
            <p>Graphics and lower thirds would go here.</p>
            <p className="mt-4 text-gray-400">Current tab: {activeTab}</p>
          </div>
        )}

        {activeTab === 'audio' && (
          <div className="bg-[#2a2a2a] p-8 rounded-lg">
            <h2 className="text-2xl font-bold mb-4 text-green-400">Audio</h2>
            <p>Audio mixer would go here.</p>
            <p className="mt-4 text-gray-400">Current tab: {activeTab}</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default AppSimplified
