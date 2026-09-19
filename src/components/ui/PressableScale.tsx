import { useState, type ReactNode } from "react";
import { MotiView } from "moti";
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import { motion } from "../../theme/tokens";

type Props = PressableProps & {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** basiliyken uygulanacak olcek, varsayilan 0.97 */
  pressedScale?: number;
};

/** Sleek etkilesim: dokunmada hafif kuculme + saydamlasma, birakinda yaylanarak doner. */
export function PressableScale({ children, style, pressedScale = 0.97, ...rest }: Props) {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      {...rest}
    >
      <MotiView
        animate={{ scale: pressed ? pressedScale : 1, opacity: pressed ? 0.9 : 1 }}
        transition={{ type: "timing", duration: motion.fast }}
        style={style}
      >
        {children}
      </MotiView>
    </Pressable>
  );
}
