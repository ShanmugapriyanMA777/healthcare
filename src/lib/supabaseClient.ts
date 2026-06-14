import { createClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Detect if we have real credentials
export const isRealSupabase = supabaseUrl !== '' && supabaseAnonKey !== '';

// Seed data interfaces
export interface Profile {
  id: string;
  role: 'patient' | 'doctor' | 'admin';
  name: string;
  email: string;
  phone?: string;
  profile_image?: string;
  created_at: string;
}

export interface Doctor {
  id: string;
  user_id: string;
  specialization: string;
  qualification: string;
  experience: number;
  consultation_fee: number;
  availability: Record<string, string[]>;
}

export interface Patient {
  id: string;
  user_id: string;
  blood_group?: string;
  allergies?: string;
  medical_history?: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  consultation_type: 'physical' | 'online';
  meet_link?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_at: string;
}

export interface MedicalReport {
  id: string;
  patient_id: string;
  doctor_id?: string;
  report_name: string;
  file_url: string;
  uploaded_at: string;
}

export interface Prescription {
  id: string;
  appointment_id: string;
  doctor_id: string;
  patient_id: string;
  prescription_text: string;
  created_at: string;
}

// Initial Mock Data Seeds
const SEED_USERS: Profile[] = [
  {
    id: 'user-admin-1',
    role: 'admin',
    name: 'Admin Director',
    email: 'admin@healthcare.com',
    phone: '+1 555-0199',
    profile_image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200',
    created_at: new Date().toISOString()
  },
  {
    id: 'user-doc-sarah',
    role: 'doctor',
    name: 'Dr. Sarah Jenkins',
    email: 'sarah.jenkins@healthcare.com',
    phone: '+1 555-0101',
    profile_image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200',
    created_at: new Date().toISOString()
  },
  {
    id: 'user-doc-rohan',
    role: 'doctor',
    name: 'Dr. Rohan Gupta',
    email: 'rohan.gupta@healthcare.com',
    phone: '+1 555-0102',
    profile_image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200',
    created_at: new Date().toISOString()
  },
  {
    id: 'user-doc-emily',
    role: 'doctor',
    name: 'Dr. Emily Chen',
    email: 'emily.chen@healthcare.com',
    phone: '+1 555-0103',
    profile_image: 'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=200',
    created_at: new Date().toISOString()
  },
  {
    id: 'user-doc-marcus',
    role: 'doctor',
    name: 'Dr. Marcus Vance',
    email: 'marcus.vance@healthcare.com',
    phone: '+1 555-0104',
    profile_image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200',
    created_at: new Date().toISOString()
  },
  {
    id: 'user-patient-john',
    role: 'patient',
    name: 'John Doe',
    email: 'patient@healthcare.com',
    phone: '+1 555-0120',
    profile_image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
    created_at: new Date().toISOString()
  }
];

const SEED_DOCTORS: Doctor[] = [
  {
    id: 'doc-sarah',
    user_id: 'user-doc-sarah',
    specialization: 'Cardiology',
    qualification: 'MD, DM (Cardiology), FACC',
    experience: 12,
    consultation_fee: 1200,
    availability: {
      monday: ['09:00-12:00', '14:00-17:00'],
      wednesday: ['09:00-12:00', '14:00-17:00'],
      friday: ['09:00-12:00', '14:00-17:00']
    }
  },
  {
    id: 'doc-rohan',
    user_id: 'user-doc-rohan',
    specialization: 'Neurology',
    qualification: 'MD, DM (Neurology)',
    experience: 15,
    consultation_fee: 1500,
    availability: {
      tuesday: ['10:00-13:00', '15:00-18:00'],
      thursday: ['10:00-13:00', '15:00-18:00']
    }
  },
  {
    id: 'doc-emily',
    user_id: 'user-doc-emily',
    specialization: 'Pediatrics',
    qualification: 'MD (Pediatrics), DCH',
    experience: 8,
    consultation_fee: 800,
    availability: {
      monday: ['10:00-14:00'],
      tuesday: ['10:00-14:00'],
      wednesday: ['10:00-14:00'],
      thursday: ['10:00-14:00']
    }
  },
  {
    id: 'doc-marcus',
    user_id: 'user-doc-marcus',
    specialization: 'Orthopedics',
    qualification: 'MS (Ortho), MCh (Ortho)',
    experience: 10,
    consultation_fee: 1000,
    availability: {
      wednesday: ['14:00-18:00'],
      thursday: ['14:00-18:00'],
      friday: ['09:00-13:00']
    }
  }
];

const SEED_PATIENTS: Patient[] = [
  {
    id: 'pat-john',
    user_id: 'user-patient-john',
    blood_group: 'O+',
    allergies: 'Penicillin, Dust Mites',
    medical_history: 'Hypertension diagnosed in 2023. Undergoing therapy.'
  }
];

// Helper to interact with Local Storage safely on browser
const loadStorage = (key: string, defaultVal: any) => {
  if (typeof window === 'undefined') return defaultVal;
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(defaultVal));
    return defaultVal;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return defaultVal;
  }
};

const saveStorage = (key: string, val: any) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(val));
  }
};

// Local storage state initialization
const initLocalStorage = () => {
  if (typeof window === 'undefined') return;
  loadStorage('hc_users', SEED_USERS);
  loadStorage('hc_doctors', SEED_DOCTORS);
  loadStorage('hc_patients', SEED_PATIENTS);
  loadStorage('hc_appointments', []);
  loadStorage('hc_reports', []);
  loadStorage('hc_prescriptions', []);
  loadStorage('hc_session', null);
};

// Run local storage initialization
if (typeof window !== 'undefined') {
  initLocalStorage();
}

// Mock query builder
class MockQueryBuilder {
  private table: string;
  private filters: Array<{ col: string; val: any }> = [];
  private orderBy: { col: string; asc: boolean } | null = null;
  private limitCount: number | null = null;
  private action: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private payload: any = null;
  private isSingle: boolean = false;

  constructor(table: string) {
    this.table = table;
  }

  select() {
    this.action = 'select';
    return this;
  }

  insert(val: any) {
    this.action = 'insert';
    this.payload = val;
    return this;
  }

  update(val: any) {
    this.action = 'update';
    this.payload = val;
    return this;
  }

  delete() {
    this.action = 'delete';
    return this;
  }

  eq(col: string, val: any) {
    this.filters.push({ col, val });
    return this;
  }

  order(col: string, options?: { ascending?: boolean }) {
    this.orderBy = { col, asc: options?.ascending !== false };
    return this;
  }

  limit(n: number) {
    this.limitCount = n;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  async execute() {
    // Map table aliases to localstorage keys
    const tableKeys: Record<string, string> = {
      users: 'hc_users',
      doctors: 'hc_doctors',
      patients: 'hc_patients',
      appointments: 'hc_appointments',
      medical_reports: 'hc_reports',
      prescriptions: 'hc_prescriptions',
    };

    const key = tableKeys[this.table];
    if (!key) {
      return { data: null, error: { message: `Table ${this.table} not found in mock store.` } };
    }

    let items = loadStorage(key, []);

    if (this.action === 'select') {
      // Apply filters
      for (const filter of this.filters) {
        items = items.filter((item: any) => item[filter.col] === filter.val);
      }

      // Apply ordering
      if (this.orderBy) {
        const { col, asc } = this.orderBy;
        items.sort((a: any, b: any) => {
          if (a[col] < b[col]) return asc ? -1 : 1;
          if (a[col] > b[col]) return asc ? 1 : -1;
          return 0;
        });
      }

      // Apply limit
      if (this.limitCount !== null) {
        items = items.slice(0, this.limitCount);
      }

      const result = this.isSingle ? (items[0] || null) : items;
      return { data: result, error: null };
    }

    if (this.action === 'insert') {
      const payloads = Array.isArray(this.payload) ? this.payload : [this.payload];
      const newItems = payloads.map((p) => ({
        id: p.id || `mock-${this.table}-${Math.random().toString(36).substring(2, 9)}`,
        created_at: new Date().toISOString(),
        ...p,
      }));

      items = [...items, ...newItems];
      saveStorage(key, items);

      // Return inserted data
      const result = this.isSingle || !Array.isArray(this.payload) ? newItems[0] : newItems;
      return { data: result, error: null };
    }

    if (this.action === 'update') {
      let updatedItems: any[] = [];
      items = items.map((item: any) => {
        // Match filters
        const matches = this.filters.every((f) => item[f.col] === f.val);
        if (matches) {
          const updated = { ...item, ...this.payload };
          updatedItems.push(updated);
          return updated;
        }
        return item;
      });

      saveStorage(key, items);
      const result = this.isSingle ? (updatedItems[0] || null) : updatedItems;
      return { data: result, error: null };
    }

    if (this.action === 'delete') {
      let deletedItems: any[] = [];
      items = items.filter((item: any) => {
        const matches = this.filters.every((f) => item[f.col] === f.val);
        if (matches) {
          deletedItems.push(item);
          return false;
        }
        return true;
      });

      saveStorage(key, items);
      return { data: deletedItems, error: null };
    }

    return { data: null, error: { message: 'Unsupported action' } };
  }

  // Thenable implementation to support direct await on supabase.from().select()
  then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    return this.execute().then(onfulfilled, onrejected);
  }
}

// Mock auth module
class MockAuth {
  private listeners: Array<(event: string, session: any) => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      // Listen to storage changes to coordinate session
      window.addEventListener('storage', (e) => {
        if (e.key === 'hc_session') {
          const session = e.newValue ? JSON.parse(e.newValue) : null;
          this.trigger('SIGNED_IN', session);
        }
      });
    }
  }

  private trigger(event: string, session: any) {
    this.listeners.forEach((l) => l(event, session));
  }

  async signUp({ email, password, options }: any) {
    const users = loadStorage('hc_users', SEED_USERS);
    const exists = users.find((u: any) => u.email === email);
    if (exists) {
      return { data: null, error: { message: 'User already exists' } };
    }

    const userId = `user-pat-${Math.random().toString(36).substring(2, 9)}`;
    const role = options?.data?.role || 'patient';
    const newUser: Profile = {
      id: userId,
      role,
      name: options?.data?.name || 'Valued Patient',
      email,
      phone: options?.data?.phone || '',
      profile_image: options?.data?.profile_image || `https://api.dicebear.com/7.x/adventurer/svg?seed=${userId}`,
      created_at: new Date().toISOString()
    };

    // Save to users
    saveStorage('hc_users', [...users, newUser]);

    // Save to patients/doctors table accordingly
    if (role === 'patient') {
      const patients = loadStorage('hc_patients', SEED_PATIENTS);
      const newPatient: Patient = {
        id: `pat-${Math.random().toString(36).substring(2, 9)}`,
        user_id: userId,
        blood_group: options?.data?.blood_group || 'O+',
        allergies: options?.data?.allergies || '',
        medical_history: options?.data?.medical_history || ''
      };
      saveStorage('hc_patients', [...patients, newPatient]);
    } else if (role === 'doctor') {
      const doctors = loadStorage('hc_doctors', SEED_DOCTORS);
      const newDoctor: Doctor = {
        id: `doc-${Math.random().toString(36).substring(2, 9)}`,
        user_id: userId,
        specialization: options?.data?.specialization || 'General Medicine',
        qualification: options?.data?.qualification || 'MBBS',
        experience: Number(options?.data?.experience) || 5,
        consultation_fee: Number(options?.data?.consultation_fee) || 500,
        availability: {
          monday: ['09:00-12:00', '14:00-17:00'],
          tuesday: ['09:00-12:00', '14:00-17:00'],
          wednesday: ['09:00-12:00', '14:00-17:00'],
          thursday: ['09:00-12:00', '14:00-17:00'],
          friday: ['09:00-12:00', '14:00-17:00']
        }
      };
      saveStorage('hc_doctors', [...doctors, newDoctor]);
    }

    const session = {
      user: {
        id: userId,
        email,
        user_metadata: {
          name: newUser.name,
          role: newUser.role,
          phone: newUser.phone,
          profile_image: newUser.profile_image
        }
      }
    };

    saveStorage('hc_session', session);
    this.trigger('SIGNED_IN', session);

    return { data: session, error: null };
  }

  async signInWithPassword({ email, password }: any) {
    // For demo simplicity, accept the default credentials and bypass exact passwords
    const users = loadStorage('hc_users', SEED_USERS);
    const user = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return { data: null, error: { message: 'Invalid credentials. User not found.' } };
    }

    // Handle dummy passwords
    if (email === 'admin@healthcare.com' && password !== 'admin123') {
      return { data: null, error: { message: 'Incorrect password for Admin account' } };
    }
    if (email === 'patient@healthcare.com' && password !== 'patient123') {
      return { data: null, error: { message: 'Incorrect password for Patient account' } };
    }
    if (email.endsWith('@healthcare.com') && password === 'wrong') {
      return { data: null, error: { message: 'Incorrect password.' } };
    }

    const session = {
      user: {
        id: user.id,
        email: user.email,
        user_metadata: {
          name: user.name,
          role: user.role,
          phone: user.phone,
          profile_image: user.profile_image
        }
      }
    };

    saveStorage('hc_session', session);
    this.trigger('SIGNED_IN', session);

    return { data: session, error: null };
  }

  async signOut() {
    saveStorage('hc_session', null);
    this.trigger('SIGNED_OUT', null);
    return { error: null };
  }

  async getUser() {
    const session = loadStorage('hc_session', null);
    return { data: session ? session.user : null, error: null };
  }

  async getSession() {
    const session = loadStorage('hc_session', null);
    return { data: { session }, error: null };
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    this.listeners.push(callback);
    // Trigger initial auth state immediately
    const session = loadStorage('hc_session', null);
    callback(session ? 'INITIAL_SESSION' : 'SIGNED_OUT', session);

    return {
      data: {
        subscription: {
          unsubscribe: () => {
            this.listeners = this.listeners.filter((l) => l !== callback);
          }
        }
      }
    };
  }
}

// Mock storage module
class MockStorage {
  from(bucket: string) {
    return {
      async upload(path: string, file: File) {
        // Create an ObjectURL to simulate uploaded file previews in client-side
        const url = URL.createObjectURL(file);
        return { data: { path, fullPath: `${bucket}/${path}` }, error: null, url };
      },
      getPublicUrl(path: string) {
        // Return a dummy public url or use the saved object url if cached
        return { data: { publicUrl: path.startsWith('blob:') ? path : `https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=400` } };
      }
    };
  }
}

// Create real client if credentials present, otherwise expose custom Mock client
const mockClient = {
  auth: new MockAuth(),
  from: (table: string) => new MockQueryBuilder(table),
  storage: new MockStorage(),
};

export const supabase = isRealSupabase
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (mockClient as any);
