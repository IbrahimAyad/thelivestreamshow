import { useEffect, useRef, useState } from 'react'
import YouTube from 'react-youtube'

interface CameraFeedProps {
  position: string
  deviceId?: string
  label?: string
  isMirrored?: boolean
  isActive?: boolean
}

export const CameraFeed = ({ position, deviceId, label, isMirrored = false, isActive = true }: CameraFeedProps) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isActive || !deviceId) return

    const setupCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: deviceId ? { deviceId: { exact: deviceId } } : true,
          audio: true
        })
        setStream(mediaStream)
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
        }
      } catch (err) {
        console.error('Camera access error:', err)
        setError('Camera not available')
      }
    }

    setupCamera()

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [deviceId, isActive])

  if (!isActive) {
    return (
      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
        <p className="text-gray-500">Camera Off</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover ${isMirrored ? 'scale-x-[-1]' : ''}`}
      />
      {label && (
        <div className="absolute bottom-2 left-2 bg-black/70 px-3 py-1 rounded text-white text-sm font-semibold">
          {label}
        </div>
      )}
    </div>
  )
}

interface SceneLayoutProps {
  videoId?: string
  cameras: any[]
  config?: any
}

export const FullScreenVideoLayout = ({ videoId }: SceneLayoutProps) => (
  <div className="w-full h-full bg-black">
    {videoId ? (
      <YouTube
        videoId={videoId}
        opts={{
          width: '100%',
          height: '100%',
          playerVars: {
            autoplay: 1,
            controls: 0,
            modestbranding: 1,
            rel: 0
          }
        }}
        className="w-full h-full"
      />
    ) : (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 text-6xl mb-4">📺</div>
          <p className="text-gray-500 text-2xl">No video playing</p>
        </div>
      </div>
    )}
  </div>
)

export const PipLayout = ({ videoId, cameras, config }: SceneLayoutProps) => {
  const activeCamera = cameras.find(c => c.position === 'position_1' && c.is_active)
  const cameraPosition = config?.camera_position || 'bottom_right'
  
  const positionClasses: Record<string, string> = {
    'bottom_right': 'bottom-4 right-4',
    'bottom_left': 'bottom-4 left-4',
    'top_right': 'top-4 right-4',
    'top_left': 'top-4 left-4'
  }

  return (
    <div className="w-full h-full relative bg-black">
      {/* Main video */}
      <div className="w-full h-full">
        {videoId ? (
          <YouTube
            videoId={videoId}
            opts={{
              width: '100%',
              height: '100%',
              playerVars: {
                autoplay: 1,
                controls: 0,
                modestbranding: 1,
                rel: 0
              }
            }}
            className="w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-gray-500 text-2xl">No video playing</p>
          </div>
        )}
      </div>
      
      {/* Camera overlay */}
      {activeCamera && (
        <div className={`absolute ${positionClasses[cameraPosition]} w-[25%] aspect-video rounded-lg overflow-hidden border-2 border-white/20 shadow-2xl`}>
          <CameraFeed
            position={activeCamera.position}
            deviceId={activeCamera.camera_device_id}
            label={activeCamera.label}
            isMirrored={activeCamera.is_mirrored}
            isActive={activeCamera.is_active}
          />
        </div>
      )}
    </div>
  )
}

export const SplitScreenLayout = ({ cameras }: SceneLayoutProps) => {
  const cam1 = cameras.find(c => c.position === 'position_1')
  const cam2 = cameras.find(c => c.position === 'position_2')

  return (
    <div className="w-full h-full flex gap-2 bg-black p-2">
      <div className="flex-1 rounded-lg overflow-hidden">
        {cam1 ? (
          <CameraFeed
            position={cam1.position}
            deviceId={cam1.camera_device_id}
            label={cam1.label}
            isMirrored={cam1.is_mirrored}
            isActive={cam1.is_active}
          />
        ) : (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
            <p className="text-gray-500">No Camera 1</p>
          </div>
        )}
      </div>
      <div className="flex-1 rounded-lg overflow-hidden">
        {cam2 ? (
          <CameraFeed
            position={cam2.position}
            deviceId={cam2.camera_device_id}
            label={cam2.label}
            isMirrored={cam2.is_mirrored}
            isActive={cam2.is_active}
          />
        ) : (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
            <p className="text-gray-500">No Camera 2</p>
          </div>
        )}
      </div>
    </div>
  )
}

export const PanelGridLayout = ({ cameras }: SceneLayoutProps) => {
  const positions = ['position_1', 'position_2', 'position_3', 'position_4']
  const activeCameras = positions.map(pos => cameras.find(c => c.position === pos))

  return (
    <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-2 bg-black p-2">
      {activeCameras.map((cam, idx) => (
        <div key={idx} className="rounded-lg overflow-hidden">
          {cam ? (
            <CameraFeed
              position={cam.position}
              deviceId={cam.camera_device_id}
              label={cam.label}
              isMirrored={cam.is_mirrored}
              isActive={cam.is_active}
            />
          ) : (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
              <p className="text-gray-500">No Camera {idx + 1}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export const InterviewLayout = ({ cameras }: SceneLayoutProps) => (
  <SplitScreenLayout cameras={cameras} />
)

export const ReactionViewLayout = ({ videoId, cameras }: SceneLayoutProps) => {
  const activeCamera = cameras.find(c => c.position === 'position_1' && c.is_active)

  return (
    <div className="w-full h-full flex flex-col bg-black">
      {/* Video on top (70%) */}
      <div className="flex-[7] w-full">
        {videoId ? (
          <YouTube
            videoId={videoId}
            opts={{
              width: '100%',
              height: '100%',
              playerVars: {
                autoplay: 1,
                controls: 0,
                modestbranding: 1,
                rel: 0
              }
            }}
            className="w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-gray-500 text-2xl">No video playing</p>
          </div>
        )}
      </div>
      
      {/* Camera on bottom (30%) */}
      <div className="flex-[3] w-full border-t-2 border-white/20">
        {activeCamera ? (
          <CameraFeed
            position={activeCamera.position}
            deviceId={activeCamera.camera_device_id}
            label={activeCamera.label}
            isMirrored={activeCamera.is_mirrored}
            isActive={activeCamera.is_active}
          />
        ) : (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
            <p className="text-gray-500">No camera configured</p>
          </div>
        )}
      </div>
    </div>
  )
}

export const IntermissionLayout = ({ config }: SceneLayoutProps) => (
  <div className="w-full h-full bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900 flex flex-col items-center justify-center">
    <div className="text-center space-y-8">
      {config?.show_logo && (
        <div className="text-9xl mb-8">📺</div>
      )}
      <h1 className="text-7xl font-bold text-white drop-shadow-2xl">
        {config?.message || 'Be Right Back'}
      </h1>
      <div className="flex items-center gap-4 justify-center mt-8">
        <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
        <div className="w-3 h-3 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
        <div className="w-3 h-3 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
      </div>
    </div>
  </div>
)
