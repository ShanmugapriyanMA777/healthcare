-- Premium Healthcare Center Database Schema

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- USERS TABLE (maps to auth.users)
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  role text not null check (role in ('patient', 'doctor', 'admin')),
  name text not null,
  email text not null unique,
  phone text,
  profile_image text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- DOCTORS TABLE
create table public.doctors (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null unique,
  specialization text not null,
  qualification text not null,
  experience integer not null, -- in years
  consultation_fee numeric(10, 2) not null,
  availability jsonb not null default '{"monday": ["09:00-12:00", "14:00-17:00"], "tuesday": ["09:00-12:00", "14:00-17:00"], "wednesday": ["09:00-12:00", "14:00-17:00"], "thursday": ["09:00-12:00", "14:00-17:00"], "friday": ["09:00-12:00", "14:00-17:00"]}'::jsonb
);

-- PATIENTS TABLE
create table public.patients (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null unique,
  blood_group text,
  allergies text,
  medical_history text
);

-- APPOINTMENTS TABLE
create table public.appointments (
  id uuid default uuid_generate_v4() primary key,
  patient_id uuid references public.patients(id) on delete cascade not null,
  doctor_id uuid references public.doctors(id) on delete cascade not null,
  appointment_date date not null,
  appointment_time text not null, -- e.g., "09:30"
  consultation_type text not null check (consultation_type in ('physical', 'online')),
  meet_link text,
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- MEDICAL REPORTS TABLE
create table public.medical_reports (
  id uuid default uuid_generate_v4() primary key,
  patient_id uuid references public.patients(id) on delete cascade not null,
  doctor_id uuid references public.doctors(id) on delete set null, -- Shared with doctor
  report_name text not null,
  file_url text not null,
  uploaded_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- PRESCRIPTIONS TABLE
create table public.prescriptions (
  id uuid default uuid_generate_v4() primary key,
  appointment_id uuid references public.appointments(id) on delete cascade not null unique,
  doctor_id uuid references public.doctors(id) on delete cascade not null,
  patient_id uuid references public.patients(id) on delete cascade not null,
  prescription_text text not null, -- Detailed medical prescription details
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS
alter table public.users enable row level security;
alter table public.doctors enable row level security;
alter table public.patients enable row level security;
alter table public.appointments enable row level security;
alter table public.medical_reports enable row level security;
alter table public.prescriptions enable row level security;

-- USERS POLICIES
create policy "Allow users to read their own user record"
  on public.users for select
  using (auth.uid() = id);

create policy "Allow admins to read all user records"
  on public.users for select
  using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

create policy "Allow doctors to read patient profiles"
  on public.users for select
  using (
    role = 'patient' or 
    id = auth.uid() or
    exists (select 1 from public.users where id = auth.uid() and role = 'doctor')
  );

create policy "Allow users to update their own profile"
  on public.users for update
  using (auth.uid() = id);

-- DOCTORS POLICIES
create policy "Allow public to read doctor directory"
  on public.doctors for select
  using (true);

create policy "Allow doctors to edit their own profile"
  on public.doctors for update
  using (user_id = auth.uid());

create policy "Allow admins to edit doctors"
  on public.doctors for all
  using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

-- PATIENTS POLICIES
create policy "Allow patients to read/write their own profile"
  on public.patients for all
  using (user_id = auth.uid());

create policy "Allow doctors to read patient details"
  on public.patients for select
  using (exists (
    select 1 from public.users where id = auth.uid() and role = 'doctor'
  ));

create policy "Allow admins to read/write all patients"
  on public.patients for all
  using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

-- APPOINTMENTS POLICIES
create policy "Allow patients to read/write their own appointments"
  on public.appointments for all
  using (
    patient_id in (select id from public.patients where user_id = auth.uid())
  );

create policy "Allow doctors to read/update their appointments"
  on public.appointments for all
  using (
    doctor_id in (select id from public.doctors where user_id = auth.uid())
  );

create policy "Allow admins to read/write all appointments"
  on public.appointments for all
  using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

-- MEDICAL REPORTS POLICIES
create policy "Allow patients to read/write their own medical reports"
  on public.medical_reports for all
  using (
    patient_id in (select id from public.patients where user_id = auth.uid())
  );

create policy "Allow assigned doctors to read medical reports"
  on public.medical_reports for select
  using (
    doctor_id in (select id from public.doctors where user_id = auth.uid())
  );

create policy "Allow admins to read/write all medical reports"
  on public.medical_reports for all
  using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

-- PRESCRIPTIONS POLICIES
create policy "Allow patients to read their own prescriptions"
  on public.prescriptions for select
  using (
    patient_id in (select id from public.patients where user_id = auth.uid())
  );

create policy "Allow doctors to read/write prescriptions they issued"
  on public.prescriptions for all
  using (
    doctor_id in (select id from public.doctors where user_id = auth.uid())
  );

create policy "Allow admins to read all prescriptions"
  on public.prescriptions for select
  using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));


-- TRIGGER FOR AUTH REGISTRATION
-- Create a trigger that automatically inserts a user into public.users when an auth user is created
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, name, email, role, phone, profile_image)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'Valued Patient'),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'patient'),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'profile_image'
  );
  
  -- If the role is patient, also insert into public.patients
  if coalesce(new.raw_user_meta_data->>'role', 'patient') = 'patient' then
    insert into public.patients (user_id) values (new.id);
  -- If the role is doctor, insert into public.doctors
  elsif new.raw_user_meta_data->>'role' = 'doctor' then
    insert into public.doctors (user_id, specialization, qualification, experience, consultation_fee)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'specialization', 'General Medicine'),
      coalesce(new.raw_user_meta_data->>'qualification', 'MBBS'),
      coalesce((new.raw_user_meta_data->>'experience')::integer, 5),
      coalesce((new.raw_user_meta_data->>'consultation_fee')::numeric, 500.00)
    );
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
