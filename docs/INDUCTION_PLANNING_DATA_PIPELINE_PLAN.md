# Kochi Metro Induction Planning – Data & Pipeline Plan

## 1. Problem Summary (from statement)

**Decision:** Every night (21:00–23:00 IST), decide for each of 25 four-car trainsets (→ 40 by 2027):
- **Revenue service at dawn** – which rakes run
- **Standby** – which stay ready but not scheduled
- **IBL (Inspection Bay Line)** – which are held for maintenance

**Six inter-dependent variables:**

| # | Variable | Source (current) | Automation potential |
|---|----------|------------------|----------------------|
| 1 | Fitness Certificates | Rolling-Stock, Signalling, Telecom validity windows | Partial: sensors + APIs; rest manual until systems exist |
| 2 | Job-Card Status | IBM Maximo (open/closed work orders) | **Fully automatable** – API/export |
| 3 | Branding Priorities | Contracts, exposure hours | Manual / semi (if contract DB exists) |
| 4 | Mileage Balancing | km allocation (bogie, brake, HVAC wear) | **Automatable** – odometer/run-time from train or TMS |
| 5 | Cleaning & Detailing Slots | Manpower, bay occupancy | Partial: bay sensors; manpower often manual |
| 6 | Stabling Geometry | Physical bay positions, shunting plan | Partial: bay occupancy IoT; geometry one-time + manual updates |

**Risks if wrong:** unscheduled withdrawals (punctuality KPI), uneven wear (cost), branding SLA breach, extra shunting (energy + safety).

**Goal:** Integrated, algorithm-driven platform with rule-based + multi-objective optimisation, explainable ranked induction list, conflict alerts, what-if simulation, and ML feedback from historical outcomes.

---

## 2. Data That Can Be Fetched Automatically

### 2.1 From IoT / Onboard Sensors (near-real-time or nightly batch)

| Data | Description | Use in model |
|------|-------------|--------------|
| **Mileage / run-time per trainset** | Odometer or equivalent km/hours from train control or onboard logger | Mileage balancing, wear proxy |
| **Bogie / wheelset** | Vibration, temperature, or condition indicators (if fitted) | Fitness proxy; prioritise IBL |
| **Brake-pad wear** | Thickness or wear-index from sensors (if available) | Mileage + maintenance readiness |
| **HVAC run hours** | From HVAC controller | Mileage balancing (HVAC wear) |
| **Door cycle counts** | Open/close cycles per coach | Usage / wear proxy |
| **Signalling / train-side** | Onboard signalling unit health (if reported) | Fitness – “signalling clearance” |
| **Telecom / train-side** | Onboard telecom unit status (if reported) | Fitness – “telecom clearance” |
| **UNS streams** | Uninterruptible / power or other UNS equipment status | Fitness / availability |
| **Bay occupancy / position** | Depot bay sensors (weight, RFID, or position) | Stabling geometry, who is where |
| **Fault / event logs** | Real-time fault codes from train or depot | Input to “fitness” and job-card logic |

*Assumption:* Not all of these may exist today. The pipeline should have **connectors per source**; start with whatever KMRL already has (e.g. mileage, fault logs, bay occupancy) and add others as they become available.

### 2.2 From Enterprise Systems (APIs / Exports)

| Data | System | Frequency | Use in model |
|------|--------|-----------|--------------|
| **Job-card status** (open/closed work orders) | IBM Maximo | Nightly export or API pull | Service readiness; IBL vs service |
| **Work order history** | Maximo | Batch | ML features (recent work, repeat jobs) |
| **Roster / manpower** (if digitised) | HR / depot roster | Daily | Cleaning slot availability |
| **Punctuality / incident logs** (post-service) | Operations / TMS | Daily | ML labels (outcome of induction decision) |

### 2.3 One-Time or Rarely Changing (Configured, then maintained manually)

| Data | Description |
|------|-------------|
| Depot layout | Bay IDs, capacity, which bays are IBL vs stabling |
| Shunt paths / turn-out order | Which sequences minimise shunting and morning turn-out time |
| Train-to-bay compatibility | Which trainsets can go to which bays (length, facilities) |

These feed **stabling geometry** and **what-if** (e.g. “if we put set A in bay 5, what’s the shunt cost?”).

---

## 3. Data That Must Be Created or Entered Manually (for ML and Operations)

### 3.1 Needed for Daily Planning (manual or semi-manual until systems exist)

| Data | Why manual / semi-manual | Used for |
|------|---------------------------|----------|
| **Fitness certificate validity windows** | Rolling-Stock / Signalling / Telecom may sign off on paper or local sheets | Rule: “no service without valid certificates” |
| **Branding priorities** | Contract exposure hours, which wrap on which train, SLA targets | Constraint: meet exposure hours; avoid SLA breach |
| **Cleaning slot availability** | “Which bays free tonight?”, “Who is on duty?” – often in logbooks/WhatsApp | Cleaning & detailing slot constraint |
| **Manual overrides** | “Force this set to service despite X” or “Hold set Y for inspection” | Constraint + explainability; also training data |

### 3.2 Needed Specifically for ML Training and Feedback

| Data | Description | Who / how |
|------|-------------|-----------|
| **Historical induction list** | For each night: which set was assigned to service / standby / IBL | From platform output (auto) or log (manual) |
| **Outcome labels** | For each decision: punctuality, unscheduled withdrawal, failure, SLA met/missed | From operations/TMS where possible; else manual logging |
| **Conflict / exception logs** | What conflicts were overridden and why | Manual or structured override reason |
| **What-if vs actual** | If “what-if” was run, what was chosen vs recommended | Optional; improves causal data for ML |

Without **outcome labels**, the ML can only learn from features (e.g. mileage, job cards); with labels it can learn “which induction choices led to good/bad outcomes” and improve over time.

---

## 4. High-Level Data Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        INGESTION LAYER                                            │
├─────────────────┬─────────────────┬─────────────────┬───────────────────────────┤
│  IoT / Sensors   │  Enterprise     │  Manual /       │  One-time /                │
│  (near-real-time │  systems        │  Overrides      │  config                   │
│  or nightly)     │  (batch/API)    │  (forms/UI)     │  (depot geometry)         │
├─────────────────┼─────────────────┼─────────────────┼───────────────────────────┤
│ • Mileage        │ • Maximo        │ • Fitness       │ • Bay layout              │
│ • Bogie/brake/   │   job cards     │   cert windows  │ • Shunt paths             │
│   HVAC sensors   │ • Roster (if    │ • Branding      │ • Train–bay               │
│ • Bay occupancy  │   available)    │   exposure      │   compatibility           │
│ • Fault/event    │ • Punctuality   │ • Cleaning      │                           │
│   logs           │   (post-day)    │   slot info     │                           │
│ • UNS streams    │                 │ • Overrides     │                           │
└────────┬────────┴────────┬────────┴────────┬────────┴───────────────┬───────────┘
         │                 │                 │                         │
         ▼                 ▼                 ▼                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     NORMALISATION & STORAGE                                       │
│  • Raw store (time-series for sensors; snapshots for Maximo/manual)              │
│  • “Nightly planning view” (per trainset, per night):                            │
│    - fitness status, open job count, mileage, branding exposure,                │
│      cleaning slot, stabling position, override flags                            │
└─────────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     FEATURE ENGINEERING                                            │
│  • Mileage balance score (vs fleet mean)    • Certificate expiry horizon          │
│  • Open job count / critical job flag      • Branding exposure vs target         │
│  • Days since deep-clean                   • Stabling cost (shunt distance)       │
│  • Last fault / last withdrawal            • Capacity (bays, cleaning slots)     │
└─────────────────────────────────────────────────────────────────────────────────┘
         │
         ├──────────────────────────────────┬──────────────────────────────────────┐
         ▼                                  ▼                                      ▼
┌─────────────────────┐    ┌─────────────────────────────┐    ┌─────────────────────┐
│  RULE ENGINE        │    │  OPTIMISATION / ML          │    │  FEEDBACK LOOP      │
│  • Hard constraints │    │  • Multi-objective:         │    │  • Actual induction │
│    (certs, job      │    │    readiness, cost,         │    │  • Punctuality      │
│    cards, branding) │    │    branding, shunting       │    │  • Incidents        │
│  • Conflict alerts  │    │  • Ranked list +            │    │  • → Labels for ML  │
│  • What-if inputs   │    │    explainability           │    │  • Retrain model    │
└─────────────────────┘    └─────────────────────────────┘    └─────────────────────┘
```

### 4.1 Pipeline Stages (concise)

1. **Ingest**
   - **IoT:** Gateway or middleware to pull mileage, fault logs, bay occupancy, UNS (and any fitness-related sensors). Schedule: e.g. every 15–60 min or nightly snapshot before 21:00.
   - **Maximo:** Nightly export (CSV/JSON) or API: open/closed work orders per trainset.
   - **Manual:** Web form or simple UI for certificate windows, branding exposure, cleaning slots, overrides; stored in same DB or data lake.
   - **Config:** Depot geometry and shunt rules loaded once and versioned; updated when layout changes.

2. **Normalise and store**
   - Persist raw feeds for audit and replay.
   - Build a **nightly planning view** (one row per trainset per night) joining: fitness, job cards, mileage, branding, cleaning slot, stabling, overrides.

3. **Feature engineering**
   - Compute features for rules and ML: mileage balance, certificate horizon, open job count, branding gap, stabling cost, days since clean, etc.

4. **Rules + optimisation + ML**
   - Rule engine: enforce hard constraints (cert validity, open critical jobs, branding minimums).
   - Optimiser: multi-objective (readiness, cost, branding, shunting); output ranked induction list with reasons.
   - ML model: trained on historical planning view + **outcome labels**; used to suggest or rank; explainability (e.g. feature importance, short reason strings).

5. **Feedback**
   - After each operating day: record actual induction, punctuality, incidents.
   - Attach as labels to that night’s planning view; periodic retrain to improve forecasts and recommendations.

---

## 5. Summary Tables

### Automatable (IoT / APIs)

| Category | Examples |
|----------|----------|
| **IoT / sensors** | Mileage per set, bogie/brake/HVAC indicators, door cycles, fault logs, bay occupancy, UNS, train-side signalling/telecom status (if available) |
| **APIs / exports** | Maximo job cards and work history; punctuality/incidents (for labels); roster if digitised |
| **Config (one-time)** | Depot geometry, shunt paths, train–bay compatibility |

### Manual / Semi-manual (for ML and daily planning)

| Category | Examples |
|----------|----------|
| **Daily planning** | Fitness certificate validity windows, branding exposure targets/slots, cleaning slot and manpower availability, manual overrides |
| **ML training** | Outcome labels (punctuality, withdrawals, SLA met/missed), override reasons, and any missing historical induction decisions |

### Data pipeline (one sentence per stage)

- **Ingest:** IoT + Maximo + manual inputs + depot config → raw store + nightly planning view.
- **Features:** Derive mileage balance, certificate horizon, job counts, branding gap, stabling cost, etc.
- **Use:** Rules + multi-objective optimisation + ML → ranked induction list, conflicts, what-if.
- **Feedback:** Actual induction + outcomes → labels → retrain ML for better accuracy over time.

This plan keeps **automation** where systems already exist (IoT, Maximo), **manual entry** only where needed (certs, branding, cleaning, overrides, outcome labels), and a **clear pipeline** from ingestion to ML feedback so induction planning becomes reproducible, auditable, and scalable to 40 sets and two depots.
