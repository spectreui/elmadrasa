// src/utils/appDetection.ts
export const detectAppInstallation = (scheme: string): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.location) {
      resolve(false);
      return;
    }

    // For web, we can't reliably detect if app is installed
    // But we can try to open it and fallback
    resolve(true);
  });
};

// Function to generate deep links for different platforms
export const generateDeepLink = (path: string, scheme: string): string => {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${scheme}://${cleanPath}`;
};
