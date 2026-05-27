import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { useGetSession, useSaveAnswers, useSubmitSession } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function Exam() {
  const { sessionId } = useParams();
  const [, setLocation] = useLocation();
  const id = Number(sessionId);
  
  const { data: session, isLoading } = useGetSession(id, { query: { enabled: !!id } });
  const saveAnswersMutation = useSaveAnswers();
  const submitSessionMutation = useSubmitSession();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const exitWarningCount = useRef(0);

  // Initialize state when session loads
  useEffect(() => {
    if (session) {
      if (session.status !== "active") {
        setLocation(`/result/${session.id}`);
        return;
      }
      setTimeLeft(session.timeLimit);
      
      const initialAnswers: Record<number, any> = {};
      session.answers.forEach(a => {
        initialAnswers[a.questionId] = {
          selectedOption: a.selectedOption,
          numericalAnswer: a.numericalAnswer,
          status: a.status,
          markedForReview: a.markedForReview
        };
      });
      // Initialize unvisited questions
      session.questions.forEach(q => {
        if (!initialAnswers[q.id]) {
          initialAnswers[q.id] = {
            selectedOption: null,
            numericalAnswer: null,
            status: "unattempted", // Actually not-visited isn't an enum value, using unattempted
            markedForReview: false
          };
        }
      });
      setAnswers(initialAnswers);
    }
  }, [session, setLocation]);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Auto-save
  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => {
      handleSave();
    }, 30000);
    return () => clearInterval(interval);
  }, [answers, session]);

  const handleSave = () => {
    if (!session) return;
    const dataToSave = Object.keys(answers).map(qId => ({
      questionId: Number(qId),
      selectedOption: answers[Number(qId)].selectedOption,
      numericalAnswer: answers[Number(qId)].numericalAnswer,
      status: answers[Number(qId)].status,
      markedForReview: answers[Number(qId)].markedForReview
    }));
    saveAnswersMutation.mutate({ data: { answers: dataToSave } });
  };

  const handleSubmit = () => {
    handleSave();
    submitSessionMutation.mutate(
      { data: { sessionId: id } },
      {
        onSuccess: () => {
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(console.error);
          }
          setLocation(`/result/${id}`);
        }
      }
    );
  };

  const currentQuestion = session?.questions[currentIndex];

  const updateCurrentAnswer = (updates: any) => {
    if (!currentQuestion) return;
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        ...updates
      }
    }));
  };

  const handleSaveAndNext = () => {
    if (!currentQuestion) return;
    const currentAns = answers[currentQuestion.id];
    let newStatus = "unattempted";
    if (currentAns.selectedOption || currentAns.numericalAnswer !== null) {
      newStatus = "attempted";
    }
    updateCurrentAnswer({ status: newStatus, markedForReview: false });
    
    if (currentIndex < (session?.questions.length || 0) - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleMarkForReviewAndNext = () => {
    if (!currentQuestion) return;
    const currentAns = answers[currentQuestion.id];
    let newStatus = "marked_for_review";
    if (currentAns.selectedOption || currentAns.numericalAnswer !== null) {
      newStatus = "attempted_marked";
    }
    updateCurrentAnswer({ status: newStatus, markedForReview: true });
    
    if (currentIndex < (session?.questions.length || 0) - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleClearResponse = () => {
    updateCurrentAnswer({
      selectedOption: null,
      numericalAnswer: null,
      status: "unattempted",
      markedForReview: false
    });
  };

  if (isLoading || !session || !currentQuestion) {
    return <div className="h-screen flex justify-center items-center">Loading Exam...</div>;
  }

  return (
    <div className="h-screen w-full flex flex-col bg-white overflow-hidden text-sm">
      {/* Header */}
      <header className="h-14 border-b flex flex-none items-center justify-between px-6 bg-[#00478F] text-white">
        <h1 className="font-bold text-lg">JEE Main CBT Interface</h1>
        <div className="flex items-center gap-6">
          <div className="text-xl font-mono tabular-nums bg-black/20 px-3 py-1 rounded">
            Time Left: {formatTime(timeLeft)}
          </div>
          <Button variant="destructive" size="sm" onClick={handleSubmit}>Submit Test</Button>
        </div>
      </header>
      
      <div className="flex-1 flex overflow-hidden">
        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden border-r">
          <div className="p-2 border-b bg-gray-50 flex items-center justify-between">
            <div className="flex gap-2">
              <span className="font-semibold text-gray-700">Subject:</span>
              <span className="capitalize">{currentQuestion.subject}</span>
            </div>
            <div className="flex gap-4 font-semibold">
              <span className="text-green-600">+{currentQuestion.marks}</span>
              <span className="text-red-600">-{currentQuestion.negativeMarks}</span>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto p-6">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-lg font-bold">Question {currentIndex + 1}</h2>
            </div>
            
            <div className="prose max-w-none mb-8 text-base">
              {currentQuestion.questionText}
            </div>

            {currentQuestion.questionType === "mcq" ? (
              <RadioGroup 
                value={answers[currentQuestion.id]?.selectedOption || ""}
                onValueChange={(val) => updateCurrentAnswer({ selectedOption: val })}
                className="space-y-4"
              >
                {['A', 'B', 'C', 'D'].map((opt) => {
                  const val = currentQuestion[`option${opt}` as keyof typeof currentQuestion];
                  if (!val) return null;
                  return (
                    <div key={opt} className="flex items-start space-x-3 p-3 border rounded hover:bg-gray-50">
                      <RadioGroupItem value={opt} id={`opt-${opt}`} className="mt-1" />
                      <Label htmlFor={`opt-${opt}`} className="flex-1 text-base cursor-pointer">
                        <span className="font-bold mr-2">{opt})</span> {val as string}
                      </Label>
                    </div>
                  )
                })}
              </RadioGroup>
            ) : (
              <div className="max-w-xs">
                <Label className="mb-2 block">Enter numerical value:</Label>
                <Input 
                  type="number" 
                  step="any"
                  value={answers[currentQuestion.id]?.numericalAnswer || ""}
                  onChange={(e) => updateCurrentAnswer({ numericalAnswer: e.target.value ? Number(e.target.value) : null })}
                  className="text-lg py-6"
                />
              </div>
            )}
          </div>

          <div className="flex-none p-4 border-t bg-gray-50 flex justify-between items-center">
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleMarkForReviewAndNext}>Mark for Review & Next</Button>
              <Button variant="outline" onClick={handleClearResponse}>Clear Response</Button>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="secondary" 
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
              >
                &lt; Previous
              </Button>
              <Button variant="default" className="bg-[#1A8D44] hover:bg-[#157136]" onClick={handleSaveAndNext}>
                Save & Next &gt;
              </Button>
            </div>
          </div>
        </main>

        {/* Right Sidebar - Palette */}
        <aside className="w-80 flex-none flex flex-col bg-white">
          <div className="p-4 border-b">
            <h3 className="font-bold mb-4">Question Palette</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2"><div className="w-6 h-6 border rounded flex items-center justify-center bg-gray-100"></div>Not Visited</div>
              <div className="flex items-center gap-2"><div className="w-6 h-6 border rounded flex items-center justify-center bg-red-100 text-red-700"></div>Not Answered</div>
              <div className="flex items-center gap-2"><div className="w-6 h-6 border rounded flex items-center justify-center bg-green-100 text-green-700"></div>Answered</div>
              <div className="flex items-center gap-2"><div className="w-6 h-6 border rounded flex items-center justify-center bg-purple-100 text-purple-700"></div>Marked</div>
              <div className="flex items-center gap-2 col-span-2"><div className="w-6 h-6 border rounded flex items-center justify-center bg-purple-100 text-purple-700 relative"><span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full"></span></div>Answered & Marked</div>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto p-4">
            <div className="grid grid-cols-4 gap-2">
              {session.questions.map((q, idx) => {
                const ans = answers[q.id];
                let bgClass = "bg-gray-100 text-gray-500";
                
                if (ans?.status === "attempted") bgClass = "bg-green-100 text-green-800 border-green-300";
                else if (ans?.status === "unattempted" && currentIndex > idx) bgClass = "bg-red-100 text-red-800 border-red-300";
                else if (ans?.status === "marked_for_review") bgClass = "bg-purple-100 text-purple-800 border-purple-300";
                else if (ans?.status === "attempted_marked") bgClass = "bg-purple-100 text-purple-800 border-purple-300 relative";
                
                if (currentIndex === idx && ans?.status === "unattempted") bgClass = "bg-red-100 text-red-800 border-red-500 border-2";
                
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-full aspect-square flex items-center justify-center rounded border font-semibold text-sm ${bgClass}`}
                  >
                    {idx + 1}
                    {ans?.status === "attempted_marked" && <span className="absolute bottom-0.5 right-0.5 w-2 h-2 bg-green-500 rounded-full"></span>}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>
      </div>

      <Dialog open={showExitWarning} onOpenChange={setShowExitWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Warning: Fullscreen Exited</DialogTitle>
          </DialogHeader>
          <p>Please return to fullscreen to continue the exam. Exiting again will automatically submit your test.</p>
          <Button onClick={() => setShowExitWarning(false)}>Continue Exam</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
