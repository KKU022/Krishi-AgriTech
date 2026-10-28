import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sprout, Mail, Lock, User, Eye, EyeOff, ShieldCheck, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { Button } from '../components/common/Button.js';
import { Input } from '../components/common/Input.js';
import { Select } from '../components/common/Select.js';
import { Card } from '../components/common/Card.js';
import { Alert } from '../components/common/Alert.js';
import { GoogleSignInButton } from '../components/common/GoogleSignInButton.js';
import { Language } from '../types.js';

export const SignupPage: React.FC = () => {
  const { signup, signInWithGoogle, signInWithGoogleCredential } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [language, setLanguage] = useState<Language>('en');
  const [showPassword, setShowPassword] = useState(false);

  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Video background
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile =
    typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;
  const showVideo = !prefersReducedMotion && !isMobile;

  useEffect(() => {
    if (showVideo && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [showVideo]);

  const validate = () => {
    let isValid = true;
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setServerError('');

    if (!fullName.trim()) {
      setNameError('Please enter your full name.');
      isValid = false;
    }

    if (!email.trim()) {
      setEmailError('Please enter your email address.');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email format.');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Please enter a secure password.');
      isValid = false;
    } else if (password.length < 8) {
      setPasswordError('Password must contain at least 8 characters for account security.');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      await signup(fullName, email, password, language);
      toast.success('Account created', 'Welcome to AgriTech! Let’s complete your farm profile.');
      navigate('/onboarding');
    } catch (err: any) {
      const msg = err.message || 'Unable to register account. Please retry.';
      setServerError(msg);
      toast.error('Registration failed', msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleCredential = async (idToken: string) => {
    setServerError('');
    setIsGoogleLoading(true);
    try {
      const result = await signInWithGoogleCredential(idToken);
      toast.success('Welcome to AgriTech', 'Google authentication verified.');
      if (result.isNewUser) {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      const msg = err.message || 'Google Sign-In failed. Please try again.';
      setServerError(msg);
      toast.error('Google Sign-In notice', msg);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setServerError('');
    setIsGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      toast.success('Welcome to AgriTech', 'Google authentication verified.');
      if (result.isNewUser) {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      const msg = err.message || 'Google Sign-In failed. Please try again.';
      setServerError(msg);
      toast.error('Google Sign-In failed', msg);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-[#071B13]">
      {/* === Cinematic video background === */}
      {showVideo ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          poster="/images/hero-cinematic-forest-field.jpg"
          onCanPlay={() => setVideoReady(true)}
          onError={() => setVideoReady(false)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${videoReady ? 'opacity-100' : 'opacity-0'}`}
          style={{ filter: 'brightness(0.55) saturate(1.1) contrast(1.05)' }}
        >
          <source src="/videos/hero-golden-crops.webm" type="video/webm" />
        </video>
      ) : (
        <img
          src="/images/hero-cinematic-forest-field.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{ filter: 'brightness(0.45) saturate(1.05)' }}
        />
      )}

      {/* Overlay — right side slightly lighter to let golden crop rows show */}
      <div className="absolute inset-0 bg-gradient-to-l from-[#071B13]/85 via-[#071B13]/65 to-[#071B13]/90 pointer-events-none" />
      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#071B13] to-transparent pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[480px] h-[480px] bg-emerald-500/8 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10 auth-card-enter">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-3 group">
            <div className="w-11 h-11 rounded-2xl bg-[#0D3022] border border-emerald-500/30 flex items-center justify-center text-white shadow-lg group-hover:bg-[#145336] transition-colors">
              <Sprout className="w-6 h-6 text-[#54F5BC]" />
            </div>
            <span className="font-extrabold text-2xl font-display text-white tracking-tight">AgriTech Bharat</span>
          </Link>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-white tracking-tight">
            Create Farmer Account
          </h2>
          <p className="text-xs sm:text-sm text-[#B6F5D9]/80 mt-1">
            Build your parameterized farm profile for personalized crop and weather guidance.
          </p>
        </div>

        <Card variant="emerald-glass" className="space-y-6 p-6 sm:p-8 shadow-2xl">
          {serverError && (
            <Alert variant="error" className="text-xs">
              {serverError}
            </Alert>
          )}

          {/* 1-Click Google Sign-In */}
          <div className="space-y-3">
            <GoogleSignInButton
              onClick={handleGoogleSignIn}
              onCredential={handleGoogleCredential}
              isLoading={isGoogleLoading}
              disabled={isLoading}
              label="Sign up with Google"
            />

            <div className="relative flex items-center justify-center my-2">
              <div className="border-t border-white/10 w-full" />
              <span className="bg-[#071B13] px-3 text-[11px] font-bold text-[#A3B5AA] uppercase tracking-wider relative rounded-md border border-white/10">
                Or with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              placeholder="e.g. Gurpreet Singh"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              error={nameError}
              autoComplete="name"
              required
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="farmer@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={emailError}
              autoComplete="email"
              required
            />

            <div className="relative">
              <Input
                label="Password (Minimum 8 characters)"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={passwordError}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-[#A3B5AA] hover:text-white transition-colors cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <Select
              label="Preferred Advisory Language"
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              options={[
                { value: 'en', label: 'English' },
                { value: 'hi', label: 'हिंदी (Hindi)' },
              ]}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full justify-center text-sm sm:text-base mt-2"
              isLoading={isLoading}
              disabled={isGoogleLoading}
            >
              Register & Begin Farm Setup
            </Button>
          </form>

          {/* Privacy note */}
          <div className="p-3 bg-black/40 rounded-2xl border border-emerald-500/20 text-[11px] text-[#B6F5D9] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#00B879] shrink-0" />
            <span>Private & isolated storage. Instant data deletion honored anytime.</span>
          </div>

          <div className="text-center text-xs text-[#A3B5AA] pt-2 border-t border-white/10">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-[#54F5BC] hover:text-white transition-colors">
              Log in here
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
