// components/PWAInstallPrompt.tsx
import { useEffect, useState } from 'react';
import { View, Text, Platform } from 'react-native';
import { useThemeContext } from '../src/contexts/ThemeContext';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const { colors } = useThemeContext();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handler = (e: BeforeInstallPromptEvent) => {
      console.log('📱 beforeinstallprompt event fired!');
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Show prompt after a short delay
      setTimeout(() => {
        setShowPrompt(true);
        setIsInstallable(true);
      }, 2000);
    };

    window.addEventListener('beforeinstallprompt', handler as EventListener);
    
    window.addEventListener('appinstalled', () => {
      console.log('🎉 App was installed');
      setShowPrompt(false);
      setIsInstallable(false);
      setDeferredPrompt(null);
    });

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('📱 App already installed');
      setShowPrompt(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler as EventListener);
    };
  }, []);

  const installPWA = async () => {
    if (!deferredPrompt) {
      console.log('No install prompt available');
      return;
    }
    
    console.log('📲 Triggering install prompt...');
    
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response: ${outcome}`);
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setShowPrompt(false);
        setIsInstallable(false);
        setDeferredPrompt(null);
      } else {
        // User dismissed, don't show again for this session
        setShowPrompt(false);
      }
    } catch (error) {
      console.error('❌ Error during install:', error);
    }
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
    // Show again after 1 week (simulated with localStorage)
    if (typeof window !== 'undefined') {
      localStorage.setItem('pwaPromptDismissed', Date.now().toString());
    }
  };

  // Check if we should show prompt based on previous dismissal
  useEffect(() => {
    if (Platform.OS !== 'web' || !isInstallable) return;

    const lastDismissed = localStorage.getItem('pwaPromptDismissed');
    if (lastDismissed) {
      const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      if (parseInt(lastDismissed) > oneWeekAgo) {
        setShowPrompt(false);
        return;
      }
    }
    
    setShowPrompt(true);
  }, [isInstallable]);

  if (Platform.OS !== 'web' || !showPrompt) {
    return null;
  }

  return (
    <View
      style={{
        position: 'fixed' as any,
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: colors.primary || '#007AFF',
        padding: 16,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 1000,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text
          style={{
            color: "white",
            fontSize: 14,
            fontWeight: "600",
            marginBottom: 4,
          }}
        >
          Install El Madrasa App
        </Text>
        <Text
          style={{
            color: "rgba(255,255,255,0.8)",
            fontSize: 12,
          }}
        >
          Get the full experience with offline access
        </Text>
      </View>
      
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <button
          onClick={dismissPrompt}
          style={{
            backgroundColor: 'transparent',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.3)',
            padding: '8px 16px',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: "500",
          }}
        >
          Later
        </button>
        <button
          onClick={installPWA}
          style={{
            backgroundColor: "white",
            color: colors.primary || '#007AFF',
            border: "none",
            padding: "8px 16px",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 14,
            fontWeight: "600",
          }}
        >
          Install
        </button>
      </View>
    </View>
  );
}