'use client';

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import styles from './Toast.module.css';

export type ToastKind = 'info' | 'success' | 'warn' | 'error';
interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
  durationMs: number;
}

interface Ctx {
  toast: (message: string, opts?: { kind?: ToastKind; durationMs?: number }) => void;
}
const ToastContext = createContext<Ctx | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const toast = useCallback<Ctx['toast']>((message, opts = {}) => {
    const id = Date.now() + Math.random();
    const item: ToastItem = {
      id,
      kind: opts.kind || 'info',
      message,
      durationMs: opts.durationMs ?? 4000,
    };
    setItems((prev) => [...prev, item]);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className={styles.container}>
        {items.map((it) => (
          <ToastEntry key={it.id} item={it} onClose={() => remove(it.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastEntry({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, item.durationMs);
    return () => clearTimeout(timer);
  }, [item.durationMs, onClose]);

  const icon =
    item.kind === 'success' ? '✅' :
    item.kind === 'warn' ? '⚠️' :
    item.kind === 'error' ? '❌' : 'ℹ️';

  return (
    <div className={`${styles.toast} ${styles[item.kind]}`}>
      <span className={styles.icon}>{icon}</span>
      <span className={styles.message}>{item.message}</span>
      <button className={styles.close} onClick={onClose}>✕</button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
