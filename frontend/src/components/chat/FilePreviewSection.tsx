import type { FC } from 'react';
import FilePreviewCard, { FileData } from './FilePreviewCard';

interface FilePreviewSectionProps {
  attachedFiles: FileData[];
  onRemoveFile: (clientId: string) => void;
  isUploading: boolean;
}

const FilePreviewSection: FC<FilePreviewSectionProps> = ({
  attachedFiles,
  onRemoveFile,
  isUploading,
}) => {
  if (attachedFiles.length === 0) return null;

  return (
    <div className="px-3 py-2 border-b border-gray-200 flex flex-wrap gap-3">
      {attachedFiles.map(file => (
        <FilePreviewCard
          key={file.clientId}
          fileData={file}
          onRemove={onRemoveFile}
          isUploading={isUploading}
        />
      ))}
    </div>
  );
};

export default FilePreviewSection;
