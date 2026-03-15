from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import Dataset
from ..schemas import DatasetResponse

router = APIRouter(
    prefix="/datasets",
    tags=["Datasets"]
)

@router.get("/", response_model=List[DatasetResponse])
def list_datasets(db: Session = Depends(get_db)):
    datasets = db.query(Dataset).order_by(Dataset.upload_time.desc()).all()
    return datasets
