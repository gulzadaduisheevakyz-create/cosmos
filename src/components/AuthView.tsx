import React, { useState } from 'react';
import {
  Lock,
  User,
  KeyRound,
  ShieldAlert,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Eye,
  EyeOff,
  Sparkles,
  Mail,
  RefreshCw,
} from 'lucide-react';
import { UserAccount } from '../types';
import { db } from '../services/db';

interface AuthViewProps {
  onLoginSuccess: (user: UserAccount) => void;
  onReturnToLanding: () => void;
}

type AuthModalMode = 'none' | 'forgot-username' | 'forgot-password' | 'redeem-token' | 'first-login-change';

export const AuthView: React.FC<AuthViewProps> = ({
  onLoginSuccess,
  onReturnToLanding,
}) => {
  // Login form state
  const [username, setUsername] = useState('cosmos');
  const [password, setPassword] = useState('cosmos');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Modal mode
  const [modalMode, setModalMode] = useState<AuthModalMode>('none');

  // Pending user needing first-time password change
  const [pendingUser, setPendingUser] = useState<UserAccount | null>(null);
  const [firstNewPassword, setFirstNewPassword] = useState('');
  const [firstConfirmPassword, setFirstConfirmPassword] = useState('');
  const [firstPasswordError, setFirstPasswordError] = useState<string | null>(null);

  // Forgot Username state
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [usernameRecoveryResult, setUsernameRecoveryResult] = useState<{
    message: string;
    usernames?: string[];
  } | null>(null);

  // Forgot Password state
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetTokenResult, setResetTokenResult] = useState<{
    message: string;
    token?: string;
    emailDelivered: boolean;
  } | null>(null);

  // Redeem Token state
  const [redeemToken, setRedeemToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null);

  // Handle Standard Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoading(true);

    try {
      const res = await db.login(username, password);
      if (res.success && res.user) {
        if (res.user.mustChangePassword) {
          // Mandatory password update on first login!
          setPendingUser(res.user);
          setModalMode('first-login-change');
        } else {
          onLoginSuccess(res.user);
        }
      } else {
        setLoginError(res.error || 'Invalid credentials.');
      }
    } catch {
      setLoginError('Authentication service encountered an error.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle First-Time Mandatory Password Change
  const handleFirstTimePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingUser) return;
    setFirstPasswordError(null);

    if (firstNewPassword.length < 6) {
      setFirstPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (firstNewPassword === 'cosmos') {
      setFirstPasswordError('Please choose a new password different from the setup default "cosmos".');
      return;
    }
    if (firstNewPassword !== firstConfirmPassword) {
      setFirstPasswordError('Passwords do not match.');
      return;
    }

    try {
      const res = await db.changePassword(pendingUser.id, password, firstNewPassword);
      if (res.success) {
        const updatedUser = db.getUser(pendingUser.id);
        if (updatedUser) {
          db.setCurrentUser(updatedUser);
          onLoginSuccess(updatedUser);
        }
      } else {
        setFirstPasswordError(res.error || 'Failed to update password.');
      }
    } catch {
      setFirstPasswordError('An error occurred while setting your new password.');
    }
  };

  // Handle Forgot Username
  const handleForgotUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail || !recoveryEmail.includes('@')) {
      alert('Please enter a valid email address.');
      return;
    }

    const res = await db.requestUsernameRecovery(recoveryEmail);
    setUsernameRecoveryResult({
      message: res.message,
      usernames: res.usernames,
    });
  };

  // Handle Forgot Password Request
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetIdentifier) {
      alert('Please enter your username or registered email.');
      return;
    }

    const res = await db.requestPasswordReset(resetIdentifier);
    setResetTokenResult({
      message: res.message,
      token: res.token,
      emailDelivered: res.emailDelivered,
    });
    if (res.token) {
      setRedeemToken(res.token);
    }
  };

  // Handle Redeem Token
  const handleRedeemToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setRedeemError(null);
    setRedeemSuccess(null);

    if (!redeemToken.trim()) {
      setRedeemError('Please provide a reset token.');
      return;
    }
    if (newPassword.length < 6) {
      setRedeemError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setRedeemError('Passwords do not match.');
      return;
    }

    const res = await db.resetPasswordWithToken(redeemToken, newPassword);
    if (res.success) {
      setRedeemSuccess('Password reset successfully! You can now log in with your new password.');
      setTimeout(() => {
        setModalMode('none');
        setPassword('');
      }, 2000);
    } else {
      setRedeemError(res.error || 'Unable to reset password with this token.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-rose-950/30 via-slate-950 to-slate-950 pointer-events-none" />

      {/* Return to website button */}
      <button
        onClick={onReturnToLanding}
        className="absolute top-6 left-6 z-20 inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-rose-400 transition-colors bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-800"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Salon Website</span>
      </button>

      {/* Main Login Card */}
      <div className="max-w-md w-full relative z-10 space-y-6">
        {/* Salon Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-600 via-pink-600 to-purple-800 flex items-center justify-center text-white font-bold text-2xl mx-auto shadow-xl shadow-rose-950/60 border border-rose-400/30">
            CB
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-serif">
            Cosmos Beauty Salon
          </h1>
          <p className="text-xs text-rose-300 uppercase tracking-widest font-semibold">
            Staff & Management Portal
          </p>
        </div>

        {/* Auth Form Card */}
        <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-md space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-rose-400" />
              <span>Sign In to Access Management</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Enter your authorized Cosmos Beauty Salon username and password.
            </p>
          </div>

          {loginError && (
            <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Username</span>
                <button
                  type="button"
                  onClick={() => {
                    setUsernameRecoveryResult(null);
                    setModalMode('forgot-username');
                  }}
                  className="text-[11px] text-rose-400 hover:text-rose-300 font-normal"
                >
                  Forgot Username?
                </button>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. cosmos"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-hidden focus:border-rose-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Password</span>
                <button
                  type="button"
                  onClick={() => {
                    setResetTokenResult(null);
                    setModalMode('forgot-password');
                  }}
                  className="text-[11px] text-rose-400 hover:text-rose-300 font-normal"
                >
                  Forgot Password?
                </button>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-hidden focus:border-rose-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-purple-700 hover:from-rose-500 hover:to-purple-600 disabled:opacity-50 text-white font-semibold text-xs shadow-lg shadow-rose-950/60 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Sign In to Cosmos Portal</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Setup Hint & Designated Recovery Notice */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center justify-between text-slate-300 font-medium">
              <span>Initial Super Admin</span>
              <span className="font-mono text-rose-400">cosmos / cosmos</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-normal">
              First-time login automatically enforces a mandatory secure password change.
            </p>
          </div>
        </div>

        {/* Designated Admin Recovery Email Box */}
        <div className="text-center text-xs text-slate-500">
          <p>
            Administrative Recovery Email:{' '}
            <span className="text-slate-300 font-mono">cosmosbeautyqatar@gmail.com</span>
          </p>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 1. Mandatory First-Time Login Password Change Modal */}
      {/* ---------------------------------------------------- */}
      {modalMode === 'first-login-change' && pendingUser && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-xl bg-amber-950/80 border border-amber-700/60 flex items-center justify-center text-amber-400 mx-auto">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white font-serif">
                Mandatory First-Login Password Change
              </h3>
              <p className="text-xs text-slate-400">
                Welcome <span className="text-white font-semibold">{pendingUser.fullName}</span> (
                {pendingUser.username}). Because the initial setup password is simple, Cosmos
                security policy requires setting a strong new password before proceeding.
              </p>
            </div>

            {firstPasswordError && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{firstPasswordError}</span>
              </div>
            )}

            <form onSubmit={handleFirstTimePasswordChange} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  New Secure Password (min 6 characters)
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter your new secure password"
                  value={firstNewPassword}
                  onChange={(e) => setFirstNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-rose-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Confirm new password"
                  value={firstConfirmPassword}
                  onChange={(e) => setFirstConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-rose-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save New Password & Enter Dashboard</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 2. Forgot Username Modal */}
      {/* ---------------------------------------------------- */}
      {modalMode === 'forgot-username' && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-rose-400" />
                <span>Recover Account Username</span>
              </h3>
              <button
                onClick={() => setModalMode('none')}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Enter your registered staff recovery email address. If an account is found, username
              details will be transmitted.
            </p>

            {usernameRecoveryResult && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                <p className="text-emerald-300 font-medium">{usernameRecoveryResult.message}</p>
                {usernameRecoveryResult.usernames && usernameRecoveryResult.usernames.length > 0 && (
                  <div className="pt-2 border-t border-slate-800">
                    <p className="text-slate-400 text-[11px]">Associated User Account(s):</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {usernameRecoveryResult.usernames.map((u) => (
                        <span
                          key={u}
                          className="px-2 py-0.5 rounded bg-rose-950/80 border border-rose-800/60 text-rose-300 font-mono text-[11px]"
                        >
                          {u}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleForgotUsername} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Registered Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. cosmosbeautyqatar@gmail.com"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalMode('none')}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
                >
                  Find Username
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 3. Forgot Password Request Modal */}
      {/* ---------------------------------------------------- */}
      {modalMode === 'forgot-password' && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-rose-400" />
                <span>Reset Account Password</span>
              </h3>
              <button
                onClick={() => setModalMode('none')}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Enter your username or designated recovery email (
              <span className="font-mono text-slate-300">cosmosbeautyqatar@gmail.com</span>) to
              generate a secure, single-use password reset token.
            </p>

            {resetTokenResult && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-3">
                <p className="text-emerald-300 font-medium">{resetTokenResult.message}</p>
                {resetTokenResult.token && (
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-700 space-y-1">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">
                      Single-Use Reset Token (Valid 60m):
                    </p>
                    <p className="font-mono text-rose-400 font-bold text-xs select-all">
                      {resetTokenResult.token}
                    </p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setModalMode('redeem-token')}
                  className="w-full py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs"
                >
                  Proceed to Enter New Password
                </button>
              </div>
            )}

            {!resetTokenResult && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Username or Recovery Email
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. cosmos or cosmosbeautyqatar@gmail.com"
                    value={resetIdentifier}
                    onChange={(e) => setResetIdentifier(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-rose-500"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setModalMode('redeem-token')}
                    className="text-xs text-rose-400 hover:underline"
                  >
                    Already have a token?
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setModalMode('none')}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
                    >
                      Generate Token
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 4. Redeem Reset Token & Set New Password */}
      {/* ---------------------------------------------------- */}
      {modalMode === 'redeem-token' && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-rose-400" />
                <span>Enter Token & Set New Password</span>
              </h3>
              <button
                onClick={() => setModalMode('none')}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>

            {redeemError && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{redeemError}</span>
              </div>
            )}

            {redeemSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{redeemSuccess}</span>
              </div>
            )}

            <form onSubmit={handleRedeemToken} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Password Reset Token
                </label>
                <input
                  type="text"
                  required
                  placeholder="Paste token (e.g. rst-XXXXX...)"
                  value={redeemToken}
                  onChange={(e) => setRedeemToken(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-hidden focus:border-rose-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  New Password (min 6 characters)
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-rose-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Confirm Password</label>
                <input
                  type="password"
                  required
                  placeholder="Re-enter new password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalMode('none')}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
                >
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
