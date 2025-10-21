import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { StreamStatsHistory } from '@/hooks/media/useStreamStats';

// Type assertions for recharts components to fix TypeScript JSX issues
const LineChartComponent = LineChart as any;
const LineComponent = Line as any;
const XAxisComponent = XAxis as any;
const YAxisComponent = YAxis as any;
const CartesianGridComponent = CartesianGrid as any;
const TooltipComponent = Tooltip as any;
const LegendComponent = Legend as any;
const ResponsiveContainerComponent = ResponsiveContainer as any;

type TimeRange = 'hour' | 'day' | 'stream';

interface StreamHistoryChartProps {
  history: StreamStatsHistory[];
  onTimeRangeChange: (range: TimeRange) => void;
}

export function StreamHistoryChart({ history, onTimeRangeChange }: StreamHistoryChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('hour');
  const [showTwitch, setShowTwitch] = useState(true);
  const [showYoutube, setShowYoutube] = useState(true);

  useEffect(() => {
    onTimeRangeChange(timeRange);
  }, [timeRange, onTimeRangeChange]);

  // Process data for the chart
  const chartData = history.reduce((acc: any[], stat) => {
    const time = new Date(stat.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const existingEntry = acc.find(entry => entry.time === time);
    
    if (existingEntry) {
      if (stat.platform === 'twitch') {
        existingEntry.twitch = stat.viewer_count;
      } else {
        existingEntry.youtube = stat.viewer_count;
      }
    } else {
      acc.push({
        time,
        twitch: stat.platform === 'twitch' ? stat.viewer_count : 0,
        youtube: stat.platform === 'youtube' ? stat.viewer_count : 0,
      });
    }
    
    return acc;
  }, []);

  return (
    <div className="bg-neutral-900 rounded-lg p-4 border border-neutral-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">Stream History</h2>
        
        <div className="flex items-center gap-3">
          {/* Platform Toggles */}
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showTwitch}
                onChange={(e) => setShowTwitch(e.target.checked)}
                className="w-4 h-4 rounded border-neutral-600 text-[#9146FF] focus:ring-[#9146FF]"
              />
              <span className="text-xs font-medium text-[#9146FF]">Twitch</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showYoutube}
                onChange={(e) => setShowYoutube(e.target.checked)}
                className="w-4 h-4 rounded border-neutral-600 text-[#FF0000] focus:ring-[#FF0000]"
              />
              <span className="text-xs font-medium text-[#FF0000]">YouTube</span>
            </label>
          </div>

          {/* Time Range Toggle */}
          <div className="flex bg-neutral-800 rounded-md p-0.5">
            <button
              onClick={() => setTimeRange('hour')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                timeRange === 'hour'
                  ? 'bg-primary-600 text-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Last Hour
            </button>
            <button
              onClick={() => setTimeRange('day')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                timeRange === 'day'
                  ? 'bg-primary-600 text-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Last 24h
            </button>
            <button
              onClick={() => setTimeRange('stream')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                timeRange === 'stream'
                  ? 'bg-primary-600 text-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Last Stream
            </button>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-black rounded-lg p-4">
        <ResponsiveContainerComponent width="100%" height={240}>
          <LineChartComponent data={chartData}>
            <CartesianGridComponent strokeDasharray="3 3" stroke="#2A2A2A" opacity={0.2} />
            <XAxisComponent
              dataKey="time"
              stroke="#6B7280"
              style={{ fontSize: '11px', fontFamily: 'monospace' }}
            />
            <YAxisComponent
              stroke="#6B7280"
              style={{ fontSize: '11px', fontFamily: 'monospace' }}
            />
            <TooltipComponent
              contentStyle={{
                backgroundColor: '#1A1A1A',
                border: '1px solid #2A2A2A',
                borderRadius: '8px',
                fontSize: '12px'
              }}
            />
            <LegendComponent
              wrapperStyle={{ fontSize: '12px' }}
            />
            {showTwitch && (
              <LineComponent
                type="monotone"
                dataKey="twitch"
                stroke="#9146FF"
                strokeWidth={2}
                dot={false}
                name="Twitch"
              />
            )}
            {showYoutube && (
              <LineComponent
                type="monotone"
                dataKey="youtube"
                stroke="#FF0000"
                strokeWidth={2}
                dot={false}
                name="YouTube"
              />
            )}
          </LineChartComponent>
        </ResponsiveContainerComponent>
      </div>

      {chartData.length === 0 && (
        <div className="text-center py-12 text-neutral-500">
          <p className="text-sm">No stream data available for this time range</p>
        </div>
      )}
    </div>
  );
}
