import { useListTests, useStartSession } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

export default function Tests() {
  const { data: tests, isLoading } = useListTests();
  const startSessionMutation = useStartSession();
  const [, setLocation] = useLocation();

  const handleStartTest = (testId: number) => {
    startSessionMutation.mutate(
      { data: { testId } },
      {
        onSuccess: (session) => {
          setLocation(`/test/${session.id}`);
        }
      }
    );
  };

  if (isLoading) {
    return <div className="p-8">Loading tests...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Mock Test Catalog</h1>
        <p className="text-gray-500">Select a test to begin your practice session.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tests?.map((test) => (
          <Card key={test.id} className="flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-start mb-2">
                <Badge variant={test.type === "full" ? "default" : "secondary"}>
                  {test.type.toUpperCase()}
                </Badge>
                <div className="text-sm font-medium text-gray-500">{test.duration} mins</div>
              </div>
              <CardTitle>{test.title}</CardTitle>
              <CardDescription>{test.subject}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Questions: {test.totalQuestions}</span>
                <span>Max Marks: {test.maxMarks}</span>
              </div>
              <p className="text-sm text-gray-500 line-clamp-2">
                {test.description || "A standard JEE mock test."}
              </p>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={() => handleStartTest(test.id)}
                disabled={startSessionMutation.isPending}
              >
                {startSessionMutation.isPending ? "Starting..." : "Start Test"}
              </Button>
            </CardFooter>
          </Card>
        ))}
        {(!tests || tests.length === 0) && (
          <div className="col-span-full text-center py-12 text-gray-500">
            No tests available right now. Please check back later.
          </div>
        )}
      </div>
    </div>
  );
}
