import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Camera, Eye, EyeOff, FlipHorizontal } from 'lucide-react'

interface BroadcastCamera {
  id: string
  position: string
  camera_device_id: string | null
  is_active: boolean
  is_mirrored: boolean
  label: string | null
}

interface MediaDeviceInfo {
  deviceId: string
  label: string
}

export const CamerasPanel = () => {
  const [cameras, setCameras] = useState<BroadcastCamera[]>([])
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([])
  const [permissionGranted, setPermissionGranted] = useState(false)

  useEffect(() => {
    loadCameras()
    requestCameraPermission()

    const channel = supabase
      .channel('cameras_panel_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'broadcast_cameras'
      }, () => {
        loadCameras()
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  const requestCameraPermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      setPermissionGranted(true)
      loadAvailableDevices()
    } catch (err) {
      console.error('Camera permission denied:', err)
    }
  }

  const loadAvailableDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices
        .filter(device => device.kind === 'videoinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${device.deviceId.substr(0, 8)}`
        }))
      setAvailableDevices(videoDevices)
    } catch (err) {
      console.error('Failed to enumerate devices:', err)
    }
  }

  const loadCameras = async () => {
    const { data } = await supabase
      .from('broadcast_cameras')
      .select('*')
      .order('position')
    
    if (data) setCameras(data as BroadcastCamera[])
  }

  const updateCamera = async (cameraId: string, updates: Partial<BroadcastCamera>) => {
    await supabase
      .from('broadcast_cameras')
      .update(updates)
      .eq('id', cameraId)
  }

  const toggleActive = async (camera: BroadcastCamera) => {
    await updateCamera(camera.id, { is_active: !camera.is_active })
  }

  const toggleMirror = async (camera: BroadcastCamera) => {
    await updateCamera(camera.id, { is_mirrored: !camera.is_mirrored })
  }

  const assignDevice = async (camera: BroadcastCamera, deviceId: string) => {
    await updateCamera(camera.id, { camera_device_id: deviceId })
  }

  const updateLabel = async (camera: BroadcastCamera, label: string) => {
    await updateCamera(camera.id, { label })
  }

  return (
    <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg p-4">
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Camera className="w-5 h-5 text-blue-500" />
        Camera Setup
      </h2>

      {!permissionGranted && (
        <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-500/30 rounded text-sm text-yellow-300">
          <p className="font-semibold mb-1">⚠️ Camera Permission Required</p>
          <p>Please grant camera access to use this feature.</p>
          <button
            onClick={requestCameraPermission}
            className="mt-2 bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded text-sm"
          >
            Grant Permission
          </button>
        </div>
      )}

      <div className="space-y-3">
        {cameras.map(camera => (
          <div
            key={camera.id}
            className={`p-3 rounded-lg border ${
              camera.is_active
                ? 'bg-blue-900/20 border-blue-500/30'
                : 'bg-[#1a1a1a] border-[#3a3a3a]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Camera className={`w-4 h-4 ${camera.is_active ? 'text-blue-400' : 'text-gray-500'}`} />
                <input
                  type="text"
                  value={camera.label || ''}
                  onChange={(e) => updateLabel(camera, e.target.value)}
                  placeholder={`Camera ${camera.position.split('_')[1]}`}
                  className="bg-transparent text-white text-sm font-semibold border-none outline-none focus:underline"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleMirror(camera)}
                  className={`p-1.5 rounded transition-colors ${
                    camera.is_mirrored
                      ? 'bg-purple-600 text-white'
                      : 'bg-[#333] text-gray-400 hover:bg-[#444]'
                  }`}
                  title="Mirror/Flip"
                >
                  <FlipHorizontal className="w-4 h-4" />
                </button>
                <button
                  onClick={() => toggleActive(camera)}
                  className={`p-1.5 rounded transition-colors ${
                    camera.is_active
                      ? 'bg-green-600 text-white'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                  title={camera.is_active ? 'Turn Off' : 'Turn On'}
                >
                  {camera.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <select
              value={camera.camera_device_id || ''}
              onChange={(e) => assignDevice(camera, e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              disabled={!permissionGranted}
            >
              <option value="">Select Camera Device...</option>
              {availableDevices.map(device => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label}
                </option>
              ))}
            </select>

            <div className="mt-2 text-xs text-gray-500">
              Position: {camera.position.replace('_', ' ').toUpperCase()}
              {camera.is_active && <span className="text-green-400 ml-2">• Active</span>}
              {camera.is_mirrored && <span className="text-purple-400 ml-2">• Mirrored</span>}
            </div>
          </div>
        ))}
      </div>

      {availableDevices.length > 0 && (
        <div className="mt-4 p-3 bg-blue-900/30 border border-blue-500/30 rounded text-sm text-blue-300">
          <span className="font-semibold">✅ {availableDevices.length} camera(s) detected</span>
        </div>
      )}
    </div>
  )
}
