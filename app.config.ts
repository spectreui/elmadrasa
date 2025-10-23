import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Elmadrasa",
  slug: "school-app",
  scheme: "elmadrasa",
  userInterfaceStyle: "automatic",
  jsEngine: "hermes",

  plugins: [
    "expo-router",
    "expo-font",
    [
      "expo-notifications",
      {
        icon: "./assets/images/notification-icon.png",
        color: "#3b82f6",
        sounds: ["./assets/sounds/notification.mp3"],
        defaultChannel: "default",
        enableBackgroundRemoteNotifications: true,
      },
    ],
    "expo-localization",
  ],

  experiments: {
    typedRoutes: true,
  },

  android: {
    jsEngine: "hermes",
    package: "com.elmadrasa.app",
    permissions: ["NOTIFICATIONS"],
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          {
            scheme: "https",
            host: "elmadrasa.vercel.app",
            pathPrefix: "/",
          },
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          {
            scheme: "https",
            host: "elmadrasa-link.vercel.app",
            pathPrefix: "/",
          },
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },

  ios: {
    bundleIdentifier: "com.elmadrasa.app",
    associatedDomains: [
      "applinks:elmadrasa-link.vercel.app",
      "applinks:elmadrasa.vercel.app",
    ],
    infoPlist: {
      UIBackgroundModes: ["remote-notification"],
      ITSAppUsesNonExemptEncryption: false,
      ExpoLocalization_supportsRTL: true,
    },
    buildNumber: "3",
  },

  web: {
    bundler: "metro",
    output: "server",
    favicon: "./assets/icons/favicon.png",
    name: "Elmadrasa",
    shortName: "Elmadrasa",
    description: "Educational platform for students and teachers",
    themeColor: "#007AFF",
    backgroundColor: "#0F172A",
    display: "standalone",
    orientation: "portrait",
    scope: "/",
    startUrl: ".",
    icons: [
      { src: "./assets/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "./assets/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    dangerous: {
      serviceWorkerPath: "service-worker.js",
    },
  },

  extra: {
    router: {},
    supportsRTL: true,
    eas: {
      projectId: "4c592a84-1ac8-4407-97a4-c6c5cb492f84",
    },
  },

  owner: "spectreui",
});
