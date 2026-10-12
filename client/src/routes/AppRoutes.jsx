import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import AppLayout from "../components/layout/AppLayout.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";
import LoginPage from "../features/auth/LoginPage.jsx";
import DashboardPage from "../features/dashboard/DashboardPage.jsx";
import WaterPage from "../features/water/WaterPage.jsx";
import ElectricityPage from "../features/electricity/ElectricityPage.jsx";
import AttendancePage from "../features/attendance/AttendancePage.jsx";
import MarkAttendancePage from "../features/attendance/MarkAttendancePage.jsx";
import ParkingPage from "../features/parking/ParkingPage.jsx";
import GreeneryPage from "../features/greenery/GreeneryPage.jsx";
import ReportsPage from "../features/reports/ReportsPage.jsx";
import NotFoundPage from "../features/auth/NotFoundPage.jsx";

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={user ? "/dashboard" : "/login"} replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/water" element={<WaterPage />} />
        <Route path="/electricity" element={<ElectricityPage />} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/attendance/mark" element={<MarkAttendancePage />} />
        <Route path="/parking" element={<ParkingPage />} />
        <Route path="/greenery" element={<GreeneryPage />} />
        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
