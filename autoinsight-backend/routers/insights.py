from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Dataset
from ..schemas import InsightsResponse

router = APIRouter(
    prefix="/insights",
    tags=["Insights"]
)

@router.get("/{dataset_id}", response_model=InsightsResponse)
def get_insights(dataset_id: str, db: Session = Depends(get_db)):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    try:
        metrics = dataset.summary_metrics.get("metrics", {})
        charts = dataset.summary_metrics.get("charts", {})
        
        return InsightsResponse(
            metrics=metrics,
            volume_flux=charts.get("volume_flux", {"labels": [], "values": []}),
            market_share=charts.get("market_share", {"labels": [], "values": []})
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving insights: {str(e)}")
