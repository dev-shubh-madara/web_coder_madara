import { useGetPlatformStats } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, BookOpen, Clock, Target, Trophy, Users } from "lucide-react";

export default function Home() {
  const { data: stats } = useGetPlatformStats();

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden bg-primary text-white">
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
            Prepare for JEE Main with Precision
          </h1>
          <p className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto text-primary-foreground/90">
            The premier free mock test platform simulating the actual CBT interface. Train your mind to focus and score higher.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto font-semibold text-primary">
                Start Free Mock Test <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/tests">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-white/10">
                View Test Catalog
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50 border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-gray-900 mb-2">{stats?.totalStudents || "50k+"}</div>
              <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Aspirants</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-gray-900 mb-2">{stats?.totalTests || "100+"}</div>
              <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Mock Tests</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-gray-900 mb-2">{stats?.totalQuestions || "10k+"}</div>
              <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Questions</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-gray-900 mb-2">{stats?.testsAttempted || "1M+"}</div>
              <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Attempts</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Why Choose JEE Mock Free?</h2>
            <p className="mt-4 text-lg text-gray-600">Built exactly like the official NTA portal to give you the real exam feel.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-100 text-primary rounded-full flex items-center justify-center mb-6">
                <Target className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">Exact Exam Interface</h3>
              <p className="text-gray-600">Experience the exact CBT interface of JEE Main with our identical question palette and navigation.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-100 text-primary rounded-full flex items-center justify-center mb-6">
                <Clock className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">Time Management</h3>
              <p className="text-gray-600">Track your time per subject and learn to manage the 3-hour duration effectively.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-100 text-primary rounded-full flex items-center justify-center mb-6">
                <Trophy className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">All India Rank</h3>
              <p className="text-gray-600">Get your estimated percentile and AIR based on thousands of real test takers.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gray-900 text-white text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to ace your exam?</h2>
          <p className="text-xl text-gray-300 mb-10">Join thousands of students preparing for their dream NITs and IITs.</p>
          <Link href="/login">
            <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100">
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
