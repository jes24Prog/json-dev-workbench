import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDraftsStore } from '../stores/draftsStore';
import { findTool } from '../constants/tools';

/** Navigate to a tool and preload its draft with the given content. */
export function useOpenInTool(): (toolId: string, content?: string) => void {
  const navigate = useNavigate();
  return useCallback(
    (toolId: string, content?: string) => {
      if (content !== undefined) useDraftsStore.getState().setDraft(toolId, content);
      navigate(`/tools/${toolId}`);
    },
    [navigate],
  );
}

export function toolRoute(toolId: string): string {
  return `/tools/${toolId}`;
}

export function toolLabel(toolId: string): string {
  return findTool(toolId)?.label ?? toolId;
}
