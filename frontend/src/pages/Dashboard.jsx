import { useState, useEffect } from 'react';
import { api } from '../api/client';

const RISK_COLORS = {
  safe: 'bg-green-100 text-green-800',
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [threats, setThreats] = useState(null);
  const [models, setModels] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api('/dashboard/metrics'),
      api('/dashboard/threats'),
      api('/dashboard/models'),
    ])
      .then(([m, t, mdl]) => {
        setMetrics(m);
        setThreats(t);
        setModels(mdl.models || []);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="text-red-600 p-4">{error}</div>;
  if (!metrics) return <div className="p-4 text-gray-500">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Metrics cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard title="Total Scans" value={metrics.total_scans} color="blue" />
        <MetricCard title="Completed" value={metrics.completed_scans} color="green" />
        <MetricCard title="Pending" value={metrics.pending_scans} color="yellow" />
      </div>

      {/* Threat breakdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Threat Breakdown</h2>
        {threats && threats.breakdown && Object.keys(threats.breakdown).length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(threats.breakdown).map(([label, count]) => (
              <div key={label} className={`rounded-lg p-3 text-center ${RISK_COLORS[label] || 'bg-gray-100 text-gray-800'}`}>
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-sm capitalize">{label}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No threat data yet. Run some scans to see results here.</p>
        )}
      </div>

      {/* Models */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Models</h2>
        {models.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-gray-600 border-b">
                <tr>
                  <th className="py-2 px-3">Name</th>
                  <th className="py-2 px-3">Version</th>
                  <th className="py-2 px-3">Accuracy</th>
                  <th className="py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {models.map((m, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2 px-3 font-medium text-gray-900">{m.name}</td>
                    <td className="py-2 px-3">{m.version || '-'}</td>
                    <td className="py-2 px-3">{m.accuracy != null ? `${(m.accuracy * 100).toFixed(1)}%` : '-'}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${m.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                        {m.status || 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No models registered yet.</p>
        )}
      </div>
    </div>
  );
}

function MetricCard({ title, value, color }) {
  const colors = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  };
  return (
    <div className={`rounded-lg border p-5 ${colors[color]}`}>
      <div className="text-sm font-medium">{title}</div>
      <div className="text-3xl font-bold mt-1">{value}</div>
    </div>
  );
}
