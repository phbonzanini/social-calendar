import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import SelectNiche from "./pages/SelectNiche";
import Calendar from "./pages/Calendar";
import Campaigns from "./pages/Campaigns";
import FinalCalendar from "./pages/FinalCalendar";
import { FeedbackButton } from "./components/FeedbackButton";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/select-niche" element={<SelectNiche />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/final-calendar" element={<FinalCalendar />} />
          </Routes>
          <FeedbackButton />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;