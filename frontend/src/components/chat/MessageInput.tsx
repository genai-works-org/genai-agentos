import { useRef, useEffect, KeyboardEvent } from 'react';
import type { FC, FormEvent, ChangeEvent } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useSettings } from '../../contexts/SettingsContext';
import { Textarea } from '../ui/textarea';

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
  const { activeModel, isModelSelected } = useSettings();

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
    <div>
      {showPreview ? (
        <div className="prose prose-sm max-w-none dark:prose-invert p-2 min-h-[100px] border rounded">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{message}</ReactMarkdown>
        </div>
      ) : (
        <Textarea
          ref={textareaRef}
          name="message"
          value={message}
          onChange={onMessageChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything"
          className="min-h-[54px] rounded-none focus-visible:ring-0 border-0"
          disabled={isUploading || isAnyFileUploading || !isModelSelected}
        />
      )}
    </div>
  );
};

export default MessageInput;
