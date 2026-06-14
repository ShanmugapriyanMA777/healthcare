'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { 
  Clock, FileText, CheckCircle2, Video, XCircle, Users, Award, 
  DollarSign, Edit2, ShieldAlert, Eye, CheckCircle, Info, Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

export default function DoctorDashboard() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();

  // State managers
  const [doctorId, setDoctorId] = useState('');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [sharedReports, setSharedReports] = useState<any[]>([]);
  
  // Doctor metadata state
  const [specialization, setSpecialization] = useState('');
  const [qualification, setQualification] = useState('');
  const [experience, setExperience] = useState(0);
  const [consultationFee, setConsultationFee] = useState(0);
  const [availability, setAvailability] = useState<any>({});

  // Prescription composer state
  const [activeApptForPresc, setActiveApptForPresc] = useState<any>(null);
  const [prescriptionText, setPrescriptionText] = useState('');
  
  const [previewReport, setPreviewReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'queue' | 'reports' | 'schedule'>('queue');

  // Protect page
  useEffect(() => {
    if (!authLoading && (!user || profile?.role !== 'doctor')) {
      router.push('/auth');
    }
  }, [user, profile, authLoading, router]);

  // Load doctor details
  useEffect(() => {
    if (!user || profile?.role !== 'doctor') return;

    const loadDoctorData = async () => {
      setLoading(true);
      try {
        // 1. Get doctor profile
        const { data: docData } = await supabase
          .from('doctors')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (docData) {
          setDoctorId(docData.id);
          setSpecialization(docData.specialization);
          setQualification(docData.qualification);
          setExperience(docData.experience);
          setConsultationFee(Number(docData.consultation_fee));
          setAvailability(docData.availability || {});

          // 2. Fetch appointments
          const { data: appts } = await supabase
            .from('appointments')
            .select('*')
            .eq('doctor_id', docData.id)
            .order('appointment_date', { ascending: true });

          // Fetch associated patients/users details
          const { data: allUsers } = await supabase.from('users').select('*').eq('role', 'patient');
          const { data: allPats } = await supabase.from('patients').select('*');

          if (appts && allUsers && allPats) {
            const enrichedAppts = appts.map((ap: any) => {
              const patMeta = allPats.find((p: any) => p.id === ap.patient_id);
              const userMeta = patMeta ? allUsers.find((u: any) => u.id === patMeta.user_id) : null;
              return {
                ...ap,
                patientName: userMeta?.name || 'Valued Patient',
                bloodGroup: patMeta?.blood_group || 'O+',
                allergies: patMeta?.allergies || 'None recorded',
                medicalHistory: patMeta?.medical_history || 'No chronic records',
                profile_image: userMeta?.profile_image
              };
            });
            setAppointments(enrichedAppts);
          }

          // 3. Fetch shared reports
          const { data: reps } = await supabase
            .from('medical_reports')
            .select('*')
            .eq('doctor_id', docData.id);

          if (reps && allUsers && allPats) {
            const enrichedReps = reps.map((rp: any) => {
              const patMeta = allPats.find((p: any) => p.id === rp.patient_id);
              const userMeta = patMeta ? allUsers.find((u: any) => u.id === patMeta.user_id) : null;
              return {
                ...rp,
                patientName: userMeta?.name || 'Valued Patient'
              };
            });
            setSharedReports(enrichedReps);
          }
        }
      } catch (err) {
        console.error('Error loading doctor dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDoctorData();
  }, [user, profile]);

  // Handle Availability and Fee updates
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from('doctors')
        .update({
          qualification,
          experience,
          consultation_fee: consultationFee,
          availability
        })
        .eq('id', doctorId);

      if (error) {
        alert('Error updating schedule details: ' + error.message);
      } else {
        alert('Schedule settings saved successfully!');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Submit Prescription Action
  const handleSavePrescription = async () => {
    if (!prescriptionText.trim()) {
      alert('Please fill in the prescription medications list.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('prescriptions')
        .insert({
          appointment_id: activeApptForPresc.id,
          doctor_id: doctorId,
          patient_id: activeApptForPresc.patient_id,
          prescription_text: prescriptionText
        });

      if (error) {
        alert('Error writing prescription: ' + error.message);
      } else {
        // Mark appointment as completed
        await supabase
          .from('appointments')
          .update({ status: 'completed' })
          .eq('id', activeApptForPresc.id);

        // Update local state queue
        setAppointments((prev) => 
          prev.map((ap) => ap.id === activeApptForPresc.id ? { ...ap, status: 'completed' } : ap)
        );

        confetti({ particleCount: 80, spread: 60, colors: ['#00f2fe', '#4facfe'] });
        setActiveApptForPresc(null);
        setPrescriptionText('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Cancel Appointment
  const handleCancelAppointment = async (apptId: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    setLoading(true);
    try {
      await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', apptId);
      
      setAppointments((prev) => 
        prev.map((ap) => ap.id === apptId ? { ...ap, status: 'cancelled' } : ap)
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
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
        {/* Doctor Identity Profile Card */}
        <div className="p-5 rounded-2xl glass-panel border border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center font-bold text-white shadow-md">
            {profile?.name[0].toUpperCase()}
          </div>
          <div>
            <h4 className="font-bold text-foreground line-clamp-1">{profile?.name}</h4>
            <p className="text-[10px] text-secondary font-bold uppercase tracking-wider">{specialization} Clinic</p>
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="rounded-2xl border border-border bg-card p-2.5 flex flex-col gap-1 shadow-sm">
          {[
            { id: 'queue', label: 'Consultation Queue', icon: Clock },
            { id: 'reports', label: 'Shared Reports', icon: FileText },
            { id: 'schedule', label: 'Manage Availability', icon: Award }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); setActiveApptForPresc(null); }}
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
      </div>

      {/* RIGHT: Content Panels */}
      <div className="flex-grow">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: CONSULTATION QUEUE */}
          {activeTab === 'queue' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">Consultation Queue</h2>
                <p className="text-sm text-muted-foreground">Review and complete today's upcoming physical or digital patient sessions.</p>
              </div>

              {appointments.length > 0 ? (
                <div className="space-y-4">
                  {appointments.map((appt) => (
                    <div key={appt.id} className={`p-5 rounded-2xl border bg-card shadow-sm flex flex-col gap-4 transition ${
                      appt.status === 'completed' ? 'border-emerald-500/20 bg-emerald-500/5 opacity-80' : 'border-border'
                    }`}>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        {/* Patient info details */}
                        <div className="flex items-center gap-3.5">
                          <img 
                            src={appt.profile_image || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200'} 
                            alt={appt.patientName} 
                            className="w-12 h-12 rounded-xl object-cover border border-border"
                          />
                          <div>
                            <h4 className="font-extrabold text-foreground text-sm flex items-center gap-2">
                              {appt.patientName}
                              {appt.status === 'completed' && (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 text-[9px] font-bold bg-emerald-500 text-white rounded-full">
                                  <CheckCircle className="w-2.5 h-2.5" /> Done
                                </span>
                              )}
                              {appt.status === 'cancelled' && (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 text-[9px] font-bold bg-red-500 text-white rounded-full">
                                  Cancelled
                                </span>
                              )}
                            </h4>
                            <p className="text-xs text-muted-foreground">Date: {appt.appointment_date} • Time: {appt.appointment_time}</p>
                          </div>
                        </div>

                        {/* Booking formatting actions */}
                        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-between sm:justify-end">
                          <div className="text-left sm:text-right">
                            <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border border-border text-foreground tracking-wide">
                              {appt.consultation_type} format
                            </span>
                          </div>

                          {appt.status === 'scheduled' && (
                            <div className="flex gap-2">
                              {appt.consultation_type === 'online' && (
                                <Link 
                                  href={`/consultation/${appt.id}`}
                                  className="px-3 py-2 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-primary/10"
                                >
                                  <Video className="w-3.5 h-3.5" /> Meet Room
                                </Link>
                              )}
                              <button 
                                onClick={() => setActiveApptForPresc(appt)}
                                className="px-3 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs border border-primary/20"
                              >
                                Write Rx
                              </button>
                              <button 
                                onClick={() => handleCancelAppointment(appt.id)}
                                className="p-2 rounded-xl border border-border text-red-500 hover:bg-red-500/10 transition"
                                title="Cancel Visit"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Extended patient diagnostics dropdown for Doctor */}
                      {appt.status === 'scheduled' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-border/50 text-xs">
                          <div className="p-2 rounded-lg bg-muted/40 border border-border/50">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide block">Blood Type</span>
                            <span className="font-bold text-foreground">{appt.bloodGroup}</span>
                          </div>
                          <div className="p-2 rounded-lg bg-muted/40 border border-border/50">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide block">Known Allergies</span>
                            <span className="font-bold text-red-500">{appt.allergies}</span>
                          </div>
                          <div className="p-2 rounded-lg bg-muted/40 border border-border/50">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide block">Medical Notes</span>
                            <span className="font-bold text-foreground truncate block">{appt.medicalHistory}</span>
                          </div>
                        </div>
                      )}

                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                  No consultation queue entries scheduled.
                </div>
              )}

              {/* Prescription Composer Dialog */}
              <AnimatePresence>
                {activeApptForPresc && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      className="w-full max-w-lg bg-card rounded-2xl border border-border p-6 space-y-4 shadow-2xl relative"
                    >
                      <h3 className="font-extrabold text-foreground text-lg">
                        Issue Digital Prescription
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Patient: <strong>{activeApptForPresc.patientName}</strong> • Date: {activeApptForPresc.appointment_date}
                      </p>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Medications list, dosages, & follow-ups</label>
                        <textarea
                          rows={6}
                          value={prescriptionText}
                          onChange={(e) => setPrescriptionText(e.target.value)}
                          placeholder="e.g.&#10;1. Paracetamol 500mg - Twice daily after meals (3 Days)&#10;2. Vitamin C 500mg - Once daily morning (10 Days)&#10;Follow-up checkup in 1 week."
                          className="w-full px-3 py-2.5 text-xs rounded-xl border border-border bg-background focus:outline-none focus:border-primary transition resize-none font-mono"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={handleSavePrescription}
                          className="flex-grow py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md"
                        >
                          <Send className="w-4 h-4" /> Finalize & Send Rx
                        </button>
                        <button 
                          onClick={() => { setActiveApptForPresc(null); setPrescriptionText(''); }}
                          className="px-5 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted text-xs font-bold"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

            </motion.div>
          )}

          {/* TAB 2: SHARED MEDICAL REPORTS */}
          {activeTab === 'reports' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4"
            >
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-foreground">Shared Diagnostics Repository</h2>
                <p className="text-xs text-muted-foreground">Review diagnostic MRI documents, blood panels, or files shared by registered patients.</p>
              </div>

              {sharedReports.length > 0 ? (
                <div className="overflow-x-auto pt-2">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground font-bold uppercase text-[10px]">
                        <th className="py-2.5">Patient Name</th>
                        <th className="py-2.5">Report Title</th>
                        <th className="py-2.5">Shared Date</th>
                        <th className="py-2.5 text-right">Preview</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {sharedReports.map((rep) => (
                        <tr key={rep.id} className="hover:bg-muted/10">
                          <td className="py-3 font-bold text-foreground">{rep.patientName}</td>
                          <td className="py-3 text-muted-foreground flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-primary shrink-0" />
                            <span>{rep.report_name}</span>
                          </td>
                          <td className="py-3 text-muted-foreground">{new Date(rep.uploaded_at).toLocaleDateString()}</td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => setPreviewReport(rep)}
                              className="p-1.5 rounded-lg border border-border text-foreground hover:bg-muted transition inline-flex"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                  No patient reports are currently shared with your profile.
                </div>
              )}

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
                        <XCircle className="w-5 h-5" />
                      </button>

                      <div className="h-64 rounded-xl bg-muted/40 border border-border flex flex-col items-center justify-center p-6 text-center space-y-3">
                        <FileText className="w-16 h-16 text-primary animate-pulse" />
                        <div>
                          <p className="text-xs text-foreground font-bold">Secure Document Vault</p>
                          <p className="text-[10px] text-muted-foreground mt-1">Uploaded by patient: {previewReport.patientName}</p>
                          <p className="text-[10px] text-muted-foreground">File URL: {previewReport.file_url}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <a 
                          href={previewReport.file_url} 
                          download
                          className="flex-grow py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white text-xs font-bold text-center flex items-center justify-center gap-1.5"
                        >
                          Download & Review File
                        </a>
                        <button 
                          onClick={() => setPreviewReport(null)}
                          className="px-6 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted text-xs font-bold"
                        >
                          Close
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

            </motion.div>
          )}

          {/* TAB 3: MANAGE AVAILABILITY & FEES */}
          {activeTab === 'schedule' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-6"
            >
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-foreground">Availability & Scheduling Console</h2>
                <p className="text-xs text-muted-foreground">Adjust your consultation fees and weekly calendar slots for scheduling patients.</p>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-4">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-primary" /> Qualifications
                    </label>
                    <input 
                      type="text" 
                      value={qualification}
                      onChange={(e) => setQualification(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-primary" /> Experience (Years)
                    </label>
                    <input 
                      type="number" 
                      value={experience}
                      onChange={(e) => setExperience(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-primary" /> Consultation Fee (INR)
                  </label>
                  <input 
                    type="number" 
                    value={consultationFee}
                    onChange={(e) => setConsultationFee(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background"
                    min="100"
                    required
                  />
                </div>

                {/* Available days checkboxes */}
                <div className="space-y-2 border-t border-border pt-4">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Available Days</label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map((day) => {
                      const isActive = day in availability;
                      return (
                        <button
                          type="button"
                          key={day}
                          onClick={() => {
                            const newAvail = { ...availability };
                            if (isActive) {
                              delete newAvail[day];
                            } else {
                              newAvail[day] = ['09:00-12:00', '14:00-17:00'];
                            }
                            setAvailability(newAvail);
                          }}
                          className={`py-3 rounded-xl text-xs font-bold border capitalize transition ${
                            isActive 
                              ? 'bg-gradient-to-tr from-primary/10 to-secondary/10 text-primary border-primary/30' 
                              : 'bg-card border-border text-foreground/75 hover:bg-muted'
                          }`}
                        >
                          {day.substring(0, 3)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold text-xs"
                >
                  Save Schedule Parameters
                </button>

              </form>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </div>
  );
}
