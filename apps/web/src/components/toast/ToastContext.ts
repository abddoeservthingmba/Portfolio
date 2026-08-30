import { createContext, useContext } from 'react';

export type ToastTone = 'success' | 'error';

export interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
}

export interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
}

/**
 * Split from the provider component so the module exports only hooks and
 * context — a component file that also exports non-components breaks React
 * Fast Refresh.
 */
export const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const api = useContext(ToastContext);

  if (!api) {
    throw new Error('useToast must be used inside <ToastProvider>');
  }

  return api;
}
