import { create } from 'zustand';
import { signInWithPopup, signOut, onAuthStateChanged, type User } from 'firebase/auth';
import { auth, googleProvider } from '../firebase/firebase';
import { initUserDoc } from '../firebase/userDoc';
import { useUIStore } from './uiStore';

interface AuthState {
  user: User | null;
  loading: boolean;
  settingsLoaded: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const settings = await initUserDoc(user);
      useUIStore.setState({
        showHyperlanes: settings.showHyperlanes,
        showOrbitRings: settings.showOrbitRings,
        showAttractorLabels: settings.showAttractorLabels,
      });
      set({ user, loading: false, settingsLoaded: true });
    } else {
      set({ user: null, loading: false, settingsLoaded: false });
    }
  });

  return {
    user: null,
    loading: true,
    settingsLoaded: false,
    signIn: async () => {
      await signInWithPopup(auth, googleProvider);
    },
    signOut: async () => {
      await signOut(auth);
    },
  };
});
