import React, { useEffect, useRef, useState } from "react";

export default function KMRLCleaningSupervisor() {
  const [cameraModalVisible, setCameraModalVisible] = useState(false);
  const html5QrCodeInstanceRef = useRef(null);
  const qrErrorRef = useRef(null);
  const qrReaderRef = useRef(null);
  const mobileCameraModalRef = useRef(null);

  // load html5-qrcode library once
  useEffect(() => {
    if (typeof window.Html5Qrcode === "undefined") {
      const s = document.createElement("script");
      s.src =
        "https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.10/minified/html5-qrcode.min.js";
      s.async = true;
      document.body.appendChild(s);
    }
  }, []);

  // Initialize date/time and focus trainId
  useEffect(() => {
    const now = new Date();
    const dateEl = document.getElementById("currentDate");
    const timeEl = document.getElementById("currentTime");
    if (dateEl) dateEl.value = now.toISOString().split("T")[0];
    if (timeEl) timeEl.value = now.toTimeString().slice(0, 5);
    const trainEl = document.getElementById("trainId");
    if (trainEl) trainEl.focus();

    console.log(
      "🌿 Kochi Metro Cleaning Supervisor Interface initialized at:",
      now.toLocaleString()
    );
  }, []);

  // Camera modal open/close helpers
  function openCameraModal() {
    setCameraModalVisible(true);
    // start scanner shortly after modal opens
    setTimeout(() => {
      startQrScanner();
    }, 200);
  }

  function closeCameraModal() {
    setCameraModalVisible(false);
    stopQrScanner();
  }

  // QR scanner start / stop
  function startQrScanner() {
    const qrErrorEl = document.getElementById("qr-error");
    if (qrErrorEl) qrErrorEl.textContent = "";
    if (typeof window.Html5Qrcode === "undefined") {
      if (qrErrorEl)
        qrErrorEl.textContent = "Camera library failed to load.";
      return;
    }

    if (html5QrCodeInstanceRef.current) {
      html5QrCodeInstanceRef.current
        .stop()
        .catch(() => {
          /* ignore */
        })
        .finally(() => {
          html5QrCodeInstanceRef.current = null;
        });
    }

    try {
      // create new instance
      html5QrCodeInstanceRef.current = new window.Html5Qrcode("qr-reader");

      html5QrCodeInstanceRef.current
        .start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: 250,
            formatsToSupport: [
              window.Html5QrcodeSupportedFormats?.QR_CODE,
              window.Html5QrcodeSupportedFormats?.CODE_128,
              window.Html5QrcodeSupportedFormats?.EAN_13,
            ].filter(Boolean),
          },
          (qrCodeMessage) => {
            const cleaningCodeEl = document.getElementById("cleaningCode");
            if (cleaningCodeEl) cleaningCodeEl.value = qrCodeMessage;
            closeCameraModal();
          },
          (errorMessage) => {
            // show frame-level errors if modal still open
            const cameraModalEl = document.getElementById("cameraModal");
            if (cameraModalEl && cameraModalEl.style.display === "flex") {
              const qrError = document.getElementById("qr-error");
              if (qrError) qrError.textContent = errorMessage;
            }
          }
        )
        .catch((err) => {
          const qrError = document.getElementById("qr-error");
          if (qrError) qrError.textContent = "Camera error: " + err;
        });
    } catch (err) {
      const qrError = document.getElementById("qr-error");
      if (qrError) qrError.textContent = "Camera error: " + err;
    }
  }

  function stopQrScanner() {
    if (html5QrCodeInstanceRef.current) {
      html5QrCodeInstanceRef.current
        .stop()
        .then(() => {
          try {
            html5QrCodeInstanceRef.current.clear();
          } catch (e) {}
          html5QrCodeInstanceRef.current = null;
        })
        .catch(() => {
          html5QrCodeInstanceRef.current = null;
        });
    }
  }

  // "Simulated" scan actions (preserves original behavior)
  function scanQR() {
    // keep behavior consistent with original
    showLoading("🌿 Eco-Scanner activated...");
    setTimeout(() => {
      window.alert(
        "📱 Green QR Scanner Ready\n\n🌿 Eco-friendly scanning technology activated!\n(In production: Camera interface would open here)"
      );
    }, 1000);
  }

  function scanBarcode() {
    showLoading("🌱 Barcode Scanner activated...");
    setTimeout(() => {
      window.alert(
        "📊 Green Barcode Scanner Ready\n\n🍃 Sustainable scanning mode enabled!\n(In production: Camera interface would open here)"
      );
    }, 1000);
  }

  function scanTrainQR() {
    // Use mobile camera modal for better mobile experience
    if (/Mobi|Android/i.test(navigator.userAgent)) {
      openMobileCamera();
    } else {
      // Fallback simulation for desktop
      showLoading("🚊 Scanning eco-train...");
      setTimeout(() => {
        const trainIds = [
          "KM-ECO01",
          "KM-GREEN02",
          "KM-LEAF03",
          "KM-NATURE04",
          "KM-FOREST05",
          "KM-BAMBOO06",
        ];
        const randomTrainId =
          trainIds[Math.floor(Math.random() * trainIds.length)];
        const trainInput = document.getElementById("trainId");
        if (trainInput) trainInput.value = randomTrainId;
        window.alert(
          "✅ Green Train scanned successfully! 🌿\n\nTrain ID: " +
            randomTrainId +
            "\n🍃 Eco-friendly metro unit detected"
        );
      }, 1500);
    }
  }

  // mobile camera integration placeholder (expects mobileCameraModal to be on window)
  function openMobileCamera() {
    const mobileCameraModal = window.mobileCameraModal;
    if (!mobileCameraModal) {
      window.alert("Mobile camera modal is not available.");
      return;
    }

    if (typeof mobileCameraModal.onCapture === "function") {
      mobileCameraModal.onCapture(function (photoData) {
        console.log("Cleaning photo captured:", photoData);
        window.alert("🌿 Eco-cleaning photo captured successfully!");
      });
    }

    if (typeof mobileCameraModal.onQRScan === "function") {
      mobileCameraModal.onQRScan(function (qrData) {
        const trainInput = document.getElementById("trainId");
        if (trainInput) trainInput.value = qrData;
        if (typeof mobileCameraModal.close === "function") mobileCameraModal.close();
        window.alert(
          "✅ Green Train scanned successfully! 🌿\n\nTrain ID: " + qrData + "\n🍃 Eco-friendly metro unit detected"
        );
      });
    }

    mobileCameraModal.open && mobileCameraModal.open({ title: "🌿 Eco-Cleaning Camera", facingMode: "environment" });
  }

  // small helper showLoading that uses console (keeps original semantics)
  function showLoading(msg) {
    console.log(msg);
  }

  // Task status & quality management (copied logic from original)
  let currentStatus = useRef("");
  let qualityResultRef = useRef("");
  let startTimestampRef = useRef(null);
  let completionTimestampRef = useRef(null);

  function setStatus(status, e) {
    // Remove previous selection
    document.querySelectorAll(".status-btn").forEach((btn) => {
      btn.classList.remove("selected");
    });

    // Add selection to clicked button
    const target = e?.currentTarget || e?.target || window.event?.target;
    if (target) target.classList.add("selected");
    currentStatus.current = status;

    // Timestamps
    const now = new Date();
    const customDate = document.getElementById("currentDate")?.value;
    const customTime = document.getElementById("currentTime")?.value;

    let displayTime;
    if (customDate && customTime) {
      displayTime = new Date(customDate + "T" + customTime);
    } else {
      displayTime = now;
    }

    const timeString = displayTime.toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    if (status === "in-progress" && !startTimestampRef.current) {
      startTimestampRef.current = displayTime;
      const startEl = document.getElementById("startTime");
      if (startEl)
        startEl.innerHTML = `
          <div>🌅 Green Cleaning Started:</div>
          <div style="font-size: 16px; margin-top: 4px;">${timeString}</div>
          <div style="font-size: 12px; opacity: 0.8; margin-top: 4px;">🌿 Eco-mode activated</div>
        `;
    } else if (status === "completed" && startTimestampRef.current) {
      completionTimestampRef.current = displayTime;
      const completionEl = document.getElementById("completionTime");
      if (completionEl) {
        const duration = Math.round((displayTime - startTimestampRef.current) / 60000);
        completionEl.innerHTML = `
          <div>🌳 Green Mission Completed:</div>
          <div style="font-size: 16px; margin-top: 4px;">${timeString}</div>
          <div style="font-size: 12px; opacity: 0.8; margin-top: 4px;">🍃 Duration: ${duration} mins | Eco-clean finished</div>
        `;
      }
    }
  }

  function setQuality(quality, e) {
    document.querySelectorAll(".quality-option").forEach((opt) => {
      opt.classList.remove("selected");
    });

    const target = e?.currentTarget || e?.target || window.event?.target;
    if (target) target.classList.add("selected");
    qualityResultRef.current = quality;
  }

  // Form submit and clear - adapted from original but valid JS
  function submitForm() {
    const trainId = document.getElementById("trainId")?.value;
    const cleaningType = document.getElementById("cleaningType")?.value;
    const assignedStaff = document.getElementById("assignedStaff")?.value;
    const bayLocation = document.getElementById("bayLocation")?.value;

    if (!trainId || !cleaningType || !assignedStaff || !bayLocation || !currentStatus.current) {
      window.alert(
        "🌿 Please complete all green fields:\n\n• 🚂 Train ID\n• 🧹 Cleaning Type\n• 👥 Assigned Staff\n• 🚉 Bay Location\n• ✅ Cleaning Status\n\n🍃 Help us maintain our eco-standards!"
      );
      return;
    }

    const formData = {
      supervisorId: "CS2024-007",
      supervisorName: "Priya Nair",
      customDate: document.getElementById("currentDate")?.value,
      customTime: document.getElementById("currentTime")?.value,
      trainId: trainId,
      cleaningType: cleaningType,
      assignedStaff: assignedStaff,
      bayLocation: bayLocation,
      cleaningStatus: currentStatus.current,
      startTime: startTimestampRef.current?.toISOString(),
      completionTime: completionTimestampRef.current?.toISOString(),
      qualityResult: qualityResultRef.current,
      supervisorNotes: document.getElementById("supervisorNotes")?.value,
      submissionTime: new Date().toISOString(),
      ecoMode: true,
    };

    try {
      // Metro collector expected on window
      const metroDataCollector = window.metroDataCollector;
      let collectedData = formData;
      if (metroDataCollector && typeof metroDataCollector.collectCleaningData === "function") {
        collectedData = metroDataCollector.collectCleaningData(formData);
      } else {
        console.warn("metroDataCollector not available: falling back to local log");
      }

      console.log("🌿 Data collected successfully:", collectedData);

      const duration =
        startTimestampRef.current && completionTimestampRef.current
          ? Math.round((completionTimestampRef.current - startTimestampRef.current) / 60000)
          : 0;

      // fixed alert string formatting to valid template literal
      window.alert(
        `🌿 Green cleaning assignment submitted successfully! 🚊

🚂 Train: ${trainId}
🧹 Type: ${cleaningType}
👥 Staff: ${assignedStaff}
🚉 Bay: ${bayLocation}
📊 Status: ${currentStatus.current}
🎯 Quality: ${qualityResultRef.current || "Pending assessment"}
${duration ? "⏱ Duration: " + duration + " minutes\n" : ""}
🍃 Contributing to Kochi's sustainable transport future!
📈 Data logged for green analytics and eco-reporting.
📊 Data saved to centralized system!

Thank you for supporting eco-friendly metro operations! 🌱🚆`
      );

      clearForm();
    } catch (error) {
      console.error("Error collecting data:", error);
      window.alert("❌ Error saving data. Please try again.");
    }
  }

  function clearForm() {
    const now = new Date();
    const trainId = document.getElementById("trainId");
    const cleaningType = document.getElementById("cleaningType");
    const assignedStaff = document.getElementById("assignedStaff");
    const bayLocation = document.getElementById("bayLocation");
    const currentDate = document.getElementById("currentDate");
    const currentTime = document.getElementById("currentTime");
    const startTimeEl = document.getElementById("startTime");
    const completionTimeEl = document.getElementById("completionTime");
    const notes = document.getElementById("supervisorNotes");

    if (trainId) trainId.value = "";
    if (cleaningType) cleaningType.value = "";
    if (assignedStaff) assignedStaff.value = "";
    if (bayLocation) bayLocation.value = "";
    if (currentDate) currentDate.value = now.toISOString().split("T")[0];
    if (currentTime) currentTime.value = now.toTimeString().slice(0, 5);
    if (startTimeEl) startTimeEl.innerHTML = 'Click "In Progress" to record start time';
    if (completionTimeEl) completionTimeEl.innerHTML = 'Click "Completed" to record completion time';
    if (notes) notes.value = "";

    currentStatus.current = "";
    qualityResultRef.current = "";
    startTimestampRef.current = null;
    completionTimestampRef.current = null;

    document.querySelectorAll(".status-btn").forEach((btn) => btn.classList.remove("selected"));
    document.querySelectorAll(".quality-option").forEach((opt) => opt.classList.remove("selected"));

    console.log("🌿 Kochi Metro Cleaning Supervisor Form cleared.");
  }

  // UI JSX - structure kept very close to original, converted to JSX props/handlers
  return (
    <div>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body, #root { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; }
        body { background: linear-gradient(135deg, #2d5016 0%, #3e6b23 25%, #5c8a3a 50%, #7ba047 75%, #87b653 100%); background-attachment: fixed; min-height: 100vh; padding: 10px; line-height: 1.6; position: relative; }
        body::before { content: ''; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234a7c59' fill-opacity='0.05'%3E%3Cpath d='M20 20l20 20-20 20z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"), radial-gradient(circle at 20% 20%, rgba(139, 195, 74, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(76, 175, 80, 0.1) 0%, transparent 50%), linear-gradient(135deg, rgba(46, 125, 50, 0.05) 0%, rgba(129, 199, 132, 0.05) 100%); pointer-events: none; z-index: -1; }
        .railway-pattern { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-image: repeating-linear-gradient(90deg, transparent, transparent 48px, rgba(255,255,255,0.02) 48px, rgba(255,255,255,0.02) 52px); pointer-events: none; z-index: -1; }
        .container { max-width: 420px; margin: 0 auto; background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border-radius: 20px; box-shadow: 0 25px 50px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.1); overflow: hidden; animation: slideUp 0.8s ease-out; border: 2px solid rgba(139, 195, 74, 0.2); }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .header { background: linear-gradient(135deg, #2e7d32 0%, #388e3c 50%, #4caf50 100%); color: white; padding: 25px 20px; text-align: center; position: relative; overflow: hidden; }
        .header::before { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 70% 70%, rgba(255,255,255,0.05) 0%, transparent 40%); pointer-events: none; }
        .header::after { content: '🌿 🚊 🌿'; position: absolute; top: 10px; right: 15px; font-size: 14px; opacity: 0.7; }
        .header h1 { font-size: 20px; margin-bottom: 10px; font-weight: 700; position: relative; z-index: 2; text-shadow: 0 2px 4px rgba(0,0,0,0.3); }
        .supervisor-info { background: rgba(255,255,255,0.15); padding: 15px; border-radius: 12px; margin-top: 12px; position: relative; z-index: 2; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2); }
        .supervisor-info div { font-size: 14px; margin-bottom: 5px; display: flex; justify-content: space-between; align-items: center; }
        .datetime-controls { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; }
        .datetime-input { background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 8px; border-radius: 8px; font-size: 12px; text-align: center; }
        .scan-section { display: flex; gap: 12px; margin-top: 15px; position: relative; z-index: 2; }
        .scan-btn { flex: 1; background: rgba(255,255,255,0.2); border: 2px solid rgba(255,255,255,0.3); color: white; padding: 12px 8px; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; backdrop-filter: blur(10px); }
        .scan-btn:hover { background: rgba(255,255,255,0.3); transform: translateY(-2px); }
        .form-section { padding: 25px; border-bottom: 1px solid rgba(76, 175, 80, 0.1); background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,255,248,0.9) 100%); }
        .section-title { font-size: 18px; font-weight: 700; color: #2e7d32; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; position: relative; }
        .section-title::after { content: ''; flex: 1; height: 2px; background: linear-gradient(90deg, #4caf50, rgba(76, 175, 80, 0.2)); border-radius: 1px; }
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; font-size: 14px; font-weight: 600; color: #2e7d32; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }
        .form-control { width: 100%; padding: 15px; border: 2px solid rgba(76, 175, 80, 0.2); border-radius: 12px; font-size: 16px; transition: all 0.3s ease; background: rgba(255,255,255,0.9); font-family: inherit; }
        .form-control:focus { outline: none; border-color: #4caf50; background: white; box-shadow: 0 0 0 4px rgba(76, 175, 80, 0.1); }
        .train-id-group { display: flex; gap: 12px; align-items: end; }
        .train-id-input { flex: 1; }
        .train-id-input .form-control { padding: 12px; }
        .qr-scan-btn { background: linear-gradient(135deg, #2e7d32, #4caf50); color: white; border: none; padding: 15px 20px; border-radius: 12px; font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3); }
        .qr-scan-btn:hover { background: linear-gradient(135deg, #388e3c, #66bb6a); transform: translateY(-2px); }
        .status-buttons { display: flex; gap: 10px; margin-top: 10px; }
        .status-btn { flex: 1; padding: 15px 10px; border: 2px solid rgba(76, 175, 80, 0.3); border-radius: 12px; background: rgba(255,255,255,0.7); cursor: pointer; text-align: center; font-size: 13px; font-weight: 600; transition: all 0.3s ease; }
        .status-btn.not-started { border-color: #ff9800; color: #f57c00; }
        .status-btn.in-progress { border-color: #2196f3; color: #1565c0; }
        .status-btn.completed { border-color: #4caf50; color: #2e7d32; }
        .status-btn.selected.not-started { background: linear-gradient(135deg, #ff9800, #ffb74d); color: white; box-shadow: 0 4px 15px rgba(255, 152, 0, 0.3); }
        .status-btn.selected.in-progress { background: linear-gradient(135deg, #2196f3, #64b5f6); color: white; box-shadow: 0 4px 15px rgba(33, 150, 243, 0.3); }
        .status-btn.selected.completed { background: linear-gradient(135deg, #4caf50, #81c784); color: white; box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3); }
        .timestamp-display { background: linear-gradient(135deg, #2e7d32, #4caf50); color: white; padding: 12px 15px; border-radius: 10px; text-align: center; font-weight: 600; font-size: 14px; margin-top: 10px; box-shadow: 0 4px 15px rgba(76, 175, 80, 0.2); }
        .textarea { min-height: 100px; resize: vertical; font-family: inherit; }
        .quality-options { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 10px; }
        .quality-option { text-align: center; padding: 20px 15px; border: 2px solid rgba(76, 175, 80, 0.3); border-radius: 12px; cursor: pointer; transition: all 0.3s ease; font-weight: 600; background: rgba(255,255,255,0.7); }
        .quality-option.ok { border-color: #4caf50; color: #2e7d32; }
        .quality-option.rework { border-color: #ff5722; color: #d84315; }
        .quality-option.selected.ok { background: linear-gradient(135deg, #4caf50, #81c784); color: white; box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3); }
        .quality-option.selected.rework { background: linear-gradient(135deg, #ff5722, #ff8a65); color: white; box-shadow: 0 4px 15px rgba(255, 87, 34, 0.3); }
        .submit-section { padding: 25px; display: flex; gap: 15px; background: linear-gradient(135deg, rgba(232,245,233,0.9), rgba(200,230,201,0.9)); }
        .btn { flex: 1; padding: 18px 15px; border: none; border-radius: 12px; font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.3s ease; font-family: inherit; }
        .btn:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,0,0,0.15); }
        .btn-primary { background: linear-gradient(135deg, #2e7d32, #4caf50); color: white; box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3); }
        .btn-secondary { background: linear-gradient(135deg, #757575, #9e9e9e); color: white; box-shadow: 0 4px 15px rgba(158, 158, 158, 0.3); }
        @media (max-width: 480px) { .container { margin: 5px; border-radius: 15px; } .status-buttons { flex-direction: column; } .scan-section { flex-direction: column; } .quality-options { grid-template-columns: 1fr; } .datetime-controls { grid-template-columns: 1fr; } }
        @keyframes leafFloat { 0%, 100% { transform: translateY(0px) rotate(0deg); } 25% { transform: translateY(-5px) rotate(1deg); } 50% { transform: translateY(-3px) rotate(-1deg); } 75% { transform: translateY(-7px) rotate(2deg); } }
        .section-title::before { content: '🌱'; animation: leafFloat 3s ease-in-out infinite; }
      `}</style>

      <div className="railway-pattern" />

      <div className="container">
        <div className="header">
          <h1>🌿 Kochi Metro Cleaning Hub 🚊</h1>
          <div className="supervisor-info">
            <div>
              <strong>Supervisor ID:</strong> <span>CS2024-007</span>
            </div>
            <div>
              <strong>Name:</strong> <span>Priya Nair</span>
            </div>
            <div>
              <strong>Shift:</strong> <span>Day (07:00 - 19:00)</span>
            </div>

            <div className="datetime-controls">
              <input type="date" id="currentDate" className="datetime-input" />
              <input type="time" id="currentTime" className="datetime-input" />
            </div>
          </div>

          <div className="scan-section">
            <button className="scan-btn" onClick={scanQR}>
              📱 QR Scan
            </button>
            <button className="scan-btn" onClick={scanBarcode}>
              📊 Barcode Scan
            </button>
          </div>
        </div>

        {/* Section 1 */}
        <div className="form-section">
          <div className="section-title">📋 Section 1: Cleaning Assignment</div>

          <div className="form-group">
            <label htmlFor="trainId">🚂 Train ID</label>
            <div className="train-id-group">
              <div className="train-id-input">
                <input type="text" id="trainId" className="form-control" placeholder="Enter Train ID" />
              </div>
              <button className="qr-scan-btn" onClick={scanTrainQR}>
                🌿 Scan
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="cleaningType">🧹 Cleaning Type</label>
            <select id="cleaningType" className="form-control">
              <option value="">Select cleaning type</option>
              <option value="routine-daily">🌅 Routine daily clean</option>
              <option value="weekly-detailing">📅 Weekly detailing</option>
              <option value="pest-control">🦟 Pest control / disinfection</option>
              <option value="emergency-spot">⚡ Emergency spot clean</option>
              <option value="deep-sanitization">🧼 Deep sanitization</option>
              <option value="eco-green-clean">🌱 Eco-friendly green clean</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="assignedStaff">👥 Assigned Staff</label>
            <select id="assignedStaff" className="form-control">
              <option value="">Select cleaning staff</option>
              <option value="staff-001">🌿 Ravi Kumar (ID: 001)</option>
              <option value="staff-002">🍃 Lakshmi Devi (ID: 002)</option>
              <option value="staff-003">🌱 Suresh Babu (ID: 003)</option>
              <option value="staff-004">🌳 Meera Nair (ID: 004)</option>
              <option value="staff-005">🍀 Arun Prasad (ID: 005)</option>
              <option value="staff-006">🌾 Sindhu Thomas (ID: 006)</option>
              <option value="staff-007">🌿 Rajesh Menon (ID: 007)</option>
              <option value="staff-008">🍃 Kavitha Pillai (ID: 008)</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="bayLocation">🚉 Bay Location</label>
            <select id="bayLocation" className="form-control">
              <option value="">Select bay location</option>
              <option value="bay-1">🌿 Bay 1 - Main Terminal</option>
              <option value="bay-2">🍃 Bay 2 - Platform A</option>
              <option value="bay-3">🌱 Bay 3 - Platform B</option>
              <option value="bay-4">🌳 Bay 4 - Express Line</option>
              <option value="bay-5">🍀 Bay 5 - Maintenance</option>
              <option value="bay-6">🌾 Bay 6 - Storage</option>
              <option value="stabling-line-1">🚊 Stabling Line 1</option>
              <option value="stabling-line-2">🚃 Stabling Line 2</option>
              <option value="stabling-line-3">🚋 Stabling Line 3</option>
              <option value="depot-area">🏢 Depot Area</option>
              <option value="washing-bay">💧 Washing Bay</option>
            </select>
          </div>
        </div>

        {/* Section 2 */}
        <div className="form-section">
          <div className="section-title">⏱ Section 2: Task Status</div>

          <div className="form-group">
            <label>✅ Cleaning Status</label>
            <div className="status-buttons">
              <div className="status-btn not-started" onClick={(e) => setStatus("not-started", e)}>
                🌅
                <br />
                Not Started
              </div>
              <div className="status-btn in-progress" onClick={(e) => setStatus("in-progress", e)}>
                🌿
                <br />
                In Progress
              </div>
              <div className="status-btn completed" onClick={(e) => setStatus("completed", e)}>
                🌳
                <br />
                Completed
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>🌅 Start Time</label>
            <div className="timestamp-display" id="startTime">
              Click "In Progress" to record start time
            </div>
          </div>

          <div className="form-group">
            <label>🌇 Completion Time</label>
            <div className="timestamp-display" id="completionTime">
              Click "Completed" to record completion time
            </div>
          </div>
        </div>

        {/* Section 3 */}
        <div className="form-section">
          <div className="section-title">🔍 Section 3: Quality & Notes</div>

          <div className="form-group">
            <label>🎯 Quality Check Result</label>
            <div className="quality-options">
              <div className="quality-option ok" onClick={(e) => setQuality("ok", e)}>
                🌿
                <br />
                <strong>Green Quality</strong>
                <br />
                Eco-Standard Approved
              </div>
              <div className="quality-option rework" onClick={(e) => setQuality("rework", e)}>
                🔄
                <br />
                <strong>Needs Care</strong>
                <br />
                Requires Attention
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="supervisorNotes">📝 Supervisor Notes</label>
            <textarea
              id="supervisorNotes"
              className="form-control textarea"
              placeholder="🌿 Enter detailed notes about cleaning quality, eco-friendly practices used, staff performance, areas of concern, or additional observations about maintaining our green railway standards..."
            />
          </div>
        </div>

        {/* Section 4 */}
        <div className="submit-section">
          <button className="btn btn-primary" onClick={submitForm}>
            🌿 Save & Submit
          </button>
          <button className="btn btn-secondary" onClick={clearForm}>
            🔄 Clear Form
          </button>
        </div>
      </div>

      {/* Camera Modal */}
      <div
        id="cameraModal"
        style={{
          display: cameraModalVisible ? "flex" : "none",
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(0,0,0,0.85)",
          zIndex: 9999,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: 20,
            padding: "30px 20px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            maxWidth: "95vw",
            maxHeight: "80vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <h2 style={{ marginBottom: 10, color: "#2E7D32" }}>Scan Cleaning QR/Barcode</h2>
          <div id="qr-reader" ref={qrReaderRef} style={{ width: 320, maxWidth: "90vw" }} />
          <div id="qr-error" ref={qrErrorRef} style={{ color: "#d32f2f", marginTop: 10 }} />
          <button
            onClick={closeCameraModal}
            style={{
              marginTop: 20,
              background: "#d32f2f",
              color: "white",
              border: "none",
              padding: "10px 30px",
              borderRadius: 15,
              fontSize: 16,
              cursor: "pointer",
            }}
          >
            ❌ Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
