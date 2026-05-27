import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  if (location.startsWith("/test/")) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
              <span className="text-white font-bold">J</span>
            </div>
            <span className="text-xl font-bold tracking-tight">JEE Mock</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/tests">
              <span className={`text-sm font-medium transition-colors hover:text-primary ${location === "/tests" ? "text-primary" : "text-muted-foreground"}`}>
                Tests
              </span>
            </Link>
            <Link href="/leaderboard">
              <span className={`text-sm font-medium transition-colors hover:text-primary ${location === "/leaderboard" ? "text-primary" : "text-muted-foreground"}`}>
                Leaderboard
              </span>
            </Link>
            {user && (
              <Link href="/insights">
                <span className={`text-sm font-medium transition-colors hover:text-primary ${location === "/insights" ? "text-primary" : "text-muted-foreground"}`}>
                  AI Insights
                </span>
              </Link>
            )}
            {user?.role === "admin" && (
              <Link href="/admin">
                <span className={`text-sm font-medium transition-colors hover:text-primary ${location === "/admin" ? "text-primary" : "text-muted-foreground"}`}>
                  Admin
                </span>
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link href="/dashboard">
                  <Button variant={location === "/dashboard" ? "secondary" : "ghost"}>Dashboard</Button>
                </Link>
                <Button variant="outline" onClick={() => logout()}>Logout</Button>
              </>
            ) : (
              <Link href="/login">
                <Button>Login</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 bg-gray-50/50">
        {children}
      </main>

      <footer className="border-t bg-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
            <span>Developed by <span className="font-semibold text-foreground">GMS</span></span>
            <span className="text-xs text-gray-400">JEE Mock Free — Not affiliated with NTA</span>
            <span>Made with <span className="text-red-500">♥</span> by <span className="font-semibold text-foreground">Shubh</span></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
