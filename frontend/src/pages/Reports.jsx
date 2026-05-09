import { useState, useEffect } from 'react';
import { api, getAccessToken } from '../api/client';

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [genLoading, setGenLoading] = useState(false);
  const [predictionId, setPredictionId] = useState('');
  const [format, setFormat] = useState('pdf');
  const [genMsg, setGenMsg] = useState('');

  function loadReports() {
    api('/dashboard/reports')
      .then((d) => setReports(d.reports || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadReports(); }, []);

  async function handleGenerate(e) {
    e.preventDefault();
    setGenMsg('');
    setGenLoading(true);
    try {
      const data = await api('/dashboard/reports/generate', {
        method: 'POST',
        body: JSON.stringify({ prediction_id: parseInt(predictionId), format }),
      });
      setGenMsg(`Report #${data.report_id} queued`);
      setPredictionId('');
      loadReports();
    } catch (err) {
      setGenMsg(err.message);
    } finally {
      setGenLoading(false);
    }
  }

  if (loading) return <div className="p-4 text-gray-500">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reports</h1>

      {/* Generate form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Generate Report</h2>
        <form onSubmit={handleGenerate} className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prediction ID</label>
            <input type="number" required value={predictionId} onChange={(e) => setPredictionId(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 w-40 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
            <select value={format} onChange={(e) => setFormat(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="pdf">PDF</option>
              <option value="csv">CSV</option>
            </select>
          </div>
          <button type="submit" disabled={genLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 font-medium">
            {genLoading ? 'Generating...' : 'Generate'}
          </button>
        </form>
        {genMsg && <p className="mt-2 text-sm text-gray-600">{genMsg}</p>}
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm">{error}</div>}

      {/* Reports list */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600 border-b">
            <tr>
              <th className="py-3 px-4">ID</th>
              <th className="py-3 px-4">Prediction</th>
              <th className="py-3 px-4">Threat Level</th>
              <th className="py-3 px-4">Format</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Generated</th>
              <th className="py-3 px-4"></th>
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 ? (
              <tr><td colSpan="7" className="py-6 text-center text-gray-500">No reports yet</td></tr>
            ) : reports.map((r) => (
              <tr key={r.report_id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="py-3 px-4 font-mono text-xs">{r.report_id}</td>
                <td className="py-3 px-4">{r.prediction_id}</td>
                <td className="py-3 px-4 capitalize">{r.threat_level}</td>
                <td className="py-3 px-4 uppercase text-xs">{r.format}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${r.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {r.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-500 text-xs">{r.generated_at ? new Date(r.generated_at).toLocaleString() : '-'}</td>
                <td className="py-3 px-4">
                  <a href={`/dashboard/reports/${r.report_id}/download`}
                    className="text-blue-600 hover:underline text-xs"
                    onClick={(e) => {
                      e.preventDefault();
                      fetch(`/dashboard/reports/${r.report_id}/download`, {
                        headers: { Authorization: `Bearer ${getAccessToken()}` },
                      }).then(res => {
                        if (!res.ok) return res.json().then(d => alert(d.error || 'Download failed'));
                        return res.blob().then(blob => {
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `report_${r.report_id}.${r.format || 'pdf'}`;
                          a.click();
                          URL.revokeObjectURL(url);
                        });
                      });
                    }}>
                    Download
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
