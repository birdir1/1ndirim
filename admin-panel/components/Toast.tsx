'use client';

import { useEffect, useState } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

type Toast = {
  id: string;
  message: string;
  type: ToastType;
};

let toastId = 0;
const toasts: Toast[] = [];
const listeners: Array<() => void> = [];

export function showToast(message: string, type: ToastType = 'info') {
  const id = `toast-${toastId++}`;
  toasts.push({ id, message, type });
  listeners.forEach((fn) => fn());
  
  setTimeout(() => {
    const index = toasts.findIndex((t) => t.id === id);
    if (index !== -1) {
      toasts.splice(index, 1);
      listeners.forEach((fn) => fn());
    }
  }, 5000);
}

export function ToastContainer() {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const listener = () => forceUpdate((n) => n + 1);
    listeners.push(listener);
    return () => {
      const index = listeners.indexOf(listener);
      if (index !== -1) listeners.splice(index, 1);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

function ToastItem({ toast }: { toast: Toast }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(false), 4500);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  return (
    <div
      className={`${colors[toast.type]} border rounded-lg shadow-lg px-4 py-3 min-w-[300px] max-w-[500px] flex items-center justify-between gap-4 animate-slide-in`}
    >
      <span className="text-sm font-medium">{toast.message}</span>
      <button
        type="button"
        onClick={() => setIsVisible(false)}
        className="text-gray-400 hover:text-gray-600"
      >
        ✕
      </button>
    </div>
  );
}
