"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type MealLog = {
  id: number;
  date: string;
  meal_slot: string;
  food_name: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type UserGoals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

const defaultGoals: UserGoals = {
  calories: 2000,
  protein: 120,
  carbs: 250,
  fat: 70,
};

const macroLabels: Array<keyof UserGoals> = ["calories", "protein", "carbs", "fat"];

function getTodayIsoDate() {
  return new Date().toISOString().split("T")[0];
}

export default function DailyMacroDashboard() {
  const [mealLogs, setMealLogs] = useState<MealLog[]>([]);
  const [goals, setGoals] = useState<UserGoals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      const today = getTodayIsoDate();

      const { data: logsData, error: logsError } = await supabase
        .from("meal_logs")
        .select("id,date,meal_slot,food_name,grams,calories,protein,carbs,fat")
        .eq("date", today)
        .order("id", { ascending: false });

      const { data: goalsData, error: goalsError } = await supabase
        .from("user_goals")
        .select("calories,protein,carbs,fat")
        .limit(1)
        .maybeSingle();

      if (logsError) {
        setError(`Unable to load meal logs: ${logsError.message}`);
      } else {
        setMealLogs((logsData ?? []) as MealLog[]);
      }

      if (goalsError) {
        setError((prev) => prev ?? `Unable to load goals: ${goalsError.message}`);
      } else if (goalsData) {
        setGoals(goalsData as UserGoals);
      }

      setLoading(false);
    };

    loadData();
  }, []);

  const totals = useMemo(() => {
    return mealLogs.reduce(
      (acc, log) => {
        acc.calories += log.calories ?? 0;
        acc.protein += log.protein ?? 0;
        acc.carbs += log.carbs ?? 0;
        acc.fat += log.fat ?? 0;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [mealLogs]);

  const effectiveGoals = goals ?? defaultGoals;

  const chartData = macroLabels.map((key) => {
    const current = totals[key];
    const goal = effectiveGoals[key];
    return {
      name: key.charAt(0).toUpperCase() + key.slice(1),
      current,
      remaining: Math.max(0, goal - current),
      goal,
      percent: goal > 0 ? Math.min(100, Math.round((current / goal) * 100)) : 0,
    };
  });

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    setError(null);
    const { error: deleteError } = await supabase.from("meal_logs").delete().eq("id", id);
    setDeletingId(null);

    if (deleteError) {
      setError(`Delete failed: ${deleteError.message}`);
      return;
    }

    setMealLogs((current) => current.filter((log) => log.id !== id));
  };

  return (
    <div className="min-h-screen bg-zinc-50 py-10 px-4 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="rounded-3xl bg-white p-8 shadow-lg shadow-slate-200/40 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                Daily Macro Dashboard
              </p>
              <h1 className="mt-2 text-3xl font-semibold">Today's progress</h1>
            </div>
            <div className="rounded-3xl bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:bg-slate-950 dark:text-slate-200">
              <p className="font-medium">Date</p>
              <p>{getTodayIsoDate()}</p>
            </div>
          </div>
          <p className="mt-4 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            This dashboard fetches today&apos;s meal logs from Supabase, sums all macros, and compares them against your stored goals from the user_goals table.
          </p>
        </header>

        <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-3xl bg-white p-6 shadow-sm dark:bg-slate-900">
            <h2 className="mb-4 text-xl font-semibold">Macro progress</h2>
            <div className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 16, right: 16, left: 0, bottom: 16 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis type="number" domain={[0, "dataMax + 20"]} hide />
                  <YAxis type="category" dataKey="name" width={96} tick={{ fill: "#334155", fontSize: 14 }} />
                  <Tooltip
                    cursor={{ fill: "rgba(148,163,184,0.12)" }}
                    formatter={(value: number, name: string) => [value, name === "remaining" ? "Remaining" : "Current"]}
                  />
                  <Bar dataKey="remaining" stackId="a" fill="#e2e8f0" />
                  <Bar dataKey="current" stackId="a" fill="#2563eb">
                    <LabelList dataKey="percent" position="right" formatter={(value: number) => `${value}%`} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {chartData.map((item) => (
                <div key={item.name} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                  <p className="text-sm text-slate-500 dark:text-slate-400">{item.name}</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-50">
                    {item.current} / {item.goal}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm dark:bg-slate-900">
            <h2 className="mb-4 text-xl font-semibold">Summary</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-50 p-4 dark:bg-slate-950">
                <p className="text-sm text-slate-500 dark:text-slate-400">Total calories</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-50">{totals.calories}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4 dark:bg-slate-950">
                <p className="text-sm text-slate-500 dark:text-slate-400">Total protein</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-50">{totals.protein} g</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4 dark:bg-slate-950">
                <p className="text-sm text-slate-500 dark:text-slate-400">Total carbs</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-50">{totals.carbs} g</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4 dark:bg-slate-950">
                <p className="text-sm text-slate-500 dark:text-slate-400">Total fat</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-50">{totals.fat} g</p>
              </div>
            </div>
            {goals === null && (
              <p className="mt-4 rounded-3xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-600 dark:bg-amber-950/40 dark:text-amber-200">
                No user goals found. Showing fallback target values.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm dark:bg-slate-900">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Today&apos;s meals</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Review and delete individual meals from today&apos;s log.
              </p>
            </div>
            {loading ? (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                Loading...
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {mealLogs.length} meals logged
              </span>
            )}
          </div>

          {error && (
            <div className="mt-4 rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-700/40 dark:bg-red-950/20 dark:text-red-200">
              {error}
            </div>
          )}

          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-700">
            <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_0.75fr] gap-4 bg-slate-100 px-4 py-3 text-slate-500 text-sm font-semibold dark:bg-slate-950 dark:text-slate-400">
              <span>Food</span>
              <span>Meal slot</span>
              <span>Grams</span>
              <span>Macros</span>
              <span></span>
            </div>
            <div className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-900">
              {mealLogs.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  No meals logged for today yet.
                </div>
              ) : (
                mealLogs.map((log) => (
                  <div key={log.id} className="grid grid-cols-[1.5fr_1fr_1fr_1fr_0.75fr] gap-4 px-4 py-4 text-sm text-slate-700 dark:text-slate-200">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-50">{log.food_name}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{log.date}</p>
                    </div>
                    <div className="text-slate-600 dark:text-slate-300">{log.meal_slot}</div>
                    <div className="text-slate-600 dark:text-slate-300">{log.grams} g</div>
                    <div className="text-slate-600 dark:text-slate-300">
                      {log.calories} kcal • {log.protein}p • {log.carbs}c • {log.fat}f
                    </div>
                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => handleDelete(log.id)}
                        disabled={deletingId === log.id}
                        className="rounded-2xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
                      >
                        {deletingId === log.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
