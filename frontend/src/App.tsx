import { Routes, Route, Navigate } from "react-router-dom";
import { getToken } from "./lib/api";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import ResetPassword from "./pages/ResetPassword";
import Welcome from "./pages/Welcome";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Chantiers from "./pages/Chantiers";
import ChantierDetail from "./pages/ChantierDetail";
import Documents from "./pages/Documents";
import Tickets from "./pages/Tickets";
import TicketNew from "./pages/TicketNew";
import TicketDetail from "./pages/TicketDetail";
import Maintenance from "./pages/Maintenance";

function Protected({ children }: { children: React.ReactNode }) {
  if (!getToken()) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/" element={<Protected><Layout /></Protected>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="chantiers" element={<Chantiers />} />
        <Route path="chantiers/:id" element={<ChantierDetail />} />
        <Route path="documents" element={<Documents />} />
        <Route path="tickets" element={<Tickets />} />
        <Route path="tickets/new" element={<TicketNew />} />
        <Route path="tickets/:id" element={<TicketDetail />} />
        <Route path="maintenance" element={<Maintenance />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
