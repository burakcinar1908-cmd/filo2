import { View, ActivityIndicator } from "react-native";
import { colors } from "../src/theme/colors";

// _layout.tsx zaten auth durumuna göre /(auth)/login veya /(driver|admin)/home adresine yönlendirir.
// Bu ekran yönlendirme gerçekleşene kadar kısa süreliğine görünür.
export default function Index() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );
}
