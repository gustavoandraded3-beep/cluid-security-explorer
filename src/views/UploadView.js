import React, { useState, useRef } from 'react';

export default function UploadView({ onUpload, loading, hasData, onContinue }) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef();

  const handleFile = (f) => {
    if (f && f.name.endsWith('.xlsx')) onUpload(f);
  };

  return (
    <div style={{ maxWidth: 560, margin: '60px auto', padding: '0 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>🏠</div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Clúid Security Explorer</h1>
        <p style={{ color: 'var(--text3)', fontSize: 15 }}>Upload your Dynamics 365 Security Profiles Excel file to get started</p>
      </div>

      <div
        className={`upload-zone ${drag ? 'drag' : ''}`}
        style={{
          border: `2px dashed ${drag ? 'var(--accent)' : 'var(--border2)'}`,
          borderRadius: 16, padding: '48px 32px', textAlign: 'center',
          background: drag ? 'var(--accent-bg)' : 'var(--surface)',
          cursor: 'pointer', transition: 'all 0.2s',
        }}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}
        onClick={() => inputRef.current.click()}
      >
        <input ref={inputRef} type="file" accept=".xlsx" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
        {loading ? (
          <div>
            <div style={{ fontSize: 36, marginBottom: 16 }}>⏳</div>
            <p style={{ color: 'var(--text2)', fontWeight: 600 }}>Processing file...</p>
            <p style={{ color: 'var(--text3)', fontSize: 12, marginTop: 8 }}>Parsing sheets and building relationships</p>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📂</div>
            <p style={{ color: 'var(--text)', fontWeight: 600, marginBottom: 8 }}>Drop your .xlsx file here</p>
            <p style={{ color: 'var(--text3)', fontSize: 13 }}>or click to browse</p>
            <div style={{ marginTop: 20, padding: '8px 16px', background: 'var(--surface2)', borderRadius: 8, display: 'inline-block' }}>
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>Accepts: Clúid_Security_Profiles_MASTERFILE.xlsx</span>
            </div>
          </div>
        )}
      </div>

      {hasData && (
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <button className="btn btn-ghost" onClick={onContinue}>
            ← Continue with current data
          </button>
        </div>
      )}

      <div style={{ marginTop: 40, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
        <p style={{ color: 'var(--text3)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>What this tool reads</p>
        {[
          ['🔐', 'Security Roles', 'Housing Officer, Housing Manager, Superuser, etc.'],
          ['🛡️', 'Admin Profiles', 'Account Admin, Service Resp Admin, Charge Level Admin'],
          ['👥', 'Teams', 'Dataverse teams and their members'],
          ['📋', 'Role Assignments', 'Who gets which roles by department and Clúid role'],
          ['🔒', 'Field Security', 'Field-level access by role'],
        ].map(([icon, label, desc]) => (
          <div key={label} style={{ display: 'flex', gap: 12, marginBottom: 10, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 16 }}>{icon}</span>
            <div>
              <span style={{ color: 'var(--text)', fontWeight: 600, fontSize: 13 }}>{label}</span>
              <span style={{ color: 'var(--text3)', fontSize: 12 }}> — {desc}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
