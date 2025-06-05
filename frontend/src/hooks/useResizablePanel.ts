import { useState, useCallback, useEffect, useRef, RefObject } from 'react';

interface UseResizablePanelOptions {
  initialWidth: number;
  minWidth: number;
  maxWidth: number;
  panelRef?: RefObject<HTMLElement>;
  isLeftSide?: boolean;
}

interface UseResizablePanelReturn {
  width: number;
  isResizing: boolean;
  handleMouseDown: (e: MouseEvent) => void;
}

export const useResizablePanel = (
  options: UseResizablePanelOptions,
): UseResizablePanelReturn => {
  const {
    initialWidth,
    minWidth,
    maxWidth,
    panelRef,
    isLeftSide = false,
  } = options;
  const [width, setWidth] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (!panelRef?.current) return;

      setIsResizing(true);
      const rect = panelRef.current.getBoundingClientRect();
      startX.current = e.clientX;
      startWidth.current = rect.width;
      e.preventDefault();
    },
    [panelRef],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !panelRef?.current) return;

      const delta = e.clientX - startX.current;
      const newWidth = isLeftSide
        ? startWidth.current + delta
        : startWidth.current - delta;

      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setWidth(newWidth);
      }
    },
    [isResizing, minWidth, maxWidth, panelRef, isLeftSide],
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return {
    width,
    isResizing,
    handleMouseDown,
  };
};
