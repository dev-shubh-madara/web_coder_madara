import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetAdminStats, useListTests, useGetTest, getListTestsQueryKey, getGetTestQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { createTest, deleteTest, createQuestion, deleteQuestion, type NewTestInput, type NewQuestionInput } from "@/lib/admin-api";

const emptyTest: NewTestInput = {
  title: "", subject: "", type: "full", duration: 180, maxMarks: 300, description: "", status: "published",
};

const emptyQuestion: NewQuestionInput = {
  testId: 0, subject: "", questionText: "", questionType: "mcq",
  optionA: "", optionB: "", optionC: "", optionD: "", correctOption: "A",
  marks: 4, negativeMarks: 1, solution: "",
};

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: stats, isLoading: statsLoading } = useGetAdminStats();
  const { data: tests, isLoading: testsLoading } = useListTests();

  const [createOpen, setCreateOpen] = useState(false);
  const [newTest, setNewTest] = useState<NewTestInput>(emptyTest);
  const [savingTest, setSavingTest] = useState(false);

  const [manageTestId, setManageTestId] = useState<number | null>(null);
  const [newQuestion, setNewQuestion] = useState<NewQuestionInput>(emptyQuestion);
  const [savingQuestion, setSavingQuestion] = useState(false);

  const { data: managedTest, isLoading: managedLoading } = useGetTest(manageTestId ?? 0, {
    query: { enabled: !!manageTestId, queryKey: getGetTestQueryKey(manageTestId ?? 0) },
  });

  const refreshTests = () => queryClient.invalidateQueries({ queryKey: getListTestsQueryKey() });
  const refreshManagedTest = () => {
    if (manageTestId) queryClient.invalidateQueries({ queryKey: getGetTestQueryKey(manageTestId) });
  };

  const handleCreateTest = async () => {
    if (!newTest.title.trim() || !newTest.duration || !newTest.maxMarks) {
      toast({ title: "Missing fields", description: "Title, duration and max marks are required.", variant: "destructive" });
      return;
    }
    setSavingTest(true);
    try {
      await createTest(newTest);
      toast({ title: "Test created" });
      setNewTest(emptyTest);
      setCreateOpen(false);
      refreshTests();
    } catch (err) {
      toast({ title: "Failed to create test", description: (err as Error).message, variant: "destructive" });
    } finally {
      setSavingTest(false);
    }
  };

  const handleDeleteTest = async (testId: number, title: string) => {
    if (!confirm(`Delete "${title}"? This removes all its questions too.`)) return;
    try {
      await deleteTest(testId);
      toast({ title: "Test deleted" });
      if (manageTestId === testId) setManageTestId(null);
      refreshTests();
    } catch (err) {
      toast({ title: "Failed to delete test", description: (err as Error).message, variant: "destructive" });
    }
  };

  const handleAddQuestion = async () => {
    if (!manageTestId) return;
    if (!newQuestion.questionText.trim()) {
      toast({ title: "Question text is required", variant: "destructive" });
      return;
    }
    setSavingQuestion(true);
    try {
      await createQuestion({ ...newQuestion, testId: manageTestId });
      toast({ title: "Question added" });
      setNewQuestion({ ...emptyQuestion, subject: newQuestion.subject });
      refreshManagedTest();
      refreshTests();
    } catch (err) {
      toast({ title: "Failed to add question", description: (err as Error).message, variant: "destructive" });
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleDeleteQuestion = async (questionId: number) => {
    if (!confirm("Delete this question?")) return;
    try {
      await deleteQuestion(questionId);
      toast({ title: "Question deleted" });
      refreshManagedTest();
      refreshTests();
    } catch (err) {
      toast({ title: "Failed to delete question", description: (err as Error).message, variant: "destructive" });
    }
  };

  if (statsLoading || testsLoading) return <div className="p-8">Loading admin...</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500">Manage platform resources.</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>Create New Test</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Test</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Title</Label>
                <Input value={newTest.title} onChange={(e) => setNewTest({ ...newTest, title: e.target.value })} placeholder="JEE Main Full Mock #4" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Type</Label>
                  <Select value={newTest.type} onValueChange={(v) => setNewTest({ ...newTest, type: v as NewTestInput["type"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Full JEE</SelectItem>
                      <SelectItem value="physics">Physics</SelectItem>
                      <SelectItem value="chemistry">Chemistry</SelectItem>
                      <SelectItem value="mathematics">Mathematics</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Status</Label>
                  <Select value={newTest.status} onValueChange={(v) => setNewTest({ ...newTest, status: v as NewTestInput["status"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Duration (minutes)</Label>
                  <Input type="number" value={newTest.duration} onChange={(e) => setNewTest({ ...newTest, duration: Number(e.target.value) })} />
                </div>
                <div className="space-y-1">
                  <Label>Max Marks</Label>
                  <Input type="number" value={newTest.maxMarks} onChange={(e) => setNewTest({ ...newTest, maxMarks: Number(e.target.value) })} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Subject (optional)</Label>
                <Input value={newTest.subject} onChange={(e) => setNewTest({ ...newTest, subject: e.target.value })} placeholder="e.g. Physics" />
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Textarea value={newTest.description} onChange={(e) => setNewTest({ ...newTest, description: e.target.value })} rows={3} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateTest} disabled={savingTest}>{savingTest ? "Creating..." : "Create Test"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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

      <Card className="mb-8">
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
                    <td className="px-6 py-4 text-right space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => setManageTestId(test.id)}>Manage Questions</Button>
                      <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDeleteTest(test.id, test.title)}>Delete</Button>
                    </td>
                  </tr>
                ))}
                {tests?.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">No tests yet. Create one above.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {manageTestId && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              Questions — {managedTest?.title ?? (managedLoading ? "Loading..." : "")}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setManageTestId(null)}>Close</Button>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
              <h3 className="font-semibold text-sm">Add Question</h3>
              <div className="space-y-1">
                <Label>Question Text</Label>
                <Textarea value={newQuestion.questionText} onChange={(e) => setNewQuestion({ ...newQuestion, questionText: e.target.value })} rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Subject</Label>
                  <Input value={newQuestion.subject} onChange={(e) => setNewQuestion({ ...newQuestion, subject: e.target.value })} placeholder="Physics" />
                </div>
                <div className="space-y-1">
                  <Label>Question Type</Label>
                  <Select value={newQuestion.questionType} onValueChange={(v) => setNewQuestion({ ...newQuestion, questionType: v as NewQuestionInput["questionType"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mcq">MCQ</SelectItem>
                      <SelectItem value="numerical">Numerical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {newQuestion.questionType === "mcq" ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="Option A" value={newQuestion.optionA} onChange={(e) => setNewQuestion({ ...newQuestion, optionA: e.target.value })} />
                    <Input placeholder="Option B" value={newQuestion.optionB} onChange={(e) => setNewQuestion({ ...newQuestion, optionB: e.target.value })} />
                    <Input placeholder="Option C" value={newQuestion.optionC} onChange={(e) => setNewQuestion({ ...newQuestion, optionC: e.target.value })} />
                    <Input placeholder="Option D" value={newQuestion.optionD} onChange={(e) => setNewQuestion({ ...newQuestion, optionD: e.target.value })} />
                  </div>
                  <div className="space-y-1 max-w-[160px]">
                    <Label>Correct Option</Label>
                    <Select value={newQuestion.correctOption} onValueChange={(v) => setNewQuestion({ ...newQuestion, correctOption: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">A</SelectItem>
                        <SelectItem value="B">B</SelectItem>
                        <SelectItem value="C">C</SelectItem>
                        <SelectItem value="D">D</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <div className="space-y-1 max-w-[220px]">
                  <Label>Correct Numerical Answer</Label>
                  <Input type="number" value={newQuestion.correctNumerical ?? ""} onChange={(e) => setNewQuestion({ ...newQuestion, correctNumerical: Number(e.target.value) })} />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Marks</Label>
                  <Input type="number" value={newQuestion.marks} onChange={(e) => setNewQuestion({ ...newQuestion, marks: Number(e.target.value) })} />
                </div>
                <div className="space-y-1">
                  <Label>Negative Marks</Label>
                  <Input type="number" value={newQuestion.negativeMarks} onChange={(e) => setNewQuestion({ ...newQuestion, negativeMarks: Number(e.target.value) })} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Solution (optional)</Label>
                <Textarea value={newQuestion.solution} onChange={(e) => setNewQuestion({ ...newQuestion, solution: e.target.value })} rows={2} />
              </div>
              <Button onClick={handleAddQuestion} disabled={savingQuestion}>{savingQuestion ? "Adding..." : "Add Question"}</Button>
            </div>

            <div className="space-y-2">
              {managedLoading && <p className="text-gray-400 text-sm">Loading questions...</p>}
              {managedTest?.questions?.map((q, i) => (
                <div key={q.id} className="flex justify-between items-start border rounded-lg p-3">
                  <div>
                    <p className="text-sm font-medium">{i + 1}. {q.questionText}</p>
                    <p className="text-xs text-gray-500">{q.subject} · {q.questionType} · {q.marks} marks</p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDeleteQuestion(q.id)}>Delete</Button>
                </div>
              ))}
              {managedTest && managedTest.questions?.length === 0 && (
                <p className="text-gray-400 text-sm">No questions yet — add one above.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
