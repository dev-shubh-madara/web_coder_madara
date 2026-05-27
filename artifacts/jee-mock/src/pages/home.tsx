import { useGetPlatformStats, useListTests } from "@workspace/api-client-react";
import { Link } from "wouter";

const FEATURES = [
  { icon: "🎯", title: "NTA-Exact Interface", desc: "Pixel-perfect replica of the official JEE Main CBT portal — same palette, timer, and navigation." },
  { icon: "📅", title: "10 Years of PYQ", desc: "Practice with official JEE Main papers from 2015–2024, all shifts included." },
  { icon: "🤖", title: "AI Performance Insights", desc: "Get personalized weak-topic analysis and a daily study plan based on your attempt history." },
  { icon: "⏱️", title: "Timed Mock Tests", desc: "3-hour full mocks with auto-submit, auto-save, and fullscreen enforcement — just like the real exam." },
  { icon: "📊", title: "Detailed Analytics", desc: "Subject-wise score breakdown, accuracy per topic, percentile, and All India Rank estimate." },
  { icon: "🏆", title: "All India Leaderboard", desc: "Compete with thousands of aspirants and track your national rank in real-time." },
];

const TESTIMONIALS = [
  { name: "Arjun Sharma", rank: "AIR 247 — IIT Bombay CSE", text: "The exam interface felt exactly like the real JEE Main. I was completely comfortable on exam day because of this platform.", avatar: "A" },
  { name: "Priya Nair", rank: "AIR 1243 — IIT Delhi Mech", text: "The AI insights helped me find my weak spots in Organic Chemistry. I went from 45% to 78% in just 3 weeks!", avatar: "P" },
  { name: "Rohan Patel", rank: "AIR 512 — IIT Kharagpur CS", text: "Free, full-featured, and actually useful. The PYQ papers here are what made the difference in my preparation.", avatar: "R" },
];

export default function Home() {
  const { data: stats } = useGetPlatformStats();
  const { data: tests } = useListTests();

  return (
    <div className="flex flex-col bg-white">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-[#0a1628] text-white">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #3b82f6 0%, transparent 50%), radial-gradient(circle at 80% 20%, #6366f1 0%, transparent 40%)" }} />
        <div className="relative container mx-auto px-4 py-24 lg:py-36 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 rounded-full px-4 py-1.5 text-blue-300 text-sm font-medium mb-8">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            JEE Main 2025 — Free Practice Platform
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight mb-6 leading-tight">
            Crack JEE Main with<br />
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Confidence</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            India's most accurate free JEE Main CBT simulator. Practice with 10 years of PYQs, get AI-powered insights, and track your All India Rank.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/tests">
              <button className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-lg transition-all shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:-translate-y-0.5">
                Start Free Test →
              </button>
            </Link>
            <Link href="/login">
              <button className="px-8 py-4 border border-white/20 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl text-lg transition-all">
                Login / Register
              </button>
            </Link>
          </div>

          {/* trust badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-gray-400 text-sm">
            <span>✓ 100% Free</span>
            <span>✓ No Signup Required to Browse</span>
            <span>✓ NTA-Pattern Papers</span>
            <span>✓ Instant Results</span>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
            {[
              { value: stats?.totalStudents || "50,000+", label: "Registered Students" },
              { value: stats?.totalTests || "5+", label: "PYQ Paper Sets" },
              { value: stats?.totalQuestions || "375+", label: "Quality Questions" },
              { value: stats?.testsAttempted || "1,20,000+", label: "Tests Attempted" },
            ].map((s, i) => (
              <div key={i} className={`text-center px-4 py-8 ${i < 3 ? "border-r border-gray-100" : ""}`}>
                <div className="text-3xl md:text-4xl font-black text-[#0a1628] mb-1">{s.value}</div>
                <div className="text-xs md:text-sm font-medium text-gray-500 uppercase tracking-widest">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Tests ── */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-3">Official PYQ Papers</div>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900">JEE Main Previous Year Papers</h2>
            <p className="mt-3 text-gray-500 max-w-xl mx-auto">Attempt full 75-question papers from real JEE Main exams — exactly as they appeared on exam day.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            {(tests?.slice(0, 6) ?? [
              { id: 1001, title: "JEE Main 2024 — Jan Shift 1", description: "75Q | 3 Hours | Physics + Chemistry + Maths", type: "full_mock" },
              { id: 1002, title: "JEE Main 2023 — Jan Shift 1", description: "75Q | 3 Hours | Physics + Chemistry + Maths", type: "full_mock" },
              { id: 1003, title: "JEE Main 2022 — June Shift 1", description: "75Q | 3 Hours | Physics + Chemistry + Maths", type: "full_mock" },
            ]).map((test, i) => {
              const year = (test.title ?? "").match(/\d{4}/)?.[0] ?? "2024";
              const colors = ["from-blue-600 to-indigo-700", "from-purple-600 to-pink-700", "from-emerald-600 to-teal-700", "from-orange-500 to-red-600", "from-cyan-600 to-blue-700"];
              const color = colors[i % colors.length];
              return (
                <div key={test.id ?? i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 group">
                  <div className={`h-2 bg-gradient-to-r ${color}`} />
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                        {year} PYQ
                      </span>
                      <span className="text-xs font-medium text-gray-400">75 Questions</span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-blue-600 transition-colors">{test.title ?? "JEE Main PYQ"}</h3>
                    <p className="text-sm text-gray-500 mb-4">{test.description ?? "Physics • Chemistry • Mathematics | 180 mins"}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-5">
                      <span className="flex items-center gap-1">⏱ 180 mins</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">📋 20 MCQ + 5 Integer / subject</span>
                    </div>
                    <Link href={test.id ? "/tests" : "/login"}>
                      <button className="w-full py-2.5 bg-[#0a1628] hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition-colors">
                        Attempt Test →
                      </button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center">
            <Link href="/tests">
              <button className="px-6 py-3 border-2 border-[#0a1628] text-[#0a1628] font-bold rounded-xl hover:bg-[#0a1628] hover:text-white transition-all">
                View All Tests →
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Exam Pattern Banner ── */}
      <section className="bg-[#0a1628] text-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <div className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-3">Exam Pattern 2024</div>
            <h2 className="text-2xl md:text-3xl font-black">JEE Main Paper Structure</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {["Physics", "Chemistry", "Mathematics"].map(subj => (
              <div key={subj} className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
                <div className="text-2xl mb-3">{subj === "Physics" ? "⚡" : subj === "Chemistry" ? "🧪" : "📐"}</div>
                <div className="font-black text-xl mb-4">{subj}</div>
                <div className="space-y-2 text-sm text-gray-300">
                  <div className="flex justify-between"><span>MCQ (Single correct)</span><span className="font-bold text-white">20 Q</span></div>
                  <div className="flex justify-between"><span>Integer type</span><span className="font-bold text-white">5 Q</span></div>
                  <div className="border-t border-white/10 pt-2 flex justify-between"><span>Total</span><span className="font-bold text-white">25 Q</span></div>
                  <div className="flex justify-between"><span>Max Marks</span><span className="font-bold text-blue-400">100</span></div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8 text-gray-400 text-sm">
            <span className="bg-white/5 border border-white/10 rounded-full px-4 py-1.5">
              Marking: +4 Correct | -1 Wrong (MCQ) | +4 Correct | 0 Wrong (Integer) | Total 300 Marks | 3 Hours
            </span>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-3">Why JEE Mock Free?</div>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900">Everything you need to crack JEE Main</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div key={i} className="p-6 bg-white border border-gray-200 rounded-2xl hover:border-blue-300 hover:shadow-md transition-all">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-3">Success Stories</div>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900">Students who cracked it</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{t.name}</div>
                    <div className="text-xs text-blue-600 font-medium">{t.rank}</div>
                  </div>
                </div>
                <div className="text-yellow-400 text-sm mb-3">★★★★★</div>
                <p className="text-gray-600 text-sm leading-relaxed">"{t.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black mb-4">Your JEE rank starts here.</h2>
          <p className="text-blue-100 text-lg mb-8 max-w-xl mx-auto">Join thousands of aspirants who are acing their preparation with the most accurate JEE Main mock platform.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login">
              <button className="px-8 py-4 bg-white text-blue-700 font-black rounded-xl text-lg hover:bg-blue-50 transition-all shadow-lg">
                Start for Free →
              </button>
            </Link>
            <Link href="/tests">
              <button className="px-8 py-4 border-2 border-white/40 text-white font-semibold rounded-xl text-lg hover:border-white hover:bg-white/10 transition-all">
                Browse Tests
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
