import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

export default function Detections() {
  const [detections, setDetections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/detections?limit=100')
      .then((d) => setDetections(d.detections || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-4 text-gray-500">Loading...</div>;
  if (error) return <div className="text-red-600 p-4">{error}</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Scan History</h1>
      {detections.length === 0 ? (
        <p className="text-gray-500">No scans yet. Go to the <Link to="/scan" className="text-blue-600 hover:underline">Scanner</Link> to analyze URLs.</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 border-b">
              <tr>
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">URL</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {detections.map((d) => (
                <tr key={d.scan_id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-xs">{d.scan_id}</td>
                  <td className="py-3 px-4 font-mono text-xs max-w-xs truncate">{d.url}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${d.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{d.source}</td>
                  <td className="py-3 px-4 text-gray-500 text-xs">{d.created_at ? new Date(d.created_at).toLocaleString() : '-'}</td>
                  <td className="py-3 px-4">
                    <Link to={`/detections/${d.scan_id}`} className="text-blue-600 hover:underline text-xs">Details</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
