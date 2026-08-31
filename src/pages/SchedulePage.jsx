import React, { useState, useEffect } from "react";
import { RefreshCw, XCircle, CheckCircle, BarChart3, Target, Activity, AlertTriangle } from "lucide-react";
import Navbar from "../components/layout/Navbar.jsx";
import TrainTable from "../components/dashboard/TrainTable.jsx";
import SelectionControls from "../components/dashboard/SelectionControls.jsx";
import ConfirmationAlert from "../components/dashboard/ConfirmationAlert.jsx";
import ConstraintsModal from "../components/dashboard/ConstraintsModal.jsx";
import ReasonModal from "../components/dashboard/ReasonModal.jsx";
import TrainDetailsModal from "../components/dashboard/TrainDetailsModal.jsx";
import DeploymentStatusCards from "../components/dashboard/DeploymentStatusCards.jsx";
import AIChatbot from "../components/chat/AIChatbot.jsx";
import MLDataService from "../services/MLDataService.js";
import { useTranslation } from "../hooks/useTranslation.js";
import { useNavigate } from "react-router-dom";

function SchedulePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [trains, setTrains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [reasonText, setReasonText] = useState("");
  const [showTrainModal, setShowTrainModal] = useState(false);
  const [selectedTrain, setSelectedTrain] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [chartPath, setChartPath] = useState("");
  const [isGeneratingChart, setIsGeneratingChart] = useState(false);
  const [trainMetrics, setTrainMetrics] = useState(null);
  const [selectedTrains, setSelectedTrains] = useState(new Set());
  const [currentPage, setCurrentPage] = useState("schedule");
  const [showConstraintsModal, setShowConstraintsModal] = useState(false);
  const [selectedTrainForConstraints, setSelectedTrainForConstraints] = useState(null);
  const [constraintChecks, setConstraintChecks] = useState({
    fitnessCertificates: false,
    jobCardStatus: false,
    brandingPriorities: false,
    mileageBalancing: false,
    cleaningDetailing: false,
    stablingGeometry: false,
  });
  // Schedule lockout state
  const [scheduleLocked, setScheduleLocked] = useState(false);
  const [activeSchedule, setActiveSchedule] = useState(null);
  // Handle navbar navigation
  const handleNavbarNavigation = (page) => {
    if (page === "selection") {
      navigate("/dashboard");
    } else if (page === "schedule") {
      setCurrentPage("schedule");
    } else if (page === "alerts") {
      navigate("/alerts");
    }
  };

  useEffect(() => {
    loadCSVData();
    checkScheduleLockout();
  }, []);

  // Check if there's an active schedule (lockout)
  const checkScheduleLockout = async () => {
    try {
      const resp = await fetch('/schedule/active');
      if (resp.ok) {
        const data = await resp.json();
        if (data.schedule && data.schedule.status === 'ACTIVE') {
          setScheduleLocked(true);
          setActiveSchedule(data.schedule);
        }
      }
    } catch {
      // API not available — no lockout
    }
  };

  // Generate chart when train modal opens
  useEffect(() => {
    if (showTrainModal && selectedTrain && trains.length > 0) {
      const trainData = trains.find((t) => t.id === selectedTrain);
      if (trainData) {
        generateChart(selectedTrain, trainData);
        setTimeout(() => {
          const trainIdNum = parseInt(selectedTrain.replace("R-", ""));
          const seed = trainIdNum * 7;
          const metrics = {
            mileageEfficiency: `${(70 + (seed % 25)).toFixed(1)}%`,
            energyConsumption: `${(2.5 + ((seed % 15) / 10)).toFixed(1)} kWh/km`,
            averageSpeed: `${(35 + (seed % 20)).toFixed(1)} km/h`,
            accelerationRate: `${(0.7 + ((seed % 8) / 10)).toFixed(1)} m/s²`,
            totalDistance: `${(trainData.mileage || 0).toLocaleString()} km`,
            serviceHours: `${(1500 + (seed % 2000)).toFixed(0)} hrs`,
            passengerCapacity: 250 + (seed % 200),
            loadFactor: `${(55 + (seed % 35)).toFixed(1)}%`,
            safetyScore: `${75 + (seed % 20)}/100`,
            maintenanceScore: `${80 + (seed % 15)}/100`,
            operationalEfficiency: `${(65 + (seed % 30)).toFixed(1)}%`,
            electricityEfficiency: `${(8.5 + (seed % 3)).toFixed(1)} km/kWh`,
            brakeEfficiency: `${(85 + (seed % 10)).toFixed(1)}%`,
          };
          createIndividualCharts(selectedTrain, metrics);
        }, 100);
      }
    }
  }, [showTrainModal, selectedTrain, trains]);

  const loadCSVData = async () => {
    try {
      setLoading(true);
      const mlData = await MLDataService.loadMLData();
      if (!mlData || mlData.length === 0) {
        throw new Error("No ML data available");
      }
      const rankedTrains = mlData
        .sort((a, b) => {
          const numA = parseInt(a.id.replace(/\D/g, ''), 10);
          const numB = parseInt(b.id.replace(/\D/g, ''), 10);
          return numA - numB;
        })
        .map((train, index) => ({ ...train, rank: index + 1 }));

      setTrains(rankedTrains);

      // Auto-select top 14 available AND deployment-ready trains
      const availableTrains = rankedTrains
        .filter((train) => train.status === "Available" && train.assignment === "Service")
        .slice(0, 14);
      setSelectedTrains(new Set(availableTrains.map((t) => t.id)));
      setError(null);
      setLoading(false);
    } catch (err) {
      console.error("Error loading ML data:", err);
      setError("Failed to load ML analysis data.");
      setLoading(false);
    } finally {
      setDataLoaded(true);
    }
  };

  // ── Chart helpers (identical to Dashboard) ────────────────────
  const generateChart = (trainId, trainData) => {
    setIsGeneratingChart(true);
    setChartPath("");
    const trainIdNum = parseInt(trainId.replace("R-", ""));
    const seed = trainIdNum * 7;
    const metrics = {
      mileageEfficiency: `${(70 + (seed % 25)).toFixed(1)}%`,
      energyConsumption: `${(2.5 + ((seed % 15) / 10)).toFixed(1)} kWh/km`,
      averageSpeed: `${(35 + (seed % 20)).toFixed(1)} km/h`,
      accelerationRate: `${(0.7 + ((seed % 8) / 10)).toFixed(1)} m/s²`,
      totalDistance: `${(trainData.mileage || 0).toLocaleString()} km`,
      serviceHours: `${(1500 + (seed % 2000)).toFixed(0)} hrs`,
      passengerCapacity: 250 + (seed % 200),
      loadFactor: `${(55 + (seed % 35)).toFixed(1)}%`,
      safetyScore: `${75 + (seed % 20)}/100`,
      maintenanceScore: `${80 + (seed % 15)}/100`,
      operationalEfficiency: `${(65 + (seed % 30)).toFixed(1)}%`,
      electricityEfficiency: `${(8.5 + (seed % 3)).toFixed(1)} km/kWh`,
      brakeEfficiency: `${(85 + (seed % 10)).toFixed(1)}%`,
    };
    setTrainMetrics(metrics);
    setChartPath("chart-generated");
    createIndividualCharts(trainId, metrics);
    setIsGeneratingChart(false);
  };

  const createIndividualCharts = (trainId, metrics) => {
    const barCanvas = document.getElementById("performanceBarChart");
    if (barCanvas) {
      const ctx = barCanvas.getContext("2d");
      ctx.clearRect(0, 0, barCanvas.width, barCanvas.height);
      const data = [
        { label: "Mileage", value: parseFloat(metrics.mileageEfficiency), color: "#10B981" },
        { label: "Energy", value: parseFloat(metrics.energyConsumption) * 10, color: "#3B82F6" },
        { label: "Speed", value: parseFloat(metrics.averageSpeed), color: "#8B5CF6" },
        { label: "Safety", value: parseFloat(metrics.safetyScore), color: "#F59E0B" },
        { label: "Ops Eff.", value: parseFloat(metrics.operationalEfficiency), color: "#EF4444" },
        { label: "Elec Eff.", value: parseFloat(metrics.electricityEfficiency), color: "#F97316" },
      ];
      const width = 500, height = 240, x = 50, y = 30;
      ctx.fillStyle = "#374151";
      ctx.font = "bold 16px Arial";
      ctx.textAlign = "center";
      ctx.fillText("Performance Metrics", x + width / 2, y - 10);
      const barWidth = (width - 40) / data.length - 10;
      const maxValue = Math.max(...data.map((d) => d.value));
      const barHeight = height - 60;
      data.forEach((item, index) => {
        const barX = x + 20 + index * (barWidth + 10);
        const barH = (item.value / maxValue) * barHeight;
        const barY = y + barHeight - barH;
        ctx.fillStyle = item.color;
        ctx.fillRect(barX, barY, barWidth, barH);
        ctx.fillStyle = "#1f2937";
        ctx.font = "12px Arial";
        ctx.textAlign = "center";
        ctx.fillText(item.value.toFixed(1), barX + barWidth / 2, barY - 5);
        ctx.fillText(item.label, barX + barWidth / 2, y + barHeight + 20);
      });
    }
  };

  // ── Event handlers ────────────────────────────────────────────
  const handleUnavailableClick = (train) => {
    setSelectedTrainForConstraints(train);
    setShowConstraintsModal(true);
    setConstraintChecks({
      fitnessCertificates: Math.random() > 0.3,
      jobCardStatus: Math.random() > 0.4,
      brandingPriorities: Math.random() > 0.2,
      mileageBalancing: Math.random() > 0.5,
      cleaningDetailing: Math.random() > 0.3,
      stablingGeometry: Math.random() > 0.4,
    });
  };

  const handleAvailableClick = (train) => {
    setSelectedTrainForConstraints(train);
    setShowConstraintsModal(true);
    setConstraintChecks({
      fitnessCertificates: true,
      jobCardStatus: true,
      brandingPriorities: true,
      mileageBalancing: true,
      cleaningDetailing: true,
      stablingGeometry: true,
    });
  };

  const handleConstraintChange = (constraint) => {
    const newChecks = { ...constraintChecks, [constraint]: !constraintChecks[constraint] };
    setConstraintChecks(newChecks);
    const hasUnchecked = Object.values(newChecks).some((v) => !v);
    if (selectedTrainForConstraints) {
      setTrains((prev) =>
        prev.map((train) =>
          train.id === selectedTrainForConstraints.id
            ? {
                ...train,
                status: hasUnchecked ? "Unavailable" : "Available",
                explain: hasUnchecked ? "Administrator manually marked as unavailable due to constraint violations" : "",
              }
            : train
        )
      );
    }
  };

  const handleTrainClick = (trainId) => {
    setSelectedTrain(trainId);
    setShowTrainModal(true);
  };

  const handleTrainSelection = (trainId, isSelected) => {
    const train = trains.find((t) => t.id === trainId);
    if (train && train.status === "Unavailable") return;
    setSelectedTrains((prev) => {
      const s = new Set(prev);
      isSelected ? s.add(trainId) : s.delete(trainId);
      return s;
    });
  };

  const handleSelectAllAvailable = () => {
    setSelectedTrains(new Set(
      trains.filter((t) => t.status === "Available" && t.assignment === "Service")
        .slice(0, 14)
        .map((t) => t.id)
    ));
  };

  const handleClearAll = () => setSelectedTrains(new Set());

  const handleRerunSimulation = async () => {
    try {
      await MLDataService.refresh();
      await loadCSVData();
      alert("ML simulation completed! Fresh data loaded.");
    } catch (error) {
      alert(`Error running ML simulation: ${error.message}`);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "Train_ID","Status","ML_Score","Stabling_Bay","Branding_Priority","Mileage",
      "Last_Cleaned_Date","Assignment","Fitness_Certificate_Valid","Job_Card_Status",
      "Export_Timestamp",
    ];
    const csvRows = trains.map((train) => [
      train.id, train.status, train.score, train.stabling_bay, train.branding_priority,
      train.mileage, train.last_cleaned_date, train.assignment, train.fitness_certificate_valid,
      train.job_card_status, new Date().toISOString(),
    ]);
    const csvContent = [headers, ...csvRows].map((r) => r.map((f) => `"${f}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `train_schedule_export_${new Date().toISOString().split("T")[0]}.csv`;
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    alert(`Exported ${trains.length} train records.`);
  };

  const handleScheduleMaintenance = () => {
    const now = new Date();
    const randomDays = Math.floor(Math.random() * 3) + 1;
    const randomHours = Math.floor(Math.random() * 8) + 8;
    const scheduled = new Date(now.getTime() + randomDays * 86400000);
    scheduled.setHours(randomHours, 0, 0, 0);
    alert(
      `Maintenance scheduled for ${scheduled.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} at ${scheduled.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}.`
    );
    setShowReasonModal(false);
  };

  const handleConfirmSelection = async () => {
    const trainIds = Array.from(selectedTrains);
    // Try to create schedule via API (shared with WhatsApp bot)
    try {
      const resp = await fetch('/schedule/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ train_ids: trainIds, mode: 'manual', created_by: 'web_admin' }),
      });
      const data = await resp.json();
      if (!data.success) {
        alert(data.error || 'Failed to create schedule');
        return;
      }
    } catch {
      // API unavailable — fall back to localStorage only
    }
    // Save to localStorage as well for immediate Dashboard use
    localStorage.setItem('scheduled_train_ids', JSON.stringify(trainIds));
    localStorage.setItem('schedule_timestamp', new Date().toISOString());
    // Navigate to dashboard with deployment success flag
    navigate('/dashboard', { state: { showDeploymentSuccess: true, scheduledCount: selectedTrains.size } });
  };

  const selectedTrainData = trains.find((t) => t.id === selectedTrain);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar currentPage={currentPage} onPageChange={handleNavbarNavigation} />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <XCircle className="h-8 w-8 mx-auto mb-4 text-red-600" />
            <p className="text-red-600 mb-4">{error}</p>
            <button onClick={loadCSVData} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              {t("retry")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Navbar */}
      <Navbar currentPage={currentPage} onPageChange={handleNavbarNavigation} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Schedule Lockout Banner */}
        {scheduleLocked && activeSchedule && (
          <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded-xl flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-amber-800 dark:text-amber-200">Schedule Already Active</p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                A schedule with {activeSchedule.train_ids?.length || 0} trains is currently active
                (created {new Date(activeSchedule.created_at).toLocaleString()}).
                Trains must return to depot before a new schedule can be created.
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <img src="/metro-logo.png" alt="Kochi Metro Logo" className="h-12 w-12 object-contain" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("scheduleTrainInduction")}</h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">{t("selectAndDeployTrains")}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{t("systemOnline")}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{t("iotActive")}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 dark:text-gray-400">{t("lastUpdated")}</div>
                <div className="text-xs font-medium text-gray-900 dark:text-gray-100">{new Date().toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end items-center">
            <div className="flex gap-2 sm:gap-4 flex-wrap">
              <button
                onClick={handleRerunSimulation}
                className="px-4 sm:px-6 py-2 bg-white text-black border-2 border-black rounded-none hover:bg-black hover:text-white transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                {t("rerunSimulation")}
              </button>
              <button
                onClick={handleExportCSV}
                className="px-4 sm:px-6 py-2 bg-white text-black border-2 border-black rounded-none hover:bg-black hover:text-white transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                {t("exportCsv")}
              </button>
            </div>
          </div>
        </div>

        {/* Train Table */}
        <div className="mb-8 bg-white/70 backdrop-blur-sm border border-slate-200 rounded-xl shadow-sm p-6">
          <TrainTable
            trains={trains}
            selectedTrains={selectedTrains}
            onTrainClick={handleTrainClick}
            onUnavailableClick={handleUnavailableClick}
            onAvailableClick={handleAvailableClick}
            onTrainSelection={handleTrainSelection}
            t={t}
          />
        </div>

        {/* Selection Controls */}
        <div className="mb-8">
          <SelectionControls
            selectedTrains={selectedTrains}
            trains={trains}
            onSelectAllAvailable={handleSelectAllAvailable}
            onClearAll={handleClearAll}
            onConfirmSelection={handleConfirmSelection}
            t={t}
          />
        </div>

        {/* Confirmation Alert */}
        <ConfirmationAlert showConfirmation={showConfirmation} />

        {/* Constraints Modal */}
        <ConstraintsModal
          showConstraintsModal={showConstraintsModal}
          selectedTrainForConstraints={selectedTrainForConstraints}
          constraintChecks={constraintChecks}
          onClose={() => setShowConstraintsModal(false)}
          onConstraintChange={handleConstraintChange}
          onScheduleMaintenance={handleScheduleMaintenance}
        />

        {/* Reason Modal */}
        <ReasonModal
          showReasonModal={showReasonModal}
          reasonText={reasonText}
          onClose={() => setShowReasonModal(false)}
          onScheduleMaintenance={handleScheduleMaintenance}
        />

        {/* Train Details Modal */}
        <TrainDetailsModal
          showTrainModal={showTrainModal}
          selectedTrainData={selectedTrainData}
          trainMetrics={trainMetrics}
          onClose={() => setShowTrainModal(false)}
        />

        {/* AI Chatbot */}
        <AIChatbot />
      </div>
    </div>
  );
}

export default SchedulePage;
