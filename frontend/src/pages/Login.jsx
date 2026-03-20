import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [activeRole, setActiveRole] = useState('doctor'); // 'doctor' | 'patient'
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        await new Promise(r => setTimeout(r, 500));

        if (activeRole === 'patient') {
            localStorage.setItem('role', 'patient');
            try {
                const res = await fetch('/patients/');
                const data = await res.json();
                if (data && data.length > 0) {
                    const match = data.find(p => p.name?.toLowerCase().replace(/\s+/g,'_') === username.toLowerCase()) || data[0];
                    localStorage.setItem('patient_id', match._id);
                    localStorage.setItem('patient_name', match.name);
                }
            } catch (e) {}
            navigate('/patient');
        } else {
            // Doctor only — route to dashboard
            localStorage.setItem('role', 'doctor');
            navigate('/dashboard');
        }
        setIsLoading(false);
    };

    const doctorCreds = [['Doctor', 'doctor_admin', '#eff6ff', '#2563eb']];
    const patientCreds = [['Patient', 'patient_ravi', '#faf5ff', '#7c3aed']];
    const quickCreds = activeRole === 'doctor' ? doctorCreds : patientCreds;

    return (
        <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'Inter,sans-serif', background: '#f0f4f8' }}>

            {/* ──────────── LEFT: Login Panel ──────────── */}
            <div style={{ flex: '0 0 440px', background: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '52px 48px', borderRight: '1px solid #e2e8f0', boxShadow: '4px 0 24px rgba(0,0,0,0.05)' }}>

                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 44 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 11, background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 21, boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}>👁</div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 16, color: '#0f172a', letterSpacing: '-0.02em' }}>VitalScreen AI</div>
                        <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Retinopathy Screening System</div>
                    </div>
                </div>

                {/* Role Tabs */}
                <div style={{ display: 'flex', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: 4, marginBottom: 28, background: '#f8fafc' }}>
                    {[['doctor', '🩺', 'Doctor'], ['patient', '🧑‍⚕️', 'Patient']].map(([role, icon, label]) => (
                        <button key={role} onClick={() => { setActiveRole(role); setUsername(''); setPassword(''); setError(''); }}
                            style={{ flex: 1, padding: '10px 8px', borderRadius: 9, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'all 0.15s', fontFamily: 'Inter,sans-serif',
                                background: activeRole === role ? '#2563eb' : 'transparent',
                                color: activeRole === role ? '#fff' : '#64748b',
                                boxShadow: activeRole === role ? '0 2px 8px rgba(37,99,235,0.25)' : 'none'
                            }}>
                            <span>{icon}</span>{label}
                        </button>
                    ))}
                </div>

                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 4, letterSpacing: '-0.02em' }}>
                    {activeRole === 'doctor' ? 'Doctor Login' : 'Patient Login'}
                </h2>
                <p style={{ fontSize: 13, color: '#64748b', marginBottom: 28 }}>
                    {activeRole === 'doctor' ? 'Sign in to manage your patient screening queue and records.' : 'Access your health reports, reminders, and AI assistant.'}
                </p>

                {/* Form */}
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Username</label>
                        <input className="input-field" type="text" value={username} onChange={e => setUsername(e.target.value)}
                            placeholder={activeRole === 'doctor' ? 'e.g. doctor_admin or nurse_jane' : 'e.g. patient_ravi'} required />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Password</label>
                        <input className="input-field" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
                    </div>
                    {error && <p style={{ fontSize: 13, color: '#dc2626', fontWeight: 600, background: '#fef2f2', border: '1px solid #fecaca', padding: '8px 12px', borderRadius: 8 }}>{error}</p>}
                    <button type="submit" className="btn-primary" style={{ padding: '13px', fontSize: 15, marginTop: 2 }} disabled={isLoading}>
                        {isLoading ? 'Signing In…' : `Sign In as ${activeRole === 'doctor' ? 'Doctor' : 'Patient'} →`}
                    </button>
                </form>

                {/* Quick Access */}
                <div style={{ marginTop: 28, padding: '16px 18px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12 }}>
                    <p style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>Quick Access</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                        {quickCreds.map(([role, cred, bg, color]) => (
                            <div key={role} onClick={() => setUsername(cred)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 11px', background: bg, borderRadius: 8, cursor: 'pointer' }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>{role}</span>
                                <code style={{ fontSize: 12, fontWeight: 700, color, letterSpacing: '0.02em' }}>{cred}</code>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ──────────── RIGHT: Home / Landing Page ──────────── */}
            <div style={{ flex: 1, background: 'linear-gradient(135deg,#eff6ff 0%,#f0f9ff 55%,#f0fdf4 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 64px', overflowY: 'auto' }}>

                {/* Hero heading */}
                <div style={{ marginBottom: 36 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2563eb', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '4px 12px', borderRadius: 20, display: 'inline-block', marginBottom: 14 }}>AI-Powered Early Detection</span>
                    <h1 style={{ fontSize: 36, fontWeight: 900, color: '#0f172a', lineHeight: 1.2, letterSpacing: '-0.03em', marginBottom: 16 }}>
                        Detect Diabetic Retinopathy<br /><span style={{ color: '#2563eb' }}>Before It's Too Late</span>
                    </h1>
                    <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.75, maxWidth: 520, fontWeight: 400 }}>
                        VitalScreen AI is a comprehensive clinical tool for early screening of Diabetic Retinopathy using deep learning. It empowers doctors, nurses, and patients with automated image analysis, Grad-CAM heatmap explainability, risk triage, e-prescriptions, and a multilingual patient portal — all in one integrated system.
                    </p>
                </div>

                {/* Feature Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, maxWidth: 560 }}>
                    {[
                        { icon: '🔬', title: 'Grad-CAM Heatmaps', desc: 'Visual neural network overlays on retinal scans for transparent AI decisions', bg: '#eff6ff', border: '#bfdbfe' },
                        { icon: '⚡', title: 'Automated Triage', desc: 'Risk stratification automatically escalates Urgent cases to the top of the queue', bg: '#fefce8', border: '#fde68a' },
                        { icon: '📋', title: 'Clinical Reports', desc: 'Hospital-grade printable A4 diagnostic records with e-Prescription support', bg: '#f0fdf4', border: '#a7f3d0' },
                        { icon: '💊', title: 'Patient Portal', desc: 'Medication reminders, multilingual AI chatbot, and awareness resources', bg: '#faf5ff', border: '#ddd6fe' },
                        { icon: '📂', title: 'Batch Screening', desc: 'Upload multiple retinal scans simultaneously and get individual Grad-CAM results for each', bg: '#fff7ed', border: '#fed7aa' },
                        { icon: '🌐', title: 'Multilingual Chatbot', desc: 'AI health assistant supports both English and Tamil for patient guidance', bg: '#f0fdf4', border: '#a7f3d0' },
                    ].map(f => (
                        <div key={f.title} style={{ background: f.bg, border: `1px solid ${f.border}`, borderRadius: 14, padding: '16px 18px', display: 'flex', gap: 12, alignItems: 'flex-start', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                            <div style={{ width: 36, height: 36, borderRadius: 9, background: '#fff', border: `1px solid ${f.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>{f.icon}</div>
                            <div>
                                <p style={{ fontWeight: 700, color: '#0f172a', fontSize: 13, marginBottom: 3 }}>{f.title}</p>
                                <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{f.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer description */}
                <div style={{ marginTop: 32, padding: '16px 20px', background: 'rgba(255,255,255,0.7)', border: '1px solid #e2e8f0', borderRadius: 12, maxWidth: 560 }}>
                    <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.7 }}>
                        <strong style={{ color: '#0f172a' }}>About VitalScreen AI:</strong> Built for eye camps and clinical environments, this system assists in mass screening of diabetic patients using a pre-trained EfficientNet deep learning model. Results are explainable via Grad-CAM, prioritized through automated triage, and delivered to both clinicians and patients through role-specific dashboards.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
