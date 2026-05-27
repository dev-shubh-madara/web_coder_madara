import { useGetResult } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Result() {
  const { sessionId } = useParams();
  const id = Number(sessionId);
  const { data: result, isLoading } = useGetResult(id, { query: { enabled: !!id } });

  if (isLoading) return <div className="p-8">Loading result...</div>;
  if (!result) return <div className="p-8">Result not found.</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Scorecard: {result.testTitle}</h1>
          <p className="text-gray-500">Detailed analysis of your performance.</p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-primary text-white border-none">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium opacity-90 uppercase">Total Score</CardTitle></CardHeader>
          <CardContent><div className="text-4xl font-bold">{result.totalScore} <span className="text-xl font-normal opacity-80">/ {result.maxMarks}</span></div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500 uppercase">Percentile</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-gray-900">{result.percentile.toFixed(2)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500 uppercase">Est. Rank</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-gray-900">#{result.rank}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500 uppercase">Accuracy</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-gray-900">{result.accuracy}%</div></CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader><CardTitle>Subject-wise Analysis</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">Subject</th>
                  <th className="px-6 py-3">Score</th>
                  <th className="px-6 py-3 text-green-600">Correct</th>
                  <th className="px-6 py-3 text-red-600">Incorrect</th>
                  <th className="px-6 py-3 text-gray-400">Skipped</th>
                  <th className="px-6 py-3">Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {result.subjectResults.map((sub, i) => (
                  <tr key={i} className="border-b">
                    <td className="px-6 py-4 font-medium capitalize">{sub.subject}</td>
                    <td className="px-6 py-4 font-bold">{sub.score}/{sub.maxScore}</td>
                    <td className="px-6 py-4 text-green-600">{sub.correct}</td>
                    <td className="px-6 py-4 text-red-600">{sub.incorrect}</td>
                    <td className="px-6 py-4 text-gray-500">{sub.unattempted}</td>
                    <td className="px-6 py-4">{sub.accuracy}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center mt-8">
        <Link href="/tests">
          <Button size="lg">Take Another Test</Button>
        </Link>
      </div>
    </div>
  );
}
