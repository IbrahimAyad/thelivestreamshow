import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ImageDisplayHistory } from '@/types/video';

export function ImageHistory() {
  const [history, setHistory] = useState<ImageDisplayHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    const { data, error } = await supabase
      .from('image_display_history')
      .select('*')
      .order('displayed_at', { ascending: false })
      .limit(100);

    if (!error && data) {
      setHistory(data);
    }
    setLoading(false);
  };

  const exportToCSV = () => {
    const headers = ['Filename', 'Displayed At', 'Duration (seconds)', 'Date'];
    const rows = history.map(h => [
      h.filename,
      new Date(h.displayed_at).toLocaleTimeString(),
      h.duration_seconds?.toString() || '0',
      new Date(h.displayed_at).toLocaleDateString()
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `image-history-${Date.now()}.csv`;
    a.click();
  };

  if (loading) {
    return <div className="text-center py-8 text-neutral-600">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-neutral-900">Display History</h3>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-md text-sm font-medium transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-neutral-100 border-b border-neutral-300">
              <th className="px-4 py-2 text-left text-xs font-semibold text-neutral-600 uppercase">
                Filename
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-neutral-600 uppercase">
                Display Time
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-neutral-600 uppercase">
                Duration
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-neutral-600 uppercase">
                Date
              </th>
            </tr>
          </thead>
          <tbody>
            {history.map((h, index) => (
              <tr
                key={h.id}
                className={`border-b border-neutral-200 hover:bg-neutral-50 ${
                  index % 2 === 0 ? 'bg-white' : 'bg-neutral-50/50'
                }`}
              >
                <td className="px-4 py-3 text-sm text-neutral-900">
                  {h.filename}
                </td>
                <td className="px-4 py-3 text-sm text-neutral-600">
                  {new Date(h.displayed_at).toLocaleTimeString()}
                </td>
                <td className="px-4 py-3 text-sm text-neutral-600">
                  {h.duration_seconds ? `${h.duration_seconds}s` : 'N/A'}
                </td>
                <td className="px-4 py-3 text-sm text-neutral-600">
                  {new Date(h.displayed_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {history.length === 0 && (
          <p className="text-center py-8 text-neutral-600">No display history yet</p>
        )}
      </div>
    </div>
  );
}
