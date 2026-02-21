# ml-service/utils/logger.py
import logging
import sys
import os
from datetime import datetime

def setup_logger(name, log_file='ml_service.log', level=logging.INFO):
    """Setup logger configuration"""
    
    # Create logs directory if it doesn't exist
    log_dir = 'logs'
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)
    
    log_path = os.path.join(log_dir, log_file)
    
    # Create logger
    logger = logging.getLogger(name)
    logger.setLevel(level)
    
    # Prevent duplicate handlers
    if logger.hasHandlers():
        logger.handlers.clear()
    
    # Create formatter
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # File handler
    try:
        file_handler = logging.FileHandler(log_path)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
    except Exception as e:
        print(f"Could not setup file logging: {e}")
    
    return logger

def get_logger(name):
    """Get or create a logger"""
    logger = logging.getLogger(name)
    
    # If logger doesn't have handlers, set it up
    if not logger.handlers:
        return setup_logger(name)
    
    return logger

class PredictionLogger:
    """Class for logging predictions"""
    
    def __init__(self, log_file='predictions.csv'):
        self.log_dir = 'logs'
        self.log_file = os.path.join(self.log_dir, log_file)
        self._ensure_log_dir()
    
    def _ensure_log_dir(self):
        """Ensure log directory exists"""
        if not os.path.exists(self.log_dir):
            os.makedirs(self.log_dir)
    
    def log_prediction(self, features, predicted_price, method='ml_model', confidence=0.85):
        """Log a prediction to CSV"""
        import pandas as pd
        
        log_entry = {
            'timestamp': datetime.now().isoformat(),
            'crop_type': features.get('crop_type'),
            'region': features.get('region'),
            'quality': features.get('quality'),
            'quantity_kg': features.get('quantity_kg'),
            'predicted_price': predicted_price,
            'method': method,
            'confidence': confidence
        }
        
        # Create DataFrame
        df_log = pd.DataFrame([log_entry])
        
        # Append to CSV
        try:
            if os.path.exists(self.log_file):
                df_log.to_csv(self.log_file, mode='a', header=False, index=False)
            else:
                df_log.to_csv(self.log_file, index=False)
            
            return True
        except Exception as e:
            print(f"Error logging prediction: {e}")
            return False
    
    def get_recent_predictions(self, n=10):
        """Get recent predictions"""
        import pandas as pd
        
        if not os.path.exists(self.log_file):
            return pd.DataFrame()
        
        try:
            df = pd.read_csv(self.log_file)
            return df.tail(n)
        except Exception as e:
            print(f"Error reading predictions: {e}")
            return pd.DataFrame()

if __name__ == "__main__":
    # Test logger
    logger = setup_logger('test')
    logger.info("Logger test message")
    logger.warning("Warning test message")
    logger.error("Error test message")
    
    # Test prediction logger
    pl = PredictionLogger()
    test_features = {
        'crop_type': 'Wheat',
        'region': 'North',
        'quality': 'Premium',
        'quantity_kg': 1000
    }
    pl.log_prediction(test_features, 45.50)
    
    print("\nRecent predictions:")
    print(pl.get_recent_predictions())