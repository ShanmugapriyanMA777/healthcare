'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { Search, Heart, ShieldAlert, Award, Star, Users, PhoneCall, ChevronDown, CheckCircle, Video, Calendar, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Mock FAQ database
const FAQS = [
  {
    q: "How does the virtual video consultation work?",
    a: "When you book an 'Online Consultation', a secure Telehealth session room is automatically generated. You and your doctor can join the room directly from your dashboard with one click. It features high-quality mock audio/video feeds, clinical notes, and real-time messaging."
  },
  {
    q: "Can I upload my existing physical reports?",
    a: "Yes! NovaCare features a secure Medical Reports Manager. You can drag and drop your PDFs, blood tests, or X-rays into your dashboard. They are securely encrypted and can be selectively shared with your assigned doctors."
  },
  {
    q: "Is my medical data secure on NovaCare?",
    a: "Absolutely. We enforce Row Level Security (RLS) on all database tables. This means only you and the doctors you explicitly share reports or book appointments with can view your files. Admins can manage registrations but cannot view your private diagnostic reports."
  },
  {
    q: "What should I do in case of a medical emergency?",
    a: "NovaCare provides an Emergency Hotline directly at the top of the screen and a specialized Emergency section below. You can call +1 (800) 999-9999 for immediate ambulance dispatch or dial the hotline from our landing page."
  }
];

export default function LandingPage() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [stats, setStats] = useState({ patients: 0, doctors: 0, consultations: 0 });

  // Load doctors and calculate stats
  useEffect(() => {
    const loadData = async () => {
      // Fetch public users and doctors
      const { data: usersData } = await supabase.from('users').select('*').eq('role', 'doctor');
      const { data: docsData } = await supabase.from('doctors').select('*');
      
      if (usersData && docsData) {
        const joined = docsData.map((d: any) => {
          const userObj = usersData.find((u: any) => u.id === d.user_id);
          return {
            ...d,
            name: userObj?.name || 'Dr. Specialist',
            profile_image: userObj?.profile_image || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200',
            email: userObj?.email,
          };
        });
        setDoctors(joined);
      }

      // Load count statistics
      const { data: allUsers } = await supabase.from('users').select('role');
      const { data: allAppts } = await supabase.from('appointments').select('id');
      
      const patCount = allUsers?.filter((u: any) => u.role === 'patient').length || 1240;
      const docCount = docsData?.length || 4;
      const apptCount = allAppts?.length || 482;

      setStats({
        patients: patCount,
        doctors: docCount,
        consultations: apptCount
      });
    };

    loadData();
  }, []);

  const specialties = ['All', 'Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics'];

  const filteredDoctors = doctors.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          doc.specialization.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialty = selectedSpecialty === 'All' || doc.specialization === selectedSpecialty;
    return matchesSearch && matchesSpecialty;
  });

  return (
    <div className="w-full flex flex-col overflow-x-hidden">
      
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-24 pb-16 px-4 md:px-8 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background">
        {/* Animated background highlights */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6 text-left"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/15 text-primary border border-primary/20">
              <Award className="w-4 h-4" />
              World-Class Telehealth & Healthcare Platform
            </div>
            
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight text-foreground">
              Your Health, <br />
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Futuristically Managed
              </span>
            </h1>
            
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-xl">
              Connect with elite specialists, book instant physical or virtual video visits, upload secure reports, and chat with our AI medical companion—all in one encrypted dashboard.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <Link 
                href="/auth" 
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/30 text-white font-bold text-center transition duration-300 flex items-center justify-center gap-2 group"
              >
                Book Appointment Now
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a 
                href="#services" 
                className="px-8 py-4 rounded-xl border border-border hover:bg-muted font-bold text-center transition text-foreground"
              >
                Learn More
              </a>
            </div>

            <div className="flex items-center gap-6 pt-4 border-t border-border/50">
              <div className="flex -space-x-3">
                <img className="w-10 h-10 rounded-full border-2 border-background object-cover" src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=80" alt="Doctor" />
                <img className="w-10 h-10 rounded-full border-2 border-background object-cover" src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=80" alt="Doctor" />
                <img className="w-10 h-10 rounded-full border-2 border-background object-cover" src="https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&w=80" alt="Doctor" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">50+ Board Specialists</p>
                <p className="text-xs text-muted-foreground">Available 24/7 for virtual consults</p>
              </div>
            </div>
          </motion.div>

          {/* Right side illustration */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative flex items-center justify-center"
          >
            <div className="relative w-full max-w-[480px] aspect-square rounded-3xl overflow-hidden glass-panel border border-white/10 p-6 flex flex-col justify-between shadow-2xl shadow-primary/5 animate-float">
              
              {/* Image banner inside hero mockup */}
              <div className="relative h-[65%] w-full rounded-2xl overflow-hidden bg-muted group">
                <img 
                  src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=600" 
                  alt="Telemedicine Video Consult" 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                  <div className="flex items-center gap-2 text-white">
                    <div className="p-1.5 rounded-full bg-emerald-500 animate-pulse">
                      <Video className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xs font-semibold">Virtual Doctor consultation active</span>
                  </div>
                </div>
              </div>

              {/* Patient vital widgets inside hero */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="p-3 rounded-xl border border-border bg-card flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
                    <Heart className="w-5 h-5 fill-red-500 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-semibold">Pulse Rate</p>
                    <p className="text-sm font-bold text-foreground">72 BPM</p>
                  </div>
                </div>
                
                <div className="p-3 rounded-xl border border-border bg-card flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-semibold">Verified Safe</p>
                    <p className="text-sm font-bold text-foreground">100% Secure</p>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. STATS COUNTER */}
      <section className="py-12 border-y border-border/60 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="space-y-1">
            <h3 className="text-3xl md:text-4xl font-extrabold text-primary">{stats.patients}+</h3>
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">Registered Patients</p>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl md:text-4xl font-extrabold text-secondary">{stats.doctors}</h3>
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">Elite Staff Doctors</p>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl md:text-4xl font-extrabold text-accent">{stats.consultations}+</h3>
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">Consultations Managed</p>
          </div>
        </div>
      </section>

      {/* 3. HEALTHCARE SERVICES */}
      <section id="services" className="py-20 px-4 md:px-8 max-w-7xl mx-auto text-center space-y-12">
        <div className="space-y-3">
          <h2 className="text-3xl md:text-4xl font-extrabold">Our Specialized Departments</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            NovaCare features state-of-the-art diagnostic facilities and premium clinical services led by national healthcare professionals.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: 'Cardiology',
              desc: 'Advanced cardiac care, ECG reviews, risk assessments, and cardiovascular consultations.',
              icon: Heart,
              color: 'text-red-500 bg-red-500/10'
            },
            {
              title: 'Neurology',
              desc: 'Neurological assessments, migraines, sleep disorders, and brain diagnostic reviews.',
              icon: Award,
              color: 'text-secondary bg-secondary/10'
            },
            {
              title: 'Pediatrics',
              desc: 'Complete child development, immunizations, and pediatric medical checkups.',
              icon: Users,
              color: 'text-amber-500 bg-amber-500/10'
            },
            {
              title: 'Orthopedics',
              desc: 'Musculoskeletal therapy, fracture treatments, joint recovery, and sports medicine.',
              icon: CheckCircle,
              color: 'text-emerald-500 bg-emerald-500/10'
            }
          ].map((srv, idx) => (
            <div key={idx} className="glass-card border border-border p-6 rounded-2xl text-left space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${srv.color}`}>
                  <srv.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground">{srv.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{srv.desc}</p>
              </div>
              <button 
                onClick={() => {
                  setSelectedSpecialty(srv.title);
                  document.getElementById('doctors')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-sm text-primary hover:text-secondary font-bold flex items-center gap-1 transition self-start"
              >
                View Specialists <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 4. SEARCH AND FEATURED SPECIALISTS */}
      <section id="doctors" className="py-20 px-4 md:px-8 border-t border-border/50 bg-muted/20">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              <h2 className="text-3xl md:text-4xl font-extrabold">Find Your Specialist</h2>
              <p className="text-muted-foreground">Search our staff list and book physical or video consultations instantly.</p>
            </div>
            
            {/* Filter buttons */}
            <div className="flex flex-wrap gap-2">
              {specialties.map((spec) => (
                <button
                  key={spec}
                  onClick={() => setSelectedSpecialty(spec)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                    selectedSpecialty === spec 
                      ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md' 
                      : 'border border-border bg-card text-foreground/80 hover:bg-muted'
                  }`}
                >
                  {spec}
                </button>
              ))}
            </div>
          </div>

          {/* Search bar */}
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search doctor names or medical specializations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-border bg-card focus:outline-none focus:border-primary transition shadow-inner"
            />
          </div>

          {/* Doctors list grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredDoctors.length > 0 ? (
                filteredDoctors.map((doc) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    key={doc.id} 
                    className="glass-panel border border-white/10 rounded-2xl overflow-hidden flex flex-col justify-between shadow-lg"
                  >
                    <div>
                      {/* Doctor image banner */}
                      <div className="h-48 w-full bg-muted relative">
                        <img 
                          src={doc.profile_image} 
                          alt={doc.name} 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 right-3 bg-gradient-to-r from-primary to-secondary text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md">
                          {doc.specialization}
                        </div>
                      </div>

                      {/* Doctor details */}
                      <div className="p-5 space-y-3">
                        <div>
                          <h4 className="text-lg font-bold text-foreground">{doc.name}</h4>
                          <p className="text-xs text-primary font-semibold">{doc.qualification}</p>
                        </div>

                        <div className="flex justify-between items-center text-xs border-y border-border/50 py-2">
                          <span className="text-muted-foreground">Exp: <strong className="text-foreground">{doc.experience} Years</strong></span>
                          <span className="text-muted-foreground">Fee: <strong className="text-foreground">₹{doc.consultation_fee}</strong></span>
                        </div>

                        {/* Availability list preview */}
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide">Active Days</span>
                          <div className="flex gap-1">
                            {Object.keys(doc.availability).slice(0, 3).map((day) => (
                              <span key={day} className="text-[10px] bg-muted px-2 py-0.5 rounded font-semibold capitalize text-foreground/80">
                                {day.substring(0, 3)}
                              </span>
                            ))}
                            {Object.keys(doc.availability).length > 3 && (
                              <span className="text-[10px] text-muted-foreground px-1 font-semibold">
                                +{Object.keys(doc.availability).length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 pt-0">
                      <Link 
                        href="/auth" 
                        className="w-full block py-2.5 text-center text-xs font-bold rounded-xl bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/20 text-white transition duration-300"
                      >
                        Book Appointment
                      </Link>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full py-12 text-center text-muted-foreground font-semibold">
                  No specialists found matching your search options.
                </div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </section>

      {/* 5. TESTIMONIALS */}
      <section className="py-20 px-4 md:px-8 border-t border-border/50">
        <div className="max-w-7xl mx-auto space-y-12 text-center">
          <div className="space-y-3">
            <h2 className="text-3xl md:text-4xl font-extrabold">What Our Patients Say</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Real testimonials from patients who received therapy, virtual consults, and surgery at our facilities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {[
              {
                text: "The online video consultation was incredibly smooth! The doctor looked over my uploaded MRI file in real-time and explained my treatment schedule in detail.",
                user: "Sarah K.",
                role: "Telehealth Patient",
                rating: 5
              },
              {
                text: "Having an AI chat bot that explains medical abbreviations and guides you through booking makes this site so much better than traditional patient portals.",
                user: "David M.",
                role: "Orthopedic Patient",
                rating: 5
              },
              {
                text: "Very premium layout and dark mode is great. Uploading files is very easy, and the doctor had my reports ready before our meeting started.",
                user: "Aisha P.",
                role: "Cardiac Clinic Guest",
                rating: 5
              }
            ].map((test, idx) => (
              <div key={idx} className="glass-card border border-border p-6 rounded-2xl flex flex-col justify-between space-y-4">
                <p className="text-sm text-foreground/80 italic leading-relaxed">"{test.text}"</p>
                <div className="flex items-center gap-3 pt-3 border-t border-border/50">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-bold text-sm">
                    {test.user[0]}
                  </div>
                  <div>
                    <h5 className="font-bold text-foreground text-sm">{test.user}</h5>
                    <p className="text-xs text-muted-foreground">{test.role}</p>
                    <div className="flex gap-0.5 mt-1">
                      {[...Array(test.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. EMERGENCY CONTACT PANIC PANEL */}
      <section id="emergency" className="py-12 px-4 md:px-8 bg-gradient-to-r from-red-500/10 to-transparent border-y border-red-500/20">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-4 text-left">
            <div className="w-14 h-14 rounded-2xl bg-red-500/15 flex items-center justify-center shrink-0 border border-red-500/30">
              <PhoneCall className="w-7 h-7 text-red-500 animate-bounce" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl md:text-2xl font-bold text-red-600 dark:text-red-500 flex items-center gap-2">
                Emergency Trauma & Ambulance Hotline
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                Our trauma unit is staffed 24/7. Dial immediately to summon emergency critical care response vehicles.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 w-full lg:w-auto shrink-0 justify-center">
            <a 
              href="tel:+18009999999" 
              className="px-8 py-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-base shadow-lg shadow-red-500/20 text-center transition flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              <PhoneCall className="w-5 h-5" />
              Call Now: +1 (800) 999-9999
            </a>
          </div>
        </div>
      </section>

      {/* 7. FAQ SECTION */}
      <section id="faq" className="py-20 px-4 md:px-8 max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-3xl md:text-4xl font-extrabold">Frequently Asked Questions</h2>
          <p className="text-muted-foreground">General answers to support your portal experience.</p>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, idx) => {
            const isOpened = activeFaq === idx;
            return (
              <div 
                key={idx} 
                className="border border-border rounded-xl bg-card overflow-hidden transition"
              >
                <button
                  onClick={() => setActiveFaq(isOpened ? null : idx)}
                  className="w-full px-6 py-4 flex items-center justify-between font-bold text-left hover:bg-muted/40 transition text-sm md:text-base text-foreground"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${isOpened ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence initial={false}>
                  {isOpened && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-6 pb-4 pt-1 text-sm text-muted-foreground leading-relaxed border-t border-border/30 bg-muted/10 whitespace-pre-line">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="bg-card border-t border-border py-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white">
                <Heart className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg text-foreground">NovaCare</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Empowering clinics, clinical doctors, and emergency trauma centers worldwide through advanced telemedicine and dashboard workflows.
            </p>
          </div>

          <div>
            <h5 className="font-bold text-sm mb-4 text-foreground">Quick Links</h5>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><Link href="#services" className="hover:text-primary transition">Departments</Link></li>
              <li><Link href="#doctors" className="hover:text-primary transition">Specialist Directory</Link></li>
              <li><Link href="#emergency" className="hover:text-primary transition">Emergency Clinic</Link></li>
              <li><Link href="#faq" className="hover:text-primary transition">FAQs</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-sm mb-4 text-foreground">Departments</h5>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><button onClick={() => setSelectedSpecialty('Cardiology')} className="hover:text-primary transition">Cardiology</button></li>
              <li><button onClick={() => setSelectedSpecialty('Neurology')} className="hover:text-primary transition">Neurology</button></li>
              <li><button onClick={() => setSelectedSpecialty('Pediatrics')} className="hover:text-primary transition">Pediatrics</button></li>
              <li><button onClick={() => setSelectedSpecialty('Orthopedics')} className="hover:text-primary transition">Orthopedics</button></li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-sm mb-4 text-foreground">Legal & Safety</h5>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><Link href="#" className="hover:text-primary transition">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-primary transition">HIPAA Compliance</Link></li>
              <li><Link href="#" className="hover:text-primary transition">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 border-t border-border/50 text-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} NovaCare Healthcare Systems Inc. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}
