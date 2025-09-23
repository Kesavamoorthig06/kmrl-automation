#!/usr/bin/env python3
"""
Test script to verify chart generation works independently
"""

import sys
import os

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from generate_charts import generate_train_charts

def test_chart_generation():
    """Test chart generation with sample data"""
    
    # Sample metrics data
    test_metrics = {
        'mileageEfficiency': '85.2%',
        'energyConsumption': '3.2 kWh/km',
        'averageSpeed': '45.0 km/h',
        'accelerationRate': '1.2 m/s²',
        'totalDistance': '15,000 km',
        'serviceHours': '2,500 hrs',
        'passengerCapacity': 300,
        'loadFactor': '75.5%',
        'safetyScore': '92/100',
        'maintenanceScore': '88/100',
        'operationalEfficiency': '78.5%',
        'fuelEfficiency': '9.8 km/L',
        'brakeEfficiency': '89.3%'
    }
    
    print("Testing chart generation...")
    print(f"Test metrics: {test_metrics}")
    
    try:
        chart_path = generate_train_charts("R-01", test_metrics)
        
        if chart_path and os.path.exists(chart_path):
            print(f"✅ SUCCESS: Chart generated at {chart_path}")
            print(f"File size: {os.path.getsize(chart_path)} bytes")
            return True
        else:
            print("❌ FAILED: Chart was not created")
            return False
            
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

if __name__ == "__main__":
    success = test_chart_generation()
    sys.exit(0 if success else 1)
