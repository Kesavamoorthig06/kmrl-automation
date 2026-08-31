# Source Folder Structure

Standard layout for the KMRL React app after refactor.

```
src/
├── app/                    # App shell & router
│   ├── App.jsx
│   └── App.css
├── core/                   # (optional – entry is at root)
├── index.jsx               # Entry point (imports app/App)
├── index.css
├── setupTests.js
│
├── pages/                  # Route-level page components
│   ├── AdminPage.jsx
│   ├── AlertsPage.jsx
│   ├── Dashboard.jsx
│   ├── LoginPage.jsx
│   ├── SelectedTrainsDashboard.jsx
│   └── WorkerPage.jsx
│
├── components/
│   ├── layout/             # Layout (nav, shell)
│   │   └── Navbar.jsx
│   ├── dashboard/          # Dashboard-specific UI
│   │   ├── ConfirmationAlert.jsx
│   │   ├── ConstraintsModal.jsx
│   │   ├── DashboardHeader.jsx
│   │   ├── DeploymentStatusCards.jsx
│   │   ├── MaintenanceAlert.jsx
│   │   ├── PerformanceMetrics.jsx
│   │   ├── RealTimeAlerts.jsx
│   │   ├── ReasonModal.jsx
│   │   ├── SelectionControls.jsx
│   │   ├── SystemStatus.jsx
│   │   ├── SystemStatusMetrics.jsx
│   │   ├── SystemStatusVisualization.jsx
│   │   ├── TrainDetailsModal.jsx
│   │   └── TrainTable.jsx
│   ├── workers/            # Worker-role screens (PascalCase filenames)
│   │   ├── BrandingOfficer.jsx
│   │   ├── Cleaning.jsx
│   │   ├── Login.jsx
│   │   ├── OperationStaff.jsx
│   │   ├── Technical.jsx
│   │   └── Yard.jsx
│   ├── chat/
│   │   └── AIChatbot.jsx
│   ├── qr/
│   │   ├── QRGenerator.jsx
│   │   └── QRScanner.jsx
│   ├── status/
│   │   ├── SystemStatusAnalyticsBanner.jsx
│   │   └── SystemStatusPopup.jsx
│   ├── loading/
│   │   └── SchedulaneLoadingPage.jsx
│   └── ui/                 # Shared UI primitives
│       ├── Alert.jsx
│       ├── Badge.jsx
│       ├── Card.jsx
│       ├── Modal.jsx
│       └── Table.jsx
│
├── contexts/
│   ├── LanguageContext.jsx
│   └── ThemeContext.jsx
├── hooks/
│   └── useTranslation.js
├── services/
│   └── (api, ML, chatbot, etc.)
├── data/
│   └── (kmrc-stations, knowledge, etc.)
├── utils/
│   └── (analytics, tests, etc.)
├── translations/
│   ├── en.js
│   ├── hi.js
│   └── ml.js
└── docs/                   # In-src docs (optional)
```

## Import path conventions

- **From `app/App.jsx`:** `../pages/...`, `../components/...`, `../contexts/...`
- **From `pages/*`:** `../components/layout/...`, `../components/dashboard/...`, `../components/workers/...`, etc.
- **From `components/dashboard/*`:** `../ui/...`, `../../hooks/...`, `../../services/...`
- **From `components/layout/*`:** `../../hooks/...`, `../../contexts/...`
- **From `components/status/*`:** `./SystemStatusPopup`, `../../utils/...`, `../../services/...`

Worker components use **PascalCase** filenames: `BrandingOfficer.jsx`, `Cleaning.jsx`, `Login.jsx`, `OperationStaff.jsx`, `Technical.jsx`, `Yard.jsx`.
