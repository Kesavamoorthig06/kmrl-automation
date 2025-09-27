import React, { useEffect, useRef, useState } from "react";

/**
 * BrandingOfficer.jsx
 * - Preserves original structure, ids and classNames for compatibility.
 * - Replaces direct DOM writes with React state/refs where reasonable.
 * - Keeps the CSS visually identical, but scoped inside the component.
 */

export default function BrandingOfficer() {
  const [currentLang, setCurrentLang] = useState("en");
  const [isOverride, setIsOverride] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const remainingDisplayRef = useRef(null);

  const translations = {
    en: {
      title: "Branding Officer",
      subtitle: "Exterior Advertising Wrap Exposure Tracker",
      trainId: "Train ID",
      wrapContract: "Wrap ID",
      exposureHours: "Exposure Hours Today",
      remainingExposure: "Remaining Exposure Required",
      remainingDisplay: "Select a wrap contract to view remaining hours",
      fieldInfo:
        "Auto-calculated based on contract requirements and logged exposure",
      confirmLog: "Confirm Branding Log",
      confirmText:
        "I confirm that the exposure data above is accurate and complete",
      submitBtn: "Submit Exposure Log",
    },
    ml: {
      title: "ബ്രാൻഡിംഗ് ഉദ്യോഗസ്ഥൻ",
      subtitle: "ബാഹ്യ പരസ്യ റാപ്പ് എക്സ്പോഷർ ട്രാക്കർ",
      trainId: "ട്രെയിൻ ഐഡി",
      wrapContract: "റാപ്പ് ഐഡി",
      exposureHours: "ഇന്നത്തെ എക്സ്പോഷർ മണിക്കൂറുകൾ",
      remainingExposure: "ആവശ്യമായ ശേഷിക്കുന്ന എക്സ്പോഷർ",
      remainingDisplay:
        "ശേഷിക്കുന്ന മണിക്കൂറുകൾ കാണാൻ ഒരു റാപ്പ് കരാർ തിരഞ്ഞെടുക്കുക",
      fieldInfo:
        "കരാർ ആവശ്യകതകളും ലോഗ് ചെയ്ത എക്സ്പോഷറും അടിസ്ഥാനമാക്കി ഓട്ടോ കണക്കാക്കുന്നു",
      confirmLog: "ബ്രാൻഡിംഗ് ലോഗ് സ്ഥിരീകരിക്കുക",
      confirmText:
        "മുകളിലെ എക്സ്പോഷർ ഡാറ്റ ശരിയും പൂർണ്ണവുമാണെന്ന് ഞാൻ സ്ഥിരീകരിക്കുന്നു",
      submitBtn: "എക്സ്പോഷർ ലോഗ് സമർപ്പിക്കുക",
    },
    hi: {
      title: "ब्रांडिंग अधिकारी",
      subtitle: "बाहरी विज्ञापन रैप एक्सपोजर ट्रैकर",
      trainId: "ट्रेन आईडी",
      wrapContract: "रैप आईडी",
      exposureHours: "आज के एक्सपोजर घंटे",
      remainingExposure: "आवश्यक शेष एक्सपोजर",
      remainingDisplay: "शेष घंटे देखने के लिए एक रैप कॉन्ट्रैक्ट चुनें",
      fieldInfo: "कॉन्ट्रैक्ट आवश्यकताओं और लॉग किए गए एक्सपोजर के आधार पर ऑटो-कैलकुलेटेड",
      confirmLog: "ब्रांडिंग लॉग की पुष्टि करें",
      confirmText: "मैं पुष्टि करता हूं कि उपरोक्त एक्सपोजर डेटा सटीक और पूर्ण है",
      submitBtn: "एक्सपोजर लॉग सबमिट करें",
    },
  };

  const t = translations[currentLang];

  useEffect(() => {
    // Initialize remaining display text on mount / language change
    if (remainingDisplayRef.current) {
      remainingDisplayRef.current.textContent = t.remainingDisplay;
      remainingDisplayRef.current.classList.remove("low");
    }
  }, [currentLang, t.remainingDisplay]);

  function switchLanguage() {
    setCurrentLang((prev) => {
      if (prev === 'en') return 'ml';
      if (prev === 'ml') return 'hi';
      return 'en';
    });
  }

  function toggleOverride() {
    setIsOverride((prev) => !prev);
  }

  function toggleSubmit() {
    setIsConfirmed((prev) => !prev);
  }

  // Using a ref so we don't re-render the entire component on every select change.
  function updateRemainingExposure(e) {
    const selected = e.target.selectedOptions[0];
    const remaining = selected ? selected.dataset.remaining : null;
    const displayEl = remainingDisplayRef.current;
    if (!displayEl) return;

    if (remaining) {
      displayEl.textContent = `${remaining} hours remaining`;
      if (parseFloat(remaining) < 20) {
        displayEl.classList.add("low");
      } else {
        displayEl.classList.remove("low");
      }
    } else {
      displayEl.textContent = t.remainingDisplay;
      displayEl.classList.remove("low");
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    // Simple success flow; replace with real submit as needed
    window.alert("✅ Exposure log submitted successfully!");
    // Optionally clear or keep fields — original preserved behavior was not to auto-clear
  }

  return (
    <div>
      <style>{`
        /* Component-scoped CSS (keeps original visuals) */
        * { margin:0; padding:0; box-sizing:border-box; }
        :where(.branding-root) { font-family: 'Arial', sans-serif; }
        .branding-wrapper { background:#f4f4f4; min-height:100vh; padding:20px; color:#333; }
        .container { max-width:400px; margin:0 auto; background:#fff; border-radius:16px; box-shadow:0 8px 24px rgba(0,0,0,0.15); overflow:hidden; }
        .header { background:#fff; color:#000; padding:20px; text-align:center; border-bottom:1px solid #e0e0e0; }
        .header h1 { font-size:18px; margin-bottom:8px; font-weight:600; }
        .header p { font-size:14px; color:#666; }
        .language-switcher { margin-top:10px; }
        .language-switcher button { background:#fff; color:#000; border:1px solid #ccc; padding:6px 12px; border-radius:4px; font-size:12px; cursor:pointer; transition:all 0.3s ease; }
        .language-switcher button:hover { background:#f0f0f0; }
        .form-container { padding:20px; }
        .form-group { margin-bottom:20px; }
        label { display:block; margin-bottom:6px; font-weight:500; color:#222; font-size:0.95em; }
        input, select, button { width:100%; padding:12px; border:2px solid #e0e0e0; border-radius:8px; font-size:16px; transition:all 0.3s ease; }
        input:focus, select:focus { outline:none; border-color:#333; box-shadow:0 0 6px rgba(0,0,0,0.1); }
        .auto-field { background:#f9f9f9; color:#555; position:relative; }
        .auto-field::after { content:"AUTO"; position:absolute; right:10px; top:50%; transform:translateY(-50%); background:#333; color:white; padding:2px 8px; border-radius:4px; font-size:0.75em; }
        .override-toggle { margin-top:8px; }
        .override-checkbox { width:auto; margin-right:8px; }
        .override-input { margin-top:8px; display:${isOverride ? "block" : "none"}; }
        .remaining-display { background:#f9f9f9; border:1px solid #ccc; padding:12px; border-radius:6px; font-size:1em; text-align:center; color:#333; }
        .remaining-display.low { background:#fff3f3; border-color:#aaa; color:#000; font-weight:600; }
        .confirmation { display:flex; align-items:center; gap:12px; padding:15px; background:#f5f5f5; border-radius:6px; margin-top:8px; }
        .confirm-checkbox { width:20px; height:20px; accent-color:#333; }
        .submit-btn { background:#333; color:white; border:none; padding:15px; font-size:16px; font-weight:600; border-radius:8px; cursor:pointer; margin-top:20px; transition:all 0.3s ease; }
        .submit-btn:hover:not(:disabled) { background:#555; }
        .submit-btn:disabled { opacity:0.6; cursor:not-allowed; }
        .field-info { font-size:0.85em; color:#777; margin-top:4px; font-style:italic; }
        @media (max-width:768px){
          .branding-wrapper { padding:5px; }
          .container{ max-width:100%; margin:0; border-radius:12px; }
          .header{ padding:15px; }
          .header h1{ font-size:16px; }
          .header p{ font-size:13px; }
          .form-container{ padding:15px; }
          .form-group{ margin-bottom:16px; }
          input,select,button{ font-size:16px; padding:14px; }
          .submit-btn{ padding:16px; font-size:16px; min-height:50px; }
        }
        @media (max-width:480px){
          .container{ border-radius:8px; }
          .header{ padding:12px; }
          .header h1{ font-size:15px; }
          .header p{ font-size:12px; }
          .form-container{ padding:12px; }
          .form-group{ margin-bottom:14px; }
          input,select,button{ padding:12px; font-size:16px; }
          .submit-btn{ padding:14px; font-size:15px; min-height:45px; }
        }
      `}</style>

      <div className="branding-wrapper" aria-live="polite">
        <div className="container">
          <div className="header">
            <h1>{t.title}</h1>
            <p>{t.subtitle}</p>
            <div className="language-switcher">
              <button
                id="langBtn"
                onClick={switchLanguage}
                aria-label="Switch language"
                type="button"
              >
                {currentLang === "en" ? "മലയാളം" : "English"}
              </button>
            </div>
          </div>

          <div className="form-container">
            <form id="brandingForm" onSubmit={handleSubmit}>
              {/* Train ID */}
              <div className="form-group">
                <label htmlFor="trainId">{t.trainId}</label>
                <input
                  type="text"
                  id="trainId"
                  name="trainId"
                  placeholder="Enter Train ID"
                  required
                />
                <div className="field-info">Manually enter train identification number</div>
              </div>

              {/* Wrap ID Dropdown */}
              <div className="form-group">
                <label htmlFor="wrapId">{t.wrapContract}</label>
                <select id="wrapId" name="wrapId" required onChange={updateRemainingExposure}>
                  <option value="">Select active branding contract</option>
                  <option value="WRAP001" data-remaining="45.5">
                    WRAP001 - Coca-Cola Summer Campaign
                  </option>
                  <option value="WRAP002" data-remaining="72.3">
                    WRAP002 - Nike Air Max Promo
                  </option>
                  <option value="WRAP003" data-remaining="15.8">
                    WRAP003 - Samsung Galaxy Launch
                  </option>
                  <option value="WRAP004" data-remaining="98.2">
                    WRAP004 - McDonald's Happy Meal
                  </option>
                  <option value="WRAP005" data-remaining="5.5">
                    WRAP005 - Local Bank Advertisement
                  </option>
                </select>
                <div className="field-info">Select from currently active branding contracts</div>
              </div>

              {/* Exposure Hours */}
              <div className="form-group">
                <label htmlFor="exposureHours">{t.exposureHours}</label>
                <input
                  type="number"
                  id="exposureHours"
                  name="exposureHours"
                  step="0.1"
                  className="auto-field"
                  readOnly
                />
                <div className="override-toggle">
                  <input
                    type="checkbox"
                    id="overrideHours"
                    className="override-checkbox"
                    onChange={toggleOverride}
                  />
                  <label htmlFor="overrideHours" style={{ display: "inline", fontWeight: 400 }}>
                    Manual override
                  </label>
                </div>
                <input
                  type="number"
                  id="manualHours"
                  className="override-input"
                  step="0.1"
                  placeholder="Enter manual hours"
                  style={{ display: isOverride ? "block" : "none" }}
                />
                <div className="field-info">
                  Automatically calculated from mileage data. Check override for manual entry.
                </div>
              </div>

              {/* Remaining Exposure */}
              <div className="form-group">
                <label htmlFor="remainingExposure">{t.remainingExposure}</label>
                <div id="remainingDisplay" ref={remainingDisplayRef} className="remaining-display">
                  {t.remainingDisplay}
                </div>
                <div className="field-info">{t.fieldInfo}</div>
              </div>

              {/* Confirmation */}
              <div className="form-group">
                <div className="confirmation">
                  <input
                    type="checkbox"
                    id="confirmLog"
                    className="confirm-checkbox"
                    required
                    onChange={toggleSubmit}
                  />
                  <label htmlFor="confirmLog" style={{ flex: 1, marginBottom: 0, fontWeight: 400 }}>
                    {t.confirmLog}
                    <br />
                    <small>{t.confirmText}</small>
                  </label>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="submit-btn"
                id="submitBtn"
                disabled={!isConfirmed}
              >
                {t.submitBtn}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
