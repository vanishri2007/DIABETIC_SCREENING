import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const NAV = [
    { id:'history', label:'Medical History' },
    { id:'reminders', label:'Medication Reminders' },
    { id:'chatbot', label:'AI Health Assistant' },
    { id:'awareness', label:'Patient Awareness' },
];

const PatientDashboard = () => {
    const navigate = useNavigate();
    const patientId = localStorage.getItem('patient_id');
    const patientName = localStorage.getItem('patient_name') || 'Patient';

    const [patientDetails, setPatientDetails] = useState({ name:patientName, _id:patientId, age:'--', contact:'--', diabetes_duration_years:'--', triage_status:'Pending' });
    const [history, setHistory] = useState([]);
    const [reminders, setReminders] = useState([]);
    const [activeTab, setActiveTab] = useState('history');
    const [language, setLanguage] = useState('en');
    const [chatInput, setChatInput] = useState('');
    const [chatHistory, setChatHistory] = useState([{ sender:'bot', text:'Hello! I am your AI Health Assistant. How can I help you today?', time:new Date().toLocaleTimeString() }]);
    const [newReminder, setNewReminder] = useState({ time:'', medicine:'' });
    const [selectedReport, setSelectedReport] = useState(null);
    const chatEndRef = useRef(null);

    useEffect(() => {
        if (!patientId) return;
        fetch('/patients/').then(r=>r.json()).then(data=>{ const p=data.find(x=>x._id===patientId); if(p) setPatientDetails(p); }).catch(()=>{});
        fetch(`/screening/history/${patientId}`).then(r=>r.json()).then(setHistory).catch(()=>{});
        fetch(`/patients/${patientId}/reminders`).then(r=>r.json()).then(setReminders).catch(()=>{});
    }, [patientId]);

    useEffect(() => { chatEndRef.current?.scrollIntoView({behavior:'smooth'}); }, [chatHistory, activeTab]);

    const addReminder = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`/patients/${patientId}/reminders`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(newReminder)});
            if(res.ok){const data=await res.json();setReminders(data.reminders);setNewReminder({time:'',medicine:''});}
        } catch(e){}
    };

    const printReport = (record) => { setSelectedReport(record); setTimeout(()=>window.print(),200); };

    const downloadReport = (record) => {
        setSelectedReport(record);
        setTimeout(() => {
            const el = document.getElementById('patient-print-area');
            if(!el) return;
            el.style.display = 'block';
            window.html2pdf().from(el).set({
                margin: 0.5,
                filename: `My_Retinal_Report_${new Date(record.timestamp).getTime()}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
            }).save().then(() => { el.style.display = 'none'; setSelectedReport(null); });
        }, 300);
    };

    const speakText = (text, lang) => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        if (lang === 'ta') utterance.lang = 'ta-IN';
        else utterance.lang = 'en-US';
        window.speechSynthesis.speak(utterance);
    };

    const sendChat = async (e) => {
        e.preventDefault();
        if(!chatInput.trim()) return;
        const um = {sender:'user',text:chatInput,time:new Date().toLocaleTimeString()};
        setChatHistory(p=>[...p,um]); setChatInput('');
        try {
            const res = await fetch('/chatbot/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:um.text,language})});
            if(res.ok){
                const d=await res.json();
                setChatHistory(p=>[...p,{sender:'bot',text:d.response,time:new Date().toLocaleTimeString()}]);
                speakText(d.response, language);
            }
        } catch {setChatHistory(p=>[...p,{sender:'bot',text:'Connection error.',time:new Date().toLocaleTimeString()}]);}
    };

    const badgeStyle = (status) => {
        if (status === 'No DR') return { background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 6 };
        if (status === 'Mild DR') return { background: '#fefce8', color: '#ca8a04', border: '1px solid #fde047', fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 6 };
        if (status === 'Moderate DR') return { background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa', fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 6 };
        if (status === 'Severe DR') return { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 6 };
        if (status === '🚨 Proliferative DR') return { background: '#7f1d1d', color: '#fca5a5', border: '1px solid #f87171', fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 6 };
        return { background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 6 };
    };

    return (
        <div style={{minHeight:'100vh',display:'flex',fontFamily:'Inter,sans-serif',background:'#f0f4f8',color:'#0f172a'}}>
            {/* Sidebar */}
            <aside style={{width:268,background:'#1e293b',display:'flex',flexDirection:'column',flexShrink:0,position:'sticky',top:0,height:'100vh',boxShadow:'2px 0 12px rgba(0,0,0,0.1)'}}>
                {/* Logo + user */}
                <div style={{padding:'22px 18px 18px',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
                        <div style={{display:'flex',alignItems:'center',gap:10}}>
                            <img src="/logo.png" alt="VitalScreen Logo" style={{ height: 40, objectFit: 'contain' }} />
                        </div>
                        <button onClick={()=>{localStorage.clear();navigate('/');}} style={{padding:'6px 10px',borderRadius:6,background:'rgba(239,68,68,0.15)',border:'1px solid rgba(239,68,68,0.3)',color:'#fca5a5',fontWeight:700,fontSize:11,cursor:'pointer',transition:'all 0.1s'}}>Logout</button>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',background:'rgba(255,255,255,0.04)',borderRadius:10,border:'1px solid rgba(255,255,255,0.06)'}}>
                        <div style={{width:30,height:30,borderRadius:'50%',background:'linear-gradient(135deg,#334155,#475569)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0}}>👤</div>
                        <div>
                            <p style={{fontWeight:700,fontSize:13,color:'#e2e8f0',lineHeight:1.2}}>{patientName}</p>
                            <p style={{fontSize:10,color:'#10b981',fontWeight:700,marginTop:2}}>● Active Patient</p>
                        </div>
                    </div>
                </div>

                {/* Nav links */}
                <nav style={{flex:1,padding:'12px 10px',display:'flex',flexDirection:'column',gap:3}}>
                    {NAV.map(item=>(
                        <button key={item.id} onClick={()=>setActiveTab(item.id)}
                            style={{display:'flex',alignItems:'center',gap:11,padding:'11px 13px',borderRadius:10,fontWeight:600,fontSize:13,cursor:'pointer',transition:'all 0.12s',border:`1px solid ${activeTab===item.id?'#2563eb':'transparent'}`,background:activeTab===item.id?'#2563eb':'transparent',color:activeTab===item.id?'#ffffff':'#94a3b8',textAlign:'left',width:'100%',fontFamily:'Inter,sans-serif'}}>
                            {item.label}
                        </button>
                    ))}
                </nav>


            </aside>

            {/* Main Content */}
            <main style={{flex:1,overflowY:'auto'}}>
                {/* Topbar */}
                <div style={{padding:'16px 28px',background:'#fff',borderBottom:'1px solid #e2e8f0',position:'sticky',top:0,zIndex:10,boxShadow:'0 1px 4px rgba(0,0,0,0.05)'}}>
                    <h1 style={{fontSize:18,fontWeight:800,color:'#0f172a',letterSpacing:'-0.02em'}}>{NAV.find(n=>n.id===activeTab)?.label}</h1>
                    <p style={{fontSize:12,color:'#94a3b8',marginTop:2}}>Welcome, {patientName}</p>
                </div>

                <div style={{padding:28}}>
                    {/* HISTORY */}
                    {activeTab==='history'&&(
                        <div style={{display:'flex',flexDirection:'column',gap:14}}>
                            {/* AI REMINDER WIDGET */}
                            {history.length > 0 && (() => {
                                const latest = history[0];
                                let interval = '12 months'; let urgency = 'Routine'; let color = '#059669'; let bg = '#ecfdf5'; let border = '#a7f3d0'; let msg = 'Based on your recent No DR screening, standard annual checkups are sufficient.';
                                if (latest.prediction === 'Mild DR') { interval = '6 months'; urgency = 'Monitor'; color = '#ca8a04'; bg = '#fefce8'; border = '#fde047'; msg = 'Mild abnormalities detected. Follow-up screening recommended in 6 months to track progression.'; }
                                else if (latest.prediction === 'Moderate DR') { interval = '3 months'; urgency = 'Important'; color = '#ea580c'; bg = '#fff7ed'; border = '#fed7aa'; msg = 'Moderate DR requires closer attention. Next clinical assessment should be scheduled within 3 months.'; }
                                else if (latest.prediction === 'Severe DR' || latest.prediction === '🚨 Proliferative DR') { interval = 'Urgent (7 days)'; urgency = 'CRITICAL'; color = '#dc2626'; bg = '#fef2f2'; border = '#fecaca'; msg = 'High risk condition. Immediate surgical or pharmaceutical intervention is required to prevent vision loss.'; }
                                return (
                                    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 14, padding: 20, display: 'flex', gap: 16, alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: 8 }}>
                                        <div style={{ width: 46, height: 46, borderRadius: '50%', background: '#fff', border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>📅</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4 }}>
                                                <h3 style={{ fontWeight: 800, fontSize: 16, color: '#0f172a', letterSpacing: '-0.02em' }}>Automatic Screening Schedule</h3>
                                                <span style={{ background: '#fff', border: `1px solid ${border}`, color, fontSize: 10, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', padding: '3px 9px', borderRadius: 8 }}>{urgency}</span>
                                            </div>
                                            <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.5 }}>{msg}</p>
                                        </div>
                                        <div style={{ textAlign: 'right', borderLeft: `1px solid ${border}`, paddingLeft: 20 }}>
                                            <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Next Session Due</p>
                                            <p style={{ fontSize: 18, fontWeight: 900, color }}>{interval}</p>
                                        </div>
                                    </div>
                                );
                            })()}
                            {history.length>0 ? history.map((record,i)=>(
                                <div key={i} style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:14,padding:22,display:'grid',gridTemplateColumns:'130px 1fr',gap:18,alignItems:'center',boxShadow:'0 1px 4px rgba(0,0,0,0.05)',position:'relative'}}>
                                    <div style={{position:'absolute',top:16,right:16,display:'flex',gap:8}}>
                                        <button onClick={()=>printReport(record)} className="btn-ghost" style={{padding:'6px 13px',borderRadius:8,border:'1px solid #e2e8f0',background:'#f8fafc',fontSize:11}}>🖨 Print</button>
                                        <button onClick={()=>downloadReport(record)} className="btn-primary" style={{padding:'6px 13px',borderRadius:8,fontSize:11}}>📥 PDF</button>
                                    </div>
                                    <img src={record.heatmap_url} alt="Scan" style={{width:130,height:130,objectFit:'cover',borderRadius:10,border:'1px solid #e2e8f0'}} />
                                    <div>
                                        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
                                            <span style={{fontWeight:800,fontSize:16,color:'#0f172a'}}>Retinal Assessment</span>
                                            <span style={badgeStyle(record.status)}>{record.status}</span>
                                        </div>
                                        <p style={{fontSize:12,color:'#94a3b8',fontFamily:'monospace',marginBottom:12}}>{new Date(record.timestamp).toLocaleString()}</p>
                                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                                            {[['Diagnosis',record.prediction],['Confidence',`${(record.confidence*100).toFixed(1)}%`],['Secondary Findings',record.secondary_findings],['Affected Area',record.affected_area]].map(([k,v])=>(
                                                <div key={k} style={{background:'#f8fafc',borderRadius:8,padding:'9px 12px',border:'1px solid #e2e8f0'}}>
                                                    <p style={{fontSize:9,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:3}}>{k}</p>
                                                    <p style={{fontWeight:700,fontSize:13,color:'#0f172a'}}>{v}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div style={{background:'#fff',border:'1px dashed #e2e8f0',borderRadius:14,padding:'56px 32px',textAlign:'center',boxShadow:'0 1px 4px rgba(0,0,0,0.03)'}}>
                                    <div style={{fontSize:44,marginBottom:12,opacity:0.25}}>🔬</div>
                                    <p style={{fontWeight:700,color:'#64748b',fontSize:15}}>No screening history yet</p>
                                    <p style={{fontSize:13,color:'#94a3b8',marginTop:6}}>Your physician has not uploaded any retinal scans yet.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* REMINDERS */}
                    {activeTab==='reminders'&&(
                        <div>
                            <form onSubmit={addReminder} style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:14,padding:22,marginBottom:22,display:'flex',gap:14,flexWrap:'wrap',alignItems:'flex-end',boxShadow:'0 1px 4px rgba(0,0,0,0.04)'}}>
                                <div style={{display:'flex',flexDirection:'column',gap:5}}>
                                    <label style={{fontSize:11,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.06em'}}>Time</label>
                                    <input type="time" required value={newReminder.time} onChange={e=>setNewReminder({...newReminder,time:e.target.value})} className="input-field" style={{width:150}} />
                                </div>
                                <div style={{flex:1,minWidth:200,display:'flex',flexDirection:'column',gap:5}}>
                                    <label style={{fontSize:11,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.06em'}}>Medicine & Dosage</label>
                                    <input type="text" required placeholder="e.g. Metformin 500mg" value={newReminder.medicine} onChange={e=>setNewReminder({...newReminder,medicine:e.target.value})} className="input-field" />
                                </div>
                                <button type="submit" className="btn-primary" style={{padding:'11px 22px',whiteSpace:'nowrap'}}>+ Add Alarm</button>
                            </form>
                            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:14}}>
                                {reminders.length>0 ? reminders.map((rem,i)=>(
                                    <div key={i} style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:14,padding:'18px 20px',display:'flex',justifyContent:'space-between',alignItems:'center',boxShadow:'0 1px 4px rgba(0,0,0,0.04)'}}>
                                        <div>
                                            <p style={{fontSize:28,fontWeight:900,color:'#0f172a',letterSpacing:'-0.02em',lineHeight:1}}>{rem.time}</p>
                                            <p style={{fontSize:13,fontWeight:700,color:'#64748b',marginTop:7,textTransform:'uppercase',letterSpacing:'0.03em'}}>{rem.medicine}</p>
                                        </div>
                                        <span style={{fontSize:28}}>⏰</span>
                                    </div>
                                )) : (
                                    <div style={{gridColumn:'1/-1',padding:48,textAlign:'center',background:'#fff',border:'1px dashed #e2e8f0',borderRadius:14}}>
                                        <p style={{fontWeight:700,fontSize:15,color:'#64748b'}}>No medication alarms set yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* CHATBOT */}
                    {activeTab==='chatbot'&&(
                        <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:16,height:'72vh',display:'flex',flexDirection:'column',overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.05)'}}>
                            {/* Chat Header */}
                            <div style={{padding:'14px 20px',borderBottom:'1px solid #e2e8f0',display:'flex',justifyContent:'space-between',alignItems:'center',background:'#f8fafc'}}>
                                <div style={{display:'flex',alignItems:'center',gap:10}}>
                                    <img src="/logo.png" alt="AI Specialist" style={{width:32, height:32, objectFit:'contain'}} />
                                    <div>
                                        <p style={{fontWeight:800,fontSize:14,color:'#0f172a'}}>Voice AI Health Specialist</p>
                                        <p style={{fontSize:10,color:'#10b981',fontWeight:700}}>● Online & Listening</p>
                                    </div>
                                </div>
                                <button onClick={()=>{const nl=language==='en'?'ta':'en';setLanguage(nl);const mt=nl==='en'?'Switched to English. I can speak to you now!':'தமிழுக்கு மாற்றப்பட்டது. நான் இப்போ பேசமுடியும்.';setChatHistory([{sender:'bot',text:mt,time:new Date().toLocaleTimeString()}]);speakText(mt,nl);}} className="btn-ghost" style={{padding:'7px 14px',fontSize:12}}>
                                    {language==='en'?'Switch to Tamil':'Switch to English'}
                                </button>
                            </div>
                            {/* Messages */}
                            <div style={{flex:1,overflowY:'auto',padding:'20px 22px',display:'flex',flexDirection:'column',gap:14,background:'#f8fafc'}}>
                                {chatHistory.map((msg,i)=>(
                                    <div key={i} style={{display:'flex',justifyContent:msg.sender==='user'?'flex-end':'flex-start'}}>
                                        <div style={{maxWidth:'75%',padding:'11px 15px',borderRadius:msg.sender==='user'?'18px 18px 4px 18px':'18px 18px 18px 4px',background:msg.sender==='user'?'#2563eb':'#fff',border:msg.sender==='user'?'none':'1px solid #e2e8f0',color:msg.sender==='user'?'#fff':'#0f172a',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
                                            <p style={{fontSize:14,fontWeight:500,lineHeight:1.6}}>{msg.text}</p>
                                            <p style={{fontSize:10,marginTop:5,color:msg.sender==='user'?'rgba(255,255,255,0.6)':'#94a3b8',fontWeight:600,textAlign:msg.sender==='user'?'right':'left'}}>{msg.time}</p>
                                        </div>
                                    </div>
                                ))}
                                <div ref={chatEndRef} />
                            </div>
                            {/* Input */}
                            <form onSubmit={sendChat} style={{padding:'14px 18px',borderTop:'1px solid #e2e8f0',display:'flex',gap:10,background:'#fff'}}>
                                <input type="text" value={chatInput} onChange={e=>setChatInput(e.target.value)} placeholder={language==='en'?'Ask about medications, treatments or your condition…':'உங்கள் சிகிச்சை பற்றி கேளுங்கள்…'} className="input-field" style={{flex:1}} />
                                <button type="submit" className="btn-primary" style={{flexShrink:0,padding:'11px 18px'}}>Send ➤</button>
                            </form>
                        </div>
                    )}

                    {/* AWARENESS */}
                    {activeTab==='awareness'&&(
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:18}}>
                            {/* Video */}
                            <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:14,padding:18,gridColumn:'1/-1',boxShadow:'0 1px 4px rgba(0,0,0,0.04)'}}>
                                <p style={{fontSize:11,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:12}}>Educational Video</p>
                                <div style={{width:'100%',paddingTop:'40%',position:'relative',background:'#000',borderRadius:10,overflow:'hidden'}}>
                                    <iframe src="https://www.youtube.com/embed/Iwblzf7Xa0U?rel=0" title="Diabetic Retinopathy" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{position:'absolute',top:0,left:0,width:'100%',height:'100%'}} />
                                </div>
                                <p style={{fontWeight:700,fontSize:15,color:'#0f172a',marginTop:13}}>Understanding Laser Therapy for Diabetic Retinopathy</p>
                                <p style={{fontSize:13,color:'#64748b',marginTop:4,lineHeight:1.5}}>Educational guide explaining why laser photocoagulation is safe and effective for diabetic retinopathy patients.</p>
                            </div>
                            {/* Success stories */}
                            {[{name:'Rajesh K.',tag:'Severe DR Survivor',quote:'I was terrified of eye injections, but the AI caught my DR early. Treatment was very quick and I retained my full vision. Don\'t let fear delay the prescription!',bg:'#eff6ff',border:'#bfdbfe',tagColor:'#2563eb'},
                              {name:'Meena P.',tag:'Maintained Perfect Vision',quote:'By strictly following the medication alarms generated by this app, my retina healed flawlessly. Modern medicine is a miracle — trust the process completely.',bg:'#f0fdf4',border:'#a7f3d0',tagColor:'#059669'}
                            ].map(s=>(
                                <div key={s.name} style={{background:s.bg,border:`1px solid ${s.border}`,borderRadius:14,padding:22,boxShadow:'0 1px 4px rgba(0,0,0,0.04)'}}>
                                    <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:14}}>
                                        <div style={{width:42,height:42,borderRadius:'50%',background:'#fff',border:`1px solid ${s.border}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>👤</div>
                                        <div>
                                            <p style={{fontWeight:800,fontSize:14,color:'#0f172a'}}>{s.name}</p>
                                            <p style={{fontSize:10,color:s.tagColor,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.05em',marginTop:2}}>{s.tag}</p>
                                        </div>
                                    </div>
                                    <p style={{fontSize:14,color:'#475569',lineHeight:1.7,fontStyle:'italic'}}>"{s.quote}"</p>
                                    <div style={{marginTop:14,display:'flex',gap:2}}>{'★★★★★'.split('').map((c,i)=><span key={i} style={{color:'#f59e0b',fontSize:16}}>{c}</span>)}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Print block */}
            {selectedReport&&(
                <div id="patient-print-area" style={{display:'none'}} className="print-only">
                    <div style={{padding:48,background:'#fff',color:'#111',fontFamily:'Georgia,serif'}}>
                        <div style={{display:'flex',justifyContent:'space-between',borderBottom:'3px solid #1d2d50',paddingBottom:20,marginBottom:24}}>
                            <div><h1 style={{fontSize:26,fontWeight:900,color:'#1d2d50'}}>VITAL EYE CARE</h1><p style={{fontSize:11,color:'#999',marginTop:4}}>123 Health Avenue · +1 800-EYE-CARE</p></div>
                            <div style={{textAlign:'right'}}><p style={{fontWeight:800,fontSize:13,color:'#1d2d50'}}>PATIENT DIAGNOSTIC COPY</p><p style={{fontSize:12,color:'#555',marginTop:4}}>{new Date(selectedReport.timestamp).toLocaleDateString()}</p></div>
                        </div>
                        <table style={{width:'100%',borderCollapse:'collapse',marginBottom:24,fontSize:13}}><tbody>
                            <tr style={{background:'#f8f9fa'}}><td style={{padding:'8px 12px',fontWeight:700,color:'#555',border:'1px solid #e0e0e0',width:'25%'}}>Name</td><td style={{padding:'8px 12px',border:'1px solid #e0e0e0'}}>{patientDetails.name}</td><td style={{padding:'8px 12px',fontWeight:700,color:'#555',border:'1px solid #e0e0e0',width:'25%'}}>Age</td><td style={{padding:'8px 12px',border:'1px solid #e0e0e0'}}>{patientDetails.age} yrs</td></tr>
                            <tr><td style={{padding:'8px 12px',fontWeight:700,color:'#555',border:'1px solid #e0e0e0'}}>Contact</td><td style={{padding:'8px 12px',border:'1px solid #e0e0e0'}}>{patientDetails.contact}</td><td style={{padding:'8px 12px',fontWeight:700,color:'#555',border:'1px solid #e0e0e0'}}>Diabetes Duration</td><td style={{padding:'8px 12px',border:'1px solid #e0e0e0'}}>{patientDetails.diabetes_duration_years} years</td></tr>
                        </tbody></table>
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:32,marginBottom:24}}>
                            <div>
                                <h2 style={{fontSize:11,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.07em',color:'#1d2d50',borderLeft:'4px solid #1d2d50',paddingLeft:10,marginBottom:14}}>Diagnosis Result</h2>
                                <div style={{padding:16,background:selectedReport.prediction==='No DR'?'#f0fdf4':'#fef2f2',border:`2px solid ${selectedReport.prediction==='No DR'?'#86efac':'#fca5a5'}`,borderRadius:8,textAlign:'center',marginBottom:14}}><p style={{fontSize:18,fontWeight:900,textTransform:'uppercase',color:selectedReport.prediction==='No DR'?'#166534':'#991b1b'}}>{selectedReport.prediction}</p></div>
                                {[['Confidence',`${(selectedReport.confidence*100).toFixed(1)}%`],['Secondary Findings',selectedReport.secondary_findings],['Affected Area',selectedReport.affected_area]].map(([k,v])=><p key={k} style={{fontSize:12,borderBottom:'1px solid #eee',padding:'7px 0'}}><strong style={{color:'#555',display:'inline-block',width:'45%'}}>{k}</strong>{v}</p>)}
                            </div>
                            <div>
                                <h2 style={{fontSize:11,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.07em',color:'#1d2d50',borderLeft:'4px solid #1d2d50',paddingLeft:10,marginBottom:14}}>Grad-CAM Heatmap</h2>
                                <img src={selectedReport.heatmap_url} alt="Heatmap" style={{width:'100%',maxHeight:220,objectFit:'contain',border:'1px solid #e0e0e0',borderRadius:8}} />
                            </div>
                        </div>
                        <div style={{marginTop:60,display:'flex',justifyContent:'space-around',paddingTop:18,borderTop:'1px solid #e0e0e0'}}>
                            <div style={{textAlign:'center'}}><div style={{borderTop:'1px solid #111',paddingTop:8,width:200,fontSize:11,fontWeight:700,letterSpacing:'0.05em'}}>ATTENDING PHYSICIAN</div></div>
                            <div style={{textAlign:'center'}}><div style={{borderTop:'1px solid #111',paddingTop:8,width:200,fontSize:11,fontWeight:700,letterSpacing:'0.05em'}}>AI SYSTEM VALIDATION</div></div>
                        </div>
                        <div style={{ marginTop: 24, padding: 16, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                            <p style={{ fontSize: 9, color: '#64748b', lineHeight: 1.6, textAlign: 'justify' }}>
                                <strong>CLINICAL DISCLAIMER:</strong> This analytical report was generated using the VitalScreen AI Diabetic Retinopathy prediction model. The insights and Grad-CAM neural network visual overlays are intended as advanced decision-support tools for clinicians and do not conclusively replace a comprehensive dilated fundus examination by a certified ophthalmologist. Clinical correlation is mandatory before initiating surgical, laser, or pharmaceutical interventions. VitalScreen AI assumes no liability for diagnoses made solely on the basis of this automated screening report.
                            </p>
                        </div>
                    </div>
                </div>
            )}
            <style>{`@media print { .no-print { display: none !important; } .print-only { display: block !important; } @page { size: auto; margin: 0; } }`}</style>
        </div>
    );
};

export default PatientDashboard;
