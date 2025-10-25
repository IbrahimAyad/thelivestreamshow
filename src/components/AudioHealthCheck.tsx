import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface HealthStatus {
  backend: boolean;
  piperTTS: boolean;
  loopback: boolean;
  scarlett: boolean;
}

interface StatusIndicatorProps {
  label: string;
  status: boolean;
  loading?: boolean;
}

function StatusIndicator({ label, status, loading }: StatusIndicatorProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800/50">
      {loading ? (
        <AlertCircle className="w-4 h-4 text-yellow-400 animate-pulse" />
      ) : status ? (
        <CheckCircle className="w-4 h-4 text-green-400" />
      ) : (
        <XCircle className="w-4 h-4 text-red-400" />
      )}
      <span className={`text-sm font-medium ${
        status ? 'text-green-300' : 'text-red-300'
      }`}>
        {label}
      </span>
    </div>
  );
}

export function AudioHealthCheck() {
  const [status, setStatus] = useState<HealthStatus>({
    backend: false,
    piperTTS: false,
    loopback: false,
    scarlett: false
  });
  const [loading, setLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkHealth = async () => {
    setLoading(true);
    
    try {
      // Check backend server
      const backendHealth = await fetch('http://localhost:3001/api/health')
        .then(r => r.ok)
        .catch(() => false);
      
      // Check Piper TTS
      const piperHealth = await fetch('http://localhost:8000/health')
        .then(r => r.ok)
        .catch(() => false);
      
      // Get audio device info from backend
      let audioInfo = { loopbackActive: false, scarlettConnected: false };
      if (backendHealth) {
        try {
          const response = await fetch('http://localhost:3001/api/health');
          const data = await response.json();
          audioInfo = {
            loopbackActive: data.status === 'healthy',
            scarlettConnected: data.scarlett || false
          };
        } catch (error) {
          console.error('Failed to get audio info:', error);
        }
      }
      
      setStatus({
        backend: backendHealth,
        piperTTS: piperHealth,
        loopback: audioInfo.loopbackActive,
        scarlett: audioInfo.scarlettConnected
      });
      
      setLastCheck(new Date());
    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const allHealthy = status.backend && status.piperTTS && status.loopback && status.scarlett;

  return (
    <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-200">System Health</h3>
        <div className="flex items-center gap-2">
          {allHealthy ? (
            <span className="text-xs text-green-400 font-medium">All Systems Operational</span>
          ) : (
            <span className="text-xs text-red-400 font-medium">Issues Detected</span>
          )}
          {lastCheck && (
            <span className="text-xs text-gray-500">
              {lastCheck.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <StatusIndicator 
          label="Backend Server" 
          status={status.backend} 
          loading={loading}
        />
        <StatusIndicator 
          label="Piper TTS" 
          status={status.piperTTS} 
          loading={loading}
        />
        <StatusIndicator 
          label="Audio Output" 
          status={status.loopback} 
          loading={loading}
        />
        <StatusIndicator 
          label="Scarlett Solo" 
          status={status.scarlett} 
          loading={loading}
        />
      </div>
      
      {!allHealthy && (
        <div className="mt-3 p-2 bg-yellow-900/20 border border-yellow-700/50 rounded text-xs text-yellow-300">
          <p className="font-medium mb-1">⚠️ Troubleshooting Tips:</p>
          {!status.backend && <p>• Start backend: cd backend && node server.js</p>}
          {!status.piperTTS && <p>• Start Piper TTS: docker-compose -f docker-compose.piper.yml up -d</p>}
          {!status.loopback && <p>• Check system output is set to "Loopback Audio"</p>}
          {!status.scarlett && <p>• Check Scarlett Solo USB connection</p>}
        </div>
      )}
    </div>
  );
}
