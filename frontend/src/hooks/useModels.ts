import { useState, useCallback } from 'react';
import { modelService } from '../services/modelService';
import { useToast } from './useToast';
import {
  CreateModelBody,
  CreateProviderBody,
  ModelConfig,
} from '../types/model';

export const useModels = () => {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const fetchModels = useCallback(async () => {
    setLoading(true);
    try {
      const data = await modelService.getModels();
      return data;
    } catch (err) {
      toast.showError('Failed to fetch models');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSystemPrompt = useCallback(async () => {
    setLoading(true);
    try {
      const prompt = await modelService.getPrompt();
      return prompt;
    } catch (err) {
      toast.showError('Failed to fetch system prompt');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createProvider = useCallback(async (provider: CreateProviderBody) => {
    setLoading(true);
    try {
      const newProvider = await modelService.createProvider(provider);
      return newProvider;
    } catch (err) {
      toast.showError('Failed to create provider');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProvider = useCallback(
    async (
      provider: string,
      data: { api_key: string; metadata: Record<string, string> },
    ) => {
      setLoading(true);
      try {
        const updatedProvider = await modelService.updateProvider(
          provider,
          data,
        );
        return updatedProvider;
      } catch (err) {
        toast.showError('Failed to update provider');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const createModel = useCallback(async (model: CreateModelBody) => {
    setLoading(true);
    try {
      const newModel = await modelService.createModel(model);
      return newModel;
    } catch (err) {
      toast.showError('Failed to create model');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateModel = useCallback(
    async (id: string, model: Partial<ModelConfig>) => {
      setLoading(true);
      try {
        const updatedModel = await modelService.updateModel(id, model);
        return updatedModel;
      } catch (err) {
        toast.showError('Failed to update model');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const deleteModel = useCallback(async (id: string) => {
    setLoading(true);
    try {
      await modelService.deleteModel(id);
    } catch (err) {
      toast.showError('Failed to delete model');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    fetchModels,
    fetchSystemPrompt,
    createProvider,
    updateProvider,
    createModel,
    updateModel,
    deleteModel,
  };
};
