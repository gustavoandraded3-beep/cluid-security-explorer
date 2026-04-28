import React, { useState } from 'react';

export default function AssignmentsView({ data, navigate }) {
  const [filter, setFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [divFilter, setDivFilter] = useState('');

  const assignments = data.role_assignments || [];

  const departments = [...new Set(assignments.map(a => a.department).filter(Boolean))].sort();
  const divisions = [...new Set(assignments.map(a => a.division).filter(Boolean))].sort();

  const filtered = assignments.filter(a => {
    const q = filter.toLowerCase();
    const matchText = !q ||
      a.cluid_role?.toLowerCase().includes(q) ||
      a.security_roles?.toLowerCase().includes(q) ||
      a.department?.toLowerCase().includes(q) ||
      a.profile_team?.toLowerCase().includes(q);
    const matchDept = !deptFilter || a.department === deptFilter;
    const matchDiv = !divFilter || a.division === divFilter;
    return matchText && matchDept && matchDiv;
  });

  const getRoleTags = (rolesStr) => {
    if (!rolesStr) return [];
    return rolesStr.split(',').map(r => r.trim()).filter(Boolean);
  };

  return (
    <div>
      <div className="page-title">Role Assignments</div>
      <div className="page-sub">Mapping of Clúid job roles to Dynamics 365 security roles by department</div>

      <div className="filter-row">
        <input className="filter-input" placeholder="🔍 Search roles, departments..." value={filter} onChange={e => setFilter(e.target.value)} style={{ flex: 1, maxWidth: 320 }} />
        <select className="filter-select" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
          <option value="">All Departments</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select className="filter-select" value={divFilter} onChange={e => setDivFilter(e.target.value)}>
          <option value="">All Divisions</option>
          {divisions.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <span style={{ color: 'var(--text3)', fontSize: 12 }}>{filtered.length} results</span>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Division</th>
              <th>Department</th>
              <th>Clúid Role</th>
              <th>Security Profile/Team</th>
              <th>Security Roles Assigned</th>
              <th>IPC Group</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a, i) => (
              <tr key={i}>
                <td style={{ color: 'var(--text3)', fontSize: 12 }}>{a.division || '—'}</td>
                <td style={{ fontWeight: 500, color: 'var(--text2)' }}>{a.department || '—'}</td>
                <td style={{ color: 'var(--text)', fontWeight: 600 }}>{a.cluid_role || '—'}</td>
                <td>
                  {a.profile_team && (
                    <span className="badge badge-blue">{a.profile_team}</span>
                  )}
                </td>
                <td>
                  <div className="tag-list" style={{ gap: 4 }}>
                    {getRoleTags(a.security_roles).map(r => (
                      <span key={r} className="tag clickable" style={{ fontSize: 11 }}
                        onClick={() => {
                          const match = Object.keys(data.roles || {}).find(rn => rn.toLowerCase().includes(r.toLowerCase()));
                          if (match) navigate('role-detail', match);
                        }}>
                        {r}
                      </span>
                    ))}
                  </div>
                </td>
                <td style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'monospace' }}>{a.ipc_group || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && <div className="empty-state"><p>No assignments match your filters.</p></div>}
    </div>
  );
}
