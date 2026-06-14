'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { isRealSupabase } from '@/lib/supabaseClient';
import { Sun, Moon, LogIn, User, LogOut, ShieldAlert, Activity, Menu, X } from 'lucide-react';

export default function Navbar() {
  const { profile, signOut } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [menuOpen, setMenuOpen] = useState(false);

  // Initialize theme from system or classlist
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark') || 
                   (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
      document.documentElement.classList.add('dark');
      setTheme('dark');
    } else {
      document.documentElement.classList.remove('dark');
      setTheme('light');
    }
  }, []);

  const toggleTheme = () => {
    if (theme === 'light') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setTheme('dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setTheme('light');
    }
  };

  const getDashboardLink = () => {
    if (!profile) return '/auth';
    return `/dashboard/${profile.role}`;
  };

  return (
    <nav className="sticky top-0 z-50 glass-panel border-b border-white/10 px-4 py-3 md:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
            <Activity className="w-6 h-6 text-white animate-pulse" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent tracking-wide">
            NovaCare
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8 font-medium">
          <Link href="/#services" className="text-foreground/80 hover:text-primary transition">Services</Link>
          <Link href="/#doctors" className="text-foreground/80 hover:text-primary transition">Specialists</Link>
          <Link href="/#faq" className="text-foreground/80 hover:text-primary transition">FAQ</Link>
          <Link href="/#emergency" className="text-red-500 hover:text-red-400 font-semibold transition flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping inline-block" />
            Emergency
          </Link>
        </div>

        {/* Right side controls */}
        <div className="hidden md:flex items-center gap-4">
          {/* Demo Mode Badge */}
          {!isRealSupabase ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <ShieldAlert className="w-3.5 h-3.5" />
              Demo Mode
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Connected
            </div>
          )}

          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-lg text-foreground/75 hover:bg-foreground/5 hover:text-primary transition"
            aria-label="Toggle Theme"
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>

          {/* User controls */}
          {profile ? (
            <div className="flex items-center gap-3">
              <Link 
                href={getDashboardLink()} 
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 hover:from-primary/20 hover:to-secondary/20 border border-primary/20 text-foreground text-sm font-semibold transition"
              >
                <User className="w-4 h-4 text-primary" />
                Dashboard ({profile.role})
              </Link>
              <button 
                onClick={signOut}
                className="p-2 rounded-xl border border-border text-foreground/75 hover:bg-red-500/10 hover:text-red-500 transition"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link 
              href="/auth" 
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/25 text-white text-sm font-bold transition duration-300"
            >
              <LogIn className="w-4 h-4" />
              Portal Login
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-2">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-lg text-foreground/75 hover:bg-foreground/5 transition"
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
          
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-lg text-foreground/75 hover:bg-foreground/5 transition"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="md:hidden mt-3 pt-3 border-t border-border flex flex-col gap-4 animate-in slide-in-from-top duration-300">
          <Link 
            href="/#services" 
            onClick={() => setMenuOpen(false)}
            className="text-foreground/80 hover:text-primary transition py-1"
          >
            Services
          </Link>
          <Link 
            href="/#doctors" 
            onClick={() => setMenuOpen(false)}
            className="text-foreground/80 hover:text-primary transition py-1"
          >
            Specialists
          </Link>
          <Link 
            href="/#faq" 
            onClick={() => setMenuOpen(false)}
            className="text-foreground/80 hover:text-primary transition py-1"
          >
            FAQ
          </Link>
          <Link 
            href="/#emergency" 
            onClick={() => setMenuOpen(false)}
            className="text-red-500 hover:text-red-400 font-semibold transition py-1 flex items-center gap-2"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping inline-block" />
            Emergency Contacts
          </Link>

          {!isRealSupabase && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20 w-max">
              <ShieldAlert className="w-3.5 h-3.5" />
              Demo Mode Active
            </div>
          )}

          {profile ? (
            <div className="flex flex-col gap-2 pt-2 border-t border-border">
              <Link 
                href={getDashboardLink()}
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-semibold text-center text-sm"
              >
                <User className="w-4 h-4" />
                Go to Dashboard ({profile.role})
              </Link>
              <button 
                onClick={() => { signOut(); setMenuOpen(false); }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/20 text-red-500 font-semibold text-sm hover:bg-red-500/5 transition"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          ) : (
            <Link 
              href="/auth"
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-semibold text-center text-sm"
            >
              <LogIn className="w-4 h-4" />
              Portal Login
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
