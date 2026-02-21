#!/usr/bin/env python3
"""
Data validation and quality checks for training dataset
Ensures data integrity, removes outliers, handles missing values
"""

import pandas as pd
import numpy as np
from scipy import stats
import json
import os
from datetime import datetime

class DataValidator:
    """Validate and clean training data"""
    
    def __init__(self, filepath):
        self.filepath = filepath
        self.df = None
        self.quality_report = {
            'timestamp': datetime.now().isoformat(),
            'checks': [],
            'issues_found': 0,
            'issues_fixed': 0
        }
    
    def load_data(self):
        """Load data from CSV"""
        try:
            self.df = pd.read_csv(self.filepath)
            print(f"✓ Loaded {len(self.df)} records from {self.filepath}")
            return True
        except Exception as e:
            print(f"✗ Error loading data: {e}")
            return False
    
    def check_missing_values(self):
        """Check for missing values"""
        check = {'name': 'Missing Values', 'passed': True, 'details': []}
        
        missing = self.df.isnull().sum()
        if missing.sum() > 0:
            check['passed'] = False
            self.quality_report['issues_found'] += 1
            for col, count in missing[missing > 0].items():
                detail = f"Column '{col}' has {count} missing values ({count/len(self.df)*100:.1f}%)"
                check['details'].append(detail)
                # Fill missing values
                if col == 'market_price':
                    self.df[col].fillna(self.df[col].median(), inplace=True)
                elif col in ['weather', 'market_demand', 'season']:
                    self.df[col].fillna('Unknown', inplace=True)
                else:
                    self.df[col].fillna(self.df[col].mode()[0], inplace=True)
                self.quality_report['issues_fixed'] += 1
        else:
            check['details'].append("No missing values found ✓")
        
        self.quality_report['checks'].append(check)
        return check
    
    def check_duplicates(self):
        """Check for duplicate records"""
        check = {'name': 'Duplicate Records', 'passed': True, 'details': []}
        
        duplicates = self.df.duplicated().sum()
        if duplicates > 0:
            check['passed'] = False
            self.quality_report['issues_found'] += 1
            check['details'].append(f"Found {duplicates} duplicate records")
            # Remove duplicates
            self.df = self.df.drop_duplicates().reset_index(drop=True)
            self.quality_report['issues_fixed'] += 1
            check['details'].append("Duplicates removed ✓")
        else:
            check['details'].append("No duplicates found ✓")
        
        self.quality_report['checks'].append(check)
        return check
    
    def check_price_outliers(self, method='iqr', threshold=1.5):
        """Detect and handle price outliers using IQR or Z-score"""
        check = {'name': 'Price Outliers', 'passed': True, 'details': []}
        
        if method == 'iqr':
            Q1 = self.df['market_price'].quantile(0.25)
            Q3 = self.df['market_price'].quantile(0.75)
            IQR = Q3 - Q1
            lower_bound = Q1 - threshold * IQR
            upper_bound = Q3 + threshold * IQR
            outliers = (self.df['market_price'] < lower_bound) | (self.df['market_price'] > upper_bound)
        else:  # z-score method
            z_scores = np.abs(stats.zscore(self.df['market_price']))
            outliers = z_scores > threshold
        
        num_outliers = outliers.sum()
        if num_outliers > 0:
            check['passed'] = False
            self.quality_report['issues_found'] += 1
            check['details'].append(f"Found {num_outliers} price outliers ({num_outliers/len(self.df)*100:.1f}%)")
            
            # Show examples
            outlier_prices = self.df[outliers]['market_price'].values[:5]
            check['details'].append(f"Example outliers: {outlier_prices.tolist()}")
            
            # Remove outliers
            self.df = self.df[~outliers].reset_index(drop=True)
            self.quality_report['issues_fixed'] += 1
            check['details'].append(f"Removed {num_outliers} outliers ✓")
        else:
            check['details'].append("No price outliers found ✓")
        
        self.quality_report['checks'].append(check)
        return check
    
    def check_quantity_validity(self):
        """Check if quantities are reasonable"""
        check = {'name': 'Quantity Validity', 'passed': True, 'details': []}
        
        invalid = (self.df['quantity_kg'] <= 0) | (self.df['quantity_kg'] > 100000)
        if invalid.sum() > 0:
            check['passed'] = False
            self.quality_report['issues_found'] += 1
            check['details'].append(f"Found {invalid.sum()} invalid quantities")
            # Remove invalid
            self.df = self.df[~invalid].reset_index(drop=True)
            self.quality_report['issues_fixed'] += 1
            check['details'].append("Invalid quantities removed ✓")
        else:
            check['details'].append("All quantities are valid ✓")
        
        self.quality_report['checks'].append(check)
        return check
    
    def check_categorical_values(self):
        """Validate categorical columns"""
        check = {'name': 'Categorical Values', 'passed': True, 'details': []}
        
        valid_values = {
            'crop_type': ['Wheat', 'Rice', 'Corn', 'Pulses', 'Sugarcane', 'Cotton', 'Soybean', 'Vegetables', 'Fruits', 'Spices'],
            'region': ['North', 'South', 'East', 'West', 'Central', 'Northeast'],
            'quality': ['Premium', 'Grade_A', 'Grade_B', 'Grade_C'],
            'season': ['Winter', 'Spring', 'Summer', 'Autumn', 'Monsoon'],
            'market_demand': ['Very High', 'High', 'Medium', 'Low', 'Very Low']
        }
        
        for column, valid_list in valid_values.items():
            if column in self.df.columns:
                invalid = ~self.df[column].isin(valid_list)
                if invalid.sum() > 0:
                    check['passed'] = False
                    self.quality_report['issues_found'] += 1
                    invalid_values = self.df[invalid][column].unique()[:5]
                    check['details'].append(f"Column '{column}' has invalid values: {invalid_values.tolist()}")
                    # Fix by mapping to closest valid value or removing
                    self.df = self.df[~invalid].reset_index(drop=True)
                    self.quality_report['issues_fixed'] += 1
        
        if check['passed']:
            check['details'].append("All categorical values are valid ✓")
        
        self.quality_report['checks'].append(check)
        return check
    
    def check_data_distribution(self):
        """Check data distribution across features"""
        check = {'name': 'Data Distribution', 'passed': True, 'details': []}
        
        # Check crop distribution
        crop_dist = self.df['crop_type'].value_counts()
        check['details'].append(f"Crop types distribution:")
        for crop, count in crop_dist.items():
            pct = count / len(self.df) * 100
            check['details'].append(f"  - {crop}: {count} records ({pct:.1f}%)")
        
        # Check region distribution
        region_dist = self.df['region'].value_counts()
        min_region_pct = region_dist.min() / len(self.df) * 100
        if min_region_pct < 5:
            check['passed'] = False
            check['details'].append(f"Warning: Unbalanced regional data (min: {min_region_pct:.1f}%)")
        
        self.quality_report['checks'].append(check)
        return check
    
    def generate_statistics(self):
        """Generate dataset statistics"""
        stats_info = {
            'total_records': len(self.df),
            'date_range': f"{self.df['date'].min()} to {self.df['date'].max()}",
            'price_statistics': {
                'mean': float(self.df['market_price'].mean()),
                'median': float(self.df['market_price'].median()),
                'std_dev': float(self.df['market_price'].std()),
                'min': float(self.df['market_price'].min()),
                'max': float(self.df['market_price'].max()),
                'q1': float(self.df['market_price'].quantile(0.25)),
                'q3': float(self.df['market_price'].quantile(0.75))
            },
            'quantity_statistics': {
                'mean': float(self.df['quantity_kg'].mean()),
                'median': float(self.df['quantity_kg'].median()),
                'min': float(self.df['quantity_kg'].min()),
                'max': float(self.df['quantity_kg'].max())
            },
            'unique_values': {
                'crops': int(self.df['crop_type'].nunique()),
                'regions': int(self.df['region'].nunique()),
                'qualities': int(self.df['quality'].nunique()),
                'seasons': int(self.df['season'].nunique())
            }
        }
        return stats_info
    
    def save_report(self, output_file='data/validation_report.json'):
        """Save validation report"""
        os.makedirs(os.path.dirname(output_file), exist_ok=True)
        
        # Add statistics to report
        self.quality_report['statistics'] = self.generate_statistics()
        
        with open(output_file, 'w') as f:
            json.dump(self.quality_report, f, indent=2)
        
        return output_file
    
    def validate(self):
        """Run all validation checks"""
        print("\n" + "="*60)
        print("DATA VALIDATION REPORT")
        print("="*60 + "\n")
        
        if not self.load_data():
            return False
        
        # Run checks
        self.check_missing_values()
        self.check_duplicates()
        self.check_quantity_validity()
        self.check_categorical_values()
        self.check_price_outliers()
        self.check_data_distribution()
        
        # Save cleaned data
        self.df.to_csv(self.filepath, index=False)
        
        # Save report
        report_file = self.save_report()
        
        # Print summary
        print("\n" + "="*60)
        print("VALIDATION SUMMARY")
        print("="*60)
        for check in self.quality_report['checks']:
            status = "✓ PASS" if check['passed'] else "✗ FAIL"
            print(f"\n{status} - {check['name']}")
            for detail in check['details']:
                print(f"  {detail}")
        
        print(f"\nTotal records after cleaning: {len(self.df)}")
        print(f"Issues found: {self.quality_report['issues_found']}")
        print(f"Issues fixed: {self.quality_report['issues_fixed']}")
        print(f"\nValidation report saved to: {report_file}")
        print("="*60 + "\n")
        
        return True


if __name__ == '__main__':
    # Validate combined data
    validator = DataValidator('data/crop_prices_final.csv')
    validator.validate()
    print("✅ Phase 1 Step 2 Complete: Data validated and cleaned!")
