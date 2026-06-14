'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { 
  User, Calendar, FileText, Activity, Heart, Thermometer, Droplet, 
  Upload, Search, Video, MapPin, Plus, Trash2, CheckCircle2, AlertCircle, Share2, Eye, Download, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

export default function PatientDashboard() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const router = useRouter();

  // State managers
  const [patientId, setPatientId] = useState('');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  
  // Profile settings
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [allergies, setAllergies] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  
  // Slot Booking Wizard state
  const [selectedSpecialty, setSelectedSpecialty] = useState('Cardiology');
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [consultationType, setConsultationType] = useState<'physical' | 'online'>('online');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // File Upload state
  const [reportName, setReportName] = useState('');
  const [selectedDocForReport, setSelectedDocForReport] = useState('');
  const [uploadProgress, setUploadProgress] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [previewReport, setPreviewReport] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Vitals mock variables
  const [vitals, setVitals] = useState({
    hr: '72',
    bp: '120/80',
    temp: '98.6',
    sugar: '100'
  });

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'book' | 'reports' | 'profile'>('overview');

  // Protect page
  useEffect(() => {
    if (!authLoading && (!user || profile?.role !== 'patient')) {
      router.push('/auth');
    }
  }, [user, profile, authLoading, router]);

  // Load dashboard data
  useEffect(() => {
    if (!user || profile?.role !== 'patient') return;

    const loadPatientData = async () => {
      setLoading(true);
      try {
        // 1. Get patient record
        const { data: patData } = await supabase
          .from('patients')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (patData) {
          setPatientId(patData.id);
          setBloodGroup(patData.blood_group || 'O+');
          setAllergies(patData.allergies || '');
          setMedicalHistory(patData.medical_history || '');
          setPhone(profile.phone || '');
          setName(profile.name || '');

          // 2. Fetch appointments
          const { data: appts } = await supabase
            .from('appointments')
            .select('*')
            .eq('patient_id', patData.id)
            .order('appointment_date', { ascending: true });
          
          // Fetch associated doctor details
          const { data: allUsers } = await supabase.from('users').select('*').eq('role', 'doctor');
          const { data: allDocs } = await supabase.from('doctors').select('*');

          if (appts && allUsers && allDocs) {
            const enrichedAppts = appts.map((ap: any) => {
              const docMeta = allDocs.find((d: any) => d.id === ap.doctor_id);
              const userMeta = docMeta ? allUsers.find((u: any) => u.id === docMeta.user_id) : null;
              return {
                ...ap,
                doctorName: userMeta?.name || 'Dr. Specialist',
                specialization: docMeta?.specialization || 'General',
                profile_image: userMeta?.profile_image
              };
            });
            setAppointments(enrichedAppts);
          }

          // 3. Fetch reports
          const { data: reps } = await supabase
            .from('medical_reports')
            .select('*')
            .eq('patient_id', patData.id);
          if (reps && allUsers && allDocs) {
            const enrichedReps = reps.map((rp: any) => {
              const docMeta = allDocs.find((d: any) => d.id === rp.doctor_id);
              const userMeta = docMeta ? allUsers.find((u: any) => u.id === docMeta.user_id) : null;
              return {
                ...rp,
                doctorName: userMeta ? userMeta.name : 'Not Shared'
              };
            });
            setReports(enrichedReps);
          }
        }

        // 4. Fetch doctors list for booking and sharing
        const { data: allUsers } = await supabase.from('users').select('*').eq('role', 'doctor');
        const { data: allDocs } = await supabase.from('doctors').select('*');
        if (allDocs && allUsers) {
          const joined = allDocs.map((d: any) => {
            const u = allUsers.find((userObj: any) => userObj.id === d.user_id);
            return {
              ...d,
              name: u?.name || 'Dr. Specialist',
              profile_image: u?.profile_image
            };
          });
          setDoctors(joined);
          if (joined.length > 0) {
            setSelectedDoctor(joined.filter((d: any) => d.specialization === selectedSpecialty)[0] || joined[0]);
          }
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPatientData();
  }, [user, profile]);

  // Handle specialty changes in booking tab
  useEffect(() => {
    if (doctors.length > 0) {
      const match = doctors.filter((d: any) => d.specialization === selectedSpecialty);
      setSelectedDoctor(match[0] || doctors[0]);
    }
  }, [selectedSpecialty, doctors]);

  // Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Update users table name/phone
      await supabase.from('users').update({ name, phone }).eq('id', user.id);
      
      // Update patients table
      await supabase.from('patients').update({
        blood_group: bloodGroup,
        allergies,
        medical_history: medicalHistory
      }).eq('user_id', user.id);

      await refreshProfile();
      alert('Profile updated successfully!');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Appointment Booking Action
  const handleBookAppointment = async () => {
    if (!selectedDoctor || !selectedDate || !selectedTime) {
      alert('Please select doctor, date, and availability slot.');
      return;
    }

    setLoading(true);
    try {
      const apptId = `appt-${Math.random().toString(36).substring(2, 9)}`;
      const meetLink = consultationType === 'online' 
        ? `${window.location.origin}/consultation/${apptId}` 
        : null;

      const newAppt = {
        id: apptId,
        patient_id: patientId,
        doctor_id: selectedDoctor.id,
        appointment_date: selectedDate,
        appointment_time: selectedTime,
        consultation_type: consultationType,
        meet_link: meetLink,
        status: 'scheduled'
      };

      const { error } = await supabase.from('appointments').insert(newAppt);

      if (error) {
        alert(error.message);
      } else {
        setBookingSuccess(true);
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        
        // Refresh appointments list
        const enrichedNewAppt = {
          ...newAppt,
          doctorName: selectedDoctor.name,
          specialization: selectedDoctor.specialization,
          profile_image: selectedDoctor.profile_image
        };
        setAppointments((prev) => [...prev, enrichedNewAppt]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Drag & drop file upload
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setUploadProgress(true);
    setUploadSuccess(false);

    try {
      const filePath = `reports/${user.id}/${Date.now()}_${file.name}`;
      
      // Upload report to Supabase storage
      const { data, error, url } = await supabase.storage.from('medical-reports').upload(filePath, file);

      if (error) {
        alert('File upload failed: ' + error.message);
        return;
      }

      const fileUrl = url || filePath; // Fallback mock url handles blob directly in client

      const newReport = {
        patient_id: patientId,
        doctor_id: selectedDocForReport ? selectedDocForReport : null,
        report_name: reportName || file.name,
        file_url: fileUrl,
      };

      const { data: insertedReport } = await supabase.from('medical_reports').insert(newReport);
      
      const docObj = doctors.find((d) => d.id === selectedDocForReport);
      
      setReports((prev) => [
        ...prev,
        {
          ...newReport,
          id: insertedReport?.id || `mock-rep-${Date.now()}`,
          uploaded_at: new Date().toISOString(),
          doctorName: docObj ? docObj.name : 'Not Shared'
        }
      ]);

      setUploadSuccess(true);
      setReportName('');
      setSelectedDocForReport('');
    } catch (e) {
      console.error(e);
    } finally {
      setUploadProgress(false);
    }
  };

  const deleteReport = async (id: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return;
    await supabase.from('medical_reports').delete().eq('id', id);
    setReports((prev) => prev.filter((r) => r.id !== id));
  };

  if (authLoading || loading) {
    return (
      <div className="flex-grow flex items-center justify-center py-24">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full px-4 md:px-8 py-8 flex flex-col md:flex-row gap-8">
      
      {/* LEFT: Sidebar Navigation */}
      <div className="w-full md:w-64 shrink-0 flex flex-col gap-3">
        {/* User Card */}
        <div className="p-5 rounded-2xl glass-panel border border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center font-bold text-white shadow-md">
            {profile?.name[0].toUpperCase()}
          </div>
          <div>
            <h4 className="font-bold text-foreground line-clamp-1">{profile?.name}</h4>
            <p className="text-[10px] text-primary font-bold uppercase tracking-wider">Patient Portal</p>
          </div>
        </div>

        {/* Tab Links */}
        <div className="rounded-2xl border border-border bg-card p-2.5 flex flex-col gap-1 shadow-sm">
          {[
            { id: 'overview', label: 'My Vitals & Overview', icon: Activity },
            { id: 'book', label: 'Book Consult', icon: Calendar },
            { id: 'reports', label: 'Medical Reports', icon: FileText },
            { id: 'profile', label: 'Medical Profile', icon: User }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); setBookingSuccess(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition text-left ${
                activeTab === tab.id 
                  ? 'bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 text-primary' 
                  : 'text-foreground/80 hover:bg-muted'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Quick Emergency button */}
        <div className="p-4 rounded-2xl border border-red-500/20 bg-red-500/5 text-center space-y-2">
          <p className="text-xs text-red-500 font-bold">Experiencing trauma?</p>
          <a href="tel:+18009999999" className="w-full block py-2 rounded-xl bg-red-500 text-white font-bold text-xs hover:bg-red-600 transition">
            Call Trauma Desk
          </a>
        </div>
      </div>

      {/* RIGHT: Content Panels */}
      <div className="flex-grow">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: OVERVIEW & VITALS */}
          {activeTab === 'overview' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">Welcome Back, {profile?.name}</h2>
                <p className="text-sm text-muted-foreground">Monitor your vital stats and keep track of your upcoming medical appointments.</p>
              </div>

              {/* Vitals Deck */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Pulse Rate', val: `${vitals.hr} bpm`, icon: Heart, color: 'text-red-500 bg-red-500/10' },
                  { label: 'Blood Pressure', val: vitals.bp, icon: Activity, color: 'text-primary bg-primary/10' },
                  { label: 'Temperature', val: `${vitals.temp} °F`, icon: Thermometer, color: 'text-amber-500 bg-amber-500/10' },
                  { label: 'Blood Glucose', val: `${vitals.sugar} mg/dL`, icon: Droplet, color: 'text-emerald-500 bg-emerald-500/10' }
                ].map((vit, idx) => (
                  <div key={idx} className="p-4 rounded-2xl border border-border bg-card shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-semibold">{vit.label}</span>
                      <div className={`p-2 rounded-lg ${vit.color}`}>
                        <vit.icon className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-lg font-black text-foreground">{vit.val}</p>
                  </div>
                ))}
              </div>

              {/* Appointments Queue */}
              <div className="p-6 rounded-2xl border border-border bg-card space-y-4 shadow-sm">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Upcoming Consultations
                </h3>

                {appointments.length > 0 ? (
                  <div className="space-y-4">
                    {appointments.map((appt) => (
                      <div key={appt.id} className="p-4 rounded-xl bg-muted/40 border border-border/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={appt.profile_image || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200'} 
                            alt={appt.doctorName} 
                            className="w-12 h-12 rounded-xl object-cover"
                          />
                          <div>
                            <h4 className="font-bold text-sm text-foreground">{appt.doctorName}</h4>
                            <p className="text-xs text-muted-foreground">{appt.specialization} • {appt.appointment_date}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                          <div className="text-left md:text-right">
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary capitalize inline-block">
                              {appt.appointment_time}
                            </span>
                            <span className="text-[10px] text-muted-foreground block font-semibold capitalize mt-1">
                              {appt.consultation_type} Visit
                            </span>
                          </div>

                          {appt.consultation_type === 'online' && appt.status === 'scheduled' ? (
                            <Link 
                              href={`/consultation/${appt.id}`}
                              className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-primary/15"
                            >
                              <Video className="w-4 h-4" />
                              Join Room
                            </Link>
                          ) : (
                            <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              Clinic Visit
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                    No active appointments scheduled. Use the 'Book Consult' wizard to schedule.
                  </div>
                )}
              </div>

            </motion.div>
          )}

          {/* TAB 2: SLOT BOOKING WIZARD */}
          {activeTab === 'book' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">Schedule Consultation</h2>
                <p className="text-sm text-muted-foreground">Select a department, pick your doctor, and lock in an available visit slot.</p>
              </div>

              {bookingSuccess ? (
                <div className="p-8 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 text-center space-y-4 max-w-md mx-auto">
                  <div className="w-14 h-14 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">Booking Confirmed!</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Your appointment has been successfully recorded. You will receive an email confirmation. If this is an online session, you can join the room directly from the dashboard overview tab.
                  </p>
                  <button 
                    onClick={() => { setBookingSuccess(false); setActiveTab('overview'); }}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold text-xs"
                  >
                    Go to Overview
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Form section */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="p-6 rounded-2xl border border-border bg-card space-y-4 shadow-sm">
                      
                      {/* Select Specialty */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground uppercase">Medical Specialty</label>
                        <select
                          value={selectedSpecialty}
                          onChange={(e) => setSelectedSpecialty(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none"
                        >
                          {['Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics'].map((spec) => (
                            <option key={spec} value={spec}>{spec} Department</option>
                          ))}
                        </select>
                      </div>

                      {/* Select Doctor */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground uppercase">Available Specialist</label>
                        <select
                          onChange={(e) => {
                            const doc = doctors.find((d) => d.id === e.target.value);
                            setSelectedDoctor(doc);
                          }}
                          className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none"
                        >
                          {doctors.filter(d => d.specialization === selectedSpecialty).map((doc) => (
                            <option key={doc.id} value={doc.id}>{doc.name} ({doc.qualification})</option>
                          ))}
                          {doctors.filter(d => d.specialization === selectedSpecialty).length === 0 && (
                            <option>No doctors registered in {selectedSpecialty}</option>
                          )}
                        </select>
                      </div>

                      {/* Date & Time Select */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-muted-foreground uppercase">Select Date</label>
                          <input 
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none text-sm"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-muted-foreground uppercase">Time Slot</label>
                          <select
                            value={selectedTime}
                            onChange={(e) => setSelectedTime(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none text-sm"
                          >
                            <option value="">Select slot...</option>
                            {['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'].map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Consultation Type */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground uppercase">Consultation Format</label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setConsultationType('online')}
                            className={`py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                              consultationType === 'online'
                                ? 'bg-gradient-to-r from-primary to-secondary text-white border-transparent'
                                : 'bg-card border-border text-foreground hover:bg-muted'
                            }`}
                          >
                            <Video className="w-4 h-4" />
                            Online Meeting
                          </button>

                          <button
                            type="button"
                            onClick={() => setConsultationType('physical')}
                            className={`py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                              consultationType === 'physical'
                                ? 'bg-gradient-to-r from-primary to-secondary text-white border-transparent'
                                : 'bg-card border-border text-foreground hover:bg-muted'
                            }`}
                          >
                            <MapPin className="w-4 h-4" />
                            Physical Clinic Visit
                          </button>
                        </div>
                      </div>

                      {/* Submit */}
                      <button
                        onClick={handleBookAppointment}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold text-sm shadow-md"
                      >
                        Confirm Appointment Booking
                      </button>

                    </div>
                  </div>

                  {/* Summary Card */}
                  <div className="space-y-4">
                    {selectedDoctor && (
                      <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
                        <h4 className="font-bold text-sm text-foreground uppercase tracking-wide">Doctor Profile</h4>
                        
                        <div className="text-center space-y-2">
                          <img 
                            src={selectedDoctor.profile_image || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200'} 
                            alt={selectedDoctor.name} 
                            className="w-20 h-20 rounded-full mx-auto object-cover border-2 border-primary/20"
                          />
                          <div>
                            <h5 className="font-extrabold text-foreground">{selectedDoctor.name}</h5>
                            <p className="text-xs text-primary font-semibold">{selectedDoctor.specialization}</p>
                          </div>
                        </div>

                        <div className="space-y-2 text-xs border-t border-border pt-3">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Qualification:</span>
                            <span className="font-bold text-foreground">{selectedDoctor.qualification}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Experience:</span>
                            <span className="font-bold text-foreground">{selectedDoctor.experience} Years</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Consultation Fee:</span>
                            <span className="font-bold text-foreground">₹{selectedDoctor.consultation_fee}</span>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-muted/50 border border-border text-[11px] text-muted-foreground flex gap-1.5">
                          <Info className="w-4 h-4 text-primary shrink-0" />
                          <span>Includes prescription compilation, digital reports sharing panel, and built-in virtual room access.</span>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              )}
            </motion.div>
          )}

          {/* TAB 3: MEDICAL REPORTS MANAGER */}
          {activeTab === 'reports' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">Medical Diagnostic Reports</h2>
                <p className="text-sm text-muted-foreground">Upload and catalog your MRI, blood tests, or diagnostic x-ray files securely.</p>
              </div>

              {/* Upload panel & Table */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Upload Form */}
                <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4 h-fit">
                  <h4 className="font-bold text-sm text-foreground uppercase tracking-wide">Upload New Document</h4>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Report Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g., Blood Panel May 2026"
                      value={reportName}
                      onChange={(e) => setReportName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Share with Doctor</label>
                    <select
                      value={selectedDocForReport}
                      onChange={(e) => setSelectedDocForReport(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none"
                    >
                      <option value="">Keep Private (Do not share)</option>
                      {doctors.map((doc) => (
                        <option key={doc.id} value={doc.id}>{doc.name} ({doc.specialization})</option>
                      ))}
                    </select>
                  </div>

                  {/* Drag & Drop simulated box */}
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:bg-muted/30 hover:border-primary transition cursor-pointer space-y-2"
                  >
                    <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                    <p className="text-xs font-bold text-foreground">Click to upload report</p>
                    <p className="text-[10px] text-muted-foreground">Supports PDF, JPG, PNG (Max 10MB)</p>
                    <input 
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileUpload(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                  </div>

                  {uploadProgress && (
                    <div className="text-center text-xs text-primary font-semibold flex items-center justify-center gap-1.5">
                      <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Uploading to secure vault...
                    </div>
                  )}

                  {uploadSuccess && (
                    <div className="p-2 text-center text-xs bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl font-bold flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Upload Complete!
                    </div>
                  )}
                </div>

                {/* Reports Vault List */}
                <div className="lg:col-span-2 p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
                  <h4 className="font-bold text-sm text-foreground uppercase tracking-wide">Your Document Vault</h4>
                  
                  {reports.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="border-b border-border text-muted-foreground font-bold uppercase text-[10px]">
                            <th className="py-2.5">Name</th>
                            <th className="py-2.5">Uploaded</th>
                            <th className="py-2.5">Shared Doctor</th>
                            <th className="py-2.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {reports.map((rep) => (
                            <tr key={rep.id} className="hover:bg-muted/10">
                              <td className="py-3 font-bold text-foreground flex items-center gap-2">
                                <FileText className="w-4 h-4 text-primary shrink-0" />
                                <span className="line-clamp-1">{rep.report_name}</span>
                              </td>
                              <td className="py-3 text-muted-foreground">
                                {new Date(rep.uploaded_at).toLocaleDateString()}
                              </td>
                              <td className="py-3 text-foreground font-semibold">
                                {rep.doctorName}
                              </td>
                              <td className="py-3 text-right space-x-1.5">
                                <button 
                                  onClick={() => setPreviewReport(rep)}
                                  className="p-1.5 rounded-lg border border-border text-foreground hover:bg-muted transition inline-flex"
                                  title="Preview"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => deleteReport(rep.id)}
                                  className="p-1.5 rounded-lg border border-border text-red-500 hover:bg-red-500/10 transition inline-flex"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                      Vault is currently empty. Upload reports from the side panel.
                    </div>
                  )}
                </div>

              </div>

              {/* Preview Modal */}
              <AnimatePresence>
                {previewReport && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      className="w-full max-w-lg bg-card rounded-2xl border border-border p-6 space-y-4 shadow-2xl relative"
                    >
                      <h3 className="font-extrabold text-foreground text-lg pr-8 line-clamp-1">{previewReport.report_name}</h3>
                      <button
                        onClick={() => setPreviewReport(null)}
                        className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted transition text-foreground"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>

                      {/* Mock Preview Content */}
                      <div className="h-64 rounded-xl bg-muted/40 border border-border flex flex-col items-center justify-center p-6 text-center space-y-3">
                        <FileText className="w-16 h-16 text-primary animate-pulse" />
                        <div>
                          <p className="text-xs text-foreground font-bold">Secure Document Viewer Enabled</p>
                          <p className="text-[10px] text-muted-foreground mt-1">Shared with: {previewReport.doctorName}</p>
                          <p className="text-[10px] text-muted-foreground">File URL: {previewReport.file_url}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <a 
                          href={previewReport.file_url} 
                          download
                          className="flex-grow py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white text-xs font-bold text-center flex items-center justify-center gap-1.5"
                        >
                          <Download className="w-4 h-4" /> Download Original File
                        </a>
                        <button 
                          onClick={() => setPreviewReport(null)}
                          className="px-6 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted text-xs font-bold"
                        >
                          Close Preview
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* TAB 4: MEDICAL PROFILE CONFIG */}
          {activeTab === 'profile' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-6"
            >
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-foreground">Manage Demographics & Profile</h2>
                <p className="text-xs text-muted-foreground">Keep your critical medical information updated for the consulting doctor's review.</p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Patient Name</label>
                    <input 
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Phone Number</label>
                    <input 
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Blood Group</label>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background"
                    >
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Allergies</label>
                    <input 
                      type="text"
                      value={allergies}
                      onChange={(e) => setAllergies(e.target.value)}
                      placeholder="e.g. Pollen, Dust, Dairy"
                      className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Medical History Notes</label>
                  <textarea
                    value={medicalHistory}
                    onChange={(e) => setMedicalHistory(e.target.value)}
                    rows={4}
                    placeholder="Enter chronic conditions, past surgeries, or ongoing therapies..."
                    className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold text-xs"
                >
                  Save Profile Configuration
                </button>

              </form>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </div>
  );
}
