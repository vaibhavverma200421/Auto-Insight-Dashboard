# AutoInsight Backend

This is the FastAPI backend for the AutoInsight interactive dashboard. It ingests CSV files dynamically, performs statistical analysis using Pandas, and serves analytics via a REST API to a frontend React app.

## Features
- Dynamic CSV Parsing & inference (categorical, numerical, datetime)
- SQLite Database for robust local querying (easily scalable to PostgreSQL)
- Realtime time-series bucketing and key metric extraction

## Local Setup (Without Docker)
1. Ensure Python 3.9+ is installed.
2. Navigate to this directory (`cd autoinsight-backend`).
3. Create a virtual environment: `python -m venv venv`
4. Activate the virtual environment:
   - Linux/Mac: `source venv/bin/activate`
   - Windows: `venv\Scripts\activate`
5. Install dependencies: `pip install -r requirements.txt`
6. Run the server: `uvicorn main:app --reload --port 8000`

## Run Using Docker
1. Navigate to this directory.
2. Run `docker-compose up --build -d`
3. API is available at `http://localhost:8000`.

## Frontend Integration
Drop the provided `api.js` file (found in `../autoinsight-frontend-connector/api.js`) into your React app codebase (e.g., `src/api.js`). Ensure you run `npm install axios` in your React app. You can now use the `autoInsightService` object to easily upload files and fetch dataset insights!
