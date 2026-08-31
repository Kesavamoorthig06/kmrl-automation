"""
Configuration for KMRL Train Induction Planning ML System.
All constants, fleet parameters, and paths.
"""

from pathlib import Path

# --- Fleet ---
NUM_TRAINSETS = 25
TRAINSET_IDS = [f"TS-{str(i).zfill(3)}" for i in range(1, NUM_TRAINSETS + 1)]

# --- Depot ---
NUM_BAYS = 30  # total stabling + IBL bays
IBL_BAYS = [f"BAY-{i}" for i in range(1, 6)]        # 5 IBL bays
STABLING_BAYS = [f"BAY-{i}" for i in range(6, NUM_BAYS + 1)]

# --- Simulation ---
NUM_DAYS_HISTORY = 365       # 1 year of synthetic history
DAILY_SERVICE_REQUIRED = 14  # trains needed for revenue service
DAILY_STANDBY_REQUIRED = 3   # trains on standby
# remaining go to IBL

# --- Stabling Geometry Deployment Readiness ---
# Trains must meet these thresholds to be "readily deployable"
MIN_OPERATIONAL_EFFICIENCY = 80          # minimum bay operational_efficiency score
MAX_DEPLOYMENT_TIME_MINUTES = 12         # bays with longer deploy times are not ready
ALLOWED_SHUNTING_COMPLEXITY = ["low", "medium"]  # exclude 'high'
REQUIRE_WATER_SUPPLY = True              # water needed for service-ready trains
REQUIRE_POWER_SUPPLY = True              # power needed for service-ready trains

# --- Departments that issue fitness certs ---
FITNESS_DEPARTMENTS = ["rolling_stock", "signalling", "telecom"]

# --- Branding ---
NUM_BRANDING_CONTRACTS = 8
MAX_EXPOSURE_HOURS_PER_DAY = 18  # max service hours

# --- Paths ---
BASE_DIR = Path(__file__).parent
RAW_DIR = BASE_DIR / "data" / "raw"
PROCESSED_DIR = BASE_DIR / "data" / "processed"
MODEL_DIR = BASE_DIR / "data" / "models"

for d in [RAW_DIR, PROCESSED_DIR, MODEL_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# --- ML ---
RETRAIN_EVERY_N_DAYS = 30
RANDOM_SEED = 42

# --- Live pipeline ---
PKL_MODEL_PATH = BASE_DIR / "kmrl_station_master_model.pkl"
PUBLIC_DIR = BASE_DIR.parent / "public"
PKL_WEIGHT = 0.4       # ensemble weight given to the .pkl model
PIPE_WEIGHT = 0.6      # ensemble weight given to the pipeline XGBoost
