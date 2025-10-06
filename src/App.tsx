import { BrowserRouter, Routes, Route } from "react-router-dom";

import ProtectedRoute from "@/components/ProtectedRoute";
import { AuthDialogProvider } from "@/providers/auth-dialog";
import { AuthProvider } from "@/providers/auth";
import Dashboard from "./pages/Dashboard";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <AuthDialogProvider>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthDialogProvider>
    </BrowserRouter>
  </AuthProvider>
);

export default App;
