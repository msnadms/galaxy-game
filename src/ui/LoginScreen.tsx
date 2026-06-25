import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import './LoginScreen.css';
import { SHIP_NAME } from './strings';

export function LoginScreen() {
  const authLoading = useAuthStore((s) => s.loading);
  const signIn = useAuthStore((s) => s.signIn);
  const [signingIn, setSigningIn] = useState(false);

  const handleSignIn = async () => {
    setSigningIn(true);
    try {
      await signIn();
    } catch {
      setSigningIn(false);
    }
  };

  const busy = authLoading || signingIn;

  return (
    <div className="login-overlay">
      <div className="login-panel">
        <div className="login-title">EPHAPSE-CLASS WARPSHIP | {SHIP_NAME}</div>
        <div className="login-divider" />
        {busy ? (
          <div className="login-status">Authenticating<span className="login-ellipsis" /></div>
        ) : (
          <>
            <div className="login-status">Authentication required to access navigation systems.</div>
            <button className="login-btn" onClick={handleSignIn}>
              Sign in with Google
            </button>
          </>
        )}
      </div>
    </div>
  );
}
