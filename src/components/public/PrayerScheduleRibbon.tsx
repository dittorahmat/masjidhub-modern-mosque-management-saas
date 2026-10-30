import React from 'react';
import { motion } from 'framer-motion';
import { User, Clock } from 'lucide-react';
import type { PrayerSchedule } from '@shared/types';

interface PrayerScheduleRibbonProps {
  schedules: PrayerSchedule[];
}

const PRAYER_KEYS = [
  { key: 'fajr', label: 'Subuh' },
  { key: 'dhuhr', label: 'Dzuhur' },
  { key: 'asr', label: 'Ashar' },
  { key: 'maghrib', label: 'Maghrib' },
  { key: 'isha', label: 'Isya' },
];

export function PrayerScheduleRibbon({ schedules }: PrayerScheduleRibbonProps) {
  return (
    <section className="max-w-7xl mx-auto px-4 -mt-12 sm:-mt-16 relative z-20">
      {/* Mobile-friendly horizontal scroll / wrap container */}
      <div className="flex md:grid md:grid-cols-5 gap-3 md:gap-6 overflow-x-auto pb-4 md:pb-0 scrollbar-none snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0">
        {PRAYER_KEYS.map((p, idx) => {
          const sched = schedules.find((s) => s.prayerTime === p.key);

          return (
            <motion.div
              key={p.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * idx }}
              className="min-w-[130px] sm:min-w-[140px] md:min-w-0 flex-1 snap-center bg-slate-900/95 backdrop-blur-xl text-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-[2rem]  border border-white/10 flex flex-col items-center justify-center space-y-2 group hover:bg-primary transition-all duration-300 cursor-default shrink-0"
            >
              <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-white/80 transition-colors">
                <Clock className="h-3 w-3 sm:hidden" />
                <span className="font-bold uppercase tracking-[0.2em] text-[10px] md:text-xs">
                  {p.label}
                </span>
              </div>

              <span className="text-2xl sm:text-3xl md:text-5xl font-bold tracking-tight tabular-nums">
                {sched?.time || '--:--'}
              </span>

              {sched?.imamName ? (
                <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity max-w-full">
                  <User className="h-2.5 w-2.5 shrink-0" />
                  <span className="text-[10px] font-bold truncate max-w-[85px] uppercase tracking-wider">
                    {sched.imamName.split(' ')[0]}
                  </span>
                </div>
              ) : (
                <div className="h-3.5" />
              )}
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
