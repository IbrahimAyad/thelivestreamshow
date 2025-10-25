import { useState, useEffect } from 'react'
import { Activity, Cpu, HardDrive, Wifi } from 'lucide-react'

export function ResourceMonitor() {
  const [cpuUsage, setCpuUsage] = useState(0)
  const [memoryUsage, setMemoryUsage] = useState(0)
  const [networkSpeed, setNetworkSpeed] = useState(0)
  const [fps, setFps] = useState(60)
  const [cpuHistory, setCpuHistory] = useState<number[]>(Array(20).fill(0))

  useEffect(() => {
    const interval = setInterval(() => {
      const newCpu = Math.random() * 100
      const newMemory = 40 + Math.random() * 30
      const newNetwork = Math.random() * 10
      const newFps = 55 + Math.random() * 10

      setCpuUsage(newCpu)
      setMemoryUsage(newMemory)
      setNetworkSpeed(newNetwork)
      setFps(newFps)

      setCpuHistory(prev => [...prev.slice(1), newCpu])
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (value: number, threshold: number) => {
    if (value > threshold * 0.9) return 'text-red-500'
    if (value > threshold * 0.7) return 'text-yellow-500'
    return 'text-green-500'
  }

  return (
    <div className="bg-[#2a2a2a] rounded-lg p-6 border border-[#3a3a3a]">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Activity className="w-6 h-6 text-blue-500" />
        System Resource Monitor
      </h2>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#3a3a3a]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-blue-500" />
              <span className="font-semibold">CPU Usage</span>
            </div>
            <span className={`text-2xl font-bold ${getStatusColor(cpuUsage, 100)}`}>
              {cpuUsage.toFixed(1)}%
            </span>
          </div>
          <div className="h-2 bg-[#0a0a0a] rounded overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
              style={{ width: `${cpuUsage}%` }}
            />
          </div>
          <div className="mt-3 h-16 bg-[#0a0a0a] rounded relative">
            <svg className="w-full h-full" viewBox="0 0 200 64" preserveAspectRatio="none">
              <polyline
                points={cpuHistory.map((value, i) => `${i * 10},${64 - (value / 100) * 64}`).join(' ')}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
              />
            </svg>
          </div>
        </div>

        <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#3a3a3a]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-green-500" />
              <span className="font-semibold">Memory Usage</span>
            </div>
            <span className={`text-2xl font-bold ${getStatusColor(memoryUsage, 100)}`}>
              {memoryUsage.toFixed(1)}%
            </span>
          </div>
          <div className="h-2 bg-[#0a0a0a] rounded overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all"
              style={{ width: `${memoryUsage}%` }}
            />
          </div>
          <div className="mt-3 text-sm text-gray-400">
            <div className="flex justify-between">
              <span>Used: {(memoryUsage * 0.16).toFixed(1)} GB</span>
              <span>Total: 16 GB</span>
            </div>
          </div>
        </div>

        <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#3a3a3a]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Wifi className="w-5 h-5 text-purple-500" />
              <span className="font-semibold">Network</span>
            </div>
            <span className="text-2xl font-bold text-purple-500">
              {networkSpeed.toFixed(1)} Mbps
            </span>
          </div>
          <div className="text-xs text-gray-400 mt-2">
            <div className="flex justify-between">
              <span>Upload: {(networkSpeed * 0.3).toFixed(1)} Mbps</span>
              <span>Download: {networkSpeed.toFixed(1)} Mbps</span>
            </div>
          </div>
        </div>

        <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#3a3a3a]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold">Frame Rate</span>
            </div>
            <span className={`text-2xl font-bold ${getStatusColor(100 - fps, 40)}`}>
              {fps.toFixed(0)} FPS
            </span>
          </div>
          <div className="text-xs text-gray-400 mt-2">
            Target: 60 FPS
          </div>
        </div>
      </div>

      {(cpuUsage > 80 || memoryUsage > 80) && (
        <div className="p-4 bg-red-900/30 border border-red-500/50 rounded flex items-start gap-3">
          <Activity className="w-5 h-5 text-red-500 mt-0.5" />
          <div>
            <div className="font-bold text-red-400">High Resource Usage Warning</div>
            <div className="text-sm text-gray-300 mt-1">
              System resources are running high. Consider reducing quality settings or closing unnecessary applications.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
