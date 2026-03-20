import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const severityMap = { '🚨 Proliferative DR': 5, 'Severe DR': 4, 'Moderate DR': 3, 'Mild DR': 2, 'No DR': 1, 'Pending': 0 };

const badge = (status) => {
    if (status === 'No DR') return { background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 6 };
    if (status === 'Mild DR') return { background: '#fefce8', color: '#ca8a04', border: '1px solid #fde047', fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 6 };
    if (status === 'Moderate DR') return { background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa', fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 6 };
    if (status === 'Severe DR') return { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 6 };
    if (status === '🚨 Proliferative DR') return { background: '#7f1d1d', color: '#fca5a5', border: '1px solid #f87171', fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 6 };
    return { background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 6 };
};

// Doctor Dashboard — unified (doctor + nurse features merged)
const Dashboard = () => {
    const navigate = useNavigate();
    const role = 'doctor'; // always doctor now

    // Patient queue state
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [sortMode, setSortMode] = useState('triage');

    // Panel state
    const [activePanel, setActivePanel] = useState('screening'); // screening | prescreening | medications

    // Registration
    const [showRegister, setShowRegister] = useState(false);
    const [newPatient, setNewPatient] = useState({ name: '', age: '', diabetes_duration_years: '', contact: '' });
    const [history, setHistory] = useState([]);

    // Screening
    const [analysisResults, setAnalysisResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [uploadError, setUploadError] = useState('');

    // e-Prescription
    const [selectedTreatment, setSelectedTreatment] = useState('');
    const [prescription, setPrescription] = useState(null);

    // Pre-screening (BP / Vision) — nurse feature merged
    const [prescreen, setPrescreen] = useState({ bp_systolic: '', bp_diastolic: '', vision_left: '', vision_right: '', blood_glucose: '', notes: '' });
    const [prescreenSaved, setPrescreenSaved] = useState(false);

    // Medication tracking — nurse feature merged
    const [medications, setMedications] = useState([]);
    const [newMed, setNewMed] = useState({ name: '', dosage: '', frequency: '', status: 'Active' });

    useEffect(() => { fetchPatients(); }, []);

    const fetchPatients = async () => {
        try { 
            const API_BASE = import.meta.env.VITE_BACKEND_URL || '';
            const r = await fetch(`${API_BASE}/patients/`); 
            setPatients(await r.json()); 
        } catch (e) { }
    };

    const sorted = [...patients].sort((a, b) => {
        if (sortMode === 'triage') {
            const valA = severityMap[a.triage_status] || 0;
            const valB = severityMap[b.triage_status] || 0;
            if (valA !== valB) return valB - valA;
            return 0;
        }
        return new Date(b.registered_at) - new Date(a.registered_at);
    });

    const selectPatient = (p) => {
        setSelectedPatient(p);
        setAnalysisResults([]);
        setUploadError('');
        setSelectedTreatment('');
        setPrescription(null);
        setPrescreenSaved(false);
        setPrescreen({ bp_systolic: '', bp_diastolic: '', vision_left: '', vision_right: '', blood_glucose: '', notes: '' });
        setMedications([]);
        setActivePanel('screening');
        const API_BASE = import.meta.env.VITE_BACKEND_URL || '';
        fetch(`${API_BASE}/screening/history/${p._id}`).then(r => r.json()).then(setHistory).catch(()=>{});
    };

    const registerPatient = async (e) => {
        e.preventDefault();
        try {
            const API_BASE = import.meta.env.VITE_BACKEND_URL || '';
            const res = await fetch(`${API_BASE}/patients/`, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ ...newPatient, age: newPatient.age ? parseInt(newPatient.age) : 0, diabetes_duration_years: newPatient.diabetes_duration_years ? parseInt(newPatient.diabetes_duration_years) : 0 }) 
            });
            if (!res.ok) {
                const err = await res.json();
                alert('Registration failed: ' + JSON.stringify(err));
                return;
            }
            fetchPatients();
            setShowRegister(false);
            setNewPatient({ name: '', age: '', diabetes_duration_years: '', contact: '' });
        } catch (e) { alert('Network Error') }
    };

    const handleFileUpload = async (e) => {
        if (!selectedPatient) return;
        setUploadError('');
        const files = Array.from(e.target.files);
        if (!files.length) return;
        setIsLoading(true);
        let results = [];
        for (const file of files) {
            const fd = new FormData();
            fd.append('file', file);
            fd.append('patient_id', selectedPatient._id);
            try {
                const API_BASE = import.meta.env.VITE_BACKEND_URL || '';
                const res = await fetch(`${API_BASE}/screening/predict`, { method: 'POST', body: fd });
                const data = await res.json();
                if (!res.ok) setUploadError(p => p + `\n${file.name}: ${data.detail}`);
                else results.push(data.result);
            } catch { setUploadError(p => p + `\n${file.name}: Network Error`); }
        }
        if (results.length) { setAnalysisResults(results); fetchPatients(); }
        setIsLoading(false);
    };

    const handleBatchUpload = async (e) => {
        if (Array.from(e.target.files).length === 1) {
            setUploadError('Batch Screening requires multiple files. Hold CTRL and select more than one image.');
            return;
        }
        await handleFileUpload(e);
    };

    const savePrescreening = (e) => {
        e.preventDefault();
        setPrescreenSaved(true);
    };

    const addMedication = (e) => {
        e.preventDefault();
        if (!newMed.name) return;
        setMedications(prev => [...prev, { ...newMed, id: Date.now() }]);
        setNewMed({ name: '', dosage: '', frequency: '', status: 'Active' });
    };

    const toggleMedStatus = (id) => {
        setMedications(prev => prev.map(m => m.id === id ? { ...m, status: m.status === 'Active' ? 'Completed' : 'Active' } : m));
    };

    const PANELS = [
        { id: 'screening', label: 'AI Screening' },
        { id: 'history', label: 'Patient History' },
        { id: 'prescreening', label: 'Pre-Screening' },
        { id: 'medications', label: 'Medication Tracking' },
    ];

    const downloadReport = () => {
        const el = document.getElementById('doctor-print-area');
        if(!el) return;
        el.style.display = 'block';
        window.html2pdf().from(el).set({
            margin: 0.5,
            filename: `VitalScreen_Report_${selectedPatient.name}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        }).save().then(() => { el.style.display = 'none'; });
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'Inter,sans-serif', background: '#f0f4f8', color: '#0f172a' }}>

            {/* ── Sidebar ── */}
            <aside style={{ width: 268, background: '#1e293b', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'sticky', top: 0, height: '100vh', boxShadow: '2px 0 12px rgba(0,0,0,0.1)' }}>
                <div style={{ padding: '22px 18px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <img src="/logo.png" alt="VitalScreen Logo" style={{ height: 40, objectFit: 'contain' }} />
                        </div>
                        <button onClick={() => { localStorage.removeItem('role'); navigate('/'); }} style={{ padding: '6px 10px', borderRadius: 6, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', fontWeight: 700, fontSize: 11, cursor: 'pointer', transition: 'all 0.1s' }}>Logout</button>
                    </div>
                    <span style={{ fontSize: 10, color: '#64748b', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', paddingLeft: 46 }}>Doctor Dashboard</span>
                </div>

                {/* Sort */}
                <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <label style={{ fontSize: 10, color: '#64748b', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Queue Order</label>
                    <select value={sortMode} onChange={e => setSortMode(e.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 10px', color: '#cbd5e1', fontSize: 12, fontWeight: 600, outline: 'none', cursor: 'pointer' }}>
                        <option value="triage">⚠ Sort by Triage Risk</option>
                        <option value="time">🕐 Sort by Latest Time</option>
                    </select>
                </div>

                {/* Patient Queue */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
                    <p style={{ fontSize: 10, color: '#475569', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', padding: '8px 4px 6px' }}>Patient Queue ({patients.length})</p>
                    {sorted.map(p => (
                        <div key={p._id} onClick={() => selectPatient(p)}
                            style={{ padding: '10px 12px', borderRadius: 10, cursor: 'pointer', marginBottom: 5, transition: 'all 0.12s', border: `1px solid ${selectedPatient?._id === p._id ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.05)'}`, background: selectedPatient?._id === p._id ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.02)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                <span style={{ fontWeight: 700, fontSize: 13, color: '#e2e8f0' }}>{p.name}</span>
                                <span style={badge(p.triage_status)}>{p.triage_status}</span>
                            </div>
                            <p style={{ fontSize: 11, color: '#64748b' }}>Age {p.age} · {p.diabetes_duration_years} yr diabetes</p>
                        </div>
                    ))}
                    {patients.length === 0 && <p style={{ fontSize: 12, color: '#475569', textAlign: 'center', padding: '20px 0', fontStyle: 'italic' }}>No patients registered yet.</p>}
                </div>

                {/* Sidebar Footer */}
                <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                    <button className="btn-primary" style={{ width: '100%', padding: '10px', fontSize: 13 }} onClick={() => setShowRegister(v => !v)}>+ Register Patient</button>
                </div>
            </aside>

            {/* ── Main Content ── */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                {/* Topbar */}
                <div style={{ padding: '16px 28px', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                    <div>
                        <h1 style={{ fontSize: 19, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>{selectedPatient ? selectedPatient.name : 'Doctor Dashboard'}</h1>
                        {selectedPatient
                            ? <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>ID: {selectedPatient._id} · {selectedPatient.contact}</p>
                            : <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Select a patient from the sidebar to view records</p>}
                    </div>
                    {analysisResults.length > 0 && (
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button className="btn-ghost" style={{ padding: '8px 14px', fontSize: 12, background: '#fff', border: '1px solid #e2e8f0' }} onClick={() => window.print()}>🖨 Print</button>
                            <button className="btn-primary" onClick={downloadReport}>📥 Download PDF</button>
                        </div>
                    )}
                </div>

                <div style={{ padding: 24, flex: 1 }}>
                    {/* Register Form */}
                    {showRegister && (
                        <div className="card" style={{ padding: 24, marginBottom: 22, maxWidth: 560 }}>
                            <h3 style={{ fontWeight: 800, fontSize: 14, color: '#0f172a', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid #e2e8f0' }}>New Patient Registration</h3>
                            <form onSubmit={registerPatient} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                {[['Full Name', 'text', 'name'], ['Age', 'number', 'age'], ['Diabetes Duration (yrs)', 'number', 'diabetes_duration_years'], ['Contact Details', 'text', 'contact']].map(([label, type, field]) => (
                                    <div key={field} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                        <label style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
                                        <input className="input-field" type={type} required placeholder={label} value={newPatient[field]} onChange={e => setNewPatient({ ...newPatient, [field]: e.target.value })} />
                                    </div>
                                ))}
                                <div style={{ gridColumn: '1/-1', display: 'flex', gap: 10, marginTop: 4 }}>
                                    <button type="submit" className="btn-primary" style={{ flex: 1, padding: '10px' }}>Register Case</button>
                                    <button type="button" className="btn-ghost" style={{ flex: 1, padding: '10px' }} onClick={() => setShowRegister(false)}>Cancel</button>
                                </div>
                            </form>
                        </div>
                    )}

                    {selectedPatient ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            {/* Panel Tabs */}
                            <div style={{ display: 'flex', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 4, gap: 4, width: 'fit-content', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                                {PANELS.map(panel => (
                                    <button key={panel.id} onClick={() => setActivePanel(panel.id)}
                                        style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 9, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'Inter,sans-serif', transition: 'all 0.15s',
                                            background: activePanel === panel.id ? '#2563eb' : 'transparent',
                                            color: activePanel === panel.id ? '#fff' : '#64748b',
                                            boxShadow: activePanel === panel.id ? '0 2px 8px rgba(37,99,235,0.25)' : 'none' }}>
                                        {panel.label}
                                    </button>
                                ))}
                            </div>

                            {/* ─── PANEL: Patient History ─── */}
                            {activePanel === 'history' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                    {history.length > 0 ? history.map((record, i) => (
                                        <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 22, display: 'grid', gridTemplateColumns: '130px 1fr', gap: 18, alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                                            <img src={record.heatmap_url} alt="Scan" style={{ width: 130, height: 130, objectFit: 'cover', borderRadius: 10, border: '1px solid #e2e8f0' }} />
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                                    <span style={{ fontWeight: 800, fontSize: 16, color: '#0f172a' }}>Retinal Assessment</span>
                                                    <span style={badge(record.status)}>{record.status}</span>
                                                </div>
                                                <p style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'monospace', marginBottom: 12 }}>{new Date(record.timestamp).toLocaleString()}</p>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                                    {[['Diagnosis', record.prediction], ['Confidence', `${(record.confidence * 100).toFixed(1)}%`], ['Secondary Findings', record.secondary_findings], ['Affected Area', record.affected_area]].map(([k, v]) => (
                                                        <div key={k} style={{ background: '#f8fafc', borderRadius: 8, padding: '9px 12px', border: '1px solid #e2e8f0' }}>
                                                            <p style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>{k}</p>
                                                            <p style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>{v}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div style={{ background: '#fff', border: '1px dashed #e2e8f0', borderRadius: 14, padding: '56px 32px', textAlign: 'center' }}>
                                            <p style={{ fontWeight: 700, color: '#64748b', fontSize: 15 }}>No prior history found.</p>
                                            <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 6 }}>This patient does not have any previously saved AI scans.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ─── PANEL: AI Screening ─── */}
                            {activePanel === 'screening' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                                    {/* Upload Cards */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                        {[{ label: 'Single Scan', icon: '👁', desc: 'Analyze one retinal image with Grad-CAM output.', multi: false, fn: handleFileUpload, bg: '#eff6ff', border: '#bfdbfe' },
                                          { label: 'Batch Screening', icon: '📂', desc: 'Hold CTRL and select multiple images for bulk analysis.', multi: true, fn: handleBatchUpload, bg: '#f0fdf4', border: '#a7f3d0' }
                                        ].map(card => (
                                            <div key={card.label} className="card" style={{ padding: 20, background: card.bg, borderColor: card.border }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                                    <div style={{ width: 34, height: 34, borderRadius: 8, background: '#fff', border: `1px solid ${card.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>{card.icon}</div>
                                                    <span style={{ fontWeight: 800, fontSize: 13, color: '#0f172a' }}>{card.label}</span>
                                                </div>
                                                <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12, lineHeight: 1.5 }}>{card.desc}</p>
                                                <input type="file" accept="image/*" multiple={card.multi} onChange={card.fn} style={{ fontSize: 12, color: '#475569', width: '100%', cursor: 'pointer' }} />
                                            </div>
                                        ))}
                                    </div>

                                    {isLoading && <div style={{ padding: '11px 16px', background: '#fefce8', border: '1px solid #fde68a', borderRadius: 10, color: '#854d0e', fontWeight: 700, fontSize: 13 }}>⏳ Analyzing retinal image(s)…</div>}
                                    {uploadError && <div style={{ padding: '11px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, color: '#dc2626', fontWeight: 600, fontSize: 13, whiteSpace: 'pre-wrap' }}>{uploadError}</div>}

                                    {/* e-Prescription */}
                                    {analysisResults.length > 0 && (
                                        <div className="card" style={{ padding: 20 }}>
                                            <h3 style={{ fontWeight: 800, fontSize: 14, color: '#0f172a', marginBottom: 12 }}>e-Prescription Generator</h3>
                                            <select value={selectedTreatment} onChange={e => setSelectedTreatment(e.target.value)} className="input-field" style={{ marginBottom: 10 }}>
                                                <option value="">Select Treatment Protocol…</option>
                                                <option value="Anti-VEGF Intraocular Injection (Aflibercept 2mg) — Administer every 4 weeks">Anti-VEGF Intraocular Injection</option>
                                                <option value="Focal/Grid Laser Photocoagulation Therapy — Schedule within 14 days">Laser Photocoagulation Therapy</option>
                                                <option value="Strict Glycemic & Blood Pressure Control — Follow up in 3 months">Observe & Monitor Vitreous</option>
                                            </select>
                                            <button className="btn-primary" style={{ width: '100%', padding: 11 }} onClick={() => { if (selectedTreatment) setPrescription({ date: new Date().toLocaleDateString(), text: selectedTreatment, doctor: 'Dr. Admin' }); }}>Generate Authorized Rx</button>
                                            {prescription && (
                                                <div style={{ marginTop: 12, padding: '13px 16px', background: '#fefce8', border: '1px solid #fde68a', borderRadius: 10 }}>
                                                    <p style={{ fontSize: 10, fontWeight: 800, color: '#854d0e', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Active Prescription</p>
                                                    <p style={{ fontWeight: 700, color: '#0f172a', fontSize: 13 }}>{prescription.text}</p>
                                                    <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 5, fontWeight: 600 }}>Authorized: {prescription.doctor} · {prescription.date}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Results */}
                                    {analysisResults.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                            <h3 style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Results — {analysisResults.length} Scan{analysisResults.length > 1 ? 's' : ''} Processed</h3>
                                            {analysisResults.map((res, i) => (
                                                <div key={i} className="card" style={{ padding: 20, display: 'grid', gridTemplateColumns: '148px 1fr', gap: 20 }}>
                                                    <div>
                                                        <p style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Grad-CAM #{i + 1}</p>
                                                        <img src={res.heatmap_url} alt="Heatmap" style={{ width: 148, height: 148, objectFit: 'cover', borderRadius: 10, border: '1px solid #e2e8f0' }} />
                                                    </div>
                                                    <div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}>
                                                            <h4 style={{ fontWeight: 800, fontSize: 16, color: '#0f172a' }}>Scan #{i + 1}</h4>
                                                            <span style={badge(res.status)}>{res.status}</span>
                                                        </div>
                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginBottom: 12 }}>
                                                            {[['Prediction', res.prediction], ['Confidence', `${(res.confidence * 100).toFixed(1)}%`], ['Secondary Findings', res.secondary_findings], ['Affected Region', res.affected_area]].map(([k, v]) => (
                                                                <div key={k} style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 12px', border: '1px solid #e2e8f0' }}>
                                                                    <p style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{k}</p>
                                                                    <p style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>{v}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div style={{ padding: '10px 14px', background: (res.status === 'Severe DR' || res.status === '🚨 Proliferative DR') ? '#fef2f2' : '#ecfdf5', border: `1px solid ${(res.status === 'Severe DR' || res.status === '🚨 Proliferative DR') ? '#fecaca' : '#a7f3d0'}`, borderRadius: 8 }}>
                                                            <p style={{ fontWeight: 700, fontSize: 12, color: (res.status === 'Severe DR' || res.status === '🚨 Proliferative DR') ? '#dc2626' : '#059669' }}>{(res.status === 'Severe DR' || res.status === '🚨 Proliferative DR') ? '⚠ Immediate clinical review required. Book specialist within 48 hours.' : '✓ Routine follow-up recommended in 6–12 months.'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="card" style={{ padding: '48px 32px', textAlign: 'center' }}>
                                            <div style={{ fontSize: 44, marginBottom: 12, opacity: 0.2 }}>🔬</div>
                                            <p style={{ fontWeight: 700, fontSize: 14, color: '#64748b', marginBottom: 5 }}>No screenings uploaded yet</p>
                                            <p style={{ fontSize: 13, color: '#94a3b8' }}>Use the upload cards above to begin AI retinal analysis.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ─── PANEL: Pre-Screening Form ─── */}
                            {activePanel === 'prescreening' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div className="card" style={{ padding: 24 }}>
                                        <h3 style={{ fontWeight: 800, fontSize: 15, color: '#0f172a', marginBottom: 4 }}>Pre-Screening Assessment</h3>
                                        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>Record baseline vitals for <strong>{selectedPatient.name}</strong> before AI scan upload.</p>
                                        <form onSubmit={savePrescreening} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                            {/* BP */}
                                            <div style={{ gridColumn: '1/-1' }}>
                                                <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Blood Pressure (mmHg)</p>
                                                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                                    <input className="input-field" type="number" placeholder="Systolic" value={prescreen.bp_systolic} onChange={e => setPrescreen({ ...prescreen, bp_systolic: e.target.value })} style={{ flex: 1 }} />
                                                    <span style={{ fontWeight: 800, color: '#94a3b8', fontSize: 18 }}>/</span>
                                                    <input className="input-field" type="number" placeholder="Diastolic" value={prescreen.bp_diastolic} onChange={e => setPrescreen({ ...prescreen, bp_diastolic: e.target.value })} style={{ flex: 1 }} />
                                                </div>
                                            </div>
                                            {/* Vision */}
                                            <div>
                                                <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 7 }}>Vision — Left Eye</label>
                                                <input className="input-field" type="text" placeholder="e.g. 6/6" value={prescreen.vision_left} onChange={e => setPrescreen({ ...prescreen, vision_left: e.target.value })} />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 7 }}>Vision — Right Eye</label>
                                                <input className="input-field" type="text" placeholder="e.g. 6/9" value={prescreen.vision_right} onChange={e => setPrescreen({ ...prescreen, vision_right: e.target.value })} />
                                            </div>
                                            {/* Blood Glucose */}
                                            <div>
                                                <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 7 }}>Blood Glucose (mg/dL)</label>
                                                <input className="input-field" type="number" placeholder="e.g. 126" value={prescreen.blood_glucose} onChange={e => setPrescreen({ ...prescreen, blood_glucose: e.target.value })} />
                                            </div>
                                            {/* Notes */}
                                            <div>
                                                <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 7 }}>Clinical Notes</label>
                                                <input className="input-field" type="text" placeholder="e.g. Patient reports blurry vision" value={prescreen.notes} onChange={e => setPrescreen({ ...prescreen, notes: e.target.value })} />
                                            </div>
                                            <div style={{ gridColumn: '1/-1' }}>
                                                <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px' }}>Save Pre-Screening Record</button>
                                            </div>
                                        </form>
                                        {prescreenSaved && (
                                            <div style={{ marginTop: 14, padding: '11px 16px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ fontSize: 16 }}>✅</span>
                                                <div>
                                                    <p style={{ fontWeight: 700, color: '#059669', fontSize: 13 }}>Pre-screening vitals saved successfully!</p>
                                                    <p style={{ fontSize: 12, color: '#065f46', marginTop: 2 }}>BP: {prescreen.bp_systolic}/{prescreen.bp_diastolic} mmHg · Vision L/R: {prescreen.vision_left} / {prescreen.vision_right} · Glucose: {prescreen.blood_glucose} mg/dL</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ─── PANEL: Medication Tracking ─── */}
                            {activePanel === 'medications' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div className="card" style={{ padding: 22 }}>
                                        <h3 style={{ fontWeight: 800, fontSize: 15, color: '#0f172a', marginBottom: 4 }}>Medication Tracking</h3>
                                        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 18 }}>Manage active prescriptions for <strong>{selectedPatient.name}</strong>.</p>
                                        <form onSubmit={addMedication} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 10, alignItems: 'flex-end', marginBottom: 20 }}>
                                            {[['Medicine Name', 'name', 'text', 'e.g. Metformin'], ['Dosage', 'dosage', 'text', 'e.g. 500mg'], ['Frequency', 'frequency', 'text', 'e.g. Twice daily']].map(([label, field, type, ph]) => (
                                                <div key={field} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                                    <label style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
                                                    <input className="input-field" type={type} placeholder={ph} value={newMed[field]} onChange={e => setNewMed({ ...newMed, [field]: e.target.value })} />
                                                </div>
                                            ))}
                                            <button type="submit" className="btn-primary" style={{ padding: '11px 16px', whiteSpace: 'nowrap' }}>+ Add</button>
                                        </form>

                                        {medications.length > 0 ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                                {medications.map(med => (
                                                    <div key={med.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10 }}>
                                                        <div>
                                                            <p style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{med.name}</p>
                                                            <p style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>{med.dosage} · {med.frequency}</p>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 6, background: med.status === 'Active' ? '#ecfdf5' : '#f8fafc', color: med.status === 'Active' ? '#059669' : '#64748b', border: `1px solid ${med.status === 'Active' ? '#a7f3d0' : '#e2e8f0'}` }}>{med.status}</span>
                                                            <button onClick={() => toggleMedStatus(med.id)} style={{ fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 7, border: '1px solid #e2e8f0', background: '#fff', color: '#475569', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>Toggle</button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div style={{ padding: '40px', textAlign: 'center', background: '#f8fafc', border: '1px dashed #e2e8f0', borderRadius: 12 }}>
                                                <p style={{ fontWeight: 700, color: '#64748b', fontSize: 14 }}>No medications added yet.</p>
                                                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 5 }}>Add prescriptions using the form above.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 12, opacity: 0.35 }}>
                            <div style={{ fontSize: 52 }}>🏥</div>
                            <p style={{ fontWeight: 700, fontSize: 17, color: '#0f172a' }}>Select a patient from the sidebar</p>
                            <p style={{ fontSize: 14, color: '#64748b' }}>or register a new patient to get started</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Print-only block */}
            {selectedPatient && analysisResults.length > 0 && (
                <div id="doctor-print-area" style={{ display: 'none' }} className="print-only">
                    {analysisResults.map((res, pi) => (
                        <div key={pi} style={{ padding: 48, background: '#fff', color: '#111', fontFamily: 'Georgia,serif', pageBreakAfter: 'always' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '3px solid #1d2d50', paddingBottom: 20, marginBottom: 24 }}>
                                <div><h1 style={{ fontSize: 26, fontWeight: 900, color: '#1d2d50' }}>VITAL EYE CARE</h1><p style={{ fontSize: 11, color: '#999', marginTop: 4 }}>123 Health Avenue, Medical District · +1 800-EYE-CARE</p></div>
                                <div style={{ textAlign: 'right' }}><p style={{ fontWeight: 800, fontSize: 13, color: '#1d2d50' }}>DIAGNOSTIC REPORT {analysisResults.length > 1 ? `(${pi + 1}/${analysisResults.length})` : ''}</p><p style={{ fontSize: 12, color: '#555', marginTop: 4 }}>{new Date().toLocaleDateString()}</p></div>
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24, fontSize: 13 }}><tbody>
                                <tr style={{ background: '#f8f9fa' }}><td style={{ padding: '8px 12px', fontWeight: 700, color: '#555', border: '1px solid #e0e0e0', width: '25%' }}>Patient Name</td><td style={{ padding: '8px 12px', border: '1px solid #e0e0e0' }}>{selectedPatient.name}</td><td style={{ padding: '8px 12px', fontWeight: 700, color: '#555', border: '1px solid #e0e0e0', width: '25%' }}>Age</td><td style={{ padding: '8px 12px', border: '1px solid #e0e0e0' }}>{selectedPatient.age} yrs</td></tr>
                                <tr><td style={{ padding: '8px 12px', fontWeight: 700, color: '#555', border: '1px solid #e0e0e0' }}>Contact</td><td style={{ padding: '8px 12px', border: '1px solid #e0e0e0' }}>{selectedPatient.contact}</td><td style={{ padding: '8px 12px', fontWeight: 700, color: '#555', border: '1px solid #e0e0e0' }}>Diabetes Duration</td><td style={{ padding: '8px 12px', border: '1px solid #e0e0e0' }}>{selectedPatient.diabetes_duration_years} years</td></tr>
                                {prescreenSaved && <tr style={{ background: '#f8f9fa' }}><td style={{ padding: '8px 12px', fontWeight: 700, color: '#555', border: '1px solid #e0e0e0' }}>BP</td><td style={{ padding: '8px 12px', border: '1px solid #e0e0e0' }}>{prescreen.bp_systolic}/{prescreen.bp_diastolic} mmHg</td><td style={{ padding: '8px 12px', fontWeight: 700, color: '#555', border: '1px solid #e0e0e0' }}>Blood Glucose</td><td style={{ padding: '8px 12px', border: '1px solid #e0e0e0' }}>{prescreen.blood_glucose} mg/dL</td></tr>}
                                {prescreenSaved && <tr><td style={{ padding: '8px 12px', fontWeight: 700, color: '#555', border: '1px solid #e0e0e0' }}>Vision L / R</td><td colSpan="3" style={{ padding: '8px 12px', border: '1px solid #e0e0e0' }}>{prescreen.vision_left} / {prescreen.vision_right}</td></tr>}
                            </tbody></table>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 24 }}>
                                <div>
                                    <h2 style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#1d2d50', borderLeft: '4px solid #1d2d50', paddingLeft: 10, marginBottom: 14 }}>Primary Diagnosis</h2>
                                    <div style={{ padding: 16, background: res.prediction === 'Normal' ? '#f0fdf4' : '#fef2f2', border: `2px solid ${res.prediction === 'Normal' ? '#86efac' : '#fca5a5'}`, borderRadius: 8, textAlign: 'center', marginBottom: 14 }}><p style={{ fontSize: 18, fontWeight: 900, textTransform: 'uppercase', color: res.prediction === 'Normal' ? '#166534' : '#991b1b' }}>{res.prediction}</p></div>
                                    {[['AI Confidence', `${(res.confidence * 100).toFixed(1)}%`], ['Secondary Findings', res.secondary_findings], ['Affected Area', res.affected_area]].map(([k, v]) => <p key={k} style={{ fontSize: 12, borderBottom: '1px solid #eee', padding: '7px 0' }}><strong style={{ color: '#555', display: 'inline-block', width: '45%' }}>{k}</strong>{v}</p>)}
                                </div>
                                <div>
                                    <h2 style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#1d2d50', borderLeft: '4px solid #1d2d50', paddingLeft: 10, marginBottom: 14 }}>Grad-CAM Heatmap</h2>
                                    <img src={res.heatmap_url} alt="Heatmap" style={{ width: '100%', maxHeight: 220, objectFit: 'contain', border: '1px solid #e0e0e0', borderRadius: 8 }} />
                                </div>
                            </div>
                            <h2 style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#1d2d50', borderLeft: '4px solid #1d2d50', paddingLeft: 10, marginBottom: 10 }}>Clinical Protocol</h2>
                            <ul style={{ paddingLeft: 20, fontSize: 13, lineHeight: 2, color: '#333' }}>
                                {res.status === 'Severe DR' || res.status === '🚨 Proliferative DR' ? <><li style={{ color: '#991b1b', fontWeight: 700 }}>Immediate review by certified retinal specialist.</li><li>Anti-VEGF injections within 14 days.</li><li>Schedule Fluorescein Angiography.</li></> : <><li>Routine follow-up in 6–12 months.</li><li>Strict glycemic and blood pressure management.</li><li>Full medication adherence.</li></>}
                            </ul>
                            {pi === analysisResults.length - 1 && prescription && (
                                <div style={{ marginTop: 20, padding: '16px 20px', border: '2px dashed #1d2d50', borderRadius: 8 }}>
                                    <p style={{ fontSize: 11, fontWeight: 800, color: '#1d2d50', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Official e-Prescription (Rx)</p>
                                    <p style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>{prescription.text}</p>
                                    <p style={{ fontSize: 11, color: '#666', marginTop: 6 }}>Authorized: {prescription.doctor} · {prescription.date}</p>
                                </div>
                            )}
                            <div style={{ marginTop: 60, display: 'flex', justifyContent: 'space-around', paddingTop: 18, borderTop: '1px solid #e0e0e0' }}>
                                <div style={{ textAlign: 'center' }}><div style={{ borderTop: '1px solid #111', paddingTop: 8, width: 200, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>ATTENDING PHYSICIAN</div></div>
                                <div style={{ textAlign: 'center' }}><div style={{ borderTop: '1px solid #111', paddingTop: 8, width: 200, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>AI SYSTEM VALIDATION</div></div>
                            </div>
                            <div style={{ marginTop: 24, padding: 16, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                                <p style={{ fontSize: 9, color: '#64748b', lineHeight: 1.6, textAlign: 'justify' }}>
                                    <strong>CLINICAL DISCLAIMER:</strong> This analytical report was generated using the VitalScreen AI Diabetic Retinopathy prediction model. The insights and Grad-CAM neural network visual overlays are intended as advanced decision-support tools for clinicians and do not conclusively replace a comprehensive dilated fundus examination by a certified ophthalmologist. Clinical correlation is mandatory before initiating surgical, laser, or pharmaceutical interventions. VitalScreen AI assumes no liability for diagnoses made solely on the basis of this automated screening report.
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <style>{`@media print { .no-print { display: none !important; } .print-only { display: block !important; } @page { size: auto; margin: 0; } }`}</style>
        </div>
    );
};

export default Dashboard;
