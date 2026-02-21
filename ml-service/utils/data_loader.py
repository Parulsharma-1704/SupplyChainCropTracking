# ml-service/utils/data_loader.py
import pandas as pd
import numpy as np
import os
from datetime import datetime, timedelta

def load_crop_data(filepath='data/crop_prices.csv'):
    """Load crop price data from CSV"""
    
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        print("Creating sample data...")
        return create_sample_data(filepath)
    
    try:
        df = pd.read_csv(filepath)
        print(f"Loaded {len(df)} records from {filepath}")
        return df
    except Exception as e:
        print(f"Error loading data: {e}")
        return None

def create_sample_data(filepath='data/crop_prices.csv'):
    """Create sample crop price data for testing"""
    
    print("Generating sample crop price data...")
    
    # Define crop types
    crop_types = ['Wheat', 'Rice', 'Corn', 'Pulses', 'Vegetables', 'Fruits']
    regions = ['North', 'South', 'East', 'West']
    qualities = ['Premium', 'Grade_A', 'Grade_B', 'Grade_C']
    seasons = ['Winter', 'Spring', 'Summer', 'Autumn']
    weather = ['Sunny', 'Rainy', 'Cloudy', 'Hot', 'Cold']
    demands = ['High', 'Medium', 'Low']
    
    # Generate dates for the last 2 years
    end_date = datetime.now()
    start_date = end_date - timedelta(days=730)
    dates = pd.date_range(start=start_date, end=end_date, freq='W')
    
    # Base prices by crop type
    base_prices = {
        'Wheat': 45,
        'Rice': 65,
        'Corn': 35,
        'Pulses': 85,
        'Vegetables': 32,
        'Fruits': 55
    }
    
    data = []
    
    for date in dates:
        for _ in range(5):  # 5 records per week
            crop_type = np.random.choice(crop_types)
            region = np.random.choice(regions)
            quality = np.random.choice(qualities)
            
            # Calculate price with variations
            base = base_prices[crop_type]
            quality_mult = 1.2 if quality == 'Premium' else 1.0 if quality == 'Grade_A' else 0.8
            region_mult = 1.05 if region in ['South', 'West'] else 1.0
            season = get_season_from_date(date)
            season_mult = 1.1 if season in ['Spring', 'Autumn'] else 1.0
            
            price = base * quality_mult * region_mult * season_mult
            price += np.random.normal(0, 5)  # Add randomness
            
            # Quantity
            quantity = np.random.randint(500, 3000)
            
            data.append({
                'date': date.strftime('%Y-%m-%d'),
                'crop_type': crop_type,
                'region': region,
                'quality': quality,
                'quantity_kg': quantity,
                'market_price': max(10, round(price, 2)),  # Ensure positive
                'season': season,
                'weather': np.random.choice(weather),
                'market_demand': np.random.choice(demands)
            })
    
    df = pd.DataFrame(data)
    
    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    
    # Save to CSV
    df.to_csv(filepath, index=False)
    print(f"Created {len(df)} sample records at {filepath}")
    
    return df

def get_season_from_date(date):
    """Get season from date"""
    month = date.month
    if month in [12, 1, 2]:
        return 'Winter'
    elif month in [3, 4, 5]:
        return 'Spring'
    elif month in [6, 7, 8]:
        return 'Summer'
    else:
        return 'Autumn'

def validate_data_quality(df):
    """Validate data quality"""
    issues = []
    
    # Check for missing values
    missing = df.isnull().sum()
    if missing.any():
        issues.append(f"Missing values: {missing[missing > 0].to_dict()}")
    
    # Check for negative prices
    if (df['market_price'] < 0).any():
        issues.append("Negative prices found")
    
    # Check for outliers
    q1 = df['market_price'].quantile(0.25)
    q3 = df['market_price'].quantile(0.75)
    iqr = q3 - q1
    outliers = df[(df['market_price'] < q1 - 1.5*iqr) | (df['market_price'] > q3 + 1.5*iqr)]
    if len(outliers) > 0:
        issues.append(f"Found {len(outliers)} price outliers")
    
    return issues

def get_data_summary(df):
    """Get summary statistics of the data"""
    summary = {
        'total_records': len(df),
        'date_range': f"{df['date'].min()} to {df['date'].max()}",
        'crop_types': df['crop_type'].nunique(),
        'regions': df['region'].nunique(),
        'avg_price': round(df['market_price'].mean(), 2),
        'min_price': round(df['market_price'].min(), 2),
        'max_price': round(df['market_price'].max(), 2),
        'total_quantity': df['quantity_kg'].sum()
    }
    
    return summary

if __name__ == "__main__":
    # Test the loader
    df = load_crop_data()
    if df is not None:
        print("\n Data Summary:")
        for key, value in get_data_summary(df).items():
            print(f"{key}: {value}")
        
        issues = validate_data_quality(df)
        if issues:
            print("\n Issues found:")
            for issue in issues:
                print(f"  - {issue}")
        else:
            print("\n Data quality check passed")