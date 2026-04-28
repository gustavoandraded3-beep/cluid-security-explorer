import React, { useState } from 'react';

export default function RolesView({ data, navigate }) {
  const [filter, setFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const roles = data.roles || {};

  const sorted = Object.entries(roles)
    .filter(([name]) => name.toLowerCase().includes(filter.toLowerCase()))
    .filter(([, r]) => typeFilter === 'all' || r.perm_type === typeFilter)
    .sort(([a], [b]) => a.localeCompare(b));

  return (
    <div>
      <div className="page-title">Security Roles</div>
      <div className="page-sub">{Object.keys(roles).length} roles — alphabetical order</div>

      <div className="filter-row">
        <input className="filter-input" placeholder="🔍 Filter roles..." value={filter}
          onChange={e => setFilter(e.target.value)} style={{ flex: 1, maxWidth: 320 }} />
        <select className="filter-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="all">All types</option>
          <option value="standard">Standard roles</option>
          <option value="admin">Admin profiles</option>
        </select>
        <button className="btn btn-ghost" onClick={() => window.open('/api/export/csv', '_blank')}>
          📥 Export All CSV
        </button>
        <span style={{ color: 'var(--text3)', fontSize: 12 }}>{sorted.length} roles</span>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Role Name</th>
              <th>Type</th>
              <th>Entities</th>
              <th>Create</th>
              <th>Edit / Write</th>
              <th>Delete</th>
              <th>Used By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(([name, role]) => {
              const eff = role.effective || {};
              const isEmpty = Object.keys(role.permissions || {}).length === 0;
              return (
                <tr key={name} className="clickable" onClick={() => navigate('role-detail', name)}>
                  <td style={{ fontWeight: 600, color: 'var(--text)' }}>{name}</td>
                  <td>
                    <span className={`badge ${role.perm_type === 'admin' ? 'badge-yellow' : 'badge-blue'}`}>
                      {role.perm_type === 'admin' ? 'Admin' : 'Standard'}
                    </span>
                  </td>
                  <td>
                    {isEmpty
                      ? <span className="badge badge-gray">No data</span>
                      : <span className="badge badge-gray">{Object.keys(role.permissions).length}</span>}
                  </td>
                  <td>
                    {eff.can_create?.length > 0
                      ? <span className="perm-yes">✓ {eff.can_create.length}</span>
                      : <span className="perm-no">—</span>}
                  </td>
                  <td>
                    {eff.can_edit?.length > 0
                      ? <span className="perm-yes">✓ {eff.can_edit.length}</span>
                      : <span className="perm-no">—</span>}
                  </td>
                  <td>
                    {eff.can_delete?.length > 0
                      ? <span style={{ color: 'var(--danger)', fontWeight: 600 }}>⚠ {eff.can_delete.length}</span>
                      : <span className="perm-no">—</span>}
                  </td>
                  <td>
                    {role.used_by?.length > 0
                      ? <span className="badge badge-blue">{role.used_by.length}</span>
                      : <span className="perm-no">—</span>}
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    <button className="btn btn-ghost" style={{ padding: '3px 10px', fontSize: 11 }}
                      onClick={() => window.open(`/api/export/csv?role=${encodeURIComponent(name)}`, '_blank')}>
                      CSV
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {sorted.length === 0 && <div className="empty-state"><p>No roles match your filter.</p></div>}
    </div>
  );
}
