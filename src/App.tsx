import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import SelectNiche from "./pages/SelectNiche";
import Calendar from "./pages/Calendar";
import Campaigns from "./pages/Campaigns";
import FinalCalendar from "./pages/FinalCalendar";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import { FeedbackButton } from "./components/FeedbackButton";
import { Navbar } from "./components/Navbar";
import { useEffect, useState } from "react";
import { supabase } from "./integrations/supabase/client";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isAuthenticated === null) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <Navbar />
      <div className="pt-16">
        {children}
      </div>
    </>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <AppLayout>
                    <Index />
                  </AppLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/select-niche"
              element={
                <PrivateRoute>
                  <AppLayout>
                    <SelectNiche />
                  </AppLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/calendar"
              element={
                <PrivateRoute>
                  <AppLayout>
                    <Calendar />
                  </AppLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/campaigns"
              element={
                <PrivateRoute>
                  <AppLayout>
                    <Campaigns />
                  </AppLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/final-calendar"
              element={
                <PrivateRoute>
                  <AppLayout>
                    <FinalCalendar />
                  </AppLayout>
                </PrivateRoute>
              }
            />
          </Routes>
          <FeedbackButton />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;