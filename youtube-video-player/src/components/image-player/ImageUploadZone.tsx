import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, CheckCircle } from 'lucide-react';

interface ImageUploadZoneProps {
  onUpload: (file: File, caption?: string) => Promise<void>;
}

interface UploadingFile {
  file: File;
  progress: 'uploading' | 'success' | 'error';
  error?: string;
}

export function ImageUploadZone({ onUpload }: ImageUploadZoneProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newFiles: UploadingFile[] = acceptedFiles.map(file => ({
      file,
      progress: 'uploading' as const
    }));

    setUploadingFiles(prev => [...prev, ...newFiles]);

    // Upload each file
    for (let i = 0; i < acceptedFiles.length; i++) {
      try {
        await onUpload(acceptedFiles[i]);
        setUploadingFiles(prev => prev.map(uf => 
          uf.file === acceptedFiles[i] ? { ...uf, progress: 'success' } : uf
        ));
      } catch (error) {
        setUploadingFiles(prev => prev.map(uf => 
          uf.file === acceptedFiles[i] 
            ? { ...uf, progress: 'error', error: (error as Error).message } 
            : uf
        ));
      }
    }

    // Clear successful uploads after 2 seconds
    setTimeout(() => {
      setUploadingFiles(prev => prev.filter(uf => uf.progress !== 'success'));
    }, 2000);
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp']
    },
    maxSize: 10485760, // 10MB
    multiple: true
  } as any); // Type workaround for react-dropzone

  const removeFile = (file: File) => {
    setUploadingFiles(prev => prev.filter(uf => uf.file !== file));
  };

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={`h-[200px] flex flex-col items-center justify-center border-2 border-dashed rounded-md transition-all cursor-pointer ${
          isDragActive
            ? 'border-primary-600 bg-primary-600/10'
            : 'border-neutral-400 bg-neutral-50 hover:border-primary-500 hover:bg-neutral-100'
        }`}
      >
        <input {...(getInputProps() as any)} />
        <Upload 
          className={`w-12 h-12 mb-3 ${
            isDragActive ? 'text-primary-600' : 'text-neutral-600'
          }`} 
        />
        <p className={`text-base font-medium ${
          isDragActive ? 'text-primary-600' : 'text-neutral-700'
        }`}>
          {isDragActive ? 'Drop images here' : 'Drag images here or click to browse'}
        </p>
        <p className="text-sm text-neutral-600 mt-1">
          Support: JPG, PNG, GIF, WEBP (max 10MB)
        </p>
      </div>

      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          {uploadingFiles.map((uf, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-white border border-neutral-300 rounded-md"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate">
                  {uf.file.name}
                </p>
                <p className="text-xs text-neutral-600">
                  {(uf.file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>

              {uf.progress === 'uploading' && (
                <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
              )}

              {uf.progress === 'success' && (
                <CheckCircle className="w-5 h-5 text-success-500" />
              )}

              {uf.progress === 'error' && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-error-500">{uf.error || 'Failed'}</span>
                  <button
                    onClick={() => removeFile(uf.file)}
                    className="p-1 hover:bg-neutral-100 rounded"
                  >
                    <X className="w-4 h-4 text-neutral-600" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
