# ml-service/training/data_preprocessing.py
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
import os

def load_and_clean_data(filepath):
    """Load and clean crop price data"""
    
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return None
    
    try:
        df = pd.read_csv(filepath)
        print(f"Loaded {len(df)} records")
        
        # Remove duplicates
        df = df.drop_duplicates()
        
        # Handle missing values
        df = df.dropna(subset=['market_price', 'crop_type'])
        
        # Convert date
        if 'date' in df.columns:
            df['date'] = pd.to_datetime(df['date'])
            df['year'] = df['date'].dt.year
            df['month'] = df['date'].dt.month
        
        # Remove outliers (optional)
        if 'market_price' in df.columns:
            Q1 = df['market_price'].quantile(0.25)
            Q3 = df['market_price'].quantile(0.75)
            IQR = Q3 - Q1
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            df = df[(df['market_price'] >= lower_bound) & (df['market_price'] <= upper_bound)]
        
        print(f"After cleaning: {len(df)} records")
        return df
        
    except Exception as e:
        print(f"Error cleaning data: {e}")
        return None

def create_features(df):
    """Create additional features for prediction"""
    
    data = df.copy()
    
    # Add season from date
    if 'date' in data.columns:
        data['season'] = data['date'].dt.month.map({
            12: 'Winter', 1: 'Winter', 2: 'Winter',
            3: 'Spring', 4: 'Spring', 5: 'Spring',
            6: 'Summer', 7: 'Summer', 8: 'Summer',
            9: 'Autumn', 10: 'Autumn', 11: 'Autumn'
        })
    
    # Add quantity category
    if 'quantity_kg' in data.columns:
        data['quantity_category'] = pd.cut(
            data['quantity_kg'],
            bins=[0, 500, 1000, 2000, 5000, float('inf')],
            labels=['Very Small', 'Small', 'Medium', 'Large', 'Bulk']
        )
    
    # Add price per unit if available
    if 'total_amount' in data.columns and 'quantity_kg' in data.columns:
        data['calculated_price'] = data['total_amount'] / data['quantity_kg']
    
    return data

def prepare_for_training(df, target='market_price'):
    """Prepare data for ML training"""
    
    # Define feature columns
    categorical_cols = ['crop_type', 'region', 'quality', 'season', 'weather', 'market_demand']
    numerical_cols = ['quantity_kg', 'year', 'month']
    
    # Keep only available columns
    available_categorical = [col for col in categorical_cols if col in df.columns]
    available_numerical = [col for col in numerical_cols if col in df.columns]
    
    # Create feature matrix
    X = df[available_categorical + available_numerical].copy()
    y = df[target].copy()
    
    # Encode categorical variables
    encoders = {}
    for col in available_categorical:
        le = LabelEncoder()
        X[col] = le.fit_transform(X[col].astype(str))
        encoders[col] = le
    
    # Scale numerical features
    scaler = StandardScaler()
    if available_numerical:
        X[available_numerical] = scaler.fit_transform(X[available_numerical])
    
    print(f"\nData Preparation Complete:")
    print(f"Features: {available_categorical + available_numerical}")
    print(f"Shape: {X.shape}")
    print(f"Categorical columns: {available_categorical}")
    print(f"Numerical columns: {available_numerical}")
    
    return X, y, encoders, scaler

if __name__ == "__main__":
    # Test preprocessing
    df = load_and_clean_data('../data/crop_prices.csv')
    if df is not None:
        df = create_features(df)
        X, y, encoders, scaler = prepare_for_training(df)
        print(f"\n Preprocessing successful!")
        print(f"X shape: {X.shape}")
        print(f"y shape: {y.shape}")