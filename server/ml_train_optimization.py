#!/usr/bin/env python3
"""
ML Train Optimization System
Processes 6 CSV files and generates optimized train selection for deployment
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
import os
import sys
from typing import Dict, List, Tuple
import warnings
warnings.filterwarnings('ignore')

class TrainOptimizationEngine:
    def __init__(self):
        self.csv_files = {
            'fitness_certificates': '../public/train_fitness_certificates.csv',
            'job_cards': '../public/train_job_cards.csv',
            'branding_priorities': '../public/train_branding_priorities.csv',
            'mileage_data': '../public/train_mileage_data.csv',
            'cleaning_status': '../public/train_cleaning_status.csv',
            'stabling_geometry': '../public/train_stabling_geometry.csv'
        }
        self.data = {}
        self.optimized_results = None
        
    def load_data(self):
        """Load all 6 CSV files"""
        print("🔄 Loading train data from 6 CSV files...")
        
        for name, file_path in self.csv_files.items():
            try:
                if os.path.exists(file_path):
                    self.data[name] = pd.read_csv(file_path)
                    print(f"✅ Loaded {name}: {len(self.data[name])} records")
                else:
                    print(f"❌ File not found: {file_path}")
                    return False
            except Exception as e:
                print(f"❌ Error loading {name}: {str(e)}")
                return False
        
        return True
    
    def calculate_fitness_score(self, train_id: str) -> Tuple[float, str]:
        """Calculate fitness certificate score"""
        fitness_data = self.data['fitness_certificates']
        train_data = fitness_data[fitness_data['train_id'] == train_id]
        
        if train_data.empty:
            return 0.0, "No fitness data"
        
        train_data = train_data.iloc[0]
        
        # Check certificate validity
        certificates = [
            train_data['rolling_stock_certificate'],
            train_data['signalling_certificate'],
            train_data['telecom_certificate'],
            train_data['brake_certificate'],
            train_data['electrical_certificate'],
            train_data['mechanical_certificate']
        ]
        
        valid_certs = sum(1 for cert in certificates if cert == 'valid')
        total_certs = len(certificates)
        fitness_score = (valid_certs / total_certs) * 100
        
        # Check expiry dates
        expiry_date = pd.to_datetime(train_data['certificate_expiry_date'])
        days_to_expiry = (expiry_date - datetime.now()).days
        
        if days_to_expiry < 30:
            fitness_score *= 0.8  # Penalty for near expiry
        
        status = "compliant" if train_data['compliance_status'] == 'compliant' else "non_compliant"
        
        return fitness_score, status
    
    def calculate_job_card_score(self, train_id: str) -> Tuple[float, str]:
        """Calculate job card status score"""
        job_data = self.data['job_cards']
        train_data = job_data[job_data['train_id'] == train_id]
        
        if train_data.empty:
            return 0.0, "No job card data"
        
        train_data = train_data.iloc[0]
        
        # Check job card status
        if train_data['job_card_status'] == 'completed':
            base_score = 100.0
        elif train_data['job_card_status'] == 'open':
            base_score = 0.0
        else:
            base_score = 50.0
        
        # Penalty for critical issues
        critical_issues = train_data['critical_issues']
        if critical_issues > 0:
            base_score *= (1 - critical_issues * 0.2)
        
        # Bonus for quality score
        quality_score = train_data['quality_score']
        if quality_score > 0:
            base_score = (base_score + quality_score) / 2
        
        status = "completed" if train_data['job_card_status'] == 'completed' else "open"
        
        return max(0, base_score), status
    
    def calculate_branding_score(self, train_id: str) -> Tuple[float, str]:
        """Calculate branding priority score"""
        branding_data = self.data['branding_priorities']
        train_data = branding_data[branding_data['train_id'] == train_id]
        
        if train_data.empty:
            return 0.0, "No branding data"
        
        train_data = train_data.iloc[0]
        
        # Base score from priority level (1-10 scale)
        priority_score = train_data['branding_priority_level'] * 10
        
        # Bonus for completion percentage
        completion_bonus = train_data['completion_percentage'] * 0.1
        
        # Revenue factor
        revenue_factor = min(1.0, train_data['revenue_generated'] / 200000)
        
        final_score = priority_score + completion_bonus + (revenue_factor * 20)
        
        status = "high_priority" if train_data['branding_priority_level'] >= 8 else "medium_priority" if train_data['branding_priority_level'] >= 5 else "low_priority"
        
        return min(100, final_score), status
    
    def calculate_mileage_score(self, train_id: str) -> Tuple[float, str]:
        """Calculate mileage efficiency score"""
        mileage_data = self.data['mileage_data']
        train_data = mileage_data[mileage_data['train_id'] == train_id]
        
        if train_data.empty:
            return 0.0, "No mileage data"
        
        train_data = train_data.iloc[0]
        
        # Mileage efficiency score
        mileage_efficiency = train_data['mileage_efficiency'] * 100
        
        # Performance score
        performance_score = train_data['performance_score']
        
        # Wear factor penalty
        wear_penalty = train_data['wear_factor'] * 10
        
        # Route complexity factor
        route_complexity = train_data['route_complexity']
        complexity_bonus = {'low': 5, 'medium': 0, 'high': -5}[route_complexity]
        
        final_score = (mileage_efficiency + performance_score) / 2 - wear_penalty + complexity_bonus
        
        status = "optimal" if final_score >= 90 else "good" if final_score >= 75 else "needs_attention"
        
        return max(0, final_score), status
    
    def calculate_cleaning_score(self, train_id: str) -> Tuple[float, str]:
        """Calculate cleaning status score"""
        cleaning_data = self.data['cleaning_status']
        train_data = cleaning_data[cleaning_data['train_id'] == train_id]
        
        if train_data.empty:
            return 0.0, "No cleaning data"
        
        train_data = train_data.iloc[0]
        
        # Average of interior and exterior condition
        avg_condition = (train_data['interior_condition'] + train_data['exterior_condition']) / 2
        
        # Cleaning score
        cleaning_score = train_data['cleaning_score']
        
        # Quality rating bonus
        quality_rating = train_data['cleaning_quality_rating']
        quality_bonus = {'excellent': 5, 'good': 0, 'fair': -5, 'poor': -10}.get(quality_rating, 0)
        
        final_score = (avg_condition + cleaning_score) / 2 + quality_bonus
        
        status = "excellent" if final_score >= 95 else "good" if final_score >= 85 else "needs_cleaning"
        
        return max(0, final_score), status
    
    def calculate_stabling_score(self, train_id: str) -> Tuple[float, str]:
        """Calculate stabling geometry score"""
        stabling_data = self.data['stabling_geometry']
        train_data = stabling_data[stabling_data['train_id'] == train_id]
        
        if train_data.empty:
            return 0.0, "No stabling data"
        
        train_data = train_data.iloc[0]
        
        # Operational efficiency
        operational_efficiency = train_data['operational_efficiency']
        
        # Deployment time factor (lower is better)
        deployment_time = train_data['deployment_time_minutes']
        time_score = max(0, 100 - (deployment_time - 8) * 2)
        
        # Shunting complexity penalty
        shunting_complexity = train_data['shunting_complexity']
        complexity_penalty = {'low': 0, 'medium': -5, 'high': -15}[shunting_complexity]
        
        # Access and facilities bonus
        access_bonus = 0
        if train_data['maintenance_access'] == 'excellent':
            access_bonus += 5
        if train_data['power_supply_available'] == 'yes':
            access_bonus += 3
        if train_data['water_supply_available'] == 'yes':
            access_bonus += 2
        
        final_score = (operational_efficiency + time_score) / 2 + complexity_penalty + access_bonus
        
        status = "optimal" if final_score >= 90 else "good" if final_score >= 75 else "challenging"
        
        return max(0, final_score), status
    
    def calculate_composite_score(self, train_id: str) -> Dict:
        """Calculate composite score for a train"""
        scores = {}
        statuses = {}
        
        # Calculate individual scores
        scores['fitness'], statuses['fitness'] = self.calculate_fitness_score(train_id)
        scores['job_card'], statuses['job_card'] = self.calculate_job_card_score(train_id)
        scores['branding'], statuses['branding'] = self.calculate_branding_score(train_id)
        scores['mileage'], statuses['mileage'] = self.calculate_mileage_score(train_id)
        scores['cleaning'], statuses['cleaning'] = self.calculate_cleaning_score(train_id)
        scores['stabling'], statuses['stabling'] = self.calculate_stabling_score(train_id)
        
        # Weighted composite score
        weights = {
            'fitness': 0.25,      # 25% - Critical for safety
            'job_card': 0.20,     # 20% - Critical for operations
            'branding': 0.15,     # 15% - Revenue generation
            'mileage': 0.15,      # 15% - Efficiency
            'cleaning': 0.10,     # 10% - Passenger experience
            'stabling': 0.15      # 15% - Operational efficiency
        }
        
        composite_score = sum(scores[factor] * weights[factor] for factor in weights)
        
        # Determine overall status
        critical_failures = sum(1 for factor in ['fitness', 'job_card'] if scores[factor] < 70)
        if critical_failures > 0:
            overall_status = "Unavailable"
        elif composite_score >= 85:
            overall_status = "Available"
        elif composite_score >= 70:
            overall_status = "Available"
        else:
            overall_status = "Unavailable"
        
        return {
            'train_id': train_id,
            'composite_score': round(composite_score, 4),
            'overall_status': overall_status,
            'individual_scores': scores,
            'individual_statuses': statuses,
            'explanation': self.generate_explanation(scores, statuses, overall_status)
        }
    
    def generate_explanation(self, scores: Dict, statuses: Dict, overall_status: str) -> str:
        """Generate explanation for train status"""
        explanations = []
        
        if scores['fitness'] < 70:
            explanations.append("Fitness certificates require attention")
        if scores['job_card'] < 70:
            explanations.append("Open job cards need completion")
        if scores['branding'] < 50:
            explanations.append("Low branding priority")
        if scores['mileage'] < 70:
            explanations.append("Mileage efficiency below optimal")
        if scores['cleaning'] < 80:
            explanations.append("Cleaning status needs improvement")
        if scores['stabling'] < 70:
            explanations.append("Stabling geometry challenging")
        
        if not explanations:
            explanations.append("All systems optimal for deployment")
        
        return ", ".join(explanations)
    
    def optimize_train_selection(self, target_count: int = 14) -> pd.DataFrame:
        """Optimize train selection for deployment"""
        print(f"🧠 Running ML optimization for {target_count} trains...")
        
        # Get all train IDs
        all_train_ids = set()
        for data in self.data.values():
            all_train_ids.update(data['train_id'].unique())
        
        # Calculate scores for all trains
        results = []
        for train_id in sorted(all_train_ids):
            result = self.calculate_composite_score(train_id)
            results.append(result)
        
        # Convert to DataFrame
        results_df = pd.DataFrame(results)
        
        # Sort by composite score (descending)
        results_df = results_df.sort_values('composite_score', ascending=False)
        
        # Select top available trains
        available_trains = results_df[results_df['overall_status'] == 'Available']
        selected_trains = available_trains.head(target_count)
        
        # Calculate summary statistics
        total_trains = len(results_df)
        available_count = len(available_trains)
        selected_count = len(selected_trains)
        
        print(f"📊 Optimization Results:")
        print(f"   Total trains analyzed: {total_trains}")
        print(f"   Available trains: {available_count}")
        print(f"   Selected for deployment: {selected_count}")
        
        # Add summary information
        summary = {
            'total_trains': total_trains,
            'available_trains': available_count,
            'selected_trains': selected_count,
            'optimization_timestamp': datetime.now().isoformat(),
            'ml_algorithm': 'Multi-Factor Weighted Optimization',
            'data_sources': list(self.csv_files.keys())
        }
        
        return results_df, selected_trains, summary
    
    def generate_output_csv(self, results_df: pd.DataFrame, output_file: str = '../public/ml_analysis_data.csv'):
        """Generate final CSV for dashboard consumption"""
        print(f"📝 Generating output CSV: {output_file}")
        
        # Prepare data for dashboard
        output_data = []
        
        for _, row in results_df.iterrows():
            # Get additional data from source CSVs
            fitness_data = self.data['fitness_certificates'][self.data['fitness_certificates']['train_id'] == row['train_id']]
            branding_data = self.data['branding_priorities'][self.data['branding_priorities']['train_id'] == row['train_id']]
            stabling_data = self.data['stabling_geometry'][self.data['stabling_geometry']['train_id'] == row['train_id']]
            mileage_data = self.data['mileage_data'][self.data['mileage_data']['train_id'] == row['train_id']]
            
            output_row = {
                'train_id': row['train_id'],
                'status': row['overall_status'],
                'score': row['composite_score'],
                'stabling_bay': stabling_data['stabling_bay'].iloc[0] if not stabling_data.empty else 'Unknown',
                'branding_priority': branding_data['branding_priority_level'].iloc[0] if not branding_data.empty else 0,
                'mileage': mileage_data['total_mileage'].iloc[0] if not mileage_data.empty else 0,
                'last_cleaned_date': self.data['cleaning_status'][self.data['cleaning_status']['train_id'] == row['train_id']]['last_cleaned_date'].iloc[0] if not self.data['cleaning_status'][self.data['cleaning_status']['train_id'] == row['train_id']].empty else 'Unknown',
                'assignment': 'Service' if row['overall_status'] == 'Available' else 'Maintenance',
                'fitness_certificate_valid': 'Yes' if row['individual_scores']['fitness'] >= 70 else 'No',
                'job_card_status': 'Clear' if row['individual_scores']['job_card'] >= 70 else 'Open',
                'mileage_score': round(row['individual_scores']['mileage'], 2),
                'branding_score': round(row['individual_scores']['branding'], 2),
                'cleaning_score': round(row['individual_scores']['cleaning'], 2),
                'shunting_score': round(row['individual_scores']['stabling'], 2),
                'prelim_score': round(row['composite_score'], 4),
                'final_score_ga': round(row['composite_score'], 4),
                'total_shunting_cost': round(np.random.uniform(2.5, 4.5), 2),  # Simulated cost
                'count_penalty': 0 if row['overall_status'] == 'Available' else 1,
                'shunt_penalty': 0 if row['individual_scores']['stabling'] >= 70 else 1,
                'branding_shortfall': 'False' if row['individual_scores']['branding'] >= 50 else 'True',
                'generation_timestamp': datetime.now().isoformat(),
                'explanation': row['explanation']
            }
            output_data.append(output_row)
        
        # Create DataFrame and save
        output_df = pd.DataFrame(output_data)
        output_df.to_csv(output_file, index=False)
        
        print(f"✅ Output CSV generated with {len(output_df)} records")
        return output_df
    
    def run_optimization(self):
        """Main optimization pipeline"""
        print("🚀 Starting ML Train Optimization Pipeline")
        print("=" * 50)
        
        # Load data
        if not self.load_data():
            print("❌ Failed to load data. Exiting.")
            return False
        
        # Run optimization
        results_df, selected_trains, summary = self.optimize_train_selection()
        
        # Generate output
        output_df = self.generate_output_csv(results_df)
        
        # Print summary
        print("\n📈 Optimization Summary:")
        print(f"   Algorithm: {summary['ml_algorithm']}")
        print(f"   Data Sources: {', '.join(summary['data_sources'])}")
        print(f"   Total Trains: {summary['total_trains']}")
        print(f"   Available: {summary['available_trains']}")
        print(f"   Selected: {summary['selected_trains']}")
        print(f"   Success Rate: {(summary['selected_trains']/summary['available_trains']*100):.1f}%")
        
        # Show top 5 selected trains
        print("\n🏆 Top 5 Selected Trains:")
        for i, (_, train) in enumerate(selected_trains.head().iterrows(), 1):
            print(f"   {i}. {train['train_id']} - Score: {train['composite_score']:.4f} - {train['overall_status']}")
        
        print("\n✅ ML Optimization Complete!")
        return True

def main():
    """Main execution function"""
    try:
        optimizer = TrainOptimizationEngine()
        success = optimizer.run_optimization()
        
        if success:
            print("\n🎉 ML optimization completed successfully!")
            sys.exit(0)
        else:
            print("\n💥 ML optimization failed!")
            sys.exit(1)
            
    except Exception as e:
        print(f"\n💥 Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
