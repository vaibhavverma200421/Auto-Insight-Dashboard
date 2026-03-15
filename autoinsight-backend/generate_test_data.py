import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random

# Generate a fake sales dataset with 15k rows for testing

num_rows = 15000

# Dates over the last year
start_date = datetime.now() - timedelta(days=365)
dates = [start_date + timedelta(days=random.randint(0, 365)) for _ in range(num_rows)]

categories = ['Electronics', 'Clothing', 'Home & Garden', 'Sports', 'Toys']
segments = ['B2B', 'B2C', 'Enterprise', 'Government']
regions = ['North America', 'Europe', 'Asia', 'South America', 'Australia']

data = {
    'Transaction ID': [f'TXN-{i+1000}' for i in range(num_rows)],
    'Date': dates,
    'Category': random.choices(categories, weights=[0.3, 0.25, 0.2, 0.15, 0.1], k=num_rows),
    'Segment': random.choices(segments, weights=[0.4, 0.5, 0.05, 0.05], k=num_rows),
    'Region': random.choices(regions, weights=[0.35, 0.3, 0.2, 0.1, 0.05], k=num_rows),
    'Units Sold': np.random.poisson(3, num_rows),
    # Prices roughly based on category
    'Unit Price': [round(random.uniform(10.0, 500.0), 2) for _ in range(num_rows)]
}

df = pd.DataFrame(data)

# Add some noise to Unit Price based on category to make it slightly realistic
category_multipliers = {
    'Electronics': 2.5,
    'Clothing': 0.8,
    'Home & Garden': 1.2,
    'Sports': 1.0,
    'Toys': 0.5
}
df['Unit Price'] = df.apply(lambda row: round(row['Unit Price'] * category_multipliers[row['Category']], 2), axis=1)

# Calculate Revenue (Net Volume simulation)
df['Total Revenue'] = df['Units Sold'] * df['Unit Price']

# Introduce some missing values to test robustness
for col in ['Segment', 'Region']:
    mask = np.random.choice([True, False], size=num_rows, p=[0.05, 0.95])
    df.loc[mask, col] = np.nan

df.to_csv('sample_sales_data.csv', index=False)
print("sample_sales_data.csv generated successfully with 15,000 rows.")
