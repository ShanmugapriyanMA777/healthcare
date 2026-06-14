'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { 
  Video, VideoOff, Mic, MicOff, PhoneOff, MessageSquare, 
  FileText, Send, User, Bot, AlertTriangle, Monitor, CheckCircle, Info
} from 'lucide-react';
import { motion } from 'framer-motion';

interface ChatMessage {
  sender: 'doctor' | 'patient';
  text: string;
  time: string;
}

export default function ConsultationRoom() {
  const { id } = useParams() as { id: string };
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();

  // Consultation Details
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Audio Video states
  const [videoOn, setVideoOn] = useState(true);
  const [audioOn, setAudioOn] = useState(true);
  const [screenShare, setScreenShare] = useState(false);

  // Chat Feed states
  const [chatLog, setChatLog] = useState<ChatMessage[]>([
    { sender: 'doctor', text: 'Hello, I have reviewed your medical history. How are you feeling today?', time: '10:02 AM' }
  ]);
  const [chatInput, setChatInput] = useState('');
  
  // Note sheet (Doctor only)
  const [notes, setNotes] = useState('');
  const [prescriptionText, setPrescriptionText] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [rxSaved, setRxSaved] = useState(false);
  const [activePanel, setActivePanel] = useState<'chat' | 'history' | 'rx'>('chat');

  // Check login
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  // Load details
  useEffect(() => {
    if (!user || !id) return;

    const loadCallDetails = async () => {
      setLoading(true);
      try {
        const { data: appt } = await supabase.from('appointments').select('*').eq('id', id).single();
        if (appt) {
          // Resolve partner names
          const { data: allUsers } = await supabase.from('users').select('*');
          const { data: allDocs } = await supabase.from('doctors').select('*');
          const { data: allPats } = await supabase.from('patients').select('*');

          if (allUsers && allDocs && allPats) {
            const docObj = allDocs.find((d: any) => d.id === appt.doctor_id);
            const docUserObj = docObj ? allUsers.find((u: any) => u.id === docObj.user_id) : null;
            const patObj = allPats.find((p: any) => p.id === appt.patient_id);
            const patUserObj = patObj ? allUsers.find((u: any) => u.id === patObj.user_id) : null;

            setAppointment({
              ...appt,
              doctorName: docUserObj?.name || 'Dr. Specialist',
              doctorSpec: docObj?.specialization || 'General',
              patientName: patUserObj?.name || 'Valued Patient',
              bloodGroup: patObj?.blood_group || 'O+',
              allergies: patObj?.allergies || 'None',
              medicalHistory: patObj?.medical_history || 'None recorded'
            });
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    loadCallDetails();
  }, [user, id]);

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const isDoc = profile?.role === 'doctor';
    const newMsg: ChatMessage = {
      sender: isDoc ? 'doctor' : 'patient',
      text: chatInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatLog((prev) => [...prev, newMsg]);
    setChatInput('');

    // Simulate partner response shortly
    setTimeout(() => {
      let replyText = '';
      if (isDoc) {
        replyText = "Thank you Doctor, I will keep that in mind. Is there anything else I need to watch for?";
      } else {
        replyText = "I see. Let's record this symptom. Make sure to rest and follow the prescription I am writing.";
      }
      
      setChatLog((prev) => [
        ...prev,
        {
          sender: isDoc ? 'patient' : 'doctor',
          text: replyText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 2000);
  };

  const handleSaveRxByDoctor = async () => {
    if (!prescriptionText.trim()) {
      alert('Please compile medication list before saving.');
      return;
    }

    setSavingNotes(true);
    try {
      const { error } = await supabase
        .from('prescriptions')
        .insert({
          appointment_id: id,
          doctor_id: appointment.doctor_id,
          patient_id: appointment.patient_id,
          prescription_text: `[Clinical Notes]: ${notes}\n[Medications]: ${prescriptionText}`
        });

      if (error) {
        alert('Failed saving Rx: ' + error.message);
      } else {
        // Complete appointment
        await supabase.from('appointments').update({ status: 'completed' }).eq('id', id);
        setRxSaved(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingNotes(false);
    }
  };

  const handleEndCall = () => {
    if (confirm('Are you sure you want to end this consultation call?')) {
      if (profile?.role === 'doctor') {
        router.push('/dashboard/doctor');
      } else {
        router.push('/dashboard/patient');
      }
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex-grow flex items-center justify-center py-24 bg-slate-900">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isDoc = profile?.role === 'doctor';

  return (
    <div className="flex-grow flex flex-col lg:flex-row bg-[#080b18] text-slate-100 min-h-[calc(100vh-70px)]">
      
      {/* LEFT: Video Consultation Panel */}
      <div className="flex-grow p-4 md:p-6 flex flex-col justify-between relative border-r border-slate-800/80">
        
        {/* Call Status bar */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-800/60 backdrop-blur-md relative z-10">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">NovaCare Telehealth Consult</span>
          </div>
          <div className="text-right text-xs">
            <p className="font-bold text-slate-200">
              {isDoc ? `Patient: ${appointment?.patientName}` : `Doctor: ${appointment?.doctorName}`}
            </p>
            <p className="text-[10px] text-slate-400 capitalize">{appointment?.consultation_type} • Live HD Link</p>
          </div>
        </div>

        {/* Video Canvases layout */}
        <div className="flex-grow my-4 rounded-3xl overflow-hidden relative border border-slate-800 bg-slate-950/40 flex items-center justify-center">
          
          {/* Main Remote Feed */}
          {videoOn ? (
            <div className="absolute inset-0 w-full h-full">
              <img 
                src={isDoc 
                  ? 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800' 
                  : 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=800'} 
                alt="Partner Video feed"
                className="w-full h-full object-cover"
              />
              {/* Remote name tag */}
              <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800/60 text-xs font-bold text-white">
                {isDoc ? appointment?.patientName : appointment?.doctorName}
              </div>
            </div>
          ) : (
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto">
                <VideoOff className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-xs text-slate-400 font-bold">Video Feed Paused</p>
            </div>
          )}

          {/* Local Picture-in-Picture feed */}
          <div className="absolute top-4 right-4 w-28 md:w-36 aspect-video rounded-xl overflow-hidden border-2 border-slate-700/80 bg-slate-900 shadow-2xl relative z-10">
            <img 
              src={isDoc 
                ? 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300' 
                : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=300'} 
              alt="My camera"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-1.5 left-1.5 text-[9px] font-bold text-white bg-slate-950/70 px-1.5 py-0.5 rounded">
              You
            </div>
          </div>
        </div>

        {/* Video Control Buttons bar */}
        <div className="flex justify-center items-center gap-4 py-3 rounded-2xl bg-slate-900/60 border border-slate-800/60 backdrop-blur-md relative z-10 w-max mx-auto px-6">
          <button 
            onClick={() => setAudioOn(!audioOn)}
            className={`p-3 rounded-xl border transition ${audioOn ? 'border-slate-800 hover:bg-slate-800 text-white' : 'bg-red-500 border-transparent text-white'}`}
            title={audioOn ? 'Mute' : 'Unmute'}
          >
            {audioOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          <button 
            onClick={() => setVideoOn(!videoOn)}
            className={`p-3 rounded-xl border transition ${videoOn ? 'border-slate-800 hover:bg-slate-800 text-white' : 'bg-red-500 border-transparent text-white'}`}
            title={videoOn ? 'Stop Camera' : 'Start Camera'}
          >
            {videoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          <button 
            onClick={() => setScreenShare(!screenShare)}
            className={`p-3 rounded-xl border transition ${screenShare ? 'bg-primary border-transparent text-white' : 'border-slate-800 hover:bg-slate-800 text-white'}`}
            title="Share Screen"
          >
            <Monitor className="w-5 h-5" />
          </button>

          <button 
            onClick={handleEndCall}
            className="p-3 rounded-xl bg-red-600 border-transparent text-white hover:bg-red-700 transition"
            title="End Call"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>

      </div>

      {/* RIGHT: Chat, History, Prescription composer tabbed panels */}
      <div className="w-full lg:w-[420px] shrink-0 border-l border-slate-800 bg-[#0c0f24] flex flex-col justify-between">
        
        {/* Navigation Tabs */}
        <div className="p-3 border-b border-slate-800/60 grid grid-cols-3 gap-1.5">
          <button
            onClick={() => setActivePanel('chat')}
            className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activePanel === 'chat' ? 'bg-slate-800 text-primary' : 'text-slate-400 hover:bg-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" /> Consultation Chat
          </button>
          
          <button
            onClick={() => setActivePanel('history')}
            className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activePanel === 'history' ? 'bg-slate-800 text-primary' : 'text-slate-400 hover:bg-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" /> Vitals/History
          </button>

          <button
            onClick={() => setActivePanel('rx')}
            className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activePanel === 'rx' ? 'bg-slate-800 text-primary' : 'text-slate-400 hover:bg-slate-900'
            }`}
          >
            <CheckCircle className="w-4 h-4" /> {isDoc ? 'Write Rx' : 'Digital Prescription'}
          </button>
        </div>

        {/* Dynamic Panels */}
        <div className="flex-grow p-4 overflow-y-auto min-h-[350px]">
          
          {/* TAB 1: CONSULTATION CHAT */}
          {activePanel === 'chat' && (
            <div className="flex flex-col justify-between h-full space-y-4">
              <div className="flex-grow space-y-3 overflow-y-auto">
                {chatLog.map((msg, index) => {
                  const myMsg = msg.sender === (isDoc ? 'doctor' : 'patient');
                  return (
                    <div 
                      key={index}
                      className={`flex flex-col max-w-[80%] ${myMsg ? 'ml-auto items-end' : 'items-start'}`}
                    >
                      <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                        myMsg 
                          ? 'bg-gradient-to-tr from-primary to-secondary text-white rounded-tr-none' 
                          : 'bg-slate-800 border border-slate-700/60 text-slate-100 rounded-tl-none'
                      }`}>
                        {msg.text}
                      </div>
                      <span className="text-[9px] text-slate-500 mt-1 font-semibold">{msg.time}</span>
                    </div>
                  );
                })}
              </div>
              
              {/* Send bar */}
              <div className="flex gap-2 pt-2 border-t border-slate-800/80">
                <input 
                  type="text" 
                  placeholder="Type symptoms, tips..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                  className="flex-grow px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:border-primary text-slate-200"
                />
                <button 
                  onClick={handleSendChat}
                  className="p-2 rounded-xl bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 shadow-md shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: VITALS & HISTORY */}
          {activePanel === 'history' && (
            <div className="space-y-4">
              <h4 className="font-extrabold text-sm text-slate-200 uppercase tracking-wide">Patient Clinical Background</h4>
              
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Demographics</span>
                  <div className="grid grid-cols-2 text-xs gap-y-1">
                    <span className="text-slate-400">Name:</span>
                    <span className="font-bold text-slate-200">{appointment?.patientName}</span>
                    <span className="text-slate-400">Blood Type:</span>
                    <span className="font-bold text-slate-200">{appointment?.bloodGroup}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-red-500 tracking-wider">Known Allergies</span>
                  <p className="text-xs font-semibold text-slate-300">{appointment?.allergies}</p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Medical Notes</span>
                  <p className="text-xs leading-relaxed text-slate-300 whitespace-pre-line">{appointment?.medicalHistory}</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: WRITING PRESCRIPTION */}
          {activePanel === 'rx' && (
            <div className="space-y-4">
              {isDoc ? (
                <>
                  <h4 className="font-extrabold text-sm text-slate-200 uppercase tracking-wide">Digital Rx Composer</h4>
                  
                  {rxSaved ? (
                    <div className="p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 text-center space-y-3">
                      <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
                      <h5 className="font-bold text-slate-100">Prescription Saved!</h5>
                      <p className="text-xs text-slate-400">
                        The patient can immediately view and download this prescription from their clinical reports history.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Clinical notes */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">General Clinical Notes</label>
                        <textarea 
                          rows={3}
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="e.g. Diagnosis: Severe upper respiratory tract infection. Advice: Hydrate, avoid cold drinks."
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-800 bg-slate-900 text-slate-200 focus:outline-none"
                        />
                      </div>

                      {/* Medications */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Medications & Frequency</label>
                        <textarea 
                          rows={6}
                          value={prescriptionText}
                          onChange={(e) => setPrescriptionText(e.target.value)}
                          placeholder="e.g.&#10;1. Azithromycin 500mg - Once daily for 3 days&#10;2. Cough Syrup 10ml - Thrice daily after meals"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-800 bg-slate-900 text-slate-200 focus:outline-none font-mono"
                        />
                      </div>

                      <button
                        onClick={handleSaveRxByDoctor}
                        disabled={savingNotes}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
                      >
                        {savingNotes ? 'Submitting Rx...' : 'Complete Visit & Compile Rx'}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <h4 className="font-extrabold text-sm text-slate-200 uppercase tracking-wide">Doctor Prescription</h4>
                  
                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 space-y-3">
                    <p className="text-xs leading-relaxed text-slate-300">
                      The clinical doctor is currently composing your digital prescription. Once submitted, it will synchronize and appear right here.
                    </p>
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-500 flex gap-1.5 leading-relaxed font-semibold">
                      <Info className="w-4 h-4 shrink-0" />
                      <span>If you need immediate clinical care or medicines, download the PDF copy from the report section of your dashboard once finalized.</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer info panel */}
        <div className="p-3 bg-slate-950 text-slate-500 text-[10px] text-center border-t border-slate-900 flex items-center justify-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          HIPAA & GDPR Encrypted Telehealth Connection
        </div>

      </div>

    </div>
  );
}
