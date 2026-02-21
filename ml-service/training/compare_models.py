#!/usr/bin/env python3
"""
Phase 2: Model Training & Comparison
Trains multiple algorithms and selects the best model
"""

import pandas as pd
import numpy as np
import os
import sys
import json
from datetime import datetime
from pathlib import Path

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sklearn.model_selection import train_test_split, cross_val_score, KFold
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score, mean_absolute_percentage_error
import joblib

from utils.logger import get_logger

logger = get_logger('compare_models')


class ModelComparer:
    """Compare multiple ML algorithms for price prediction"""
    
    def __init__(self, data_path='data/crop_prices_final.csv'):
        self.data_path = data_path
        self.df = None
        self.X = None
        self.y = None
        self.X_train = None
        self.X_test = None
        self.y_train = None
        self.y_test = None
        self.label_encoders = {}
        self.scaler = StandardScaler()
        self.feature_columns = []
        self.models = {}
        self.results = {}
        
    def load_data(self):
        """Load and prepare data"""
        print(f"\n📂 Loading data from {self.data_path}...")
        self.df = pd.read_csv(self.data_path)
        print(f"✓ Loaded {len(self.df)} records")
        return True
    
    def preprocess_data(self):
        """Preprocess data for modeling"""
        print("\n🔧 Preprocessing data...")
        
        data = self.df.copy()
        
        # Define feature columns
        categorical_features = ['crop_type', 'region', 'quality', 'season', 'weather', 'market_demand']
        numerical_features = ['quantity_kg']
        
        # Add temporal features
        data['date'] = pd.to_datetime(data['date'])
        data['year'] = data['date'].dt.year
        data['month'] = data['date'].dt.month
        data['day_of_year'] = data['date'].dt.dayofyear
        
        numerical_features.extend(['year', 'month', 'day_of_year'])
        
        # Keep only available columns
        categorical_features = [f for f in categorical_features if f in data.columns]
        
        # Encode categorical features
        for feature in categorical_features:
            if feature in data.columns:
                le = LabelEncoder()
                data[feature] = le.fit_transform(data[feature].astype(str))
                self.label_encoders[feature] = le
        
        # Handle missing values
        for col in categorical_features + numerical_features:
            if col in data.columns and data[col].isnull().any():
                if col in categorical_features:
                    data[col].fillna(data[col].mode()[0], inplace=True)
                else:
                    data[col].fillna(data[col].median(), inplace=True)
        
        # Store feature columns
        self.feature_columns = categorical_features + numerical_features
        
        # Prepare X and y
        self.X = data[self.feature_columns].copy()
        self.y = data['market_price'].copy()
        
        # Split data
        self.X_train, self.X_test, self.y_train, self.y_test = train_test_split(
            self.X, self.y, test_size=0.2, random_state=42
        )
        
        # Scale features
        self.X_train = self.scaler.fit_transform(self.X_train)
        self.X_test = self.scaler.transform(self.X_test)
        
        print(f"✓ Data preprocessed")
        print(f"  - Training samples: {len(self.X_train)}")
        print(f"  - Testing samples: {len(self.X_test)}")
        print(f"  - Features: {len(self.feature_columns)}")
        return True
    
    def train_random_forest(self):
        """Train Random Forest model"""
        print("\n🌳 Training Random Forest...")
        
        try:
            model = RandomForestRegressor(
                n_estimators=100,
                max_depth=15,
                min_samples_split=5,
                min_samples_leaf=2,
                random_state=42,
                n_jobs=-1,
                verbose=0
            )
            
            model.fit(self.X_train, self.y_train)
            
            # Evaluate
            y_pred = model.predict(self.X_test)
            metrics = self._calculate_metrics(self.y_test, y_pred, 'Random Forest')
            
            self.models['random_forest'] = model
            self.results['random_forest'] = metrics
            
            return metrics
        except Exception as e:
            logger.error(f"Random Forest training failed: {e}")
            return None
    
    def train_gradient_boosting(self):
        """Train Gradient Boosting model"""
        print("\n🚀 Training Gradient Boosting...")
        
        try:
            model = GradientBoostingRegressor(
                n_estimators=100,
                learning_rate=0.1,
                max_depth=5,
                min_samples_split=5,
                min_samples_leaf=2,
                random_state=42,
                verbose=0
            )
            
            model.fit(self.X_train, self.y_train)
            
            # Evaluate
            y_pred = model.predict(self.X_test)
            metrics = self._calculate_metrics(self.y_test, y_pred, 'Gradient Boosting')
            
            self.models['gradient_boosting'] = model
            self.results['gradient_boosting'] = metrics
            
            return metrics
        except Exception as e:
            logger.error(f"Gradient Boosting training failed: {e}")
            return None
    
    def cross_validate_models(self, cv_folds=5):
        """Perform k-fold cross-validation"""
        print(f"\n✔️ Performing {cv_folds}-Fold Cross-Validation...")
        
        kfold = KFold(n_splits=cv_folds, shuffle=True, random_state=42)
        
        for model_name, model in self.models.items():
            scores = cross_val_score(
                model, self.X, self.y,
                cv=kfold,
                scoring='r2',
                n_jobs=-1
            )
            
            self.results[model_name]['cv_scores'] = scores.tolist()
            self.results[model_name]['cv_mean'] = float(scores.mean())
            self.results[model_name]['cv_std'] = float(scores.std())
            
            print(f"  {model_name}:")
            print(f"    - Mean R²: {scores.mean():.4f} (+/- {scores.std():.4f})")
            print(f"    - Fold scores: {[f'{s:.4f}' for s in scores]}")
    
    def _calculate_metrics(self, y_true, y_pred, model_name):
        """Calculate comprehensive metrics"""
        mae = mean_absolute_error(y_true, y_pred)
        mse = mean_squared_error(y_true, y_pred)
        rmse = np.sqrt(mse)
        r2 = r2_score(y_true, y_pred)
        mape = mean_absolute_percentage_error(y_true, y_pred)
        
        # Residual analysis
        residuals = y_true - y_pred
        residual_std = np.std(residuals)
        
        metrics = {
            'model': model_name,
            'mae': float(mae),
            'mse': float(mse),
            'rmse': float(rmse),
            'r2': float(r2),
            'mape': float(mape),
            'residual_std': float(residual_std),
            'sample_size': len(y_true),
            'timestamp': datetime.now().isoformat()
        }
        
        print(f"  ✓ {model_name}:")
        print(f"    - R² Score: {r2:.4f}")
        print(f"    - RMSE: ₹{rmse:.2f}")
        print(f"    - MAE: ₹{mae:.2f}")
        print(f"    - MAPE: {mape:.2%}")
        
        return metrics
    
    def analyze_feature_importance(self):
        """Analyze feature importance from best model"""
        print("\n📊 Analyzing Feature Importance...")
        
        best_model_name = max(self.results, key=lambda x: self.results[x]['r2'])
        best_model = self.models[best_model_name]
        
        # Get feature importance
        if hasattr(best_model, 'feature_importances_'):
            importance = best_model.feature_importances_
            importance_dict = dict(zip(self.feature_columns, importance))
            sorted_importance = sorted(importance_dict.items(), key=lambda x: x[1], reverse=True)
            
            print(f"  From {best_model_name}:")
            for feature, imp in sorted_importance[:10]:
                print(f"    {feature}: {imp:.4f}")
            
            return dict(sorted_importance)
        
        return {}
    
    def compare_all_models(self):
        """Compare all trained models"""
        print("\n" + "="*60)
        print("📈 MODEL COMPARISON RESULTS")
        print("="*60)
        
        # Sort by R² score
        sorted_results = sorted(
            self.results.items(),
            key=lambda x: x[1]['r2'],
            reverse=True
        )
        
        print(f"\n{'Model':<20} {'R²':<10} {'RMSE':<10} {'MAE':<10} {'MAPE':<10}")
        print("-" * 60)
        
        for model_name, metrics in sorted_results:
            print(f"{model_name:<20} {metrics['r2']:<10.4f} ₹{metrics['rmse']:<9.2f} ₹{metrics['mae']:<9.2f} {metrics['mape']:<10.2%}")
        
        # Best model
        best_model_name = sorted_results[0][0]
        best_metrics = sorted_results[0][1]
        
        print("\n" + "="*60)
        print(f"🏆 BEST MODEL: {best_model_name.upper()}")
        print("="*60)
        print(f"R² Score: {best_metrics['r2']:.4f}")
        print(f"RMSE: ₹{best_metrics['rmse']:.2f}")
        print(f"MAE: ₹{best_metrics['mae']:.2f}")
        print(f"MAPE: {best_metrics['mape']:.2%}")
        if 'cv_mean' in best_metrics:
            print(f"Cross-Validation R² (Mean): {best_metrics['cv_mean']:.4f} ± {best_metrics['cv_std']:.4f}")
        print("="*60)
        
        return best_model_name, best_metrics
    
    def save_best_model(self):
        """Save best performing model"""
        # Find best model
        best_model_name = max(self.results, key=lambda x: self.results[x]['r2'])
        best_model = self.models[best_model_name]
        best_metrics = self.results[best_model_name]
        
        # Save model
        model_path = f'models/price_model_v2.pkl'
        os.makedirs(os.path.dirname(model_path), exist_ok=True)
        joblib.dump(best_model, model_path)
        print(f"\n💾 Model saved to: {model_path}")
        
        # Save scaler
        scaler_path = f'models/scaler_v2.pkl'
        joblib.dump(self.scaler, scaler_path)
        print(f"💾 Scaler saved to: {scaler_path}")
        
        # Save encoders
        encoders_path = f'models/label_encoders_v2.pkl'
        joblib.dump(self.label_encoders, encoders_path)
        print(f"💾 Encoders saved to: {encoders_path}")
        
        # Save metrics
        metrics_file = f'models/price_model_v2_metrics.json'
        comparison_data = {
            'best_model': best_model_name,
            'best_metrics': best_metrics,
            'all_results': self.results,
            'timestamp': datetime.now().isoformat(),
            'data_info': {
                'total_records': len(self.df),
                'training_samples': len(self.X_train),
                'testing_samples': len(self.X_test),
                'features': len(self.feature_columns)
            },
            'feature_importance': self.analyze_feature_importance() if hasattr(best_model, 'feature_importances_') else {}
        }
        
        with open(metrics_file, 'w') as f:
            json.dump(comparison_data, f, indent=2)
        
        print(f"📊 Metrics saved to: {metrics_file}")
        
        return model_path, best_model_name
    
    def run_full_comparison(self):
        """Run complete model comparison pipeline"""
        print("\n" + "="*60)
        print("🚀 PHASE 2: MODEL TRAINING & COMPARISON")
        print("="*60)
        
        try:
            # Load data
            if not self.load_data():
                return False
            
            # Preprocess
            if not self.preprocess_data():
                return False
            
            # Train models
            print("\n" + "="*60)
            print("🤖 TRAINING MODELS")
            print("="*60)
            self.train_random_forest()
            self.train_gradient_boosting()
            
            # Cross-validation
            self.cross_validate_models(cv_folds=5)
            
            # Compare
            best_model_name, best_metrics = self.compare_all_models()
            
            # Save
            self.save_best_model()
            
            print("\n✅ Phase 2 Complete!")
            return True
            
        except Exception as e:
            logger.error(f"Pipeline failed: {e}")
            print(f"\n❌ Error: {e}")
            import traceback
            traceback.print_exc()
            return False


if __name__ == '__main__':
    comparer = ModelComparer(data_path='data/crop_prices_final.csv')
    success = comparer.run_full_comparison()
    
    print("\n" + "="*60)
    if success:
        print("✅ Model comparison completed successfully!")
        print("\nNext steps:")
        print("  1. Verify improved model performance")
        print("  2. Run comprehensive tests")
        print("  3. Deploy to production")
    else:
        print("❌ Model comparison failed!")
    print("="*60)
    
    sys.exit(0 if success else 1)
