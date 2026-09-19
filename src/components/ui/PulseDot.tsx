import { MotiView } from "moti";
import { View } from "react-native";
import { colors } from "../../theme/colors";

type Props = {
  size?: number;
  color?: string;
};

/** Canli durum gostergesi: sabit nokta + genisleyip solan halka. */
export function PulseDot({ size = 8, color = colors.success }: Props) {
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <MotiView
        from={{ opacity: 0.6, scale: 1 }}
        animate={{ opacity: 0, scale: 2.4 }}
        transition={{ type: "timing", duration: 1400, loop: true }}
        style={{
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        }}
      />
    </View>
  );
}
