#!/usr/bin/env python3
"""
Complete data pipeline for ML service
Handles data generation, validation, and preparation for training
"""

import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from data.generate_training_data import TrainingDataGenerator, merge_with_existing
from data.validate_data import DataValidator
import pandas as pd
from datetime import datetime
import json


class DataPipeline:
    """Complete data preparation pipeline"""
    
    def __init__(self, base_data_dir='data'):
        self.base_dir = base_data_dir
        self.original_file = os.path.join(base_data_dir, 'crop_prices.csv')
        self.expanded_file = os.path.join(base_data_dir, 'crop_prices_expanded.csv')
        self.combined_file = os.path.join(base_data_dir, 'crop_prices_final.csv')
        self.validation_report = os.path.join(base_data_dir, 'validation_report.json')
        self.pipeline_log = os.path.join(base_data_dir, 'pipeline_log.json')
        
        self.log = {
            'timestamp': datetime.now().isoformat(),
            'steps_completed': [],
            'status': 'running'
        }
    
    def log_step(self, step_name, status, details=None):
        """Log pipeline step"""
        step_log = {
            'name': step_name,
            'status': status,
            'timestamp': datetime.now().isoformat(),
            'details': details or {}
        }
        self.log['steps_completed'].append(step_log)
        print(f"[{step_name}] {status}")
        if details:
            for key, value in details.items():
                print(f"  → {key}: {value}")
    
    def save_log(self):
        """Save pipeline log"""
        with open(self.pipeline_log, 'w') as f:
            json.dump(self.log, f, indent=2)
    
    def step_1_generate_data(self, num_records=500):
        """Step 1: Generate expanded training data"""
        print("\n" + "="*60)
        print("STEP 1: GENERATE TRAINING DATA")
        print("="*60 + "\n")
        
        try:
            generator = TrainingDataGenerator(output_file=self.expanded_file)
            df_expanded = generator.generate_and_save(num_records=num_records)
            
            self.log_step(
                'Generate Data',
                'COMPLETED',
                {
                    'records_generated': len(df_expanded),
                    'output_file': self.expanded_file,
                    'date_range': f"{df_expanded['date'].min()} to {df_expanded['date'].max()}"
                }
            )
            return True
        except Exception as e:
            self.log_step('Generate Data', 'FAILED', {'error': str(e)})
            print(f"✗ Error: {e}")
            return False
    
    def step_2_merge_data(self):
        """Step 2: Merge original and expanded data"""
        print("\n" + "="*60)
        print("STEP 2: MERGE DATA")
        print("="*60 + "\n")
        
        try:
            df_combined = merge_with_existing(
                original_file=self.original_file,
                expanded_file=self.expanded_file,
                output_file=self.combined_file
            )
            
            self.log_step(
                'Merge Data',
                'COMPLETED',
                {
                    'total_records': len(df_combined),
                    'original_records': 22,
                    'expansion': f"{len(df_combined) - 22} records added",
                    'output_file': self.combined_file
                }
            )
            return True
        except Exception as e:
            self.log_step('Merge Data', 'FAILED', {'error': str(e)})
            print(f"✗ Error: {e}")
            return False
    
    def step_3_validate_data(self):
        """Step 3: Validate and clean data"""
        print("\n" + "="*60)
        print("STEP 3: VALIDATE DATA")
        print("="*60 + "\n")
        
        try:
            validator = DataValidator(self.combined_file)
            validator.validate()
            
            # Read validation report
            with open(validator.quality_report.get('report_file', self.validation_report), 'r') as f:
                report = json.load(f)
            
            self.log_step(
                'Validate Data',
                'COMPLETED',
                {
                    'records_after_cleaning': len(validator.df),
                    'issues_found': validator.quality_report['issues_found'],
                    'issues_fixed': validator.quality_report['issues_fixed'],
                    'report_file': self.validation_report
                }
            )
            return True
        except Exception as e:
            self.log_step('Validate Data', 'FAILED', {'error': str(e)})
            print(f"✗ Error: {e}")
            return False
    
    def step_4_generate_statistics(self):
        """Step 4: Generate dataset statistics"""
        print("\n" + "="*60)
        print("STEP 4: GENERATE STATISTICS")
        print("="*60 + "\n")
        
        try:
            df = pd.read_csv(self.combined_file)
            
            statistics = {
                'total_records': len(df),
                'date_range': {
                    'start': str(df['date'].min()),
                    'end': str(df['date'].max())
                },
                'crops': {
                    'total_types': int(df['crop_type'].nunique()),
                    'distribution': df['crop_type'].value_counts().to_dict()
                },
                'regions': {
                    'total_regions': int(df['region'].nunique()),
                    'distribution': df['region'].value_counts().to_dict()
                },
                'quality_grades': {
                    'distribution': df['quality'].value_counts().to_dict()
                },
                'price_analysis': {
                    'mean': float(df['market_price'].mean()),
                    'median': float(df['market_price'].median()),
                    'std_dev': float(df['market_price'].std()),
                    'min': float(df['market_price'].min()),
                    'max': float(df['market_price'].max()),
                    'by_crop': {}
                },
                'seasonal_analysis': {
                    'seasons': df['season'].unique().tolist(),
                    'avg_price_by_season': df.groupby('season')['market_price'].mean().to_dict()
                }
            }
            
            # Price by crop type
            for crop in sorted(df['crop_type'].unique()):
                crop_prices = df[df['crop_type'] == crop]['market_price']
                statistics['price_analysis']['by_crop'][crop] = {
                    'count': int(len(crop_prices)),
                    'mean': float(crop_prices.mean()),
                    'min': float(crop_prices.min()),
                    'max': float(crop_prices.max())
                }
            
            stats_file = os.path.join(self.base_dir, 'dataset_statistics.json')
            with open(stats_file, 'w') as f:
                json.dump(statistics, f, indent=2)
            
            self.log_step(
                'Generate Statistics',
                'COMPLETED',
                {
                    'total_records': len(df),
                    'unique_crops': int(df['crop_type'].nunique()),
                    'unique_regions': int(df['region'].nunique()),
                    'statistics_file': stats_file
                }
            )
            
            # Print key statistics
            print("\n📊 KEY DATASET STATISTICS:\n")
            print(f"Total Records: {len(df)}")
            print(f"\nCrop Types ({df['crop_type'].nunique()}):")
            for crop, count in df['crop_type'].value_counts().items():
                print(f"  • {crop}: {count} records")
            print(f"\nPrice Range: ₹{df['market_price'].min():.2f} - ₹{df['market_price'].max():.2f}")
            print(f"Average Price: ₹{df['market_price'].mean():.2f}")
            print(f"\nSeasons:")
            for season in sorted(df['season'].unique()):
                avg_price = df[df['season'] == season]['market_price'].mean()
                print(f"  • {season}: ₹{avg_price:.2f} avg")
            print()
            
            return True
        except Exception as e:
            self.log_step('Generate Statistics', 'FAILED', {'error': str(e)})
            print(f"✗ Error: {e}")
            return False
    
    def run_complete_pipeline(self, num_records=500):
        """Run complete data preparation pipeline"""
        print("\n" + "="*60)
        print("🚀 STARTING COMPLETE DATA PIPELINE")
        print("="*60)
        print(f"Target: {num_records} new training records")
        print(f"Total expected: ~{num_records + 22} records")
        print("="*60)
        
        # Run all steps
        steps = [
            ("Generate Data", lambda: self.step_1_generate_data(num_records)),
            ("Merge Data", lambda: self.step_2_merge_data()),
            ("Validate Data", lambda: self.step_3_validate_data()),
            ("Generate Statistics", lambda: self.step_4_generate_statistics())
        ]
        
        success_count = 0
        for step_name, step_func in steps:
            if step_func():
                success_count += 1
            else:
                print(f"\n✗ Pipeline stopped at: {step_name}")
                self.log['status'] = 'failed'
                self.save_log()
                return False
        
        # Final summary
        print("\n" + "="*60)
        print("✅ COMPLETE PIPELINE SUCCESSFUL")
        print("="*60)
        print(f"Steps completed: {success_count}/{len(steps)}")
        print(f"Training data ready at: {self.combined_file}")
        print("\nNext steps:")
        print("  1. Train the ML model with new data")
        print("  2. Evaluate model performance")
        print("  3. Save improved model")
        print("="*60 + "\n")
        
        self.log['status'] = 'completed'
        self.save_log()
        
        return True


if __name__ == '__main__':
    # Run complete pipeline
    pipeline = DataPipeline()
    pipeline.run_complete_pipeline(num_records=500)
    
    print("📝 Pipeline log saved to: data/pipeline_log.json")
    print("✅ Phase 1 Complete: Data generation, merging, validation, and analysis done!")
