import { useGetAdminStats, useListTests } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Admin() {
  const { data: stats, isLoading: statsLoading } = useGetAdminStats();
  const { data: tests, isLoading: testsLoading } = useListTests();

  if (statsLoading || testsLoading) return <div className="p-8">Loading admin...</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500">Manage platform resources.</p>
        </div>
        <Button>Create New Test</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500 uppercase">Total Users</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-gray-900">{stats?.totalUsers || 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500 uppercase">Total Tests</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-gray-900">{stats?.totalTests || 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500 uppercase">Total Sessions</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-gray-900">{stats?.totalSessions || 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500 uppercase">Avg Score</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-gray-900">{stats?.avgScore.toFixed(1) || 0}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Tests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">ID</th>
                  <th className="px-6 py-3">Title</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Questions</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tests?.map((test) => (
                  <tr key={test.id} className="border-b">
                    <td className="px-6 py-4">{test.id}</td>
                    <td className="px-6 py-4 font-medium">{test.title}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs ${test.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {test.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">{test.totalQuestions}</td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm">Edit</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
