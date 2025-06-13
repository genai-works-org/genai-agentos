import { useRef, useEffect, KeyboardEvent } from 'react';
import type { FC, FormEvent, ChangeEvent } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useSettings } from '../../contexts/SettingsContext';

interface MessageInputProps {
  message: string;
  onMessageChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  showPreview: boolean;
  isUploading: boolean;
  isAnyFileUploading: boolean;
  onSubmit: (e: FormEvent) => void;
}

const MessageInput: FC<MessageInputProps> = ({
  message,
  onMessageChange,
  showPreview,
  isUploading,
  isAnyFileUploading,
  onSubmit,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { activeModel } = useSettings();

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      Boolean(activeModel) && onSubmit(e);
    }
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [message]);

  return (
    <div className="p-3">
      {showPreview ? (
        <div className="prose prose-sm max-w-none dark:prose-invert p-2 min-h-[100px] border rounded">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{message}</ReactMarkdown>
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          value={message}
          onChange={onMessageChange}
          onKeyDown={handleKeyDown}
          placeholder="Message"
          className="w-full h-full px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none resize-none"
          rows={1}
          disabled={isUploading || isAnyFileUploading}
        />
      )}
    </div>
  );
};

export default MessageInput;
