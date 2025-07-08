import type { FormEvent, ChangeEvent } from 'react';
import { useState, useRef, useEffect } from 'react';

import Toolbar from './Toolbar';
import FilePreviewSection from './FilePreviewSection';
import MessageInput from './MessageInput';
import { FileData } from './FilePreviewCard';

interface UploadResult {
  id: string;
  name: string;
}

interface ChatInputProps {
  onSendMessage: (message: string, files?: string[]) => void;
  isUploading?: boolean;
  onFileUpload?: (file: File) => Promise<UploadResult>;
}

const ChatInput = ({
  onSendMessage,
  isUploading = false,
  onFileUpload,
}: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<FileData[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup object URLs
  useEffect(() => {
    return () => {
      attachedFiles.forEach(file => {
        if (file.previewUrl) {
          URL.revokeObjectURL(file.previewUrl);
        }
      });
    };
  }, []); // Run only on unmount

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const fileIds = attachedFiles
      .filter(file => !file.loading && file.id)
      .map(file => file.id!);

    if (message.trim() || fileIds.length > 0) {
      onSendMessage(message, fileIds);
      setMessage('');
      const filesToRemove = attachedFiles.filter(
        file => !file.loading && file.id,
      );
      filesToRemove.forEach(file => {
        if (file.previewUrl) {
          URL.revokeObjectURL(file.previewUrl);
        }
      });
      setAttachedFiles(prev => prev.filter(file => file.loading || !file.id));
    }
  };

  const handleTextareaChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && onFileUpload) {
      const clientId = `${Date.now()}-${selectedFile.name}`;
      let previewUrl: string | undefined = undefined;

      if (
        selectedFile.type.startsWith('image/') ||
        selectedFile.type.startsWith('video/')
      ) {
        previewUrl = URL.createObjectURL(selectedFile);
      }

      const placeholder: FileData = {
        clientId,
        name: selectedFile.name,
        type: selectedFile.type,
        size: selectedFile.size,
        previewUrl,
        loading: true,
      };
      setAttachedFiles(prev => [...prev, placeholder]);

      try {
        const uploadResult = await onFileUpload(selectedFile);
        setAttachedFiles(prev =>
          prev.map(file =>
            file.clientId === clientId
              ? { ...file, id: uploadResult.id, loading: false }
              : file,
          ),
        );
      } catch (error) {
        setAttachedFiles(prev =>
          prev.filter(file => file.clientId !== clientId),
        );
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
      }
    }
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleRemoveFile = (clientIdToRemove: string) => {
    const fileToRemove = attachedFiles.find(
      file => file.clientId === clientIdToRemove,
    );
    if (fileToRemove?.previewUrl) {
      URL.revokeObjectURL(fileToRemove.previewUrl);
    }
    setAttachedFiles(prev =>
      prev.filter(file => file.clientId !== clientIdToRemove),
    );
  };

  const isAnyFileUploading = attachedFiles.some(file => file.loading);
  const hasContent =
    message.trim() || attachedFiles.some(f => !f.loading && f.id);

  return (
    <div className="min-h-[132px] bg-primary-white rounded-2xl overflow-hidden">
      <MessageInput
        message={message}
        onMessageChange={handleTextareaChange}
        showPreview={showPreview}
        isUploading={isUploading}
        isAnyFileUploading={isAnyFileUploading}
        onSubmit={handleSubmit}
      />

      <Toolbar
        onAttachClick={handleAttachClick}
        isUploading={isUploading}
        isAnyFileUploading={isAnyFileUploading}
        hasContent={Boolean(hasContent)}
        onSubmit={() => handleSubmit({ preventDefault: () => {} } as FormEvent)}
      />

      <FilePreviewSection
        attachedFiles={attachedFiles}
        onRemoveFile={handleRemoveFile}
        isUploading={isUploading}
      />

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        disabled={isUploading || isAnyFileUploading}
      />
    </div>
  );
};

export default ChatInput;
