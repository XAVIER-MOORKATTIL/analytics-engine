import os
import time
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler
import pandas as pd
import numpy as np
from pymongo import MongoClient
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.linear_model import LinearRegression
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Conv1D, LSTM, Input
from dotenv import load_dotenv

load_dotenv(dotenv_path='../.env')

DATABASE_URL = os.getenv('MONGO_URI')

class PipelineHealthHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/plain')
        self.end_headers()
        self.wfile.write(b"ML Telemetry Engine Online")

    def log_message(self, format, *args):
        return

def launch_health_monitor():
    listen_port = int(os.environ.get("PORT", 8000))
    httpd = HTTPServer(('0.0.0.0', listen_port), PipelineHealthHandler)
    httpd.serve_forever()

def construct_hybrid_cnn_lstm(tensor_shape):
    """Dynamic Tensor Reshaping for Convolutional-Recurrent Pipeline"""
    network = Sequential([
        Input(shape=tensor_shape),
        Conv1D(filters=32, kernel_size=1, activation='relu'),
        LSTM(16, return_sequences=False),
        Dense(8, activation='relu'),
        Dense(1, activation='linear')
    ])
    network.compile(optimizer='adam', loss='mse')
    return network

def execute_analytics_cycle():
    if not DATABASE_URL:
        print("[ML Engine Warning] MONGO_URI variable undefined.")
        return

    mongo_client = MongoClient(DATABASE_URL)
    db = mongo_client['test']
    telemetry_store = db['analytics']

    dataset = list(telemetry_store.find({}, {'_id': 0, 'metricName': 1, 'value': 1, 'timestamp': 1}))
    
    if not dataset or len(dataset) < 5:
        print("[ML Engine] Waiting for metric stream growth (<5 entries)...")
        return

    frame = pd.DataFrame(dataset)
    feature_matrix = frame[['value']].values

    # 1. Unsupervised Anomaly Scoring
    iso_forest = IsolationForest(contamination=0.1, random_state=42)
    frame['is_anomaly'] = iso_forest.fit_predict(feature_matrix) == -1

    # 2. Supervised Classification (Decision Tree & Naive Bayes)
    threshold_labels = (frame['value'] > 85).astype(int)
    dt_classifier = DecisionTreeClassifier().fit(feature_matrix, threshold_labels)
    gnb_classifier = GaussianNB().fit(feature_matrix, threshold_labels)

    frame['dt_flag'] = dt_classifier.predict(feature_matrix)
    frame['gnb_flag'] = gnb_classifier.predict(feature_matrix)

    # 3. Keras Hybrid Tensor Execution
    shaped_input = feature_matrix.reshape((feature_matrix.shape[0], 1, 1))
    deep_model = construct_hybrid_cnn_lstm((1, 1))
    dl_out = deep_model.predict(shaped_input, verbose=0)
    frame['neural_forecast'] = dl_out.flatten()

    print("\n--- MULTI-ALGORITHM ML PIPELINE OUTPUT ---")
    print(frame[['metricName', 'value', 'neural_forecast', 'dt_flag', 'gnb_flag', 'is_anomaly']].tail(5))

if __name__ == '__main__':
    threading.Thread(target=launch_health_monitor, daemon=True).start()
    print("[ML Processing Daemon Active]")
    while True:
        try:
            execute_analytics_cycle()
        except Exception as err:
            print(f"[Execution Fault] {err}")
        time.sleep(60)