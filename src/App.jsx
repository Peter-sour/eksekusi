import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, BookOpen, Calendar, Code, Target, Shield, 
  Activity, DollarSign, Settings, CheckCircle, Clock, 
  AlertTriangle, ChevronRight, ChevronLeft, ChevronDown, Plus, Trash2, 
  Menu, X, Terminal, Globe, FileText, Briefcase, 
  Zap, Brain, Layers, Coffee, Mail, History, RefreshCw,
  CalendarPlus, ArrowUpRight, Search, User, LogOut,
  BarChart2, TrendingUp, AlertCircle, Save, Download, Upload, Edit3
} from 'lucide-react';

/**
 * ============================================================================
 * HELPER FUNCTIONS & UTILITIES
 * ============================================================================
 */

// 1. Get Current Indonesian Day
const getIndonesianDay = () => {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return days[new Date().getDay()];
};

// 2. Google Calendar Integration
const addToGoogleCalendar = (activityName, dayName, timeString) => {
  const daysMap = { "Minggu": 0, "Senin": 1, "Selasa": 2, "Rabu": 3, "Kamis": 4, "Jumat": 5, "Sabtu": 6 };
  const targetDay = daysMap[dayName];
  const now = new Date();
  const currentDay = now.getDay();
  
  let daysUntilTarget = targetDay - currentDay;
  if (daysUntilTarget < 0) daysUntilTarget += 7;
  if (daysUntilTarget === 0 && now.getHours() > parseInt(timeString.split(':')[0])) daysUntilTarget = 7;

  const targetDate = new Date(now);
  targetDate.setDate(now.getDate() + daysUntilTarget);
  
  const [hours, minutes] = timeString.split(':').map(Number);
  targetDate.setHours(hours, minutes, 0);
  const endDate = new Date(targetDate);
  endDate.setHours(hours + 2, minutes, 0);

  const formatTime = (date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");
  const start = formatTime(targetDate);
  const end = formatTime(endDate);

  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(activityName)}&dates=${start}/${end}&details=Jadwal+Eksekusi+Semester+4+High-Performance&sf=true&output=xml`;
  
  window.open(url, '_blank');
};

// 3. Currency Formatter (IDR)
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

// 4. Burnout Calculator
const calculateBurnoutScore = (logs) => {
  if (!logs || logs.length === 0) return 0;
  const lastLog = logs[0];
  const score = ((10 - lastLog.sleep) * 0.4) + (lastLog.stress * 0.4) + ((10 - lastLog.mood) * 0.2);
  return Math.min(10, Math.max(0, parseFloat(score.toFixed(1))));
};

/**
 * ============================================================================
 * DATA STRUCTURES (DATABASE)
 * ============================================================================
 */

const DEFAULT_DATA = {
  currentWeek: 1, 
  lastUpdated: new Date().toISOString(),
  user: {
    name: "Mahasiswa High-Performance",
    semester: 4,
    targetIPK: 4.00,
    university: "Universitas Teknologi",
    theme: "dark"
  },
  weeklyHistory: [], 
  
  // --- MODULE 1: ACADEMICS ---
  academics: [
    {
      id: "mk_a",
      name: "Workshop Pengembangan Perangkat Lunak Berbasis Agile",
      sks: 3,
      target: 86,
      targetGrade: "A",
      currentScore: 0,
      weight: { tugas: 20, project: 35, uts: 20, uas: 25 },
      strategies: [
        { id: 1, text: "Review konsep Scrum/Kanban: 2 jam/minggu", done: false },
        { id: 2, text: "Praktik sprint planning: 1 jam/minggu", done: false },
        { id: 3, text: "Kontribusi project team aktif: 3 jam/minggu", done: false },
        { id: 4, text: "Dokumentasi sprint: 1 jam/minggu", done: false },
      ],
      weeklyChecklist: [
        { id: "w1", text: "Review sprint sebelumnya (15 menit)", done: false },
        { id: "w2", text: "Sprint planning baru (30 menit)", done: false },
        { id: "w3", text: "Kerjakan task sprint (2-3 jam)", done: false },
        { id: "w4", text: "Update board Trello/Jira (15 menit)", done: false },
        { id: "w5", text: "Review teori 1 bab (1 jam)", done: false },
        { id: "w6", text: "Dokumentasi progress (30 menit)", done: false }
      ],
      risks: "Team tidak kooperatif, Konsep teori lemah"
    },
    {
      id: "mk_b",
      name: "Workshop Aplikasi dan Komputasi Awan",
      sks: 3,
      target: 86,
      targetGrade: "A",
      currentScore: 0,
      weight: { lab: 25, deployment: 30, uts: 20, uas: 25 },
      strategies: [
        { id: 1, text: "Praktik langsung setiap lab: 2 jam", done: false },
        { id: 2, text: "Deep dive AWS: 2 jam/minggu", done: false },
        { id: 3, text: "Project deployment pribadi: 2 jam/minggu", done: false },
        { id: 4, text: "Review teori cloud concepts: 1 jam/minggu", done: false }
      ],
      weeklyChecklist: [
        { id: "w1", text: "Selesaikan lab wajib", done: false },
        { id: "w2", text: "Eksplorasi 1 AWS service baru", done: false },
        { id: "w3", text: "Deploy 1 mini project", done: false },
        { id: "w4", text: "Buat catatan arsitektur", done: false },
        { id: "w5", text: "Review billing & optimization", done: false }
      ],
      risks: "Over budget cloud, Konsep advanced sulit"
    },
    {
      id: "mk_c",
      name: "Workshop Administrasi Basis Data",
      sks: 3,
      target: 86,
      targetGrade: "A",
      currentScore: 0,
      weight: { tugas: 20, project: 30, uts: 20, uas: 30 },
      strategies: [
        { id: 1, text: "Praktik SQL setiap hari: 30 menit", done: false },
        { id: 2, text: "Deep dive indexing & optimization", done: false },
        { id: 3, text: "Design project database (ERD)", done: false },
      ],
      weeklyChecklist: [
        { id: "w1", text: "5 soal SQL challenges (LeetCode)", done: false },
        { id: "w2", text: "1 optimization case study", done: false },
        { id: "w3", text: "Update ER diagram project", done: false },
        { id: "w4", text: "Review 1 chapter theory", done: false },
        { id: "w5", text: "Praktik backup/recovery", done: false }
      ],
      risks: "Query optimization kompleks, Normalization bingung"
    },
    {
      id: "mk_d",
      name: "Workshop Desain Pengalaman Pengguna (UX)",
      sks: 3,
      target: 81,
      targetGrade: "A-",
      currentScore: 0,
      weight: { wireframe: 25, testing: 20, project: 35, exams: 20 },
      strategies: [
        { id: 1, text: "Praktik Figma efisien: 2 jam/minggu", done: false },
        { id: 2, text: "Design portfolio piece: 2 jam/minggu", done: false },
        { id: 3, text: "User research minimal: 1 jam/minggu", done: false }
      ],
      weeklyChecklist: [
        { id: "w1", text: "1 design challenge (Dribbble)", done: false },
        { id: "w2", text: "Update project UX", done: false },
        { id: "w3", text: "Review 3 best designs", done: false },
        { id: "w4", text: "Test dengan 2-3 users", done: false }
      ],
      risks: "Tidak ada user testing, Design kurang estetis"
    },
    {
      id: "mk_e",
      name: "Kecerdasan Buatan + Praktik",
      sks: 3,
      target: 86,
      targetGrade: "A",
      currentScore: 0,
      weight: { algo: 20, lab: 25, project: 30, uts: 12.5, uas: 12.5 },
      strategies: [
        { id: 1, text: "Teori AI: 2 jam/minggu", done: false },
        { id: 2, text: "Lab praktik: 2 jam", done: false },
        { id: 3, text: "Project ML: 2 jam/minggu", done: false }
      ],
      weeklyChecklist: [
        { id: "w1", text: "Review lecture notes (1 jam)", done: false },
        { id: "w2", text: "Selesaikan lab", done: false },
        { id: "w3", text: "Kerja project 2 jam", done: false },
        { id: "w4", text: "Baca 1 artikel AI", done: false },
        { id: "w5", text: "Praktik coding algorithm", done: false }
      ],
      risks: "Konsep math kompleks, Model tidak converge"
    },
    {
      id: "mk_f",
      name: "Workshop Administrasi Jaringan",
      sks: 3,
      target: 86,
      targetGrade: "A",
      currentScore: 0,
      weight: { lab: 30, project: 25, uts: 20, uas: 25 },
      strategies: [
        { id: 1, text: "Lab langsung: 2 jam", done: false },
        { id: 2, text: "Praktik GNS3/Packet Tracer: 2 jam/minggu", done: false },
        { id: 3, text: "Review konsep networking: 2 jam/minggu", done: false }
      ],
      weeklyChecklist: [
        { id: "w1", text: "Selesaikan lab", done: false },
        { id: "w2", text: "3 scenario Packet Tracer", done: false },
        { id: "w3", text: "Review 2 chapters", done: false },
        { id: "w4", text: "Update project topology", done: false }
      ],
      risks: "Lab error, Konsep subnetting lemah"
    },
    {
      id: "mk_g",
      name: "Workshop Pemrograman Perangkat Bergerak",
      sks: 3,
      target: 81,
      targetGrade: "A-",
      currentScore: 0,
      weight: { tugas: 25, project: 35, uts: 15, uas: 25 },
      strategies: [
        { id: 1, text: "Ikuti tutorial project: 3 jam/minggu", done: false },
        { id: 2, text: "Kerjakan tugas minimal: 2 jam/minggu", done: false }
      ],
      weeklyChecklist: [
        { id: "w1", text: "Selesaikan tugas", done: false },
        { id: "w2", text: "Kerja project 2-3 jam", done: false },
        { id: "w3", text: "Review 1 concept", done: false },
        { id: "w4", text: "Test app di device", done: false }
      ],
      risks: "Debugging lama, Build error"
    },
    {
      id: "mk_h",
      name: "Workshop Pemrograman Framework",
      sks: 3,
      target: 86,
      targetGrade: "A",
      currentScore: 0,
      weight: { tugas: 25, project: 35, uts: 15, uas: 25 },
      strategies: [
        { id: 1, text: "Pilih framework align (Node+React): 3 jam/minggu", done: false },
        { id: 2, text: "Project base portfolio: 3 jam/minggu", done: false }
      ],
      weeklyChecklist: [
        { id: "w1", text: "Selesaikan tugas framework", done: false },
        { id: "w2", text: "Kerja project 3 jam", done: false },
        { id: "w3", text: "Review 1 pattern/concept", done: false },
        { id: "w4", text: "Refactor code quality", done: false }
      ],
      risks: "Terlalu banyak framework, Project terlalu kompleks"
    },
    {
      id: "mk_i",
      name: "Kewirausahaan",
      sks: 2,
      target: 81,
      targetGrade: "A-",
      currentScore: 0,
      weight: { plan: 30, presentasi: 25, uts: 20, uas: 25 },
      strategies: [
        { id: 1, text: "Gunakan bisnis website case study: 2 jam/minggu", done: false },
        { id: 2, text: "Review materi minimal: 1.5 jam/minggu", done: false }
      ],
      weeklyChecklist: [
        { id: "w1", text: "Update business plan", done: false },
        { id: "w2", text: "Research 1 competitor", done: false },
        { id: "w3", text: "Review 1 chapter", done: false }
      ],
      risks: "Business plan tidak realistis"
    },
    {
      id: "mk_j",
      name: "Bahasa Indonesia",
      sks: 2,
      target: 86,
      targetGrade: "A",
      currentScore: 0,
      weight: { tugas: 30, presentasi: 20, uts: 25, uas: 25 },
      strategies: [
        { id: 1, text: "Selesaikan tugas tepat waktu: 2 jam/minggu", done: false },
        { id: 2, text: "Review materi sebelum ujian: 1 jam/minggu", done: false }
      ],
      weeklyChecklist: [
        { id: "w1", text: "Selesaikan tugas menulis", done: false },
        { id: "w2", text: "Review materi 30 menit", done: false },
        { id: "w3", text: "Edit & improve writing", done: false }
      ],
      risks: "Typo, Struktur tidak jelas"
    }
  ],

  // --- MODULE 2: SCHEDULE ---
  schedule: {
    Senin: [
      { time: "05:00", activity: "Bangun + Shubuh", type: "routine" },
      { time: "08:00", activity: "Workshop Agile (FOKUS)", type: "academic" },
      { time: "10:30", activity: "Workshop Cloud (FOKUS)", type: "academic" },
      { time: "16:00", activity: "DEEP WORK: Backend Go", type: "skill" },
      { time: "18:30", activity: "Tugas Agile (Sprint)", type: "academic" },
    ],
    Selasa: [
      { time: "08:00", activity: "Workshop Database (FOKUS)", type: "academic" },
      { time: "10:30", activity: "Workshop UX (FOKUS)", type: "academic" },
      { time: "13:50", activity: "Kecerdasan Buatan (FOKUS)", type: "academic" },
      { time: "17:30", activity: "SQL Practice + AI Algo", type: "skill" },
      { time: "20:30", activity: "Personal Project React", type: "skill" },
    ],
    Rabu: [
      { time: "08:00", activity: "Workshop Jaringan (Cyber)", type: "academic" },
      { time: "10:30", activity: "Workshop Mobile (FOKUS)", type: "academic" },
      { time: "14:40", activity: "Kewirausahaan", type: "academic" },
      { time: "17:30", activity: "Cyber Lab (TryHackMe)", type: "skill" },
      { time: "19:30", activity: "Tugas Mobile + Bisnis", type: "academic" },
    ],
    Kamis: [
      { time: "08:00", activity: "Workshop Framework", type: "academic" },
      { time: "10:30", activity: "DEEP WORK: Backend Go", type: "skill" },
      { time: "14:40", activity: "Bahasa Indonesia", type: "academic" },
      { time: "16:30", activity: "CLIENT OUTREACH", type: "income" },
      { time: "19:00", activity: "Full-stack Project", type: "skill" },
    ],
    Jumat: [
      { time: "07:00", activity: "Backend Go/React", type: "skill" },
      { time: "09:40", activity: "Praktik AI (FOKUS)", type: "academic" },
      { time: "14:00", activity: "CLIENT WORK (Website)", type: "income" },
      { time: "19:00", activity: "Skill Upgrade (Reading)", type: "skill" },
    ],
    Sabtu: [
      { time: "08:00", activity: "PROJECT BESAR (Go/React)", type: "skill" },
      { time: "14:00", activity: "Cybersecurity Lab", type: "skill" },
      { time: "20:30", activity: "EVALUASI MINGGUAN", type: "planning" },
    ],
    Minggu: [
      { time: "09:00", activity: "LEARNING (Konsep Baru)", type: "skill" },
      { time: "12:00", activity: "Social + Recovery", type: "rest" },
      { time: "18:00", activity: "Prep Minggu Depan", type: "planning" },
    ],
  },

  // --- MODULE 3: PROJECTS (KANBAN) ---
  // Updated: Mostly 'To Do' for fresh start
  projects: [
    {
      id: "p1",
      title: "TaskFlow API (Go Backend)",
      category: "Backend",
      status: "In Progress",
      tasks: [
        { id: "t1", title: "Setup Project Structure (Gin)", status: "Done" },
        { id: "t2", title: "Database Schema (Postgres)", status: "In Progress" },
        { id: "t3", title: "Auth (JWT) Endpoint", status: "To Do" },
        { id: "t4", title: "CRUD Tasks Endpoint", status: "To Do" },
        { id: "t5", title: "Unit Testing", status: "To Do" }
      ]
    },
    {
      id: "p2",
      title: "TaskFlow Dashboard (React)",
      category: "Frontend",
      status: "To Do",
      tasks: [
        { id: "t1", title: "Setup Vite + Tailwind", status: "Done" },
        { id: "t2", title: "Login Page UI", status: "To Do" },
        { id: "t3", title: "Dashboard Layout", status: "To Do" }
      ]
    },
    {
      id: "p3",
      title: "Cyber Portfolio",
      category: "Security",
      status: "In Progress",
      tasks: [
        { id: "t1", title: "TryHackMe Pickle Rick", status: "To Do" },
        { id: "t2", title: "Writeup Basic Pentesting", status: "To Do" },
        { id: "t3", title: "Setup GitHub Repo", status: "Done" }
      ]
    }
  ],

  // --- MODULE 4: INCOME (CRM) ---
  income: {
    totalRevenue: 0,
    targetRevenue: 10000000,
    leads: [
      { id: 1, name: "Kopi Senja", owner: "Bpk. Budi", status: "Warm", value: 1500000, notes: "Tertarik paket basic website" },
      { id: 2, name: "Salon Cantik", owner: "Ibu Susi", status: "Cold", value: 2000000, notes: "Belum balas DM" }
    ],
    scripts: [
      { title: "DM Instagram (UMKM)", content: "Halo Kak [Nama]! 👋 Saya Mahasiswa IT Surabaya. Saya notice [Nama bisnis] belum punya website. Saya bisa buatkan katalog online simpel + WA button mulai 1.5jt. Boleh diskusi kak?" },
      { title: "Follow-up 1 (3 hari)", content: "Halo Kak, mau menanyakan kembali soal penawaran website kemarin. Ada yang bisa saya bantu jelaskan? Terima kasih!" },
      { title: "Email Formal", content: "Kepada Yth [Nama], Perkenalkan saya [Nama], developer web freelance. Saya ingin menawarkan solusi digital untuk [Nama Bisnis]..." }
    ],
  },

  // --- MODULE 5: HEALTH (LOGGER) ---
  health: {
    logs: [],
    checklist: {
      physical: ["Sakit kepala sering", "Mata perih", "Tidur < 6 jam"],
      mental: ["Mood swing", "Hilang motivasi", "Prokrastinasi"],
      productivity: ["Produktivitas drop", "Tugas menumpuk"]
    }
  },

  // --- MODULE 6: CYBER ROADMAP ---
  cyberRoadmap: {
    skills: [
      { name: "Networking (TCP/IP, OSI)", level: 65 },
      { name: "Linux Administration", level: 50 },
      { name: "Web Security (OWASP)", level: 30 },
      { name: "Pentesting Basics", level: 20 },
    ],
    tools: [
      { name: "Nmap", checked: true },
      { name: "Burp Suite", checked: false },
      { name: "Metasploit", checked: false },
      { name: "Wireshark", checked: false },
      { name: "SQLmap", checked: false },
    ],
    progress: { tryHackMeRooms: 5, writeups: 2 }
  }
};

/**
 * ============================================================================
 * MAIN APPLICATION COMPONENT
 * ============================================================================
 */

const App = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [data, setData] = useState(DEFAULT_DATA);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  // --- EFFECT: LOAD DATA ---
  useEffect(() => {
    const savedData = localStorage.getItem("semester4_sys_v3");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        // Merge strategy to keep default structure if new fields added
        setData({ ...DEFAULT_DATA, ...parsed });
      } catch (e) {
        console.error("Data corrupt, using defaults");
      }
    }
    setIsLoaded(true);
  }, []);

  // --- EFFECT: SAVE DATA ---
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("semester4_sys_v3", JSON.stringify(data));
    }
  }, [data, isLoaded]);

  // --- CORE LOGIC: WEEKLY RESET ---
  const finishWeekAndReset = () => {
    if (!confirm(`Selesaikan Minggu ${data.currentWeek}? \n\nIni akan mereset checklist akademik dan menyimpan riwayat.`)) return;
    
    // 1. Calculate Score
    const totalChecklists = data.academics.reduce((acc, mk) => acc + mk.weeklyChecklist.length, 0);
    const completedChecklists = data.academics.reduce((acc, mk) => acc + mk.weeklyChecklist.filter(i => i.done).length, 0);
    const score = totalChecklists > 0 ? Math.round((completedChecklists / totalChecklists) * 100) : 0;
    
    // 2. Create History Entry
    const historyEntry = { 
      week: data.currentWeek, 
      date: new Date().toLocaleDateString('id-ID'), 
      score: score, 
      stats: { completed: completedChecklists, total: totalChecklists } 
    };

    // 3. Reset Checklists
    const resetAcademics = data.academics.map(mk => ({ 
      ...mk, 
      weeklyChecklist: mk.weeklyChecklist.map(item => ({ ...item, done: false })) 
    }));

    // 4. Update State
    setData({ 
      ...data, 
      currentWeek: data.currentWeek + 1, 
      weeklyHistory: [historyEntry, ...data.weeklyHistory], 
      academics: resetAcademics 
    });
  };

  // --- GLOBAL UPDATE FUNCTIONS ---
  const toggleChecklist = (subjectId, checkId, type = "weekly") => {
    const updatedAcademics = data.academics.map(mk => {
      if (mk.id === subjectId) {
        const listKey = type === "weekly" ? "weeklyChecklist" : "strategies";
        const updatedList = mk[listKey].map(item => 
          item.id === checkId ? { ...item, done: !item.done } : item
        );
        return { ...mk, [listKey]: updatedList };
      }
      return mk;
    });
    setData({ ...data, academics: updatedAcademics });
  };

  // --- RENDER ROUTER ---
  const renderContent = () => {
    switch (activeTab) {
      case "dashboard": return <DashboardView data={data} finishWeek={finishWeekAndReset} />;
      case "akademik": return <AcademicView data={data} toggleChecklist={toggleChecklist} />;
      case "jadwal": return <ScheduleView data={data} />;
      case "projects": return <ProjectsView data={data} setData={setData} />;
      case "income": return <IncomeView data={data} setData={setData} />;
      case "cyber": return <CyberView data={data} setData={setData} />;
      case "health": return <HealthView data={data} setData={setData} />;
      case "settings": return <SettingsView data={data} setData={setData} resetDefault={() => setData(DEFAULT_DATA)} />;
      default: return <DashboardView data={data} finishWeek={finishWeekAndReset} />;
    }
  };

  return (
    // MASTER LAYOUT: Black/Zinc-950 Theme
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-white selection:text-black overflow-hidden">
      
      {/* INJECT HIDDEN SCROLLBAR STYLE */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}</style>

      {/* SIDEBAR (COLLAPSIBLE) */}
      <aside 
        className={`${isSidebarOpen ? 'w-72' : 'w-20'} bg-black border-r border-zinc-800 transition-all duration-300 flex flex-col fixed md:relative z-50 h-screen shadow-2xl shadow-black`}
      >
        {/* Header */}
        <div className="p-6 flex items-center justify-between border-b border-zinc-900">
          <div className={`flex items-center gap-3 ${!isSidebarOpen && 'justify-center w-full'}`}>
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-black font-black text-xl">
              E
            </div>
            {isSidebarOpen && (
              <div className="animate-fade-in">
                <h1 className="font-bold text-lg tracking-tight">ExecSys</h1>
                <p className="text-[10px] text-zinc-500 font-mono">V4.0 • SEMESTER 4</p>
              </div>
            )}
          </div>
          {isSidebarOpen && (
            <button onClick={() => setIsSidebarOpen(false)} className="text-zinc-500 hover:text-white">
              <ChevronLeft size={18} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-2 scrollbar-hide">
          <SidebarItem icon={<LayoutDashboard />} label="Dashboard" active={activeTab === "dashboard"} isOpen={isSidebarOpen} onClick={() => setActiveTab("dashboard")} />
          <SidebarItem icon={<BookOpen />} label="Akademik" active={activeTab === "akademik"} isOpen={isSidebarOpen} onClick={() => setActiveTab("akademik")} />
          <SidebarItem icon={<Calendar />} label="Jadwal" active={activeTab === "jadwal"} isOpen={isSidebarOpen} onClick={() => setActiveTab("jadwal")} />
          <SidebarItem icon={<Layers />} label="Projects" active={activeTab === "projects"} isOpen={isSidebarOpen} onClick={() => setActiveTab("projects")} />
          <SidebarItem icon={<DollarSign />} label="Income" active={activeTab === "income"} isOpen={isSidebarOpen} onClick={() => setActiveTab("income")} />
          <SidebarItem icon={<Shield />} label="Cyber Roadmap" active={activeTab === "cyber"} isOpen={isSidebarOpen} onClick={() => setActiveTab("cyber")} />
          <SidebarItem icon={<Activity />} label="Health" active={activeTab === "health"} isOpen={isSidebarOpen} onClick={() => setActiveTab("health")} />
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-900">
          <SidebarItem icon={<Settings />} label="Settings" active={activeTab === "settings"} isOpen={isSidebarOpen} onClick={() => setActiveTab("settings")} />
          {!isSidebarOpen && (
             <button onClick={() => setIsSidebarOpen(true)} className="w-full mt-2 flex justify-center text-zinc-500 hover:text-white"><ChevronRight size={18}/></button>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 h-screen overflow-hidden flex flex-col relative bg-zinc-950">
        {/* Top Header */}
        <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-8 bg-zinc-950/80 backdrop-blur-md z-40">
           <div className="flex items-center gap-4">
             <h2 className="text-xl font-bold capitalize">{activeTab.replace('-', ' ')}</h2>
             <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">MINGGU {data.currentWeek}</span>
           </div>
           <div className="flex items-center gap-4">
              <div className="text-right hidden md:block">
                 <div className="text-xs font-bold text-white">{data.user.name}</div>
                 <div className="text-[10px] text-zinc-500">{data.user.semester}th Semester • Target {data.user.targetIPK}</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                 <User size={14} className="text-zinc-400"/>
              </div>
           </div>
        </header>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-zinc-950 relative scrollbar-hide">
          {/* Subtle Ambient Background */}
          <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-zinc-900/50 to-transparent pointer-events-none -z-10" />
          
          <div className="max-w-6xl mx-auto space-y-8 pb-20">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

// --- SIDEBAR ITEM COMPONENT ---
const SidebarItem = ({ icon, label, active, isOpen, onClick }) => (
  <button
    onClick={onClick}
    className={`group flex items-center gap-3 px-3 py-3 rounded-xl transition-all w-full
      ${active 
        ? 'bg-white text-black shadow-lg shadow-white/10' 
        : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200'}
      ${!isOpen && 'justify-center'}
    `}
  >
    <div className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
      {React.cloneElement(icon, { size: 20 })}
    </div>
    {isOpen && (
      <span className="font-medium text-sm whitespace-nowrap animate-fade-in">{label}</span>
    )}
  </button>
);

/**
 * ============================================================================
 * VIEW COMPONENTS
 * ============================================================================
 */

// 1. DASHBOARD VIEW
const DashboardView = ({ data, finishWeek }) => {
  const totalChecklists = data.academics.reduce((acc, mk) => acc + mk.weeklyChecklist.length, 0);
  const completedChecklists = data.academics.reduce((acc, mk) => acc + mk.weeklyChecklist.filter(i => i.done).length, 0);
  const progressPercent = Math.round((completedChecklists / totalChecklists) * 100) || 0;
  
  // Calculate health status
  const currentBurnout = calculateBurnoutScore(data.health.logs);
  
  // Dynamic Day Focus
  const currentDay = getIndonesianDay();
  const todaysSchedule = data.schedule[currentDay] || [];

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
           <h1 className="text-4xl font-black text-white tracking-tight mb-2">Command Center</h1>
           <p className="text-zinc-400">Hari ini: <span className="text-white font-bold">{currentDay}</span>. Fokus eksekusi!</p>
        </div>
        <button 
           onClick={finishWeek}
           className="bg-white text-black hover:bg-zinc-200 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-xl shadow-white/5 transition-transform hover:scale-105"
        >
           <RefreshCw size={20} /> Selesaikan Minggu {data.currentWeek}
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <MetricBox title="Target IPK" value={data.user.targetIPK} icon={<Target />} trend="Semester 4" color="white" />
         <MetricBox title="Weekly Progress" value={`${progressPercent}%`} icon={<Activity />} trend={`${completedChecklists}/${totalChecklists} Tasks`} color="zinc" />
         <MetricBox title="Est. Revenue" value={formatCurrency(data.income.totalRevenue)} icon={<DollarSign />} trend="Target 10jt" color="white" />
         <MetricBox title="Burnout Risk" value={`${currentBurnout}/10`} icon={<AlertCircle />} trend={currentBurnout > 6 ? "High Risk" : "Safe Zone"} color={currentBurnout > 6 ? "red" : "green"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Today's Focus */}
         <div className="lg:col-span-2 bg-zinc-900 rounded-3xl p-8 border border-zinc-800">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-white"><Calendar size={20}/> Fokus Hari Ini ({currentDay})</h3>
            <div className="space-y-4">
               {todaysSchedule.length > 0 ? (
                 todaysSchedule.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-6 group">
                       <div className="w-16 text-right font-mono text-zinc-500 font-bold group-hover:text-white transition-colors">{item.time}</div>
                       <div className={`flex-1 p-4 rounded-2xl border transition-all ${item.type === 'skill' ? 'bg-white text-black border-white' : 'bg-zinc-950 border-zinc-800 text-zinc-300'}`}>
                          <div className="font-bold">{item.activity}</div>
                          <div className="text-[10px] uppercase tracking-wider opacity-60 font-bold mt-1">{item.type}</div>
                       </div>
                    </div>
                 ))
               ) : (
                 <div className="text-zinc-500 italic">Tidak ada jadwal spesifik hari ini. Gunakan untuk recovery atau catch-up.</div>
               )}
            </div>
         </div>

         {/* Weekly History Chart (Mini) */}
         <div className="bg-zinc-900 rounded-3xl p-8 border border-zinc-800 flex flex-col">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-white"><History size={20}/> Riwayat</h3>
            <div className="flex-1 flex flex-col justify-end gap-2 min-h-[200px]">
               {data.weeklyHistory.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-zinc-600 italic text-sm">Belum ada riwayat mingguan.</div>
               ) : (
                  <div className="space-y-3">
                     {data.weeklyHistory.slice(0, 5).map((h, i) => (
                        <div key={i} className="flex items-center gap-3">
                           <div className="text-xs font-mono text-zinc-500 w-16">W{h.week}</div>
                           <div className="flex-1 bg-zinc-950 rounded-full h-3 overflow-hidden">
                              <div className="bg-white h-full" style={{ width: `${h.score}%` }}></div>
                           </div>
                           <div className="text-xs font-bold text-white w-8 text-right">{h.score}%</div>
                        </div>
                     ))}
                  </div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
};

const MetricBox = ({ title, value, icon, trend, color }) => (
  <div className={`p-6 rounded-3xl border flex flex-col justify-between h-32 transition-all hover:-translate-y-1
    ${color === 'white' ? 'bg-white text-black border-white' : 
      color === 'red' ? 'bg-red-900/20 text-red-200 border-red-900/50' :
      color === 'green' ? 'bg-emerald-900/20 text-emerald-200 border-emerald-900/50' :
      'bg-zinc-900 text-zinc-100 border-zinc-800'}
  `}>
     <div className="flex justify-between items-start">
        <span className="text-sm font-bold opacity-70 uppercase tracking-wider">{title}</span>
        {React.cloneElement(icon, { size: 18 })}
     </div>
     <div>
        <div className="text-2xl font-black">{value}</div>
        <div className="text-xs opacity-60 font-medium mt-1">{trend}</div>
     </div>
  </div>
);


// 2. ACADEMIC VIEW
const AcademicView = ({ data, toggleChecklist }) => {
  const [selectedId, setSelectedId] = useState(data.academics[0].id);
  const activeSubject = data.academics.find(mk => mk.id === selectedId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)]">
      {/* Subject List */}
      <div className="lg:col-span-4 bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden flex flex-col">
         <div className="p-6 border-b border-zinc-800">
            <h3 className="font-bold text-lg">Mata Kuliah</h3>
            <p className="text-xs text-zinc-500">Pilih untuk detail strategi & checklist</p>
         </div>
         <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-hide">
            {data.academics.map(mk => (
               <button 
                  key={mk.id} 
                  onClick={() => setSelectedId(mk.id)}
                  className={`w-full text-left p-4 rounded-2xl transition-all border ${selectedId === mk.id ? 'bg-white text-black border-white' : 'bg-transparent text-zinc-400 border-transparent hover:bg-zinc-800'}`}
               >
                  <div className="font-bold text-sm leading-tight">{mk.name}</div>
                  <div className="flex justify-between mt-2 text-[10px] font-mono opacity-70 uppercase">
                     <span>{mk.sks} SKS</span>
                     <span>Target {mk.targetGrade}</span>
                  </div>
               </button>
            ))}
         </div>
      </div>

      {/* Detail Panel */}
      <div className="lg:col-span-8 bg-zinc-900 rounded-3xl border border-zinc-800 flex flex-col overflow-hidden">
         {activeSubject ? (
            <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
               {/* Header */}
               <div className="border-b border-zinc-800 pb-6">
                  <h2 className="text-2xl font-black text-white leading-tight">{activeSubject.name}</h2>
                  <div className="flex gap-3 mt-4">
                     <Badge label={`${activeSubject.sks} SKS`} />
                     <Badge label={`Target: ${activeSubject.targetGrade} (≥${activeSubject.target})`} active />
                  </div>
               </div>

               {/* Weekly Checklist */}
               <section>
                  <div className="flex justify-between items-center mb-4">
                     <h3 className="font-bold text-lg flex items-center gap-2"><CheckCircle size={18}/> Checklist Minggu {data.currentWeek}</h3>
                     <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-1 rounded">Auto-Reset</span>
                  </div>
                  <div className="space-y-3">
                     {activeSubject.weeklyChecklist.map(item => (
                        <label key={item.id} className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${item.done ? 'bg-zinc-800 border-zinc-700 opacity-60' : 'bg-zinc-950 border-zinc-800 hover:border-zinc-600'}`}>
                           <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center border ${item.done ? 'bg-white border-white text-black' : 'border-zinc-600'}`}>
                              {item.done && <CheckCircle size={14}/>}
                           </div>
                           <input type="checkbox" className="hidden" checked={item.done} onChange={() => toggleChecklist(activeSubject.id, item.id)} />
                           <span className={`text-sm ${item.done ? 'line-through' : ''}`}>{item.text}</span>
                        </label>
                     ))}
                  </div>
               </section>

               {/* Info Grid */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800">
                     <h3 className="font-bold text-sm text-zinc-400 mb-4 uppercase tracking-wider flex items-center gap-2"><Brain size={16}/> Strategi</h3>
                     <ul className="space-y-3">
                        {activeSubject.strategies.map((s) => (
                           <li key={s.id} className="text-sm flex gap-3 text-zinc-300">
                              <span className="text-zinc-600">•</span>
                              {s.text}
                           </li>
                        ))}
                     </ul>
                  </div>
                  <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800">
                     <h3 className="font-bold text-sm text-zinc-400 mb-4 uppercase tracking-wider flex items-center gap-2"><AlertTriangle size={16}/> Bobot Nilai</h3>
                     <div className="space-y-2">
                        {Object.entries(activeSubject.weight).map(([k, v]) => (
                           <div key={k} className="flex justify-between text-sm border-b border-zinc-900 pb-1 last:border-0">
                              <span className="capitalize text-zinc-300">{k}</span>
                              <span className="font-mono font-bold text-white">{v}%</span>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
         ) : (
            <div className="flex-1 flex items-center justify-center text-zinc-600">Pilih mata kuliah</div>
         )}
      </div>
    </div>
  );
};

// 3. SCHEDULE VIEW
const ScheduleView = ({ data }) => {
  const [activeDay, setActiveDay] = useState(getIndonesianDay());
  const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
         <div>
            <h2 className="text-3xl font-black text-white">Jadwal Rutinitas</h2>
            <p className="text-zinc-400 mt-1">Integrasi Google Calendar untuk notifikasi otomatis.</p>
         </div>
      </div>

      {/* Day Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
         {days.map(d => (
            <button
               key={d}
               onClick={() => setActiveDay(d)}
               className={`px-6 py-3 rounded-full text-sm font-bold transition-all whitespace-nowrap ${activeDay === d ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800'}`}
            >
               {d}
            </button>
         ))}
      </div>

      {/* Timeline List */}
      <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-8 relative overflow-hidden min-h-[500px]">
         <div className="absolute left-10 top-0 bottom-0 w-px bg-zinc-800"></div>
         
         <div className="space-y-8 relative z-10">
            {data.schedule[activeDay] ? data.schedule[activeDay].map((item, idx) => (
               <div key={idx} className="flex gap-8 group">
                  <div className="w-20 text-right font-mono text-zinc-500 font-bold pt-4">{item.time}</div>
                  <div className="flex-1 bg-zinc-950 border border-zinc-800 hover:border-zinc-600 rounded-2xl p-6 transition-all flex justify-between items-center group-hover:translate-x-1">
                     <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${
                           item.type === 'academic' ? 'bg-blue-900/20 text-blue-400' :
                           item.type === 'skill' ? 'bg-purple-900/20 text-purple-400' :
                           item.type === 'income' ? 'bg-emerald-900/20 text-emerald-400' :
                           item.type === 'rest' ? 'bg-orange-900/20 text-orange-400' :
                           'bg-zinc-800 text-zinc-400'
                        }`}>
                           {item.type === 'income' ? <DollarSign size={20}/> : item.type === 'rest' ? <Coffee size={20}/> : <Calendar size={20}/>}
                        </div>
                        <div>
                           <div className="font-bold text-lg text-white">{item.activity}</div>
                           <div className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 mt-1">{item.type}</div>
                        </div>
                     </div>
                     <button 
                        onClick={() => addToGoogleCalendar(item.activity, activeDay, item.time)}
                        className="p-3 bg-black rounded-xl text-zinc-500 hover:text-white border border-zinc-900 hover:border-zinc-700 transition-all"
                        title="Add to Google Calendar"
                     >
                        <CalendarPlus size={20} />
                     </button>
                  </div>
               </div>
            )) : (
               <div className="text-center text-zinc-500 py-12">Tidak ada jadwal untuk hari ini.</div>
            )}
         </div>
      </div>
    </div>
  );
};

// 4. PROJECTS VIEW (KANBAN)
const ProjectsView = ({ data, setData }) => {
   const moveTask = (projectId, taskId, direction) => {
      const updatedProjects = data.projects.map(p => {
         if (p.id === projectId) {
            const updatedTasks = p.tasks.map(t => {
               if (t.id === taskId) {
                  let newStatus = t.status;
                  if (direction === 'next') {
                     if (t.status === 'To Do') newStatus = 'In Progress';
                     else if (t.status === 'In Progress') newStatus = 'Done';
                  } else {
                     if (t.status === 'Done') newStatus = 'In Progress';
                     else if (t.status === 'In Progress') newStatus = 'To Do';
                  }
                  return { ...t, status: newStatus };
               }
               return t;
            });
            return { ...p, tasks: updatedTasks };
         }
         return p;
      });
      setData({ ...data, projects: updatedProjects });
   };

   return (
      <div className="space-y-8">
         <div className="flex justify-between items-center">
            <h2 className="text-3xl font-black text-white">Project Portfolio</h2>
            <div className="flex gap-2">
               <span className="px-3 py-1 rounded bg-zinc-900 text-xs text-zinc-400 border border-zinc-800">3 Projects Active</span>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 overflow-x-auto pb-8 scrollbar-hide">
            {data.projects.map(project => (
               <div key={project.id} className="min-w-[320px] bg-zinc-900 rounded-3xl border border-zinc-800 flex flex-col h-[600px]">
                  <div className="p-6 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur rounded-t-3xl">
                     <h3 className="font-bold text-white text-lg">{project.title}</h3>
                     <span className="text-xs font-mono text-zinc-500 uppercase mt-1 block">{project.category}</span>
                  </div>
                  
                  <div className="p-4 space-y-4 overflow-y-auto scrollbar-hide flex-1 bg-zinc-950/30">
                     {/* COLUMNS SIMULATION */}
                     {['To Do', 'In Progress', 'Done'].map(status => (
                        <div key={status} className="space-y-3">
                           <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 px-2">{status}</div>
                           {project.tasks.filter(t => t.status === status).map(task => (
                              <div key={task.id} className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl group hover:border-zinc-600 transition-all shadow-lg">
                                 <div className="text-sm font-medium text-zinc-200 mb-3">{task.title}</div>
                                 <div className="flex justify-between items-center">
                                    <div className={`w-2 h-2 rounded-full ${status === 'Done' ? 'bg-green-500' : status === 'In Progress' ? 'bg-blue-500' : 'bg-zinc-600'}`}></div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                       {status !== 'To Do' && (
                                          <button onClick={() => moveTask(project.id, task.id, 'prev')} className="p-1 hover:bg-zinc-800 rounded"><ChevronLeft size={14}/></button>
                                       )}
                                       {status !== 'Done' && (
                                          <button onClick={() => moveTask(project.id, task.id, 'next')} className="p-1 hover:bg-zinc-800 rounded"><ChevronRight size={14}/></button>
                                       )}
                                    </div>
                                 </div>
                              </div>
                           ))}
                           {project.tasks.filter(t => t.status === status).length === 0 && (
                              <div className="h-12 border-2 border-dashed border-zinc-900 rounded-xl flex items-center justify-center text-[10px] text-zinc-700">Empty</div>
                           )}
                        </div>
                     ))}
                  </div>
               </div>
            ))}
         </div>
      </div>
   );
};

// 5. INCOME VIEW (FULL)
const IncomeView = ({ data, setData }) => {
   const [isAddMode, setIsAddMode] = useState(false);
   const [newLead, setNewLead] = useState({ name: "", owner: "", value: 0 });

   const handleAddLead = () => {
      const lead = {
         id: Date.now(),
         ...newLead,
         status: "Cold",
         notes: "New Entry"
      };
      setData({ 
         ...data, 
         income: { ...data.income, leads: [...data.income.leads, lead] } 
      });
      setIsAddMode(false);
      setNewLead({ name: "", owner: "", value: 0 });
   };

   const updateStatus = (id, newStatus) => {
      const updatedLeads = data.income.leads.map(l => {
         if (l.id === id) {
            return { ...l, status: newStatus };
         }
         return l;
      });
      
      // Recalculate total revenue based on closed leads
      const newTotal = updatedLeads
         .filter(l => l.status === 'Closed')
         .reduce((acc, curr) => acc + parseInt(curr.value), 0);

      setData({
         ...data,
         income: {
            ...data.income,
            leads: updatedLeads,
            totalRevenue: newTotal
         }
      });
   };

   const deleteLead = (id) => {
      const updatedLeads = data.income.leads.filter(l => l.id !== id);
      setData({ ...data, income: { ...data.income, leads: updatedLeads } });
   };

   return (
      <div className="space-y-8">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-8">
               <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-black text-white">Client CRM</h2>
                  <button onClick={() => setIsAddMode(!isAddMode)} className="bg-white text-black px-4 py-2 rounded-xl font-bold flex items-center gap-2 text-sm hover:bg-zinc-200">
                     <Plus size={16}/> New Lead
                  </button>
               </div>

               {/* Add Form */}
               {isAddMode && (
                  <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 animate-fade-in space-y-4">
                     <h3 className="font-bold">Tambah Prospek Baru</h3>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input placeholder="Nama Bisnis" className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-sm" value={newLead.name} onChange={e => setNewLead({...newLead, name: e.target.value})} />
                        <input placeholder="Nama Owner" className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-sm" value={newLead.owner} onChange={e => setNewLead({...newLead, owner: e.target.value})} />
                        <input type="number" placeholder="Est. Value (IDR)" className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-sm" value={newLead.value} onChange={e => setNewLead({...newLead, value: parseInt(e.target.value)})} />
                     </div>
                     <div className="flex justify-end gap-2">
                        <button onClick={() => setIsAddMode(false)} className="px-4 py-2 text-zinc-500 hover:text-white text-sm">Cancel</button>
                        <button onClick={handleAddLead} className="px-6 py-2 bg-white text-black rounded-xl font-bold text-sm">Save Lead</button>
                     </div>
                  </div>
               )}

               {/* Pipeline Table */}
               <div className="bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden">
                  <table className="w-full text-left text-sm">
                     <thead className="bg-zinc-950 text-zinc-500 font-mono text-xs uppercase tracking-wider border-b border-zinc-800">
                        <tr>
                           <th className="p-4">Bisnis</th>
                           <th className="p-4">Owner</th>
                           <th className="p-4">Value</th>
                           <th className="p-4">Status</th>
                           <th className="p-4 text-right">Action</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-zinc-800">
                        {data.income.leads.length === 0 ? (
                           <tr><td colSpan="5" className="p-8 text-center text-zinc-600 italic">Belum ada data prospek.</td></tr>
                        ) : (
                           data.income.leads.map(lead => (
                              <tr key={lead.id} className="hover:bg-zinc-800/50 transition-colors group">
                                 <td className="p-4 font-bold text-white">{lead.name}</td>
                                 <td className="p-4 text-zinc-400">{lead.owner}</td>
                                 <td className="p-4 font-mono text-zinc-300">{formatCurrency(lead.value)}</td>
                                 <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border ${
                                       lead.status === 'Closed' ? 'bg-green-900/20 text-green-400 border-green-900/50' :
                                       lead.status === 'Warm' ? 'bg-yellow-900/20 text-yellow-400 border-yellow-900/50' :
                                       'bg-zinc-800 text-zinc-400 border-zinc-700'
                                    }`}>
                                       {lead.status}
                                    </span>
                                 </td>
                                 <td className="p-4 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => updateStatus(lead.id, 'Warm')} className="p-1.5 bg-zinc-800 hover:bg-yellow-900/50 text-zinc-400 hover:text-yellow-400 rounded-lg" title="Mark Warm"><TrendingUp size={14}/></button>
                                    <button onClick={() => updateStatus(lead.id, 'Closed')} className="p-1.5 bg-zinc-800 hover:bg-green-900/50 text-zinc-400 hover:text-green-400 rounded-lg" title="Mark Deal"><CheckCircle size={14}/></button>
                                    <button onClick={() => deleteLead(lead.id)} className="p-1.5 bg-zinc-800 hover:bg-red-900/50 text-zinc-400 hover:text-red-400 rounded-lg" title="Delete"><Trash2 size={14}/></button>
                                 </td>
                              </tr>
                           ))
                        )}
                     </tbody>
                  </table>
               </div>
            </div>

            {/* Side Panel: Scripts & Revenue */}
            <div className="space-y-6">
               <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800">
                  <h3 className="font-bold text-zinc-400 mb-2 uppercase tracking-wider text-xs">Total Revenue</h3>
                  <div className="text-3xl font-black text-white">{formatCurrency(data.income.totalRevenue)}</div>
                  <div className="w-full bg-zinc-950 h-2 rounded-full mt-4">
                     <div className="bg-white h-full rounded-full" style={{ width: `${(data.income.totalRevenue / data.income.targetRevenue) * 100}%` }}></div>
                  </div>
                  <div className="text-right text-[10px] text-zinc-500 mt-1">Target: {formatCurrency(data.income.targetRevenue)}</div>
               </div>

               <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 flex-1">
                  <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Mail size={16}/> Outreach Scripts</h3>
                  <div className="space-y-4">
                     {data.income.scripts.map((s, i) => (
                        <div key={i} className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
                           <div className="font-bold text-xs text-blue-400 mb-2">{s.title}</div>
                           <p className="text-xs text-zinc-400 italic leading-relaxed">"{s.content}"</p>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};

// 6. CYBER VIEW (ROADMAP) - EDITABLE
const CyberView = ({ data, setData }) => {
   const [isEditing, setIsEditing] = useState(false);
   const [editState, setEditState] = useState(data.cyberRoadmap);

   // Update local edit state
   const handleSkillChange = (idx, val) => {
      const newSkills = [...editState.skills];
      newSkills[idx].level = val;
      setEditState({...editState, skills: newSkills});
   };

   const handleProgressChange = (field, val) => {
      setEditState({...editState, progress: {...editState.progress, [field]: val}});
   };

   // Save to global data
   const handleSave = () => {
      setData({ ...data, cyberRoadmap: editState });
      setIsEditing(false);
   };

   const toggleTool = (idx) => {
      if(isEditing) return; // Disable toggle during edit mode to avoid confusion
      const newTools = [...data.cyberRoadmap.tools];
      newTools[idx].checked = !newTools[idx].checked;
      setData({ ...data, cyberRoadmap: { ...data.cyberRoadmap, tools: newTools } });
   };

   return (
      <div className="space-y-8">
         <div className="flex justify-between items-center">
            <div>
               <h2 className="text-3xl font-black text-white">Cybersecurity Roadmap</h2>
               <p className="text-zinc-400 text-sm mt-1">Target: Magang Agustus 2026</p>
            </div>
            {isEditing ? (
               <div className="flex gap-2">
                  <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-zinc-400 hover:text-white text-sm">Cancel</button>
                  <button onClick={handleSave} className="px-4 py-2 bg-white text-black rounded-xl font-bold text-sm flex items-center gap-2"><Save size={16}/> Save</button>
               </div>
            ) : (
               <button onClick={() => { setEditState(data.cyberRoadmap); setIsEditing(true); }} className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded-xl text-sm font-bold flex items-center gap-2 text-white">
                  <Edit3 size={16}/> Update Progress
               </button>
            )}
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Skills Bars */}
            <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800">
               <h3 className="text-xl font-bold mb-6">Skill Progression</h3>
               <div className="space-y-6">
                  {isEditing ? (
                     editState.skills.map((skill, i) => (
                        <div key={i}>
                           <div className="flex justify-between mb-2 text-sm font-bold text-zinc-300">
                              <span>{skill.name}</span>
                              <span>{skill.level}%</span>
                           </div>
                           <input 
                              type="range" min="0" max="100" 
                              value={skill.level} 
                              onChange={(e) => handleSkillChange(i, parseInt(e.target.value))}
                              className="w-full h-2 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-white"
                           />
                        </div>
                     ))
                  ) : (
                     data.cyberRoadmap.skills.map((skill, i) => (
                        <div key={i}>
                           <div className="flex justify-between mb-2 text-sm font-bold text-zinc-300">
                              <span>{skill.name}</span>
                              <span>{skill.level}%</span>
                           </div>
                           <div className="w-full bg-zinc-950 rounded-full h-3 p-0.5 border border-zinc-800">
                              <div className="bg-white h-full rounded-full transition-all duration-1000" style={{ width: `${skill.level}%` }}></div>
                           </div>
                        </div>
                     ))
                  )}
               </div>
            </div>

            {/* Tools Checklist */}
            <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800">
               <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Terminal size={20}/> Arsenal Tools</h3>
               <div className="grid grid-cols-1 gap-3">
                  {data.cyberRoadmap.tools.map((tool, i) => (
                     <div key={i} onClick={() => toggleTool(i)} className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${tool.checked ? 'bg-white text-black border-white' : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-600'} ${isEditing && 'opacity-50 cursor-not-allowed'}`}>
                        <span className="font-mono font-bold text-sm">{tool.name}</span>
                        {tool.checked ? <CheckCircle size={18} /> : <div className="w-4 h-4 rounded-full border border-zinc-600"></div>}
                     </div>
                  ))}
               </div>
            </div>
         </div>

         {/* Stats (Editable) */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {isEditing ? (
               <>
                  <div className="p-6 rounded-3xl border bg-zinc-900 border-zinc-800 flex flex-col justify-between h-32">
                     <span className="text-sm font-bold opacity-70 uppercase">THM Rooms</span>
                     <input 
                        type="number" 
                        value={editState.progress.tryHackMeRooms} 
                        onChange={(e) => handleProgressChange('tryHackMeRooms', parseInt(e.target.value))}
                        className="bg-zinc-950 border border-zinc-700 p-2 rounded text-2xl font-black w-full"
                     />
                  </div>
                  <div className="p-6 rounded-3xl border bg-zinc-900 border-zinc-800 flex flex-col justify-between h-32">
                     <span className="text-sm font-bold opacity-70 uppercase">Writeups</span>
                     <input 
                        type="number" 
                        value={editState.progress.writeups} 
                        onChange={(e) => handleProgressChange('writeups', parseInt(e.target.value))}
                        className="bg-zinc-950 border border-zinc-700 p-2 rounded text-2xl font-black w-full"
                     />
                  </div>
               </>
            ) : (
               <>
                  <MetricBox title="THM Rooms" value={data.cyberRoadmap.progress.tryHackMeRooms} icon={<Globe/>} trend="Solved" color="zinc"/>
                  <MetricBox title="Writeups" value={data.cyberRoadmap.progress.writeups} icon={<FileText/>} trend="Published" color="zinc"/>
               </>
            )}
            
            <MetricBox title="Target Internship" value="August 2026" icon={<Briefcase/>} trend="6 Months Left" color="white"/>
         </div>
      </div>
   );
};

// 7. HEALTH VIEW (LOGGER)
const HealthView = ({ data, setData }) => {
   const [input, setInput] = useState({ sleep: 7, mood: 5, stress: 5 });

   const handleSaveLog = () => {
      const newLog = { date: new Date().toLocaleDateString(), ...input };
      setData({ 
         ...data, 
         health: { ...data.health, logs: [newLog, ...data.health.logs] } 
      });
      alert("Log kesehatan berhasil disimpan.");
   };

   const currentBurnout = calculateBurnoutScore(data.health.logs);

   return (
      <div className="space-y-8">
         <div className="flex justify-between items-end">
            <h2 className="text-3xl font-black text-white">Health & Burnout Tracker</h2>
            <div className={`px-4 py-2 rounded-xl font-bold border ${currentBurnout > 6 ? 'bg-red-900/20 text-red-400 border-red-900' : 'bg-green-900/20 text-green-400 border-green-900'}`}>
               Risk Score: {currentBurnout}/10
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Input Form */}
            <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 space-y-6">
               <h3 className="font-bold text-lg text-white mb-4">Daily Check-in</h3>
               
               <SliderInput label="Durasi Tidur (Jam)" value={input.sleep} max={12} onChange={v => setInput({...input, sleep: v})} color="blue" suffix="Jam" />
               <SliderInput label="Mood (1-10)" value={input.mood} max={10} onChange={v => setInput({...input, mood: v})} color="yellow" suffix="/10" />
               <SliderInput label="Stress Level (1-10)" value={input.stress} max={10} onChange={v => setInput({...input, stress: v})} color="red" suffix="/10" />

               <button onClick={handleSaveLog} className="w-full bg-white text-black py-4 rounded-xl font-bold hover:bg-zinc-200 mt-4 shadow-lg shadow-white/10 transition-transform hover:scale-105">
                  Simpan Log Hari Ini
               </button>
            </div>

            {/* Checklist Warning */}
            <div className="lg:col-span-2 bg-zinc-900 p-8 rounded-3xl border border-zinc-800 flex flex-col justify-between">
               <div>
                  <h3 className="font-bold text-lg text-white mb-6 flex items-center gap-2"><AlertCircle size={20}/> Burnout Red Flags</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     {Object.entries(data.health.checklist).map(([cat, items]) => (
                        <div key={cat} className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
                           <div className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">{cat}</div>
                           <ul className="space-y-2">
                              {items.map((i, idx) => (
                                 <li key={idx} className="text-sm text-zinc-400 flex gap-2">
                                    <span className="text-red-500">•</span> {i}
                                 </li>
                              ))}
                           </ul>
                        </div>
                     ))}
                  </div>
               </div>
               
               {currentBurnout > 7 && (
                  <div className="mt-8 p-4 bg-red-900/10 border border-red-900/30 rounded-xl text-red-200 text-sm font-medium flex gap-3 items-center">
                     <AlertTriangle size={24}/>
                     <span>PERINGATAN: Skor risiko tinggi. Segera ambil "Recovery Day" (Tidur 9 jam, No Screen Time).</span>
                  </div>
               )}
            </div>
         </div>
         
         {/* Log History */}
         <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800">
            <h3 className="font-bold mb-4">Riwayat Log</h3>
            <div className="overflow-x-auto">
               <table className="w-full text-left text-sm text-zinc-400">
                  <thead className="border-b border-zinc-800">
                     <tr>
                        <th className="pb-3">Tanggal</th>
                        <th className="pb-3">Tidur</th>
                        <th className="pb-3">Mood</th>
                        <th className="pb-3">Stress</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                     {data.health.logs.slice(0, 5).map((log, i) => (
                        <tr key={i}>
                           <td className="py-3 font-mono">{log.date}</td>
                           <td className="py-3 text-white">{log.sleep}h</td>
                           <td className="py-3 text-white">{log.mood}</td>
                           <td className="py-3 text-white">{log.stress}</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      </div>
   );
};

// 8. SETTINGS VIEW
const SettingsView = ({ data, setData, resetDefault }) => {
   const handleExport = () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "semester4_backup.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
   };

   // New: Handle Import
   const fileInputRef = useRef(null);
   const handleImport = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
         try {
            const parsed = JSON.parse(event.target.result);
            // Basic validation
            if (!parsed.user || !parsed.academics) throw new Error("Format salah");
            
            if(confirm("Timpa data saat ini dengan data backup?")) {
               setData(parsed);
               alert("Data berhasil dipulihkan!");
            }
         } catch (err) {
            alert("Gagal load file: " + err.message);
         }
      };
      reader.readAsText(file);
   };

   return (
      <div className="max-w-2xl mx-auto space-y-8 pt-10">
         <div className="text-center">
            <h2 className="text-3xl font-black text-white">System Settings</h2>
            <p className="text-zinc-500 mt-2">Manage your data and configuration.</p>
         </div>

         <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 space-y-6">
            <h3 className="font-bold text-white border-b border-zinc-800 pb-4">Data Management</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <button onClick={handleExport} className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-center gap-3 hover:bg-zinc-800 transition-colors">
                  <Download size={20}/>
                  <span className="font-bold text-sm">Backup Data (JSON)</span>
               </button>
               
               <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImport} />
               <button onClick={() => fileInputRef.current.click()} className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-center gap-3 hover:bg-zinc-800 transition-colors">
                  <Upload size={20}/>
                  <span className="font-bold text-sm">Restore Data</span>
               </button>
            </div>

            <div className="pt-6 border-t border-zinc-800">
               <h4 className="text-red-500 font-bold mb-2 text-sm uppercase tracking-wider">Danger Zone</h4>
               <p className="text-xs text-zinc-500 mb-4">Tindakan ini tidak dapat dibatalkan.</p>
               <button onClick={() => { if(confirm("Reset ke default?")) resetDefault() }} className="w-full p-4 border border-red-900/50 bg-red-900/10 text-red-500 rounded-xl font-bold hover:bg-red-900/20 flex items-center justify-center gap-2">
                  <Trash2 size={18}/> Factory Reset System
               </button>
            </div>
         </div>

         <div className="text-center text-xs text-zinc-600 font-mono">
            Execution System v4.0.1<br/>
            Built for High-Performance Students
         </div>
      </div>
   );
};

// --- UTILITY COMPONENTS ---

const Badge = ({ label, active }) => (
   <span className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${active ? 'bg-white text-black border-white' : 'bg-zinc-950 text-zinc-500 border-zinc-800'}`}>
      {label}
   </span>
);

const SliderInput = ({ label, value, max, onChange, color, suffix }) => (
   <div>
      <div className="flex justify-between mb-2">
         <label className="text-sm font-bold text-zinc-400">{label}</label>
         <span className="text-sm font-mono font-bold text-white">{value} {suffix}</span>
      </div>
      <input 
         type="range" min="0" max={max} step="0.5" 
         value={value} 
         onChange={e => onChange(e.target.value)} 
         className={`w-full h-2 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-${color}-500`}
      />
   </div>
);

export default App;