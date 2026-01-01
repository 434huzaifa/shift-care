import { toast } from "sonner";

/**
 * Display a success toast notification
 * @param message - The main message to display
 * @param description - Optional description for more details
 */
export const showSuccess = (message: string, description?: string) => {
  toast.success(message, {
    description,
  });
};

/**
 * Display an error toast notification
 * @param message - The main error message to display
 * @param description - Optional description for more details
 */
export const showError = (message: string, description?: string) => {
  toast.error(message, {
    description,
    position: "bottom-right",
    style: {
      background: "#ef4444",
      color: "#fff",
      border: "1px solid #dc2626",
    },
  });
};

/**
 * Display a warning toast notification
 * @param message - The main warning message to display
 * @param description - Optional description for more details
 */
export const showWarning = (message: string, description?: string) => {
  toast.warning(message, {
    description,
  });
};

/**
 * Display an info toast notification
 * @param message - The main info message to display
 * @param description - Optional description for more details
 */
export const showInfo = (message: string, description?: string) => {
  toast.info(message, {
    description,
  });
};

/**
 * Display a loading toast notification
 * @param message - The loading message to display
 * @returns Toast ID that can be used to dismiss or update the toast
 */
export const showLoading = (message: string) => {
  return toast.loading(message);
};

/**
 * Display a promise-based toast notification
 * Shows loading state, then success or error based on promise result
 * @param promise - The promise to track
 * @param messages - Messages for loading, success, and error states
 */
export const showPromise = <T,>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: unknown) => string);
  }
) => {
  return toast.promise(promise, messages);
};

/**
 * Dismiss a specific toast or all toasts
 * @param toastId - Optional ID of the toast to dismiss. If not provided, dismisses all toasts.
 */
export const dismissToast = (toastId?: string | number) => {
  if (toastId) {
    toast.dismiss(toastId);
  } else {
    toast.dismiss();
  }
};
