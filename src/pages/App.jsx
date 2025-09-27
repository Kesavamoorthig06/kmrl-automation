import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "../contexts/LanguageContext";
import { ThemeProvider } from "../contexts/ThemeContext";
import Dashboard from "./Dashboard";
import AdminPage from "./adminpage";
import SelectedTrainsDashboard from "./SelectedTrainsDashboard";
import LoginPage from "./LoginPage";
import WorkerPage from "./WorkerPage";
import AlertsPage from "./AlertsPage";
// Import the remade JSX components
import BrandingOfficer from "../components/workers/branding_officer.jsx";
import Cleaning from "../components/workers/cleaning.jsx";
import OperationStaff from "../components/workers/operation staff.jsx";
import Technical from "../components/workers/technical.jsx";
import Yard from "../components/workers/yard.jsx";
// Removed App.css import to prevent CSS conflicts with Tailwind

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/" element={<LoginPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/selected-trains" element={<SelectedTrainsDashboard />} />
              <Route path="/confirm" element={<SelectedTrainsDashboard />} />
              <Route path="/workers/:workerType" element={<WorkerPage />} />
              <Route path="/alerts" element={<AlertsPage />} />
              {/* Worker role pages */}
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
  );
}

export default App;
