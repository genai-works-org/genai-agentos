import { useState, useEffect, useCallback } from 'react';
import { chatService } from '../services/chatService';
import { useToast } from './useToast';

export const useChat = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const getChatsList = useCallback(async () => {
    setIsLoading(true);
    try {
      const chats = await chatService.getChatsList();
      return chats;
    } catch (error) {
      toast.showError('Failed to fetch chats');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getChatHistory = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const chat = await chatService.getChatHistory({ session_id: id });
      return chat;
    } catch (err) {
      setError('Failed to load chat details');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createChat = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const newChat = await chatService.createChat(id);
      return newChat;
    } catch (err) {
      setError('Failed to create chat');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateChat = useCallback(async (id: string, title: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedChat = await chatService.updateChat(id, title);
      return updatedChat;
    } catch (err) {
      setError('Failed to update chat');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteChat = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await chatService.deleteChat(id);
    } catch (err) {
      setError('Failed to delete chat');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cleanup function to cancel any pending requests
  useEffect(() => {
    return () => {
      setIsLoading(false);
    };
  }, []);

  return {
    isLoading,
    error,
    getChatsList,
    getChatHistory,
    createChat,
    updateChat,
    deleteChat,
  };
};
