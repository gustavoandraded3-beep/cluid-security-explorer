import React, { useState, useCallback } from 'react';

const ROLE_COLORS = [
  { bg: 'rgba(42,91,232,0.06)',  header: '#2a5be8', light: 'rgba(42,91,232,0.12)',  name: 'Blue'   },
  { bg: 'rgba(22,163,74,0.06)',  header: '#16a34a', light: 'rgba(22,163,74,0.12)',  name: 'Green'  },
  { bg: 'rgba(217,119,6,0.06)',  header: '#d97706', light: 'rgba(217,119,6,0.12)',  name: 'Amber'  },
  { bg: 'rgba(147,51,234,0.06)', header: '#9333ea', light: 'rgba(147,51,234,0.12)', name: 'Purple' },
  { bg: 'rgba(220,38,38,0.06)',  header: '#dc2626', light: 'rgba(220,38,38,0.12)',  name: 'Red'    },
];

const PERM_COLS = ['Create', 'Edit', 'Read', 'Assign', 'Delete', 'Write', 'Share'];

function PermCell({ val, highlight }) {
  if (!val) return <span style={{ color: 'var(--text3)' }}>—</span>;
  const v = val.toLowerCase();
  const style = highlight ? { fontWeight: 700 } : {};
  if (v === 'yes') return <span style={{ color: 'var(--success)', fontWeight: 700, ...style }}>✓</span>;
  if (v === 'no') return <span style={{ color: 'var(--danger)', ...style }}>✗</span>;
  if (v.includes('organization')) return <span className="badge badge-blue" style={{ fontSize: 10 }}>Org</span>;
  if (v.includes('business unit')) return <span className="badge badge-yellow" style={{ fontSize: 10 }}>BU</span>;
  if (v.includes('own') || v.includes('reportees')) return <span className="badge badge-green" style={{ fontSize: 10 }}>Own+</span>;
  return <span style={{ color: 'var(--warning)', fontSize: 11, ...style }} title={val}>✓*</span>;
}

function buildComparison(selectedRoles, allRoles, allProfiles) {
  const roleData = selectedRoles.map(name => {
    const r = allRoles[name] || allProfiles[name];
    return { name, permissions: r?.permissions || {} };
  });

  const allEntities = [...new Set(roleData.flatMap(r => Object.keys(r.permissions)))].sort();

  return allEntities.map(entity => {
    const perms = roleData.map(r => r.permissions[entity] || {});
    // Check if any column differs across roles
    const hasDiff = PERM_COLS.some(col => {
      const vals = perms.map(p => (p[col] || '').toLowerCase());
      return new Set(vals).size > 1;
    });
    return { entity, perms, differs: hasDiff };
  });
}

export default function CompareView({ data }) {
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [showDiffOnly, setShowDiffOnly] = useState(false);
  const [entityFilter, setEntityFilter] = useState('');

  const allRoleNames = Object.keys(data.roles || {}).sort();

  const addRole = (name) => {
    if (!name || selectedRoles.includes(name) || selectedRoles.length >= 5) return;
    setSelectedRoles(prev => [...prev, name]);
    setComparison(null);
  };

  const removeRole = (name) => {
    setSelectedRoles(prev => prev.filter(r => r !== name));
    setComparison(null);
  };

  const runComparison = useCallback(() => {
    if (selectedRoles.length < 2) return;
    const result = buildComparison(selectedRoles, data.roles || {});
    setComparison(result);
  }, [selectedRoles, data]);

  const exportCSV = () => {
    if (!comparison) return;
    const header = ['Entity', ...selectedRoles.flatMap(r => PERM_COLS.map(c => `${r} - ${c}`)), 'Differs'];
    const rows = comparison.map(row => [
      row.entity,
      ...row.perms.flatMap(p => PERM_COLS.map(c => p[c] || '')),
      row.differs ? 'YES' : ''
    ]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compare_${selectedRoles.join('_vs_').replace(/\s+/g, '_')}.csv`;
    a.click();
  };

  const diffCount = comparison?.filter(r => r.differs).length || 0;
  const rows = (comparison || []).filter(row => {
    if (showDiffOnly && !row.differs) return false;
    if (entityFilter && !row.entity.toLowerCase().includes(entityFilter.toLowerCase())) return false;
    return true;
  });

  const availableToAdd = allRoleNames.filter(r => !selectedRoles.includes(r));

  return (
    <div>
      <div className="page-title">Compare Roles</div>
      <div className="page-sub">Add up to 5 roles to compare their permissions side by side</div>

      {/* Role Selector Panel */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title">Selected Roles</div>

        {/* Selected role pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16, minHeight: 40 }}>
          {selectedRoles.length === 0 && (
            <span style={{ color: 'var(--text3)', fontSize: 13, alignSelf: 'center' }}>No roles selected yet — add one below</span>
          )}
          {selectedRoles.map((name, i) => {
            const color = ROLE_COLORS[i % ROLE_COLORS.length];
            return (
              <div key={name} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: color.light, border: `1.5px solid ${color.header}`,
                borderRadius: 20, padding: '5px 6px 5px 12px',
                fontSize: 13, fontWeight: 600, color: color.header,
              }}>
                <span style={{
                  display: 'inline-block', width: 10, height: 10,
                  borderRadius: '50%', background: color.header, flexShrink: 0
                }} />
                {name}
                <button onClick={() => removeRole(name)} style={{
                  background: 'none', border: 'none', color: color.header,
                  fontSize: 14, lineHeight: 1, padding: '0 2px', opacity: 0.7,
                  borderRadius: '50%',
                }}>✕</button>
              </div>
            );
          })}
        </div>

        {/* Add role dropdown */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            className="filter-select"
            style={{ flex: 1, maxWidth: 360 }}
            value=""
            onChange={e => addRole(e.target.value)}
            disabled={selectedRoles.length >= 5}
          >
            <option value="">{selectedRoles.length >= 5 ? 'Max 5 roles reached' : '+ Add a role...'}</option>
            {availableToAdd.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <button
            className="btn btn-primary"
            onClick={runComparison}
            disabled={selectedRoles.length < 2}
          >
            Compare {selectedRoles.length > 0 ? `(${selectedRoles.length})` : ''} →
          </button>
          {selectedRoles.length > 0 && (
            <button className="btn btn-ghost" onClick={() => { setSelectedRoles([]); setComparison(null); }}>
              Clear all
            </button>
          )}
        </div>
        {selectedRoles.length === 1 && (
          <p style={{ color: 'var(--warning)', fontSize: 12, marginTop: 10 }}>⚠ Add at least one more role to compare</p>
        )}
      </div>

      {/* Comparison Table */}
      {comparison && (
        <div>
          {/* Summary bar */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '14px 20px', marginBottom: 16,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            flexWrap: 'wrap', gap: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--text2)' }}>
                <strong style={{ color: diffCount > 0 ? 'var(--warning)' : 'var(--success)', fontSize: 15 }}>{diffCount}</strong>
                {' '}differences across {comparison.length} entities
              </span>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: 'var(--text2)' }}>
                <input type="checkbox" checked={showDiffOnly} onChange={e => setShowDiffOnly(e.target.checked)} />
                Show differences only
              </label>
              <input
                className="filter-input"
                placeholder="Filter entity..."
                value={entityFilter}
                onChange={e => setEntityFilter(e.target.value)}
                style={{ maxWidth: 200, padding: '5px 10px', fontSize: 12 }}
              />
            </div>
            <button className="btn btn-ghost" onClick={exportCSV} style={{ fontSize: 12 }}>📥 Export CSV</button>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
            {selectedRoles.map((name, i) => {
              const color = ROLE_COLORS[i % ROLE_COLORS.length];
              return (
                <div key={name} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '4px 12px', borderRadius: 20,
                  background: color.light, border: `1px solid ${color.header}`,
                  fontSize: 12, fontWeight: 600, color: color.header
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: color.header, display: 'inline-block' }} />
                  Role {String.fromCharCode(65 + i)}: {name}
                </div>
              );
            })}
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <div className="table-wrap">
              <table className="data-table" style={{ minWidth: 500 + selectedRoles.length * 280 }}>
                <thead>
                  {/* Role header row */}
                  <tr>
                    <th rowSpan={2} style={{ verticalAlign: 'middle', minWidth: 180, position: 'sticky', left: 0, zIndex: 2, background: 'var(--surface2)' }}>Entity</th>
                    {selectedRoles.map((name, i) => {
                      const color = ROLE_COLORS[i % ROLE_COLORS.length];
                      return (
                        <th
                          key={name}
                          colSpan={PERM_COLS.length}
                          style={{
                            textAlign: 'center',
                            background: color.light,
                            color: color.header,
                            borderLeft: `3px solid ${color.header}`,
                            fontSize: 12,
                            letterSpacing: 0,
                            textTransform: 'none',
                          }}
                        >
                          {String.fromCharCode(65 + i)}. {name}
                        </th>
                      );
                    })}
                    <th rowSpan={2} style={{ verticalAlign: 'middle', textAlign: 'center' }}>Match</th>
                  </tr>
                  {/* Permission cols sub-header */}
                  <tr>
                    {selectedRoles.map((name, i) => {
                      const color = ROLE_COLORS[i % ROLE_COLORS.length];
                      return PERM_COLS.map(col => (
                        <th
                          key={`${name}-${col}`}
                          style={{
                            background: color.bg,
                            color: 'var(--text3)',
                            borderLeft: col === 'Create' ? `3px solid ${color.header}` : undefined,
                            textAlign: 'center',
                            fontSize: 10,
                            padding: '6px 8px',
                          }}
                        >
                          {col}
                        </th>
                      ));
                    })}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => (
                    <tr key={row.entity} className={row.differs ? 'diff-change' : ''}>
                      <td style={{
                        fontWeight: 600, color: 'var(--text)',
                        position: 'sticky', left: 0, background: row.differs ? 'rgba(217,119,6,0.06)' : 'var(--surface)',
                        zIndex: 1,
                        borderRight: '1px solid var(--border)',
                      }}>
                        {row.entity}
                      </td>
                      {row.perms.map((p, i) => {
                        const color = ROLE_COLORS[i % ROLE_COLORS.length];
                        return PERM_COLS.map(col => (
                          <td
                            key={`${i}-${col}`}
                            style={{
                              textAlign: 'center',
                              background: col === 'Create' ? color.bg : undefined,
                              borderLeft: col === 'Create' ? `3px solid ${color.header}` : undefined,
                              padding: '8px 6px',
                            }}
                          >
                            <PermCell val={p[col]} />
                          </td>
                        ));
                      })}
                      <td style={{ textAlign: 'center' }}>
                        {row.differs
                          ? <span className="badge badge-yellow">≠</span>
                          : <span className="badge badge-green">✓</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {rows.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">{showDiffOnly ? '🎉' : '🔍'}</div>
              <p>{showDiffOnly ? 'No differences found — roles are identical!' : 'No entities match your filter.'}</p>
            </div>
          )}
        </div>
      )}

      {!comparison && selectedRoles.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">⚖️</div>
          <p>Select at least 2 roles above to start comparing</p>
        </div>
      )}
    </div>
  );
}
