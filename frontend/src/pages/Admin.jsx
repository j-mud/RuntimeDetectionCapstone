import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Admin() {
  const { user } = useAuth();
  const [tab, setTab] = useState('users');

  const tabs = [
    { id: 'users', label: 'Users' },
    { id: 'apikeys', label: 'API Keys' },
    { id: 'models', label: 'Models' },
    { id: 'audit', label: 'Audit Log' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded font-medium text-sm ${tab === t.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'users' && <UsersTab />}
      {tab === 'apikeys' && <ApiKeysTab />}
      {tab === 'models' && <ModelsTab />}
      {tab === 'audit' && <AuditTab />}
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/admin/users')
      .then((d) => setUsers(d.users || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-500">Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 text-gray-600 border-b">
          <tr>
            <th className="py-3 px-4">ID</th>
            <th className="py-3 px-4">Name</th>
            <th className="py-3 px-4">Email</th>
            <th className="py-3 px-4">Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.user_id} className="border-b last:border-0 hover:bg-gray-50">
              <td className="py-3 px-4">{u.user_id}</td>
              <td className="py-3 px-4 font-medium text-gray-900">{u.name}</td>
              <td className="py-3 px-4">{u.email}</td>
              <td className="py-3 px-4">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-700'}`}>
                  {u.role}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ApiKeysTab() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newKey, setNewKey] = useState('');

  function loadKeys() {
    api('/admin/api-keys')
      .then((d) => setKeys(d.keys || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadKeys(); }, []);

  async function createKey(e) {
    e.preventDefault();
    try {
      const data = await api('/admin/api-keys', {
        method: 'POST',
        body: JSON.stringify({ label: newLabel || 'default' }),
      });
      setNewKey(data.api_key);
      setNewLabel('');
      loadKeys();
    } catch (err) {
      setError(err.message);
    }
  }

  async function revokeKey(keyId) {
    try {
      await api(`/admin/api-keys/${keyId}`, { method: 'DELETE' });
      loadKeys();
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <div className="text-gray-500">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Create API Key</h2>
        <form onSubmit={createKey} className="flex gap-3 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
            <input type="text" value={newLabel} onChange={(e) => setNewLabel(e.target.value)}
              placeholder="my-key" className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-medium">Create</button>
        </form>
        {newKey && (
          <div className="mt-3 bg-green-50 border border-green-200 rounded p-3 text-sm">
            <span className="font-medium text-green-800">New key (copy now): </span>
            <code className="text-green-900 break-all">{newKey}</code>
          </div>
        )}
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm">{error}</div>}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600 border-b">
            <tr>
              <th className="py-3 px-4">ID</th>
              <th className="py-3 px-4">Label</th>
              <th className="py-3 px-4">Uses</th>
              <th className="py-3 px-4">Created</th>
              <th className="py-3 px-4">Last Used</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4"></th>
            </tr>
          </thead>
          <tbody>
            {keys.length === 0 ? (
              <tr><td colSpan="7" className="py-6 text-center text-gray-500">No API keys</td></tr>
            ) : keys.map((k) => (
              <tr key={k.key_id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="py-3 px-4">{k.key_id}</td>
                <td className="py-3 px-4 font-medium">{k.label}</td>
                <td className="py-3 px-4">{k.usage_count}</td>
                <td className="py-3 px-4 text-xs text-gray-500">{k.created_at ? new Date(k.created_at).toLocaleDateString() : '-'}</td>
                <td className="py-3 px-4 text-xs text-gray-500">{k.last_used_at ? new Date(k.last_used_at).toLocaleString() : 'Never'}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${k.revoked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-800'}`}>
                    {k.revoked ? 'Revoked' : 'Active'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {!k.revoked && (
                    <button onClick={() => revokeKey(k.key_id)} className="text-red-600 hover:underline text-xs">Revoke</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ModelsTab() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/admin/models')
      .then((d) => setModels(d.models || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-500">Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 text-gray-600 border-b">
          <tr>
            <th className="py-3 px-4">Model ID</th>
            <th className="py-3 px-4">Name</th>
            <th className="py-3 px-4">Framework</th>
            <th className="py-3 px-4">Version</th>
            <th className="py-3 px-4">Status</th>
            <th className="py-3 px-4">Accuracy</th>
          </tr>
        </thead>
        <tbody>
          {models.length === 0 ? (
            <tr><td colSpan="6" className="py-6 text-center text-gray-500">No models uploaded</td></tr>
          ) : models.map((m, i) => (
            <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
              <td className="py-3 px-4">{m.model_id}</td>
              <td className="py-3 px-4 font-medium text-gray-900">{m.name}</td>
              <td className="py-3 px-4">{m.framework || '-'}</td>
              <td className="py-3 px-4">{m.version || '-'}</td>
              <td className="py-3 px-4">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${m.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {m.status || 'N/A'}
                </span>
              </td>
              <td className="py-3 px-4">{m.accuracy != null ? `${(m.accuracy * 100).toFixed(1)}%` : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AuditTab() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/admin/audit-log')
      .then((d) => setEntries(d.entries || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-500">Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 text-gray-600 border-b">
          <tr>
            <th className="py-3 px-4">ID</th>
            <th className="py-3 px-4">Action</th>
            <th className="py-3 px-4">Target</th>
            <th className="py-3 px-4">Admin</th>
            <th className="py-3 px-4">Date</th>
          </tr>
        </thead>
        <tbody>
          {entries.length === 0 ? (
            <tr><td colSpan="5" className="py-6 text-center text-gray-500">No audit entries</td></tr>
          ) : entries.map((a) => (
            <tr key={a.action_id} className="border-b last:border-0 hover:bg-gray-50">
              <td className="py-3 px-4">{a.action_id}</td>
              <td className="py-3 px-4 font-mono text-xs">{a.action}</td>
              <td className="py-3 px-4 text-xs">{a.target}</td>
              <td className="py-3 px-4">{a.admin_id}</td>
              <td className="py-3 px-4 text-xs text-gray-500">{a.created_at ? new Date(a.created_at).toLocaleString() : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
