import { useEffect, useState } from 'react';
import './ScarlettLEDMeter.css';

interface ScarlettLEDMeterProps {
  level: number; // 0-100
  peakDb: number;
  label?: string;
}

export function ScarlettLEDMeter({ level, peakDb, label = 'Input Level' }: ScarlettLEDMeterProps) {
  const [segments, setSegments] = useState<Array<{ color: string; active: boolean }>>([]);

  useEffect(() => {
    // Create 12 LED segments (8 green, 2 yellow, 2 red) - like Scarlett Solo
    const activeCount = Math.floor((level / 100) * 12);

    const newSegments = Array.from({ length: 12 }, (_, i) => {
      let color: string;
      if (i < 8) color = 'green';
      else if (i < 10) color = 'yellow';
      else color = 'red';

      return {
        color,
        active: i < activeCount
      };
    });

    setSegments(newSegments);
  }, [level]);

  const getPeakColor = () => {
    if (peakDb > -3) return '#ef4444'; // Red
    if (peakDb > -10) return '#f59e0b'; // Yellow
    return '#10b981'; // Green
  };

  const formatDb = (db: number) => {
    if (db === -Infinity || !isFinite(db)) return '-∞ dB';
    return `${db.toFixed(1)} dB`;
  };

  return (
    <div className="scarlett-led-meter">
      <div className="meter-label">
        <span>{label}</span>
        <span className="meter-peak" style={{ color: getPeakColor() }}>
          {formatDb(peakDb)}
        </span>
      </div>
      <div className="led-meter">
        {segments.map((segment, index) => (
          <div
            key={index}
            className={`led-segment ${segment.active ? 'active' : ''} ${segment.color}`}
            data-color={segment.color}
          />
        ))}
      </div>
    </div>
  );
}
