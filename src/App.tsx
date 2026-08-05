import History from "./components/History";
import Statistics from "./components/Statistics";
import CalendarPage from "./components/Calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight } from "lucide-react";
import { 
  Sun, Sunset, Sunrise, ChevronLeft, ChevronRight, ArrowRight, 
  CheckCircle2, Menu, X, Monitor, Type, Layout, Eye, Trash2, RotateCcw,
  Moon, Sparkles, Languages, Accessibility, Settings
} from 'lucide-react';
import { App as CapApp } from '@capacitor/app';
import { STEPS, Language } from './data';

const MIN_SANDHYA_DURATION = 5 * 60 * 1000; // 5 minutes

const TIMES = [
  { id: 'prata', title: 'Pratah Sandhya', desc: 'Morning Procedure', icon: Sunrise, gradient: 'from-orange-500 via-orange-600 to-red-600', time: 'Sunrise', borderClass: 'border-l-8 border-orange-500', iconBg: 'bg-orange-100 text-orange-500' },
  { id: 'madhyahnika', title: 'Madhyanika Sandhya', desc: 'Mid-day Procedure', icon: Sun, gradient: 'from-amber-400 to-orange-500', time: 'Noon', borderClass: 'border-l-8 border-yellow-400', iconBg: 'bg-yellow-100 text-yellow-600' },
  { id: 'sayam', title: 'Sayam Sandhya', desc: 'Evening Procedure', icon: Sunset, gradient: 'from-indigo-500 to-purple-500', time: 'Sunset', borderClass: 'border-l-8 border-indigo-500', iconBg: 'bg-indigo-50 text-indigo-500' },
];

const LOCALIZED_TITLES: Record<string, Record<Language, string>> = {
  prata: {
    en: 'Pratah Sandhya',
    te: 'ప్రాతః సంధ్యా',
    sa: 'प्रातः संध्या',
    mr: 'प्रातः संध्या',
    kn: 'ಪ್ರಾತಃ ಸಂಧ್ಯಾ'
  },
  madhyahnika: {
    en: 'Madhyanika Sandhya',
    te: 'మధ్యాహ్నిక సంధ్యా',
    sa: 'माध्याह्निक संध्या',
    mr: 'माध्यान्हिक संध्या',
    kn: 'ಮಧ್ಯಾಹ್ನಿಕ ಸಂಧ್ಯಾ'
  },
  sayam: {
    en: 'Sayam Sandhya',
    te: 'సాయంసంధ్యా',
    sa: 'सायं संध्या',
    mr: 'सायं संध्या',
    kn: 'ಸಾಯಂ ಸಂಧ್ಯಾ'
  }
};

function getCurrentWeekDates(): string[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);

  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
}

export default function App() {
  const [view, setView] = useState<
    'home' | 'procedure' | 'step' | 'history' | 'statistics' | 'calendar'
  >('home'); // home, procedure, step
  const [previousView, setPreviousView] = useState(view);

  const [selectedTimeId, setSelectedTimeId] = useState<string | null>(null);
  const [focusedStepIndex, setFocusedStepIndex] = useState<number>(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Settings State
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('sandhya_lang') as Language) || 'en');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => (localStorage.getItem('sandhya_theme') as any) || 'light');
  const [fontSize, setFontSize] = useState(() => Number(localStorage.getItem('sandhya_fontsize')) || 16);
  const [compactView, setCompactView] = useState(() => localStorage.getItem('sandhya_compact') === 'true');
  const [highContrast, setHighContrast] = useState(() => localStorage.getItem('sandhya_contrast') === 'true');

  // Weekly Discipline State
  type DayDiscipline = {
    prata: boolean;
    madhyahnika: boolean;
    sayam: boolean;
  };

  const [discipline, setDiscipline] = useState<Record<string, DayDiscipline>>(() => {
    try {
      const saved = localStorage.getItem("sandhya_discipline");
      if (!saved) return {};

      const parsed = JSON.parse(saved);

      // Migration from old format
      Object.keys(parsed).forEach(date => {
        if (typeof parsed[date] === "boolean") {
          parsed[date] = {
            prata: parsed[date],
            madhyahnika: parsed[date],
            sayam: parsed[date],
          };
        }
      });

      return parsed;
    } catch {
      return {};
    }
  });

  // Navigate function that pushes history state and supports Back button mapping
  const navigateTo = (
    nextView: string,
    nextTimeId: string | null = selectedTimeId,
    isPopState: boolean = false
  ) => {

    // Close the drawer when opening tracking pages
    if (
      nextView === "history" ||
      nextView === "statistics" ||
      nextView === "calendar"
    ) {
      setIsDrawerOpen(false);
    }

    setView(nextView);
    setSelectedTimeId(nextTimeId);

    if (!isPopState) {
      const fromSettings =
        isDrawerOpen &&
        (
          nextView === "history" ||
          nextView === "statistics" ||
          nextView === "calendar"
        );

      window.history.pushState(
        {
          view: nextView,
          selectedTimeId: nextTimeId,
          fromSettings
        },
        ""
      );
    }
  };
  useEffect(() => {
    window.history.replaceState(
      { view: "home", selectedTimeId: null },
      ""
    );

    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;

      if (state && state.view) {
        setView(state.view);
        setSelectedTimeId(state.selectedTimeId ?? null);
      } else {
        setView("home");
        setSelectedTimeId(null);
      }

      setIsDrawerOpen(false);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // Handle Android device physical/gesture back buttons
  useEffect(() => {

    let listener: any = null;
    let cancelled = false;

    const setup = async () => {
      try {
        const backListener = await CapApp.addListener('backButton', () => {
          if (isDrawerOpen) {
            setIsDrawerOpen(false);
          } else if (
            view === "history" ||
            view === "statistics" ||
            view === "calendar"
          ) {
            window.history.back();

            setTimeout(() => {
              setIsDrawerOpen(true);
            }, 100);
          } else if (view !== "home") {
            window.history.back();
          } else {
            CapApp.exitApp();
          }
        });
        if (cancelled) {
          backListener.remove();
        } else {
          listener = backListener;
        }
      } catch (e) {
        // Ignored if not running inside Android/iOS native Webview
      }
    };

    setup();

    return () => {
      cancelled = true;
      if (listener) {
        listener.remove();
      }
    };
  }, [view, isDrawerOpen]);

  useEffect(() => {
    localStorage.setItem('sandhya_discipline', JSON.stringify(discipline));
  }, [discipline]);

  // Ensure periodic cleanup if the app is kept open across sunset to next week


  useEffect(() => {
    localStorage.setItem('sandhya_lang', language);
    localStorage.setItem('sandhya_theme', theme);
    localStorage.setItem('sandhya_fontsize', fontSize.toString());
    localStorage.setItem('sandhya_compact', compactView.toString());
    localStorage.setItem('sandhya_contrast', highContrast.toString());
  }, [language, theme, fontSize, compactView, highContrast]);

  useEffect(() => {
    const root = document.documentElement;

    const isDark =
      theme === "dark" ||
      (theme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    root.classList.toggle("dark", isDark);
    root.classList.toggle("high-contrast", highContrast);
  }, [theme, highContrast]);
  
  useEffect(() => {
    const splash = document.getElementById('splash-screen');
    if (splash) {
      setTimeout(() => {
        splash.classList.add('fade-out');
        setTimeout(() => splash.remove(), 500);
      }, 1500);
    }
  }, []);
  
  const selectedTime = TIMES.find(t => t.id === selectedTimeId);

  const resetApp = () => {
    if (confirm('Reset all settings and progress?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div
      className={`flex h-screen w-full items-center justify-center p-0 sm:p-6 lg:p-12 dark:bg-slate-900 transition-colors ${
        highContrast ? "hc-text" : ""
      }`}
    >
      <div className="relative flex h-full w-full max-w-[400px] flex-col overflow-hidden bg-orange-50 dark:bg-slate-900 shadow-2xl sm:h-[800px] sm:max-h-[95vh] sm:rounded-[2.5rem] sm:border-[8px] sm:border-slate-800 transition-colors">
        
        {/* Side Drawer Overlay */}
        <AnimatePresence>
          {isDrawerOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="absolute inset-0 z-[60] bg-black/40 backdrop-blur-sm"
            />
          )}
        </AnimatePresence>

        {/* Side Drawer Content */}
        <AnimatePresence>
          {isDrawerOpen && (
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute left-0 top-0 bottom-0 z-[70] w-4/5 bg-white dark:bg-slate-900 shadow-2xl overflow-y-auto"
            >
              <SettingsDrawer
                language={language}
                setLanguage={setLanguage}
                theme={theme}
                setTheme={setTheme}
                fontSize={fontSize}
                setFontSize={setFontSize}
                compactView={compactView}
                setCompactView={setCompactView}
                highContrast={highContrast}
                setHighContrast={setHighContrast}

                onClose={() => setIsDrawerOpen(false)}

                onReset={resetApp}

                onHistory={() => {
                  setIsDrawerOpen(false);
                  navigateTo("history");
                }}

                onStatistics={() => {
                  setIsDrawerOpen(false);
                  navigateTo("statistics");
                }}

                onCalendar={() => {
                  setIsDrawerOpen(false);
                  navigateTo("calendar");
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className={`flex-1 overflow-y-auto ${compactView ? 'pb-16' : 'pb-24'}`}>
          <AnimatePresence mode="wait">
            {view === 'home' && (
              <HomeView
                onSelect={(id) => {
                  navigateTo("procedure", id);
                }}
                onOpenDrawer={() => setIsDrawerOpen(true)}
                discipline={discipline}
                setDiscipline={setDiscipline}
                compactView={compactView}
                language={language}
                fontSize={fontSize}
                highContrast={highContrast}
              />
            )}
            {view === 'procedure' && selectedTime && (
              <ProcedureView
                key="procedure"
                time={selectedTime}
                language={language}
                onBack={() => window.history.back()}
                onStart={(stepIndex = 0) => {
                  setFocusedStepIndex(Math.max(0, stepIndex));
                  navigateTo("step", selectedTimeId);
                }}
                onOpenDrawer={() => setIsDrawerOpen(true)}
                compactView={compactView}
                fontSize={fontSize}
                highContrast={highContrast}
              />
            )}
            {view === 'step' && selectedTime && (
              <StepSequenceView 
                key="step" 
                time={selectedTime}
                timeId={selectedTimeId!}
                startIndex={
                  focusedStepIndex >= 0 ? focusedStepIndex : 0
                }
                language={language}
                fontSize={fontSize}
                highContrast={highContrast}
                onBack={() => window.history.back()} 
                onFinish={() => {
                  const d = new Date();
                  const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                  setDiscipline(prev => ({
                    ...prev,
                    [todayStr]: {
                      prata:
                        selectedTimeId === "prata"
                          ? true
                          : prev[todayStr]?.prata ?? false,

                      madhyahnika:
                        selectedTimeId === "madhyahnika"
                          ? true
                          : prev[todayStr]?.madhyahnika ?? false,

                      sayam:
                        selectedTimeId === "sayam"
                          ? true
                          : prev[todayStr]?.sayam ?? false,
                    }
                  }));
                  if (window.history.state && window.history.state.view === 'step') {
                    window.history.go(-2);
                  } else {
                    navigateTo('home', null);
                  }
                }}
              />
            )}
            {view === "history" && (
              <History
                discipline={discipline}
                onBack={() => {
                  window.history.back();

                  setTimeout(() => {
                    setIsDrawerOpen(true);
                  }, 100);
                }}
              />
            )}

            {view === "statistics" && (
              <Statistics
                discipline={discipline}
                onBack={() => {
                  window.history.back();

                  setTimeout(() => {
                    setIsDrawerOpen(true);
                  }, 100);
                }}
              />
            )}

            {view === "calendar" && (
              <CalendarPage
                discipline={discipline}
                onBack={() => {
                  window.history.back();

                  setTimeout(() => {
                    setIsDrawerOpen(true);
                  }, 100);
                }}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function HomeView({
  onSelect,
  onOpenDrawer,
  discipline,
  setDiscipline,
  compactView,
  language,
  fontSize,
  highContrast,
}: {
  onSelect: (id: string) => void;
  onOpenDrawer: () => void;
  discipline: any;
  setDiscipline: any;
  compactView: boolean;
  language: Language;
  fontSize: number;
  highContrast: boolean;
  key?: string;
}) {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);

  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dayInitial = d.toLocaleDateString('en-US', { weekday: 'narrow' });
    const dateString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return {
      date: d,
      dateString,
      dayInitial,
      isToday: d.toDateString() === today.toDateString()
    };
  });

  const completedDays = days.filter(d => {
      const day = discipline[d.dateString];

      return (
          day?.prata &&
          day?.madhyahnika &&
          day?.sayam
      );
  }).length;
  const percentage = Math.round((completedDays / 7) * 100);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`flex flex-col px-6 ${compactView ? 'pt-8' : 'pt-12'}`}
    >
      <div className="mb-8 flex justify-between items-center gap-3 w-full">
        <div className="flex-1 flex flex-col min-w-0 pr-2">
          <button onClick={onOpenDrawer} className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-orange-100 dark:border-slate-700 text-orange-600">
            <Menu size={20} />
          </button>
          <h2
            className={`font-bold uppercase tracking-widest ${
              highContrast
                ? "text-slate-900 dark:text-white"
                : "text-slate-400 dark:text-slate-400"
            }`}
            style={{ fontSize: "12px" }}
          >Rigveda Nitya Anushtanam</h2>
          <h1
            className="font-black whitespace-nowrap"
            style={{
              fontSize: "24px",
              lineHeight: "1",
              letterSpacing: "-0.5px",
              color: "#D97706"
            }}
          >
            SANDHYAVANDANAM
          </h1>
          <p
            className={`font-medium mt-1 ${
              highContrast
                ? "text-slate-900 dark:text-white"
                : "text-slate-500 dark:text-slate-400"
            }`}
            style={{ fontSize: "12px" }}
          >Authentic Rigveda Procedure</p>
        </div>
       <div
         className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-orange-500 to-yellow-400 flex items-center justify-center text-white border-2 border-white shadow-md shrink-0"
         style={{ fontSize: "clamp(14px,4vw,18px)" }}
       >
         ॐ
       </div>
      </div>

      <div className={`flex flex-col ${compactView ? 'gap-3' : 'gap-4'}`}>
        {TIMES.map((time, i) => {
          const Icon = time.icon;
          return (
            <motion.button
              key={time.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => onSelect(time.id)}
              className={`group relative flex items-center gap-4 overflow-hidden rounded-3xl bg-white dark:bg-slate-800 ${
                compactView ? 'p-3' : 'p-4'
              } min-h-[100px] sm:min-h-[110px] shadow-sm ring-1 ring-orange-50 dark:ring-slate-700 transition-all hover:bg-slate-50 dark:hover:bg-slate-700 hover:shadow-md active:scale-95 ${time.borderClass}`}>
              <div className={`flex ${compactView ? 'h-12 w-12' : 'h-14 w-14'} shrink-0 items-center justify-center rounded-2xl ${time.iconBg}`}>
                <Icon size={compactView ? 20 : 24} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col items-start text-left">
                <span className="font-bold uppercase tracking-wider text-slate-400" style={{ fontSize: `${Math.max(9, fontSize - 6)}px` }}>{time.time}</span>
                <span className="font-bold text-slate-800 dark:text-white" style={{fontSize: `${fontSize}px`,lineHeight: 1.15}}>
                  {LOCALIZED_TITLES[time.id]?.[language] || time.title}
                </span>
                {!compactView && <span className="font-medium text-slate-500" style={{ fontSize: `${Math.max(10, fontSize - 4)}px` }}>{time.desc}</span>}
              </div>
              <ChevronRight className="absolute right-4 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100" />
            </motion.button>
          );
        })}
      </div>

      <div className={`mt-8 rounded-3xl bg-white dark:bg-slate-800 ${compactView ? 'p-4' : 'p-6'} shadow-sm border border-orange-100 dark:border-slate-700`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-[16px] text-slate-800 dark:text-slate-200 uppercase tracking-wide">Weekly Discipline</h3>
          <span className="text-orange-500 font-bold text-[18px]">{percentage}%</span>
        </div>
        <div className="flex justify-between gap-2">
          {days.map((day) => {
            const dayData = discipline[day.dateString];

            const isCompleted =
                dayData?.prata &&
                dayData?.madhyahnika &&
                dayData?.sayam;
            return (
              <button 
                key={day.dateString}
                onClick={() => {}}
                className={`flex flex-col items-center gap-1.5 transition-transform hover:scale-105 active:scale-95`}
              >
                <div
                  className={`flex ${
                    compactView ? "h-8 w-8" : "h-9 w-9"
                  } items-center justify-center rounded-full border-2 transition-all duration-300 ${
                    isCompleted
                      ? "bg-orange-500 border-orange-500 text-white shadow-md"
                      : day.isToday
                      ? "border-orange-400 border-dashed text-slate-400 dark:text-slate-500"
                      : "border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500"
                  } ${isCompleted ? "scale-110" : "scale-100"}`}
                >
                  {isCompleted ? (
                    <CheckCircle2 size={16} strokeWidth={3} />
                  ) : (
                    <span className="font-bold text-[15px]">
                      {day.dayInitial}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

function ProcedureView({
  time,
  language,
  onBack,
  onStart,
  onOpenDrawer,
  compactView,
  fontSize,
  highContrast,
}: {
  time: any;
  language: Language;
  onBack: () => void;
  onStart: (stepIndex?: number) => void;
  onOpenDrawer: () => void;
  compactView: boolean;
  fontSize: number;
  highContrast: boolean;
  key?: string;
}){
  const Icon = time.icon;
  const filteredSteps = STEPS.filter(s => !s.timeOnly || s.timeOnly.includes(time.id));
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex min-h-full flex-col bg-slate-50 dark:bg-slate-900"
    >
      <div className={`relative px-6 pb-8 pt-12 text-white bg-gradient-to-br ${time.gradient}`}>
        <div className="flex justify-between items-center">
          <button onClick={onBack} className="flex h-10 w-10 items-center justify-center rounded-full bg-black/10 backdrop-blur-sm transition-colors hover:bg-black/20">
            <ChevronLeft size={20} />
          </button>
          <button onClick={onOpenDrawer} className="flex h-10 w-10 items-center justify-center rounded-full bg-black/10 backdrop-blur-sm transition-colors hover:bg-black/20">
            <Settings size={20} />
          </button>
        </div>
        <div className="mt-12 flex flex-col items-start">
          <div className="mb-4 flex items-center justify-center rounded-2xl bg-white/20 p-3 backdrop-blur-md">
            <Icon size={32} />
          </div>
          <h1
            className="font-black leading-tight break-words"
            style={{
              fontSize: `clamp(${fontSize + 4}px, 5vw, ${fontSize + 12}px)`,
              lineHeight: 1.15,
              wordBreak: "break-word",
              overflowWrap: "anywhere"
            }}
          >
            {LOCALIZED_TITLES[time.id]?.[language] || time.title}
          </h1>
          <p className="mt-2 font-bold text-white/80 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full uppercase tracking-wider text-center" style={{ fontSize: `${Math.max(10, fontSize - 4)}px` }}>{filteredSteps.length} Steps</p>
        </div>
      </div>

      <div className="-mt-6 flex-1 rounded-t-[2rem] bg-white dark:bg-slate-900 px-6 pt-8 pb-32">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="font-bold uppercase tracking-widest text-slate-400" style={{ fontSize: `${Math.max(10, fontSize - 4)}px` }}>Procedure Content</h3>
        </div>

        <div className="flex flex-col gap-3">
          {filteredSteps.map((step, i) => {
            const isExpanded = expandedId === step.id;
            return (
              <div 
                key={step.id} 
                className={`overflow-hidden rounded-2xl border transition-all duration-300 ${isExpanded ? 'border-orange-200 bg-orange-50/50 dark:border-orange-500/30 dark:bg-orange-500/5' : 'border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-800'}`}
              >
                <button 
                  onClick={() => setExpandedId(isExpanded ? null : step.id)}
                  className="flex w-full items-center justify-between p-4 text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full font-bold bg-slate-100 dark:bg-slate-700 text-slate-500" style={{ fontSize: `${Math.max(10, fontSize - 4)}px` }}>
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="font-bold leading-tight text-slate-800 dark:text-white" style={{ fontSize: `${fontSize}px` }}>{step.title[language]}</h4>
                      <p className="font-bold text-slate-400 uppercase tracking-widest" style={{ fontSize: `${Math.max(9, fontSize - 6)}px` }}>{step.type[language]}</p>
                    </div>
                  </div>
                  <motion.div 
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-slate-300"
                  >
                    <ChevronDown size={18} />
                  </motion.div>
                </button>
                
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-orange-100 dark:border-orange-500/20 px-4 pb-4 pt-4">
                        <div className="mb-4">
                          <h5 className="mb-1 font-bold uppercase tracking-widest text-orange-500" style={{ fontSize: `${Math.max(9, fontSize - 6)}px` }}>Instruction</h5>
                          <p className="font-medium leading-relaxed text-slate-600 dark:text-slate-400" style={{ fontSize: `${Math.max(10, fontSize - 3)}px` }}>{step?.instruction?.[language] ?? ""}</p>
                        </div>
                        <div className="rounded-xl bg-white dark:bg-slate-900 p-4 ring-1 ring-orange-100 dark:ring-orange-500/20">
                          <h5 className="mb-2 font-bold uppercase tracking-widest text-orange-400" style={{ fontSize: `${Math.max(9, fontSize - 6)}px` }}>Mantra</h5>
                          <p
                            className={`whitespace-pre-line font-bold leading-relaxed ${
                              highContrast
                                ? "text-black dark:text-white"
                                : "text-slate-800 dark:text-slate-200"
                            }`} style={{ fontSize: `${Math.max(11, fontSize - 2)}px` }}>
                            {step.mantra[language]}
                          </p>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onStart(i);
                          }}
                          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-2.5 font-bold text-white shadow-sm transition-transform active:scale-95 animate-pulse"
                          style={{ fontSize: `${Math.max(10, fontSize - 4)}px` }}
                        >
                          Focus on this Step <ArrowRight size={14} />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      <div className="absolute bottom-6 left-6 right-6">
        <button 
          onClick={onStart}
          className={`flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r ${time.gradient} py-4 font-bold tracking-wide text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-95`}
          style={{ fontSize: `${fontSize}px` }}
        >
          Begin Procedure <ArrowRight size={20} />
        </button>
      </div>
    </motion.div>
  );
}

function StepSequenceView({
  time,
  timeId,
  language,
  startIndex,
  fontSize,
  highContrast,
  onBack,
  onFinish,
}: {
  time: any;
  timeId: string;
  language: Language;
  startIndex: number;
  fontSize: number;
  highContrast: boolean;
  onBack: () => void;
  onFinish: () => void;
  key?: string;
}) {
 const [currentIndex, setCurrentIndex] = useState(0);

 useEffect(() => {
   setCurrentIndex(Math.max(0, startIndex));
 }, [startIndex]);

  const [procedureStartTime] = useState(() => Date.now());

  const filteredSteps = STEPS.filter(
    s => !s.timeOnly || s.timeOnly.includes(time.id)
  );

  const safeIndex = Math.min(
    Math.max(0, currentIndex),
    Math.max(0, filteredSteps.length - 1)
  );

  const step = filteredSteps[safeIndex];

  console.log("time.id =", time.id);
  console.log("startIndex =", startIndex);
  console.log("currentIndex =", currentIndex);
  console.log("safeIndex =", safeIndex);
  console.log("filteredSteps.length =", filteredSteps.length);
  console.log("step =", step);

  if (!step) {
    console.error("Step is undefined", {
      currentIndex,
      filteredStepsLength: filteredSteps.length,
      timeId: time.id,
    });

    return (
      <div className="flex h-full items-center justify-center bg-orange-50 dark:bg-slate-900">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600">
            Invalid Step
          </h2>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Please go back and reopen the procedure.
          </p>
        </div>
      </div>
    );
  }


  
  const handleNext = () => {
    if (currentIndex < filteredSteps.length - 1) {
      setCurrentIndex(prev => prev + 1);
      return;
    }

    const timeSpent = Date.now() - procedureStartTime;

    if (timeSpent < MIN_SANDHYA_DURATION) {
      const remainingMs = MIN_SANDHYA_DURATION - timeSpent;

      // Convert remaining time accurately
      const totalSeconds = Math.ceil(remainingMs / 1000);
      const remainingMinutes = Math.floor(totalSeconds / 60);
      const remainingSeconds = totalSeconds % 60;

      alert(
        `Please spend at least 5 minutes completing the Sandhya.\n\nTime remaining: ${remainingMinutes} minute${remainingMinutes !== 1 ? "s" : ""} ${remainingSeconds} second${remainingSeconds !== 1 ? "s" : ""}.`
      );

      return;
    }

    onFinish();
  };
  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="flex h-full flex-col bg-orange-50 dark:bg-slate-900 overflow-hidden"
    >
      <div className="flex items-center justify-between px-6 pt-10 flex-shrink-0">
        <button onClick={onBack} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <div className="flex items-center gap-1.5 flex-1 mx-4 overflow-hidden justify-center max-w-[200px]">
          {filteredSteps.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIndex ? `w-6 bg-gradient-to-r ${time.gradient} dark:bg-orange-500` : i < currentIndex ? 'w-2 bg-orange-200 dark:bg-orange-900' : 'w-2 bg-slate-200 dark:bg-slate-800'}`} />
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col px-6 pt-6 pb-24 overflow-y-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col w-full pb-8"
          >
            <div className="mb-6 flex flex-col items-center text-center">
              <span className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Step {currentIndex + 1} of {filteredSteps.length}</span>
              <h2
                className="font-black text-slate-800 dark:text-white leading-tight break-words"
                style={{
                  fontSize: `clamp(${fontSize}px, 5vw, ${fontSize + 8}px)`,
                  lineHeight: 1.15,
                  wordBreak: "break-word",
                  overflowWrap: "anywhere"
                }}
              >
                {step?.title?.[language] ?? ""}
              </h2>
              <span className={`mt-3 inline-block rounded-full bg-gradient-to-r ${time.gradient} px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-sm`}>
                {step?.type?.[language] ?? ""}
              </span>
            </div>

            <div className="relative flex flex-col rounded-[2rem] bg-white dark:bg-slate-800 p-6 shadow-sm ring-1 ring-slate-100 dark:ring-slate-700 w-full mb-8">
              <div className="mb-4 relative w-full pr-2">
                <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Instruction</h4>
                <p
                  className="font-medium text-slate-700 dark:text-slate-300 leading-relaxed"
                  style={{ fontSize: `${fontSize - 2}px` }}
                >
                  {step?.instruction?.[language] ?? ""}
                </p>
              </div>
              
              <div className="rounded-2xl bg-orange-50 dark:bg-slate-900 p-5 ring-1 ring-orange-100 dark:ring-slate-700 relative w-full overflow-hidden flex flex-col mt-4">
                <div className="flex justify-between items-start w-full mb-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-orange-500">Mantra</h4>
                  <Sparkles className="text-orange-300" size={16} />
                </div>
                <div className="w-full">
                  <p
                    className={`whitespace-pre-line font-bold leading-relaxed ${
                      highContrast
                        ? "text-black dark:text-white"
                        : "text-slate-800 dark:text-slate-200"
                    }`} style={{ fontSize: `${fontSize}px` }}>
                    {step.mantra[language]}
                  </p>
                </div>
              </div>
            </div>

          </motion.div>
        </AnimatePresence>
      </div>

      <div className="fixed bottom-4 left-4 right-4 flex items-center justify-between z-10 bg-orange-50/80 dark:bg-slate-900/80 backdrop-blur-md py-2 rounded-2xl max-w-[430px]
                                                                                                                                                                  w-[calc(100%-32px)] mx-auto">
        <button 
          onClick={handlePrev} 
          className={`flex h-12 items-center px-4 sm:px-6 font-bold uppercase tracking-wider text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-200 ${currentIndex === 0 ? 'invisible' : ''}`}
        >
          Previous
        </button>
        <button 
          onClick={handleNext}
          className={`flex h-12 items-center justify-center gap-2 rounded-full px-6 sm:px-8 font-bold tracking-wide text-white shadow-lg active:scale-95 transition-transform bg-gradient-to-r ${time.gradient}`}
        >
          {currentIndex === filteredSteps.length - 1 ? (
             <><CheckCircle2 size={18} /> Finish</>
          ) : (
             <>Next Step <ArrowRight size={18} /></>
          )}
        </button>
      </div>
    </motion.div>
  );
}

function SettingsDrawer({
  language, setLanguage,
  theme, setTheme,
  fontSize, setFontSize,
  compactView, setCompactView,
  highContrast, setHighContrast,
  onClose,
  onReset,

  onHistory,
  onStatistics,
  onCalendar

}: any) {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      <div className="px-6 pt-12 pb-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Personalize</h2>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white mt-1">Settings</h1>
        </div>
        <button onClick={onClose} className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 pb-24 space-y-8">
        {/* Language Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Languages size={16} className="text-orange-500" />
            <h3 className="font-bold text-xs uppercase tracking-widest text-slate-500">Language Settings</h3>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {[
              { id: 'en', label: 'English' },
              { id: 'te', label: 'తెలుగు (Telugu)' },
              { id: 'sa', label: 'संस्कृत (Sanskrit)' },
              { id: 'mr', label: 'मराठी (Marathi)' },
              { id: 'kn', label: 'ಕನ್ನಡ (Kannada)' }
            ].map(lang => (
              <button 
                key={lang.id}
                onClick={() => setLanguage(lang.id as Language)} 
                className={`w-full py-3 px-4 text-left rounded-2xl font-bold text-sm transition-all ${language === lang.id ? 'bg-orange-600 text-white shadow-md' : 'bg-slate-50 dark:bg-slate-800 text-slate-500'}`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </section>

        {/* Appearance Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Monitor size={16} className="text-orange-500" />
            <h3 className="font-bold text-xs uppercase tracking-widest text-slate-500">Appearance</h3>
          </div>
          <div className="space-y-4">
            <div className="flex bg-slate-50 dark:bg-slate-800 rounded-2xl p-1 text-center">
              <button onClick={() => setTheme('light')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-[10px] transition-all ${theme === 'light' ? 'bg-white dark:bg-slate-700 text-orange-600 shadow-sm' : 'text-slate-400'}`}><Sun size={14} /> Light</button>
              <button onClick={() => setTheme('dark')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-[10px] transition-all ${theme === 'dark' ? 'bg-white dark:bg-slate-700 text-orange-600 shadow-sm' : 'text-slate-400'}`}><Moon size={14} /> Dark</button>
              <button onClick={() => setTheme('system')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-[10px] transition-all ${theme === 'system' ? 'bg-white dark:bg-slate-700 text-orange-600 shadow-sm' : 'text-slate-400'}`}><Monitor size={14} /> Auto</button>
            </div>
            
            <SettingToggle label="Compact View" icon={Layout} active={compactView} onToggle={() => setCompactView(!compactView)} />
          </div>
        </section>

        {/* Display Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Type size={16} className="text-orange-500" />
            <h3 className="font-bold text-xs uppercase tracking-widest text-slate-500">Display & Reading</h3>
          </div>
          <div className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-slate-500">Font Size: {fontSize}px</span>
                <RotateCcw size={14} className="text-slate-300" onClick={() => setFontSize(16)} />
              </div>
              <input 
                type="range" min="12" max="24" value={fontSize} 
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
            </div>
          </div>
        </section>

        {/* Accessibility Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Accessibility size={16} className="text-orange-500" />
            <h3 className="font-bold text-xs uppercase tracking-widest text-slate-500">Accessibility</h3>
          </div>
          <div className="space-y-4">
            <SettingToggle label="High Contrast" icon={Eye} active={highContrast} onToggle={() => setHighContrast(!highContrast)} />
          </div>
        </section>

        {/* Tracking */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <CalendarIcon size={16} className="text-orange-500" />
                    <h3 className="font-bold text-xs uppercase tracking-widest text-slate-500">
                      Tracking
                    </h3>
                  </div>

                  <div className="space-y-3">

                    <button
                      onClick={() => {
                        onClose();
                        onHistory();
                      }}
                      className="w-full flex items-center justify-between rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">📜</span>
                        <span className="font-semibold text-slate-800 dark:text-white">
                          History
                        </span>
                      </div>

                      <ChevronRight
                        size={18}
                        className="text-slate-400 dark:text-slate-500"
                      />
                    </button>

                    <button
                      onClick={() => {
                        onClose();
                        onStatistics();
                      }}
                      className="w-full flex items-center justify-between rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">📊</span>
                        <span className="font-semibold text-slate-800 dark:text-white">
                          Statistics
                        </span>
                      </div>

                      <ChevronRight
                        size={18}
                        className="text-slate-400 dark:text-slate-500"
                      />
                    </button>

                    <button
                      onClick={() => {
                        onClose();
                        onCalendar();
                      }}
                      className="w-full flex items-center justify-between rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">📅</span>
                        <span className="font-semibold text-slate-800 dark:text-white">
                          Calendar
                        </span>
                      </div>

                      <ChevronRight
                        size={18}
                        className="text-slate-400 dark:text-slate-500"
                      />
                    </button>

                  </div>
                </section>

        {/* Data Management Section */}
        <section>
          <div className="flex items-center gap-2 mb-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Trash2 size={16} className="text-red-500" />
            <h3 className="font-bold text-xs uppercase tracking-widest text-red-500">Data Management</h3>
          </div>
          <div className="space-y-2">
            <button onClick={onReset} className="w-full flex items-center justify-between py-4 px-5 bg-red-600 rounded-2xl text-white shadow-sm transition-transform active:scale-95">
              <span className="font-bold text-sm">Reset App Preferences</span>
              <Trash2 size={18} />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function SettingToggle({ label, icon: Icon, active, onToggle }: { label: string, icon: any, active: boolean, onToggle: () => void }) {
  return (
    <button onClick={onToggle} className="w-full flex items-center justify-between py-4 px-5 bg-slate-50 dark:bg-slate-800 rounded-2xl transition-all hover:bg-slate-100 dark:hover:bg-slate-750">
      <div className="flex items-center gap-3">
        <Icon size={18} className={active ? 'text-orange-500' : 'text-slate-400'} />
        <span className={`font-bold text-sm ${active ? 'text-slate-800 dark:text-white' : 'text-slate-500'}`}>{label}</span>
      </div>
      <div className={`w-10 h-6 rounded-full transition-colors relative ${active ? 'bg-orange-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
        <motion.div 
          animate={{ x: active ? 18 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="w-4 h-4 rounded-full bg-white absolute top-1 shadow-sm"
        />
      </div>
    </button>
  );
}

function ChevronDown(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m6 9 6 6 6-6"/>
    </svg>
  );
}
