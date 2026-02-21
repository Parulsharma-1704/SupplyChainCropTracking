# ml-service/models/price_predictor.py
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib
import os
from datetime import datetime
import json

class PricePredictor:
    def __init__(self, model_path='models/price_model.pkl'):
        self.model_path = model_path
        self.model = None
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.feature_columns = []
        self.target_column = 'market_price'
        self.training_metrics = {}
        
    def load_data(self, filepath='data/crop_prices.csv'):
        """Load crop price data from CSV"""
        try:
            if not os.path.exists(filepath):
                print(f"Data file not found: {filepath}")
                return None
                
            df = pd.read_csv(filepath)
            
            # Convert date if exists
            if 'date' in df.columns:
                df['date'] = pd.to_datetime(df['date'])
                df['year'] = df['date'].dt.year
                df['month'] = df['date'].dt.month
                df['day'] = df['date'].dt.day
            
            print(f"Data loaded: {df.shape[0]} rows, {df.shape[1]} columns")
            return df
            
        except Exception as e:
            print(f"Error loading data: {e}")
            return None
    
    def preprocess_data(self, df):
        """Preprocess data for ML training"""
        if df is None or df.empty:
            return None, None
            
        data = df.copy()
        
        # Define feature columns
        categorical_features = ['crop_type', 'region', 'quality', 'season', 'weather', 'market_demand']
        numerical_features = ['quantity_kg', 'year', 'month']
        
        # Keep only available columns
        categorical_features = [f for f in categorical_features if f in data.columns]
        numerical_features = [f for f in numerical_features if f in data.columns]
        
        # Encode categorical features
        for feature in categorical_features:
            if feature in data.columns:
                le = LabelEncoder()
                data[feature] = le.fit_transform(data[feature].astype(str))
                self.label_encoders[feature] = le
        
        # Store feature columns
        self.feature_columns = categorical_features + numerical_features
        
        # Handle missing values
        for col in self.feature_columns:
            if col in data.columns and data[col].isnull().any():
                if col in categorical_features:
                    data[col].fillna(data[col].mode()[0], inplace=True)
                else:
                    data[col].fillna(data[col].median(), inplace=True)
        
        # Prepare X and y
        X = data[self.feature_columns]
        y = data[self.target_column]
        
        # Scale numerical features
        if numerical_features:
            X[numerical_features] = self.scaler.fit_transform(X[numerical_features])
        
        return X, y
    
    def train(self, X, y, test_size=0.2, random_state=42):
        """Train the Random Forest model"""
        if X is None or y is None:
            raise ValueError("No data to train on")
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state
        )
        
        # Create and train model
        print("🌱 Training Random Forest model...")
        self.model = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=random_state,
            n_jobs=-1
        )
        
        self.model.fit(X_train, y_train)
        
        # Evaluate
        train_score = self.model.score(X_train, y_train)
        test_score = self.model.score(X_test, y_test)
        
        # Predictions
        y_pred = self.model.predict(X_test)
        
        # Calculate metrics
        mae = mean_absolute_error(y_test, y_pred)
        mse = mean_squared_error(y_test, y_pred)
        rmse = np.sqrt(mse)
        r2 = r2_score(y_test, y_pred)
        
        # Feature importance
        feature_importance = {}
        if hasattr(self.model, 'feature_importances_'):
            feature_importance = dict(zip(self.feature_columns, self.model.feature_importances_))
            sorted_importance = sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)
        else:
            sorted_importance = []
        
        # Store metrics
        self.training_metrics = {
            'train_score': float(train_score),
            'test_score': float(test_score),
            'mae': float(mae),
            'rmse': float(rmse),
            'r2': float(r2),
            'feature_importance': dict(sorted_importance[:5]),
            'timestamp': datetime.now().isoformat()
        }
        
        # Display results
        print("\n" + "="*50)
        print("MODEL PERFORMANCE")
        print("="*50)
        print(f"Training R² Score: {train_score:.4f}")
        print(f"Testing R² Score: {test_score:.4f}")
        print(f"MAE: {mae:.4f}")
        print(f"RMSE: {rmse:.4f}")
        print(f"R²: {r2:.4f}")
        
        if sorted_importance:
            print("\nTop 5 Important Features:")
            for feature, importance in sorted_importance[:5]:
                print(f"  {feature}: {importance:.4f}")
        
        return self.training_metrics
    
    def predict(self, input_features):
        """Predict price for given features"""
        if self.model is None:
            raise ValueError("Model not trained. Please train or load model first.")
        
        # Convert input to DataFrame
        feature_df = pd.DataFrame([input_features])
        
        # Encode categorical features
        for feature, encoder in self.label_encoders.items():
            if feature in feature_df.columns:
                try:
                    # Check if value exists in encoder classes
                    val = str(feature_df[feature].iloc[0])
                    if val in encoder.classes_:
                        feature_df[feature] = encoder.transform([val])[0]
                    else:
                        # Use most common value
                        feature_df[feature] = encoder.transform([encoder.classes_[0]])[0]
                except Exception as e:
                    print(f"Warning: Encoding error for {feature}: {e}")
                    feature_df[feature] = 0
        
        # Scale numerical features
        numerical_features = ['quantity_kg', 'year', 'month']
        for feature in numerical_features:
            if feature in feature_df.columns:
                try:
                    value = [[float(feature_df[feature].iloc[0])]]
                    feature_df[feature] = self.scaler.transform(value)[0][0]
                except:
                    feature_df[feature] = 0
        
        # Ensure all required columns are present
        for col in self.feature_columns:
            if col not in feature_df.columns:
                feature_df[col] = 0
        
        # Reorder columns
        feature_df = feature_df[self.feature_columns]
        
        # Make prediction
        prediction = self.model.predict(feature_df)[0]
        
        return float(prediction)
    
    def save_model(self):
        """Save model and preprocessing objects"""
        if self.model is None:
            print("No model to save")
            return False
        
        try:
            # Create directory if it doesn't exist
            os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
            
            # Save all components
            model_data = {
                'model': self.model,
                'scaler': self.scaler,
                'label_encoders': self.label_encoders,
                'feature_columns': self.feature_columns,
                'target_column': self.target_column,
                'training_metrics': self.training_metrics,
                'timestamp': datetime.now().isoformat()
            }
            
            joblib.dump(model_data, self.model_path)
            print(f"Model saved to {self.model_path}")
            
            # Save metrics separately
            metrics_path = self.model_path.replace('.pkl', '_metrics.json')
            with open(metrics_path, 'w') as f:
                json.dump(self.training_metrics, f, indent=2)
            
            return True
            
        except Exception as e:
            print(f"Error saving model: {e}")
            return False
    
    def load_model(self):
        """Load trained model"""
        try:
            if not os.path.exists(self.model_path):
                print(f"Model file not found: {self.model_path}")
                return False
            
            model_data = joblib.load(self.model_path)
            self.model = model_data['model']
            self.scaler = model_data['scaler']
            self.label_encoders = model_data['label_encoders']
            self.feature_columns = model_data['feature_columns']
            self.target_column = model_data['target_column']
            self.training_metrics = model_data.get('training_metrics', {})
            
            print(f"Model loaded from {self.model_path}")
            print(f"Model trained on: {model_data.get('timestamp', 'Unknown')}")
            return True
            
        except Exception as e:
            print(f"Error loading model: {e}")
            return False
    
    def get_model_info(self):
        """Get model information"""
        if self.model is None:
            return {"status": "Model not loaded"}
        
        info = {
            'model_type': type(self.model).__name__,
            'n_estimators': self.model.n_estimators if hasattr(self.model, 'n_estimators') else 'N/A',
            'max_depth': self.model.max_depth if hasattr(self.model, 'max_depth') else 'N/A',
            'n_features': len(self.feature_columns),
            'feature_columns': self.feature_columns,
            'label_encoders': list(self.label_encoders.keys()),
            'training_metrics': self.training_metrics
        }
        
        return info