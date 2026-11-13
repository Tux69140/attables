import React, { useEffect } from 'react';
import { useAndroidBack } from '../hooks/useAndroidBack';
import { FoyerColorId, FoyerPictoId, getFoyerColorHex } from '../types/models';
import { FoyerPictoIcon, IconClose, IconUndo } from './Icons';

export const FoyerTile: React.FC<{
  color: FoyerColorId;
  picto: FoyerPictoId;
  sizePx?: 44 | 36;
}> = ({ color, picto, sizePx = 44 }) => {
  const bg = getFoyerColorHex(color);
  const cls = sizePx === 44 ? 'w-[44px] h-[44px] rounded-xl' : 'w-9 h-9 rounded-lg';
  return (
    <div
      className={`${cls} shrink-0 flex items-center justify-center border border-[#1A263C]/15`}
      style={{ backgroundColor: bg, color: '#1A263C' }}
      aria-hidden="true"
    >
      <FoyerPictoIcon picto={picto} size={sizePx === 44 ? 24 : 20} />
    </div>
  );
};

export const ConfirmModal: React.FC<{
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Annuler',
  destructive = true,
  onConfirm,
  onCancel,
}) => {
  useAndroidBack(open, onCancel);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-[#0D1624]/60 backdrop-blur-[2px] p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      onClick={onCancel}
    >
      <div
        className="w-full sm:max-w-md bg-[var(--card)] border border-[var(--border)] rounded-t-3xl sm:rounded-2xl p-5 pb-safe shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full bg-[var(--border)] mx-auto mb-4 sm:hidden" />
        <h2
          id="confirm-modal-title"
          className="font-display text-xl text-[var(--ink)] leading-snug"
        >
          {title}
        </h2>
        <p className="mt-2 text-[15px] text-[var(--ink-muted)] leading-relaxed">
          {description}
        </p>
        <div className="mt-5 flex flex-col-reverse sm:flex-row gap-2.5 sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[46px] px-5 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--ink)] font-semibold text-[15px] active:scale-[0.98] transition-transform"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`min-h-[46px] px-5 rounded-xl font-semibold text-[15px] active:scale-[0.98] transition-transform ${
              destructive
                ? 'bg-[#A82E27] text-white'
                : 'bg-[var(--primary)] text-[var(--on-primary)]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export const BottomSheet: React.FC<{
  open: boolean;
  title: string;
  onClose: () => void;
  zClass?: string;
  children: React.ReactNode;
}> = ({ open, title, onClose, zClass = 'z-50', children }) => {
  useAndroidBack(open, onClose);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 ${zClass} flex items-end sm:items-center justify-center bg-[#0D1624]/60 backdrop-blur-[2px]`}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg max-h-[88vh] flex flex-col bg-[var(--card)] border-t sm:border border-[var(--border)] rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 pt-2.5 pb-3 border-b border-[var(--border)] shrink-0">
          <div className="w-10 h-1 rounded-full bg-[var(--border)] mx-auto mb-2 sm:hidden" />
          <div className="grid grid-cols-[44px_1fr_44px] items-center gap-2">
            <div className="w-[44px]" aria-hidden="true" />
            <h2 className="font-display text-xl text-[var(--ink)] text-center truncate">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="justify-self-end min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[var(--ink-muted)] hover:bg-[var(--surface-elevated)] active:scale-95 transition-transform"
            >
              <IconClose size={20} />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto px-5 py-4 pb-safe">{children}</div>
      </div>
    </div>
  );
};

export const UndoBanner: React.FC<{
  message: string | null;
  bottomOffsetClass?: string;
  onUndo: () => void;
  onDismiss: () => void;
}> = ({ message, bottomOffsetClass = 'bottom-above-bar', onUndo, onDismiss }) => {
  if (!message) return null;

  return (
    <div
      className={`fixed ${bottomOffsetClass} left-4 right-4 z-40 flex justify-center pointer-events-none transition-all duration-200`}
    >
      <div className="pointer-events-auto w-full max-w-[600px] bg-[var(--ink)] text-[var(--bg)] rounded-2xl px-4 py-2.5 shadow-xl flex items-center justify-between gap-3 border border-[var(--outline)]/30">
        <span className="text-[14px] font-medium truncate">{message}</span>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onUndo}
            className="min-h-[44px] px-3.5 rounded-xl bg-[var(--primary)] text-[var(--on-primary)] font-semibold text-[14px] flex items-center gap-1.5 whitespace-nowrap active:scale-95 transition-transform"
          >
            <IconUndo size={16} />
            <span>Annuler</span>
          </button>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Fermer la notification"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl opacity-80 hover:opacity-100"
          >
            <IconClose size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
