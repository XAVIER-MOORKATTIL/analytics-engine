import os
import time
import pandas as pd
import numpy as np
from pymongo import MongoClient
from sklearn.ensemble import IsolationForest
from dotenv import load_dotenv

# Load environment variables from backend .env file (for local dev)
load_dotenv(dotenv_path='../.env')

MONGO_URI = os.getenv('MONGO_URI')

def fetch_and_analyze():
    if not MONGO_URI:
        print("[Error] MONGO_URI missing from environment variables.")
        return

    print("[Python Engine] Connecting to MongoDB Atlas...")
    client = MongoClient(MONGO_URI)
    
    # Explicitly select the 'test' database used by Mongoose default
    db = client['test']
    collection = db['analytics']

    # Fetch raw telemetry records
    records = list(collection.find({}, {'_id': 0, 'metricName': 1, 'value': 1, 'timestamp': 1}))
    
    if not records:
        print("[Python Engine] No telemetry metrics found to process.")
        return

    # Convert BSON records to Pandas DataFrame
    df = pd.DataFrame(records)
    print(f"[Python Engine] Successfully retrieved {len(df)} telemetry records.\n")
    
    print("--- RAW TELEMETRY DATA SUMMARY ---")
    print(df.describe())

    # Feature Matrix Construction
    X = df[['value']].values

    # Fit Isolation Forest Model for Anomaly Detection
    model = IsolationForest(contamination=0.1, random_state=42)
    df['anomaly_score'] = model.fit_predict(X)
    
    # IsolationForest outputs -1 for anomalies and 1 for normal data points
    df['is_anomaly'] = df['anomaly_score'].apply(lambda x: True if x == -1 else False)

    print("\n--- ANOMALY DETECTION ENGINE OUTPUT ---")
    print(df[['metricName', 'value', 'is_anomaly', 'timestamp']])

if __name__ == '__main__':
    print("[Python Engine] Service Started. Polling MongoDB every 60 seconds...")
    while True:
        try:
            fetch_and_analyze()
        except Exception as e:
            print(f"[Python Engine Error] {e}")
        
        # Keep process alive for Render by sleeping 60s between analysis cycles
        time.sleep(60)



        