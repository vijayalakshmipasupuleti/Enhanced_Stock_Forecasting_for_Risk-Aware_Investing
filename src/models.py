from sklearn.linear_model import Ridge
from sklearn.ensemble import RandomForestRegressor
from xgboost import XGBRegressor
from sklearn.preprocessing import MinMaxScaler
import numpy as np
import pandas as pd

class ModelTrainer:
    def __init__(self, data, target_col='Close', test_size=0.2, seq_length=60):
        self.data = data
        self.target_col = target_col
        self.test_size = test_size
        self.seq_length = seq_length
        self.scalers = {} 
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
        for i in range(self.seq_length, len(X_data)):
            X_seq.append(X_data[i-self.seq_length:i])
            y_seq.append(y_data[i])
        return np.array(X_seq), np.array(y_seq)

    def train_linear_regression(self):
        print("Training Ridge Regression...")
        model = Ridge(alpha=1.0)
        model.fit(self.X_train, self.y_train)
        self.models['LinearRegression'] = model
        return model

    def train_random_forest(self):
        print("Training Random Forest...")
        model = RandomForestRegressor(n_estimators=200, max_depth=8, random_state=42, n_jobs=-1)
        model.fit(self.X_train, self.y_train)
        self.models['RandomForest'] = model
        return model

    def train_xgboost(self):
        print("Training XGBoost...")
        model = XGBRegressor(n_estimators=500, learning_rate=0.03, max_depth=5, random_state=42)
        model.fit(self.X_train, self.y_train)
        self.models['XGBoost'] = model
        return model

    def train_ensemble(self):
        """Trains and stores an ensemble of XGB, RF, and Ridge."""
        print("Training Ensemble (XGB + RF + Ridge)...")
        xgb = self.train_xgboost()
        rf = self.train_random_forest()
        ridge = self.train_linear_regression()
        self.models['Ensemble'] = {'xgb': xgb, 'rf': rf, 'ridge': ridge}
        return self.models['Ensemble']

    def train_lstm(self):
        print("Training LSTM...")
        import tensorflow as tf
        from tensorflow.keras.models import Sequential
        from tensorflow.keras.layers import LSTM, Dense, Input, Dropout

        X_train_seq, y_train_seq = self.prepare_lstm_data(self.X_train, self.y_train)
        
        model = Sequential([
            Input(shape=(X_train_seq.shape[1], X_train_seq.shape[2])),
            LSTM(64, return_sequences=True),
            Dropout(0.2),
            LSTM(32, return_sequences=False),
            Dropout(0.2),
            Dense(16, activation='relu'),
            Dense(1)
        ])
        
        model.compile(optimizer='adam', loss='mean_squared_error')
        model.fit(X_train_seq, y_train_seq, batch_size=32, epochs=10, verbose=0)
        self.models['LSTM'] = model
        return model

    def train_bi_lstm(self):
        print("Training Bi-LSTM...")
        import tensorflow as tf
        from tensorflow.keras.models import Sequential
        from tensorflow.keras.layers import LSTM, Dense, Bidirectional, Input, Dropout

        X_train_seq, y_train_seq = self.prepare_lstm_data(self.X_train, self.y_train)
        
        model = Sequential([
            Input(shape=(X_train_seq.shape[1], X_train_seq.shape[2])),
            Bidirectional(LSTM(64, return_sequences=True)),
            Dropout(0.2),
            Bidirectional(LSTM(32, return_sequences=False)),
            Dropout(0.2),
            Dense(16, activation='relu'),
            Dense(1)
        ])
        
        model.compile(optimizer='adam', loss='mean_squared_error')
        model.fit(X_train_seq, y_train_seq, batch_size=32, epochs=10, verbose=0)
        self.models['BiLSTM'] = model
        return model

    def predict(self, model_name):
        model = self.models.get(model_name)
        if not model:
            raise ValueError(f"Model {model_name} not trained yet.")
        
        print(f"Predicting with {model_name}...")
        if model_name == 'Ensemble':
            p_xgb = model['xgb'].predict(self.X_test)
            p_rf  = model['rf'].predict(self.X_test)
            p_ridge = model['ridge'].predict(self.X_test)
            preds = 0.5 * p_xgb + 0.3 * p_rf + 0.2 * p_ridge
            return self.scalers['target_scaler'].inverse_transform(preds.reshape(-1, 1)).flatten()
        
        if model_name in ['LSTM', 'BiLSTM']:
            X_test_seq, _ = self.prepare_lstm_data(self.X_test, self.y_test)
            preds = model.predict(X_test_seq, verbose=0)
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
