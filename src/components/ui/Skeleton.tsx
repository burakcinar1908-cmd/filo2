import { MotiView } from "moti";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { colors } from "../../theme/colors";
import { radius } from "../../theme/tokens";

/** Yukleme yer tutucusu: yumusak nabiz animasyonu. Yükseklik cagiran taraf verir. */
export function Skeleton({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.surfaceAlt,
          borderRadius: radius.md,
          overflow: "hidden",
          alignSelf: "stretch",
        },
        style,
      ]}
    >
      <MotiView
        from={{ opacity: 0.35 }}
        animate={{ opacity: 0.9 }}
        transition={{ type: "timing", duration: 800, loop: true, repeatReverse: true }}
        style={{ flex: 1, backgroundColor: colors.surfaceRaised, borderRadius: radius.md }}
      />
    </View>
  );
}
