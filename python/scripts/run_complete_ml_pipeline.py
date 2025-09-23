#!/usr/bin/env python3
"""
Complete ML Pipeline for KMRL
Processes CSV data, runs ML analysis, and generates deployment recommendations
"""

import subprocess
import sys
import shutil
from pathlib import Path
import json
from datetime import datetime

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"\n{description}...")
    print(f"Command: {command}")
    
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"{description} completed successfully")
        if result.stdout:
            print(f"Output: {result.stdout}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"{description} failed")
        print(f"Error: {e.stderr}")
        return False

def check_file_exists(file_path, description):
    """Check if a file exists"""
    if Path(file_path).exists():
        print(f"{description} found: {file_path}")
        return True
    else:
        print(f"{description} missing: {file_path}")
        return False

def copy_file(source, destination, description):
    """Copy a file with error handling"""
    try:
        shutil.copy2(source, destination)
        print(f"{description} copied: {source} -> {destination}")
        return True
    except Exception as e:
        print(f"Failed to copy {description}: {e}")
        return False

def main():
    """Run the complete ML pipeline"""
    
    print("Starting Complete KMRL ML Pipeline")
    print("=" * 50)
    print(f"Timestamp: {datetime.now().isoformat()}")
    
    # Step 1: Check if all required CSV files exist
    print("\nStep 1: Checking CSV files...")
    csv_files = [
        ("../../public/train_branding_priorities.csv", "Branding Priorities"),
        ("../../public/train_cleaning_status.csv", "Cleaning Status"),
        ("../../public/train_fitness_certificates.csv", "Fitness Certificates"),
        ("../../public/train_job_cards.csv", "Job Cards"),
        ("../../public/train_mileage_data.csv", "Mileage Data"),
        ("../../public/train_stabling_geometry.csv", "Stabling Geometry")
    ]
    
    all_csv_exist = True
    for file_path, description in csv_files:
        if not check_file_exists(file_path, description):
            all_csv_exist = False
    
    if not all_csv_exist:
        print("\nSome CSV files are missing. Please ensure all 6 CSV files are in the public directory.")
        return False
    
    # Step 2: Process CSV data
    print("\nStep 2: Processing CSV data...")
    if not run_command("python process_csv_data.py", "CSV Data Processing"):
        return False
    
    # Step 3: Check if ML input was created
    print("\nStep 3: Verifying ML input file...")
    if not check_file_exists("../../data/ml_input_from_csv.json", "ML Input File"):
        return False
    
    # Step 4: Run ML analysis
    print("\nStep 4: Running ML analysis...")
    if not run_command("python ml.py --input=../../data/ml_input_from_csv.json", "ML Analysis"):
        return False
    
    # Step 5: Check if ML output was created
    print("\nStep 5: Verifying ML output...")
    if not check_file_exists("../../data/tips_latest_plan.json", "ML Output Plan"):
        return False
    
    # Step 6: Create combined CSV
    print("\nStep 6: Creating combined CSV...")
    if not run_command("python create_combined_csv.py", "Combined CSV Creation"):
        return False
    
    # Step 7: Check if combined CSV was created
    print("\nStep 7: Verifying combined CSV...")
    if not check_file_exists("../../data/combined_ml_analysis.csv", "Combined ML Analysis CSV"):
        return False
    
    # Step 8: Copy to public directory for dashboard
    print("\nStep 8: Copying to public directory...")
    if not copy_file(
        "../../data/combined_ml_analysis.csv", 
        "../../public/ml_analysis_data.csv",
        "ML Analysis Data for Dashboard"
    ):
        return False
    
    # Step 9: Create additional CSV outputs
    print("\nStep 9: Creating additional CSV outputs...")
    if not run_command("python create_csv_output.py", "Additional CSV Outputs"):
        return False
    
    # Step 10: Final verification
    print("\nStep 10: Final verification...")
    final_files = [
        ("../../public/ml_analysis_data.csv", "Dashboard ML Data"),
        ("../../data/trainset_analysis.csv", "Trainset Analysis"),
        ("../../data/service_assignments.csv", "Service Assignments"),
        ("../../data/maintenance_assignments.csv", "Maintenance Assignments"),
        ("../../data/performance_metrics.csv", "Performance Metrics")
    ]
    
    all_final_exist = True
    for file_path, description in final_files:
        if not check_file_exists(file_path, description):
            all_final_exist = False
    
    if all_final_exist:
        print("\nComplete ML Pipeline executed successfully!")
        print("\nGenerated Files:")
        print("   - ml_analysis_data.csv - Main dashboard data")
        print("   - trainset_analysis.csv - Complete train analysis")
        print("   - service_assignments.csv - Service train rankings")
        print("   - maintenance_assignments.csv - Maintenance requirements")
        print("   - performance_metrics.csv - System performance")
        
        print("\nDashboard Integration:")
        print("   - The dashboard will now display ML-generated deployment recommendations")
        print("   - Trains are ranked by comprehensive scoring algorithm")
        print("   - All 6 CSV factors are integrated into the analysis")
        
        return True
    else:
        print("\nSome final files are missing. Pipeline may have failed.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
