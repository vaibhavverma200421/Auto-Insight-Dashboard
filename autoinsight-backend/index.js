const express = require('express');
const cors = require('cors');
const multer = require('multer');
const Papa = require('papaparse');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const sqlite3 = require('sqlite3').verbose();
const xlsx = require('xlsx');

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

if (!fs.existsSync('./data')) {
  fs.mkdirSync('./data');
}

// init db
const db = new sqlite3.Database('./metrics.db');
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS datasets (
    id TEXT PRIMARY KEY,
    filename TEXT,
    table_name TEXT,
    upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    row_count INTEGER,
    file_size_bytes INTEGER,
    columns_info TEXT,
    summary_metrics TEXT
  )`);
});

const inferColumnTypes = (data) => {
    if (!data || data.length === 0) return {};
    const types = {};
    const firstRow = data[0];
    Object.keys(firstRow).forEach(key => {
        let isNumeric = true;
        let isDate = true;
        for (let i = 0; i < Math.min(100, data.length); i++) {
            const val = data[i][key];
            if (val === null || val === undefined || val === '') continue;
            if (isNaN(Number(val))) isNumeric = false;
            if (isNaN(Date.parse(val))) isDate = false;
        }
        types[key] = isNumeric ? 'numeric' : (isDate ? 'datetime' : 'categorical');
    });
    return types;
}

const processData = (data, types) => {
    // lowercase/replace spaces
    data = data.map(row => {
        const nr = {};
        Object.keys(row).forEach(k => nr[k.replace(/ /g, '_').toLowerCase()] = row[k]);
        return nr;
    });

    const newTypes = {};
    Object.keys(types).forEach(k => newTypes[k.replace(/ /g, '_').toLowerCase()] = types[k]);
    types = newTypes;

    const numericCols = Object.keys(types).filter(k => types[k] === 'numeric');
    const catCols = Object.keys(types).filter(k => types[k] === 'categorical');

    let netCol, maxColSum = -1;
    numericCols.forEach(col => {
        const sum = data.reduce((acc, row) => acc + (parseFloat(row[col])||0), 0);
        if (sum > maxColSum) { maxColSum = sum; netCol = col; }
    });

    let avgCol = numericCols.find(c => c.includes('price') || c.includes('unit')) || numericCols[0];
    let regionCol = catCols.find(c => c.includes('region') || c.includes('country') || c.includes('location')) || catCols[0];
    let segmentCol = catCols.find(c => c.includes('segment') || c.includes('category') || c.includes('product')) || (catCols.length > 1 ? catCols[1] : catCols[0]);

    // Enhanced Core Metrics
    let net_volume = 0;
    let avg_unit = 0;
    let max_unit = -Infinity;
    let min_unit = Infinity;
    
    if (netCol) {
        data.forEach(row => {
            const v = parseFloat(row[netCol]) || 0;
            net_volume += v;
        });
    }

    if (avgCol) {
        data.forEach(row => {
            const v = parseFloat(row[avgCol]);
            if (!isNaN(v)) {
                avg_unit += v;
                if (v > max_unit) max_unit = v;
                if (v < min_unit) min_unit = v;
            }
        });
        avg_unit = avg_unit / (data.length || 1);
        if (max_unit === -Infinity) max_unit = 0;
        if (min_unit === Infinity) min_unit = 0;
    }
    
    // Categorical Analysis
    const topSegmentCount = {};
    const segmentVolume = {};
    const uniqueSegments = new Set();
    if(segmentCol) {
        data.forEach(r => { 
            const val = r[segmentCol] || 'Unknown';
            const vol = parseFloat(r[netCol]) || parseFloat(r[avgCol]) || 0;
            topSegmentCount[val] = (topSegmentCount[val]||0)+1; 
            segmentVolume[val] = (segmentVolume[val]||0) + vol;
            uniqueSegments.add(val);
        });
    }
    const top_segment = segmentCol ? Object.keys(topSegmentCount).sort((a,b)=>topSegmentCount[b]-topSegmentCount[a])[0] : 'N/A';
    
    const topRegionCount = {};
    const uniqueRegions = new Set();
    if(regionCol) {
        data.forEach(r => { 
            const val = r[regionCol] || 'Unknown';
            topRegionCount[val] = (topRegionCount[val]||0)+1; 
            uniqueRegions.add(val);
        });
    }
    const top_region = regionCol ? Object.keys(topRegionCount).sort((a,b)=>topRegionCount[b]-topRegionCount[a])[0] : 'N/A';

    // Market Share
    const market_share = { labels: [], values: [] };
    if (segmentCol) {
        const sorted = Object.entries(topSegmentCount).sort((a,b)=>b[1]-a[1]).slice(0,5);
        market_share.labels = sorted.map(i=>i[0]);
        market_share.values = sorted.map(i=>i[1]);
    }

    // Volume Flux
    const volume_flux = { labels: [], values: [] };
    
    if (data.length > 0) {
        const chunks = 20;
        const chunkSize = Math.max(1, Math.floor(data.length / chunks));
        for(let i=0; i<chunks; i++) {
            const chunk = data.slice(i*chunkSize, (i+1)*chunkSize);
            if(!chunk.length) break;
            const sum = chunk.reduce((acc, row) => acc + (parseFloat(row[netCol]) || 0), 0);
            volume_flux.labels.push(`Batch ${i+1}`);
            volume_flux.values.push(sum);
        }
    }
    
    // Bar Charts Data
    const category_bars = Object.keys(segmentVolume).map(k => ({
         name: k.length > 15 ? k.substring(0,15)+'...' : k,
         value: segmentVolume[k]
    })).sort((a,b) => b.value - a.value).slice(0, 6);

    const region_bars = Object.keys(topRegionCount).map(k => ({
         name: k.length > 15 ? k.substring(0,15)+'...' : k,
         value: topRegionCount[k]
    })).sort((a,b) => b.value - a.value).slice(0, 6);

    return {
        metrics: {
            net_volume, 
            total_entries: data.length, 
            avg_unit, 
            max_unit,
            min_unit,
            unique_segments: uniqueSegments.size,
            unique_regions: uniqueRegions.size,
            top_segment, 
            top_region
        },
        charts: { 
            volume_flux, 
            market_share,
            category_bars,
            region_bars
        },
        formattedData: data,
        types
    }
}

app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({error: "No file"});

    const id = uuidv4();
    const table_name = `dataset_${id.replace(/-/g, '_')}`;
    const isExcel = req.file.originalname.match(/\.(xlsx|xls)$/i);
    
    let parsedData = [];
    
    try {
        if (isExcel) {
            const workbook = xlsx.readFile(req.file.path);
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            parsedData = xlsx.utils.sheet_to_json(sheet, { defval: "" });
            
            if (!parsedData || parsedData.length === 0) {
               return res.status(400).json({error: "Empty or invalid Excel format"});
            }
        } else {
            const content = fs.readFileSync(req.file.path, 'utf8');
            const parsed = Papa.parse(content, { header: true, skipEmptyLines: true });
            if (parsed.errors.length > 0 && parsed.data.length === 0) {
                return res.status(400).json({error: "Invalid CSV format"});
            }
            parsedData = parsed.data;
        }
    } catch (err) {
        return res.status(500).json({error: "Error processing file: " + err.message});
    }

    const colTypes = inferColumnTypes(parsedData);
    const { metrics, charts, formattedData, types } = processData(parsedData, colTypes);

    const summary_metrics = JSON.stringify({ metrics, charts });
    const columns_info = JSON.stringify(types);

    const dbCols = Object.keys(formattedData[0] || {}).map(c => `${c} TEXT`).join(', ');
    if(dbCols) {
        db.run(`CREATE TABLE ${table_name} (${dbCols})`, (err) => {
            if(!err) {
                const stmt = db.prepare(`INSERT INTO ${table_name} VALUES (${Object.keys(formattedData[0]).map(()=>'?').join(',')})`);
                formattedData.forEach(row => stmt.run(Object.values(row)));
                stmt.finalize();
            }
        });
    }

    db.run(
        `INSERT INTO datasets (id, filename, table_name, row_count, file_size_bytes, columns_info, summary_metrics) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, req.file.originalname, table_name, formattedData.length, req.file.size, columns_info, summary_metrics],
        (err) => {
            if (err) return res.status(500).json({error: err.message});
            
            res.json({
                id,
                filename: req.file.originalname,
                row_count: formattedData.length,
                file_size_bytes: req.file.size,
                columns_info: types,
                preview_data: parsedData.slice(0, 3) // Return first 3 original rows for the frontend briefing
            });
        }
    );
});

app.get('/datasets', (req, res) => {
    db.all(`SELECT * FROM datasets ORDER BY upload_time DESC`, (err, rows) => {
        if(err) return res.status(500).json({error: err.message});
        res.json(rows);
    });
});

app.get('/insights/:id', (req, res) => {
    db.get(`SELECT summary_metrics FROM datasets WHERE id = ?`, [req.params.id], (err, row) => {
        if(err || !row) return res.status(404).json({error: "Not found"});
        res.json(JSON.parse(row.summary_metrics));
    });
});

app.get('/data-preview/:id', (req, res) => {
    const table_name = `dataset_${req.params.id.replace(/-/g, '_')}`;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    db.all(`SELECT * FROM ${table_name} LIMIT ? OFFSET ?`, [limit, offset], (err, rows) => {
        if (err) return res.status(500).json({error: err.message});
        
        db.get(`SELECT COUNT(*) as total FROM ${table_name}`, [], (err, countRow) => {
            res.json({
                data: rows,
                total: countRow ? countRow.total : 0,
                page,
                limit
            });
        });
    });
});

app.post('/insights/:id/filter', (req, res) => {
    const table_name = `dataset_${req.params.id.replace(/-/g, '_')}`;
    const filters = req.body.filters || {}; // e.g. { "segment": "3 Series", "region": "Europe" }

    db.get('SELECT columns_info FROM datasets WHERE id = ?', [req.params.id], (err, dbSet) => {
        if (err || !dbSet) return res.status(404).json({error: "Dataset not found"});
        
        const colTypes = JSON.parse(dbSet.columns_info);
        
        let query = `SELECT * FROM ${table_name}`;
        let params = [];
        let conditions = [];

        // Build WHERE clause
        Object.keys(filters).forEach(k => {
            if (filters[k] && filters[k] !== 'All') {
                conditions.push(`"${k}" = ?`);
                params.push(filters[k]);
            }
        });

        if (conditions.length > 0) {
            query += ` WHERE ` + conditions.join(' AND ');
        }

        db.all(query, params, (err, rows) => {
            if (err) return res.status(500).json({error: err.message});
            if (rows.length === 0) {
                // Return empty/zeroed out metrics if slice has no data
                return res.json({
                    metrics: { net_volume: 0, total_entries: 0, avg_unit: 0, max_unit: 0, min_unit: 0, unique_segments: 0, unique_regions: 0, top_segment: 'None', top_region: 'None' },
                    charts: { volume_flux: {labels:[], values:[]}, market_share: {labels:[], values:[]}, category_bars: [], region_bars: [] }
                });
            }

            const { metrics, charts } = processData(rows, colTypes);
            res.json({ metrics, charts });
        });
    });
});

app.listen(8000, () => {
    console.log('Node.js Backend Running directly on :8000');
});
