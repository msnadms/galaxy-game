import { useEffect } from 'react';
import { useUIStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import { saveUserSettings } from '../firebase/userDoc';

export function useSettingsPersist() {
  const user = useAuthStore((s) => s.user);
  const settingsLoaded = useAuthStore((s) => s.settingsLoaded);
  const showOrbitRings = useUIStore((s) => s.showOrbitRings);
  const showAttractorLabels = useUIStore((s) => s.showAttractorLabels);
  const showHUD = useUIStore((s) => s.showHUD);
  const exoticMatter = useUIStore((s) => s.exoticMatter);
  const driveIntegrity = useUIStore((s) => s.driveIntegrity);
  const railgunAmmo = useUIStore((s) => s.railgunAmmo);
  const helium3Reserves = useUIStore((s) => s.helium3Reserves);

  useEffect(() => {
    if (!user || !settingsLoaded) return;
    saveUserSettings(user.uid, { showOrbitRings, showAttractorLabels, showHUD, exoticMatter, driveIntegrity, railgunAmmo, helium3Reserves });
  }, [user, settingsLoaded, showOrbitRings, showAttractorLabels, showHUD, exoticMatter, driveIntegrity, railgunAmmo, helium3Reserves]);
}
