import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./integrations/supabase/client";
import Index from "./pages/Index";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import SelectNiche from "./pages/SelectNiche";
import Calendar from "./pages/Calendar";
import Campaigns from "./pages/Campaigns";
import FinalCalendar from "./pages/FinalCalendar";
import { AppSidebar } from "./components/AppSidebar";

export const AppRoutes = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });
  }, []);

  if (isAuthenticated === null) {
    return null;
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
        </Routes>
      </main>
    </>
  );
};