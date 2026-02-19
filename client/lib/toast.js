import Toast from "react-native-toast-message";

/**
 * Show a success toast notification
 */
export const showSuccessToast = (message, description = null) => {
  Toast.show({
    type: "success",
    text1: message,
    text2: description,
    position: "bottom",
    duration: 3000,
  });
};

/**
 * Show an error toast notification
 */
export const showErrorToast = (message, description = null) => {
  Toast.show({
    type: "error",
    text1: message,
    text2: description,
    position: "bottom",
    duration: 4000,
  });
};

/**
 * Show an info toast notification
 */
export const showInfoToast = (message, description = null) => {
  Toast.show({
    type: "info",
    text1: message,
    text2: description,
    position: "bottom",
    duration: 3000,
  });
};

/**
 * Show a warning toast notification
 */
export const showWarningToast = (message, description = null) => {
  Toast.show({
    type: "warning",
    text1: message,
    text2: description,
    position: "bottom",
    duration: 3000,
  });
};
