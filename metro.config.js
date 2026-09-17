const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Web-only module shims: react-native-maps has no web implementation (stubbed)
// and expo-secure-store needs a localStorage-backed shim on web.
// Native (iOS/Android) resolution is left untouched.
const webShims = {
  "react-native-maps": path.resolve(__dirname, "web/map-stub.js"),
  "expo-secure-store": path.resolve(__dirname, "web/secure-store-shim.js"),
};
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const shim = platform === "web" && webShims[moduleName];
  if (shim) {
    return { filePath: shim, type: "sourceFile" };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
