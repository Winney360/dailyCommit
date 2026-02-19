import Toast from "react-native-toast-message";
import { View, Text } from "react-native";

/**
 * Toast configuration for solid backgrounds
 */
const toastConfig = {
  success: (props) => (
    <View style={{
      backgroundColor: "#10B981",
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginHorizontal: 16,
      borderRadius: 8,
      marginBottom: 16,
    }}>
      <Text style={{ color: "white", fontWeight: "600", fontSize: 14 }}>
        {props.text1}
      </Text>
      {props.text2 && (
        <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 4 }}>
          {props.text2}
        </Text>
      )}
    </View>
  ),
  error: (props) => (
    <View style={{
      backgroundColor: "#EF4444",
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginHorizontal: 16,
      borderRadius: 8,
      marginBottom: 16,
    }}>
      <Text style={{ color: "white", fontWeight: "600", fontSize: 14 }}>
        {props.text1}
      </Text>
      {props.text2 && (
        <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 4 }}>
          {props.text2}
        </Text>
      )}
    </View>
  ),
  info: (props) => (
    <View style={{
      backgroundColor: "#3B82F6",
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginHorizontal: 16,
      borderRadius: 8,
      marginBottom: 16,
    }}>
      <Text style={{ color: "white", fontWeight: "600", fontSize: 14 }}>
        {props.text1}
      </Text>
      {props.text2 && (
        <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 4 }}>
          {props.text2}
        </Text>
      )}
    </View>
  ),
  warning: (props) => (
    <View style={{
      backgroundColor: "#F59E0B",
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginHorizontal: 16,
      borderRadius: 8,
      marginBottom: 16,
    }}>
      <Text style={{ color: "white", fontWeight: "600", fontSize: 14 }}>
        {props.text1}
      </Text>
      {props.text2 && (
        <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 4 }}>
          {props.text2}
        </Text>
      )}
    </View>
  ),
};

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

export { toastConfig };
