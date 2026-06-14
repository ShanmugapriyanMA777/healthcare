'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { isRealSupabase } from '@/lib/supabaseClient';
import { LogIn, UserPlus, Mail, Lock, User, Phone, CheckCircle, Info, Stethoscope, Briefcase, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AuthPage() {
  const { user, profile, signIn, signUp, loading } = useAuth();
  const router = useRouter();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'patient' | 'doctor'>('patient');

  // Role-specific fields
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [allergies, setAllergies] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  
  const [specialization, setSpecialization] = useState('General Medicine');
  const [qualification, setQualification] = useState('MBBS');
  const [experience, setExperience] = useState('5');
  const [consultationFee, setConsultationFee] = useState('500');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (user && profile) {
      router.push(`/dashboard/${profile.role}`);
    }
  }, [user, profile, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg('Successfully logged in! Redirecting...');
      }
    } else {
      // Validate inputs
      if (!name || !email || !password) {
        setErrorMsg('Please fill out all required fields.');
        return;
      }

      const additionalData: any = {
        name,
        role,
        phone,
        profile_image: `https://api.dicebear.com/7.x/adventurer/svg?seed=${name}`,
      };

      if (role === 'patient') {
        additionalData.blood_group = bloodGroup;
        additionalData.allergies = allergies;
        additionalData.medical_history = medicalHistory;
      } else {
        additionalData.specialization = specialization;
        additionalData.qualification = qualification;
        additionalData.experience = Number(experience);
        additionalData.consultation_fee = Number(consultationFee);
      }

      const { error } = await signUp(email, password, additionalData);
      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg('Registration successful! You can now log in.');
        setIsLogin(true);
      }
    }
  };

  const loadDemoAccount = (demoRole: 'patient' | 'doctor' | 'admin') => {
    setErrorMsg('');
    setIsLogin(true);
    if (demoRole === 'patient') {
      setEmail('patient@healthcare.com');
      setPassword('patient123');
    } else if (demoRole === 'doctor') {
      setEmail('sarah.jenkins@healthcare.com');
      setPassword('doctor123');
    } else if (demoRole === 'admin') {
      setEmail('admin@healthcare.com');
      setPassword('admin123');
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center p-4 md:p-8 bg-gradient-to-br from-background via-muted/30 to-background min-h-[calc(100vh-70px)] relative">
      {/* Decorative blurred backgrounds */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/5 rounded-full blur-3xl" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg glass-panel border border-white/10 rounded-3xl overflow-hidden shadow-2xl p-6 md:p-8 space-y-6 relative z-10"
      >
        {/* Portal Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center mx-auto shadow-md">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold text-foreground">
            {isLogin ? 'NovaCare Medical Portal' : 'Create Patient or Doctor Account'}
          </h2>
          <p className="text-xs text-muted-foreground">
            {isLogin ? 'Access your medical dashboard and appointments' : 'Sign up to manage reports or check schedules'}
          </p>
        </div>

        {/* Demo Accounts Tip Panel */}
        {!isRealSupabase && isLogin && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-500">
              <Info className="w-4 h-4 shrink-0" />
              Demo mode shortcuts:
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => loadDemoAccount('patient')}
                className="py-1 px-2.5 rounded-lg bg-card hover:bg-muted font-bold text-foreground border border-border transition text-[10px]"
              >
                Patient Login
              </button>
              <button 
                onClick={() => loadDemoAccount('doctor')}
                className="py-1 px-2.5 rounded-lg bg-card hover:bg-muted font-bold text-foreground border border-border transition text-[10px]"
              >
                Doctor Login
              </button>
              <button 
                onClick={() => loadDemoAccount('admin')}
                className="py-1 px-2.5 rounded-lg bg-card hover:bg-muted font-bold text-foreground border border-border transition text-[10px]"
              >
                Admin Login
              </button>
            </div>
          </div>
        )}

        {/* Status Alerts */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/20 text-xs text-red-500 font-semibold">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/20 text-xs text-emerald-500 font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            {successMsg}
          </div>
        )}

        {/* Auth form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {!isLogin && (
            <div className="space-y-4">
              {/* Full Name */}
              <div className="relative">
                <User className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Full Name *"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-border bg-card focus:outline-none focus:border-primary transition"
                  required
                />
              </div>

              {/* Mobile Phone */}
              <div className="relative">
                <Phone className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
                <input 
                  type="tel" 
                  placeholder="Mobile Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-border bg-card focus:outline-none focus:border-primary transition"
                />
              </div>

              {/* Role selector */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">I want to register as a:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('patient')}
                    className={`py-2.5 rounded-xl text-xs font-bold transition border ${
                      role === 'patient' 
                        ? 'bg-gradient-to-r from-primary to-secondary text-white border-transparent' 
                        : 'bg-card border-border text-foreground hover:bg-muted'
                    }`}
                  >
                    Patient Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('doctor')}
                    className={`py-2.5 rounded-xl text-xs font-bold transition border ${
                      role === 'doctor' 
                        ? 'bg-gradient-to-r from-primary to-secondary text-white border-transparent' 
                        : 'bg-card border-border text-foreground hover:bg-muted'
                    }`}
                  >
                    Medical Doctor
                  </button>
                </div>
              </div>

              {/* Role specific forms */}
              {role === 'patient' ? (
                <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-3">
                  <p className="text-xs font-bold text-primary">Patient Demographics</p>
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <label className="text-xs text-muted-foreground font-semibold col-span-1">Blood Type</label>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className="col-span-2 px-3 py-1.5 text-xs rounded-lg border border-border bg-card"
                    >
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                  
                  <input 
                    type="text" 
                    placeholder="Allergies (e.g. Penicillin, Pollen)"
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-card"
                  />

                  <textarea 
                    placeholder="Medical history highlights..."
                    value={medicalHistory}
                    onChange={(e) => setMedicalHistory(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-card resize-none"
                  />
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-3">
                  <p className="text-xs font-bold text-secondary">Clinical Registration</p>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-muted-foreground font-bold uppercase">Specialty</label>
                      <select 
                        value={specialization}
                        onChange={(e) => setSpecialization(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs rounded-lg border border-border bg-card mt-1"
                      >
                        {['Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'General Medicine'].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-muted-foreground font-bold uppercase">Degree</label>
                      <input 
                        type="text" 
                        value={qualification}
                        onChange={(e) => setQualification(e.target.value)}
                        placeholder="e.g. MBBS, MD"
                        className="w-full px-2 py-1.5 text-xs rounded-lg border border-border bg-card mt-1"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-muted-foreground font-bold uppercase">Experience (Yrs)</label>
                      <input 
                        type="number" 
                        value={experience}
                        onChange={(e) => setExperience(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs rounded-lg border border-border bg-card mt-1"
                        min="1"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-muted-foreground font-bold uppercase">Consultation Fee (INR)</label>
                      <input 
                        type="number" 
                        value={consultationFee}
                        onChange={(e) => setConsultationFee(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs rounded-lg border border-border bg-card mt-1"
                        min="100"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Email Address */}
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
            <input 
              type="email" 
              placeholder="Email Address *"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-border bg-card focus:outline-none focus:border-primary transition"
              required
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
            <input 
              type="password" 
              placeholder="Password *"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-border bg-card focus:outline-none focus:border-primary transition"
              required
            />
          </div>

          {/* Action button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:opacity-90 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isLogin ? (
              <>
                <LogIn className="w-4 h-4" />
                Sign In
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Register Account
              </>
            )}
          </button>
        </form>

        {/* Toggle auth mode */}
        <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border/50">
          {isLogin ? (
            <span>
              Don't have an account?{' '}
              <button 
                onClick={() => { setIsLogin(false); setErrorMsg(''); }}
                className="text-primary font-bold hover:underline transition"
              >
                Sign Up
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{' '}
              <button 
                onClick={() => { setIsLogin(true); setErrorMsg(''); }}
                className="text-primary font-bold hover:underline transition"
              >
                Sign In
              </button>
            </span>
          )}
        </div>
      </motion.div>
    </div>
  );
}
