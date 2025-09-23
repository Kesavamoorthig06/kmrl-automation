import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./Dashboard";
import AdminPage from "./adminpage";
import SelectedTrainsDashboard from "./SelectedTrainsDashboard";
import LoginPage from "./LoginPage";
import WorkerPage from "./WorkerPage";
import AlertsPage from "./AlertsPage";
import AnalyticsPage from "./AnalyticsPage";
import "./App.css"; // Import your styling

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/selected-trains" element={<SelectedTrainsDashboard />} />
          <Route path="/confirm" element={<SelectedTrainsDashboard />} />
          <Route path="/workers/:workerType" element={<WorkerPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="*" element={<LoginPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
