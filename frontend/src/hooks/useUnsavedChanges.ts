import { useCallback, useEffect, useState } from 'react';
import { useBlocker, Blocker } from 'react-router-dom';

export const useUnsavedChanges = (
  hasUnsavedChanges: boolean,
  onConfirm?: () => void,
) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [blockerTx, setBlockerTx] = useState<Blocker | null>(null);
  const blocker = useBlocker(hasUnsavedChanges);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return true;
      }
      return null;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (blocker.state === 'blocked') {
      setModalOpen(true);
      setBlockerTx(blocker);
    }
  }, [blocker]);

  const confirmLeave = useCallback(() => {
    onConfirm?.();
    setModalOpen(false);
    blockerTx?.proceed?.();
    setBlockerTx(null);
  }, [blockerTx]);

  const cancelLeave = useCallback(() => {
    setModalOpen(false);
    blockerTx?.reset?.();
    setBlockerTx(null);
  }, [blockerTx]);

  return { isModalOpen, confirmLeave, cancelLeave };
};
