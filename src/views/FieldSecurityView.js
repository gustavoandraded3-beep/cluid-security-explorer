import React, { useState } from 'react';

export default function FieldSecurityView({ data }) {
  const [entityFilter, setEntityFilter] = useState('');
  const fieldSecurity = data.field_security || [];

  const filtered = fieldSecurity.filter(f =>
    !entityFilter ||
    f.entity?.toLowerCase().includes(entityFilter.toLowerCase()) ||
    f.field?.toLowerCase().includes(entityFilter.toLowerCase())
  );

  const roles = fieldSecurity.length > 0
    ? Object.keys(fieldSecurity[0]).filter(k => !['entity', 'entity_specific', 'field'].includes(k))
    : [];

  return (
    <div>
      <div className="page-title">Field Security</div>
      <div className="page-sub">Field-level access control by entity and security profile</div>

      {fieldSecurity.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">🔒</div><p>No field security data found.</p></div>
      ) : (
        <>
          <div className="filter-row">
            <input className="filter-input" placeholder="🔍 Filter entity or field..." value={entityFilter} onChange={e => setEntityFilter(e.target.value)} style={{ maxWidth: 300 }} />
            <span style={{ color: 'var(--text3)', fontSize: 12 }}>{filtered.length} fields</span>
          </div>

          <div className="card" style={{ marginBottom: 16, padding: '12px 16px' }}>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>Legend</div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <span className="badge badge-green">Yes = Editable</span>
              <span className="badge badge-red">No = Not editable</span>
              <span className="badge badge-gray">— = Not applicable</span>
            </div>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Entity</th>
                  <th>Sub-Entity</th>
                  <th>Field</th>
                  {roles.map(r => <th key={r} style={{ fontSize: 10, maxWidth: 80 }}>{r}</th>)}
                </tr>
              </thead>
              <tbody>
                {filtered.map((f, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600, color: 'var(--text)' }}>{f.entity}</td>
                    <td style={{ color: 'var(--text3)', fontSize: 12 }}>{f.entity_specific || '—'}</td>
                    <td style={{ color: 'var(--text2)' }}>{f.field}</td>
                    {roles.map(r => {
                      const v = f[r];
                      return (
                        <td key={r} style={{ textAlign: 'center' }}>
                          {v === 'Yes' ? <span className="perm-yes">✓</span>
                            : v === 'No' ? <span style={{ color: 'var(--danger)' }}>✗</span>
                            : <span style={{ color: 'var(--text3)' }}>—</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
