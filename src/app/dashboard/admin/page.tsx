'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { 
  Users, UserCheck, Calendar, DollarSign, Search, Trash2, 
  Edit, ShieldCheck, HelpCircle, XCircle, CheckCircle2, ChevronRight, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminDashboard() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();

  // Database lists
  const [usersList, setUsersList] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  
  // Analytics
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    totalAppointments: 0,
    totalRevenue: 0,
    deptStats: [] as any[]
  });

  // Rescheduling states
  const [reschedulingAppt, setReschedulingAppt] = useState<any>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'appointments'>('analytics');

  // Protect page
  useEffect(() => {
    if (!authLoading && (!user || profile?.role !== 'admin')) {
      router.push('/auth');
    }
  }, [user, profile, authLoading, router]);

  // Load Admin reports
  useEffect(() => {
    if (!user || profile?.role !== 'admin') return;

    const loadAdminData = async () => {
      setLoading(true);
      try {
        // 1. Fetch all users
        const { data: allUsers } = await supabase.from('users').select('*');
        if (allUsers) {
          setUsersList(allUsers);
        }

        // 2. Fetch all appointments
        const { data: appts } = await supabase.from('appointments').select('*');
        // Fetch all doctors and link
        const { data: doctorsData } = await supabase.from('doctors').select('*');

        if (appts && allUsers && doctorsData) {
          const enrichedAppts = appts.map((ap: any) => {
            const docMeta = doctorsData.find((d: any) => d.id === ap.doctor_id);
            const docUser = docMeta ? allUsers.find((u: any) => u.id === docMeta.user_id) : null;
            
            // Resolve patient name
            // For mock, patient_id is pat-john, users have user-patient-john etc.
            const patUser = allUsers.find((u: any) => {
              if (u.role === 'patient') {
                return ap.patient_id.includes(u.name.toLowerCase().split(' ')[0]) || ap.patient_id.endsWith(u.id.substring(0,4)) || u.id === ap.patient_id;
              }
              return false;
            }) || allUsers.find((u: any) => u.role === 'patient');

            return {
              ...ap,
              doctorName: docUser ? docUser.name : 'Dr. Specialist',
              patientName: patUser ? patUser.name : 'John Doe',
              consultation_fee: docMeta ? Number(docMeta.consultation_fee) : 500,
              specialization: docMeta ? docMeta.specialization : 'General Medicine'
            };
          });

          setAppointments(enrichedAppts);

          // 3. Compute Analytics
          const patients = allUsers.filter((u: any) => u.role === 'patient').length;
          const doctorsCount = allUsers.filter((u: any) => u.role === 'doctor').length;
          const apptsCount = appts.length;
          
          // Calculate revenue based on completed or scheduled appointments
          const revenue = enrichedAppts
            .filter((ap: any) => ap.status !== 'cancelled')
            .reduce((sum: number, ap: any) => sum + ap.consultation_fee, 0);

          // Department metrics
          const depts = ['Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics'];
          const deptMetrics = depts.map((dName) => {
            const deptAppts = enrichedAppts.filter((ap: any) => ap.specialization === dName);
            const deptRev = deptAppts.filter((ap: any) => ap.status !== 'cancelled').reduce((sum: number, ap: any) => sum + ap.consultation_fee, 0);
            return {
              name: dName,
              count: deptAppts.length,
              revenue: deptRev
            };
          });

          setStats({
            totalPatients: patients,
            totalDoctors: doctorsCount,
            totalAppointments: apptsCount,
            totalRevenue: revenue,
            deptStats: deptMetrics
          });
        }
      } catch (err) {
        console.error('Error loading admin analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAdminData();
  }, [user, profile]);

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

      // Refresh Stats
      setStats((prev) => ({
        ...prev,
        totalRevenue: prev.totalRevenue - (appointments.find(a => a.id === apptId)?.consultation_fee || 0)
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Reschedule Appointment Action
  const handleRescheduleSubmit = async () => {
    if (!rescheduleDate || !rescheduleTime) {
      alert('Please fill in a valid date and time slot.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('appointments')
        .update({
          appointment_date: rescheduleDate,
          appointment_time: rescheduleTime
        })
        .eq('id', reschedulingAppt.id);

      if (error) {
        alert('Rescheduling failed: ' + error.message);
      } else {
        setAppointments((prev) => 
          prev.map((ap) => ap.id === reschedulingAppt.id ? { ...ap, appointment_date: rescheduleDate, appointment_time: rescheduleTime } : ap)
        );
        setReschedulingAppt(null);
        setRescheduleDate('');
        setRescheduleTime('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on search
  const filteredUsers = usersList.filter((u) => {
    return u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
           u.role.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (authLoading || loading) {
    return (
      <div className="flex-grow flex items-center justify-center py-24">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full px-4 md:px-8 py-8 flex flex-col md:flex-row gap-8">
      
      {/* LEFT: Sidebar controls */}
      <div className="w-full md:w-64 shrink-0 flex flex-col gap-3">
        <div className="p-5 rounded-2xl glass-panel border border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center font-bold text-white shadow-md">
            A
          </div>
          <div>
            <h4 className="font-bold text-foreground">NovaCare Admin</h4>
            <p className="text-[10px] text-accent font-bold uppercase tracking-wider">Super Administrator</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-2.5 flex flex-col gap-1 shadow-sm">
          {[
            { id: 'analytics', label: 'Admin Analytics', icon: Activity },
            { id: 'users', label: 'Manage Accounts', icon: Users },
            { id: 'appointments', label: 'All Bookings', icon: Calendar }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); setReschedulingAppt(null); }}
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

      {/* RIGHT: Content panels */}
      <div className="flex-grow">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: ANALYTICS OVERVIEW */}
          {activeTab === 'analytics' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">Analytics Dashboard</h2>
                <p className="text-sm text-muted-foreground">Monitor clinic patient acquisition rates, overall revenues, and departmental stats.</p>
              </div>

              {/* Counters */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Patients', val: stats.totalPatients, icon: Users, color: 'text-primary bg-primary/10' },
                  { label: 'Verified Doctors', val: stats.totalDoctors, icon: UserCheck, color: 'text-secondary bg-secondary/10' },
                  { label: 'Total Appointments', val: stats.totalAppointments, icon: Calendar, color: 'text-accent bg-accent/10' },
                  { label: 'Estimated Revenue', val: `₹${stats.totalRevenue}`, icon: DollarSign, color: 'text-emerald-500 bg-emerald-500/10' }
                ].map((s, idx) => (
                  <div key={idx} className="p-4 rounded-2xl border border-border bg-card shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-semibold">{s.label}</span>
                      <div className={`p-2 rounded-lg ${s.color}`}>
                        <s.icon className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-lg font-black text-foreground">{s.val}</p>
                  </div>
                ))}
              </div>

              {/* Department Table Statistics */}
              <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
                <h3 className="text-base font-bold text-foreground">Department Performance Directory</h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground font-bold uppercase text-[10px]">
                        <th className="py-2.5">Department Name</th>
                        <th className="py-2.5">Appointments Completed</th>
                        <th className="py-2.5 text-right">Revenue Generated</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {stats.deptStats.map((dept, idx) => (
                        <tr key={idx} className="hover:bg-muted/10">
                          <td className="py-3 font-bold text-foreground">{dept.name} Clinic</td>
                          <td className="py-3 text-muted-foreground">{dept.count} Bookings</td>
                          <td className="py-3 text-right text-emerald-500 font-bold">₹{dept.revenue}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: MANAGE ACCOUNTS */}
          {activeTab === 'users' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4"
            >
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-foreground">Manage Registered Accounts</h2>
                <p className="text-xs text-muted-foreground">View details, contact details, and role classifications for patients, clinical doctors, and administrators.</p>
              </div>

              {/* Search user */}
              <div className="relative max-w-md pt-2">
                <Search className="absolute left-3 top-5 w-4 h-4 text-muted-foreground" />
                <input 
                  type="text"
                  placeholder="Search accounts by name, email, or role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-border bg-background focus:outline-none"
                />
              </div>

              {/* Table */}
              <div className="overflow-x-auto pt-2">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground font-bold uppercase text-[10px]">
                      <th className="py-2.5">Full Name</th>
                      <th className="py-2.5">Email Address</th>
                      <th className="py-2.5">Contact Number</th>
                      <th className="py-2.5 text-right">Account Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-muted/10">
                        <td className="py-3 font-bold text-foreground flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-foreground font-bold uppercase text-[10px]">
                            {u.name[0]}
                          </div>
                          <span>{u.name}</span>
                        </td>
                        <td className="py-3 text-muted-foreground">{u.email}</td>
                        <td className="py-3 text-muted-foreground">{u.phone || 'N/A'}</td>
                        <td className="py-3 text-right">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider ${
                            u.role === 'admin' ? 'bg-accent/15 text-accent border border-accent/20' : 
                            u.role === 'doctor' ? 'bg-secondary/15 text-secondary border border-secondary/20' :
                            'bg-primary/15 text-primary border border-primary/20'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* TAB 3: GLOBAL BOOKINGS */}
          {activeTab === 'appointments' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4"
            >
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-foreground">Global Consultation Bookings</h2>
                <p className="text-xs text-muted-foreground">Supervise, cancel, or manually reschedule patient-doctor appointment slots.</p>
              </div>

              {appointments.length > 0 ? (
                <div className="overflow-x-auto pt-2">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground font-bold uppercase text-[10px]">
                        <th className="py-2.5">Patient</th>
                        <th className="py-2.5">Specialist Doctor</th>
                        <th className="py-2.5">Schedule</th>
                        <th className="py-2.5">Format</th>
                        <th className="py-2.5">Status</th>
                        <th className="py-2.5 text-right">Coordination</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {appointments.map((appt) => (
                        <tr key={appt.id} className="hover:bg-muted/10">
                          <td className="py-3 font-bold text-foreground">{appt.patientName}</td>
                          <td className="py-3 text-foreground font-semibold">{appt.doctorName} ({appt.specialization})</td>
                          <td className="py-3 text-muted-foreground">{appt.appointment_date} • {appt.appointment_time}</td>
                          <td className="py-3 text-muted-foreground capitalize">{appt.consultation_type}</td>
                          <td className="py-3">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase ${
                              appt.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                              appt.status === 'cancelled' ? 'bg-red-500/10 text-red-500' :
                              'bg-primary/10 text-primary'
                            }`}>
                              {appt.status}
                            </span>
                          </td>
                          <td className="py-3 text-right space-x-1">
                            {appt.status === 'scheduled' && (
                              <>
                                <button
                                  onClick={() => setReschedulingAppt(appt)}
                                  className="p-1.5 rounded-lg border border-border text-foreground hover:bg-muted transition inline-flex"
                                  title="Reschedule"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleCancelAppointment(appt.id)}
                                  className="p-1.5 rounded-lg border border-border text-red-500 hover:bg-red-500/10 transition inline-flex"
                                  title="Cancel"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                  No active booking records found.
                </div>
              )}

              {/* Rescheduling Modal */}
              <AnimatePresence>
                {reschedulingAppt && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      className="w-full max-w-md bg-card rounded-2xl border border-border p-6 space-y-4 shadow-2xl relative"
                    >
                      <h3 className="font-extrabold text-foreground text-lg">Reschedule Appointment Slot</h3>
                      <p className="text-xs text-muted-foreground">
                        Patient: <strong>{reschedulingAppt.patientName}</strong> • Doctor: <strong>{reschedulingAppt.doctorName}</strong>
                      </p>

                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase">New Date</label>
                          <input 
                            type="date"
                            value={rescheduleDate}
                            onChange={(e) => setRescheduleDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase">New Time Slot</label>
                          <select
                            value={rescheduleTime}
                            onChange={(e) => setRescheduleTime(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none"
                          >
                            <option value="">Select slot...</option>
                            {['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'].map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={handleRescheduleSubmit}
                          className="flex-grow py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white text-xs font-bold shadow-md"
                        >
                          Confirm Reschedule
                        </button>
                        <button 
                          onClick={() => { setReschedulingAppt(null); setRescheduleDate(''); setRescheduleTime(''); }}
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

        </AnimatePresence>
      </div>

    </div>
  );
}
