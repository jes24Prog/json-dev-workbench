import { useState } from 'react';
import { Modal } from './Modal';
import { useDraftsStore } from '../../stores/draftsStore';
import { useHistoryStore } from '../../stores/historyStore';

export function RestoreSessionDialog() {
  const hasRestorableSession = useDraftsStore((s) => s.hasRestorableSession);
  const [open, setOpen] = useState(true);
  const [hidden, setHidden] = useState(false);

  if (hidden || !hasRestorableSession || !open) return null;

  const restore = () => {
    setOpen(false);
    setHidden(true);
  };
  const discard = async () => {
    setOpen(false);
    setHidden(true);
    await useDraftsStore.getState().discardAll();
    void useHistoryStore.getState().add({
      tool: 'drafts',
      toolLabel: 'Session discarded',
      input: '',
      output: '',
      settings: '{}',
    });
  };

  return (
    <Modal open={open} onClose={restore} title="Restore previous session?" width="max-w-sm">
      <p className="text-xs text-ink">
        Drafts from your last session were found in local storage. Restore them to pick up
        where you left off?
      </p>
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" className="btn" onClick={() => void discard()}>
          Discard
        </button>
        <button type="button" className="btn btn-primary" onClick={restore}>
          Restore
        </button>
      </div>
    </Modal>
  );
}
