"""
Entry point for the KMRL Train Induction Planning ML System.

Usage:
    python run.py                       # Full synthetic pipeline
    python run.py --generate            # Generate synthetic data only
    python run.py --train               # Build features + train model
    python run.py --plan 2025-12-15     # Plan for a specific night
    python run.py --whatif 2025-12-15 TS-005=SERVICE TS-012=IBL
    python run.py --live                # ★ Live pipeline (real CSVs → dashboard)
    python run.py --live --date 2026-02-20
    python run.py --retrain             # ★ Force 30-day RL retrain
"""

import sys
from pipeline import InductionPipeline


def main():
    # ----- Live pipeline (production) -----
    if "--live" in sys.argv or "--retrain" in sys.argv:
        from live_pipeline import run_live
        date_arg = None
        force_retrain = "--retrain" in sys.argv
        if "--date" in sys.argv:
            idx = sys.argv.index("--date")
            if idx + 1 < len(sys.argv):
                date_arg = sys.argv[idx + 1]
        result = run_live(target_date=date_arg, force_retrain=force_retrain)
        return

    # ----- Synthetic / offline pipeline -----
    pipeline = InductionPipeline()

    if len(sys.argv) < 2:
        # Full pipeline
        pipeline.run_full_pipeline()
        return

    cmd = sys.argv[1]

    if cmd == "--generate":
        pipeline.step_1_generate_data()

    elif cmd == "--train":
        pipeline.step_2_build_features()
        pipeline.step_3_train_model()

    elif cmd == "--plan":
        date = sys.argv[2] if len(sys.argv) > 2 else None
        pipeline.step_4_plan_night(date)

    elif cmd == "--whatif":
        if len(sys.argv) < 3:
            print("Usage: python run.py --whatif <date> TS-XXX=ASSIGNMENT ...")
            return
        date = sys.argv[2]
        overrides = {}
        for arg in sys.argv[3:]:
            ts_id, assignment = arg.split("=")
            overrides[ts_id] = assignment
        pipeline.step_5_what_if(date, overrides)

    else:
        print(f"Unknown command: {cmd}")
        print("Use: --generate | --train | --plan [date] | --whatif date TS-XXX=ASSIGNMENT")
        print("     --live [--date YYYY-MM-DD] | --retrain")


if __name__ == "__main__":
    main()
