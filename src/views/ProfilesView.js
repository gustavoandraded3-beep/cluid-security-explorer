import React from 'react';

export default function ProfilesView({ data, navigate }) {
  const profiles = data.profiles || {};

  if (Object.keys(profiles).length === 0) {
    return (
      <div>
        <div className="page-title">Admin Profiles</div>
        <div className="empty-state"><div className="empty-icon">🛡️</div><p>No admin profiles found in this file.</p></div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-title">Admin Profiles</div>
      <div className="page-sub">Dynamics 365 security profiles with direct access level assignments</div>

      <div style={{ display: 'grid', gap: 20 }}>
        {Object.entries(profiles).map(([name, profile]) => {
          const perms = profile.permissions || {};
          const eff = profile.effective || {};
          const levelCounts = {};
          Object.values(perms).forEach(p => {
            Object.values(p).forEach(v => {
              if (v) levelCounts[v] = (levelCounts[v] || 0) + 1;
            });
          });
          const levels = Object.entries(levelCounts).sort((a, b) => b[1] - a[1]);

          return (
            <div key={name} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>{Object.keys(perms).length} entities · Admin Profile (Dynamics 365)</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => navigate('role-detail', name)}>View Details →</button>
                  <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => window.open(`/api/export/csv?role=${encodeURIComponent(name)}`, '_blank')}>📥 CSV</button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 24, marginBottom: 16, flexWrap: 'wrap' }}>
                {[
                  { label: 'Entities', val: Object.keys(perms).length, color: 'var(--text)' },
                  { label: 'Create Access', val: eff.can_create?.length || 0, color: 'var(--success)' },
                  { label: 'Read Access', val: eff.can_read?.length || 0, color: 'var(--accent2)' },
                  { label: 'Write Access', val: eff.can_edit?.length || 0, color: 'var(--warning)' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.val}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {levels.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6, textTransform: 'uppercase', fontWeight: 600 }}>Access Levels Used</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {levels.slice(0, 6).map(([level, count]) => (
                      <span key={level} className="badge badge-blue">{level} ({count})</span>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6, textTransform: 'uppercase', fontWeight: 600 }}>Entities (preview)</div>
                <div className="tag-list">
                  {Object.keys(perms).slice(0, 10).map(e => <span key={e} className="tag">{e}</span>)}
                  {Object.keys(perms).length > 10 && <span className="badge badge-gray">+{Object.keys(perms).length - 10} more</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
