from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

# Schema for Dataset metadata return
class DatasetResponse(BaseModel):
    id: str
    filename: str
    upload_time: datetime
    row_count: int
    file_size_bytes: int
    columns_info: Dict[str, str]

    class Config:
        orm_mode = True

# Schema for key metrics
class InsightMetrics(BaseModel):
    net_volume: float
    total_entries: int
    avg_unit: float
    top_segment: str
    top_region: str

# Schema for a single chart data series
class ChartData(BaseModel):
    labels: List[str]
    values: List[float]

# Full response schema for the insights endpoint
class InsightsResponse(BaseModel):
    metrics: InsightMetrics
    volume_flux: ChartData
    market_share: ChartData

# Optional: response for paginated data preview
class DataPreviewResponse(BaseModel):
    total_rows: int
    page: int
    page_size: int
    columns: List[str]
    data: List[Dict[str, Any]]
