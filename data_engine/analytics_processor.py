import os
import time
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler
import pandas as pd
import numpy as np
from pymongo import MongoClient
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Conv1D, LSTM, Input
from dotenv import load_dotenv

load_dotenv(dotenv_path='../.env')

DATABASE_CONNECTION_STRING = os.getenv('MONGO_URI')

class HealthCheckDaemon(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/plain')
        self.end_headers()
        self.wfile.write(b"Dynamic Tensor Pipeline Active")

    def log_message(self, format, *args):
        return

def run_health_check_service():
    service_port = int(os.environ.get("PORT", 8000))
    server_instance = HTTPServer(('0.0.0.0', service_port), HealthCheckDaemon)
    server_instance.serve_forever()

def assemble_variable_tensor_network(steps, dimensions):
    """Builds a dynamic Keras Sequential model based on runtime matrix input shapes."""
    network = Sequential([
        Input(shape=(steps, dimensions)),
        Conv1D(filters=32, kernel_size=1, activation='relu'),
        LSTM(16, return_sequences=False),
        Dense(8, activation='relu'),
        Dense(1, activation='linear')
    ])
    network.compile(optimizer='adam', loss='mse')
    return network

def process_dynamic_telemetry_batch():
    if not DATABASE_CONNECTION_STRING:
        print("[ML Engine] MONGO_URI missing from environment variables.")
        return

    mongo_client = MongoClient(DATABASE_CONNECTION_STRING)
    database = mongo_client['test']
    metric_collection = database['analytics']

    raw_data = list(metric_collection.find({}, {'_id': 0, 'metricName': 1, 'value': 1, 'timestamp': 1}))
    
    if not raw_data or len(raw_data) < 2:
        print("[ML Engine] Insufficient telemetry volume for dynamic tensor processing (<2 records)...")
        return

    data_frame = pd.DataFrame(raw_data)
    
    # Extract dynamic dimensions from current telemetry size
    batch_size = len(data_frame)
    feature_count = 1
    
    # Reshape matrix dynamically: (Batch Size, Timesteps=1, Features=1)
    tensor_matrix = data_frame[['value']].values.reshape((batch_size, 1, feature_count))
    
    # Initialize network using calculated batch specs
    tensor_model = assemble_variable_tensor_network(1, feature_count)
    forecast_results = tensor_model.predict(tensor_matrix, verbose=0)
    
    data_frame['keras_tensor_output'] = forecast_results.flatten()
    print("\n--- DYNAMIC TENSOR INFERENCE COMPLETE ---")
    print(data_frame[['metricName', 'value', 'keras_tensor_output']].tail(5))

if __name__ == '__main__':
    threading.Thread(target=run_health_check_service, daemon=True).start()
    print("[Telemetry Processing Service Running]")
    while True:
        try:
            process_dynamic_telemetry_batch()
        except Exception as error:
            print(f"[Execution Error] {error}")
        time.sleep(30)