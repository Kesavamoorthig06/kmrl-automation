import React from "react";

/**
 * YardMaster.jsx
 * - Direct JSX conversion of the provided HTML page.
 * - Structure, ids and classNames preserved exactly so existing integrations/scripts can still work.
 * - Inline CSS kept in a <style> tag (as in original) to avoid altering layout.
 *
 * Usage:
 *   import YardMaster from './YardMaster';
 *   <YardMaster />
 */

export default function YardMaster() {
  return (
    <div className="yard-master-page">
      <style>{`
    .yard-master-page {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: #f3f3f3;
      min-height: 100vh;
      padding: 20px;
      box-sizing: border-box;
    }

    .yard-master-page * {
      box-sizing: border-box;
    }

    .yard-master-page .container {
      max-width: 1200px;
      margin: 0 auto;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
      overflow: hidden;
    }

    .yard-master-page .header {
      background: #ffffff;
      border-bottom: 2px solid #e0e0e0;
      color: #000;
      padding: 30px;
      text-align: center;
    }

    .yard-master-page .header h1 {
      font-size: 2.4em;
      margin-bottom: 10px;
      font-weight: 600;
      color: #222;
    }

    .yard-master-page .header p {
      font-size: 1.2em;
      color: #444;
      font-weight: 400;
    }

    .yard-master-page .main-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      padding: 40px;
    }

    .yard-master-page .form-section,
    .yard-master-page .map-section {
      background: #fff;
      padding: 25px;
      border-radius: 10px;
      border: 1px solid #e0e0e0;
    }

    .yard-master-page .section-title {
      background: #fff;
      color: #000;
      font-size: 1.4em;
      margin-bottom: 20px;
      font-weight: 600;
      border-bottom: 2px solid #ccc;
      padding-bottom: 8px;
    }

    .yard-master-page .form-group {
      margin-bottom: 20px;
    }

    .yard-master-page label {
      display: block;
      margin-bottom: 6px;
      font-weight: 500;
      color: #333;
      font-size: 1em;
    }

    .yard-master-page input,
    .yard-master-page select,
    .yard-master-page textarea,
    .yard-master-page button {
      width: 100%;
      padding: 10px 14px;
      border: 1px solid #ccc;
      border-radius: 6px;
      font-size: 1em;
      transition: all 0.3s ease;
    }

    .yard-master-page input:focus,
    .yard-master-page select:focus,
    .yard-master-page textarea:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 6px rgba(0, 123, 255, 0.2);
    }

    .yard-master-page .auto-field {
      background: #fafafa;
      color: #444;
      position: relative;
      font-weight: 500;
    }

    .yard-master-page .auto-field::after {
      content: "AUTO";
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      background: #007bff;
      color: white;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.75em;
      font-weight: 500;
    }

    .yard-master-page .qr-scanner {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .yard-master-page .qr-scanner input {
      flex: 1;
    }

    .yard-master-page .dropdown-toggle {
      width: auto;
      background: #007bff;
      color: white;
      border: none;
      padding: 10px 16px;
      cursor: pointer;
      border-radius: 6px;
      font-weight: 500;
      transition: all 0.3s ease;
      white-space: nowrap;
    }

    .yard-master-page .dropdown-toggle:hover {
      background: #0056b3;
    }

    .yard-master-page .bay-selector {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .yard-master-page .selector-tabs {
      display: flex;
      gap: 10px;
    }

    .yard-master-page .tab-btn {
      flex: 1;
      padding: 10px;
      background: #f7f7f7;
      border: 1px solid #ccc;
      cursor: pointer;
      border-radius: 6px;
      font-weight: 500;
      transition: all 0.3s ease;
    }

    .yard-master-page .tab-btn.active {
      background: #007bff;
      border-color: #0056b3;
      color: #fff;
    }

    .yard-master-page .bay-grid {
      display: grid;
      grid-template-columns: repeat(8, 1fr);
      gap: 8px;
      padding: 15px;
      background: #fafafa;
      border-radius: 8px;
      border: 1px solid #ccc;
      min-height: 280px;
    }

    .yard-master-page .bay-slot {
      aspect-ratio: 1;
      border: 1px solid #ccc;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 0.9em;
    }

    .yard-master-page .bay-slot.available {
      background: #d4edda;
      border-color: #28a745;
      color: #155724;
    }

    .yard-master-page .bay-slot.occupied {
      background: #f8d7da;
      border-color: #dc3545;
      color: #721c24;
      cursor: not-allowed;
    }

    .yard-master-page .bay-slot.maintenance {
      background: #e2d9f3;
      border-color: #6f42c1;
      color: #3d2461;
      cursor: not-allowed;
    }

    .yard-master-page .bay-slot.selected {
      background: #007bff !important;
      border-color: #0056b3 !important;
      color: #fff !important;
      transform: scale(1.05);
    }

    .yard-master-page .legend {
      display: flex;
      justify-content: space-around;
      margin-top: 12px;
      font-size: 0.85em;
    }

    .yard-master-page .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .yard-master-page .legend-color {
      width: 18px;
      height: 18px;
      border-radius: 3px;
      border: 1px solid #333;
    }

    .yard-master-page .confirmation {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 15px;
      background: #fafafa;
      border: 1px solid #ccc;
      border-radius: 8px;
      margin-top: 15px;
    }

    .yard-master-page .confirm-checkbox {
      width: 20px;
      height: 20px;
      accent-color: #007bff;
    }

    .yard-master-page .submit-btn {
      background: #007bff;
      color: white;
      border: none;
      padding: 14px 32px;
      font-size: 1.1em;
      font-weight: 500;
      border-radius: 8px;
      cursor: pointer;
      margin-top: 20px;
      transition: all 0.3s ease;
      width: 100%;
    }

    .yard-master-page .submit-btn:hover:not(:disabled) {
      background: #0056b3;
    }

    .yard-master-page .submit-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .yard-master-page .selected-bay-info {
      background: #fdfdfe;
      border: 1px solid #ccc;
      padding: 12px;
      border-radius: 6px;
      margin-top: 12px;
      font-weight: 500;
      color: #333;
    }

    @media (max-width: 768px) {
      .yard-master-page .main-content {
        grid-template-columns: 1fr;
        gap: 20px;
        padding: 20px;
      }
      .yard-master-page .bay-grid {
        grid-template-columns: repeat(4, 1fr);
      }
    }
  `}</style>

      <div className="container">
        <div className="header">
          <h1>Yard Master Control</h1>
          <p>Stabling Bay Assignment & Shunting Management</p>
        </div>

        <div className="main-content">
          {/* Form Section */}
          <div className="form-section">
            <h2 className="section-title">Assignment Details</h2>

            <div className="form-group">
              <label htmlFor="depot-id">Depot ID</label>
              <input
                type="text"
                id="depot-id"
                className="auto-field"
                readOnly
                defaultValue="AUTO123"
              />
            </div>

            <div className="form-group">
              <label htmlFor="train-number">Train Number</label>
              <input type="text" id="train-number" placeholder="Enter Train Number" />
            </div>

            <div className="form-group qr-scanner">
              <input type="text" placeholder="Enter QR Code / ID manually" />
              {/* QR Scan button REMOVED */}
              <button className="dropdown-toggle" type="button">Select</button>
            </div>

            <div className="form-group">
              <label htmlFor="remarks">Remarks</label>
              <textarea id="remarks" rows={3} placeholder="Enter remarks..." />
            </div>
          </div>

          {/* Map Section */}
          <div className="map-section">
            <h2 className="section-title">Interactive Bay Map</h2>

            <div className="bay-selector">
              <div className="selector-tabs">
                <button className="tab-btn active" type="button">Line 1</button>
                <button className="tab-btn" type="button">Line 2</button>
                <button className="tab-btn" type="button">Line 3</button>
              </div>

              <div className="bay-grid">
                <div className="bay-slot available">B1</div>
                <div className="bay-slot occupied">B2</div>
                <div className="bay-slot maintenance">B3</div>
                <div className="bay-slot available">B4</div>
              </div>

              <div className="legend">
                <div className="legend-item"><span className="legend-color" style={{background: "#d4edda", borderColor: "#28a745"}}></span> Available</div>
                <div className="legend-item"><span className="legend-color" style={{background: "#f8d7da", borderColor: "#dc3545"}}></span> Occupied</div>
                <div className="legend-item"><span className="legend-color" style={{background: "#e2d9f3", borderColor: "#6f42c1"}}></span> Maintenance</div>
              </div>
            </div>

            <div className="confirmation">
              <input type="checkbox" className="confirm-checkbox" />
              <label>I confirm the bay assignment</label>
            </div>

            <div className="selected-bay-info">Selected Bay: None</div>
            <button className="submit-btn" disabled>Submit Assignment</button>
          </div>
        </div>
      </div>
    </div>
  );
}
