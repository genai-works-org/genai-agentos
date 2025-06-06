import { useState, useEffect } from 'react';
import { modelService, ModelConfig } from '../services/modelService';
import { useToast } from './useToast';
import { useAuth } from '../contexts/AuthContext';

export const useModels = () => {
  const [systemPrompt, setSystemPrompt] = useState<string | null>(null);
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const { user } = useAuth();

  const fetchModels = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await modelService.getModels();
      setModels(data);
    } catch (err) {
      setError('Failed to fetch models');
      toast.showError('Failed to fetch models');
    } finally {
      setLoading(false);
    }
  };

  const createModel = async (model: Omit<ModelConfig, 'id'>) => {
    setLoading(true);
    try {
      const newModel = await modelService.createModel(model);
      return newModel;
    } catch (err) {
      toast.showError('Failed to create model');
      throw err;
    } finally {
      setLoading(false);
      await fetchModels();
    }
  };

  const updateModel = async (id: string, model: Partial<ModelConfig>) => {
    setLoading(true);
    try {
      const updatedModel = await modelService.updateModel(id, model);
      return updatedModel;
    } catch (err) {
      toast.showError('Failed to update model');
      throw err;
    } finally {
      setLoading(false);
      await fetchModels();
    }
  };

  const deleteModel = async (id: string) => {
    setLoading(true);
    try {
      await modelService.deleteModel(id);
      await fetchModels();
    } catch (err) {
      console.error(err);
      toast.showError('Failed to delete model');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemPrompt = async () => {
    const prompt = await modelService.getPrompt();
    setSystemPrompt(prompt);
  };

  useEffect(() => {
    if (user) {
      fetchSystemPrompt();
      fetchModels();
    }
  }, [user]);

  return {
    system_prompt: systemPrompt,
    models,
    loading,
    error,
    createModel,
    updateModel,
    deleteModel,
    refetch: fetchModels,
  };
};
