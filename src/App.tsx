import "./App.css";
import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./AppRoutes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { SidebarProvider } from "./components/ui/sidebar";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <SidebarProvider>
          <div className="min-h-screen flex w-full">
            <AppRoutes />
          </div>
        </SidebarProvider>
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;