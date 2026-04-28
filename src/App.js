import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import UploadView from './views/UploadView';
import DashboardView from './views/DashboardView';
import RolesView from './views/RolesView';
import RoleDetailView from './views/RoleDetailView';
import TeamsView from './views/TeamsView';
import CompareView from './views/CompareView';
import AssignmentsView from './views/AssignmentsView';
import SearchView from './views/SearchView';
import FieldSecurityView from './views/FieldSecurityView';

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState('upload');
  const [selectedRole, setSelectedRole] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch('/api/data');
      if (res.ok) { setData(await res.json()); setPage('dashboard'); }
    } catch {}
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleUpload = async (file) => {
    setLoading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if ((await res.json()).success) await loadData();
    } finally { setLoading(false); }
  };

  const navigate = (p, payload) => {
    if (p === 'role-detail') setSelectedRole(payload);
    setPage(p);
    if (searchQuery && p !== 'search') setSearchQuery('');
  };

  const handleSearch = (q) => {
    setSearchQuery(q);
    if (q) setPage('search');
  };

  const navItems = [
    { id: 'dashboard',    label: 'Dashboard',        icon: '⬡' },
    { id: 'roles',        label: 'Security Roles',   icon: '🔐' },
    { id: 'teams',        label: 'Teams',             icon: '👥' },
    { id: 'assignments',  label: 'Role Assignments',  icon: '📋' },
    { id: 'compare',      label: 'Compare Roles',     icon: '⚖️' },
    { id: 'field-security', label: 'Field Security', icon: '🔒' },
  ];

  const isActive = (id) => page === id || (page === 'role-detail' && id === 'roles');

  return (
    <div className="app">
      {data && (
        <aside className={`sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
          <div className="sidebar-header">
            <div className="logo">
              <span className="logo-icon">🏠</span>
              {sidebarOpen && <span className="logo-text">Clúid<br/><small>Security Explorer</small></span>}
            </div>
            <button className="collapse-btn" onClick={() => setSidebarOpen(o => !o)}>
              {sidebarOpen ? '◀' : '▶'}
            </button>
          </div>
          <nav className="sidebar-nav">
            {navItems.map(item => (
              <button key={item.id} className={`nav-item ${isActive(item.id) ? 'active' : ''}`}
                onClick={() => navigate(item.id)} title={!sidebarOpen ? item.label : ''}>
                <span className="nav-icon">{item.icon}</span>
                {sidebarOpen && <span className="nav-label">{item.label}</span>}
              </button>
            ))}
          </nav>
          {sidebarOpen && (
            <div className="sidebar-footer">
              <button className="upload-btn-small" onClick={() => setPage('upload')}>📂 Load New File</button>
              <div className="meta-info">{data.meta?.total_roles} roles · {data.meta?.total_teams} teams</div>
            </div>
          )}
        </aside>
      )}

      <div className={`main ${data ? (sidebarOpen ? 'with-sidebar' : 'with-sidebar-collapsed') : 'full'}`}>
        {data && (
          <header className="topbar">
            <div className="breadcrumb">
              {page === 'role-detail' ? (
                <><button onClick={() => navigate('roles')} className="crumb-link">Roles</button>
                  <span className="crumb-sep">›</span><span>{selectedRole}</span></>
              ) : <span>{navItems.find(n => n.id === page)?.label || page}</span>}
            </div>
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input className="search-input" placeholder="Search roles, teams, assignments..."
                value={searchQuery} onChange={e => handleSearch(e.target.value)} />
              {searchQuery && <button className="clear-search"
                onClick={() => { setSearchQuery(''); navigate('dashboard'); }}>✕</button>}
            </div>
          </header>
        )}
        <div className="content">
          {page === 'upload'        && <UploadView onUpload={handleUpload} loading={loading} hasData={!!data} onContinue={() => setPage('dashboard')} />}
          {page === 'dashboard'     && data && <DashboardView data={data} navigate={navigate} />}
          {page === 'roles'         && data && <RolesView data={data} navigate={navigate} />}
          {page === 'role-detail'   && data && <RoleDetailView data={data} roleName={selectedRole} navigate={navigate} />}
          {page === 'teams'         && data && <TeamsView data={data} />}
          {page === 'assignments'   && data && <AssignmentsView data={data} navigate={navigate} />}
          {page === 'compare'       && data && <CompareView data={data} />}
          {page === 'field-security'&& data && <FieldSecurityView data={data} />}
          {page === 'search'        && data && <SearchView query={searchQuery} data={data} navigate={navigate} />}
        </div>
      </div>
    </div>
  );
}
