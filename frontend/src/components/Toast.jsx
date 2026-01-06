import React, { useEffect } from "react";
import { X, CheckCircle, XCircle, AlertCircle, Info } from "lucide-react";

export default function Toast({ message, type = "info", onClose, duration = 5000 }) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const styles = {
    success: {
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-800",
      icon: <CheckCircle className="w-5 h-5 text-green-500" />
    },
    error: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-800",
      icon: <XCircle className="w-5 h-5 text-red-500" />
    },
    warning: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      text: "text-yellow-800",
      icon: <AlertCircle className="w-5 h-5 text-yellow-500" />
    },
    info: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-800",
      icon: <Info className="w-5 h-5 text-blue-500" />
    }
  };

  const style = styles[type] || styles.info;

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
      <div
        className={`${style.bg} ${style.border} ${style.text} border-2 rounded-xl shadow-lg p-4 pr-12 max-w-md flex items-start gap-3`}
      >
        {style.icon}
        <p className="text-sm font-medium flex-1">{message}</p>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 hover:bg-black/5 rounded-full transition-colors"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Toast container component for managing multiple toasts
export function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
          duration={toast.duration}
        />
      ))}
    </div>
  );
}

// Custom hook for managing toasts
export function useToast() {
  const [toasts, setToasts] = React.useState([]);

  const addToast = React.useCallback((message, type = "info", duration = 5000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    return id;
  }, []);

  const removeToast = React.useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = React.useCallback((message, duration) => addToast(message, "success", duration), [addToast]);
  const error = React.useCallback((message, duration) => addToast(message, "error", duration), [addToast]);
  const warning = React.useCallback((message, duration) => addToast(message, "warning", duration), [addToast]);
  const info = React.useCallback((message, duration) => addToast(message, "info", duration), [addToast]);

  return { toasts, removeToast, addToast, success, error, warning, info };
}
