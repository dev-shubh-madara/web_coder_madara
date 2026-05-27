import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  if (location.startsWith("/test/")) {
    return <>{children}</>;
  }

  const navLinks = [
    { href: "/tests", label: "Test Series" },
    { href: "/leaderboard", label: "Leaderboard" },
    ...(user ? [{ href: "/insights", label: "AI Insights" }] : []),
    ...(user?.role === "admin" ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <header className="bg-[#0a1628] text-white sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="h-16 flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 flex-none">
              <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white font-black text-lg">J</span>
              </div>
              <div className="leading-none">
                <div className="font-black text-white text-lg tracking-tight">JEE Mock</div>
                <div className="text-blue-400 text-[10px] font-semibold uppercase tracking-widest">Free Test Series</div>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(({ href, label }) => (
                <Link key={href} href={href}>
                  <span className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                    location === href
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:text-white hover:bg-white/10"
                  }`}>
                    {label}
                  </span>
                </Link>
              ))}
            </nav>

            {/* Auth buttons */}
            <div className="hidden md:flex items-center gap-2">
              {user ? (
                <>
                  <Link href="/dashboard">
                    <span className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                      location === "/dashboard" ? "bg-blue-600 text-white" : "text-gray-300 hover:text-white hover:bg-white/10"
                    }`}>
                      <span className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs font-black">
                        {user.name?.[0]?.toUpperCase() ?? "U"}
                      </span>
                      {user.name?.split(" ")[0] ?? "Dashboard"}
                    </span>
                  </Link>
                  <button
                    onClick={() => logout()}
                    className="px-4 py-2 border border-white/20 text-gray-300 hover:text-white hover:border-white/40 rounded-lg text-sm font-semibold transition-all"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <span className="px-4 py-2 text-gray-300 hover:text-white text-sm font-semibold transition-all cursor-pointer">
                      Login
                    </span>
                  </Link>
                  <Link href="/login">
                    <span className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-lg transition-all cursor-pointer shadow-md shadow-blue-600/30">
                      Start Free →
                    </span>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <div className="w-5 h-0.5 bg-white mb-1 transition-all" style={{ transform: menuOpen ? "rotate(45deg) translateY(6px)" : "none" }} />
              <div className="w-5 h-0.5 bg-white mb-1 transition-all" style={{ opacity: menuOpen ? 0 : 1 }} />
              <div className="w-5 h-0.5 bg-white transition-all" style={{ transform: menuOpen ? "rotate(-45deg) translateY(-6px)" : "none" }} />
            </button>
          </div>

          {/* Mobile menu */}
          {menuOpen && (
            <div className="md:hidden border-t border-white/10 py-3 space-y-1">
              {navLinks.map(({ href, label }) => (
                <Link key={href} href={href}>
                  <span
                    className={`block px-4 py-2.5 rounded-lg text-sm font-semibold cursor-pointer ${
                      location === href ? "bg-blue-600 text-white" : "text-gray-300 hover:text-white hover:bg-white/10"
                    }`}
                    onClick={() => setMenuOpen(false)}
                  >
                    {label}
                  </span>
                </Link>
              ))}
              {user ? (
                <>
                  <Link href="/dashboard"><span className="block px-4 py-2.5 text-gray-300 text-sm font-semibold cursor-pointer" onClick={() => setMenuOpen(false)}>Dashboard</span></Link>
                  <button onClick={() => { logout(); setMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-red-400 text-sm font-semibold">Logout</button>
                </>
              ) : (
                <Link href="/login"><span className="block px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold text-center cursor-pointer" onClick={() => setMenuOpen(false)}>Login / Register</span></Link>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-[#0a1628] text-white pt-12 pb-6">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-black">J</span>
                </div>
                <span className="font-black text-lg">JEE Mock Free</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">India's most accurate free JEE Main CBT simulator. Practice with 10 years of PYQs and AI-powered analysis.</p>
            </div>
            <div>
              <div className="font-bold text-white mb-4 text-sm uppercase tracking-widest">Quick Links</div>
              <div className="space-y-2">
                {[["Tests", "/tests"], ["Leaderboard", "/leaderboard"], ["Dashboard", "/dashboard"]].map(([label, href]) => (
                  <Link key={href} href={href}>
                    <div className="text-gray-400 hover:text-white text-sm transition-colors cursor-pointer">{label}</div>
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <div className="font-bold text-white mb-4 text-sm uppercase tracking-widest">Test Series</div>
              <div className="space-y-2 text-sm text-gray-400">
                <div>JEE Main 2024 PYQ</div>
                <div>JEE Main 2023 PYQ</div>
                <div>JEE Main 2022 PYQ</div>
                <div>JEE Main 2021 PYQ</div>
                <div>JEE Main 2020 PYQ</div>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-gray-500">
            <span>Developed by <span className="text-white font-semibold">GMS</span></span>
            <span className="text-xs">Not affiliated with NTA or any official body.</span>
            <span>Made with <span className="text-red-400">♥</span> by <span className="text-white font-semibold">Shubh</span></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
