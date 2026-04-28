import React, { useState } from 'react';

export default function TeamsView({ data }) {
  const [filter, setFilter] = useState('');
  const teams = (data.teams || []).filter(t =>
    !filter || t.name.toLowerCase().includes(filter.toLowerCase())
  );

  const totalMembers = (data.teams || []).reduce((sum, t) => sum + (t.members || 0), 0);
  const withMembers = (data.teams || []).filter(t => t.members !== null && t.members !== undefined).length;

  return (
    <div>
      <div className="page-title">Teams</div>
      <div className="page-sub">{data.teams?.length || 0} Dataverse teams · {totalMembers} total members across {withMembers} teams with known counts</div>

      <div className="filter-row">
        <input className="filter-input" placeholder="🔍 Filter teams..."
          value={filter} onChange={e => setFilter(e.target.value)} style={{ maxWidth: 320 }} />
        <span style={{ color: 'var(--text3)', fontSize: 12 }}>{teams.length} shown</span>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 40 }}>#</th>
              <th>Team Name</th>
              <th style={{ textAlign: 'center' }}>Members</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team, i) => (
              <tr key={team.name}>
                <td style={{ color: 'var(--text3)', fontSize: 12 }}>{i + 1}</td>
                <td style={{ fontWeight: 600, color: 'var(--text)' }}>{team.name}</td>
                <td style={{ textAlign: 'center' }}>
                  {team.members !== null && team.members !== undefined
                    ? <span className={`badge ${team.members === 0 ? 'badge-gray' : team.members > 100 ? 'badge-blue' : 'badge-green'}`}>
                        {team.members}
                      </span>
                    : <span style={{ color: 'var(--text3)' }}>—</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {teams.length === 0 && (
        <div className="empty-state"><div className="empty-icon">👥</div><p>No teams match your filter.</p></div>
      )}
    </div>
  );
}
