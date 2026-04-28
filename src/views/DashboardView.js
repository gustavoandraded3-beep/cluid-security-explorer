import React from 'react';

export default function DashboardView({ data, navigate }) {
  const { meta, roles, teams, role_assignments, general_info } = data;

  const topRoles = Object.entries(roles || {})
    .map(([name, r]) => ({ name, entityCount: Object.keys(r.permissions || {}).length }))
    .sort((a, b) => b.entityCount - a.entityCount)
    .slice(0, 6);

  const departmentMap = {};
  (role_assignments || []).forEach(a => {
    if (a.department) {
      departmentMap[a.department] = (departmentMap[a.department] || 0) + 1;
    }
  });
  const topDepts = Object.entries(departmentMap).sort((a, b) => b[1] - a[1]).slice(0, 8);

  return (
    <div>
      <div className="page-title">Security Overview</div>
      <div className="page-sub">Clúid Housing · Dynamics 365 Security Configuration</div>

      <div className="stat-grid">
        <div className="stat-card" onClick={() => navigate('roles')} style={{ cursor: 'pointer' }}>
          <div className="stat-value">{meta?.total_roles || 0}</div>
          <div className="stat-label">Security Roles</div>
        </div>
        <div className="stat-card" onClick={() => navigate('teams')} style={{ cursor: 'pointer' }}>
          <div className="stat-value">{meta?.total_teams || 0}</div>
          <div className="stat-label">Teams</div>
        </div>
        <div className="stat-card" onClick={() => navigate('assignments')} style={{ cursor: 'pointer' }}>
          <div className="stat-value">{meta?.total_assignments || 0}</div>
          <div className="stat-label">Role Assignments</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div className="card">
          <div className="card-title">Roles by Entity Coverage</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {topRoles.map(r => (
              <div key={r.name} onClick={() => navigate('role-detail', r.name)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '6px 8px', borderRadius: 8, transition: 'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ color: 'var(--text)', fontSize: 13, fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
                <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 80, height: 6, background: 'var(--surface3)', borderRadius: 3 }}>
                    <div style={{ width: `${Math.min(100, (r.entityCount / 60) * 100)}%`, height: '100%', background: 'var(--accent)', borderRadius: 3 }} />
                  </div>
                  <span style={{ color: 'var(--text3)', fontSize: 11, width: 28, textAlign: 'right' }}>{r.entityCount}</span>
                </div>
              </div>
            ))}
          </div>
          <button className="btn btn-ghost" style={{ marginTop: 12, width: '100%', fontSize: 12 }} onClick={() => navigate('roles')}>View all roles →</button>
        </div>

        <div className="card">
          <div className="card-title">Assignments by Department</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {topDepts.map(([dept, count]) => (
              <div key={dept} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }}>
                <span style={{ flex: 1, color: 'var(--text2)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dept}</span>
                <span className="badge badge-blue">{count}</span>
              </div>
            ))}
          </div>
          <button className="btn btn-ghost" style={{ marginTop: 12, width: '100%', fontSize: 12 }} onClick={() => navigate('assignments')}>View assignments →</button>
        </div>
      </div>

      {general_info && general_info.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-title">Security Profiles (HMS Teams)</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
            {general_info.slice(0, 6).map((g, i) => (
              <div key={i} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ color: 'var(--accent2)', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>{g.team}</div>
                <div style={{ color: 'var(--text3)', fontSize: 11, lineHeight: 1.5 }}>{g.description?.substring(0, 200)}{g.description?.length > 200 ? '...' : ''}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-title">Quick Actions</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => navigate('compare')}>⚖️ Compare Roles</button>
          <button className="btn btn-ghost" onClick={() => navigate('field-security')}>🔒 Field Security</button>
          <button className="btn btn-ghost" onClick={() => window.open('/api/export/csv', '_blank')}>📥 Export All to CSV</button>
          <button className="btn btn-ghost" onClick={() => navigate('teams')}>👥 View Teams</button>
        </div>
      </div>
    </div>
  );
}
