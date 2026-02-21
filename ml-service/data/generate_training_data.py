#!/usr/bin/env python3
"""
Generate comprehensive training dataset for crop price prediction
Creates 500+ realistic records with seasonal patterns, regional variations, and quality impacts
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
import os

class TrainingDataGenerator:
    """Generate realistic crop price training data"""
    
    def __init__(self, output_file='data/crop_prices_expanded.csv'):
        self.output_file = output_file
        self.base_prices = {
            'Wheat': {'base': 45, 'volatility': 8},
            'Rice': {'base': 65, 'volatility': 12},
            'Corn': {'base': 35, 'volatility': 6},
            'Pulses': {'base': 85, 'volatility': 15},
            'Sugarcane': {'base': 40, 'volatility': 7},
            'Cotton': {'base': 60, 'volatility': 10},
            'Soybean': {'base': 50, 'volatility': 9},
            'Vegetables': {'base': 32, 'volatility': 18},
            'Fruits': {'base': 55, 'volatility': 14},
            'Spices': {'base': 120, 'volatility': 20}
        }
        
        self.regions = ['North', 'South', 'East', 'West', 'Central', 'Northeast']
        self.qualities = ['Premium', 'Grade_A', 'Grade_B', 'Grade_C']
        self.seasons = ['Winter', 'Spring', 'Summer', 'Autumn', 'Monsoon']
        self.weather_conditions = ['Sunny', 'Rainy', 'Cloudy', 'Hot', 'Cold', 'Moderate', 'Humid']
        self.market_demands = ['Very High', 'High', 'Medium', 'Low', 'Very Low']
        
    def get_month_season(self, month):
        """Map month to season"""
        if month in [12, 1, 2]:
            return 'Winter'
        elif month in [3, 4, 5]:
            return 'Spring'
        elif month in [6, 7, 8]:
            return 'Monsoon'
        elif month in [9, 10, 11]:
            return 'Autumn'
        return 'Winter'
    
    def calculate_seasonal_multiplier(self, crop_type, season, month):
        """Calculate seasonal price multiplier"""
        # Crop-specific seasonal patterns
        seasonal_patterns = {
            'Wheat': {'Winter': 1.0, 'Spring': 0.95, 'Monsoon': 1.15, 'Autumn': 1.1},
            'Rice': {'Winter': 0.95, 'Spring': 1.0, 'Monsoon': 0.9, 'Autumn': 1.05},
            'Vegetables': {'Winter': 1.2, 'Spring': 1.0, 'Monsoon': 0.8, 'Autumn': 1.1},
            'Fruits': {'Winter': 1.1, 'Spring': 1.15, 'Monsoon': 0.85, 'Autumn': 1.0},
            'Cotton': {'Winter': 1.0, 'Spring': 1.05, 'Monsoon': 0.9, 'Autumn': 1.1},
            'Sugarcane': {'Winter': 1.2, 'Spring': 1.0, 'Monsoon': 0.95, 'Autumn': 1.05},
        }
        
        if crop_type in seasonal_patterns:
            return seasonal_patterns[crop_type].get(season, 1.0)
        return 1.0
    
    def calculate_quality_multiplier(self, quality):
        """Calculate quality-based price multiplier"""
        multipliers = {
            'Premium': 1.3,
            'Grade_A': 1.0,
            'Grade_B': 0.75,
            'Grade_C': 0.55
        }
        return multipliers.get(quality, 1.0)
    
    def calculate_region_multiplier(self, region):
        """Calculate region-based price multiplier"""
        # Different regional demand patterns
        multipliers = {
            'North': 1.0,
            'South': 1.05,
            'East': 0.95,
            'West': 1.08,
            'Central': 0.98,
            'Northeast': 1.02
        }
        return multipliers.get(region, 1.0)
    
    def calculate_demand_multiplier(self, market_demand):
        """Calculate demand-based price multiplier"""
        multipliers = {
            'Very High': 1.25,
            'High': 1.12,
            'Medium': 1.0,
            'Low': 0.88,
            'Very Low': 0.75
        }
        return multipliers.get(market_demand, 1.0)
    
    def calculate_quantity_discount(self, quantity):
        """Calculate bulk quantity discount"""
        if quantity > 10000:
            return 0.92  # 8% discount
        elif quantity > 5000:
            return 0.95  # 5% discount
        elif quantity > 2000:
            return 0.97  # 3% discount
        return 1.0  # No discount
    
    def add_random_noise(self, price, volatility=0.05):
        """Add realistic random variation to price"""
        noise = np.random.normal(0, volatility)
        return price * (1 + noise)
    
    def calculate_market_price(self, crop_type, quality, region, season, 
                               market_demand, quantity, weather=None):
        """Calculate realistic market price"""
        
        # Start with base price
        base = self.base_prices[crop_type]['base']
        volatility = self.base_prices[crop_type]['volatility'] / 100
        
        # Apply multipliers
        quality_mult = self.calculate_quality_multiplier(quality)
        region_mult = self.calculate_region_multiplier(region)
        seasonal_mult = self.calculate_seasonal_multiplier(crop_type, season, 0)
        demand_mult = self.calculate_demand_multiplier(market_demand)
        quantity_disc = self.calculate_quantity_discount(quantity)
        
        # Calculate price
        price = base * quality_mult * region_mult * seasonal_mult * demand_mult * quantity_disc
        
        # Add realistic noise
        price = self.add_random_noise(price, volatility)
        
        return round(max(price, base * 0.5), 2)  # Ensure price doesn't go too low
    
    def generate_records(self, num_records=500):
        """Generate training records"""
        records = []
        
        # Generate records across 2 years
        start_date = datetime.now() - timedelta(days=730)
        
        for i in range(num_records):
            # Random date within 2 years
            days_offset = np.random.randint(0, 730)
            record_date = start_date + timedelta(days=days_offset)
            
            # Random attributes
            crop_type = np.random.choice(list(self.base_prices.keys()))
            quality = np.random.choice(self.qualities, p=[0.2, 0.35, 0.30, 0.15])
            region = np.random.choice(self.regions)
            season = self.get_month_season(record_date.month)
            market_demand = np.random.choice(self.market_demands, p=[0.1, 0.25, 0.3, 0.25, 0.1])
            weather = np.random.choice(self.weather_conditions)
            quantity = np.random.choice([500, 800, 1000, 1500, 2000, 3000, 5000, 8000, 10000])
            
            # Calculate realistic price
            market_price = self.calculate_market_price(
                crop_type, quality, region, season, market_demand, quantity, weather
            )
            
            record = {
                'date': record_date.strftime('%Y-%m-%d'),
                'crop_type': crop_type,
                'region': region,
                'quality': quality,
                'quantity_kg': quantity,
                'market_price': market_price,
                'season': season,
                'weather': weather,
                'market_demand': market_demand,
                'source': 'generated'
            }
            
            records.append(record)
        
        return records
    
    def generate_and_save(self, num_records=500):
        """Generate and save training data"""
        print(f"Generating {num_records} training records...")
        
        # Generate records
        records = self.generate_records(num_records)
        
        # Create DataFrame
        df = pd.DataFrame(records)
        
        # Save to CSV
        os.makedirs(os.path.dirname(self.output_file), exist_ok=True)
        df.to_csv(self.output_file, index=False)
        
        print(f"\n{'='*60}")
        print(f"Training data generated successfully!")
        print(f"{'='*60}")
        print(f"Output file: {self.output_file}")
        print(f"Total records: {len(df)}")
        print(f"\nDataset Summary:")
        print(f"  Date range: {df['date'].min()} to {df['date'].max()}")
        print(f"  Crops: {df['crop_type'].nunique()} types")
        print(f"    - {', '.join(df['crop_type'].unique())}")
        print(f"  Regions: {df['region'].nunique()}")
        print(f"  Quality grades: {df['quality'].nunique()}")
        print(f"  Price range: ₹{df['market_price'].min():.2f} - ₹{df['market_price'].max():.2f}")
        print(f"  Avg price: ₹{df['market_price'].mean():.2f}")
        print(f"\nPrice by crop type:")
        for crop in sorted(df['crop_type'].unique()):
            crop_data = df[df['crop_type'] == crop]['market_price']
            print(f"  {crop}: ₹{crop_data.mean():.2f} (range: {crop_data.min():.2f}-{crop_data.max():.2f})")
        print(f"\nPrice by quality:")
        for quality in self.qualities:
            quality_data = df[df['quality'] == quality]['market_price']
            if len(quality_data) > 0:
                print(f"  {quality}: ₹{quality_data.mean():.2f} (avg multiplier: {quality_data.mean()/df['market_price'].mean():.2f}x)")
        print(f"{'='*60}\n")
        
        return df


def merge_with_existing(original_file, expanded_file, output_file):
    """Merge original data with new expanded data"""
    print(f"Merging original and expanded data...")
    
    # Load both datasets
    original_df = pd.read_csv(original_file)
    expanded_df = pd.read_csv(expanded_file)
    
    # Combine
    combined_df = pd.concat([original_df, expanded_df], ignore_index=True)
    
    # Remove duplicates
    combined_df = combined_df.drop_duplicates(subset=['date', 'crop_type', 'region', 'quality'])
    
    # Sort by date
    combined_df['date'] = pd.to_datetime(combined_df['date'])
    combined_df = combined_df.sort_values('date').reset_index(drop=True)
    
    # Save
    combined_df.to_csv(output_file, index=False)
    
    print(f"Combined dataset: {len(combined_df)} records")
    print(f"Saved to: {output_file}\n")
    
    return combined_df


if __name__ == '__main__':
    # Generate expanded training data
    generator = TrainingDataGenerator(output_file='data/crop_prices_expanded.csv')
    expanded_df = generator.generate_and_save(num_records=500)
    
    # Merge with original data
    combined_df = merge_with_existing(
        original_file='data/crop_prices.csv',
        expanded_file='data/crop_prices_expanded.csv',
        output_file='data/crop_prices_final.csv'
    )
    
    print("✅ Phase 1 Step 1 Complete: Training data expanded from 22 to 522 records!")
    print("\nNext steps:")
    print("  1. Run model training with new data")
    print("  2. Validate model quality improvements")
    print("  3. Set up automated data collection pipeline")
