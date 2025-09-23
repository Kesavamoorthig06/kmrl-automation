import matplotlib.pyplot as plt
import numpy as np
import json
import os
from datetime import datetime

def generate_train_charts(train_id, metrics):
    """Generate charts for a specific train's metrics"""
    
    # Create charts directory if it doesn't exist
    # Get the directory where this script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))
    charts_dir = os.path.join(script_dir, "..", "..", "..", "public", "charts")
    if not os.path.exists(charts_dir):
        os.makedirs(charts_dir)
        print(f"Created charts directory: {charts_dir}")
    
    print(f"Charts directory: {charts_dir}")
    
    # Set style for better looking charts
    try:
        plt.style.use('seaborn-v0_8')
        print("Using seaborn-v0_8 style")
    except:
        try:
            plt.style.use('seaborn')
            print("Using seaborn style")
        except:
            plt.style.use('default')
            print("Using default style")
    
    # Create figure with subplots
    fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(12, 10))
    fig.suptitle(f'Train {train_id} Performance Metrics', fontsize=16, fontweight='bold')
    
    # 1. Performance Metrics Bar Chart
    performance_labels = ['Mileage\nEfficiency', 'Energy\nConsumption', 'Average\nSpeed', 'Acceleration\nRate']
    performance_values = [
        float(metrics['mileageEfficiency'].replace('%', '')),
        float(metrics['energyConsumption'].replace(' kWh/km', '')),
        float(metrics['averageSpeed'].replace(' km/h', '')),
        float(metrics['accelerationRate'].replace(' m/s²', ''))
    ]
    
    colors1 = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B']
    bars1 = ax1.bar(performance_labels, performance_values, color=colors1, alpha=0.8, edgecolor='white', linewidth=2)
    ax1.set_title('Performance Metrics', fontweight='bold', pad=20)
    ax1.set_ylabel('Value')
    ax1.grid(True, alpha=0.3)
    
    # Add value labels on bars
    for bar, value in zip(bars1, performance_values):
        height = bar.get_height()
        ax1.text(bar.get_x() + bar.get_width()/2., height + 0.5,
                f'{value:.1f}', ha='center', va='bottom', fontweight='bold')
    
    # 2. Operational Data Pie Chart
    operational_labels = ['Total Distance', 'Service Hours', 'Passenger Capacity', 'Load Factor']
    operational_values = [
        float(metrics['totalDistance'].replace(',', '').replace(' km', '')),
        float(metrics['serviceHours'].replace(',', '').replace(' hrs', '')),
        float(metrics['passengerCapacity']),
        float(metrics['loadFactor'].replace('%', ''))
    ]
    
    # Normalize values for pie chart
    operational_normalized = [v/max(operational_values) for v in operational_values]
    colors2 = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B']
    
    wedges, texts, autotexts = ax2.pie(operational_normalized, labels=operational_labels, colors=colors2, 
                                      autopct='%1.1f%%', startangle=90, textprops={'fontsize': 9})
    ax2.set_title('Operational Data Distribution', fontweight='bold', pad=20)
    
    # 3. Maintenance Timeline
    maintenance_days = [1, 7, 14, 21, 28, 35]
    maintenance_scores = [95, 92, 88, 85, 82, 80]  # Simulated maintenance scores over time
    
    ax3.plot(maintenance_days, maintenance_scores, marker='o', linewidth=3, markersize=8, 
             color='#10B981', markerfacecolor='white', markeredgewidth=2, markeredgecolor='#10B981')
    ax3.fill_between(maintenance_days, maintenance_scores, alpha=0.3, color='#10B981')
    ax3.set_title('Maintenance Score Trend', fontweight='bold', pad=20)
    ax3.set_xlabel('Days Since Last Service')
    ax3.set_ylabel('Maintenance Score')
    ax3.grid(True, alpha=0.3)
    ax3.set_ylim(75, 100)
    
    # 4. Safety & Compliance Gauge
    safety_score = float(metrics['safetyScore'].split('/')[0])
    
    # Create gauge chart
    theta = np.linspace(0, np.pi, 100)
    r = np.ones_like(theta)
    
    # Color zones
    ax4.fill_between(theta, 0, r, alpha=0.3, color='red', label='Critical (0-60)')
    ax4.fill_between(theta, 0, r, alpha=0.3, color='orange', label='Warning (60-80)')
    ax4.fill_between(theta, 0, r, alpha=0.3, color='green', label='Good (80-100)')
    
    # Safety score indicator
    score_angle = (safety_score / 100) * np.pi
    ax4.plot([score_angle, score_angle], [0, 1], 'k-', linewidth=4, label=f'Safety Score: {safety_score}')
    ax4.plot(score_angle, 1, 'ko', markersize=12, markerfacecolor='white', markeredgewidth=3)
    
    ax4.set_ylim(0, 1.2)
    ax4.set_xlim(0, np.pi)
    ax4.set_title('Safety Score Gauge', fontweight='bold', pad=20)
    ax4.legend(loc='upper right', fontsize=8)
    ax4.axis('off')
    
    # Add safety score text
    ax4.text(np.pi/2, 0.5, f'{safety_score}/100', ha='center', va='center', 
             fontsize=20, fontweight='bold', color='white',
             bbox=dict(boxstyle='round,pad=0.3', facecolor='black', alpha=0.7))
    
    plt.tight_layout()
    
    # Save chart
    chart_filename = f"{charts_dir}/train_{train_id}_metrics.png"
    print(f"Saving chart to: {chart_filename}")
    
    try:
        plt.savefig(chart_filename, dpi=300, bbox_inches='tight', facecolor='white')
        print(f"Chart saved successfully: {chart_filename}")
        
        # Verify file was created
        if os.path.exists(chart_filename):
            file_size = os.path.getsize(chart_filename)
            print(f"Chart file exists, size: {file_size} bytes")
        else:
            print("ERROR: Chart file was not created!")
            
    except Exception as e:
        print(f"ERROR saving chart: {e}")
        return None
        
    plt.close()
    
    return chart_filename

def generate_comparison_chart(train_ids, all_metrics):
    """Generate a comparison chart for multiple trains"""
    
    # Get the directory where this script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))
    charts_dir = os.path.join(script_dir, "..", "..", "..", "public", "charts")
    if not os.path.exists(charts_dir):
        os.makedirs(charts_dir)
    
    try:
        plt.style.use('seaborn-v0_8')
    except:
        try:
            plt.style.use('seaborn')
        except:
            plt.style.use('default')
    
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 6))
    fig.suptitle('Train Performance Comparison', fontsize=16, fontweight='bold')
    
    # Extract data for comparison
    mileage_eff = []
    energy_cons = []
    safety_scores = []
    
    for train_id in train_ids:
        metrics = all_metrics[train_id]
        mileage_eff.append(float(metrics['mileageEfficiency'].replace('%', '')))
        energy_cons.append(float(metrics['energyConsumption'].replace(' kWh/km', '')))
        safety_scores.append(float(metrics['safetyScore'].split('/')[0]))
    
    x_pos = np.arange(len(train_ids))
    
    # Mileage Efficiency Comparison
    bars1 = ax1.bar(x_pos, mileage_eff, color='#10B981', alpha=0.8, edgecolor='white', linewidth=2)
    ax1.set_title('Mileage Efficiency Comparison', fontweight='bold', pad=20)
    ax1.set_xlabel('Train ID')
    ax1.set_ylabel('Efficiency (%)')
    ax1.set_xticks(x_pos)
    ax1.set_xticklabels(train_ids, rotation=45)
    ax1.grid(True, alpha=0.3)
    
    # Add value labels
    for bar, value in zip(bars1, mileage_eff):
        height = bar.get_height()
        ax1.text(bar.get_x() + bar.get_width()/2., height + 0.5,
                f'{value:.1f}%', ha='center', va='bottom', fontweight='bold')
    
    # Safety Score Comparison
    bars2 = ax2.bar(x_pos, safety_scores, color='#3B82F6', alpha=0.8, edgecolor='white', linewidth=2)
    ax2.set_title('Safety Score Comparison', fontweight='bold', pad=20)
    ax2.set_xlabel('Train ID')
    ax2.set_ylabel('Safety Score')
    ax2.set_xticks(x_pos)
    ax2.set_xticklabels(train_ids, rotation=45)
    ax2.grid(True, alpha=0.3)
    
    # Add value labels
    for bar, value in zip(bars2, safety_scores):
        height = bar.get_height()
        ax2.text(bar.get_x() + bar.get_width()/2., height + 0.5,
                f'{value:.1f}', ha='center', va='bottom', fontweight='bold')
    
    plt.tight_layout()
    
    # Save comparison chart
    chart_filename = f"{charts_dir}/train_comparison.png"
    plt.savefig(chart_filename, dpi=300, bbox_inches='tight', facecolor='white')
    plt.close()
    
    return chart_filename

if __name__ == "__main__":
    # Example usage - this will be called from React
    import sys
    
    print(f"Python script started with args: {sys.argv}")
    print(f"Current working directory: {os.getcwd()}")
    print(f"Script location: {os.path.abspath(__file__)}")
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        print(f"Command: {command}")
        
        if command == "single":
            # Generate chart for single train
            train_id = sys.argv[2]
            metrics_json = sys.argv[3]
            metrics = json.loads(metrics_json)
            
            print(f"Generating chart for train: {train_id}")
            print(f"Metrics: {metrics}")
            
            chart_path = generate_train_charts(train_id, metrics)
            
            if chart_path:
                print(json.dumps({"success": True, "chart_path": chart_path}))
            else:
                print(json.dumps({"success": False, "error": "Chart generation failed"}))
            
        elif command == "comparison":
            # Generate comparison chart
            train_ids_json = sys.argv[2]
            all_metrics_json = sys.argv[3]
            
            train_ids = json.loads(train_ids_json)
            all_metrics = json.loads(all_metrics_json)
            
            chart_path = generate_comparison_chart(train_ids, all_metrics)
            print(json.dumps({"success": True, "chart_path": chart_path}))
    else:
        print(json.dumps({"success": False, "error": "No command provided"}))
