#!/usr/bin/env python3
"""
CSV Data Processor for KMRL ML System
Processes all 6 CSV files and creates unified train data for ML analysis
"""

import csv
import json
import pandas as pd
from pathlib import Path
from datetime import datetime, date
from typing import Dict, List, Any, Optional

def load_csv_data(csv_path: str) -> pd.DataFrame:
    """Load CSV data with error handling"""
    try:
        df = pd.read_csv(csv_path)
        print(f"Loaded {csv_path}: {len(df)} records")
        return df
    except Exception as e:
        print(f"Error loading {csv_path}: {e}")
        return pd.DataFrame()

def process_branding_data(df: pd.DataFrame) -> Dict[str, Any]:
    """Process branding priorities data"""
    branding_data = {}
    for _, row in df.iterrows():
        train_id = row['train_id']
        branding_data[train_id] = {
            'branding_priority': row['branding_priority_level'],
            'advertisement_type': row['advertisement_type'],
            'client_name': row['client_name'],
            'contract_value': row['contract_value'],
            'contract_start_date': row['contract_start_date'],
            'contract_end_date': row['contract_end_date'],
            'advertisement_status': row['advertisement_status'],
            'placement_type': row['placement_type'],
            'visibility_score': row['visibility_score'],
            'branding_requirements': row['branding_requirements'],
            'completion_percentage': row['completion_percentage'],
            'revenue_generated': row['revenue_generated'],
            'maintenance_impact': row['maintenance_impact'],
            'deployment_priority': row['deployment_priority']
        }
    return branding_data

def process_cleaning_data(df: pd.DataFrame) -> Dict[str, Any]:
    """Process cleaning status data"""
    cleaning_data = {}
    for _, row in df.iterrows():
        train_id = row['train_id']
        cleaning_data[train_id] = {
            'last_cleaned_date': row['last_cleaned_date'],
            'cleaning_frequency': row['cleaning_frequency'],
            'interior_condition': row['interior_condition'],
            'exterior_condition': row['exterior_condition'],
            'cleaning_crew_assigned': row['cleaning_crew_assigned'],
            'cleaning_duration_hours': row['cleaning_duration_hours'],
            'cleaning_score': row['cleaning_score'],
            'cleaning_priority': row['cleaning_priority'],
            'special_requirements': row['special_requirements'],
            'cleaning_equipment_used': row['cleaning_equipment_used'],
            'cleaning_chemicals_used': row['cleaning_chemicals_used'],
            'next_cleaning_due': row['next_cleaning_due'],
            'cleaning_cost': row['cleaning_cost'],
            'cleaning_quality_rating': row['cleaning_quality_rating']
        }
    return cleaning_data

def process_fitness_data(df: pd.DataFrame) -> Dict[str, Any]:
    """Process fitness certificates data"""
    fitness_data = {}
    for _, row in df.iterrows():
        train_id = row['train_id']
        # Check if all certificates are valid
        all_valid = all([
            row['rolling_stock_certificate'] == 'valid',
            row['signalling_certificate'] == 'valid',
            row['telecom_certificate'] == 'valid',
            row['brake_certificate'] == 'valid',
            row['electrical_certificate'] == 'valid',
            row['mechanical_certificate'] == 'valid'
        ])
        
        fitness_data[train_id] = {
            'fitness_certificate_valid': all_valid,
            'rolling_stock_certificate': row['rolling_stock_certificate'],
            'signalling_certificate': row['signalling_certificate'],
            'telecom_certificate': row['telecom_certificate'],
            'brake_certificate': row['brake_certificate'],
            'electrical_certificate': row['electrical_certificate'],
            'mechanical_certificate': row['mechanical_certificate'],
            'certificate_expiry_date': row['certificate_expiry_date'],
            'last_inspection_date': row['last_inspection_date'],
            'inspection_score': row['inspection_score'],
            'compliance_status': row['compliance_status']
        }
    return fitness_data

def process_job_cards_data(df: pd.DataFrame) -> Dict[str, Any]:
    """Process job cards data"""
    job_cards_data = {}
    for _, row in df.iterrows():
        train_id = row['train_id']
        job_cards_data[train_id] = {
            'job_card_number': row['job_card_number'],
            'job_card_status': row['job_card_status'],
            'work_order_type': row['work_order_type'],
            'priority_level': row['priority_level'],
            'assigned_technician': row['assigned_technician'],
            'estimated_completion_date': row['estimated_completion_date'],
            'actual_completion_date': row['actual_completion_date'],
            'work_description': row['work_description'],
            'critical_issues': row['critical_issues'],
            'parts_required': row['parts_required'],
            'maintenance_hours': row['maintenance_hours'],
            'quality_score': row['quality_score'],
            'completion_status': row['completion_status']
        }
    return job_cards_data

def process_mileage_data(df: pd.DataFrame) -> Dict[str, Any]:
    """Process mileage data"""
    mileage_data = {}
    for _, row in df.iterrows():
        train_id = row['train_id']
        mileage_data[train_id] = {
            'total_mileage': row['total_mileage'],
            'monthly_mileage': row['monthly_mileage'],
            'daily_average': row['daily_average'],
            'last_service_mileage': row['last_service_mileage'],
            'next_service_due': row['next_service_due'],
            'engine_hours': row['engine_hours'],
            'brake_usage_hours': row['brake_usage_hours'],
            'energy_consumption_kwh': row['energy_consumption_kwh'],
            'maintenance_interval': row['maintenance_interval'],
            'wear_factor': row['wear_factor'],
            'performance_score': row['performance_score'],
            'mileage_efficiency': row['mileage_efficiency'],
            'route_complexity': row['route_complexity'],
            'operational_hours': row['operational_hours']
        }
    return mileage_data

def process_stabling_data(df: pd.DataFrame) -> Dict[str, Any]:
    """Process stabling geometry data"""
    stabling_data = {}
    for _, row in df.iterrows():
        train_id = row['train_id']
        stabling_data[train_id] = {
            'stabling_bay': row['stabling_bay'],
            'bay_type': row['bay_type'],
            'bay_length_meters': row['bay_length_meters'],
            'bay_width_meters': row['bay_width_meters'],
            'power_supply_available': row['power_supply_available'],
            'water_supply_available': row['water_supply_available'],
            'maintenance_access': row['maintenance_access'],
            'deployment_time_minutes': row['deployment_time_minutes'],
            'shunting_distance_meters': row['shunting_distance_meters'],
            'shunting_complexity': row['shunting_complexity'],
            'access_road_condition': row['access_road_condition'],
            'lighting_condition': row['lighting_condition'],
            'security_level': row['security_level'],
            'environmental_factors': row['environmental_factors'],
            'operational_efficiency': row['operational_efficiency']
        }
    return stabling_data

def combine_all_data(
    branding_data: Dict[str, Any],
    cleaning_data: Dict[str, Any], 
    fitness_data: Dict[str, Any],
    job_cards_data: Dict[str, Any],
    mileage_data: Dict[str, Any],
    stabling_data: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """Combine all data sources into unified train records"""
    
    # Get all unique train IDs
    all_train_ids = set()
    all_train_ids.update(branding_data.keys())
    all_train_ids.update(cleaning_data.keys())
    all_train_ids.update(fitness_data.keys())
    all_train_ids.update(job_cards_data.keys())
    all_train_ids.update(mileage_data.keys())
    all_train_ids.update(stabling_data.keys())
    
    combined_trains = []
    
    for train_id in sorted(all_train_ids):
        # Extract numeric ID for ML system compatibility
        numeric_id = int(train_id.replace('R-', ''))
        
        # Get data from each source (with defaults if missing)
        branding = branding_data.get(train_id, {})
        cleaning = cleaning_data.get(train_id, {})
        fitness = fitness_data.get(train_id, {})
        job_cards = job_cards_data.get(train_id, {})
        mileage = mileage_data.get(train_id, {})
        stabling = stabling_data.get(train_id, {})
        
        # Create unified train record
        train_record = {
            "id": numeric_id,
            "train_id": train_id,
            
            # Core ML fields
            "fitness_certificate_valid": fitness.get('fitness_certificate_valid', False),
            "job_card_status": job_cards.get('job_card_status', 'unknown'),
            "branding_priority": branding.get('branding_priority', 1),
            "mileage": mileage.get('total_mileage', 0),
            "last_cleaned_date": cleaning.get('last_cleaned_date', '1970-01-01'),
            "stabling_bay": stabling.get('stabling_bay', 'UNKNOWN'),
            
            # Extended data for comprehensive analysis
            "branding_data": branding,
            "cleaning_data": cleaning,
            "fitness_data": fitness,
            "job_cards_data": job_cards,
            "mileage_data": mileage,
            "stabling_data": stabling,
            
            # Computed fields
            "cleaning_score": cleaning.get('cleaning_score', 0),
            "inspection_score": fitness.get('inspection_score', 0),
            "performance_score": mileage.get('performance_score', 0),
            "operational_efficiency": stabling.get('operational_efficiency', 0),
            "deployment_time": stabling.get('deployment_time_minutes', 999),
            "shunting_distance": stabling.get('shunting_distance_meters', 999),
            "energy_consumption": mileage.get('energy_consumption_kwh', 0),
            "wear_factor": mileage.get('wear_factor', 1.0),
            "completion_percentage": branding.get('completion_percentage', 0),
            "revenue_generated": branding.get('revenue_generated', 0),
            "critical_issues": job_cards.get('critical_issues', 0),
            "maintenance_hours": job_cards.get('maintenance_hours', 0),
            "quality_score": job_cards.get('quality_score', 0)
        }
        
        combined_trains.append(train_record)
    
    return combined_trains

def create_ml_input_file(trains: List[Dict[str, Any]], output_path: str):
    """Create ML input file in the format expected by ml.py"""
    
    # Create the input structure expected by ml.py
    ml_input = {
        "trainsets": trains,
        "metadata": {
            "generated_at": datetime.now().isoformat(),
            "total_trains": len(trains),
            "data_sources": [
                "train_branding_priorities.csv",
                "train_cleaning_status.csv", 
                "train_fitness_certificates.csv",
                "train_job_cards.csv",
                "train_mileage_data.csv",
                "train_stabling_geometry.csv"
            ]
        }
    }
    
    # Write to JSON file
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(ml_input, f, indent=2, default=str)
    
    print(f"Created ML input file: {output_path}")
    print(f"Total trains processed: {len(trains)}")

def main():
    """Main function to process all CSV files and create ML input"""
    
    print("Starting CSV Data Processing for KMRL ML System")
    print("=" * 60)
    
    # Define file paths
    base_path = Path("../../public")
    csv_files = {
        'branding': base_path / "train_branding_priorities.csv",
        'cleaning': base_path / "train_cleaning_status.csv",
        'fitness': base_path / "train_fitness_certificates.csv",
        'job_cards': base_path / "train_job_cards.csv",
        'mileage': base_path / "train_mileage_data.csv",
        'stabling': base_path / "train_stabling_geometry.csv"
    }
    
    # Load all CSV files
    print("Loading CSV files...")
    dataframes = {}
    for name, path in csv_files.items():
        if path.exists():
            dataframes[name] = load_csv_data(str(path))
        else:
            print(f"Warning: {path} not found, using empty data")
            dataframes[name] = pd.DataFrame()
    
    # Process each data source
    print("\nProcessing data sources...")
    branding_data = process_branding_data(dataframes['branding'])
    cleaning_data = process_cleaning_data(dataframes['cleaning'])
    fitness_data = process_fitness_data(dataframes['fitness'])
    job_cards_data = process_job_cards_data(dataframes['job_cards'])
    mileage_data = process_mileage_data(dataframes['mileage'])
    stabling_data = process_stabling_data(dataframes['stabling'])
    
    # Combine all data
    print("\nCombining all data sources...")
    combined_trains = combine_all_data(
        branding_data, cleaning_data, fitness_data,
        job_cards_data, mileage_data, stabling_data
    )
    
    # Create ML input file
    print("\nCreating ML input file...")
    output_path = "../../data/ml_input_from_csv.json"
    create_ml_input_file(combined_trains, output_path)
    
    # Print summary
    print("\nProcessing Summary:")
    print(f"   • Branding records: {len(branding_data)}")
    print(f"   • Cleaning records: {len(cleaning_data)}")
    print(f"   • Fitness records: {len(fitness_data)}")
    print(f"   • Job cards records: {len(job_cards_data)}")
    print(f"   • Mileage records: {len(mileage_data)}")
    print(f"   • Stabling records: {len(stabling_data)}")
    print(f"   • Combined trains: {len(combined_trains)}")
    
    print("\nCSV data processing completed successfully!")
    print(f"ML input file ready: {output_path}")
    print("\nNext steps:")
    print("1. Run: python ml.py --input=../data/ml_input_from_csv.json")
    print("2. Run: python create_combined_csv.py")
    print("3. Copy: combined_ml_analysis.csv to public/ml_analysis_data.csv")

if __name__ == "__main__":
    main()
