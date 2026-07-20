import React from "react";
import {
  ArrowLeft,
  CalendarDays,
  Sunrise,
  Sun,
  Sunset,
  CheckCircle2,
  XCircle,
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

export default function History({ discipline, onBack }: Props) {
  const history = Object.entries(discipline).sort(
    (a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()
  );

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const Status = ({ done }: { done: boolean }) =>
    done ? (
      <span className="flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold">
        <CheckCircle2 size={18} />
        Completed
      </span>
    ) : (
      <span className="flex items-center gap-2 text-red-500 dark:text-red-400 font-semibold">
        <XCircle size={18} />
        Not Completed
      </span>
    );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">

      {/* Header */}

      <div className="sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">

        <div className="flex items-center gap-4 px-5 py-4">

          <button
            onClick={onBack}
            className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-white"
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              History
            </h1>

            <p className="text-sm text-slate-500">
              Your Sandhyavandanam Record
            </p>
          </div>

        </div>

      </div>

      {/* Empty */}

      {history.length === 0 && (

        <div className="flex flex-col items-center justify-center mt-24">

          <CalendarDays size={70} className="text-slate-300" />

          <h2 className="mt-5 text-xl font-bold text-slate-900 dark:text-white">
            No History Found
          </h2>

          <p className="text-slate-500 mt-2 text-center px-8">
            Complete Sandhyavandanam to start building your discipline history.
          </p>

        </div>

      )}

      {/* Cards */}

      <div className="p-5 space-y-5">

        {history.map(([date, day]) => {

          const perfect =
            day.prata &&
            day.madhyahnika &&
            day.sayam;

          return (

            <div
              key={date}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden"
            >

              {/* Header */}

              <div
                className={`px-5 py-4 text-white ${
                  perfect
                    ? "bg-green-600"
                    : "bg-orange-500"
                }`}
              >

                <h2 className="font-bold text-lg text-white">
                  {formatDate(date)}
                </h2>

                <p className="text-sm opacity-90 mt-1">

                  {perfect
                    ? "Perfect Day ✅"
                    : "Partial Completion"}

                </p>

              </div>

              {/* Body */}

              <div className="p-5 space-y-5">

                <div className="flex justify-between items-center">

                  <div className="flex items-center gap-3">

                    <Sunrise className="text-orange-500" />

                    <span className="font-semibold text-slate-900 dark:text-white">
                      Morning Sandhya
                    </span>

                  </div>

                  <Status done={day.prata} />

                </div>

                <div className="flex justify-between items-center">

                  <div className="flex items-center gap-3">

                    <Sun className="text-yellow-500" />

                    <span className="font-semibold text-slate-900 dark:text-white">
                      Madhyahnika Sandhya
                    </span>

                  </div>

                  <Status done={day.madhyahnika} />

                </div>

                <div className="flex justify-between items-center">

                  <div className="flex items-center gap-3">

                    <Sunset className="text-indigo-500" />

                    <span className="font-semibold text-slate-900 dark:text-white">
                      Sayam Sandhya
                    </span>

                  </div>

                  <Status done={day.sayam} />

                </div>

              </div>

            </div>

          );

        })}

      </div>

    </div>
  );
}