import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Upload, ShieldCheck, Zap, AlertTriangle, Code, Download, FileText, ArrowRight } from 'lucide-react';

interface AnalysisResult {
  stats: {
    totalTags: number;
    ga4Configs: number;
    ga4Events: number;
    googleAds: number;
  };
  measurementIds: string[];
  adsConversions: Array<{
    name: string;
    conversionId: string;
    conversionLabel: string;
  }>;
  recommendations: string[];
  workerCode: string;
}

export const GTMCompilerPage = () => {
  const [json, setJson] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setJson(event.target?.result as string);
    };
    reader.readAsText(file);
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result.workerCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'worker.ts';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.post('/api/v1/gtm/analyze', { json });
      setResult(response.data.analysis);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to analyze container');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">GTM-to-Edge <span className="text-purple-500">Compiler</span></h1>
        <p className="text-gray-400 text-lg">
          Paste your GTM container export (JSON) to generate an edge-optimized tracking worker.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-6">
          <div className="glass-card p-6 bg-[#0B0B15]/50 border-purple-500/20">
            <label className="block text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
              <Upload size={16} /> Container JSON Export
            </label>
            
            <div className="flex gap-3 mb-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 py-3 px-4 rounded-lg text-sm text-gray-300 transition-all flex items-center justify-center gap-2"
              >
                <FileText size={16} /> Upload JSON File
              </button>
              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            
            <textarea
              className="w-full h-[350px] bg-black/40 border border-white/10 rounded-xl p-4 font-mono text-sm text-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all outline-none"
              placeholder='{"containerVersion": {...}}'
              value={json}
              onChange={(e) => setJson(e.target.value)}
            />
            
            <button
              onClick={handleAnalyze}
              disabled={loading || !json}
              className="mt-6 w-full bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-cyan-500 hover:to-purple-600 py-4 rounded-xl text-white font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Zap className="animate-spin" /> : <ShieldCheck />}
              {loading ? 'Compiling...' : 'Analyze & Generate Edge Worker'}
            </button>
            {error && <p className="mt-4 text-red-400 text-sm flex items-center gap-2"><AlertTriangle size={14} /> {error}</p>}
          </div>
        </div>

        <div className="space-y-8">
          {result ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-card p-4 text-center">
                  <div className="text-2xl font-bold text-cyan-400">{result.stats.totalTags}</div>
                  <div className="text-xs text-gray-500 uppercase">Total Tags</div>
                </div>
                <div className="glass-card p-4 text-center">
                  <div className="text-2xl font-bold text-purple-400">{result.stats.ga4Configs}</div>
                  <div className="text-xs text-gray-500 uppercase">GA4 Configs</div>
                </div>
              </div>

              <div className="glass-card p-6 border-purple-500/30">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <AlertTriangle size={18} className="text-yellow-400" /> Recommendations
                </h3>
                <ul className="space-y-3">
                  {result.recommendations.map((rec, i) => (
                    <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                      <span className="text-purple-500">•</span> {rec}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Code size={18} className="text-cyan-400" /> Generated Worker Code
                  </h3>
                  <button 
                    onClick={handleDownload}
                    className="text-xs bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 py-2 px-3 rounded-lg transition-all flex items-center gap-1"
                  >
                    <Download size={14} /> Download worker.ts
                  </button>
                </div>
                <div className="bg-[#0d1117] rounded-xl p-6 font-mono text-xs overflow-x-auto border border-white/5 shadow-2xl max-h-[500px] overflow-y-auto">
                  <pre className="text-gray-300 whitespace-pre-wrap"><code>{result.workerCode}</code></pre>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
              <Code size={64} className="mb-4" />
              <p className="text-gray-400 max-w-xs">
                Upload your GTM container to see the analysis and generated infrastructure code.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
