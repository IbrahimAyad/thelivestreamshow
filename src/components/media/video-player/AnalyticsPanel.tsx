import { useState, useEffect } from 'react';
import { Download, BarChart3 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface PlayHistoryItem {
  id: string;
  video_id: string;
  title: string;
  channel: string;
  played_at: string;
  duration_watched: number;
  engagement_score: number;
  category: string;
}

export function AnalyticsPanel() {
  const [history, setHistory] = useState<PlayHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    const { data, error } = await supabase
      .from('video_play_history')
      .select('*')
      .order('played_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setHistory(data);
    }
    setLoading(false);
  };

  const exportToCSV = () => {
    const headers = ['Title', 'Channel', 'Category', 'Played At', 'Duration Watched (s)', 'Engagement Score'];
    const rows = history.map(item => [
      `"${item.title.replace(/"/g, '""')}"`,
      `"${item.channel.replace(/"/g, '""')}"`,
      item.category,
      new Date(item.played_at).toLocaleString(),
      item.duration_watched,
      item.engagement_score
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `video-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToJSON = () => {
    const json = JSON.stringify(history, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `video-analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getCategoryStats = () => {
    const stats: Record<string, number> = {};
    history.forEach(item => {
      stats[item.category] = (stats[item.category] || 0) + 1;
    });
    return stats;
  };

  const categoryStats = getCategoryStats();

  if (loading) {
    return <div className="text-center py-8 text-neutral-600">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
          <BarChart3 className="w-6 h-6" />
          Analytics
        </h2>
        <div className="flex gap-2">
          <button
            onClick={exportToCSV}
            className="px-3 py-1.5 text-sm bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-md border border-neutral-300 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={exportToJSON}
            className="px-3 py-1.5 text-sm bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-md border border-neutral-300 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export JSON
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white border border-neutral-300 rounded-lg p-4">
          <div className="text-sm text-neutral-600 mb-1">Total Videos Played</div>
          <div className="text-2xl font-bold text-neutral-900">{history.length}</div>
        </div>
        <div className="bg-white border border-neutral-300 rounded-lg p-4">
          <div className="text-sm text-neutral-600 mb-1">Avg Engagement</div>
          <div className="text-2xl font-bold text-neutral-900">
            {history.length > 0
              ? (history.reduce((sum, item) => sum + item.engagement_score, 0) / history.length).toFixed(2)
              : '0.00'}
          </div>
        </div>
        <div className="bg-white border border-neutral-300 rounded-lg p-4 col-span-2 md:col-span-1">
          <div className="text-sm text-neutral-600 mb-1">Top Category</div>
          <div className="text-2xl font-bold text-neutral-900">
            {Object.keys(categoryStats).length > 0
              ? Object.entries(categoryStats).sort(([,a], [,b]) => b - a)[0][0]
              : 'N/A'}
          </div>
        </div>
      </div>

      <div className="bg-white border border-neutral-300 rounded-lg p-4">
        <h3 className="font-semibold text-neutral-900 mb-3">Category Breakdown</h3>
        <div className="space-y-2">
          {Object.entries(categoryStats)
            .sort(([,a], [,b]) => b - a)
            .map(([category, count]) => (
              <div key={category} className="flex items-center justify-between">
                <span className="text-sm text-neutral-700">{category}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-neutral-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 rounded-full h-2"
                      style={{ width: `${(count / history.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-neutral-900 w-12 text-right">{count}</span>
                </div>
              </div>
            ))}
        </div>
      </div>

      <div className="bg-white border border-neutral-300 rounded-lg p-4">
        <h3 className="font-semibold text-neutral-900 mb-3">Recent Play History</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-300">
              <tr className="text-left">
                <th className="py-2 px-2 font-medium text-neutral-700">Title</th>
                <th className="py-2 px-2 font-medium text-neutral-700">Category</th>
                <th className="py-2 px-2 font-medium text-neutral-700">Played At</th>
                <th className="py-2 px-2 font-medium text-neutral-700">Engagement</th>
              </tr>
            </thead>
            <tbody>
              {history.slice(0, 10).map(item => (
                <tr key={item.id} className="border-b border-neutral-200 last:border-0">
                  <td className="py-2 px-2 text-neutral-900 max-w-xs truncate">{item.title}</td>
                  <td className="py-2 px-2 text-neutral-700">{item.category}</td>
                  <td className="py-2 px-2 text-neutral-700">
                    {new Date(item.played_at).toLocaleDateString()}
                  </td>
                  <td className="py-2 px-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      item.engagement_score >= 0.7 ? 'bg-success-500/10 text-success-500' :
                      item.engagement_score >= 0.4 ? 'bg-warning-500/10 text-warning-500' :
                      'bg-error-500/10 text-error-500'
                    }`}>
                      {(item.engagement_score * 100).toFixed(0)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
