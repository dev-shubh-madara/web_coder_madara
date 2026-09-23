// Lightweight admin mutation helpers.
//
// The generated API client (lib/api-client-react) only has read hooks for
// tests (useListTests/useGetTest) — the write endpoints below already exist
// on the server (see artifacts/api-server/src/routes/{tests,questions}.ts,
// all gated by requireAdmin) but aren't in the OpenAPI spec yet, so they're
// called directly here instead of waiting on a codegen run.

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("jee_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, { ...options, headers: { ...authHeaders(), ...options.headers } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export interface NewTestInput {
  title: string;
  subject?: string;
  type: "full" | "physics" | "chemistry" | "mathematics";
  duration: number;
  maxMarks: number;
  description?: string;
  status?: "draft" | "published";
}

export function createTest(input: NewTestInput) {
  return request("/api/tests", { method: "POST", body: JSON.stringify(input) });
}

export function deleteTest(testId: number) {
  return request(`/api/tests/${testId}`, { method: "DELETE" });
}

export interface NewQuestionInput {
  testId: number;
  subject: string;
  questionText: string;
  questionType: "mcq" | "numerical";
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correctOption?: string;
  correctNumerical?: number;
  marks?: number;
  negativeMarks?: number;
  orderIndex?: number;
  solution?: string;
}

export function createQuestion(input: NewQuestionInput) {
  return request("/api/questions", { method: "POST", body: JSON.stringify(input) });
}

export function deleteQuestion(questionId: number) {
  return request(`/api/questions/${questionId}`, { method: "DELETE" });
}
