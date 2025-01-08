import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./integrations/supabase/client";
import Index from "./pages/Index";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import SelectNiche from "./pages/SelectNiche";
import SeasonalDates from "./pages/SeasonalDates";
import Calendar from "./pages/Calendar";
import Campaigns from "./pages/Campaigns";
import FinalCalendar from "./pages/FinalCalendar";
import { AppSidebar } from "./components/AppSidebar";
import { Loader2 } from "lucide-react";

export const AppRoutes = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      {isAuthenticated && <AppSidebar />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route
            path="/select-niche"
            element={
              isAuthenticated ? (
                <SelectNiche />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/seasonal-dates"
            element={
              isAuthenticated ? (
                <SeasonalDates />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/calendar"
            element={
              isAuthenticated ? (
                <Calendar />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/campaigns"
            element={
              isAuthenticated ? (
                <Campaigns />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/final-calendar"
            element={
              isAuthenticated ? (
                <FinalCalendar />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
};