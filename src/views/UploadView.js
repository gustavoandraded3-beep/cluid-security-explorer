import React, { useState, useRef } from 'react';

export default function UploadView({ onUpload, loading, error, hasData, onContinue }) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef();

  const handleFile = (f) => {
    if (f && f.name.endsWith('.xlsx')) onUpload(f);
  };

  return (
    <div style={{ maxWidth: 560, margin: '60px auto', padding: '0 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>🏠</div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
          Clúid Security Explorer
        </h1>
        <p style={{ color: 'var(--text3)', fontSize: 15 }}>
          Upload your Dynamics 365 Security Profiles Excel file to get started
        </p>
      </div>

      <div
        style={{
          border: `2px dashed ${drag ? 'var(--accent)' : 'var(--border2)'}`,
          borderRadius: 16, padding: '48px 32px', textAlign: 'center',
          background: drag ? 'var(--accent-bg)' : 'var(--surface)',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        }}
        onDragOver={e => { e.preventDefault(); if (!loading) setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); if (!loading) handleFile(e.dataTransfer.files[0]); }}
        onClick={() => { if (!loading) inputRef.current.click(); }}
      >
        <input ref={inputRef} type="file" accept=".xlsx" style={{ display: 'none' }}
          onChange={e => handleFile(e.target.files[0])} />

        {loading ? (
          <div>
            <div style={{ fontSize: 36, marginBottom: 16, animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</div>
            <p style={{ color: 'var(--text)', fontWeight: 600, fontSize: 15 }}>Processing your file...</p>
            <p style={{ color: 'var(--text3)', fontSize: 12, marginTop: 8 }}>
              Parsing all sheets and building role relationships.<br/>This may take 10–20 seconds.
            </p>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📂</div>
            <p style={{ color: 'var(--text)', fontWeight: 600, marginBottom: 8 }}>
              Drop your .xlsx file here
            </p>
            <p style={{ color: 'var(--text3)', fontSize: 13 }}>or click to browse</p>
            <div style={{ marginTop: 20, padding: '6px 14px', background: 'var(--surface2)', borderRadius: 8, display: 'inline-block' }}>
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                Clúid_Security_Profiles_MASTERFILE.xlsx
              </span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div style={{
          marginTop: 16, padding: '12px 16px', borderRadius: 10,
          background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)',
          color: 'var(--danger)', fontSize: 13,
        }}>
          ⚠️ {error}
        </div>
      )}

      {hasData && !loading && (
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button className="btn btn-ghost" onClick={onContinue}>
            ← Continue with current data
          </button>
        </div>
      )}

      <div style={{ marginTop: 36, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <p style={{ color: 'var(--text3)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
          What this tool reads
        </p>
        {[
          ['🔐', 'Security Roles', '16 standard roles + 4 admin profiles'],
          ['👥', 'Teams', 'Dataverse teams with member counts'],
          ['📋', 'Role Assignments', 'Department → security role mappings'],
          ['🔒', 'Field Security', 'Field-level access by role'],
        ].map(([icon, label, desc]) => (
          <div key={label} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 15 }}>{icon}</span>
            <div>
              <span style={{ color: 'var(--text)', fontWeight: 600, fontSize: 13 }}>{label}</span>
              <span style={{ color: 'var(--text3)', fontSize: 12 }}> — {desc}</span>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
