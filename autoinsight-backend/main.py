from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AutoInsight API",
    description="Backend API for AutoInsight dashboard",
    version="1.0.0"
)

# Allow CORS for the frontend app
origins = [
    "http://localhost:5173", # Vite default
    "http://localhost:3000", # CRA default
    # Add your specific frontend URL if different
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For development, allowing all. In production, restrict to `origins`
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to AutoInsight API"}

from .routers import upload, insights, datasets, preview
app.include_router(upload.router)
app.include_router(insights.router)
app.include_router(datasets.router)
app.include_router(preview.router)
