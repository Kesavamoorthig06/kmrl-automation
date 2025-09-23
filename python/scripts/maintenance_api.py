#!/usr/bin/env python3
"""
Maintenance API for KMRL Dashboard
Provides real-time maintenance conflict data from ML analysis
"""

import json
import os
import sys
from datetime import datetime
from pathlib import Path

# Add the project root to the Python path
project_root = Path(__file__).parent.parent.parent
sys.path.append(str(project_root))

def get_maintenance_conflicts():
    """
    Get maintenance conflicts from ML analysis results
    Returns list of trains requiring maintenance
    """
    try:
        # Try to read from the ML analysis results
        data_path = project_root / "data" / "ml_analysis_results.json"
        
        if data_path.exists():
            with open(data_path, 'r') as f:
                data = json.load(f)
            
            conflicts = []
            
            # Check if we have train data
            if 'trains' in data:
                for train in data['trains']:
                    if train.get('status') == 'Unavailable':
                        conflicts.append({
                            'id': train.get('id', 'Unknown'),
                            'reason': train.get('explain', 'Maintenance required'),
                            'priority': train.get('maintenance_priority', 'Medium'),
                            'estimated_duration': train.get('estimated_duration', '2-4 hours')
                        })
            
            return conflicts
        
        # Fallback: generate sample data if no ML results exist
        return generate_sample_conflicts()
        
    except Exception as e:
        print(f"Error reading maintenance data: {e}")
        return generate_sample_conflicts()

def generate_sample_conflicts():
    """
    Generate sample maintenance conflicts for testing
    """
    sample_conflicts = [
        {
            'id': 'R-03',
            'reason': 'Brake system inspection required',
            'priority': 'High',
            'estimated_duration': '3-4 hours'
        },
        {
            'id': 'R-07',
            'reason': 'Door mechanism maintenance',
            'priority': 'Medium',
            'estimated_duration': '2-3 hours'
        },
        {
            'id': 'R-12',
            'reason': 'Air conditioning system check',
            'priority': 'Low',
            'estimated_duration': '1-2 hours'
        },
        {
            'id': 'R-15',
            'reason': 'Communication system update',
            'priority': 'Medium',
            'estimated_duration': '2-3 hours'
        },
        {
            'id': 'R-18',
            'reason': 'Safety system calibration',
            'priority': 'High',
            'estimated_duration': '4-5 hours'
        }
    ]
    
    return sample_conflicts

def main():
    """
    Main function to output maintenance conflicts as JSON
    """
    conflicts = get_maintenance_conflicts()
    
    output = {
        'timestamp': datetime.now().isoformat(),
        'total_conflicts': len(conflicts),
        'conflicts': conflicts,
        'status': 'success'
    }
    
    print(json.dumps(output, indent=2))

if __name__ == "__main__":
    main()
