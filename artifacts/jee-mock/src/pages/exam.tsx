import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { useGetSession, useSaveAnswers, useSubmitSession } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

type QuestionStatus = "not_visited" | "not_answered" | "answered" | "marked" | "answered_marked";

interface AnswerState {
  selectedOption: string | null;
  numericalAnswer: number | null;
  status: QuestionStatus;
  markedForReview: boolean;
}

const SUBJECTS = ["physics", "chemistry", "mathematics"] as const;
type Subject = typeof SUBJECTS[number];

export default function Exam() {
  const { sessionId } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const id = Number(sessionId);

  const { data: session, isLoading } = useGetSession(id, { query: { enabled: !!id } });
  const saveAnswersMutation = useSaveAnswers();
  const submitSessionMutation = useSubmitSession();

  const [currentSubject, setCurrentSubject] = useState<Subject>("physics");
  const [currentIndexInSubject, setCurrentIndexInSubject] = useState(0);
  const [answers, setAnswers] = useState<Record<number, AnswerState>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [numericalInput, setNumericalInput] = useState("");
  const exitWarningCount = useRef(0);
  const hasSubmitted = useRef(false);

  const questionsBySubject = useCallback(() => {
    if (!session) return { physics: [], chemistry: [], mathematics: [] };
    const map: Record<string, typeof session.questions> = { physics: [], chemistry: [], mathematics: [] };
    session.questions.forEach(q => {
      const s = q.subject.toLowerCase();
      if (map[s]) map[s].push(q);
    });
    return map as Record<Subject, typeof session.questions>;
  }, [session]);

  const currentSubjectQuestions = questionsBySubject()[currentSubject] ?? [];
  const currentQuestion = currentSubjectQuestions[currentIndexInSubject];

  useEffect(() => {
    if (session) {
      if (session.status !== "active") {
        setLocation(`/result/${session.id}`);
        return;
      }
      setTimeLeft(session.timeLimit);
      const initialAnswers: Record<number, AnswerState> = {};
      session.answers.forEach(a => {
        initialAnswers[a.questionId] = {
          selectedOption: a.selectedOption ?? null,
          numericalAnswer: a.numericalAnswer ?? null,
          status: (a.status as QuestionStatus) ?? "not_visited",
          markedForReview: a.markedForReview ?? false,
        };
      });
      session.questions.forEach(q => {
        if (!initialAnswers[q.id]) {
          initialAnswers[q.id] = { selectedOption: null, numericalAnswer: null, status: "not_visited", markedForReview: false };
        }
      });
      setAnswers(initialAnswers);
    }
  }, [session, setLocation]);

  useEffect(() => {
    if (currentQuestion) {
      const ans = answers[currentQuestion.id];
      setNumericalInput(ans?.numericalAnswer?.toString() ?? "");
    }
  }, [currentQuestion?.id]);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { doSubmit(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft > 0]);

  // Auto-save every 30s
  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => doSave(answers), 30000);
    return () => clearInterval(interval);
  }, [answers, session]);

  // Fullscreen enforcement
  useEffect(() => {
    const handler = () => {
      if (!document.fullscreenElement) {
        exitWarningCount.current += 1;
        if (exitWarningCount.current === 1) setShowExitWarning(true);
        else doSubmit();
      }
    };
    document.addEventListener("fullscreenechange", handler);
    document.addEventListener("fullscreenchange", handler);
    return () => {
      document.removeEventListener("fullscreenechange", handler);
      document.removeEventListener("fullscreenchange", handler);
    };
  }, []);

  const doSave = (ans: Record<number, AnswerState>) => {
    if (!session) return;
    saveAnswersMutation.mutate({
      data: {
        answers: Object.keys(ans).map(qId => ({
          questionId: Number(qId),
          selectedOption: ans[Number(qId)].selectedOption,
          numericalAnswer: ans[Number(qId)].numericalAnswer,
          status: ans[Number(qId)].status,
          markedForReview: ans[Number(qId)].markedForReview,
        }))
      }
    });
  };

  const doSubmit = () => {
    if (hasSubmitted.current) return;
    hasSubmitted.current = true;
    doSave(answers);
    submitSessionMutation.mutate(
      { data: { sessionId: id } },
      {
        onSuccess: () => {
          if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
          setLocation(`/result/${id}`);
        }
      }
    );
  };

  const updateCurrentAnswer = (updates: Partial<AnswerState>) => {
    if (!currentQuestion) return;
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: { ...prev[currentQuestion.id], ...updates }
    }));
  };

  const handleSaveAndNext = () => {
    if (!currentQuestion) return;
    const cur = answers[currentQuestion.id] ?? {};
    const hasAnswer = cur.selectedOption || (numericalInput !== "" && numericalInput !== null);
    if (currentQuestion.questionType === "numerical") {
      updateCurrentAnswer({ numericalAnswer: numericalInput !== "" ? Number(numericalInput) : null, status: hasAnswer ? "answered" : "not_answered" });
    } else {
      updateCurrentAnswer({ status: cur.selectedOption ? "answered" : "not_answered" });
    }
    goNext();
  };

  const handleMarkForReview = () => {
    if (!currentQuestion) return;
    const cur = answers[currentQuestion.id] ?? {};
    const hasAnswer = cur.selectedOption || numericalInput !== "";
    if (currentQuestion.questionType === "numerical") {
      updateCurrentAnswer({ numericalAnswer: numericalInput !== "" ? Number(numericalInput) : null, status: hasAnswer ? "answered_marked" : "marked", markedForReview: true });
    } else {
      updateCurrentAnswer({ status: cur.selectedOption ? "answered_marked" : "marked", markedForReview: true });
    }
    goNext();
  };

  const handleSaveMarkReview = () => {
    if (!currentQuestion) return;
    const cur = answers[currentQuestion.id] ?? {};
    const hasAnswer = cur.selectedOption || numericalInput !== "";
    if (currentQuestion.questionType === "numerical") {
      updateCurrentAnswer({ numericalAnswer: numericalInput !== "" ? Number(numericalInput) : null, status: hasAnswer ? "answered_marked" : "marked", markedForReview: true });
    } else {
      updateCurrentAnswer({ status: cur.selectedOption ? "answered_marked" : "marked", markedForReview: true });
    }
  };

  const handleClear = () => {
    setNumericalInput("");
    updateCurrentAnswer({ selectedOption: null, numericalAnswer: null, status: "not_answered" });
  };

  const goNext = () => {
    if (currentIndexInSubject < currentSubjectQuestions.length - 1) {
      setCurrentIndexInSubject(prev => prev + 1);
      markVisited(currentSubjectQuestions[currentIndexInSubject + 1]?.id);
    } else {
      const nextSubjectIdx = SUBJECTS.indexOf(currentSubject) + 1;
      if (nextSubjectIdx < SUBJECTS.length) {
        setCurrentSubject(SUBJECTS[nextSubjectIdx]);
        setCurrentIndexInSubject(0);
        markVisited(questionsBySubject()[SUBJECTS[nextSubjectIdx]]?.[0]?.id);
      }
    }
  };

  const goPrev = () => {
    if (currentIndexInSubject > 0) {
      setCurrentIndexInSubject(prev => prev - 1);
    } else {
      const prevSubjectIdx = SUBJECTS.indexOf(currentSubject) - 1;
      if (prevSubjectIdx >= 0) {
        const prevSubj = SUBJECTS[prevSubjectIdx];
        setCurrentSubject(prevSubj);
        const qs = questionsBySubject()[prevSubj];
        setCurrentIndexInSubject(qs.length - 1);
      }
    }
  };

  const markVisited = (qId?: number) => {
    if (!qId) return;
    setAnswers(prev => {
      if (!prev[qId] || prev[qId].status === "not_visited") {
        return { ...prev, [qId]: { ...(prev[qId] ?? {}), selectedOption: null, numericalAnswer: null, status: "not_answered", markedForReview: false } };
      }
      return prev;
    });
  };

  const switchToQuestion = (subj: Subject, idx: number, qId: number) => {
    setCurrentSubject(subj);
    setCurrentIndexInSubject(idx);
    setAnswers(prev => {
      if (!prev[qId] || prev[qId].status === "not_visited") {
        return { ...prev, [qId]: { ...(prev[qId] ?? {}), selectedOption: null, numericalAnswer: null, status: "not_answered", markedForReview: false } };
      }
      return prev;
    });
  };

  const paletteColor = (status: QuestionStatus, isCurrent: boolean) => {
    if (isCurrent) return "bg-[#0055aa] text-white border-[#0055aa] border-2";
    switch (status) {
      case "not_visited": return "bg-white text-gray-600 border-gray-300";
      case "not_answered": return "bg-red-600 text-white border-red-600";
      case "answered": return "bg-green-600 text-white border-green-600";
      case "marked": return "bg-purple-700 text-white border-purple-700";
      case "answered_marked": return "bg-purple-700 text-white border-purple-700 ring-2 ring-green-400";
      default: return "bg-white text-gray-600 border-gray-300";
    }
  };

  const countByStatus = (subj: Subject, status: QuestionStatus) =>
    (questionsBySubject()[subj] ?? []).filter(q => answers[q.id]?.status === status).length;

  const globalCounts = {
    answered: SUBJECTS.reduce((acc, s) => acc + countByStatus(s, "answered") + countByStatus(s, "answered_marked"), 0),
    notAnswered: SUBJECTS.reduce((acc, s) => acc + countByStatus(s, "not_answered"), 0),
    notVisited: SUBJECTS.reduce((acc, s) => acc + countByStatus(s, "not_visited"), 0),
    marked: SUBJECTS.reduce((acc, s) => acc + countByStatus(s, "marked"), 0),
    answeredMarked: SUBJECTS.reduce((acc, s) => acc + countByStatus(s, "answered_marked"), 0),
  };

  const subjectLabel = (s: Subject) => s.charAt(0).toUpperCase() + s.slice(1);
  const qsBySubj = questionsBySubject();

  if (isLoading || !session || !currentQuestion) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-100 gap-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-600 font-medium">Loading Exam...</p>
      </div>
    );
  }

  const curAns = answers[currentQuestion.id] ?? { selectedOption: null, numericalAnswer: null, status: "not_answered", markedForReview: false };
  const timePercent = session.timeLimit > 0 ? (timeLeft / session.timeLimit) * 100 : 0;
  const timeColor = timePercent > 50 ? "#1e8d44" : timePercent > 20 ? "#f59e0b" : "#dc2626";

  return (
    <div className="h-screen w-full flex flex-col bg-[#f5f5f5] overflow-hidden select-none" style={{ fontSize: 13 }}>

      {/* Top Header */}
      <div className="flex-none bg-white border-b border-gray-300 shadow-sm">
        <div className="flex items-center justify-between px-3 py-2">
          {/* Left: candidate info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden border border-gray-400">
              <span className="text-gray-700 font-bold text-sm">{user?.name?.[0]?.toUpperCase() ?? "U"}</span>
            </div>
            <div className="leading-tight">
              <div className="text-xs text-gray-500">Candidate Name</div>
              <div className="font-semibold text-gray-800 text-sm">{user?.name ?? "Student"}</div>
            </div>
            <div className="ml-4 leading-tight">
              <div className="text-xs text-gray-500">Test Name</div>
              <div className="font-semibold text-gray-800 text-sm">{session.testName ?? "JEE Main Mock"}</div>
            </div>
          </div>

          {/* Center: Timer */}
          <div className="flex flex-col items-center">
            <div className="text-xs text-gray-500 mb-0.5">Remaining Time</div>
            <div
              className="font-mono font-bold text-xl px-4 py-1 rounded text-white"
              style={{ backgroundColor: timeColor, minWidth: 100, textAlign: "center" }}
            >
              {formatTime(timeLeft)}
            </div>
          </div>

          {/* Right: View Instructions */}
          <button
            onClick={() => setShowInstructions(true)}
            className="border border-gray-400 rounded px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            View Instructions
          </button>
        </div>

        {/* Subject Tabs */}
        <div className="flex border-t border-gray-200">
          {SUBJECTS.map(subj => (
            <button
              key={subj}
              onClick={() => { setCurrentSubject(subj); setCurrentIndexInSubject(0); }}
              className={`px-6 py-2 text-sm font-semibold border-r border-gray-200 transition-colors ${
                currentSubject === subj
                  ? "bg-[#0055aa] text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {subjectLabel(subj)}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left — Question area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white border-r border-gray-300">

          {/* Question meta bar */}
          <div className="flex items-center gap-3 px-4 py-2 bg-[#f0f0f0] border-b border-gray-300 flex-none">
            <span className="font-semibold text-gray-800">Question {currentIndexInSubject + 1}:</span>
            <span className="border border-gray-400 rounded px-2 py-0.5 text-xs text-gray-700">
              Marks: <span className="text-green-700 font-bold">+{currentQuestion.marks}</span> / <span className="text-red-600 font-bold">-{currentQuestion.negativeMarks}</span>
            </span>
            <span className="border border-gray-400 rounded px-2 py-0.5 text-xs text-gray-700">
              Type: {currentQuestion.questionType === "mcq" ? "Single" : "Integer"}
            </span>
          </div>

          {/* Question text + options */}
          <div className="flex-1 overflow-auto px-6 py-5">
            <div className="text-gray-900 leading-relaxed mb-6 text-sm" style={{ fontSize: 14 }}>
              {currentQuestion.questionText}
            </div>

            {currentQuestion.questionType === "mcq" ? (
              <div className="space-y-3 mt-2">
                {(["A", "B", "C", "D"] as const).map(opt => {
                  const val = currentQuestion[`option${opt}` as keyof typeof currentQuestion] as string | null;
                  if (!val) return null;
                  const isSelected = curAns.selectedOption === opt;
                  return (
                    <label
                      key={opt}
                      className={`flex items-start gap-3 p-3 rounded border cursor-pointer transition-colors ${
                        isSelected ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:bg-gray-50"
                      }`}
                      onClick={() => updateCurrentAnswer({ selectedOption: opt })}
                    >
                      <div className={`w-5 h-5 mt-0.5 rounded-full border-2 flex-none flex items-center justify-center ${
                        isSelected ? "border-blue-600" : "border-gray-400"
                      }`}>
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                      </div>
                      <span className="text-sm text-gray-800">
                        <span className="font-semibold">({opt})</span> {val}
                      </span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Enter your answer (integer value):</label>
                <input
                  type="number"
                  value={numericalInput}
                  onChange={e => setNumericalInput(e.target.value)}
                  className="border-2 border-gray-300 rounded px-4 py-3 text-lg font-mono w-40 focus:outline-none focus:border-blue-500"
                  placeholder="0"
                />
              </div>
            )}
          </div>

          {/* Bottom action bar */}
          <div className="flex-none border-t border-gray-300 bg-[#f0f0f0] px-4 py-2">
            <div className="flex items-center justify-between">
              {/* Left buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleSaveAndNext}
                  className="px-4 py-2 rounded text-white text-xs font-semibold bg-[#1a8d44] hover:bg-[#157136] transition-colors"
                >
                  SAVE & NEXT
                </button>
                <button
                  onClick={handleClear}
                  className="px-4 py-2 rounded text-xs font-semibold border border-gray-400 bg-white text-gray-700 hover:bg-gray-100"
                >
                  CLEAR
                </button>
                <button
                  onClick={handleSaveMarkReview}
                  className="px-4 py-2 rounded text-white text-xs font-semibold bg-[#3b5998] hover:bg-[#2d4373] transition-colors"
                >
                  SAVE & MARK FOR REVIEW
                </button>
                <button
                  onClick={handleMarkForReview}
                  className="px-4 py-2 rounded text-white text-xs font-semibold bg-[#e67e00] hover:bg-[#c96d00] transition-colors"
                >
                  MARK FOR REVIEW & NEXT
                </button>
              </div>

              {/* Right nav */}
              <div className="flex items-center gap-2">
                <button
                  onClick={goPrev}
                  disabled={currentSubject === "physics" && currentIndexInSubject === 0}
                  className="px-3 py-2 text-xs font-semibold border border-gray-400 rounded bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40"
                >
                  ← BACK
                </button>
                <button
                  onClick={goNext}
                  className="px-3 py-2 text-xs font-semibold border border-gray-400 rounded bg-white text-gray-700 hover:bg-gray-100"
                >
                  NEXT →
                </button>
                <button
                  onClick={() => setShowSubmitConfirm(true)}
                  className="px-5 py-2 rounded text-white text-xs font-bold bg-[#1a8d44] hover:bg-[#157136] transition-colors"
                >
                  SUBMIT
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar — Question Palette */}
        <div className="w-72 flex-none flex flex-col bg-white overflow-hidden">

          {/* Legend */}
          <div className="flex-none p-3 border-b border-gray-200 bg-gray-50">
            <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-xs">{globalCounts.answered}</div>
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-xs">{globalCounts.notAnswered}</div>
                <span>Not Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full border border-gray-400 bg-white flex items-center justify-center text-gray-600 font-bold text-xs">{globalCounts.notVisited}</div>
                <span>Not Visited</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-purple-700 flex items-center justify-center text-white font-bold text-xs">{globalCounts.marked}</div>
                <span>Mark for review</span>
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-purple-700 ring-2 ring-green-400 flex items-center justify-center text-white font-bold text-xs">{globalCounts.answeredMarked}</div>
                <span className="text-xs">Answered &amp; Marked for Revision (will be considered for evaluation)</span>
              </div>
            </div>
          </div>

          {/* Per-subject palettes */}
          <div className="flex-1 overflow-auto">
            {SUBJECTS.map(subj => {
              const qs = qsBySubj[subj] ?? [];
              return (
                <div key={subj} className="border-b border-gray-200">
                  <div className="px-3 py-1.5 bg-[#e8eaf6] text-xs font-bold text-[#0055aa] uppercase tracking-wider">
                    {subjectLabel(subj)}
                  </div>
                  <div className="p-2 grid grid-cols-8 gap-1">
                    {qs.map((q, idx) => {
                      const isCurrent = currentSubject === subj && currentIndexInSubject === idx;
                      const status = answers[q.id]?.status ?? "not_visited";
                      return (
                        <button
                          key={q.id}
                          onClick={() => switchToQuestion(subj, idx, q.id)}
                          className={`w-full aspect-square flex items-center justify-center rounded-full border text-xs font-semibold transition-all ${paletteColor(status, isCurrent)}`}
                          title={`Q${idx + 1} — ${status.replace("_", " ")}`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitConfirm} onOpenChange={setShowSubmitConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Test?</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-gray-600 space-y-2 py-2">
            <p>Are you sure you want to submit? Summary:</p>
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="text-center p-2 bg-green-50 border border-green-200 rounded">
                <div className="text-xl font-bold text-green-700">{globalCounts.answered + globalCounts.answeredMarked}</div>
                <div className="text-xs text-green-600">Answered</div>
              </div>
              <div className="text-center p-2 bg-red-50 border border-red-200 rounded">
                <div className="text-xl font-bold text-red-700">{globalCounts.notAnswered}</div>
                <div className="text-xs text-red-600">Not Answered</div>
              </div>
              <div className="text-center p-2 bg-gray-50 border border-gray-200 rounded">
                <div className="text-xl font-bold text-gray-700">{globalCounts.notVisited}</div>
                <div className="text-xs text-gray-600">Not Visited</div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setShowSubmitConfirm(false)} className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={() => { setShowSubmitConfirm(false); doSubmit(); }} className="px-4 py-2 rounded text-sm font-bold text-white bg-[#1a8d44] hover:bg-[#157136]">
              Yes, Submit
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fullscreen warning */}
      <Dialog open={showExitWarning} onOpenChange={setShowExitWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">⚠ Fullscreen Exited!</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">You have exited fullscreen. This is your <strong>first warning</strong>. Exiting again will automatically submit your test.</p>
          <DialogFooter>
            <button
              onClick={() => {
                setShowExitWarning(false);
                document.documentElement.requestFullscreen?.().catch(() => {});
              }}
              className="px-4 py-2 rounded text-white text-sm font-bold bg-[#1a8d44] hover:bg-[#157136]"
            >
              Return to Fullscreen
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Instructions */}
      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>General Instructions</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-gray-700 space-y-2 max-h-80 overflow-auto">
            <p><strong>1.</strong> The test contains 75 questions: 25 per subject (Physics, Chemistry, Mathematics).</p>
            <p><strong>2.</strong> Each subject has 20 MCQ (Single Correct) and 5 Integer type questions.</p>
            <p><strong>3.</strong> Marking scheme: <span className="text-green-600 font-semibold">+4</span> for correct, <span className="text-red-600 font-semibold">-1</span> for incorrect MCQ, <span className="text-green-600 font-semibold">+4</span> for correct integer, <span className="text-red-600 font-semibold">0</span> for incorrect integer.</p>
            <p><strong>4.</strong> Total time: <strong>3 hours (180 minutes)</strong>.</p>
            <p><strong>5.</strong> The timer auto-submits when time runs out.</p>
            <p><strong>6.</strong> Answers are auto-saved every 30 seconds.</p>
            <p><strong>7.</strong> Do NOT exit fullscreen — the second exit will auto-submit the test.</p>
          </div>
          <DialogFooter>
            <button onClick={() => setShowInstructions(false)} className="px-4 py-2 rounded text-sm font-bold text-white bg-[#0055aa] hover:bg-[#003d7a]">
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
