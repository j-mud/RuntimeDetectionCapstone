import { useState } from 'react';
import { api } from '../api/client';

const RISK_COLORS = {
  safe: 'bg-green-100 text-green-800 border-green-300',
  low: 'bg-blue-100 text-blue-800 border-blue-300',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  high: 'bg-orange-100 text-orange-800 border-orange-300',
  critical: 'bg-red-100 text-red-800 border-red-300',
};

export default function Scan() {
  const [url, setUrl] = useState('');
  const [batchUrls, setBatchUrls] = useState('');
  const [tab, setTab] = useState('single');
  const [result, setResult] = useState(null);
  const [batchResults, setBatchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleScan(e) {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const data = await api('/scan/analyze', {
        method: 'POST',
        body: JSON.stringify({ url, source: 'dashboard' }),
      });
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleBatch(e) {
    e.preventDefault();
    setError('');
    setBatchResults(null);
    setLoading(true);
    try {
      const urls = batchUrls.split('\n').map((u) => u.trim()).filter(Boolean);
      if (urls.length === 0) { setError('Enter at least one URL'); setLoading(false); return; }
      const data = await api('/scan/batch', {
        method: 'POST',
        body: JSON.stringify({ urls }),
      });
      setBatchResults(data.results);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">URL Scanner</h1>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab('single')}
          className={`px-4 py-2 rounded font-medium text-sm ${tab === 'single' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          Single URL
        </button>
        <button onClick={() => setTab('batch')}
          className={`px-4 py-2 rounded font-medium text-sm ${tab === 'batch' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          Batch Scan
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm">{error}</div>}

      {tab === 'single' ? (
        <form onSubmit={handleScan} className="bg-white rounded-lg shadow p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">URL to scan</label>
          <div className="flex gap-3">
            <input type="url" required value={url} onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button type="submit" disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50 font-medium">
              {loading ? 'Scanning...' : 'Scan'}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleBatch} className="bg-white rounded-lg shadow p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">URLs (one per line, max 50)</label>
          <textarea rows={6} value={batchUrls} onChange={(e) => setBatchUrls(e.target.value)}
            placeholder="https://example1.com&#10;https://example2.com"
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3 font-mono text-sm" />
          <button type="submit" disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50 font-medium">
            {loading ? 'Scanning...' : 'Scan All'}
          </button>
        </form>
      )}

      {/* Single result */}
      {result && <ScanResultCard result={result} />}

      {/* Batch results */}
      {batchResults && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-800">Batch Results ({batchResults.length})</h2>
          {batchResults.map((r, i) => (
            r.error
              ? <div key={i} className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">{r.url}: {r.error}</div>
              : <ScanResultCard key={i} result={r} />
          ))}
        </div>
      )}
    </div>
  );
}

function ScanResultCard({ result }) {
  const riskClass = RISK_COLORS[result.risk_level] || 'bg-gray-100 text-gray-800 border-gray-300';
  return (
    <div className={`rounded-lg border p-5 ${riskClass}`}>
      <div className="flex justify-between items-start flex-wrap gap-2">
        <div>
          <div className="font-mono text-sm break-all">{result.url}</div>
          <div className="mt-2 flex gap-3 flex-wrap items-center">
            <span className="text-lg font-bold capitalize">{result.risk_level}</span>
            <span className="text-sm">Confidence: {(result.confidence * 100).toFixed(1)}%</span>
            <span className="text-sm capitalize">Category: {result.threat_category}</span>
          </div>
        </div>
        {result.scan_id && <div className="text-xs opacity-70">Scan #{result.scan_id}</div>}
      </div>
      {result.model_contributions && result.model_contributions.length > 0 && (
        <div className="mt-3 text-xs">
          <span className="font-medium">Models: </span>
          {result.model_contributions.map((m, i) => (
            <span key={i} className="mr-3">{m.model_name} v{m.version} ({(m.score * 100).toFixed(0)}%)</span>
          ))}
        </div>
      )}
      {result.inference_time_ms != null && (
        <div className="mt-1 text-xs opacity-70">Inference: {result.inference_time_ms.toFixed(1)}ms</div>
      )}
    </div>
  );
}
