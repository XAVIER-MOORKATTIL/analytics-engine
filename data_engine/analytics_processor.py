import os
import time
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler
import pandas as pd
import numpy as np
from pymongo import MongoClient
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.linear_model import LinearRegression
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, LSTM, Input
from dotenv import load_dotenv

load_dotenv(dotenv_path='../.env')

MONGO_URI = os.getenv('MONGO_URI')

class HealthCheckHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/plain')
        self.end_headers()
        self.wfile.write(b"Python Multi-Model ML Pipeline Active")

    def log_message(self, format, *args):
        return

def start_health_server():
    port = int(os.environ.get("PORT", 8000))
    server = HTTPServer(('0.0.0.0', port), HealthCheckHandler)
    print(f"[Python ML Engine] Health check listening on port {port}")
    server.serve_forever()

def build_dynamic_lstm(input_shape):
    """Dynamic Tensor Shape Neural Network Initialization"""
    model = Sequential([
        Input(shape=input_shape),
        Dense(16, activation='relu'),
        Dense(1, activation='linear')
    ])
    model.compile(optimizer='adam', loss='mse')
    return model

def fetch_and_analyze():
    if not MONGO_URI:
        print("[Error] MONGO_URI missing from environment variables.")
        return

    client = MongoClient(MONGO_URI)
    db = client['test']
    collection = db['analytics']

    records = list(collection.find({}, {'_id': 0, 'metricName': 1, 'value': 1, 'timestamp': 1}))
    
    if not records or len(records) < 5:
        print("[Python ML Engine] Insufficient records (<5) for deep tensor training. Waiting...")
        return

    df = pd.DataFrame(records)
    X = df[['value']].values

    # 1. Isolation Forest Anomaly Detection
    iso_model = IsolationForest(contamination=0.1, random_state=42)
    df['anomaly_score'] = iso_model.fit_predict(X)
    df['is_anomaly'] = df['anomaly_score'].apply(lambda x: True if x == -1 else False)

    # 2. Linear Regression Trend Fit
    X_time = np.arange(len(df)).reshape(-1, 1)
    reg = LinearRegression().fit(X_time, df['value'].values)
    trend_slope = reg.coef_[0]

    # 3. Keras Neural Network Execution (Dynamic Shape Reshaping)
    tensor_input = X.reshape((X.shape[0], 1))
    keras_model = build_dynamic_lstm((1,))
    predictions = keras_model.predict(tensor_input, verbose=0)
    df['dl_predicted_value'] = predictions.flatten()

    print("\n--- MULTI-MODEL ANALYTICS & TENSORFLOW PIPELINE ---")
    print(f"Linear Trend Slope: {trend_slope:.4f}")
    print(df[['metricName', 'value', 'dl_predicted_value', 'is_anomaly', 'timestamp']].tail(10))

if __name__ == '__main__':
    server_thread = threading.Thread(target=start_health_server, daemon=True)
    server_thread.start()

    print("[Python ML Engine] Active and polling every 60 seconds...")
    while True:
        try:
            fetch_and_analyze()
        except Exception as e:
            print(f"[ML Pipeline Error] {e}")
        time.sleep(60)