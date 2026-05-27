import { useState } from "react";
import { useListTests, useStartSession } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";

const YEAR_COLORS: Record<string, string> = {
  "2024": "bg-blue-600",
  "2023": "bg-purple-600",
  "2022": "bg-emerald-600",
  "2021": "bg-orange-500",
  "2020": "bg-red-600",
  "2019": "bg-pink-600",
};

const SUBJECT_ICONS: Record<string, string> = {
  physics: "⚡",
  chemistry: "🧪",
  mathematics: "📐",
  all: "📋",
};

export default function Tests() {
  const { data: tests, isLoading } = useListTests();
  const startSessionMutation = useStartSession();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [starting, setStarting] = useState<number | null>(null);

  const handleStartTest = (testId: number) => {
    if (!user) { setLocation("/login"); return; }
    setStarting(testId);
    startSessionMutation.mutate(
      { data: { testId } },
      {
        onSuccess: (session) => {
          document.documentElement.requestFullscreen?.().catch(() => {});
          setLocation(`/test/${session.id}`);
        },
        onSettled: () => setStarting(null),
      }
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-[#0a1628] text-white py-14">
        <div className="container mx-auto px-4">
          <div className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-3">Free Practice</div>
          <h1 className="text-3xl md:text-4xl font-black mb-2">JEE Main PYQ Test Series</h1>
          <p className="text-gray-400 max-w-xl">
            Practice with official JEE Main papers from 2020–2024. Each test has 75 questions — 25 per subject (20 MCQ + 5 Integer) — with 3 hours duration.
          </p>

          {/* Pattern pills */}
          <div className="flex flex-wrap gap-3 mt-6">
            {["25 Physics", "25 Chemistry", "25 Mathematics"].map(s => (
              <span key={s} className="bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium text-white/80">
                {s}
              </span>
            ))}
            <span className="bg-blue-600/30 border border-blue-500/40 rounded-full px-4 py-1.5 text-sm font-bold text-blue-300">
              180 min · 300 marks
            </span>
          </div>
        </div>
      </div>

      {/* Scoring Info Strip */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center gap-6 text-xs font-medium text-gray-600">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" />+4 Correct Answer</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" />-1 Wrong MCQ</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-gray-300 inline-block" />0 Unattempted</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />Integer — No negative marking</span>
          </div>
        </div>
      </div>

      {/* Tests Grid */}
      <div className="container mx-auto px-4 py-10">
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden animate-pulse h-72" />
            ))}
          </div>
        ) : !tests?.length ? (
          <div className="text-center py-24 text-gray-400">
            <div className="text-5xl mb-4">📄</div>
            <div className="font-semibold text-gray-600 mb-1">Tests loading...</div>
            <p className="text-sm">Please refresh the page.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {tests.map((test, i) => {
              const year = (test.title ?? "").match(/\d{4}/)?.[0] ?? "2024";
              const yColor = YEAR_COLORS[year] ?? "bg-blue-600";
              const isStarting = starting === test.id;
              const colors = ["from-blue-500 to-indigo-600", "from-purple-500 to-pink-600", "from-emerald-500 to-teal-600", "from-orange-400 to-red-500", "from-cyan-500 to-blue-600"];
              const grad = colors[i % colors.length];

              return (
                <div key={test.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-all hover:-translate-y-0.5 flex flex-col group">
                  {/* gradient top bar */}
                  <div className={`h-1.5 bg-gradient-to-r ${grad}`} />

                  <div className="p-6 flex-1 flex flex-col">
                    {/* badges row */}
                    <div className="flex items-center gap-2 mb-4">
                      <span className={`${yColor} text-white text-xs font-bold px-2.5 py-1 rounded-full`}>
                        {year} PYQ
                      </span>
                      <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-1 rounded-full">
                        Full Mock
                      </span>
                      {(test.attemptCount ?? 0) > 0 && (
                        <span className="ml-auto text-xs text-gray-400">{test.attemptCount} attempts</span>
                      )}
                    </div>

                    <h3 className="font-black text-gray-900 text-xl mb-1 group-hover:text-blue-600 transition-colors leading-snug">
                      {test.title}
                    </h3>
                    <p className="text-sm text-gray-500 mb-5 flex-1">
                      {test.description ?? "Official JEE Main paper with all three subjects."}
                    </p>

                    {/* Stats grid */}
                    <div className="grid grid-cols-3 gap-2 mb-5 text-center">
                      <div className="bg-gray-50 rounded-lg py-2">
                        <div className="font-black text-gray-900 text-lg">{test.totalQuestions ?? 75}</div>
                        <div className="text-xs text-gray-500">Questions</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg py-2">
                        <div className="font-black text-gray-900 text-lg">{test.maxMarks ?? 300}</div>
                        <div className="text-xs text-gray-500">Max Marks</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg py-2">
                        <div className="font-black text-gray-900 text-lg">{test.duration ?? 180}</div>
                        <div className="text-xs text-gray-500">Minutes</div>
                      </div>
                    </div>

                    {/* Subject pills */}
                    <div className="flex gap-1.5 mb-5">
                      {["Physics", "Chemistry", "Maths"].map(s => (
                        <span key={s} className="text-xs bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-2.5 py-0.5 font-medium">
                          {SUBJECT_ICONS[s.toLowerCase()] ?? "📋"} {s}
                        </span>
                      ))}
                    </div>

                    <button
                      onClick={() => handleStartTest(test.id)}
                      disabled={isStarting}
                      className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                        isStarting
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-[#0a1628] hover:bg-blue-700 text-white shadow-sm hover:shadow-md"
                      }`}
                    >
                      {isStarting ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Starting...
                        </span>
                      ) : user ? "Start Test →" : "Login to Attempt →"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h3 className="font-bold text-blue-900 text-lg mb-4">📋 Before You Begin</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              "Ensure you have a stable internet connection before starting.",
              "The test runs in fullscreen mode. Exiting fullscreen twice will auto-submit.",
              "Your answers are auto-saved every 30 seconds.",
              "The test will auto-submit when the 3-hour timer runs out.",
              "Mark questions for review and revisit them before submitting.",
              "Unattempted questions carry 0 marks — attempt everything.",
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-blue-800">
                <span className="text-blue-500 mt-0.5 flex-none">✓</span>
                {tip}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
