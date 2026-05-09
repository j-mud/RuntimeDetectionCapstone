import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';

export default function DetectionDetail() {
  const { id } = useParams();
  const [detection, setDetection] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [explLoading, setExplLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api(`/detections/${id}`),
      api(`/explanations/${id}`).catch(() => null),
    ])
      .then(([det, expl]) => {
        setDetection(det);
        setExplanation(expl);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function generateExplanation() {
    setExplLoading(true);
    try {
      const data = await api('/explanations/generate', {
        method: 'POST',
        body: JSON.stringify({ scan_id: parseInt(id) }),
      });
      setExplanation(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setExplLoading(false);
    }
  }

  if (loading) return <div className="p-4 text-gray-500">Loading...</div>;
  if (error) return <div className="text-red-600 p-4">{error}</div>;
  if (!detection) return <div className="p-4 text-gray-500">Not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/detections" className="text-blue-600 hover:underline text-sm">&larr; Back</Link>
        <h1 className="text-2xl font-bold text-gray-900">Scan #{detection.scan_id}</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="font-medium text-gray-500">URL</dt>
            <dd className="font-mono text-gray-900 break-all">{detection.url}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">Status</dt>
            <dd>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${detection.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {detection.status}
              </span>
            </dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">Source</dt>
            <dd className="text-gray-900">{detection.source}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">Created</dt>
            <dd className="text-gray-900">{detection.created_at ? new Date(detection.created_at).toLocaleString() : '-'}</dd>
          </div>
        </dl>
      </div>

      {/* Explanation */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Explanation</h2>
        {explanation ? (
          <div className="space-y-3 text-sm">
            {explanation.method && (
              <div><span className="font-medium text-gray-500">Method:</span> <span className="uppercase text-gray-900">{explanation.method}</span></div>
            )}
            {explanation.summary_text && (
              <div><span className="font-medium text-gray-500">Summary:</span> <span className="text-gray-900">{explanation.summary_text}</span></div>
            )}
            {explanation.top_features && explanation.top_features.length > 0 && (
              <div>
                <span className="font-medium text-gray-500">Top Features:</span>
                <div className="mt-2 space-y-1">
                  {explanation.top_features.map(([feat, val], i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-32 text-gray-700 text-xs">{feat}</div>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.min(val * 100, 100)}%` }} />
                      </div>
                      <div className="text-xs text-gray-500 w-12 text-right">{(val * 100).toFixed(0)}%</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            <p className="text-gray-500 text-sm mb-3">No explanation generated yet.</p>
            <button onClick={generateExplanation} disabled={explLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50">
              {explLoading ? 'Generating...' : 'Generate Explanation'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
