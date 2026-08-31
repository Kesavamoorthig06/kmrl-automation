import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "../contexts/LanguageContext";
import { ThemeProvider } from "../contexts/ThemeContext";
import ErrorBoundary from "../components/ErrorBoundary";
import Dashboard from "../pages/Dashboard.jsx";
import AdminPage from "../pages/AdminPage.jsx";
import SelectedTrainsDashboard from "../pages/SelectedTrainsDashboard.jsx";
import LoginPage from "../pages/LoginPage.jsx";
import WorkerPage from "../pages/WorkerPage.jsx";
import AlertsPage from "../pages/AlertsPage.jsx";
import SchedulePage from "../pages/SchedulePage.jsx";
import BrandingOfficer from "../components/workers/BrandingOfficer";
import Cleaning from "../components/workers/Cleaning";
import OperationStaff from "../components/workers/OperationStaff";
import Technical from "../components/workers/Technical";
import Yard from "../components/workers/Yard";
import BridgeLogin from "../components/BridgeLogin";

function App() {
  return (
    <ErrorBoundary>
    <ThemeProvider>
      <LanguageProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/" element={<LoginPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/bridge-login" element={<BridgeLogin />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/selected-trains" element={<SelectedTrainsDashboard />} />
              <Route path="/confirm" element={<SelectedTrainsDashboard />} />
              <Route path="/workers/:workerType" element={<WorkerPage />} />
              <Route path="/schedule" element={<SchedulePage />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/branding_officer" element={<BrandingOfficer />} />
              <Route path="/cleaning" element={<Cleaning />} />
              <Route path="/operation_staff" element={<OperationStaff />} />
              <Route path="/technical" element={<Technical />} />
              <Route path="/yard" element={<Yard />} />
              <Route path="*" element={<LoginPage />} />
            </Routes>
          </div>
        </Router>
      </LanguageProvider>
    </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
