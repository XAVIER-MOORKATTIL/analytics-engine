import os
import time
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler
import pandas as pd
import numpy as np
from pymongo import MongoClient
from sklearn.ensemble import IsolationForest
from dotenv import load_dotenv

# Load environment variables from backend .env file (for local dev)
load_dotenv(dotenv_path='../.env')

MONGO_URI = os.getenv('MONGO_URI')

# Simple HTTP Server Handler to satisfy Render Web Service port check
class HealthCheckHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/plain')
        self.end_headers()
        self.wfile.write(b"Python Data Engine Active")

    def log_message(self, format, *args):
        # Suppress standard HTTP request logging to keep Render logs clean
        return

def start_health_server():
    port = int(os.environ.get("PORT", 8000))
    server = HTTPServer(('0.0.0.0', port), HealthCheckHandler)
    print(f"[Python Engine] Health check HTTP server listening on port {port}")
    server.serve_forever()

def fetch_and_analyze():
    if not MONGO_URI:
        print("[Error] MONGO_URI missing from environment variables.")
        return

    print("[Python Engine] Connecting to MongoDB Atlas...")
    client = MongoClient(MONGO_URI)
    
    db = client['test']
    collection = db['analytics']

    records = list(collection.find({}, {'_id': 0, 'metricName': 1, 'value': 1, 'timestamp': 1}))
    
    if not records:
        print("[Python Engine] No telemetry metrics found to process.")
        return

    df = pd.DataFrame(records)
    print(f"[Python Engine] Successfully retrieved {len(df)} telemetry records.\n")
    
    print("--- RAW TELEMETRY DATA SUMMARY ---")
    print(df.describe())

    X = df[['value']].values

    model = IsolationForest(contamination=0.1, random_state=42)
    df['anomaly_score'] = model.fit_predict(X)
    
    df['is_anomaly'] = df['anomaly_score'].apply(lambda x: True if x == -1 else False)

    print("\n--- ANOMALY DETECTION ENGINE OUTPUT ---")
    print(df[['metricName', 'value', 'is_anomaly', 'timestamp']])

if __name__ == '__main__':
    # 1. Start HTTP health check server in a background thread for Render
    server_thread = threading.Thread(target=start_health_server, daemon=True)
    server_thread.start()

    # 2. Main processing loop
    print("[Python Engine] Polling MongoDB every 60 seconds...")
    while True:
        try:
            fetch_and_analyze()
        except Exception as e:
            print(f"[Python Engine Error] {e}")
        
        time.sleep(60)