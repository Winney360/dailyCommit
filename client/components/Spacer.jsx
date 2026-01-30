import { View } from "react-native";

export default function Spacer({ width = 1, height = 1 }) {
  return (
    <View
      style={{
        width,
        height,
      }}
    />
  );
}