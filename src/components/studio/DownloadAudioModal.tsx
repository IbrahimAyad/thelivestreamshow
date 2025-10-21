import React, { useState } from 'react';
import { CopyrightBadge } from './CopyrightBadge';
import { useYouTubeDownloader } from '@/hooks/studio/useYouTubeDownloader';

interface DownloadAudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function DownloadAudioModal({ isOpen, onClose, onSuccess }: DownloadAudioModalProps) {
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState<'music' | 'jingle'>('music');
  const [friendlyName, setFriendlyName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { progress, metadata, downloadYouTubeAudio, downloadDirectAudio, reset } = useYouTubeDownloader();

  if (!isOpen) return null;

  const handleDownload = async () => {
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    setError(null);

    try {
      const sourceType = detectSourceType(url);
      
      if (sourceType === 'youtube') {
        await downloadYouTubeAudio(url, category, friendlyName || undefined);
      } else if (sourceType === 'direct') {
        await downloadDirectAudio(url, category, friendlyName || undefined);
      } else {
        throw new Error('Unsupported URL type. Please provide a YouTube URL or direct audio file link.');
      }

      // Success - wait a moment then close
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 1500);

    } catch (err: any) {
      console.error('Download error:', err);
      setError(err.message || 'Failed to download audio');
    }
  };

  const handleClose = () => {
    setUrl('');
    setCategory('music');
    setFriendlyName('');
    setError(null);
    reset();
    onClose();
  };

  const detectSourceType = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.match(/\.(mp3|wav|ogg|m4a)$/i)) return 'direct';
    return 'unknown';
  };

  const getSourceTypeLabel = (url: string) => {
    const type = detectSourceType(url);
    if (type === 'youtube') return 'YouTube';
    if (type === 'direct') return 'Direct Audio File';
    return 'Unknown';
  };

  const isProcessing = progress.stage !== 'idle' && progress.stage !== 'complete' && progress.stage !== 'error';
  const isComplete = progress.stage === 'complete';
  const hasError = progress.stage === 'error';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-white">Download Audio from URL</h2>
            <p className="text-sm text-gray-400 mt-1">YouTube or direct audio links - fully automated</p>
          </div>
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Legal Disclaimer */}
        <div className="p-6 bg-yellow-500/10 border-b border-yellow-500/20">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="text-sm">
              <p className="text-yellow-400 font-medium">Legal Notice</p>
              <p className="text-yellow-300/80 mt-1">
                This feature is for personal/educational use. You are responsible for ensuring you have the rights to use downloaded content in your streams. Always respect copyright laws.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* URL Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Audio URL <span className="text-red-400">*</span>
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=... or https://example.com/audio.mp3"
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              disabled={isProcessing}
            />
            {url && (
              <p className="text-xs text-gray-400 mt-1.5">
                Source detected: <span className="text-blue-400">{getSourceTypeLabel(url)}</span>
              </p>
            )}
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
            <div className="flex gap-3">
              <button
                onClick={() => setCategory('music')}
                disabled={isProcessing}
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${
                  category === 'music'
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-600'
                } disabled:opacity-50`}
              >
                Music
              </button>
              <button
                onClick={() => setCategory('jingle')}
                disabled={isProcessing}
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${
                  category === 'jingle'
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-600'
                } disabled:opacity-50`}
              >
                Sound Drop
              </button>
            </div>
          </div>

          {/* Friendly Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Friendly Name <span className="text-gray-500">(Optional - for AI Director)</span>
            </label>
            <input
              type="text"
              value={friendlyName}
              onChange={(e) => setFriendlyName(e.target.value)}
              placeholder="e.g., intro, outro, background_chill"
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              disabled={isProcessing}
            />
          </div>

          {/* Progress Indicator */}
          {isProcessing && (
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <svg className="animate-spin h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-sm font-medium text-blue-400">{progress.message}</p>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Success Message */}
          {isComplete && (
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-medium text-green-400">{progress.message}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {(error || hasError) && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400">{error || progress.message}</p>
            </div>
          )}

          {/* Metadata Preview */}
          {metadata && (
            <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg space-y-3">
              <h3 className="text-sm font-semibold text-white">Preview</h3>
              
              {metadata.thumbnail && (
                <img src={metadata.thumbnail} alt="Thumbnail" className="w-full h-32 object-cover rounded-lg" />
              )}
              
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-400">Title:</span>
                  <span className="text-white ml-2">{metadata.title}</span>
                </div>
                <div>
                  <span className="text-gray-400">Artist:</span>
                  <span className="text-white ml-2">{metadata.artist}</span>
                </div>
                <div>
                  <span className="text-gray-400">Duration:</span>
                  <span className="text-white ml-2">{Math.floor(metadata.duration / 60)}:{String(metadata.duration % 60).padStart(2, '0')}</span>
                </div>
                {metadata.copyright_status && (
                  <div>
                    <span className="text-gray-400 block mb-2">Copyright Status:</span>
                    <CopyrightBadge copyrightInfo={metadata.copyright_status} />
                    {metadata.copyright_status.warning_message && (
                      <p className="text-xs text-yellow-400 mt-2">{metadata.copyright_status.warning_message}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t border-gray-700">
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {isComplete ? 'Close' : 'Cancel'}
          </button>
          {!isComplete && (
            <button
              onClick={handleDownload}
              disabled={isProcessing || !url.trim()}
              className="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </>
              ) : (
                'Download Audio'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}