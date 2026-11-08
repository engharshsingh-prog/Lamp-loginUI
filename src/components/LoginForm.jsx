import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2, Sparkles, KeyRound, LogOut, AlertCircle } from 'lucide-react';
import { soundManager } from '../utils/soundEffects';

// Lightweight in-house golden sparkle confetti
function launchSparkleConfetti() {
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '9999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  const colors = ['#fde047', '#facc15', '#eab308', '#ffffff', '#fbbf24', '#f59e0b'];

  for (let i = 0; i < 90; i++) {
    particles.push({
      x: canvas.width * 0.72, // Center of login card
      y: canvas.height * 0.52,
      vx: (Math.random() - 0.5) * 16,
      vy: (Math.random() - 0.7) * 16,
      size: Math.random() * 6 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      rotation: Math.random() * 360,
      vRotation: (Math.random() - 0.5) * 12,
    });
  }

  let animationFrame;
  const render = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;

    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35; // gravity
      p.vx *= 0.98; // air resistance
      p.alpha -= 0.014;
      p.rotation += p.vRotation;

      if (p.alpha > 0) {
        alive = true;
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.4);
        ctx.restore();
      }
    });

    if (alive) {
      animationFrame = requestAnimationFrame(render);
    } else {
      cancelAnimationFrame(animationFrame);
      if (document.body.contains(canvas)) {
        document.body.removeChild(canvas);
      }
    }
  };

  render();
}

export default function LoginForm({ isLampOn }) {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup' | 'forgot'
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const firstInputRef = useRef(null);

  // Auto-focus first input when lamp reveals the card
  useEffect(() => {
    if (isLampOn && !loggedInUser) {
      const timer = setTimeout(() => {
        firstInputRef.current?.focus();
      }, 650);
      return () => clearTimeout(timer);
    }
  }, [isLampOn, loggedInUser, mode]);

  // Form fields
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Password strength calculation
  const getPasswordStrength = (pass) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 6) score++;
    if (pass.length >= 10) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return Math.min(4, score);
  };

  const strength = getPasswordStrength(formData.password);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFocus = () => {
    soundManager.playSoftClick();
  };

  const handleKeyDown = (e) => {
    if (e.getModifierState && e.getModifierState('CapsLock')) {
      setCapsLockActive(true);
    } else {
      setCapsLockActive(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    soundManager.playSoftClick();

    if (!formData.email || (mode !== 'forgot' && !formData.password)) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    if (mode === 'signup' && formData.password !== formData.confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    setIsLoading(true);

    // Simulate authentication API call
    setTimeout(() => {
      setIsLoading(false);
      if (mode === 'signin' || mode === 'signup') {
        const username = formData.username || formData.email.split('@')[0];
        setLoggedInUser({
          username,
          email: formData.email,
        });
        launchSparkleConfetti();
        showToast(
          mode === 'signin'
            ? `Welcome back, ${username}!`
            : `Account created successfully! Welcome, ${username}!`,
          'success'
        );
      } else {
        showToast('Password reset link sent to your email.', 'success');
        setMode('signin');
      }
    }, 1100);
  };

  const handleSocialLogin = (provider) => {
    soundManager.playSoftClick();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const socialUser = provider === 'Google' ? 'Alex Rivera' : 'alex-rivera';
      setLoggedInUser({
        username: socialUser,
        email: `${socialUser.toLowerCase().replace(' ', '.')}@example.com`,
        provider,
      });
      launchSparkleConfetti();
      showToast(`Successfully authenticated with ${provider}!`, 'success');
    }, 900);
  };

  const handleSignOut = () => {
    soundManager.playSoftClick();
    setLoggedInUser(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    });
    showToast('Signed out successfully.', 'success');
  };

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  return (
    <div
      className={`relative z-20 w-full max-w-[460px] mx-auto transition-all duration-700 ease-out transform ${
        isLampOn
          ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
          : 'opacity-0 translate-y-8 scale-95 pointer-events-none'
      }`}
    >
      {/* Toast Notification */}
      {notification && (
        <div
          className={`absolute -top-16 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-xl border flex items-center gap-2.5 shadow-2xl backdrop-blur-xl text-sm font-medium z-50 animate-bounce transition-all ${
            notification.type === 'success'
              ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-200'
              : 'bg-rose-500/20 border-rose-500/40 text-rose-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-yellow-400 shrink-0" />
          ) : (
            <Sparkles className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Main Glassmorphism Card */}
      <div className="glass-panel rounded-[28px] p-7 sm:p-9 shadow-card-glow relative overflow-hidden backdrop-blur-2xl">
        {/* Subtle interior lighting edge reflection */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-yellow-400/40 to-transparent" />
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* LOGGED IN STATE */}
        {loggedInUser ? (
          <div className="py-6 text-center space-y-6">
            <div className="relative inline-block">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 p-[3px] shadow-[0_0_30px_rgba(250,204,21,0.5)] mx-auto">
                <div className="w-full h-full rounded-full bg-zinc-950 flex items-center justify-center text-yellow-400 font-extrabold text-2xl font-['Outfit']">
                  {loggedInUser.username.slice(0, 2).toUpperCase()}
                </div>
              </div>
              <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-zinc-900 flex items-center justify-center text-[10px] text-white font-bold">
                ✓
              </span>
            </div>

            <div className="space-y-1.5">
              <h2 className="text-2xl font-extrabold text-white font-['Outfit']">
                Welcome back, {loggedInUser.username}!
              </h2>
              <p className="text-zinc-400 text-xs sm:text-sm font-normal">
                {loggedInUser.email}
              </p>
              {loggedInUser.provider && (
                <span className="inline-block mt-1 px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/25 text-yellow-300 text-xs font-medium">
                  Authenticated via {loggedInUser.provider}
                </span>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/5 text-left text-xs text-zinc-300 space-y-2">
              <div className="flex items-center justify-between text-zinc-400">
                <span>Account Status:</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Active
                </span>
              </div>
              <div className="flex items-center justify-between text-zinc-400">
                <span>Session Security:</span>
                <span className="text-yellow-400 font-medium">End-to-End Encrypted</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-3">
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full py-3 px-4 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 border border-white/10 hover:border-rose-400/30 text-zinc-300 hover:text-rose-200 transition-colors flex items-center justify-center gap-2 text-xs font-semibold"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>Sign Out of Account</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Card Header */}
            <div className="text-center mb-7">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-['Outfit']">
                {mode === 'signin' && 'Welcome Back'}
                {mode === 'signup' && 'Create Account'}
                {mode === 'forgot' && 'Reset Password'}
              </h1>
              <p className="text-zinc-400 text-xs sm:text-sm mt-1.5 font-normal">
                {mode === 'signin' && 'Enter your details to access your account'}
                {mode === 'signup' && 'Join us today and unlock exclusive features'}
                {mode === 'forgot' && 'Enter your email to receive recovery instructions'}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Field (matching reference image) */}
              {mode !== 'forgot' && (
                <div className="space-y-1">
                  <div className="glass-input rounded-2xl flex items-center px-4 py-3.5 group focus-within:border-yellow-400/60 focus-within:shadow-[0_0_15px_rgba(250,204,21,0.15)]">
                    <User className="w-5 h-5 text-zinc-500 group-focus-within:text-yellow-400 transition-colors mr-3 shrink-0" />
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      onFocus={handleFocus}
                      placeholder={mode === 'signup' ? 'Choose a username' : 'Username'}
                      className="w-full bg-transparent border-none outline-none text-sm text-zinc-100 placeholder-zinc-500 focus:ring-0"
                    />
                  </div>
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-1">
                <div className="glass-input rounded-2xl flex items-center px-4 py-3.5 group focus-within:border-yellow-400/60 focus-within:shadow-[0_0_15px_rgba(250,204,21,0.15)]">
                  <Mail className="w-5 h-5 text-zinc-500 group-focus-within:text-yellow-400 transition-colors mr-3 shrink-0" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    placeholder="Email Address"
                    className="w-full bg-transparent border-none outline-none text-sm text-zinc-100 placeholder-zinc-500 focus:ring-0"
                  />
                </div>
              </div>

              {/* Password Field */}
              {mode !== 'forgot' && (
                <div className="space-y-1">
                  <div className="glass-input rounded-2xl flex items-center px-4 py-3.5 group focus-within:border-yellow-400/60 focus-within:shadow-[0_0_15px_rgba(250,204,21,0.15)] relative">
                    <Lock className="w-5 h-5 text-zinc-500 group-focus-within:text-yellow-400 transition-colors mr-3 shrink-0" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      onFocus={handleFocus}
                      onKeyDown={handleKeyDown}
                      onKeyUp={handleKeyDown}
                      placeholder="Password"
                      className="w-full bg-transparent border-none outline-none text-sm text-zinc-100 placeholder-zinc-500 focus:ring-0"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setShowPassword(!showPassword);
                        soundManager.playSoftClick();
                      }}
                      className="text-zinc-500 hover:text-zinc-300 transition-colors ml-2 focus:outline-none"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-yellow-400/80" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* CapsLock Warning */}
                  {capsLockActive && (
                    <div className="flex items-center gap-1.5 text-[11px] text-amber-300 px-1 pt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Caps Lock is ON</span>
                    </div>
                  )}

                  {/* Password strength meter in Sign Up mode */}
                  {mode === 'signup' && formData.password.length > 0 && (
                    <div className="pt-1.5 px-1 space-y-1">
                      <div className="flex gap-1 h-1">
                        {[1, 2, 3, 4].map((step) => (
                          <div
                            key={step}
                            className={`flex-1 rounded-full transition-all duration-300 ${
                              step <= strength
                                ? strength === 1
                                  ? 'bg-rose-500'
                                  : strength === 2
                                  ? 'bg-amber-500'
                                  : strength === 3
                                  ? 'bg-yellow-400'
                                  : 'bg-emerald-400'
                                : 'bg-zinc-800'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-[10px] text-zinc-400">
                        Strength:{' '}
                        <span className="font-medium text-zinc-200">
                          {['Weak', 'Fair', 'Good', 'Strong'][strength - 1] || 'Too short'}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Confirm Password (only for signup) */}
              {mode === 'signup' && (
                <div className="space-y-1">
                  <div className="glass-input rounded-2xl flex items-center px-4 py-3.5 group focus-within:border-yellow-400/60">
                    <KeyRound className="w-5 h-5 text-zinc-500 group-focus-within:text-yellow-400 transition-colors mr-3 shrink-0" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      onFocus={handleFocus}
                      placeholder="Confirm Password"
                      className="w-full bg-transparent border-none outline-none text-sm text-zinc-100 placeholder-zinc-500 focus:ring-0"
                    />
                  </div>
                </div>
              )}

              {/* Options Row: Remember Me & Forgot Password */}
              {mode === 'signin' && (
                <div className="flex items-center justify-between text-xs pt-1 pb-1">
                  <label className="flex items-center gap-2 cursor-pointer text-zinc-400 hover:text-zinc-300 transition-colors">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 rounded bg-zinc-800 border-zinc-700 text-yellow-500 focus:ring-yellow-400 focus:ring-offset-zinc-900"
                    />
                    <span>Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      soundManager.playSoftClick();
                    }}
                    className="text-yellow-400/90 hover:text-yellow-300 transition-colors font-medium hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              {/* Primary Action Button (Yellow Lamp Button matching reference) */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-lamp py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 font-semibold text-sm tracking-wide mt-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>
                      {mode === 'signin' && 'Sign In'}
                      {mode === 'signup' && 'Create Account'}
                      {mode === 'forgot' && 'Send Reset Link'}
                    </span>
                    <ArrowRight className="w-4 h-4 ml-0.5" />
                  </>
                )}
              </button>
            </form>

            {/* OR CONTINUE WITH Divider */}
            {mode !== 'forgot' && (
              <>
                <div className="relative my-6 text-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-800/80" />
                  </div>
                  <span className="relative bg-[#111116] px-3 text-[11px] font-medium tracking-wider text-zinc-500 uppercase">
                    Or continue with
                  </span>
                </div>

                {/* Social Logins: Google & GitHub */}
                <div className="grid grid-cols-2 gap-3.5">
                  {/* Google Button */}
                  <button
                    type="button"
                    onClick={() => handleSocialLogin('Google')}
                    className="btn-social py-2.5 px-4 rounded-2xl flex items-center justify-center gap-2.5 text-xs font-medium"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Google</span>
                  </button>

                  {/* GitHub Button */}
                  <button
                    type="button"
                    onClick={() => handleSocialLogin('GitHub')}
                    className="btn-social py-2.5 px-4 rounded-2xl flex items-center justify-center gap-2.5 text-xs font-medium"
                  >
                    <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      />
                    </svg>
                    <span>GitHub</span>
                  </button>
                </div>
              </>
            )}

            {/* Footer Toggle between Sign In / Sign Up */}
            <div className="mt-7 text-center text-xs text-zinc-400">
              {mode === 'signin' && (
                <p>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      soundManager.playSoftClick();
                    }}
                    className="text-yellow-400 font-semibold hover:text-yellow-300 transition-colors ml-1 hover:underline"
                  >
                    Sign up
                  </button>
                </p>
              )}

              {mode === 'signup' && (
                <p>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      soundManager.playSoftClick();
                    }}
                    className="text-yellow-400 font-semibold hover:text-yellow-300 transition-colors ml-1 hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              )}

              {mode === 'forgot' && (
                <p>
                  Remember your password?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      soundManager.playSoftClick();
                    }}
                    className="text-yellow-400 font-semibold hover:text-yellow-300 transition-colors ml-1 hover:underline"
                  >
                    Back to login
                  </button>
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
