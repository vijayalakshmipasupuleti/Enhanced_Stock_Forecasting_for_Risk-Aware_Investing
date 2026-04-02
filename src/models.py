import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from xgboost import XGBRegressor

class ModelTrainer:
    def __init__(self, data, target_col='Close', test_size=0.2, seq_length=60):
        self.data = data
        self.target_col = target_col
        self.test_size = test_size
        self.seq_length = seq_length
        self.scalers = {} # To store scalers for inverse transform
        self.X_train = None
        self.X_test = None
        self.y_train = None
        self.y_test = None
        self.models = {}
        self.feature_columns = []
        self.target_dates = None
        self.train_size = 0

    def split_data(self):
        """Splits data into train and test sets for next-step forecasting."""
        if 'Date' in self.data.columns:
            self.dates = pd.to_datetime(self.data['Date'])
            data_numeric = self.data.drop(['Date'], axis=1)
        else:
            self.dates = pd.Series(self.data.index)
            data_numeric = self.data

        # Predict the next closing price using only information available today.
        X_raw = data_numeric.drop(columns=[self.target_col]).copy()
        y_raw = data_numeric[self.target_col].shift(-1)
        valid_mask = y_raw.notna()

        X_raw = X_raw.loc[valid_mask].reset_index(drop=True)
        y_raw = y_raw.loc[valid_mask].reset_index(drop=True)
        self.target_dates = self.dates.loc[valid_mask].reset_index(drop=True)
        self.feature_columns = X_raw.columns.tolist()

        self.train_size = int(len(X_raw) * (1 - self.test_size))
        X_train_raw = X_raw.iloc[:self.train_size]
        X_test_raw = X_raw.iloc[self.train_size:]
        y_train_raw = y_raw.iloc[:self.train_size].to_numpy().reshape(-1, 1)
        y_test_raw = y_raw.iloc[self.train_size:].to_numpy().reshape(-1, 1)

        feature_scaler = MinMaxScaler()
        target_scaler = MinMaxScaler()
        self.scalers['feature_scaler'] = feature_scaler
        self.scalers['target_scaler'] = target_scaler

        self.X_train = feature_scaler.fit_transform(X_train_raw)
        self.X_test = feature_scaler.transform(X_test_raw)
        self.y_train = target_scaler.fit_transform(y_train_raw).ravel()
        self.y_test = target_scaler.transform(y_test_raw).ravel()

        print(f"Data Split: Train shape {self.X_train.shape}, Test shape {self.X_test.shape}")
        return self.X_train, self.X_test, self.y_train, self.y_test

    def prepare_lstm_data(self, X_data, y_data):
        """Reshapes data for LSTM [samples, time steps, features]."""
        X_seq, y_seq = [], []
        # Create sequences
        for i in range(self.seq_length, len(X_data)):
            X_seq.append(X_data[i-self.seq_length:i])
            y_seq.append(y_data[i])
        return np.array(X_seq), np.array(y_seq)

    def train_linear_regression(self):
        print("Training Linear Regression...")
        model = LinearRegression()
        # For ML models, we ignore the sequence structure and treat rows as independent samples
        # effectively using lags as temporal features.
        model.fit(self.X_train, self.y_train)
        self.models['LinearRegression'] = model
        return model

    def train_random_forest(self):
        print("Training Random Forest...")
        model = RandomForestRegressor(n_estimators=100, random_state=42)
        # RF doesn't handle time series natively, but works with lag features
        model.fit(self.X_train, self.y_train)
        self.models['RandomForest'] = model
        return model

    def train_xgboost(self):
        print("Training XGBoost...")
        model = XGBRegressor(n_estimators=100, learning_rate=0.05, random_state=42)
        model.fit(self.X_train, self.y_train)
        self.models['XGBoost'] = model
        return model

    def train_lstm(self):
        print("Training LSTM...")
        # Lazy import tensorflow
        import tensorflow as tf
        from tensorflow.keras.models import Sequential
        from tensorflow.keras.layers import LSTM, Dense, Input

        # Prepare data
        X_train_seq, y_train_seq = self.prepare_lstm_data(self.X_train, self.y_train)
        
        model = Sequential()
        model.add(Input(shape=(X_train_seq.shape[1], X_train_seq.shape[2])))
        model.add(LSTM(50, return_sequences=True))
        model.add(LSTM(50, return_sequences=False))
        model.add(Dense(25))
        model.add(Dense(1))
        
        model.compile(optimizer='adam', loss='mean_squared_error')
        model.fit(X_train_seq, y_train_seq, batch_size=32, epochs=5, verbose=1) # Low epochs for demo
        self.models['LSTM'] = model
        return model

    def train_bi_lstm(self):
        print("Training Bi-LSTM...")
        import tensorflow as tf
        from tensorflow.keras.models import Sequential
        from tensorflow.keras.layers import LSTM, Dense, Bidirectional, Input

        X_train_seq, y_train_seq = self.prepare_lstm_data(self.X_train, self.y_train)
        
        model = Sequential()
        model.add(Input(shape=(X_train_seq.shape[1], X_train_seq.shape[2])))
        model.add(Bidirectional(LSTM(50, return_sequences=True)))
        model.add(Bidirectional(LSTM(50, return_sequences=False)))
        model.add(Dense(25))
        model.add(Dense(1))
        
        model.compile(optimizer='adam', loss='mean_squared_error')
        model.fit(X_train_seq, y_train_seq, batch_size=32, epochs=5, verbose=1)
        self.models['BiLSTM'] = model
        return model

    def predict(self, model_name):
        model = self.models.get(model_name)
        if not model:
            raise ValueError(f"Model {model_name} not trained yet.")
        
        print(f"Predicting with {model_name}...")
        if model_name in ['LSTM', 'BiLSTM']:
            X_test_seq, _ = self.prepare_lstm_data(self.X_test, self.y_test)
            preds = model.predict(X_test_seq)
            return self.scalers['target_scaler'].inverse_transform(preds).flatten()
        else:
            preds = model.predict(self.X_test)
            return self.scalers['target_scaler'].inverse_transform(preds.reshape(-1, 1)).flatten()
    
    def get_actual_values(self, model_name):
        """Returns actual values corresponding to the test set of the model."""
        if model_name in ['LSTM', 'BiLSTM']:
            actuals = self.y_test[self.seq_length:]
        else:
            actuals = self.y_test

        return self.scalers['target_scaler'].inverse_transform(actuals.reshape(-1, 1)).flatten()

    def get_prediction_dates(self, model_name):
        """Returns the dates aligned to the prediction output."""
        test_dates = self.target_dates.iloc[self.train_size:].reset_index(drop=True)
        if model_name in ['LSTM', 'BiLSTM']:
            test_dates = test_dates.iloc[self.seq_length:].reset_index(drop=True)
        return test_dates.dt.strftime('%Y-%m-%d').tolist()
