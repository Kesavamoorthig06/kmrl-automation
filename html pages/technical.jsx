import React, { useEffect, useRef, useState } from "react";

/**
 * OperationsInterface.jsx
 * - Faithful JSX conversion of the provided HTML page.
 * - Preserves IDs and classNames so existing integrations/scripts keep working.
 * - Inline JS logic kept as functions inside the component; still uses some DOM APIs
 *   to remain compatible with the original structure/behaviour.
 *
 * Save as: OperationsInterface.jsx
 */

export default function OperationsInterface() {
  const [successVisible, setSuccessVisible] = useState(false);
  const selectedConditionRef = useRef("");
  const photoPreviewRef = useRef(null);

  useEffect(() => {
    // Expose selectedCondition for any external code that expects it
    window.selectedCondition = selectedConditionRef.current;

    // Focus train input on mount
    const trainEl = document.getElementById("trainId");
    if (trainEl) trainEl.focus();

    console.log("Form initialized at:", new Date().toLocaleString());

    return () => {
      window.selectedCondition = undefined;
    };
  }, []);

  // Calculate mileage
  function calculateMileage() {
    const startOdo = parseFloat(document.getElementById("startOdometer").value) || 0;
    const endOdo = parseFloat(document.getElementById("endOdometer").value) || 0;

    const endErrorEl = document.getElementById("endOdometerError");
    const dailyMileageEl = document.getElementById("dailyMileage");

    if (endOdo < startOdo) {
      if (endErrorEl) endErrorEl.textContent = "End reading cannot be less than start reading";
      if (dailyMileageEl) dailyMileageEl.textContent = "0.0 km";
      return;
    } else {
      if (endErrorEl) endErrorEl.textContent = "";
    }

    const mileage = endOdo > startOdo ? (endOdo - startOdo).toFixed(1) : "0.0";
    if (dailyMileageEl) dailyMileageEl.textContent = mileage + " km";
  }

  // Toggle severity selection
  function toggleSeverity(element, type) {
    // element passed from onClick as e.currentTarget
    const checkbox = element.querySelector('input[type="checkbox"]');
    if (!checkbox) return;
    checkbox.checked = !checkbox.checked;

    if (checkbox.checked) {
      element.classList.add("checked");
    } else {
      element.classList.remove("checked");
    }

    toggleDefectDetails();
  }

  // Show/hide defect details
  function toggleDefectDetails() {
    const defectCategory = document.getElementById("defectCategory");
    const hasDefects =
      (defectCategory && defectCategory.value !== "") ||
      (document.getElementById("severity-info") && document.getElementById("severity-info").checked) ||
      (document.getElementById("severity-minor") && document.getElementById("severity-minor").checked) ||
      (document.getElementById("severity-major") && document.getElementById("severity-major").checked);

    const detailsGroup = document.getElementById("defectDetailsGroup");
    if (detailsGroup) {
      detailsGroup.style.display = hasDefects ? "block" : "none";
    }
  }

  // Handle photo upload
  function handlePhotoUpload(e) {
    const input = e.target;
    const file = input.files && input.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      window.alert("Please select an image file");
      input.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      window.alert("Image must be less than 5MB");
      input.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = function (ev) {
      const preview = document.getElementById("photoPreview");
      if (!preview) return;
      preview.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px; padding: 10px; background: #f8f9fa; border-radius: 6px;">
            <img src="${ev.target.result}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">
            <div>
                <div style="font-size: 14px; font-weight: 500;">${file.name}</div>
                <div style="font-size: 12px; color: #666;">${(file.size / 1024).toFixed(1)} KB</div>
            </div>
            <button id="removePhotoBtn" style="margin-left: auto; background: #444444; color: white; border: none; border-radius: 4px; padding: 5px 10px; cursor: pointer;">Remove</button>
        </div>
      `;
      const removeBtn = document.getElementById("removePhotoBtn");
      if (removeBtn) removeBtn.addEventListener("click", removePhoto);
    };
    reader.readAsDataURL(file);
  }

  // Remove uploaded photo
  function removePhoto() {
    const photoInput = document.getElementById("photoUpload");
    if (photoInput) photoInput.value = "";
    const preview = document.getElementById("photoPreview");
    if (preview) preview.innerHTML = "";
  }

  // Select condition
  function selectCondition(element, condition) {
    document.querySelectorAll(".condition-option").forEach((opt) => opt.classList.remove("selected"));
    element.classList.add("selected");
    selectedConditionRef.current = condition;
    window.selectedCondition = selectedConditionRef.current;
    const err = document.getElementById("conditionError");
    if (err) err.textContent = "";
  }

  // Field validation
  function validateField(fieldId) {
    const el = document.getElementById(fieldId);
    const errorEl = document.getElementById(fieldId + "Error");
    const value = el ? String(el.value).trim() : "";

    switch (fieldId) {
      case "trainId":
        if (!value) {
          if (errorEl) errorEl.textContent = "Train ID is required";
          return false;
        } else if (!/^KM-\d{4}$/.test(value)) {
          if (errorEl) errorEl.textContent = "Train ID must be in format KM-XXXX";
          return false;
        } else {
          if (errorEl) errorEl.textContent = "";
          return true;
        }
      case "startOdometer":
        if (!value) {
          if (errorEl) errorEl.textContent = "Start odometer is required";
          return false;
        } else if (Number(value) < 0) {
          if (errorEl) errorEl.textContent = "Value cannot be negative";
          return false;
        } else {
          if (errorEl) errorEl.textContent = "";
          calculateMileage();
          return true;
        }
      case "endOdometer": {
        const startOdo = parseFloat(document.getElementById("startOdometer").value) || 0;
        if (!value) {
          if (errorEl) errorEl.textContent = "End odometer is required";
          return false;
        } else if (Number(value) < 0) {
          if (errorEl) errorEl.textContent = "Value cannot be negative";
          return false;
        } else if (parseFloat(value) < startOdo) {
          if (errorEl) errorEl.textContent = "End reading cannot be less than start reading";
          return false;
        } else {
          if (errorEl) errorEl.textContent = "";
          calculateMileage();
          return true;
        }
      }
      case "defectDetails": {
        const hasDefects =
          (document.getElementById("defectCategory") &&
            document.getElementById("defectCategory").value !== "") ||
          (document.getElementById("severity-info") && document.getElementById("severity-info").checked) ||
          (document.getElementById("severity-minor") && document.getElementById("severity-minor").checked) ||
          (document.getElementById("severity-major") && document.getElementById("severity-major").checked);

        if (hasDefects && !value) {
          if (errorEl) errorEl.textContent = "Defect details are required when defects are reported";
          return false;
        } else {
          if (errorEl) errorEl.textContent = "";
          return true;
        }
      }
      default:
        return true;
    }
  }

  // Validate entire form
  function validateForm() {
    let isValid = true;
    if (!validateField("trainId")) isValid = false;
    if (!validateField("startOdometer")) isValid = false;
    if (!validateField("endOdometer")) isValid = false;

    const hasDefects =
      (document.getElementById("defectCategory") && document.getElementById("defectCategory").value !== "") ||
      (document.getElementById("severity-info") && document.getElementById("severity-info").checked) ||
      (document.getElementById("severity-minor") && document.getElementById("severity-minor").checked) ||
      (document.getElementById("severity-major") && document.getElementById("severity-major").checked);

    if (hasDefects && !validateField("defectDetails")) isValid = false;

    if (!selectedConditionRef.current) {
      const err = document.getElementById("conditionError");
      if (err) err.textContent = "Please select a condition assessment";
      isValid = false;
    } else {
      const err = document.getElementById("conditionError");
      if (err) err.textContent = "";
    }

    return isValid;
  }

  // Simulate API call
  function simulateAPICall(data) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() < 0.1) {
          reject(new Error("Network error. Please try again."));
        } else {
          resolve({ success: true, message: "Data saved successfully" });
        }
      }, 2000);
    });
  }

  // Read file as Data URL
  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Internal submit (simulated)
  async function submitForm() {
    if (!validateForm()) {
      window.alert("Please fix the errors in the form before submitting.");
      return;
    }

    const trainId = document.getElementById("trainId").value;
    const startOdo = document.getElementById("startOdometer").value;
    const endOdo = document.getElementById("endOdometer").value;
    const mileage = document.getElementById("dailyMileage").textContent;

    let photoData = null;
    const photoFile = document.getElementById("photoUpload").files[0];
    if (photoFile) photoData = await readFileAsDataURL(photoFile);

    const formData = {
      trainId,
      startOdometer: startOdo,
      endOdometer: endOdo,
      dailyMileage: mileage,
      severities: {
        info: document.getElementById("severity-info").checked,
        minor: document.getElementById("severity-minor").checked,
        major: document.getElementById("severity-major").checked,
      },
      defectCategory: document.getElementById("defectCategory").value,
      defectDetails: document.getElementById("defectDetails").value,
      finalCondition: selectedConditionRef.current,
      photo: photoData,
      timestamp: new Date().toISOString(),
      employeeId: "KM2024001",
    };

    const submitBtn = document.getElementById("submitBtn");
    const originalText = submitBtn ? submitBtn.textContent : "Submit";
    if (submitBtn) {
      submitBtn.innerHTML = '<span class="loading"></span> Submitting...';
      submitBtn.disabled = true;
    }

    try {
      await simulateAPICall(formData);
      const successMessageEl = document.getElementById("successMessage");
      if (successMessageEl) successMessageEl.classList.remove("hidden");
      window.scrollTo(0, 0);
      setTimeout(() => {
        const successMessageEl2 = document.getElementById("successMessage");
        if (successMessageEl2) successMessageEl2.classList.add("hidden");
      }, 5000);

      console.log("Form submitted successfully:", formData);
      setTimeout(clearForm, 3000);
    } catch (err) {
      console.error("Error submitting form:", err);
      window.alert("Error submitting form: " + err.message);
    } finally {
      if (submitBtn) {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    }
  }

  // Clear form
  function clearForm() {
    if (!window.confirm("Are you sure you want to clear all form data?")) return;

    const idsToClear = ["trainId", "startOdometer", "endOdometer", "defectCategory", "defectDetails", "photoUpload"];
    idsToClear.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });

    const dailyMileageEl = document.getElementById("dailyMileage");
    if (dailyMileageEl) dailyMileageEl.textContent = "0.0 km";

    document.querySelectorAll(".severity-checkbox").forEach((checkbox) => {
      checkbox.classList.remove("checked");
      const inp = checkbox.querySelector("input");
      if (inp) inp.checked = false;
    });

    const preview = document.getElementById("photoPreview");
    if (preview) preview.innerHTML = "";

    document.querySelectorAll(".condition-option").forEach((opt) => opt.classList.remove("selected"));
    selectedConditionRef.current = "";
    window.selectedCondition = "";

    const detailsGroup = document.getElementById("defectDetailsGroup");
    if (detailsGroup) detailsGroup.style.display = "none";

    document.querySelectorAll(".error-message").forEach((el) => (el.textContent = ""));

    const successEl = document.getElementById("successMessage");
    if (successEl) successEl.classList.add("hidden");

    const trainEl = document.getElementById("trainId");
    if (trainEl) trainEl.focus();
  }

  // Submit to Python backend (original behaviour)
  async function submitFormToPython() {
    // Collect all form data
    const formData = {
      trainId: document.getElementById("trainId").value,
      startOdometer: document.getElementById("startOdometer").value,
      endOdometer: document.getElementById("endOdometer").value,
      dailyMileage: document.getElementById("dailyMileage").textContent,
      severities: {
        info: document.getElementById("severity-info").checked,
        minor: document.getElementById("severity-minor").checked,
        major: document.getElementById("severity-major").checked,
      },
      defectCategory: document.getElementById("defectCategory").value,
      defectDetails: document.getElementById("defectDetails").value,
      finalCondition: window.selectedCondition || selectedConditionRef.current,
      timestamp: new Date().toISOString(),
      employeeId: "KM2024001",
    };

    try {
      const resp = await fetch("http://localhost:5000/save-json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: "technical", data: formData }),
      });

      if (!resp.ok) {
        throw new Error("Server error: " + resp.status);
      }
      const json = await resp.json();
      window.alert(json.message || "Saved");
    } catch (err) {
      window.alert("Error: " + err);
      console.error(err);
    }
  }

  return (
    <div>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f4f4; min-height: 100vh; padding: 10px; }
        .container { max-width: 400px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: #fff; color: #333; padding: 20px; text-align: center; border-bottom: 1px solid #e0e0e0; }
        .header h1 { font-size: 18px; margin-bottom: 8px; font-weight: 600; }
        .employee-info { background: #f8f9fa; padding: 12px; border-radius: 8px; margin-top: 10px; border: 1px solid #e0e0e0; }
        .employee-info div { font-size: 14px; margin-bottom: 4px; color: #333; }
        .scan-section { display: none; }
        .scan-btn { flex: 1; background: #666666; border: none; color: white; padding: 10px; border-radius: 6px; font-size: 12px; cursor: pointer; transition: background 0.3s; }
        .scan-btn:hover { background: #555555; }
        .form-section { padding: 20px; border-bottom: 1px solid #ecf0f1; }
        .form-section:last-child { border-bottom: none; }
        .section-title { font-size: 16px; font-weight: 600; color: #404040; margin-bottom: 15px; display: flex; align-items: center; gap: 8px; }
        .form-group { margin-bottom: 15px; }
        .form-group label { display: block; font-size: 14px; font-weight: 500; color: #505050; margin-bottom: 6px; }
        .form-control { width: 100%; padding: 12px; border: 2px solid #ecf0f1; border-radius: 8px; font-size: 16px; transition: border-color 0.3s; background: white; }
        .form-control:focus { outline: none; border-color: #666666; }
        .train-id-group { display: flex; gap: 10px; align-items: end; }
        .train-id-input { flex: 1; }
        .qr-scan-btn { display: none; }
        .mileage-display { background: linear-gradient(135deg, #666666, #555555); color: white; padding: 15px; border-radius: 8px; text-align: center; font-weight: 600; font-size: 18px; }
        .defect-checkboxes { display: flex; gap: 15px; margin-bottom: 15px; flex-wrap: wrap; }
        .severity-checkbox { display: flex; align-items: center; gap: 8px; padding: 10px 15px; border: 2px solid #ecf0f1; border-radius: 25px; cursor: pointer; transition: all 0.3s; font-size: 14px; font-weight: 500; flex: 1; }
        .severity-checkbox input[type="checkbox"] { width: 16px; height: 16px; margin: 0; }
        .severity-checkbox.checked.info { background: #888888; color: white; border-color: #888888; }
        .severity-checkbox.checked.minor { background: #666666; color: white; border-color: #666666; }
        .severity-checkbox.checked.major { background: #444444; color: white; border-color: #444444; }
        .textarea { min-height: 80px; resize: vertical; }
        .file-upload { position: relative; display: inline-block; cursor: pointer; width: 100%; }
        .file-upload input[type="file"] { position: absolute; opacity: 0; width: 100%; height: 100%; cursor: pointer; }
        .file-upload-label { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 12px; border: 2px dashed #666666; border-radius: 8px; color: #666666; font-weight: 500; background: rgba(102, 102, 102, 0.05); }
        .file-upload-label:hover { background: rgba(102, 102, 102, 0.1); }
        .condition-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-top: 10px; }
        .condition-option { text-align: center; padding: 15px 10px; border: 2px solid #ecf0f1; border-radius: 8px; cursor: pointer; transition: all 0.3s; font-size: 13px; font-weight: 500; }
        .condition-option.ok { border-color: #888888; color: #888888; }
        .condition-option.attention { border-color: #666666; color: #666666; }
        .condition-option.unsafe { border-color: #444444; color: #444444; }
        .condition-option.selected.ok { background: #888888; color: white; }
        .condition-option.selected.attention { background: #666666; color: white; }
        .condition-option.selected.unsafe { background: #444444; color: white; }
        .submit-section { padding: 20px; display: flex; gap: 15px; }
        .btn { flex: 1; padding: 15px; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; transition: transform 0.2s; }
        .btn:hover { transform: translateY(-1px); }
        .btn-primary { background: linear-gradient(135deg, #666666, #555555); color: white; }
        .btn-secondary { background: linear-gradient(135deg, #888888, #777777); color: white; }
        .hidden { display: none; }
        .error-message { color: #444444; font-size: 12px; margin-top: 5px; }
        .success-message { background: #666666; color: white; padding: 15px; border-radius: 8px; text-align: center; margin: 15px 0; }
        @media (max-width: 768px) {
          body { padding: 5px; }
          .container { max-width: 100%; margin: 0; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.15); }
          .header { padding: 15px; }
          .header h1 { font-size: 16px; }
          .employee-info { padding: 10px; font-size: 13px; }
          .form-section { padding: 15px; }
          .section-title { font-size: 15px; margin-bottom: 12px; }
          .form-group { margin-bottom: 12px; }
          .form-control { padding: 14px; font-size: 16px; border-radius: 6px; }
          .condition-grid { grid-template-columns: 1fr; gap: 8px; }
          .condition-option { padding: 18px 12px; font-size: 14px; min-height: 60px; display: flex; flex-direction: column; justify-content: center; align-items: center; }
          .defect-checkboxes { flex-direction: column; gap: 10px; }
          .severity-checkbox { padding: 12px 15px; font-size: 15px; min-height: 50px; display: flex; align-items: center; justify-content: center; }
          .submit-section { padding: 15px; flex-direction: column; gap: 10px; }
          .btn { padding: 16px; font-size: 16px; min-height: 50px; }
          .mileage-display { padding: 12px; font-size: 16px; }
          .file-upload-label { padding: 15px; font-size: 15px; min-height: 50px; }
          .error-message { font-size: 13px; margin-top: 8px; font-weight: 500; }
        }
        @media (max-width: 480px) {
          .container { border-radius: 8px; }
          .header { padding: 12px; }
          .header h1 { font-size: 15px; }
          .employee-info { padding: 8px; font-size: 12px; }
          .form-section { padding: 12px; }
          .section-title { font-size: 14px; }
          .form-control { padding: 12px; font-size: 16px; }
          .condition-option { padding: 15px 10px; font-size: 13px; min-height: 55px; }
          .severity-checkbox { padding: 10px 12px; font-size: 14px; min-height: 45px; }
          .btn { padding: 14px; font-size: 15px; min-height: 45px; }
        }
      `}</style>

      <div className="container">
        <div className="header">
          <h1>🚊 Kochi Metro Operations</h1>
          <div className="employee-info">
            <div><strong>Employee ID:</strong> KM2024001</div>
            <div><strong>Name:</strong> Rajesh Kumar</div>
            <div><strong>Shift:</strong> Morning (06:00 - 14:00)</div>
          </div>
        </div>

        <div id="successMessage" className={`success-message ${successVisible ? "" : "hidden"}`}>
          ✅ Data submitted successfully!
        </div>

        <div className="form-section">
          <div className="section-title">🚂 Section 1: Train & Mileage</div>

          <div className="form-group">
            <label htmlFor="trainId">Train ID <span className="error-message" id="trainIdError"></span></label>
            <div className="train-id-group">
              <div className="train-id-input">
                <input
                  type="text"
                  id="trainId"
                  className="form-control"
                  placeholder="Enter Train ID"
                  onInput={() => { calculateMileage(); validateField("trainId"); }}
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="startOdometer">Start Odometer (km) <span className="error-message" id="startOdometerError"></span></label>
            <input
              type="number"
              id="startOdometer"
              className="form-control"
              placeholder="Enter start reading"
              step="0.1"
              onInput={() => { calculateMileage(); validateField("startOdometer"); }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="endOdometer">End Odometer (km) <span className="error-message" id="endOdometerError"></span></label>
            <input
              type="number"
              id="endOdometer"
              className="form-control"
              placeholder="Enter end reading"
              step="0.1"
              onInput={() => { calculateMileage(); validateField("endOdometer"); }}
            />
          </div>

          <div className="form-group">
            <label>Daily Mileage (Auto-calculated)</label>
            <div className="mileage-display" id="dailyMileage">0.0 km</div>
          </div>
        </div>

        <div className="form-section">
          <div className="section-title">⚠️ Section 2: Defects / Condition</div>

          <div className="form-group">
            <label>Defect Severity (Select all that apply)</label>
            <div className="defect-checkboxes">
              <div
                className="severity-checkbox info"
                onClick={(e) => toggleSeverity(e.currentTarget, "info")}
              >
                <input type="checkbox" id="severity-info" />
                <span>⚪ Info only</span>
              </div>
              <div
                className="severity-checkbox minor"
                onClick={(e) => toggleSeverity(e.currentTarget, "minor")}
              >
                <input type="checkbox" id="severity-minor" />
                <span>🟡 Minor</span>
              </div>
              <div
                className="severity-checkbox major"
                onClick={(e) => toggleSeverity(e.currentTarget, "major")}
              >
                <input type="checkbox" id="severity-major" />
                <span>🔴 Major</span>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="defectCategory">Pre-defined Defect Categories</label>
            <select id="defectCategory" className="form-control" onChange={toggleDefectDetails}>
              <option value="">Select defect category</option>
              <option value="door-malfunction">Door malfunction</option>
              <option value="hvac-not-cooling">HVAC not cooling</option>
              <option value="brakes-squeaking">Brakes squeaking</option>
              <option value="lighting-issue">Lighting issue</option>
              <option value="announcement-system">Announcement system</option>
              <option value="emergency-equipment">Emergency equipment</option>
              <option value="cleaning-maintenance">Cleaning/Maintenance</option>
              <option value="other">Other (specify)</option>
            </select>
          </div>

          <div className="form-group" id="defectDetailsGroup" style={{ display: "none" }}>
            <label htmlFor="defectDetails">Defect Details <span className="error-message" id="defectDetailsError"></span></label>
            <textarea
              id="defectDetails"
              className="form-control textarea"
              placeholder="Describe the defect in detail..."
              onInput={() => validateField("defectDetails")}
            />
          </div>

          <div className="form-group">
            <label>Attach Photo (Optional)</label>
            <div className="file-upload">
              <input type="file" id="photoUpload" accept="image/*" onChange={handlePhotoUpload} />
              <div className="file-upload-label">📷 Camera / Upload Photo</div>
            </div>
            <div id="photoPreview" ref={photoPreviewRef} style={{ marginTop: 10 }} />
          </div>

          <div className="form-group">
            <label>Final Condition Assessment <span className="error-message" id="conditionError"></span></label>
            <div className="condition-grid">
              <div className="condition-option ok" onClick={(e) => selectCondition(e.currentTarget, "fit")}>
                ✅<br />Fit for<br />Service
              </div>
              <div className="condition-option attention" onClick={(e) => selectCondition(e.currentTarget, "attention")}>
                ⚠️<br />Needs<br />Attention
              </div>
              <div className="condition-option unsafe" onClick={(e) => selectCondition(e.currentTarget, "unsafe")}>
                ⛔<br />Do Not<br />Use
              </div>
            </div>
          </div>
        </div>

        <div className="submit-section">
          <button className="btn btn-primary" onClick={submitFormToPython} id="submitBtn">✅ Save & Submit</button>
          <button className="btn btn-secondary" onClick={clearForm}>🔄 Clear Form</button>
        </div>
      </div>
    </div>
  );
}
