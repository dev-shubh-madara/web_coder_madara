import { useGetDashboardStats, useGetAttempts, useGetPerformanceTrend } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: attempts, isLoading: attemptsLoading } = useGetAttempts();
  const { data: trend, isLoading: trendLoading } = useGetPerformanceTrend();

  if (statsLoading || attemptsLoading || trendLoading) {
    return <div className="p-8">Loading dashboard...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Student Dashboard</h1>
          <p className="text-gray-500">Track your progress and performance across mock tests.</p>
        </div>
        <Link href="/tests">
          <Button>Take a New Test</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase">Avg Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats?.avgScore.toFixed(1) || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase">Best Percentile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats?.bestPercentile.toFixed(2) || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase">Global Rank</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">#{stats?.rank || "-"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase">Total Attempts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats?.totalAttempts || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Performance Trend</CardTitle>
              <CardDescription>Your mock test scores over time</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {trend?.overall && trend.overall.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend.overall} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(val) => format(new Date(val), "MMM d")}
                      stroke="#9ca3af"
                      fontSize={12}
                    />
                    <YAxis stroke="#9ca3af" fontSize={12} />
                    <Tooltip 
                      labelFormatter={(val) => format(new Date(val), "MMM d, yyyy")}
                    />
                    <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  Not enough data to display trend
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>Recent Attempts</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              {attempts && attempts.length > 0 ? (
                <div className="space-y-4">
                  {attempts.map((attempt) => (
                    <Link key={attempt.id} href={`/result/${attempt.id}`}>
                      <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer mb-2">
                        <div>
                          <div className="font-semibold text-gray-900">{attempt.testTitle}</div>
                          <div className="text-xs text-gray-500">{format(new Date(attempt.date), "MMM d, yyyy")}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-primary">{attempt.score}/{attempt.maxMarks}</div>
                          <div className="text-xs text-gray-500">{attempt.percentile.toFixed(1)} %ile</div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No tests attempted yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
