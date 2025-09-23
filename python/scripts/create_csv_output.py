#!/usr/bin/env python3
import json
import csv
from pathlib import Path

def create_csv_from_ml_output():
    """Create CSV files from the ML output data"""
    
    # Read the JSON output
    json_file = Path("../data/tips_latest_plan.json")
    if not json_file.exists():
        print("Error: tips_latest_plan.json not found. Please run ml.py first.")
        return
    
    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Create comprehensive trainset data CSV
    trainset_data = []
    
    # Add eligible trains
    for train in data.get("eligible", []):
        trainset_data.append({
            "train_id": train["id"],
            "status": "eligible",
            "assignment": "service" if train["id"] in data["assignments"]["service"] else "standby",
            "fitness_certificate_valid": train["fitness_certificate_valid"],
            "job_card_status": train["job_card_status"],
            "branding_priority": train["branding_priority"],
            "mileage": train["mileage"],
            "last_cleaned_date": train["last_cleaned_date"],
            "stabling_bay": train["stabling_bay"],
            "mileage_score": train["score_components"]["mileage_score"],
            "branding_score": train["score_components"]["branding_score"],
            "cleaning_score": train["score_components"]["cleaning_score"],
            "shunting_score": train["score_components"]["shunting_score"],
            "prelim_score": train["prelim_score"],
            "final_score_ga": train["final_score_ga"],
            "maintenance_reason": ""
        })
    
    # Add maintenance trains
    for train in data.get("maintenance", []):
        trainset_data.append({
            "train_id": train["id"],
            "status": "maintenance",
            "assignment": "maintenance",
            "fitness_certificate_valid": train["fitness_certificate_valid"],
            "job_card_status": train["job_card_status"],
            "branding_priority": train["branding_priority"],
            "mileage": train["mileage"],
            "last_cleaned_date": train["last_cleaned_date"],
            "stabling_bay": train["stabling_bay"],
            "mileage_score": "",
            "branding_score": "",
            "cleaning_score": "",
            "shunting_score": "",
            "prelim_score": "",
            "final_score_ga": "",
            "maintenance_reason": train["reason"]
        })
    
    # Sort by train_id
    trainset_data.sort(key=lambda x: x["train_id"])
    
    # Write trainset data CSV
    with open("../data/trainset_analysis.csv", "w", newline="", encoding="utf-8") as f:
        if trainset_data:
            fieldnames = trainset_data[0].keys()
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(trainset_data)
    
    print("Created trainset_analysis.csv with comprehensive train data")
    
    # Create service assignment summary CSV
    service_summary = []
    for train_id in data["assignments"]["service"]:
        train = next((t for t in data["eligible"] if t["id"] == train_id), None)
        if train:
            service_summary.append({
                "train_id": train_id,
                "stabling_bay": train["stabling_bay"],
                "final_score": train["final_score_ga"],
                "branding_priority": train["branding_priority"],
                "mileage": train["mileage"],
                "last_cleaned_date": train["last_cleaned_date"]
            })
    
    # Sort by final score (descending)
    service_summary.sort(key=lambda x: x["final_score"], reverse=True)
    
    with open("../data/service_assignments.csv", "w", newline="", encoding="utf-8") as f:
        if service_summary:
            fieldnames = service_summary[0].keys()
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(service_summary)
    
    print("Created service_assignments.csv with service train rankings")
    
    # Create maintenance summary CSV
    maintenance_summary = []
    for train in data.get("maintenance", []):
        maintenance_summary.append({
            "train_id": train["id"],
            "stabling_bay": train["stabling_bay"],
            "reason": train["reason"],
            "fitness_certificate_valid": train["fitness_certificate_valid"],
            "job_card_status": train["job_card_status"],
            "branding_priority": train["branding_priority"],
            "mileage": train["mileage"]
        })
    
    with open("../data/maintenance_assignments.csv", "w", newline="", encoding="utf-8") as f:
        if maintenance_summary:
            fieldnames = maintenance_summary[0].keys()
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(maintenance_summary)
    
    print("Created maintenance_assignments.csv with maintenance train details")
    
    # Create performance metrics CSV
    diagnostics = data["assignments"]["diagnostics"]
    performance_metrics = [{
        "metric": "Total shunting cost (meters)",
        "value": round(diagnostics["total_shunt"], 2),
        "description": "Total distance for all service trains to reach depot exits"
    }, {
        "metric": "Count penalty",
        "value": diagnostics["count_penalty"],
        "description": "Penalty for not meeting exact service count requirement"
    }, {
        "metric": "Shunt penalty",
        "value": round(diagnostics["shunt_penalty"], 4),
        "description": "Penalty for exceeding maximum shunting cost threshold"
    }, {
        "metric": "Service trains assigned",
        "value": len(data["assignments"]["service"]),
        "description": "Number of trains assigned to revenue service"
    }, {
        "metric": "Standby trains assigned",
        "value": len(data["assignments"]["standby"]),
        "description": "Number of trains assigned to standby"
    }, {
        "metric": "Maintenance trains",
        "value": len(data["assignments"]["maintenance"]),
        "description": "Number of trains requiring maintenance"
    }, {
        "metric": "Branding shortfall",
        "value": data["assignments"]["branding_shortfall"],
        "description": "Whether branding exposure target was met"
    }]
    
    with open("../data/performance_metrics.csv", "w", newline="", encoding="utf-8") as f:
        fieldnames = ["metric", "value", "description"]
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(performance_metrics)
    
    print("Created performance_metrics.csv with system performance data")
    
    print("\nAll CSV files created successfully!")
    print("Files created:")
    print("- trainset_analysis.csv: Complete train data with scores and assignments")
    print("- service_assignments.csv: Service trains ranked by performance score")
    print("- maintenance_assignments.csv: Trains requiring maintenance with reasons")
    print("- performance_metrics.csv: System performance and operational metrics")

if __name__ == "__main__":
    create_csv_from_ml_output()
