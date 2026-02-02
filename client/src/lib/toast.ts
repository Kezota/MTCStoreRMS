import toast from "react-hot-toast";

export const showToast = {
  success: (message: string) => {
    toast.success(message, {
      position: "top-right",
      duration: 4000,
      style: {
        background: "#10b981",
        color: "#fff",
        fontWeight: "500",
        borderRadius: "8px",
      },
      icon: "✓",
    });
  },
  error: (message: string) => {
    toast.error(message, {
      position: "top-right",
      duration: 5000,
      style: {
        background: "#ef4444",
        color: "#fff",
        fontWeight: "500",
        borderRadius: "8px",
      },
      icon: "✕",
    });
  },
  loading: (message: string) => {
    return toast.loading(message, {
      position: "top-right",
      style: {
        background: "#3b82f6",
        color: "#fff",
        fontWeight: "500",
        borderRadius: "8px",
      },
    });
  },
  promise: async <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    },
  ) => {
    return toast.promise(promise, messages, {
      style: {
        fontWeight: "500",
        borderRadius: "8px",
      },
      position: "top-right",
    });
  },
};
