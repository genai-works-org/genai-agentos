import type { FC } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { XIcon, FileIcon, DownloadIcon } from 'lucide-react';
import Spinner from '../shared/Spinner';
import { fileService } from '@/services/fileService';
import { extractFileName } from '@/utils/extractFileName';

// Interface matching the one in ChatInput
export interface FileData {
  clientId: string;
  id?: string; // Server ID, optional initially
  name: string;
  type: string;
  size: number;
  loading: boolean;
  fromAgent?: boolean;
  previewUrl?: string;
}
interface FilePreviewCardProps {
  fileData: FileData;
  onRemove?: (clientId: string) => void;
  isUploading?: boolean; // To disable remove button during final send
}

const FilePreviewCard: FC<FilePreviewCardProps> = ({
  fileData,
  onRemove,
  isUploading = false,
}) => {
  const { clientId, id, name, type, loading, fromAgent } = fileData;
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [metaData, setMetadata] = useState<{
    from_agent: boolean;
    id: string;
    internal_id: string;
    internal_name: string;
    mimetype: string;
    original_name: string;
    request_id: string;
    session_id: string;
  } | null>(null);

  useEffect(() => {
    const loadFile = async () => {
      if (id) {
        setIsLoading(true);
        try {
          // First get file metadata
          const metadata = await fileService.getFileMetadata(id);
          setMetadata(metadata);

          // Then get the file content
          const response = await fileService.downloadFile(id);
          setFileUrl(response.url);
        } catch (error) {
          // Remove line 59: console.error('Failed to load file:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadFile();

    return () => {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [id]);

  const handleDownload = async () => {
    if (id) {
      try {
        const { url } = await fileService.downloadFile(id);
        const a = document.createElement('a');
        a.href = url;
        a.download = extractFileName(
          metaData?.original_name || metaData?.internal_name,
        );
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        setFileUrl(url);
      } catch (error) {
        // Remove line 88: console.error('Failed to download file:', error);
      }
    }
  };

  const renderPreview = useCallback(() => {
    if (loading || isLoading) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 bg-opacity-50">
          <Spinner size="md" />
        </div>
      );
    }

    if (type.startsWith('image/') && fileUrl) {
      return (
        <img
          src={fileUrl || ''}
          alt={name}
          className="absolute inset-0 w-full h-full object-cover"
          onError={e => {
            // Remove line 109: console.error('Failed to load image:', e);
            // Fallback to file icon if image fails to load
            e.currentTarget.style.display = 'none';
          }}
        />
      );
    }

    if (type.startsWith('video/') && fileUrl) {
      return (
        <video
          src={fileUrl || ''}
          className="absolute inset-0 w-full h-full object-cover"
          muted
          playsInline
          onError={e => {
            // Fallback to file icon if video fails to load
            e.currentTarget.style.display = 'none';
          }}
        />
      );
    }

    return (
      <>
        <FileIcon size={32} className="mb-1 text-gray-500 flex-shrink-0" />
        <span className="w-full text-xs font-medium truncate px-1">
          {extractFileName(metaData?.original_name || metaData?.internal_name)}
        </span>
      </>
    );
  }, [fileUrl, loading, isLoading, name, metaData]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTooltipContent = () => {
    if (!metaData) return name;

    return `
      Name: ${extractFileName(metaData.original_name || metaData.internal_name)}
      Type: ${metaData.mimetype}
      Size: ${formatFileSize(fileData.size)}
      ID: ${metaData.id}
    `.trim();
  };

  return (
    <div
      className={`relative w-24 h-24 bg-gray-100 rounded-md overflow-hidden shadow-sm border-2 border-white/20 ${
        loading
          ? ''
          : 'p-2 flex flex-col items-center justify-center text-center'
      }`}
      title={getTooltipContent()}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center border-4 border-gray-400/10">
        {renderPreview()}
      </div>

      {/* Download button for agent files */}
      {id && (
        <button
          onClick={handleDownload}
          className="absolute top-1 left-1 p-0.5 bg-gray-600 bg-opacity-50 hover:bg-opacity-75 rounded-full text-white disabled:opacity-50 z-10"
        >
          <DownloadIcon size={14} />
        </button>
      )}

      {/* Remove button - only for user files */}
      {!isUploading && onRemove && !fromAgent && (
        <button
          onClick={() => onRemove(clientId)}
          className="absolute top-1 right-1 p-0.5 bg-gray-600 bg-opacity-50 hover:bg-opacity-75 rounded-full text-white disabled:opacity-50 z-10"
        >
          <XIcon size={14} />
        </button>
      )}
    </div>
  );
};

export default FilePreviewCard;
