"use client";

import { useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import foods from "../data/foods.json";

type FoodItem = {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

const mealSlots = ["Breakfast", "Lunch", "Dinner", "Snack"];

export default function MealLoggerPage() {
  const [query, setQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [grams, setGrams] = useState(100);
  const [mealSlot, setMealSlot] = useState("Breakfast");
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const filteredFoods = useMemo(
    () =>
      query.trim().length
        ? (foods as FoodItem[]).filter((food) =>
            food.name.toLowerCase().includes(query.toLowerCase())
          )
        : [],
    [query]
  );

  const factor = selectedFood ? grams / 100 : 0;
  const calculated = useMemo(() => {
    if (!selectedFood) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }
    return {
      calories: Number((selectedFood.calories * factor).toFixed(1)),
      protein: Number((selectedFood.protein * factor).toFixed(1)),
      carbs: Number((selectedFood.carbs * factor).toFixed(1)),
      fat: Number((selectedFood.fat * factor).toFixed(1)),
    };
  }, [selectedFood, factor]);

  const handleSelectFood = (food: FoodItem) => {
    setSelectedFood(food);
    setQuery(food.name);
    setStatus(null);
  };

  const handleSave = async () => {
    if (!selectedFood || grams <= 0) {
      setStatus("Please select a food and enter a positive grams amount.");
      return;
    }

    setIsSaving(true);
    setStatus(null);
    const date = new Date().toISOString().split("T")[0];

    const { error } = await supabase.from("meal_logs").insert([
      {
        date,
        meal_slot: mealSlot,
        food_name: selectedFood.name,
        grams,
        calories: calculated.calories,
        protein: calculated.protein,
        carbs: calculated.carbs,
        fat: calculated.fat,
      },
    ]);

    setIsSaving(false);

    if (error) {
      setStatus(`Unable to save meal: ${error.message}`);
    } else {
      setStatus("Meal logged successfully!");
      setSelectedFood(null);
      setQuery("");
      setGrams(100);
      setMealSlot("Breakfast");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 py-10 px-4 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-lg shadow-slate-200/60 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Meal Logger</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Search foods, enter grams, and save nutrition details to Supabase.
            </p>
          </div>
          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            Route: <strong className="ml-2">/meal-logger</strong>
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-6 rounded-3xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Search food</label>
              <input
                type="text"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setSelectedFood(null);
                  setStatus(null);
                }}
                placeholder="Start typing a food name..."
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-500"
              />
            </div>

            {query.trim().length > 0 && filteredFoods.length > 0 && (
              <div className="max-h-72 overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                {filteredFoods.slice(0, 10).map((food) => (
                  <button
                    key={food.name}
                    type="button"
                    onClick={() => handleSelectFood(food)}
                    className="w-full px-4 py-3 text-left text-sm transition hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <span className="font-medium">{food.name}</span>
                    <span className="ml-2 text-slate-500 dark:text-slate-400">({food.calories} kcal per 100g)</span>
                  </button>
                ))}
              </div>
            )}

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-sm font-medium">Selected food</label>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base dark:border-slate-700 dark:bg-slate-950">
                  {selectedFood ? selectedFood.name : "No food selected"}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Meal slot</label>
                <select
                  value={mealSlot}
                  onChange={(event) => setMealSlot(event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  {mealSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-sm font-medium">Grams</label>
                <input
                  type="number"
                  value={grams}
                  min={1}
                  onChange={(event) => setGrams(Number(event.target.value))}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium">Calories per 100g</label>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base dark:border-slate-700 dark:bg-slate-950">
                  {selectedFood ? selectedFood.calories : "—"}
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex h-14 items-center justify-center rounded-2xl bg-slate-900 px-6 text-base font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isSaving ? "Saving..." : "Save meal"}
              </button>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                <p className="font-medium">Entry preview</p>
                <p>{selectedFood ? selectedFood.name : "No food selected yet."}</p>
                <p>{grams} g</p>
                <p>{mealSlot}</p>
              </div>
            </div>

            {status && (
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                {status}
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <h2 className="mb-4 text-xl font-semibold">Nutrition summary</h2>
            <div className="space-y-4">
              <div className="rounded-3xl bg-white p-5 shadow-sm dark:bg-slate-900">
                <p className="text-sm uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Calories</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-50">{calculated.calories}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-white p-5 shadow-sm dark:bg-slate-900">
                  <p className="text-sm uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Protein</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-50">{calculated.protein} g</p>
                </div>
                <div className="rounded-3xl bg-white p-5 shadow-sm dark:bg-slate-900">
                  <p className="text-sm uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Carbs</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-50">{calculated.carbs} g</p>
                </div>
                <div className="rounded-3xl bg-white p-5 shadow-sm dark:bg-slate-900 sm:col-span-2">
                  <p className="text-sm uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Fat</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-50">{calculated.fat} g</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
