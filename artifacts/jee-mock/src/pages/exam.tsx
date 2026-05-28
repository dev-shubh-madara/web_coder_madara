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

// Magnifier lens size in px (~5cm at 96 dpi)
const LENS_SIZE = 190;
const ZOOM_FACTOR = 2.5;

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
  const [magnifierOn, setMagnifierOn] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [fsCountdown, setFsCountdown] = useState(0);
  const exitWarningCount = useRef(0);
  const hasSubmitted = useRef(false);
  const fsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fsCountdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const questionAreaRef = useRef<HTMLDivElement>(null);
  const answersRef = useRef(answers);
  useEffect(() => { answersRef.current = answers; }, [answers]);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion?.id]);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          doSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft > 0]);

  // Auto-save every 30s
  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => doSave(answersRef.current), 30000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id]);

  // Fullscreen enforcement
  useEffect(() => {
    const handler = () => {
      if (!document.fullscreenElement && session?.status === "active" && !hasSubmitted.current) {
        exitWarningCount.current += 1;

        if (exitWarningCount.current === 1) {
          // First exit: warn and auto-re-enter fullscreen after 5 seconds
          setShowExitWarning(true);
          setFsCountdown(5);
          fsCountdownRef.current = setInterval(() => {
            setFsCountdown(prev => {
              if (prev <= 1) {
                if (fsCountdownRef.current) clearInterval(fsCountdownRef.current);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
          fsTimerRef.current = setTimeout(() => {
            setShowExitWarning(false);
            document.documentElement.requestFullscreen().catch(() => {});
          }, 5000);
        } else {
          // Second exit: auto-submit
          setShowExitWarning(false);
          if (fsTimerRef.current) clearTimeout(fsTimerRef.current);
          if (fsCountdownRef.current) clearInterval(fsCountdownRef.current);
          doSubmit();
        }
      }
    };
    document.addEventListener("fullscreenchange", handler);
    return () => {
      document.removeEventListener("fullscreenchange", handler);
      if (fsTimerRef.current) clearTimeout(fsTimerRef.current);
      if (fsCountdownRef.current) clearInterval(fsCountdownRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.status]);

  // Mouse tracking for magnifier
  useEffect(() => {
    if (!magnifierOn) return;
    const handleMove = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, [magnifierOn]);

  const doSave = (ans: Record<number, AnswerState>) => {
    if (!session) return;
    // ✅ Fixed: pass sessionId separately as required by generated hook
    saveAnswersMutation.mutate({
      sessionId: id,
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
    doSave(answersRef.current);
    // ✅ Fixed: pass { sessionId } directly, not wrapped in { data: { sessionId } }
    submitSessionMutation.mutate(
      { sessionId: id },
      {
        onSuccess: () => {
          if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
          setLocation(`/result/${id}`);
        },
        onError: () => {
          // Even on error, try to navigate to result
          if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
          setLocation(`/result/${id}`);
        }
      }
    );
  };

  const handleReEnterFullscreen = () => {
    if (fsTimerRef.current) clearTimeout(fsTimerRef.current);
    if (fsCountdownRef.current) clearInterval(fsCountdownRef.current);
    setShowExitWarning(false);
    document.documentElement.requestFullscreen().catch(() => {});
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
    const qs = questionsBySubject();
    if (currentIndexInSubject < currentSubjectQuestions.length - 1) {
      setCurrentIndexInSubject(prev => prev + 1);
      markVisited(currentSubjectQuestions[currentIndexInSubject + 1]?.id);
    } else {
      const nextSubjectIdx = SUBJECTS.indexOf(currentSubject) + 1;
      if (nextSubjectIdx < SUBJECTS.length) {
        setCurrentSubject(SUBJECTS[nextSubjectIdx]);
        setCurrentIndexInSubject(0);
        markVisited(qs[SUBJECTS[nextSubjectIdx]]?.[0]?.id);
      }
    }
  };

  const goPrev = () => {
    const qs = questionsBySubject();
    if (currentIndexInSubject > 0) {
      setCurrentIndexInSubject(prev => prev - 1);
    } else {
      const prevSubjectIdx = SUBJECTS.indexOf(currentSubject) - 1;
      if (prevSubjectIdx >= 0) {
        const prevSubj = SUBJECTS[prevSubjectIdx];
        setCurrentSubject(prevSubj);
        const prevQs = qs[prevSubj];
        setCurrentIndexInSubject(prevQs.length - 1);
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

  // Magnifier lens position: keep lens inside viewport
  const lensX = Math.min(Math.max(mousePos.x - LENS_SIZE / 2, 4), window.innerWidth - LENS_SIZE - 4);
  const lensY = mousePos.y > window.innerHeight / 2
    ? mousePos.y - LENS_SIZE - 20
    : mousePos.y + 20;

  // Content inside magnifier: offset so the area around cursor appears inside
  const contentOffsetX = -(mousePos.x - LENS_SIZE / (2 * ZOOM_FACTOR));
  const contentOffsetY = -(mousePos.y - LENS_SIZE / (2 * ZOOM_FACTOR));

  return (
    <div
      className="h-screen w-full flex flex-col bg-[#f5f5f5] overflow-hidden select-none"
      style={{ fontSize: 13, cursor: magnifierOn ? "none" : "default" }}
      id="exam-root"
    >
      {/* ── Magnifying Glass Overlay ── */}
      {magnifierOn && (
        <>
          {/* Custom cursor icon */}
          <div
            style={{
              position: "fixed",
              left: mousePos.x,
              top: mousePos.y,
              transform: "translate(-4px, -4px)",
              fontSize: 24,
              pointerEvents: "none",
              zIndex: 10001,
              lineHeight: 1,
            }}
          >
            🔍
          </div>
          {/* Lens showing zoomed content */}
          <div
            style={{
              position: "fixed",
              left: lensX,
              top: lensY,
              width: LENS_SIZE,
              height: LENS_SIZE,
              border: "3px solid #0055aa",
              borderRadius: 8,
              overflow: "hidden",
              pointerEvents: "none",
              zIndex: 10000,
              boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
              background: "#fff",
            }}
          >
            {/* Clone of page at ZOOM_FACTOR scale, offset so cursor point is centered */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: `${100 / ZOOM_FACTOR}%`,
                height: `${100 / ZOOM_FACTOR}%`,
                transform: `scale(${ZOOM_FACTOR})`,
                transformOrigin: "top left",
              }}
            >
              {/* Re-render question text + options in the lens */}
              <div
                style={{
                  position: "absolute",
                  top: contentOffsetY / ZOOM_FACTOR,
                  left: contentOffsetX / ZOOM_FACTOR,
                  width: window.innerWidth,
                  padding: "8px 16px",
                  background: "#fff",
                  fontSize: 13,
                  lineHeight: 1.6,
                }}
              >
                <div style={{ fontWeight: 600, color: "#111", marginBottom: 8, fontSize: 14 }}>
                  Q{currentIndexInSubject + 1}: {currentQuestion.questionText}
                </div>
                {currentQuestion.questionType === "mcq" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {(["A", "B", "C", "D"] as const).map(opt => {
                      const val = currentQuestion[`option${opt}` as keyof typeof currentQuestion] as string | null;
                      if (!val) return null;
                      const isSel = curAns.selectedOption === opt;
                      return (
                        <div key={opt} style={{ padding: "2px 6px", borderRadius: 4, background: isSel ? "#dbeafe" : "#f9f9f9", border: `1px solid ${isSel ? "#3b82f6" : "#ddd"}`, fontSize: 12 }}>
                          <b>({opt})</b> {val}
                        </div>
                      );
                    })}
                  </div>
                )}
                {currentQuestion.questionType === "numerical" && (
                  <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>
                    <b>Integer type</b> — Enter exact numerical value
                    {numericalInput && <span style={{ marginLeft: 8, color: "#1a8d44", fontWeight: 700 }}>Your answer: {numericalInput}</span>}
                  </div>
                )}
              </div>
            </div>
            {/* Lens header */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,85,170,0.85)", color: "#fff", fontSize: 9, padding: "2px 6px", textAlign: "center" }}>
              🔍 {ZOOM_FACTOR}× Magnifier
            </div>
          </div>
        </>
      )}

      {/* ── Top Header ── */}
      <div className="flex-none bg-white border-b border-gray-300 shadow-sm">
        <div className="flex items-center justify-between px-3 py-2">
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

          {/* Timer */}
          <div className="flex flex-col items-center">
            <div className="text-xs text-gray-500 mb-0.5">Remaining Time</div>
            <div
              className="font-mono font-bold text-xl px-4 py-1 rounded text-white"
              style={{ backgroundColor: timeColor, minWidth: 100, textAlign: "center" }}
            >
              {formatTime(timeLeft)}
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            {/* Magnifier toggle */}
            <button
              onClick={() => setMagnifierOn(v => !v)}
              title={magnifierOn ? "Disable Magnifier" : "Enable Magnifying Glass (5cm lens)"}
              className={`flex items-center gap-1.5 border rounded px-3 py-1.5 text-sm font-semibold transition-colors ${
                magnifierOn
                  ? "bg-amber-400 border-amber-500 text-amber-900"
                  : "border-gray-400 bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              🔍 {magnifierOn ? "Magnifier ON" : "Magnifier"}
            </button>
            <button
              onClick={() => setShowInstructions(true)}
              className="border border-gray-400 rounded px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              View Instructions
            </button>
          </div>
        </div>

        {/* Subject Tabs */}
        <div className="flex border-t border-gray-200">
          {SUBJECTS.map(subj => (
            <button
              key={subj}
              onClick={() => { setCurrentSubject(subj); setCurrentIndexInSubject(0); }}
              className={`px-6 py-2 text-sm font-semibold border-r border-gray-200 transition-colors ${
                currentSubject === subj ? "bg-[#0055aa] text-white" : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {subjectLabel(subj)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Body ── */}
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
              Type: {currentQuestion.questionType === "mcq" ? "Single Correct" : "Integer Type"}
            </span>
          </div>

          {/* Question text + options */}
          <div className="flex-1 overflow-auto px-6 py-5" ref={questionAreaRef}>
            <div className="text-gray-900 leading-relaxed mb-6" style={{ fontSize: 14 }}>
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
                      <div className={`w-5 h-5 mt-0.5 rounded-full border-2 flex-none flex items-center justify-center ${isSelected ? "border-blue-600" : "border-gray-400"}`}>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Enter your answer (integer / decimal value):</label>
                <input
                  type="number"
                  value={numericalInput}
                  onChange={e => setNumericalInput(e.target.value)}
                  className="border-2 border-gray-300 rounded px-4 py-3 text-lg font-mono w-48 focus:outline-none focus:border-blue-500"
                  placeholder="0"
                />
              </div>
            )}
          </div>

          {/* Bottom action bar */}
          <div className="flex-none border-t border-gray-300 bg-[#f0f0f0] px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button onClick={handleSaveAndNext} className="px-4 py-2 rounded text-white text-xs font-semibold bg-[#1a8d44] hover:bg-[#157136] transition-colors">SAVE & NEXT</button>
                <button onClick={handleClear} className="px-4 py-2 rounded text-xs font-semibold border border-gray-400 bg-white text-gray-700 hover:bg-gray-100">CLEAR</button>
                <button onClick={handleSaveMarkReview} className="px-4 py-2 rounded text-white text-xs font-semibold bg-[#3b5998] hover:bg-[#2d4373] transition-colors">SAVE & MARK FOR REVIEW</button>
                <button onClick={handleMarkForReview} className="px-4 py-2 rounded text-white text-xs font-semibold bg-[#e67e00] hover:bg-[#c96d00] transition-colors">MARK FOR REVIEW & NEXT</button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={goPrev}
                  disabled={currentSubject === "physics" && currentIndexInSubject === 0}
                  className="px-3 py-2 text-xs font-semibold border border-gray-400 rounded bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40"
                >← BACK</button>
                <button onClick={goNext} className="px-3 py-2 text-xs font-semibold border border-gray-400 rounded bg-white text-gray-700 hover:bg-gray-100">NEXT →</button>
                <button onClick={() => setShowSubmitConfirm(true)} className="px-5 py-2 rounded text-white text-xs font-bold bg-[#cc2200] hover:bg-[#aa1100] transition-colors">SUBMIT</button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar — Question Palette */}
        <div className="w-72 flex-none flex flex-col bg-white overflow-hidden">
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
                <span className="text-xs">Answered &amp; Marked (counted)</span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {SUBJECTS.map(subj => {
              const qs = qsBySubj[subj] ?? [];
              return (
                <div key={subj} className="border-b border-gray-200">
                  <div className="px-3 py-1.5 bg-[#e8eaf6] text-xs font-bold text-[#0055aa] uppercase tracking-wider">{subjectLabel(subj)}</div>
                  <div className="p-2 grid grid-cols-8 gap-1">
                    {qs.map((q, idx) => {
                      const isCurrent = currentSubject === subj && currentIndexInSubject === idx;
                      const status = answers[q.id]?.status ?? "not_visited";
                      return (
                        <button
                          key={q.id}
                          onClick={() => switchToQuestion(subj, idx, q.id)}
                          className={`w-full aspect-square flex items-center justify-center rounded-full border text-xs font-semibold transition-all ${paletteColor(status, isCurrent)}`}
                          title={`Q${idx + 1} — ${status.replace(/_/g, " ")}`}
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

      {/* ── Fullscreen Exit Warning ── */}
      {showExitWarning && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-black text-red-600 mb-2">Fullscreen Exited!</h2>
            <p className="text-gray-700 mb-2">
              You have exited fullscreen mode. <strong>This is your only warning.</strong>
            </p>
            <p className="text-gray-500 text-sm mb-6">
              If you exit fullscreen again, your test will be <span className="text-red-600 font-bold">automatically submitted</span>.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-xl py-4 mb-6">
              <div className="text-4xl font-black text-red-600">{fsCountdown}</div>
              <div className="text-sm text-red-500">Auto-resuming fullscreen in {fsCountdown} second{fsCountdown !== 1 ? "s" : ""}…</div>
            </div>
            <button
              onClick={handleReEnterFullscreen}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-lg transition-all"
            >
              ↩ Re-enter Fullscreen Now
            </button>
          </div>
        </div>
      )}

      {/* ── Submit Confirmation Dialog ── */}
      <Dialog open={showSubmitConfirm} onOpenChange={setShowSubmitConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Test?</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-gray-600 space-y-2 py-2">
            <p>Are you sure you want to submit? Summary:</p>
            <div className="grid grid-cols-3 gap-2 mt-3">
              {[
                { label: "Answered", value: globalCounts.answered, color: "text-green-700" },
                { label: "Not Answered", value: globalCounts.notAnswered, color: "text-red-600" },
                { label: "Not Visited", value: globalCounts.notVisited, color: "text-gray-600" },
                { label: "Marked", value: globalCounts.marked, color: "text-purple-700" },
                { label: "Ans+Marked", value: globalCounts.answeredMarked, color: "text-purple-600" },
                { label: "Time Left", value: formatTime(timeLeft), color: "text-blue-600" },
              ].map(item => (
                <div key={item.label} className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className={`text-xl font-black ${item.color}`}>{item.value}</div>
                  <div className="text-xs text-gray-500">{item.label}</div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">Unattempted questions score 0. You cannot go back after submitting.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitConfirm(false)}>Cancel</Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => { setShowSubmitConfirm(false); doSubmit(); }}
              disabled={submitSessionMutation.isPending}
            >
              {submitSessionMutation.isPending ? "Submitting…" : "Yes, Submit Now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Instructions Dialog ── */}
      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Exam Instructions</DialogTitle></DialogHeader>
          <div className="text-sm text-gray-600 space-y-2 max-h-80 overflow-auto">
            <p>• This is a 3-hour exam. The timer is shown at the top.</p>
            <p>• <b>MCQ</b>: +4 for correct, -1 for wrong. <b>Integer</b>: +4 for correct, 0 for wrong.</p>
            <p>• Click <b>SAVE &amp; NEXT</b> to save your answer and go to the next question.</p>
            <p>• Use the palette on the right to jump to any question.</p>
            <p>• <b>Fullscreen enforcement</b>: Exiting fullscreen twice will auto-submit your paper.</p>
            <p>• Your answers are saved automatically every 30 seconds.</p>
            <p>• Use the 🔍 <b>Magnifier</b> button to enable the magnifying glass tool.</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowInstructions(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
