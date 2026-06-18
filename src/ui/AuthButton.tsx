import { useAuthStore } from '../store/authStore';
import './AuthButton.css';

export function AuthButton() {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const signIn = useAuthStore((s) => s.signIn);
  const signOut = useAuthStore((s) => s.signOut);

  if (loading) return null;

  if (user) {
    return (
      <div className="auth-user">
        {user.photoURL && <img className="auth-avatar" src={user.photoURL} alt={user.displayName ?? ''} referrerPolicy="no-referrer" />}
        <button className="auth-btn" onClick={signOut}>Sign out</button>
      </div>
    );
  }

  return (
    <button className="auth-btn" onClick={signIn}>
      Sign in with Google
    </button>
  );
}
