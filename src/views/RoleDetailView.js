import React, { useState } from 'react';

const PERM_KEYS = ['Create', 'Edit', 'Read', 'Assign', 'Delete', 'Write', 'Append', 'Append To', 'Share'];

function PermBadge({ val }) {
  if (!val) return <span style={{ color: 'var(--text3)' }}>—</span>;
  const v = val.toLowerCase();
  if (v === 'yes' || v === 'true') return <span className="perm-yes">✓</span>;
  if (v === 'no' || v === 'false') return <span style={{ color: 'var(--danger)' }}>✗</span>;
  if (v.includes('organization')) return <span className="badge badge-blue" style={{ fontSize: 10 }}>Org</span>;
  if (v.includes('business unit')) return <span className="badge badge-yellow" style={{ fontSize: 10 }}>BU</span>;
  if (v.includes('own') || v.includes('reportees')) return <span className="badge badge-green" style={{ fontSize: 10 }}>Own+</span>;
  return <span className="perm-partial" title={val}>~</span>;
}

export default function RoleDetailView({ data, roleName, navigate }) {
  const [entityFilter, setEntityFilter] = useState('');
  const [permFilter, setPermFilter] = useState('all');

  const role = data.roles?.[roleName] || data.profiles?.[roleName];
  if (!role) return <div className="empty-state"><p>Role not found.</p></div>;

  const perms = role.permissions || {};
  const eff = role.effective || {};
  const isAdmin = role.type === 'admin_profile';
  const permCols = isAdmin
    ? ['Create', 'Read', 'Write', 'Delete', 'Append', 'Append To', 'Assign', 'Share']
    : ['Create', 'Edit', 'Read', 'Assign', 'Delete'];

  let entities = Object.entries(perms);

  if (entityFilter) {
    entities = entities.filter(([e]) => e.toLowerCase().includes(entityFilter.toLowerCase()));
  }
  if (permFilter === 'create') entities = entities.filter(([, p]) => p.Create);
  if (permFilter === 'delete') entities = entities.filter(([, p]) => p.Delete);
  if (permFilter === 'readonly') entities = entities.filter(([, p]) => p.Read && !p.Create && !p.Edit && !p.Write);
  if (permFilter === 'noaccess') entities = entities.filter(([, p]) => Object.keys(p).length === 0);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div className="page-title">{roleName}</div>
            <span className={`badge ${isAdmin ? 'badge-yellow' : 'badge-blue'}`}>{isAdmin ? 'Admin Profile' : 'Security Role'}</span>
          </div>
          <div className="page-sub">{Object.keys(perms).length} entities · {eff.can_create?.length || 0} create · {eff.can_read?.length || 0} read · {eff.can_delete?.length || 0} delete</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => navigate('compare')} style={{ fontSize: 12 }}>⚖️ Compare</button>
          <button className="btn btn-ghost" onClick={() => window.open(`/api/export/csv?role=${encodeURIComponent(roleName)}`, '_blank')} style={{ fontSize: 12 }}>📥 CSV</button>
        </div>
      </div>

      {/* Effective Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Can Create', val: eff.can_create?.length, color: 'var(--success)' },
          { label: 'Can Edit', val: eff.can_edit?.length, color: 'var(--accent2)' },
          { label: 'Can Read', val: eff.can_read?.length, color: 'var(--text2)' },
          { label: 'Can Delete', val: eff.can_delete?.length, color: 'var(--danger)' },
          { label: 'Full Access', val: eff.full_access_entities?.length, color: 'var(--warning)' },
          { label: 'Read Only', val: eff.read_only_entities?.length, color: 'var(--text3)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '14px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.val || 0}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Used by */}
      {role.used_by?.length > 0 && (
        <div className="section">
          <div className="section-title">👥 Used By ({role.used_by.length} Clúid Roles)</div>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Clúid Role</th><th>Department</th><th>Profile/Team</th></tr></thead>
              <tbody>
                {role.used_by.map((u, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 500 }}>{u.cluid_role || '—'}</td>
                    <td style={{ color: 'var(--text3)' }}>{u.department || '—'}</td>
                    <td><span className="badge badge-gray">{u.profile_team || '—'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Permissions Table */}
      <div className="section">
        <div className="section-title">🔐 Permissions by Entity</div>
        <div className="filter-row">
          <input className="filter-input" placeholder="Filter entities..." value={entityFilter} onChange={e => setEntityFilter(e.target.value)} style={{ maxWidth: 260 }} />
          <select className="filter-select" value={permFilter} onChange={e => setPermFilter(e.target.value)}>
            <option value="all">All entities</option>
            <option value="create">Can Create</option>
            <option value="delete">Can Delete</option>
            <option value="readonly">Read Only</option>
            <option value="noaccess">No Access</option>
          </select>
          <span style={{ color: 'var(--text3)', fontSize: 12 }}>{entities.length} entities</span>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Entity</th>
                {permCols.map(c => <th key={c}>{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {entities.map(([entity, p]) => (
                <tr key={entity}>
                  <td style={{ color: 'var(--text)', fontWeight: 500 }}>{entity}</td>
                  {permCols.map(col => (
                    <td key={col} style={{ textAlign: 'center' }}>
                      <PermBadge val={p[col]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {entities.length === 0 && <div className="empty-state"><p>No entities match this filter.</p></div>}
      </div>
    </div>
  );
}
