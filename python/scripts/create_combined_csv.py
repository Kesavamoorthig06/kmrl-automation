#!/usr/bin/env python3
import json
import csv
from pathlib import Path
from datetime import datetime

def create_combined_csv():
    """Create a single comprehensive CSV file combining all ML output data"""
    
    # Read the JSON output
    json_file = Path("../data/tips_latest_plan.json")
    if not json_file.exists():
        print("Error: tips_latest_plan.json not found. Please run ml.py first.")
        return
    
    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Create comprehensive dataset
    combined_data = []
    
    # Add all trains with their complete information
    all_trains = []
    
    # Add eligible trains
    for train in data.get("eligible", []):
        all_trains.append({
            **train,
            "status": "eligible",
            "assignment": "service" if train["id"] in data["assignments"]["service"] else "standby",
            "maintenance_reason": ""
        })
    
    # Add maintenance trains
    for train in data.get("maintenance", []):
        all_trains.append({
            **train,
            "status": "maintenance",
            "assignment": "maintenance",
            "score_components": {"mileage_score": "", "branding_score": "", "cleaning_score": "", "shunting_score": ""},
            "prelim_score": "",
            "final_score_ga": "",
            "maintenance_reason": train["reason"]
        })
    
    # Sort by train_id
    all_trains.sort(key=lambda x: x["id"])
    
    # Create the combined dataset with all relevant fields
    for train in all_trains:
        combined_data.append({
            "train_id": train["id"],
            "status": train["status"],
            "assignment": train["assignment"],
            "fitness_certificate_valid": train["fitness_certificate_valid"],
            "job_card_status": train["job_card_status"],
            "branding_priority": train["branding_priority"],
            "mileage": train["mileage"],
            "last_cleaned_date": train["last_cleaned_date"],
            "stabling_bay": train["stabling_bay"],
            "mileage_score": train["score_components"]["mileage_score"] if train["score_components"]["mileage_score"] != "" else "",
            "branding_score": train["score_components"]["branding_score"] if train["score_components"]["branding_score"] != "" else "",
            "cleaning_score": train["score_components"]["cleaning_score"] if train["score_components"]["cleaning_score"] != "" else "",
            "shunting_score": train["score_components"]["shunting_score"] if train["score_components"]["shunting_score"] != "" else "",
            "prelim_score": train["prelim_score"] if train["prelim_score"] != "" else "",
            "final_score_ga": train["final_score_ga"] if train["final_score_ga"] != "" else "",
            "maintenance_reason": train["maintenance_reason"],
            "service_rank": "",  # Will be filled for service trains
            "total_shunting_cost": "",  # Will be filled for all trains
            "count_penalty": "",  # Will be filled for all trains
            "shunt_penalty": "",  # Will be filled for all trains
            "branding_shortfall": "",  # Will be filled for all trains
            "service_trains_count": "",  # Will be filled for all trains
            "maintenance_trains_count": "",  # Will be filled for all trains
            "standby_trains_count": "",  # Will be filled for all trains
            "generation_timestamp": datetime.now().isoformat()
        })
    
    # Add performance metrics to all rows
    diagnostics = data["assignments"]["diagnostics"]
    assignments = data["assignments"]
    
    for row in combined_data:
        row["total_shunting_cost"] = round(diagnostics["total_shunt"], 2)
        row["count_penalty"] = diagnostics["count_penalty"]
        row["shunt_penalty"] = round(diagnostics["shunt_penalty"], 4)
        row["branding_shortfall"] = assignments["branding_shortfall"]
        row["service_trains_count"] = len(assignments["service"])
        row["maintenance_trains_count"] = len(assignments["maintenance"])
        row["standby_trains_count"] = len(assignments["standby"])
    
    # Add service ranking for service trains
    service_trains = [t for t in combined_data if t["assignment"] == "service"]
    service_trains.sort(key=lambda x: x["final_score_ga"], reverse=True)
    
    for i, train in enumerate(service_trains, 1):
        train["service_rank"] = i
    
    # Write combined CSV
    with open("../data/combined_ml_analysis.csv", "w", newline="", encoding="utf-8") as f:
        if combined_data:
            fieldnames = combined_data[0].keys()
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(combined_data)
    
    print("Created combined_ml_analysis.csv with all ML output data")
    print(f"Total records: {len(combined_data)}")
    print("Fields included:")
    print("- Train identification and status")
    print("- Assignment (service/standby/maintenance)")
    print("- All scoring components and final scores")
    print("- Performance metrics for all trains")
    print("- Service ranking for service trains")
    print("- Generation timestamp")

if __name__ == "__main__":
    create_combined_csv()
