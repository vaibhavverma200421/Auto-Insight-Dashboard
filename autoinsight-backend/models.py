from sqlalchemy import Column, Integer, String, DateTime, JSON
from datetime import datetime
from .database import Base

class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(String, primary_key=True, index=True) # UUID string
    filename = Column(String, index=True)
    table_name = Column(String, unique=True, index=True) # The dynamic SQLite table name (e.g., dataset_<id>)
    upload_time = Column(DateTime, default=datetime.utcnow)
    row_count = Column(Integer)
    file_size_bytes = Column(Integer)
    columns_info = Column(JSON) # Store inferred column types { "col1": "numeric", "col2": "categorical" }
    summary_metrics = Column(JSON) # Store the pre-calculated metrics if needed for fast retrieval
