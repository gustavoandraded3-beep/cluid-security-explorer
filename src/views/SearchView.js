import React, { useEffect, useState } from 'react';

export default function SearchView({ query, data, navigate }) {
  const [results, setResults] = useState(null);

  useEffect(() => {
    if (!query) { setResults(null); return; }
    const q = query.toLowerCase();
    const roles = Object.keys(data.roles || {}).filter(r => r.toLowerCase().includes(q));
    const profiles = [];
    const teams = (data.teams || []).filter(t => t.name.toLowerCase().includes(q));
    const assignments = (data.role_assignments || []).filter(a =>
      a.cluid_role?.toLowerCase().includes(q) ||
      a.department?.toLowerCase().includes(q) ||
      a.security_roles?.toLowerCase().includes(q) ||
      a.profile_team?.toLowerCase().includes(q)
    ).slice(0, 15);
    setResults({ roles, teams, assignments });
  }, [query, data]);

  if (!query) return <div className="empty-state"><p>Type something in the search bar above.</p></div>;
  if (!results) return <div className="empty-state"><p>Searching...</p></div>;

  const total = results.roles.length + results.profiles.length + results.teams.length + results.assignments.length;

  return (
    <div>
      <div className="page-title">Search Results</div>
      <div className="page-sub">{total} results for "<strong>{query}</strong>"</div>

      {total === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <p>No results found for "{query}"</p>
        </div>
      )}

      {results.roles.length > 0 && (
        <div className="section">
          <div className="section-title">🔐 Security Roles ({results.roles.length})</div>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Role Name</th><th>Entities</th><th>Used By</th></tr></thead>
              <tbody>
                {results.roles.map(name => {
                  const r = data.roles[name];
                  return (
                    <tr key={name} className="clickable" onClick={() => navigate('role-detail', name)}>
                      <td style={{ color: 'var(--accent2)', fontWeight: 600 }}>{name}</td>
                      <td><span className="badge badge-gray">{Object.keys(r.permissions || {}).length}</span></td>
                      <td><span className="badge badge-blue">{r.used_by?.length || 0} assignments</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {results.profiles.length > 0 && (
        <div className="section">
          <div className="section-title">🛡️ Admin Profiles ({results.profiles.length})</div>
          <div className="tag-list">
            {results.profiles.map(p => (
              <span key={p} className="tag clickable" onClick={() => navigate('role-detail', p)}>{p}</span>
            ))}
          </div>
        </div>
      )}

      {results.teams.length > 0 && (
        <div className="section">
          <div className="section-title">👥 Teams ({results.teams.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {results.teams.map((t, i) => (
              <div key={i} className="card" style={{ padding: '12px 16px' }}>
                <div style={{ fontWeight: 600, color: 'var(--text)' }}>{t.name}</div>
                {t.members && <div style={{ color: 'var(--text3)', fontSize: 12, marginTop: 4 }}>{t.members}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {results.assignments.length > 0 && (
        <div className="section">
          <div className="section-title">📋 Role Assignments ({results.assignments.length})</div>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Clúid Role</th><th>Department</th><th>Team/Profile</th><th>Security Roles</th></tr></thead>
              <tbody>
                {results.assignments.map((a, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{a.cluid_role}</td>
                    <td style={{ color: 'var(--text3)' }}>{a.department}</td>
                    <td><span className="badge badge-blue">{a.profile_team}</span></td>
                    <td style={{ fontSize: 11, color: 'var(--text2)' }}>{a.security_roles}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
