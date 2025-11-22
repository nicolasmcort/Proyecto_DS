import "./global.css";

import { createRoot } from "react-dom/client";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import TaskManagement from "./pages/TaskManagement";
import CriticalPathAnalysis from "./pages/CriticalPathAnalysis";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  // Habilitar modo oscuro globalmente
  if (typeof document !== "undefined") {
    document.documentElement.classList.add("dark");
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<TaskManagement />} />
            <Route path="/tasks" element={<TaskManagement />} />
            <Route path="/analysis" element={<CriticalPathAnalysis />} />
            {/* AGREGA TODAS LAS RUTAS PERSONALIZADAS ANTES DE LA RUTA "*" QUE ATRAPA TODO */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

createRoot(document.getElementById("root")!).render(<App />);
