import { useCallback, useState } from 'react';
import { useUiStore } from '../stores/uiStore';

export function useCopy(): {
  copy: (text: string, message?: string) => Promise<boolean>;
  copied: boolean;
} {
  const toast = useUiStore((s) => s.toast);
  const [copied, setCopied] = useState(false);

  const copy = useCallback(
    async (text: string, message = 'Copied to clipboard') => {
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
        } else {
          const textarea = document.createElement('textarea');
          textarea.value = text;
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.select();
          const ok = document.execCommand('copy');
          document.body.removeChild(textarea);
          if (!ok) throw new Error('copy failed');
        }
        setCopied(true);
        toast(message, 'success');
        setTimeout(() => setCopied(false), 1500);
        return true;
      } catch {
        toast('Copy failed. Your browser blocked clipboard access.', 'error');
        return false;
      }
    },
    [toast],
  );

  return { copy, copied };
}

export function useToast(): (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void {
  return useUiStore((s) => s.toast);
}
