import pandas as pd
import numpy as np
import uuid
import os
from datetime import datetime

class DataProcessor:
    @staticmethod
    def infer_column_types(df: pd.DataFrame) -> dict:
        """Infer basic semantics of columns for the frontend."""
        col_types = {}
        for col in df.columns:
            if pd.api.types.is_numeric_dtype(df[col]):
                col_types[col] = "numeric"
            elif pd.api.types.is_datetime64_any_dtype(df[col]):
                col_types[col] = "datetime"
            else:
                # Try to parse string to datetime. If mostly successful, it's datetime.
                try:
                    converted = pd.to_datetime(df[col], errors='coerce')
                    if converted.notnull().sum() > len(df) * 0.5:
                        df[col] = converted
                        col_types[col] = "datetime"
                        continue
                except Exception:
                    pass
                col_types[col] = "categorical"
        return col_types

    @staticmethod
    def detect_key_columns(df: pd.DataFrame, col_types: dict):
        """Heuristically determine which columns to use for specific metrics."""
        numeric_cols = [c for c, t in col_types.items() if t == "numeric"]
        cat_cols = [c for c, t in col_types.items() if t == "categorical"]
        date_cols = [c for c, t in col_types.items() if t == "datetime"]

        # Net Volume col (highest sum)
        net_col = None
        max_sum = -1
        for col in numeric_cols:
            if df[col].sum() > max_sum:
                max_sum = df[col].sum()
                net_col = col
        
        # Avg Unit col (try to find columns with 'price' or 'unit' or pick second numeric)
        avg_col = None
        for col in numeric_cols:
            if 'price' in col.lower() or 'unit' in col.lower():
                avg_col = col
                break
        if not avg_col and len(numeric_cols) > 1:
            avg_col = [c for c in numeric_cols if c != net_col][0]
        elif not avg_col and numeric_cols:
            avg_col = numeric_cols[0]

        # Region/Segment columns
        region_col = None
        segment_col = None
        for col in cat_cols:
            if 'region' in col.lower() or 'country' in col.lower() or 'location' in col.lower():
                region_col = col
            if 'segment' in col.lower() or 'category' in col.lower() or 'product' in col.lower():
                segment_col = col
        
        if not segment_col and cat_cols:
            segment_col = cat_cols[0]
        if not region_col and len(cat_cols) > 1:
            region_col = [c for c in cat_cols if c != segment_col][0]
        elif not region_col and cat_cols:
            region_col = cat_cols[0]

        return {
            "net_col": net_col,
            "avg_col": avg_col,
            "region_col": region_col,
            "segment_col": segment_col,
            "date_cols": date_cols,
            "cat_cols": cat_cols
        }

    @staticmethod
    def process_csv(file_path: str, engine, dataset_id: str):
        """Reads CSV, infers columns, generates metrics, and saves to database."""
        df = pd.read_csv(file_path)
        
        # Ensure proper column names for SQL
        df.columns = [str(c).replace(" ", "_").lower() for c in df.columns]

        col_types = DataProcessor.infer_column_types(df)
        keys = DataProcessor.detect_key_columns(df, col_types)

        # 1. Compute Metrics
        net_volume = float(df[keys['net_col']].sum()) if keys['net_col'] else 0.0
        total_entries = int(len(df))
        avg_unit = float(df[keys['avg_col']].mean()) if keys['avg_col'] else 0.0
        
        top_segment = "N/A"
        if keys['segment_col']:
            top_segment_counts = df[keys['segment_col']].value_counts()
            if not top_segment_counts.empty:
                top_segment = str(top_segment_counts.idxmax())

        top_region = "N/A"
        if keys['region_col']:
            top_region_counts = df[keys['region_col']].value_counts()
            if not top_region_counts.empty:
                top_region = str(top_region_counts.idxmax())

        # 2. Compute Market Share Data Series
        market_share = {"labels": [], "values": []}
        if keys['segment_col']:
            dist = df[keys['segment_col']].value_counts().head(5) # max top 5 slices
            market_share["labels"] = dist.index.tolist()
            market_share["values"] = dist.values.tolist()
        elif keys['cat_cols']:
            dist = df[keys['cat_cols'][0]].value_counts().head(5)
            market_share["labels"] = dist.index.tolist()
            market_share["values"] = dist.values.tolist()

        # 3. Compute Volume Flux Data Series (Time Series)
        volume_flux = {"labels": [], "values": []}
        date_col = keys['date_cols'][0] if keys['date_cols'] else None
        if date_col and keys['net_col']:
            # Group by Month or Week
            # df[date_col] is datetime already via infer_column_types
            series = df.set_index(date_col).resample('M')[keys['net_col']].sum().fillna(0)
            if len(series) < 3: # If few months, resample by week 'W'
                series = df.set_index(date_col).resample('W')[keys['net_col']].sum().fillna(0)
            if len(series) < 3: # If few weeks, resample by day 'D'
                series = df.set_index(date_col).resample('D')[keys['net_col']].sum().fillna(0)
            
            # format labels nicely
            volume_flux["labels"] = [t.strftime("%Y-%m-%d") for t in series.index]
            volume_flux["values"] = series.values.tolist()
        else:
            # Fallback if no date: just take first 20 chunks of the dataset and simulate "time over arbitrary chunks"
            if len(df) > 20:
                chunk_size = len(df) // 20
                df_chunks = [df[i:i+chunk_size] for i in range(0, len(df), chunk_size)]
                vol_col = keys['net_col'] if keys['net_col'] else df.select_dtypes(include='number').columns[0]
                chunk_sums = [c[vol_col].sum() for c in df_chunks]
                volume_flux["labels"] = [f"Batch {i+1}" for i in range(len(chunk_sums))]
                volume_flux["values"] = chunk_sums

        metrics = {
            "net_volume": round(net_volume, 2),
            "total_entries": total_entries,
            "avg_unit": round(avg_unit, 2),
            "top_segment": top_segment,
            "top_region": top_region
        }

        charts = {
            "volume_flux": volume_flux,
            "market_share": market_share
        }

        # 4. Save DataFrame to sqlite (the table name will be dataset_{id})
        table_name = f"dataset_{dataset_id.replace('-', '_')}"
        # using if_exists='replace' just in case. SQLite handles pandas to_sql effortlessly.
        df.to_sql(table_name, engine, if_exists='replace', index=False)

        return {
            "row_count": total_entries,
            "columns_info": col_types,
            "metrics": metrics,
            "charts": charts,
            "table_name": table_name
        }
