import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { Layout } from "@/components/layout";
import { ProtectedRoute } from "@/components/protected-route";
import NotFound from "@/pages/not-found";

import Home from "@/pages/home";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Tests from "@/pages/tests";
import Exam from "@/pages/exam";
import Result from "@/pages/result";
import Leaderboard from "@/pages/leaderboard";
import Admin from "@/pages/admin";
import Insights from "@/pages/insights";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/login" component={Login} />
        <Route path="/tests" component={Tests} />
        <Route path="/leaderboard" component={Leaderboard} />
        
        {/* Protected Student Routes */}
        <Route path="/dashboard">
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        </Route>
        <Route path="/test/:sessionId">
          <ProtectedRoute><Exam /></ProtectedRoute>
        </Route>
        <Route path="/result/:sessionId">
          <ProtectedRoute><Result /></ProtectedRoute>
        </Route>
        
        <Route path="/insights">
          <ProtectedRoute><Insights /></ProtectedRoute>
        </Route>

        {/* Protected Admin Routes */}
        <Route path="/admin">
          <ProtectedRoute adminOnly><Admin /></ProtectedRoute>
        </Route>
        
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
