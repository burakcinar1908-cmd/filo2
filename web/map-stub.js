import React from "react";
import { View } from "react-native";

const MapView = (props) => <View {...props} />;
const Marker = ({ children }) => <View>{children}</View>;

const PROVIDER_GOOGLE = "google";

export default MapView;
export { Marker, PROVIDER_GOOGLE };
