import { useEffect } from 'react';
import { useUIStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import { saveUserSettings } from '../firebase/userDoc';

export function useSettingsPersist() {
  const user = useAuthStore((s) => s.user);
  const settingsLoaded = useAuthStore((s) => s.settingsLoaded);
  const showHyperlanes = useUIStore((s) => s.showHyperlanes);
  const showOrbitRings = useUIStore((s) => s.showOrbitRings);
  const showAttractorLabels = useUIStore((s) => s.showAttractorLabels);

  useEffect(() => {
    if (!user || !settingsLoaded) return;
    saveUserSettings(user.uid, { showHyperlanes, showOrbitRings, showAttractorLabels });
  }, [user, settingsLoaded, showHyperlanes, showOrbitRings, showAttractorLabels]);
}
