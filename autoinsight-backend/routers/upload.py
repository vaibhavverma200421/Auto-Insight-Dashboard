from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
import shutil
import os
import uuid

from ..database import get_db, engine
from ..models import Dataset
from ..schemas import DatasetResponse
from ..data_processor import DataProcessor

router = APIRouter(
    prefix="/upload",
    tags=["Upload"]
)

@router.post("/", response_model=DatasetResponse)
async def upload_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")

    dataset_id = str(uuid.uuid4())
    temp_dir = os.path.join(os.path.dirname(__file__), "..", "temp")
    os.makedirs(temp_dir, exist_ok=True)
    temp_file_path = os.path.join(temp_dir, f"{dataset_id}.csv")

    try:
        # Save file temporarily
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        file_size = os.path.getsize(temp_file_path)

        # Process the CSV data
        processed_data = DataProcessor.process_csv(temp_file_path, engine, dataset_id)

        # Store metadata into Datasets table
        dataset_meta = Dataset(
            id=dataset_id,
            filename=file.filename,
            table_name=processed_data["table_name"],
            row_count=processed_data["row_count"],
            file_size_bytes=file_size,
            columns_info=processed_data["columns_info"],
            summary_metrics={
                "metrics": processed_data["metrics"],
                "charts": processed_data["charts"]
            }
        )
        
        db.add(dataset_meta)
        db.commit()
        db.refresh(dataset_meta)

        # Cleanup temp file securely
        try:
            os.remove(temp_file_path)
        except:
            pass

        return dataset_meta

    except Exception as e:
        # cleanup if failure
        try:
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
        except:
            pass
        raise HTTPException(status_code=500, detail=f"Error processing CSV: {str(e)}")
