# Telemetry Analytics Engine

A full-stack, microservice-architected telemetry analytics platform featuring a React (Vite) frontend dashboard, an Express backend REST API, and a Python data processing engine for anomaly detection.

## 🏗 System Architecture

* **Frontend:** React + Vite, Recharts, NGINX
* **Backend:** Node.js, Express, MongoDB (Mongoose), JWT Authentication
* **Data Engine:** Python 3.11, Pandas, Scikit-Learn (Isolation Forest / Anomaly Detection)
* **Containerization:** Docker & Docker Compose

## 🚀 Getting Started (Local Development)

### Prerequisites
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

### Running with Docker Compose

1. Clone the repository:
   ```bash
   git clone [https://github.com/YOUR_GITHUB_USERNAME/analytics-engine.git](https://github.com/YOUR_GITHUB_USERNAME/analytics-engine.git)
   cd analytics-engine 

Create a .env file in the root directory:

Code snippet
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
Build and launch all containers:

Bash
docker-compose up --build
Open your browser and access the application at http://localhost.

### Step 3: Push Project to GitHub

Execute the following commands in your PowerShell terminal:

```powershell
git init
git add .
git commit -m "Initial commit: Analytics engine with Docker support"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/analytics-engine.git
git push -u origin main