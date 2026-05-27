import { useGetLeaderboard } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Leaderboard() {
  const { data: leaderboard, isLoading } = useGetLeaderboard();

  if (isLoading) return <div className="p-8">Loading leaderboard...</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Global Leaderboard</h1>
        <p className="text-gray-500">Top performers across all mock tests.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-4">Rank</th>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4 text-right">Score</th>
                  <th className="px-6 py-4 text-right">Percentile</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard?.map((entry, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className={`font-bold flex items-center justify-center w-8 h-8 rounded-full ${
                        entry.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                        entry.rank === 2 ? 'bg-gray-200 text-gray-700' :
                        entry.rank === 3 ? 'bg-orange-100 text-orange-800' :
                        'text-gray-500'
                      }`}>
                        {entry.rank}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {entry.name || `User ${entry.userId.toString().padStart(4, '0')}`}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-primary">
                      {entry.score}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-500">
                      {entry.percentile.toFixed(2)}
                    </td>
                  </tr>
                ))}
                {(!leaderboard || leaderboard.length === 0) && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      No leaderboard data available yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
