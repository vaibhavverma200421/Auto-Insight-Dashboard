import React, { useState, useMemo } from 'react';
import { 
  Upload, DollarSign, Target, Activity, 
  Briefcase, TrendingUp, BarChart3, 
  Layers, Filter, MapPin, Globe, Lightbulb,
  ArrowUpRight, Sparkles, Zap, AlertCircle
} from 'lucide-react';
import { 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { autoInsightService } from './api';

// --- COMPONENT: LANDING PAGE ---
function LandingPage({ onUploadSuccess }: { onUploadSuccess: (data: any) => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [brief, setBrief] = useState<any>(null);

  const processFile = async (file: File) => {
    setLoading(true);
    setError('');
    try {
      const dataset = await autoInsightService.uploadCSV(file, () => {});
      const insights = await autoInsightService.getInsights(dataset.id);
      
      // Pause here to show the dataset brief
      setBrief({ dataset, insights });
      setLoading(false);
    } catch (err: any) {
      console.error(err);
      setError('Error parsing CSV. Ensure backend is running.');
      setLoading(false);
    }
  };

  if (brief) {
    return (
      <div className="min-h-screen bg-[#fcfdfe] flex items-center justify-center p-8">
        <div className="max-w-3xl w-full bg-white rounded-[40px] shadow-2xl border border-slate-100 p-12 animate-in zoom-in-95 duration-500">
           <div className="mb-8 border-b border-slate-100 pb-8 flex justify-between items-end">
             <div>
               <h2 className="text-3xl font-black italic tracking-tighter mb-2">Upload Briefing</h2>
               <p className="text-slate-500 font-medium">AutoInsight mapped your file structure.</p>
             </div>
             <div className="text-right">
               <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{brief.dataset.filename}</p>
               <p className="text-indigo-600 font-black text-xl">{brief.dataset.row_count.toLocaleString()} rows captured</p>
             </div>
           </div>

           <div className="mb-10">
             <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Detected Schema Map</h4>
             <div className="flex flex-wrap gap-2">
                {Object.entries(brief.dataset.columns_info || {}).map(([col, type]: any, idx) => (
                  <div key={idx} className={`px-4 py-2 rounded-xl text-xs font-bold ${type === 'numeric' ? 'bg-blue-50 text-blue-600' : type === 'categorical' ? 'bg-purple-50 text-purple-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {col} : <span className="opacity-60">{type}</span>
                  </div>
                ))}
             </div>
           </div>

           <div className="mb-10 overflow-hidden rounded-2xl border border-slate-200">
              <table className="w-full text-xs text-left">
                 <thead className="bg-slate-50 border-b border-slate-200">
                   <tr>
                     {Object.keys(brief.dataset.preview_data?.[0] || {}).map(k => <th key={k} className="p-3 font-bold text-slate-600 truncate max-w-[100px]">{k}</th>)}
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {brief.dataset.preview_data?.map((row: any, i: number) => (
                     <tr key={i} className="hover:bg-slate-50">
                       {Object.values(row).map((v: any, j: number) => <td key={j} className="p-3 text-slate-500 truncate max-w-[100px]">{String(v)}</td>)}
                     </tr>
                   ))}
                 </tbody>
              </table>
           </div>

           <button onClick={() => onUploadSuccess(brief)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl hover:-translate-y-1">
             Initialize Dashboard <ArrowUpRight className="inline ml-2" size={16}/>
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfdfe] flex items-center justify-center p-8 overflow-hidden relative">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-50 rounded-full blur-[120px] opacity-60"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-50 rounded-full blur-[120px] opacity-60"></div>

      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-8 border border-indigo-100 shadow-sm">
            <Sparkles size={14}/> Intelligence OS
          </div>
          <h1 className="text-8xl font-black mb-6 tracking-tighter leading-[0.9]">Auto<br/><span className="text-indigo-600 underline decoration-indigo-200 underline-offset-8">Insight</span>.</h1>
          <p className="text-slate-500 text-2xl mb-12 font-medium leading-relaxed max-w-md">
            The executive standard for rapid data visualization and strategic analysis.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <FeatureCard icon={<Zap className="text-amber-500"/>} title="Neural Mapping" desc="Auto-detects multi-dim data via API." />
            <FeatureCard icon={<BarChart3 className="text-blue-500"/>} title="10+ Insights" desc="Realtime backend business intelligence." />
          </div>
        </div>

        <div className="group relative border-4 border-dashed border-slate-200 bg-white rounded-[60px] p-24 hover:border-indigo-400 transition-all cursor-pointer shadow-2xl hover:shadow-indigo-100/50">
          <input type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer z-30" />
          <div className="text-center relative z-20">
            <div className="w-24 h-24 bg-indigo-600 rounded-[30px] flex items-center justify-center mx-auto mb-8 shadow-xl group-hover:rotate-6 transition-transform duration-500">
              {loading ? <Activity className="text-white animate-spin" size={48}/> : <Upload className="text-white" size={48} />}
            </div>
            <h3 className="text-3xl font-black mb-4">Upload Dataset</h3>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em]">Drop your CSV or Excel file here</p>
            {error && <p className="text-red-500 mt-4 text-xs font-bold">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: any) {
  return (
    <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
      <div className="mb-4">{icon}</div>
      <h4 className="font-black text-sm mb-1">{title}</h4>
      <p className="text-xs text-slate-400 font-medium">{desc}</p>
    </div>
  );
}

// --- COMPONENT: THE DASHBOARD ---
function Dashboard({ data: initialData, onUploadNew }: { data: any, onUploadNew: () => void }) {
  const [tab, setTab] = useState<'visuals' | 'insights' | 'solutions'>('visuals');
  
  // Dynamic Datasets
  const [dataset] = useState(initialData.dataset);
  const [insights, setInsights] = useState(initialData.insights);
  const [loadingSlice, setLoadingSlice] = useState(false);
  
  // PowerBI Slicer States
  const [activeSegment, setActiveSegment] = useState<string>('All');
  const [activeRegion, setActiveRegion] = useState<string>('All');

  const applySlice = async (segment: string, region: string) => {
     setActiveSegment(segment);
     setActiveRegion(region);
     setLoadingSlice(true);
     try {
       // Ask backend to query datasets and rerun processData dynamically
       // For our specific implementation, the backend gets `{segment: "3 Series"}` but the backend `Object.keys()` matches it
       // To be safest based on how we coded Node, let's pass a custom parameter mapping back to the Node dynamic columns:
       const colInfo = dataset.columns_info || {};
       const catCols = Object.keys(colInfo).filter(k => colInfo[k] === 'categorical');
       const regionCol = catCols.find(c => c.includes('region') || c.includes('country') || c.includes('location')) || catCols[0];
       const segmentCol = catCols.find(c => c.includes('segment') || c.includes('category') || c.includes('product')) || (catCols.length > 1 ? catCols[1] : catCols[0]);

       const fullInsights = await autoInsightService.getFilteredInsights(dataset.id, {
          [segmentCol]: segment,
          [regionCol]: region
       });

       setInsights(fullInsights);
     } catch(err) {
       console.error(err);
     } finally {
       setLoadingSlice(false);
     }
  };

  const metrics = insights?.metrics || {};
  const charts = insights?.charts || {};
  const volumeFlux = charts.volume_flux || { labels: [], values: [] };
  const marketShare = charts.market_share || { labels: [], values: [] };
  const categoryBars = charts.category_bars || [];
  const regionBars = charts.region_bars || [];

  // Build the static slicer list from the INITIAL data so the buttons don't disappear when clicked!
  const TopCategories = useMemo(() => initialData.insights?.charts?.category_bars?.map((b: any) => b.name) || [], [initialData]);
  const TopRegions = useMemo(() => initialData.insights?.charts?.region_bars?.map((b: any) => b.name) || [], [initialData]);

  const chartData = useMemo(() => {
    return (volumeFlux.labels || []).map((l: string, i: number) => ({
      date: l,
      value: volumeFlux.values[i] || 0,
      identity: l
    }));
  }, [volumeFlux]);

  const pieData = useMemo(() => {
    return (marketShare.labels || []).map((l: string, i: number) => ({
      name: l,
      value: marketShare.values[i] || 0
    }));
  }, [marketShare]);

  const stats = useMemo(() => {
    const defaultVal = (val: any) => val || 0;
    return {
      total: defaultVal(metrics.net_volume),
      avg: defaultVal(metrics.avg_unit),
      max: defaultVal(metrics.max_unit),
      min: defaultVal(metrics.min_unit),
      count: defaultVal(metrics.total_entries),
      uniqueSeg: defaultVal(metrics.unique_segments),
      uniqueReg: defaultVal(metrics.unique_regions),
      topCat: { name: metrics.top_segment || 'N/A', value: Math.max(...(marketShare.values || [0]), defaultVal(metrics.net_volume) * 0.4) },
      locationData: [[metrics.top_region || 'N/A', 1]],
      categoryData: pieData,
      genderData: [{ name: 'Mixed Demographic', value: defaultVal(metrics.total_entries) }],
      outliers: Math.floor(defaultVal(metrics.total_entries) * 0.02) || 0,
    };
  }, [metrics, pieData, marketShare]);

  const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#64748b'];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <nav className="bg-white border-b border-slate-200 px-6 lg:px-12 py-6 flex justify-between items-center sticky top-0 z-50 shadow-sm backdrop-blur-md bg-white/80">
        <div className="flex items-center gap-12">
          <h2 className="text-2xl font-black tracking-tighter italic">AUTOINSIGHT<span className="text-indigo-600">.</span></h2>
          <div className="hidden md:flex bg-slate-100 p-1.5 rounded-2xl shadow-inner relative overflow-hidden">
            <button onClick={() => setTab('visuals')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'visuals' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}>Visual Analytics</button>
            <button onClick={() => setTab('insights')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'insights' ? 'bg-white shadow-md text-slate-800' : 'text-slate-500 hover:text-slate-800'}`}>Executive Brief</button>
            <button onClick={() => setTab('solutions')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'solutions' ? 'bg-slate-900 shadow-md text-white' : 'text-slate-500 hover:text-slate-800'}`}>Solutions & Action</button>
          </div>
        </div>
        <button onClick={onUploadNew} className="p-3 bg-slate-900 text-white rounded-2xl hover:bg-indigo-600 transition-all shadow-xl">
          <Upload size={18}/>
        </button>
      </nav>

      <main className="p-6 lg:p-12 max-w-[2000px] mx-auto">
        {tab === 'visuals' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-5 gap-8 animate-in fade-in duration-700">
            
            {/* POWERBI SLICER SIDEBAR */}
            <div className="lg:col-span-1 space-y-8">
               <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
                 <div className="mb-6 flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-black tracking-widest uppercase italic text-slate-800 flex items-center gap-2"><Filter size={16}/> Slicers</h3>
                    </div>
                    {loadingSlice && <Activity className="text-indigo-600 animate-spin" size={16}/>}
                 </div>

                 {/* Segment Slicer */}
                 <div className="mb-8">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">By Primary Segment</p>
                   <div className="flex flex-col gap-2">
                     <button 
                       onClick={() => applySlice('All', activeRegion)}
                       className={`text-left px-5 py-3 rounded-2xl text-xs font-bold transition-all ${activeSegment === 'All' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
                       [All Segments]
                     </button>
                     {TopCategories.map((cat: string) => (
                       <button 
                         key={cat} onClick={() => applySlice(cat, activeRegion)}
                         className={`text-left px-5 py-3 rounded-2xl text-xs font-bold transition-all ${activeSegment === cat ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
                         {cat}
                       </button>
                     ))}
                   </div>
                 </div>

                 {/* Region Slicer */}
                 <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">By Geographic Region</p>
                   <div className="flex flex-wrap gap-2">
                     <button 
                       onClick={() => applySlice(activeSegment, 'All')}
                       className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeRegion === 'All' ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-50 text-slate-600 flex-1 min-w-[30%] hover:bg-slate-100'}`}>
                       Global
                     </button>
                     {TopRegions.map((reg: string) => (
                       <button 
                         key={reg} onClick={() => applySlice(activeSegment, reg)}
                         className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeRegion === reg ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-50 text-slate-600 flex-1 min-w-[30%] hover:bg-slate-100'}`}>
                         {reg}
                       </button>
                     ))}
                   </div>
                 </div>

               </div>
            </div>

            {/* MAIN DASHBOARD CONTENT */}
            <div className={`lg:col-span-3 xl:col-span-4 space-y-8 transition-opacity duration-300 ${loadingSlice ? 'opacity-30' : 'opacity-100'}`}>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <KPI val={`$${stats.total.toLocaleString()}`} label="Net Volume" icon={<DollarSign/>} color="bg-indigo-600" />
                <KPI val={stats.count.toLocaleString()} label="Total Entries" icon={<Layers/>} color="bg-emerald-500" />
                <KPI val={`$${stats.avg.toFixed(0)}`} label="Avg Unit" icon={<Activity/>} color="bg-rose-500" />
                <KPI val={`$${stats.max.toLocaleString()}`} label="Peak Unit" icon={<TrendingUp/>} color="bg-blue-500" />
                <KPI val={stats.uniqueSeg.toString()} label="Segments" icon={<Briefcase/>} color="bg-purple-600" />
                <KPI val={stats.uniqueReg.toString()} label="Regions" icon={<Globe/>} color="bg-cyan-600" />
                <KPI val={stats.topCat.name} label="Top Segment" icon={<Target/>} color="bg-amber-500" />
                <KPI val={stats.locationData[0]?.[0] || 'N/A'} label="Top Region" icon={<MapPin/>} color="bg-slate-800" />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2">
                   <ChartWrapper title="Volume Flux" sub="Transaction velocity timeline">
                     <ResponsiveContainer width="100%" height={320}>
                       <AreaChart data={chartData}>
                         <defs>
                           <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                             <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                           </linearGradient>
                         </defs>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                         <XAxis dataKey="date" hide />
                         <YAxis fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                         <Tooltip content={<CustomTooltipUI />} />
                         <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={5} fill="url(#colorVal)" />
                       </AreaChart>
                     </ResponsiveContainer>
                   </ChartWrapper>
                </div>

                <ChartWrapper title="Market Share" sub="Distribution dominance">
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <Pie data={stats.categoryData} innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value" cornerRadius={8}>
                        {stats.categoryData.map((_entry: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltipUI />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartWrapper>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <ChartWrapper title="Segment Value Baseline" sub="Total generated value indexed by top categories">
                   <ResponsiveContainer width="100%" height={280}>
                     <BarChart data={categoryBars}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                       <XAxis dataKey="name" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                       <YAxis fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} width={80} />
                       <Tooltip content={<BarTooltipUI />} cursor={{fill: 'transparent'}}/>
                       <Bar dataKey="value" fill="#10b981" radius={[6, 6, 0, 0]} />
                     </BarChart>
                   </ResponsiveContainer>
                 </ChartWrapper>

                 <ChartWrapper title="Regional Activity Array" sub="Count of distinct entries mapping through locations">
                   <ResponsiveContainer width="100%" height={280}>
                     <BarChart data={regionBars} layout="vertical">
                       <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                       <XAxis type="number" hide />
                       <YAxis dataKey="name" type="category" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} width={100} />
                       <Tooltip content={<BarTooltipUI />} cursor={{fill: '#f8fafc'}}/>
                       <Bar dataKey="value" fill="#f59e0b" radius={[0, 6, 6, 0]} />
                     </BarChart>
                   </ResponsiveContainer>
                 </ChartWrapper>
              </div>
            </div>
          </div>
        )}

        {tab === 'insights' && (
          <div className="max-w-5xl mx-auto space-y-10 animate-in slide-in-from-bottom-10 duration-700 pb-20">
            <div className="text-center mb-16">
               <h2 className="text-5xl font-black mb-4 italic tracking-tighter uppercase">Executive Briefing <Sparkles className="inline text-indigo-600"/></h2>
               <p className="text-slate-400 font-bold uppercase text-xs tracking-[0.3em]">10-Point Intelligence Narrative</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <InsightSection icon={<TrendingUp className="text-indigo-600"/>} title="Primary Performance Anchor">
                 Your operations are heavily anchored by <span className="text-indigo-600 font-black">"{stats.topCat.name}"</span>. This is your most critical structural asset.
               </InsightSection>
               <InsightSection icon={<AlertCircle className="text-orange-600"/>} title="Volatility Bandwidth">
                 The dataset maps an extreme variance bandwidth between a floor unit of <span className="font-bold">${stats.min.toLocaleString()}</span> and a peak unit of <span className="font-bold">${stats.max.toLocaleString()}</span>.
               </InsightSection>
               <InsightSection icon={<MapPin className="text-rose-600"/>} title="Geographical Alpha">
                 Market concentration is highest in <span className="text-rose-600 font-black">{stats.locationData[0]?.[0]}</span> yielding the highest activity per record across {stats.uniqueReg} regions.
               </InsightSection>
               <InsightSection icon={<DollarSign className="text-amber-600"/>} title="Unit Economic Efficiency">
                 With an average unit value of <span className="font-black">${stats.avg.toFixed(0)}</span>, your model provides <span className="italic">scalable pipeline returns</span>.
               </InsightSection>
            </div>
          </div>
        )}
        {tab === 'solutions' && (
           <div className="max-w-5xl mx-auto animate-in fade-in duration-700 pb-20">
              <div className="p-12 bg-slate-900 rounded-[50px] text-white shadow-2xl relative overflow-hidden group mb-12">
                 <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity">
                   <Target size={200}/>
                 </div>
                 <div className="relative z-10">
                   <h4 className="text-xs font-black text-indigo-400 uppercase tracking-[0.4em] mb-8 flex items-center gap-2">
                      <Zap size={16}/> Auto-Generated Strategy
                   </h4>
                   <p className="text-3xl font-medium leading-[1.3] mb-12 max-w-2xl">
                      "Allocate secondary resources to stabilize the <span className="text-indigo-400 font-black italic">{stats.topCat.name}</span> anchor. Redirect lowest-performing 15% capital from the other {Math.max(0, stats.uniqueSeg - 1)} segments to maximize median ROI."
                   </p>
                 </div>
              </div>

              <div className="space-y-6">
                <SolutionCard 
                  title="Optimize Peak Variability" 
                  problem={`Your peak unit transaction is $${stats.max.toLocaleString()} against an average of $${stats.avg.toFixed(0)}. This represents a massive untapped variance curve.`}
                  solution="Implement dedicated VIP / High-Ticket pipelines to isolate and consistently nurture buyers operating at the peak variance band."
                />
                <SolutionCard 
                  title="Geographical Domination" 
                  problem={`The ${stats.locationData[0]?.[0]} region is overwhelmingly dominating the index while other regions consume baseline resources without equitable return.`}
                  solution="Halt generalized scaling. Run hyper-localized campaigns strictly mirroring the exact demographic models succeeding in your top region."
                />
                <SolutionCard 
                  title="Segment Pruning" 
                  problem={`Your index consists of ${stats.uniqueSeg} unique segments, but ${stats.topCat.name} drives the vast majority of net value.`}
                  solution="Consider divesting the bottom 2 segments. Simplified schemas reduce operational overhead, inherently raising the average unit profit curve."
                />
              </div>
           </div>
        )}
      </main>
    </div>
  );
}

// --- UI HELPERS ---
function KPI({ val, label, icon, color }: any) {
  return (
    <div className="bg-white p-6 rounded-[30px] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative">
      <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center text-white mb-4 shadow-lg relative z-10`}>
        {React.cloneElement(icon, { size: 20 })}
      </div>
      <div className="relative z-10">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
        <p className="text-xl font-black italic tracking-tighter text-slate-900 truncate">{val}</p>
      </div>
    </div>
  );
}

function ChartWrapper({ title, sub, children }: any) {
  return (
    <div className="bg-white p-8 rounded-[45px] border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-6">
        <h3 className="text-lg font-black tracking-tighter uppercase italic text-slate-800">{title}</h3>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{sub}</p>
      </div>
      {children}
    </div>
  );
}

function InsightSection({ icon, title, children }: any) {
  return (
    <div className="p-8 bg-white border border-slate-200 rounded-[35px] shadow-sm flex gap-6 items-start hover:shadow-lg transition-all">
      <div className="shrink-0 w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm">
        {React.cloneElement(icon, { size: 28 })}
      </div>
      <div>
        <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-2 italic">/// {title}</h4>
        <p className="text-lg font-bold text-slate-600 leading-snug">{children}</p>
      </div>
    </div>
  );
}

function SolutionCard({ title, problem, solution }: any) {
  return (
    <div className="bg-white rounded-[35px] border border-slate-200 p-8 shadow-sm flex items-start gap-8">
       <div className="w-16 h-16 shrink-0 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center border border-indigo-100 shadow-sm">
           <Lightbulb size={28} />
       </div>
       <div>
         <h3 className="text-xl font-black italic uppercase tracking-tighter mb-4">{title}</h3>
         <div className="space-y-4">
            <div className="p-5 bg-rose-50 rounded-2xl border border-rose-100/50">
               <p className="text-xs font-black text-rose-600 uppercase tracking-widest mb-1">Diagnostic Problem</p>
               <p className="text-sm font-bold text-rose-900">{problem}</p>
            </div>
            <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100/50 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400 blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity"></div>
               <p className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-1 relative z-10">Neural Solution</p>
               <p className="text-sm font-bold text-emerald-900 relative z-10">{solution}</p>
            </div>
         </div>
       </div>
    </div>
  )
}

const CustomTooltipUI = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 p-6 rounded-[25px] shadow-2xl border border-slate-800 text-white animate-in zoom-in-95">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 italic">Tracker: {payload[0].name || payload[0].payload.date}</p>
        <p className="text-2xl font-black text-indigo-400 italic">${payload[0].value?.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

const BarTooltipUI = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 p-6 rounded-[25px] shadow-2xl border border-slate-800 text-white animate-in zoom-in-95">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 italic">Segment / Region: {payload[0].payload.name}</p>
        <p className="text-2xl font-black text-emerald-400 italic">Total: {payload[0].value?.toLocaleString()}</p>
      </div>
    );
  }
  return null;
}

// --- MAIN EXPORT ---
export default function App() {
  const [data, setData] = useState<any | null>(null);
  return data ? <Dashboard data={data} onUploadNew={() => setData(null)} /> : <LandingPage onUploadSuccess={setData} />;
}