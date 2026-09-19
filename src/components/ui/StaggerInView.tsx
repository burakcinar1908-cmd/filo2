import type { ReactNode } from "react";
import { MotiView } from "moti";
import type { StyleProp, ViewStyle } from "react-native";
import { motion } from "../../theme/tokens";

type Props = {
  /** ogelerin listedeki sira — gecikme bundan hesaplanir */
  index?: number;
  /** kademeler arasi gecikme (ms) */
  delayStep?: number;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Ekrana giriste fade + slide-up; index ile kademeli (stagger) akis.
 *  Uzun listelerde beklemeyi onlemek icin gecikme 420ms'de sinirlanir. */
export function StaggerInView({ index = 0, delayStep = 60, children, style }: Props) {
  const delay = Math.min(index * delayStep, 420);
  return (
    <MotiView
      from={{ opacity: 0, translateY: 14 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: motion.normal, delay }}
      style={style}
    >
      {children}
    </MotiView>
  );
}
