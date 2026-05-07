"use client";
import { createContext, useContext, useState, useCallback, useRef } from "react";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

const config: Record<ToastType, { bg: string; border: string; icon: string; Icon: React.ComponentType<{ className?: string }> }> = {
  success: { bg: "bg-green-50",  border: "border-green-200",  icon: "text-green-600",  Icon: CheckCircleIcon },
  error:   { bg: "bg-red-50",    border: "border-red-200",    icon: "text-red-600",    Icon: ExclamationCircleIcon },
  warning: { bg: "bg-amber-50",  border: "border-amber-200",  icon: "text-amber-500",  Icon: ExclamationTriangleIcon },
  info:    { bg: "bg-blue-50",   border: "border-blue-200",   icon: "text-blue-600",   Icon: InformationCircleIcon },
};

const ToastContext = createContext<{ toast: (message: string, type?: ToastType) => void }>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const { bg, border, icon, Icon } = config[item.type];
  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg ${bg} ${border} w-80 pointer-events-auto animate-in`}
    >
      <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${icon}`} />
      <p className="flex-1 text-sm text-gray-800 leading-snug">{item.message}</p>
      <button
        onClick={onDismiss}
        className="flex-shrink-0 p-0.5 rounded text-gray-400 hover:text-gray-600 hover:bg-black/5 transition"
      >
        <XMarkIcon className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = ++counter.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map((t) => (
          <ToastCard
            key={t.id}
            item={t}
            onDismiss={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
