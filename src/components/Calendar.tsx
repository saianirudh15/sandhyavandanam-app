import React, { useMemo, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";

type DayDiscipline = {
  prata: boolean;
  madhyahnika: boolean;
  sayam: boolean;
};

interface Props {
  discipline: Record<string, DayDiscipline>;
  onBack: () => void;
}

export default function Calendar({ discipline, onBack }: Props) {
  const [current, setCurrent] = useState(new Date());
  const [selected, setSelected] = useState<string | null>(null);

  const year = current.getFullYear();
  const month = current.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const startDay = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const cells = useMemo(() => {
    const arr: (Date | null)[] = [];

    for (let i = 0; i < startDay; i++) arr.push(null);

    for (let d = 1; d <= totalDays; d++) {
      arr.push(new Date(year, month, d));
    }

    return arr;
  }, [year, month, startDay, totalDays]);

  const formatKey = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(date.getDate()).padStart(2, "0")}`;

  const getClass = (key: string) => {
    const day = discipline[key];

    if (!day)
      return "bg-red-100 dark:bg-red-900/30 text-slate-900 dark:text-white";

    if (day.prata && day.madhyahnika && day.sayam)
      return "bg-green-500 text-white";

    if (day.prata || day.madhyahnika || day.sayam)
      return "bg-yellow-400 text-slate-900";

    return "bg-red-100 dark:bg-red-900/30 text-slate-900 dark:text-white";
  };

  const selectedDay = selected ? discipline[selected] : undefined;

  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const years = Array.from({ length: 31 }, (_, i) => 2015 + i);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4">

      {/* Header */}

      <div className="flex items-center justify-between mb-6">

        <button
          onClick={onBack}
          className="text-slate-900 dark:text-white"
        >
          <ArrowLeft />
        </button>

        <div className="flex items-center gap-2">

          <button
            onClick={() => setCurrent(new Date(year, month - 1, 1))}
            className="text-slate-900 dark:text-white"
          >
            <ChevronLeft />
          </button>

          <select
            value={month}
            onChange={(e) => setCurrent(new Date(year, Number(e.target.value), 1))}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-slate-900 dark:text-white"
          >
            {months.map((m, i) => (
              <option key={i} value={i}>{m}</option>
            ))}
          </select>

          <select
            value={year}
            onChange={(e) => setCurrent(new Date(Number(e.target.value), month, 1))}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-slate-900 dark:text-white"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <button
            onClick={() => setCurrent(new Date(year, month + 1, 1))}
            className="text-slate-900 dark:text-white"
          >
            <ChevronRight />
          </button>

        </div>

      </div>

      {/* Week Days */}

      <div className="grid grid-cols-7 gap-2 mb-2 text-center font-semibold">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="text-slate-700 dark:text-slate-300"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar */}

      <div className="grid grid-cols-7 gap-2">

        {cells.map((date, index) =>
          date ? (
            <button
              key={index}
              onClick={() => setSelected(formatKey(date))}
              className={`aspect-square rounded-xl font-semibold transition-colors ${getClass(
                formatKey(date)
              )}`}
            >
              {date.getDate()}
            </button>
          ) : (
            <div key={index}></div>
          )
        )}

      </div>

      {/* Selected Day */}

      {selected && (
        <div className="mt-6 rounded-2xl bg-white dark:bg-slate-900 p-5 shadow border border-slate-200 dark:border-slate-800">

          <h2 className="font-bold mb-4 text-slate-900 dark:text-white">
            {selected}
          </h2>

          <p className="text-slate-700 dark:text-slate-300">
            🌅 Morning:{" "}
            {selectedDay?.prata
              ? "✅ Completed"
              : "❌ Not Completed"}
          </p>

          <p className="mt-2 text-slate-700 dark:text-slate-300">
            ☀️ Midday:{" "}
            {selectedDay?.madhyahnika
              ? "✅ Completed"
              : "❌ Not Completed"}
          </p>

          <p className="mt-2 text-slate-700 dark:text-slate-300">
            🌇 Evening:{" "}
            {selectedDay?.sayam
              ? "✅ Completed"
              : "❌ Not Completed"}
          </p>

        </div>
      )}

      {/* Legend */}

      <div className="mt-6 flex gap-4 text-sm text-slate-700 dark:text-slate-300">

        <div>🟢 Perfect</div>

        <div>🟡 Partial</div>

        <div>🔴 None</div>

      </div>

    </div>
  );
}