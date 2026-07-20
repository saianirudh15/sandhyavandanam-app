import React from "react";
import {
  ArrowLeft,
  CalendarCheck,
  Trophy,
  Sunrise,
  Sun,
  Sunset,
  Flame,
  Percent
} from "lucide-react";

type DayDiscipline = {
  prata: boolean;
  madhyahnika: boolean;
  sayam: boolean;
};

interface Props {
  discipline: Record<string, DayDiscipline>;
  onBack: () => void;
}

export default function Statistics({ discipline, onBack }: Props) {
  const days = Object.values(discipline);

  const totalDays = days.length;

  const morningCompleted = days.filter(d => d.prata).length;
  const noonCompleted = days.filter(d => d.madhyahnika).length;
  const eveningCompleted = days.filter(d => d.sayam).length;

  const perfectDays = days.filter(
    d => d.prata && d.madhyahnika && d.sayam
  ).length;

  const overall =
    totalDays === 0
      ? 0
      : Math.round((perfectDays / totalDays) * 100);

  // ---------- Current Streak ----------

  const sortedDates = Object.keys(discipline).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  let currentStreak = 0;

  if (sortedDates.length > 0) {
    let cursor = new Date();

    while (true) {
      const key = cursor.toISOString().split("T")[0];

      const day = discipline[key];

      if (
        day &&
        day.prata &&
        day.madhyahnika &&
        day.sayam
      ) {
        currentStreak++;
      } else {
        break;
      }

      cursor.setDate(cursor.getDate() - 1);
    }
  }

  // ---------- Longest Streak ----------

  const ascending = Object.keys(discipline).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  let longest = 0;
  let running = 0;

  ascending.forEach(date => {
    const d = discipline[date];

    if (
      d.prata &&
      d.madhyahnika &&
      d.sayam
    ) {
      running++;

      if (running > longest)
        longest = running;
    } else {
      running = 0;
    }
  });

  const Card = ({
    icon,
    title,
    value,
    color
  }: any) => (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm p-5 border border-slate-200 dark:border-slate-800">

      <div className={`mb-3 ${color}`}>
        {icon}
      </div>

      <div className="text-sm text-slate-500 dark:text-slate-400">
        {title}
      </div>

      <div className="text-3xl font-black mt-2 text-slate-900 dark:text-white">
        {value}
      </div>

    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">

      {/* Header */}

      <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">

        <div className="flex items-center gap-4 px-5 py-4">

          <button
            onClick={onBack}
            className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-white"
          >
            <ArrowLeft size={20} />
          </button>

          <div>

            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Statistics
            </h1>

            <p className="text-sm text-slate-500">
              Your Sandhyavandanam Progress
            </p>

          </div>

        </div>

      </div>

      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">

        <Card
          icon={<CalendarCheck size={28} />}
          title="Total Days Practised"
          value={totalDays}
          color="text-blue-600"
        />

        <Card
          icon={<Trophy size={28} />}
          title="Perfect Days"
          value={perfectDays}
          color="text-green-600"
        />

        <Card
          icon={<Sunrise size={28} />}
          title="Morning Completed"
          value={morningCompleted}
          color="text-orange-500"
        />

        <Card
          icon={<Sun size={28} />}
          title="Midday Completed"
          value={noonCompleted}
          color="text-yellow-500"
        />

        <Card
          icon={<Sunset size={28} />}
          title="Evening Completed"
          value={eveningCompleted}
          color="text-indigo-500"
        />

        <Card
          icon={<Flame size={28} />}
          title="Current Streak"
          value={`${currentStreak} Days`}
          color="text-red-500"
        />

        <Card
          icon={<Trophy size={28} />}
          title="Longest Streak"
          value={`${longest} Days`}
          color="text-purple-600"
        />

        <Card
          icon={<Percent size={28} />}
          title="Overall Discipline"
          value={`${overall}%`}
          color="text-emerald-600"
        />

      </div>

    </div>
  );
}