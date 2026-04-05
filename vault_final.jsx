import { useState, useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import {
  LayoutDashboard, TrendingUp, HandCoins, Calculator, Settings, Plus, Check,
  Clock, DollarSign, ArrowUpRight, ArrowDownRight, X, ChevronLeft, ChevronRight,
  Wallet, PiggyBank, Users, Landmark, Briefcase, Receipt, Banknote, Trash2,
  Bell, Activity, RefreshCw, ChevronRight as ChevR, BarChart3, FolderOpen,
  Split, AlertCircle, UserCheck, Timer, Infinity as InfinityIcon, MapPin
} from "lucide-react";

const T={bg:"#030507",card:"rgba(12,16,24,0.85)",border:"rgba(255,255,255,0.06)",accent:"#00e8b0",red:"#ff3b5c",yellow:"#ffbe0b",purple:"#a855f7",blue:"#3b82f6",orange:"#ff6b35",text:"#edf0f7",textSec:"#7a839e",textMut:"#3a4058",grad1:"linear-gradient(135deg,#00e8b0,#00b4d8)"};
const PC=["#00e8b0","#3b82f6","#ff6b35","#a855f7","#ffbe0b","#ff3b5c","#06b6d4","#f472b6","#84cc16"];
const toINR=(u,r=83.5)=>u*r, toUSD=(i,r=83.5)=>i/r;
const fmt=(n,c="USD")=>c==="INR"?`₹${n.toLocaleString("en-IN",{maximumFractionDigits:0})}`:`$${n.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const daysUntil=d=>{const t=new Date(),a=new Date(t.getFullYear(),t.getMonth(),d),b=new Date(t.getFullYear(),t.getMonth()+1,d);return Math.ceil(((a>=t?a:b)-t)/864e5)};
const daysSince=ds=>{const d=new Date(ds);return Math.floor((new Date()-d)/864e5)};
const cats=["Food","Transport","Shopping","Entertainment","Health","Education","Other"];
const mNames=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const sty=document.createElement("style");
sty.textContent=`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
*{box-sizing:border-box;scrollbar-width:thin;scrollbar-color:#1a1f30 transparent}::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#1a1f30;border-radius:3px}
@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}@keyframes slideR{from{opacity:0;transform:translateX(-16px)}to{opacity:1;transform:translateX(0)}}
.glass{background:rgba(12,16,24,0.85);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,0.06)}.glass:hover{border-color:rgba(255,255,255,0.1)}
.c3d{transition:all .3s cubic-bezier(.175,.885,.32,1.275)}.c3d:hover{transform:translateY(-4px);box-shadow:0 14px 40px rgba(0,0,0,.4);border-color:rgba(255,255,255,.1)}
.ni{transition:all .2s;position:relative}.ni::before{content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);width:3px;height:0;background:linear-gradient(180deg,#00e8b0,#00b4d8);border-radius:2px;transition:height .25s}.ni.act::before{height:55%}`;
if(!document.querySelector("[data-vlt]")){sty.setAttribute("data-vlt","");document.head.appendChild(sty)}

// ── STORAGE ──
function useStore(key,init){const[data,setData]=useState(init);const[loaded,setLoaded]=useState(false);
useEffect(()=>{(async()=>{try{const r=await window.storage.get(key);if(r&&r.value)setData(JSON.parse(r.value))}catch{}setLoaded(true)})()},[key]);
const update=useCallback(fn=>{setData(prev=>{const next=typeof fn==="function"?fn(prev):fn;(async()=>{try{await window.storage.set(key,JSON.stringify(next))}catch{}})();return next})},[key]);
return[data,update,loaded]}

const tip={contentStyle:{background:"rgba(20,25,40,0.95)",border:"1px solid rgba(0,232,176,0.3)",borderRadius:12,color:"#edf0f7",fontSize:13,fontFamily:"'JetBrains Mono'",padding:"10px 16px",boxShadow:"0 12px 40px rgba(0,0,0,.5)"},itemStyle:{color:"#edf0f7"},labelStyle:{color:"#7a839e"}};

// ── SHARED COMPONENTS ──
function GC({children,style,delay=0,hover=true}){return <div className={`glass ${hover?"c3d":""}`} style={{borderRadius:16,padding:22,animation:`fadeUp .5s ease ${delay}s both`,boxShadow:"0 0 30px rgba(0,232,176,.03)",...style}}>{children}</div>}
function Badge({days}){const c=days<=2?T.red:days<=5?T.yellow:T.accent;return <span style={{background:c+"18",color:c,padding:"3px 11px",borderRadius:20,fontSize:10,fontWeight:700,border:`1px solid ${c}33`}}>{days===0?"TODAY":days===1?"TMR":`${days}d`}</span>}
function Metric({icon:Ic,label,value,sub,color=T.accent,delay=0}){return <GC style={{flex:"1 1 195px",minWidth:180}} delay={delay}><div style={{background:color+"14",borderRadius:11,padding:9,display:"inline-flex",border:`1px solid ${color}22`}}><Ic size={17} color={color}/></div><div style={{marginTop:14,fontSize:24,fontWeight:700,color:T.text,letterSpacing:"-1px",fontFamily:"'JetBrains Mono'"}}>{value}</div><div style={{fontSize:12,color:T.textSec,marginTop:3}}>{label}</div>{sub&&<div style={{fontSize:11,color:T.textMut,marginTop:2,fontFamily:"'JetBrains Mono'"}}>{sub}</div>}</GC>}
function Ctr({value,prefix="$"}){const[d,setD]=useState(0);const rf=useRef();useEffect(()=>{let s=0;const end=typeof value==="number"?value:0;const step=ts=>{if(!s)s=ts;const p=Math.min((ts-s)/1000,1);setD((1-Math.pow(1-p,3))*end);if(p<1)rf.current=requestAnimationFrame(step)};rf.current=requestAnimationFrame(step);return()=>cancelAnimationFrame(rf.current)},[value]);return <span>{prefix}{d.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}</span>}
function Modal({open,onClose,title,children}){if(!open)return null;return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(10px)"}} onClick={onClose}><div onClick={e=>e.stopPropagation()} className="glass" style={{borderRadius:18,padding:28,width:"92%",maxWidth:480,maxHeight:"85vh",overflow:"auto",animation:"fadeUp .25s ease",boxShadow:"0 30px 80px rgba(0,0,0,.5)"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}><h3 style={{fontFamily:"'DM Sans'",color:T.text,fontSize:18,fontWeight:700,margin:0}}>{title}</h3><button onClick={onClose} style={{background:"rgba(255,255,255,.06)",border:"none",color:T.textSec,cursor:"pointer",borderRadius:9,padding:7,display:"flex"}}><X size={17}/></button></div>{children}</div></div>}
function Inp({label,value,onChange,type="text",options,placeholder}){const s={width:"100%",padding:"11px 15px",background:"rgba(255,255,255,.04)",border:`1px solid ${T.border}`,borderRadius:9,color:T.text,fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"'DM Sans'"};return <div style={{marginBottom:14}}><label style={{display:"block",fontSize:10,color:T.textSec,marginBottom:5,fontWeight:600,letterSpacing:"1px",textTransform:"uppercase"}}>{label}</label>{options?<select value={value} onChange={e=>onChange(e.target.value)} style={{...s,cursor:"pointer"}}>{options.map(o=><option key={o.value||o} value={o.value||o}>{o.label||o}</option>)}</select>:<input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={s}/>}</div>}
function Btn({children,onClick,variant="primary",small,style:sx}){const b={primary:{background:T.grad1,color:"#030507"},danger:{background:T.red+"22",color:T.red,border:`1px solid ${T.red}33`},ghost:{background:"rgba(255,255,255,.04)",color:T.textSec,border:`1px solid ${T.border}`},success:{background:T.accent+"18",color:T.accent,border:`1px solid ${T.accent}33`}};return <button onClick={onClick} style={{...b[variant],border:b[variant].border||"none",borderRadius:9,padding:small?"6px 14px":"11px 22px",fontSize:small?11:13,cursor:"pointer",display:"flex",alignItems:"center",gap:6,fontWeight:700,fontFamily:"'DM Sans'",transition:"all .3s",...sx}}>{children}</button>}

// ── 3D DONUT ──
function ThreeDonut({segments,height=230}){const ref=useRef(),raf=useRef();useEffect(()=>{if(!ref.current||!segments.length)return;const w=ref.current.clientWidth,h=height;const scene=new THREE.Scene();const cam=new THREE.PerspectiveCamera(40,w/h,0.1,100);cam.position.set(0,4,6);cam.lookAt(0,0,0);const r=new THREE.WebGLRenderer({antialias:true,alpha:true});r.setSize(w,h);r.setPixelRatio(Math.min(window.devicePixelRatio,2));r.setClearColor(0x000000,0);ref.current.innerHTML="";ref.current.appendChild(r.domElement);scene.add(new THREE.AmbientLight(0xffffff,0.5));const dl=new THREE.DirectionalLight(0xffffff,0.7);dl.position.set(3,5,3);scene.add(dl);scene.add(new THREE.PointLight(0x00e8b0,0.4,20));const total=segments.reduce((s,x)=>s+x.value,0);const cols=[0x00e8b0,0x3b82f6,0xff6b35,0xa855f7,0xffbe0b,0xff3b5c,0x06b6d4];let sa=0;const grp=new THREE.Group();segments.forEach((seg,i)=>{if(seg.value<=0)return;const ang=(seg.value/total)*Math.PI*2;const shape=new THREE.Shape();for(let j=0;j<=32;j++){const a=sa+(j/32)*ang;shape.lineTo(Math.cos(a)*2.2,Math.sin(a)*2.2)}for(let j=32;j>=0;j--){const a=sa+(j/32)*ang;shape.lineTo(Math.cos(a)*1.2,Math.sin(a)*1.2)}shape.closePath();const geo=new THREE.ExtrudeGeometry(shape,{depth:0.5,bevelEnabled:true,bevelThickness:0.04,bevelSize:0.04,bevelSegments:2});const mat=new THREE.MeshPhongMaterial({color:cols[i%cols.length],transparent:true,opacity:0.88,emissive:cols[i%cols.length],emissiveIntensity:0.1,shininess:60});const mesh=new THREE.Mesh(geo,mat);mesh.rotation.x=-Math.PI/2;grp.add(mesh);sa+=ang});scene.add(grp);let a=0;const anim=()=>{raf.current=requestAnimationFrame(anim);a+=0.005;grp.rotation.y=a;r.render(scene,cam)};anim();return()=>{cancelAnimationFrame(raf.current);r.dispose()}},[segments,height]);return <div ref={ref} style={{width:"100%",height,borderRadius:14,overflow:"hidden"}}/>}

function ThreeScene({data,height=240}){const ref=useRef(),raf=useRef();useEffect(()=>{if(!ref.current||!data.length)return;const w=ref.current.clientWidth,h=height;const scene=new THREE.Scene();const cam=new THREE.PerspectiveCamera(45,w/h,0.1,1000);cam.position.set(8,6,12);cam.lookAt(0,1,0);const r=new THREE.WebGLRenderer({antialias:true,alpha:true});r.setSize(w,h);r.setPixelRatio(Math.min(window.devicePixelRatio,2));r.setClearColor(0x000000,0);ref.current.innerHTML="";ref.current.appendChild(r.domElement);scene.add(new THREE.AmbientLight(0xffffff,0.4));const dl=new THREE.DirectionalLight(0xffffff,0.8);dl.position.set(5,8,5);scene.add(dl);const gm=new THREE.MeshBasicMaterial({color:0x0a1020,wireframe:true,transparent:true,opacity:0.25});const grid=new THREE.Mesh(new THREE.PlaneGeometry(16,16,16,16),gm);grid.rotation.x=-Math.PI/2;scene.add(grid);const cols=[0x00e8b0,0x3b82f6,0xff6b35,0xa855f7,0xffbe0b,0x00b4d8];const max=Math.max(...data.map(d=>d.value),1);data.forEach((d,i)=>{const bh=(d.value/max)*4.5;const geo=new THREE.BoxGeometry(0.8,bh,0.8);const mat=new THREE.MeshPhongMaterial({color:cols[i%cols.length],transparent:true,opacity:0.85,emissive:cols[i%cols.length],emissiveIntensity:0.12,shininess:80});const bar=new THREE.Mesh(geo,mat);bar.position.set((i-data.length/2)*1.6+0.8,bh/2,0);scene.add(bar);const eg=new THREE.LineSegments(new THREE.EdgesGeometry(geo),new THREE.LineBasicMaterial({color:cols[i%cols.length],transparent:true,opacity:0.35}));eg.position.copy(bar.position);scene.add(eg)});let angle=0;const anim=()=>{raf.current=requestAnimationFrame(anim);angle+=0.003;cam.position.x=12*Math.sin(angle);cam.position.z=12*Math.cos(angle);cam.lookAt(0,1.5,0);r.render(scene,cam)};anim();return()=>{cancelAnimationFrame(raf.current);r.dispose()}},[data,height]);return <div ref={ref} style={{width:"100%",height,borderRadius:14,overflow:"hidden"}}/>}

// ── ARC REACTOR ──
function ArcReactor({config,expenses,payments,lending}){const[anim,setAnim]=useState(0);const rf=useRef();const r=config.exchangeRate;const sipUSD=config.sips.reduce((s,x)=>s+toUSD(x.amountINR,r),0);const fixedT=config.rent+sipUSD+toUSD(config.studentLoan.amountINR,r)+config.subscriptions.reduce((s,x)=>s+x.amount,0);const varT=expenses.reduce((s,e)=>s+(e.currency==="USD"?e.amount:toUSD(e.amount,r)),0);const rem=config.salary-fixedT-varT;const savS=Math.min(((rem/Math.max(config.salary,1))*100)/50,1)*30;const paidC=Object.values(payments).filter(Boolean).length;const totalA=config.sips.length+config.cards.length+1;const payS=(paidC/Math.max(totalA,1))*30;const pendL=lending.filter(l=>!l.settled).reduce((s,l)=>s+(l.currency==="USD"?l.amount:toUSD(l.amount,r)),0);const lendS=Math.max(0,20-(pendL/Math.max(config.salary,1))*40);const loanP=config.studentLoan.totalRemaining>0?1-(config.studentLoan.totalRemaining/2000000):1;const loanS=Math.max(0,loanP*20);const health=Math.min(Math.round(savS+payS+lendS+loanS),100);const color=health>=70?T.accent:health>=40?T.yellow:T.red;
useEffect(()=>{let s=0;const step=ts=>{if(!s)s=ts;const p=Math.min((ts-s)/1500,1);setAnim(1-Math.pow(1-p,3));if(p<1)rf.current=requestAnimationFrame(step)};rf.current=requestAnimationFrame(step);return()=>cancelAnimationFrame(rf.current)},[health]);
const sz=160,cx=sz/2,cy=sz/2,r1=64,r2=54,c1=2*Math.PI*r1,c2=2*Math.PI*r2;
return <GC style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"16px 12px",minWidth:180}} delay={0.2}><div style={{fontSize:9,color:T.textSec,fontWeight:700,letterSpacing:"2px",textTransform:"uppercase",marginBottom:8}}>HEALTH</div><div style={{position:"relative",width:sz,height:sz}}><svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`}><circle cx={cx} cy={cy} r={r1} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="5"/><circle cx={cx} cy={cy} r={r1} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" strokeDasharray={c1} strokeDashoffset={c1*(1-(health/100)*anim)} transform={`rotate(-90 ${cx} ${cy})`} style={{filter:`drop-shadow(0 0 6px ${color}66)`}}/><circle cx={cx} cy={cy} r={r2} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="3"/><circle cx={cx} cy={cy} r={r2} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" opacity="0.4" strokeDasharray={c2} strokeDashoffset={c2*(1-(health/100)*anim*0.85)} transform={`rotate(-90 ${cx} ${cy})`}/><circle cx={cx} cy={cy} r="4" fill={color} opacity="0.6" style={{filter:`drop-shadow(0 0 6px ${color})`}}><animate attributeName="opacity" values="0.4;0.8;0.4" dur="2s" repeatCount="indefinite"/></circle>{Array.from({length:24}).map((_,i)=>{const a=((i/24)*360-90)*Math.PI/180;return <line key={i} x1={cx+(r1+4)*Math.cos(a)} y1={cy+(r1+4)*Math.sin(a)} x2={cx+(r1+8)*Math.cos(a)} y2={cy+(r1+8)*Math.sin(a)} stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>})}</svg><div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}><div style={{fontSize:30,fontWeight:700,color:T.text,fontFamily:"'JetBrains Mono'",letterSpacing:"-2px"}}>{Math.round(health*anim)}</div><div style={{fontSize:8,color:T.textMut,fontWeight:600,letterSpacing:"1px"}}>/ 100</div></div></div><div style={{fontSize:10,color,fontWeight:600,marginTop:6,fontFamily:"'JetBrains Mono'"}}>{health>=70?"OPTIMAL":health>=40?"MODERATE":"CRITICAL"}</div></GC>}

// ── JARVIS GREETING ──
function Greeting({config,expenses,payments,lending}){
  const hour=new Date().getHours();const tg=hour<12?"Good morning":hour<17?"Good afternoon":"Good evening";
  const r=config.exchangeRate;const sipUSD=config.sips.reduce((s,x)=>s+toUSD(x.amountINR,r),0);const fixedT=config.rent+sipUSD+toUSD(config.studentLoan.amountINR,r)+config.subscriptions.reduce((s,x)=>s+x.amount,0);const varT=expenses.reduce((s,e)=>s+(e.currency==="USD"?e.amount:toUSD(e.amount,r)),0);const rem=config.salary-fixedT-varT;const sr=((rem/Math.max(config.salary,1))*100).toFixed(1);
  const paidC=Object.values(payments).filter(Boolean).length;const totalA=config.sips.length+config.cards.length+1;const pendL=lending.filter(l=>!l.settled);
  const alerts=[...config.cards.map(c=>({label:c.name,days:daysUntil(c.dueDate)})),...config.sips.map(s=>({label:s.name,days:daysUntil(s.date)}))];const urgent=alerts.filter(a=>a.days<=3);
  // Timed lending reminders
  const timedReminders=pendL.filter(l=>l.delayType==="timed"&&daysSince(l.date)>=14);

  let status="All systems nominal, boss.";let sc=T.accent;
  if(parseFloat(sr)<20){status="Warning: Low savings, sir. Monitor closely.";sc=T.red}
  else if(parseFloat(sr)<40){status="Systems stable, boss. Keep an eye on spending.";sc=T.yellow}

  let ctx="";
  if(urgent.length>0)ctx=`${urgent[0].label} due in ${urgent[0].days}d. `;
  if(timedReminders.length>0)ctx+=`${timedReminders.length} lending reminder${timedReminders.length>1?"s":""}. `;
  ctx+=`${paidC}/${totalA} actions done.`;

  return <GC style={{marginBottom:18,padding:"20px 24px",borderLeft:`3px solid ${sc}`,background:`linear-gradient(135deg,${sc}08,transparent)`}} hover={false} delay={0}>
    <div style={{fontSize:9,color:sc,fontWeight:700,letterSpacing:"3px",fontFamily:"'JetBrains Mono'"}}>SYSTEM ACTIVE</div>
    <div style={{fontSize:20,fontWeight:700,color:T.text,marginTop:8}}>{tg}, <span style={{background:T.grad1,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>boss</span>.</div>
    <div style={{fontSize:13,color:T.textSec,marginTop:6,lineHeight:1.5}}>Savings at <span style={{color:sc,fontWeight:600,fontFamily:"'JetBrains Mono'"}}>{sr}%</span>. {ctx}</div>
    <div style={{fontSize:11,color:sc,marginTop:8,fontWeight:600,fontFamily:"'JetBrains Mono'"}}>● {status}</div>
  </GC>;
}

// ── SPLIT SECTION ──
function SplitPage({config,splits,updateSplits}){
  const[showAdd,setShowAdd]=useState(false);const[showPerson,setShowPerson]=useState(false);
  const[form,setForm]=useState({desc:"",amount:"",paidBy:"me",splitWith:[],date:new Date().toISOString().split("T")[0]});
  const[newPerson,setNewPerson]=useState("");
  const people=splits.people||[];const txns=splits.transactions||[];

  const addPerson=()=>{if(!newPerson)return;updateSplits(p=>({...p,people:[...(p.people||[]),newPerson]}));setNewPerson("");setShowPerson(false)};
  const addTxn=()=>{if(!form.desc||!form.amount||form.splitWith.length===0)return;
    const t={id:Date.now(),desc:form.desc,amount:parseFloat(form.amount),paidBy:form.paidBy,splitWith:["me",...form.splitWith],date:form.date};
    updateSplits(p=>({...p,transactions:[...(p.transactions||[]),t]}));
    setForm({desc:"",amount:"",paidBy:"me",splitWith:[],date:new Date().toISOString().split("T")[0]});setShowAdd(false)};
  const delTxn=id=>updateSplits(p=>({...p,transactions:(p.transactions||[]).filter(t=>t.id!==id)}));

  // Calculate balances
  const balances={};
  people.forEach(p=>{balances[p]=0});
  txns.forEach(tx=>{
    const share=tx.amount/tx.splitWith.length;
    tx.splitWith.forEach(person=>{
      if(person===tx.paidBy)return;
      if(tx.paidBy==="me"){balances[person]=(balances[person]||0)+share}// they owe me
      else if(person==="me"){balances[tx.paidBy]=(balances[tx.paidBy]||0)-share}// I owe them
      else if(tx.paidBy!=="me"&&person!=="me"){/* between others */}
    });
  });

  const theyOweMe=Object.entries(balances).filter(([_,v])=>v>0);
  const iOweThem=Object.entries(balances).filter(([_,v])=>v<0);

  const toggleSplitWith=(p)=>{setForm(f=>({...f,splitWith:f.splitWith.includes(p)?f.splitWith.filter(x=>x!==p):[...f.splitWith,p]}))};

  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}><h2 style={{fontFamily:"'DM Sans'",color:T.text,fontSize:21,fontWeight:700,margin:0}}>Split</h2>
      <div style={{display:"flex",gap:8}}><Btn small variant="ghost" onClick={()=>setShowPerson(true)}><Users size={13}/> Add Person</Btn><Btn small onClick={()=>setShowAdd(true)}><Plus size={13}/> Add Bill</Btn></div>
    </div>

    {people.length===0?<GC><div style={{padding:30,textAlign:"center",color:T.textMut,fontSize:13}}>Add your roommates or friends first, boss.</div></GC>:
    <>
      {/* BALANCE SUMMARY */}
      <div style={{display:"flex",gap:14,marginBottom:20,flexWrap:"wrap"}}>
        {theyOweMe.length>0&&<GC style={{flex:"1 1 300px"}} delay={.04}>
          <h3 style={{color:T.accent,fontSize:12,fontWeight:700,margin:"0 0 14px",letterSpacing:"1px"}}>THEY OWE YOU, BOSS</h3>
          {theyOweMe.map(([name,amt])=> <div key={name} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${T.border}`}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:32,height:32,borderRadius:"50%",background:T.accent+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:T.accent}}>{name[0]}</div><span style={{fontSize:13,color:T.text,fontWeight:600}}>{name}</span></div>
            <span style={{fontSize:14,fontWeight:700,color:T.accent,fontFamily:"'JetBrains Mono'"}}>{fmt(amt)}</span>
          </div>)}
        </GC>}
        {iOweThem.length>0&&<GC style={{flex:"1 1 300px"}} delay={.08}>
          <h3 style={{color:T.red,fontSize:12,fontWeight:700,margin:"0 0 14px",letterSpacing:"1px"}}>YOU OWE, SIR</h3>
          {iOweThem.map(([name,amt])=> <div key={name} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${T.border}`}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:32,height:32,borderRadius:"50%",background:T.red+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:T.red}}>{name[0]}</div><span style={{fontSize:13,color:T.text,fontWeight:600}}>{name}</span></div>
            <span style={{fontSize:14,fontWeight:700,color:T.red,fontFamily:"'JetBrains Mono'"}}>{fmt(Math.abs(amt))}</span>
          </div>)}
        </GC>}
        {theyOweMe.length===0&&iOweThem.length===0&&<GC style={{flex:1}}><div style={{padding:20,textAlign:"center",color:T.textMut,fontSize:12}}>All settled, boss. No pending splits.</div></GC>}
      </div>

      {/* PEOPLE */}
      <GC style={{marginBottom:18}} delay={.12} hover={false}>
        <h3 style={{color:T.text,fontSize:13,fontWeight:600,margin:"0 0 12px"}}>People</h3>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {people.map(p=> <div key={p} style={{display:"flex",alignItems:"center",gap:6,background:"rgba(255,255,255,.03)",borderRadius:10,padding:"8px 14px",border:`1px solid ${T.border}`}}>
            <span style={{fontSize:12,color:T.text,fontWeight:500}}>{p}</span>
            <button onClick={()=>updateSplits(prev=>({...prev,people:prev.people.filter(x=>x!==p)}))} style={{background:"none",border:"none",cursor:"pointer",color:T.textMut,display:"flex"}}><X size={12}/></button>
          </div>)}
        </div>
      </GC>

      {/* TRANSACTIONS */}
      <GC hover={false} delay={.16}>
        <h3 style={{color:T.text,fontSize:13,fontWeight:600,margin:"0 0 14px"}}>Recent Splits</h3>
        {txns.length===0?<div style={{padding:20,textAlign:"center",color:T.textMut,fontSize:12}}>No splits yet</div>:
        txns.slice().reverse().map(tx=> <div key={tx.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:`1px solid ${T.border}`}}>
          <div><div style={{fontSize:13,color:T.text,fontWeight:600}}>{tx.desc}</div><div style={{fontSize:10,color:T.textMut}}>Paid by {tx.paidBy==="me"?"you":tx.paidBy} · Split {tx.splitWith.length} ways · {tx.date}</div></div>
          <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:13,fontWeight:700,color:T.orange,fontFamily:"'JetBrains Mono'"}}>{fmt(tx.amount)}</span><button onClick={()=>delTxn(tx.id)} style={{background:"none",border:"none",cursor:"pointer",color:T.textMut}}><Trash2 size={12}/></button></div>
        </div>)}
      </GC>
    </>}

    <Modal open={showPerson} onClose={()=>setShowPerson(false)} title="Add Person">
      <Inp label="Name" value={newPerson} onChange={setNewPerson} placeholder="e.g. Raj, Alex"/>
      <Btn onClick={addPerson} style={{width:"100%",justifyContent:"center"}}><Plus size={14}/> Add</Btn>
    </Modal>
    <Modal open={showAdd} onClose={()=>setShowAdd(false)} title="Split a Bill">
      <Inp label="What" value={form.desc} onChange={v=>setForm(p=>({...p,desc:v}))} placeholder="WiFi, dinner, etc"/>
      <Inp label="Total Amount ($)" value={form.amount} onChange={v=>setForm(p=>({...p,amount:v}))} type="number"/>
      <Inp label="Who Paid?" value={form.paidBy} onChange={v=>setForm(p=>({...p,paidBy:v}))} options={[{value:"me",label:"Me"},...people.map(p=>({value:p,label:p}))]}/>
      <div style={{marginBottom:14}}><label style={{display:"block",fontSize:10,color:T.textSec,marginBottom:8,fontWeight:600,letterSpacing:"1px",textTransform:"uppercase"}}>Split With</label>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{people.map(p=> <button key={p} onClick={()=>toggleSplitWith(p)} style={{padding:"8px 16px",borderRadius:9,border:`1px solid ${form.splitWith.includes(p)?T.accent+"55":T.border}`,background:form.splitWith.includes(p)?T.accent+"14":"rgba(255,255,255,.03)",color:form.splitWith.includes(p)?T.accent:T.textSec,fontSize:12,cursor:"pointer",fontWeight:500,fontFamily:"'DM Sans'"}}>{p}{form.splitWith.includes(p)&&" ✓"}</button>)}</div>
      </div>
      <Inp label="Date" value={form.date} onChange={v=>setForm(p=>({...p,date:v}))} type="date"/>
      <Btn onClick={addTxn} style={{width:"100%",justifyContent:"center"}}><Plus size={14}/> Split It</Btn>
    </Modal>
  </div>;
}

// ── ASSIGNMENTS ──
function AssignmentsPage({assignments,updateAssignments}){
  const[showCreate,setShowCreate]=useState(false);const[activeId,setActiveId]=useState(null);
  const[form,setForm]=useState({name:"",budget:""});
  const[expForm,setExpForm]=useState({desc:"",amount:"",date:new Date().toISOString().split("T")[0]});
  const[showAddExp,setShowAddExp]=useState(false);

  const create=()=>{if(!form.name)return;updateAssignments(p=>[...p,{id:Date.now(),name:form.name,budget:parseFloat(form.budget)||0,expenses:[],createdAt:new Date().toISOString().split("T")[0]}]);setForm({name:"",budget:""});setShowCreate(false)};
  const active=assignments.find(a=>a.id===activeId);
  const addExp=()=>{if(!expForm.desc||!expForm.amount)return;updateAssignments(p=>p.map(a=>a.id===activeId?{...a,expenses:[...a.expenses,{id:Date.now(),desc:expForm.desc,amount:parseFloat(expForm.amount),date:expForm.date}]}:a));setExpForm({desc:"",amount:"",date:new Date().toISOString().split("T")[0]});setShowAddExp(false)};
  const delExp=(eid)=>updateAssignments(p=>p.map(a=>a.id===activeId?{...a,expenses:a.expenses.filter(e=>e.id!==eid)}:a));
  const delAssignment=(id)=>{updateAssignments(p=>p.filter(a=>a.id!==id));if(activeId===id)setActiveId(null)};

  if(active)return <div>
    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:22}}>
      <button onClick={()=>setActiveId(null)} style={{background:"rgba(255,255,255,.04)",border:`1px solid ${T.border}`,borderRadius:9,padding:8,cursor:"pointer",color:T.textSec,display:"flex"}}><ChevronLeft size={16}/></button>
      <div><h2 style={{fontFamily:"'DM Sans'",color:T.text,fontSize:21,fontWeight:700,margin:0}}>{active.name}</h2><div style={{fontSize:11,color:T.textMut}}>Created {active.createdAt}</div></div>
    </div>
    <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"}}>
      <Metric icon={DollarSign} label="Budget" value={fmt(active.budget)} color={T.blue} delay={.04}/>
      <Metric icon={Receipt} label="Spent" value={fmt(active.expenses.reduce((s,e)=>s+e.amount,0))} color={T.red} delay={.08}/>
      <Metric icon={PiggyBank} label="Remaining" value={fmt(active.budget-active.expenses.reduce((s,e)=>s+e.amount,0))} color={T.accent} delay={.12}/>
    </div>
    <GC hover={false}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><h3 style={{color:T.text,fontSize:13,fontWeight:600,margin:0}}>Expenses</h3><Btn small onClick={()=>setShowAddExp(true)}><Plus size={13}/> Add</Btn></div>
      {active.expenses.length===0?<div style={{padding:20,textAlign:"center",color:T.textMut,fontSize:12}}>No expenses logged for this assignment yet, boss.</div>:
      active.expenses.map(e=> <div key={e.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 0",borderBottom:`1px solid ${T.border}`}}>
        <div><div style={{fontSize:13,color:T.text,fontWeight:600}}>{e.desc}</div><div style={{fontSize:10,color:T.textMut}}>{e.date}</div></div>
        <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:13,fontWeight:700,color:T.red,fontFamily:"'JetBrains Mono'"}}>{fmt(e.amount)}</span><button onClick={()=>delExp(e.id)} style={{background:"none",border:"none",cursor:"pointer",color:T.textMut}}><Trash2 size={12}/></button></div>
      </div>)}
    </GC>
    <Modal open={showAddExp} onClose={()=>setShowAddExp(false)} title="Add Expense"><Inp label="What" value={expForm.desc} onChange={v=>setExpForm(p=>({...p,desc:v}))} placeholder="Hotel, flight, food..."/><Inp label="Amount ($)" value={expForm.amount} onChange={v=>setExpForm(p=>({...p,amount:v}))} type="number"/><Inp label="Date" value={expForm.date} onChange={v=>setExpForm(p=>({...p,date:v}))} type="date"/><Btn onClick={addExp} style={{width:"100%",justifyContent:"center"}}><Plus size={14}/> Add</Btn></Modal>
  </div>;

  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}><h2 style={{fontFamily:"'DM Sans'",color:T.text,fontSize:21,fontWeight:700,margin:0}}>Assignments</h2><Btn onClick={()=>setShowCreate(true)}><Plus size={14}/> Create</Btn></div>
    {assignments.length===0?<GC><div style={{padding:40,textAlign:"center"}}><MapPin size={28} color={T.textMut} style={{margin:"0 auto 12px"}}/><div style={{color:T.textMut,fontSize:13}}>No assignments yet, boss. Create one for your next trip or event.</div></div></GC>:
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14}}>
      {assignments.map((a,i)=>{const spent=a.expenses.reduce((s,e)=>s+e.amount,0);const pct=a.budget>0?((spent/a.budget)*100).toFixed(0):0;
      return <GC key={a.id} style={{cursor:"pointer",position:"relative"}} delay={i*.05} onClick={()=>setActiveId(a.id)}>
        <button onClick={e=>{e.stopPropagation();delAssignment(a.id)}} style={{position:"absolute",top:12,right:12,background:"none",border:"none",cursor:"pointer",color:T.textMut}}><Trash2 size={13}/></button>
        <div style={{fontSize:10,color:T.accent,fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:8}}>{a.createdAt}</div>
        <h3 style={{fontSize:16,fontWeight:700,color:T.text,margin:"0 0 12px"}}>{a.name}</h3>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:T.textSec,marginBottom:8}}>
          <span>Budget: {fmt(a.budget)}</span><span>Spent: {fmt(spent)}</span>
        </div>
        <div style={{height:4,background:"rgba(255,255,255,.06)",borderRadius:2,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${Math.min(pct,100)}%`,background:pct>90?T.red:pct>60?T.yellow:T.accent,borderRadius:2,transition:"width .5s"}}/>
        </div>
        <div style={{fontSize:10,color:T.textMut,marginTop:6}}>{a.expenses.length} expenses · {pct}% used</div>
      </GC>})}
    </div>}
    <Modal open={showCreate} onClose={()=>setShowCreate(false)} title="Create Assignment"><Inp label="Name" value={form.name} onChange={v=>setForm(p=>({...p,name:v}))} placeholder="e.g. Goa Trip, Birthday Party"/><Inp label="Budget ($)" value={form.budget} onChange={v=>setForm(p=>({...p,budget:v}))} type="number" placeholder="Total budget"/><Btn onClick={create} style={{width:"100%",justifyContent:"center"}}><Plus size={14}/> Create</Btn></Modal>
  </div>;
}

// ── LENDING (with delay types) ──
function Lend({config,lending,updateLending}){
  const[showAdd,setShowAdd]=useState(false);
  const[form,setForm]=useState({name:"",amount:"",currency:"USD",date:new Date().toISOString().split("T")[0],delayType:"flexible"});
  const pending=lending.filter(l=>!l.settled),settled=lending.filter(l=>l.settled);
  const totalOut=pending.reduce((s,l)=>s+(l.currency==="USD"?l.amount:toUSD(l.amount,config.exchangeRate)),0);
  const add=()=>{if(!form.name||!form.amount)return;updateLending(p=>[...p,{...form,id:Date.now(),amount:parseFloat(form.amount),settled:false}]);setForm({name:"",amount:"",currency:"USD",date:new Date().toISOString().split("T")[0],delayType:"flexible"});setShowAdd(false)};

  // Timed reminders
  const timedAlerts=pending.filter(l=>l.delayType==="timed"&&daysSince(l.date)>=14);

  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}><h2 style={{fontFamily:"'DM Sans'",color:T.text,fontSize:21,fontWeight:700,margin:0}}>Lending Book</h2><Btn onClick={()=>setShowAdd(true)}><Plus size={14}/> Lend</Btn></div>

    {/* TIMED REMINDERS */}
    {timedAlerts.length>0&&<GC style={{marginBottom:18,padding:"16px 20px",borderLeft:`3px solid ${T.yellow}`,background:`linear-gradient(135deg,${T.yellow}08,transparent)`}} hover={false}>
      <div style={{fontSize:10,color:T.yellow,fontWeight:700,letterSpacing:"2px",marginBottom:10}}>⏰ REMINDERS, BOSS</div>
      {timedAlerts.map(l=> <div key={l.id} style={{fontSize:13,color:T.text,marginBottom:6}}>
        <span style={{fontWeight:600}}>{l.name}</span> owes you <span style={{color:T.yellow,fontWeight:700,fontFamily:"'JetBrains Mono'"}}>{fmt(l.amount,l.currency)}</span> — it's been <span style={{color:T.red,fontWeight:600}}>{daysSince(l.date)} days</span>, sir.
      </div>)}
    </GC>}

    <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"}}>
      <Metric icon={Banknote} label="Outstanding" value={<Ctr value={totalOut}/>} sub={fmt(toINR(totalOut,config.exchangeRate),"INR")} color={T.yellow} delay={.04}/>
      <Metric icon={Clock} label="Pending" value={String(pending.length)} color={T.orange} delay={.08}/>
      <Metric icon={Check} label="Settled" value={String(settled.length)} color={T.accent} delay={.12}/>
    </div>
    <GC delay={.16}>
      <h3 style={{color:T.yellow,fontSize:12,fontWeight:700,margin:"0 0 14px",letterSpacing:"1px"}}>⏳ PENDING</h3>
      {pending.length===0?<div style={{padding:20,textAlign:"center",color:T.textMut,fontSize:12}}>Nobody owes you, boss.</div>:
      pending.map((l,i)=> <div key={l.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 0",borderBottom:`1px solid ${T.border}`,animation:`slideR .3s ease ${i*.04}s both`}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:36,height:36,borderRadius:"50%",background:`${T.yellow}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:T.yellow}}>{l.name[0]}</div>
          <div><div style={{fontSize:13,color:T.text,fontWeight:600}}>{l.name}</div><div style={{display:"flex",alignItems:"center",gap:6,marginTop:2}}><span style={{fontSize:10,color:T.textMut}}>{daysSince(l.date)}d ago</span>
            <span style={{fontSize:9,padding:"2px 8px",borderRadius:10,background:l.delayType==="timed"?T.purple+"18":T.blue+"18",color:l.delayType==="timed"?T.purple:T.blue,fontWeight:600,display:"flex",alignItems:"center",gap:3}}>
              {l.delayType==="timed"?<><Timer size={8}/> Timed</>:<>Flexible</>}
            </span>
          </div></div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:14,fontWeight:700,color:T.yellow,fontFamily:"'JetBrains Mono'"}}>{fmt(l.amount,l.currency)}</span>
          <Btn small variant="success" onClick={()=>updateLending(p=>p.map(x=>x.id===l.id?{...x,settled:true}:x))}><Check size={12}/></Btn>
          <button onClick={()=>updateLending(p=>p.filter(x=>x.id!==l.id))} style={{background:T.red+"12",border:`1px solid ${T.red}22`,cursor:"pointer",color:T.red,padding:4,borderRadius:6,display:"flex"}}><Trash2 size={12}/></button>
        </div>
      </div>)}
    </GC>
    {settled.length>0&&<GC style={{marginTop:14,opacity:.5}} delay={.2}><h3 style={{color:T.accent,fontSize:12,fontWeight:700,margin:"0 0 10px"}}>✓ SETTLED</h3>{settled.map(l=> <div key={l.id} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${T.border}`}}><span style={{fontSize:12,color:T.textMut,textDecoration:"line-through"}}>{l.name}</span><span style={{fontSize:12,color:T.textMut,fontFamily:"'JetBrains Mono'"}}>{fmt(l.amount,l.currency)}</span></div>)}</GC>}
    <Modal open={showAdd} onClose={()=>setShowAdd(false)} title="Lend Money">
      <Inp label="Who, boss?" value={form.name} onChange={v=>setForm(p=>({...p,name:v}))} placeholder="Name"/>
      <Inp label="Amount" value={form.amount} onChange={v=>setForm(p=>({...p,amount:v}))} type="number"/>
      <Inp label="Currency" value={form.currency} onChange={v=>setForm(p=>({...p,currency:v}))} options={[{value:"USD",label:"USD"},{value:"INR",label:"INR"}]}/>
      <div style={{marginBottom:14}}><label style={{display:"block",fontSize:10,color:T.textSec,marginBottom:8,fontWeight:600,letterSpacing:"1px",textTransform:"uppercase"}}>Repayment Type</label>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>setForm(p=>({...p,delayType:"flexible"}))} style={{flex:1,padding:"12px",borderRadius:10,border:`1px solid ${form.delayType==="flexible"?T.blue+"55":T.border}`,background:form.delayType==="flexible"?T.blue+"14":"rgba(255,255,255,.02)",color:form.delayType==="flexible"?T.blue:T.textSec,cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"'DM Sans'",textAlign:"center"}}>
            Flexible<div style={{fontSize:9,color:T.textMut,marginTop:4}}>No rush, whenever they can</div>
          </button>
          <button onClick={()=>setForm(p=>({...p,delayType:"timed"}))} style={{flex:1,padding:"12px",borderRadius:10,border:`1px solid ${form.delayType==="timed"?T.purple+"55":T.border}`,background:form.delayType==="timed"?T.purple+"14":"rgba(255,255,255,.02)",color:form.delayType==="timed"?T.purple:T.textSec,cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"'DM Sans'",textAlign:"center"}}>
            Timed<div style={{fontSize:9,color:T.textMut,marginTop:4}}>Remind after 2 weeks</div>
          </button>
        </div>
      </div>
      <Inp label="Date" value={form.date} onChange={v=>setForm(p=>({...p,date:v}))} type="date"/>
      <Btn onClick={add} style={{width:"100%",justifyContent:"center"}}><Plus size={14}/> Lend</Btn>
    </Modal>
  </div>;
}

// ── SIMPLE PAGES (Expenses, Investments, Analytics, Calculator, Settings) ──
// Keeping compact — same logic as v6 but with "boss/sir" tone

function Exp({config,expenses,updateExpenses}){const[showAdd,setShowAdd]=useState(false);const[form,setForm]=useState({desc:"",amount:"",category:"Food",date:new Date().toISOString().split("T")[0],currency:"USD"});const add=()=>{if(!form.desc||!form.amount)return;updateExpenses(p=>[{...form,id:Date.now(),amount:parseFloat(form.amount)},...p]);setForm({desc:"",amount:"",category:"Food",date:new Date().toISOString().split("T")[0],currency:"USD"});setShowAdd(false)};const total=expenses.reduce((s,e)=>s+(e.currency==="USD"?e.amount:toUSD(e.amount,config.exchangeRate)),0);const catData=cats.map(c=>({name:c,value:expenses.filter(e=>e.category===c).reduce((s,e)=>s+(e.currency==="USD"?e.amount:toUSD(e.amount,config.exchangeRate)),0)})).filter(c=>c.value>0);
return <div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}><h2 style={{fontFamily:"'DM Sans'",color:T.text,fontSize:21,fontWeight:700,margin:0}}>Expenses</h2><Btn onClick={()=>setShowAdd(true)}><Plus size={14}/> Quick Add</Btn></div>
<div style={{display:"flex",gap:18,flexWrap:"wrap",marginBottom:18}}><GC style={{flex:"1 1 320px"}} delay={.04}><h3 style={{color:T.text,fontSize:13,fontWeight:600,margin:"0 0 14px"}}>By Category</h3>{catData.length>0?<ResponsiveContainer width="100%" height={200}><PieChart><Pie data={catData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" stroke={T.bg} strokeWidth={3}>{catData.map((_,i)=><Cell key={i} fill={PC[i%PC.length]}/>)}</Pie><Tooltip {...tip} formatter={v=>fmt(v)}/></PieChart></ResponsiveContainer>:<div style={{padding:30,textAlign:"center",color:T.textMut,fontSize:12}}>No expenses yet, boss</div>}</GC>
<GC style={{flex:"1 1 180px"}} delay={.08}><div style={{fontSize:10,color:T.textSec,textTransform:"uppercase",letterSpacing:"1px",fontWeight:600}}>Total</div><div style={{fontSize:28,fontWeight:700,color:T.text,fontFamily:"'JetBrains Mono'",marginTop:8}}><Ctr value={total}/></div><div style={{fontSize:11,color:T.textMut,fontFamily:"'JetBrains Mono'",marginTop:3}}>{fmt(toINR(total,config.exchangeRate),"INR")}</div><div style={{marginTop:16,fontSize:10,color:T.textSec,textTransform:"uppercase",letterSpacing:"1px",fontWeight:600}}>Count</div><div style={{fontSize:28,fontWeight:700,color:T.accent,fontFamily:"'JetBrains Mono'",marginTop:8}}>{expenses.length}</div></GC></div>
<GC hover={false} delay={.12}>{expenses.length===0?<div style={{padding:30,textAlign:"center",color:T.textMut,fontSize:12}}>Nothing here yet</div>:expenses.map((e,i)=> <div key={e.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 0",borderBottom:`1px solid ${T.border}`,animation:`slideR .3s ease ${i*.03}s both`}}><div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:34,height:34,borderRadius:9,background:"rgba(255,255,255,.03)",display:"flex",alignItems:"center",justifyContent:"center",border:`1px solid ${T.border}`}}><Receipt size={14} color={T.textSec}/></div><div><div style={{fontSize:12,color:T.text,fontWeight:600}}>{e.desc}</div><div style={{fontSize:10,color:T.textMut}}>{e.category}·{e.date}</div></div></div><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{textAlign:"right"}}><div style={{fontSize:12,fontWeight:700,color:T.red,fontFamily:"'JetBrains Mono'"}}>{e.currency==="USD"?fmt(e.amount):fmt(e.amount,"INR")}</div></div><button onClick={()=>updateExpenses(p=>p.filter(x=>x.id!==e.id))} style={{background:T.red+"12",border:`1px solid ${T.red}22`,cursor:"pointer",color:T.red,padding:4,borderRadius:6,display:"flex"}}><Trash2 size={12}/></button></div></div>)}</GC>
<Modal open={showAdd} onClose={()=>setShowAdd(false)} title="Quick Add"><Inp label="What" value={form.desc} onChange={v=>setForm(p=>({...p,desc:v}))} placeholder="Coffee, Uber..."/><Inp label="Amount" value={form.amount} onChange={v=>setForm(p=>({...p,amount:v}))} type="number"/><Inp label="Currency" value={form.currency} onChange={v=>setForm(p=>({...p,currency:v}))} options={[{value:"USD",label:"USD"},{value:"INR",label:"INR"}]}/><Inp label="Category" value={form.category} onChange={v=>setForm(p=>({...p,category:v}))} options={cats}/><Inp label="Date" value={form.date} onChange={v=>setForm(p=>({...p,date:v}))} type="date"/><Btn onClick={add} style={{width:"100%",justifyContent:"center"}}><Plus size={14}/> Add</Btn></Modal></div>}

function Invest({config,updateConfig,crowdfunding,updateCF}){const[showSIP,setShowSIP]=useState(false);const[showCF,setShowCF]=useState(false);const[showSt,setShowSt]=useState(false);const[sf,setSf]=useState({name:"",amountINR:"",date:""});const[cf2,setCf2]=useState({name:"",amount:"",date:new Date().toISOString().split("T")[0]});const[stf,setStf]=useState({name:"",qty:"",buyPrice:""});const sipT=config.sips.reduce((s,x)=>s+x.amountINR,0);const cfT=crowdfunding.filter(c=>c.status==="active").reduce((s,c)=>s+c.amount,0);const stocks=config.stocks||[];const stockVal=stocks.reduce((s,x)=>s+x.qty*x.buyPrice,0);
return <div><h2 style={{fontFamily:"'DM Sans'",color:T.text,fontSize:21,fontWeight:700,margin:"0 0 22px"}}>Investments</h2>
<div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"}}><Metric icon={TrendingUp} label="Monthly SIPs" value={fmt(sipT,"INR")} sub={fmt(toUSD(sipT,config.exchangeRate))} color={T.purple} delay={.04}/><Metric icon={BarChart3} label="Stock Holdings" value={fmt(stockVal,"INR")} sub={`${stocks.length} stocks`} color={T.blue} delay={.08}/><Metric icon={Briefcase} label="Crowdfunding" value={<Ctr value={cfT}/>} color={T.orange} delay={.12}/></div>
<GC delay={.16}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><h3 style={{color:T.text,fontSize:14,fontWeight:700,margin:0}}>SIP Portfolio</h3><Btn small onClick={()=>setShowSIP(true)}><Plus size={13}/> Add</Btn></div>{config.sips.length===0?<div style={{padding:20,textAlign:"center",color:T.textMut,fontSize:12}}>No SIPs yet</div>:<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))",gap:10}}>{config.sips.map(sip=> <div key={sip.id} className="c3d" style={{background:"rgba(255,255,255,.02)",border:`1px solid ${T.border}`,borderRadius:12,padding:16,position:"relative"}}><button onClick={()=>updateConfig(p=>({...p,sips:p.sips.filter(s=>s.id!==sip.id)}))} style={{position:"absolute",top:8,right:8,background:"none",border:"none",cursor:"pointer",color:T.textMut}}><Trash2 size={11}/></button><div style={{fontSize:12,fontWeight:700,color:T.text,marginBottom:8}}>{sip.name}</div><div style={{fontSize:20,fontWeight:700,color:T.accent,fontFamily:"'JetBrains Mono'"}}>{fmt(sip.amountINR,"INR")}</div><div style={{display:"flex",justifyContent:"space-between",marginTop:6}}><span style={{fontSize:10,color:T.textMut}}>{sip.date}th</span><Badge days={daysUntil(sip.date)}/></div></div>)}</div>}</GC>
<GC style={{marginTop:18}} delay={.2}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><h3 style={{color:T.text,fontSize:14,fontWeight:700,margin:0}}>Stock Holdings</h3><Btn small onClick={()=>setShowSt(true)}><Plus size={13}/> Add</Btn></div>{stocks.length===0?<div style={{padding:20,textAlign:"center",color:T.textMut,fontSize:12}}>No stocks</div>:stocks.map(st=> <div key={st.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:`1px solid ${T.border}`}}><div><div style={{fontSize:13,color:T.text,fontWeight:600}}>{st.name}</div><div style={{fontSize:10,color:T.textMut}}>{st.qty} @ {fmt(st.buyPrice,"INR")}</div></div><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:13,fontWeight:700,color:T.blue,fontFamily:"'JetBrains Mono'"}}>{fmt(st.qty*st.buyPrice,"INR")}</span><button onClick={()=>updateConfig(p=>({...p,stocks:(p.stocks||[]).filter(s=>s.id!==st.id)}))} style={{background:"none",border:"none",cursor:"pointer",color:T.textMut}}><Trash2 size={12}/></button></div></div>)}</GC>
<GC style={{marginTop:18}} delay={.24}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><h3 style={{color:T.text,fontSize:14,fontWeight:700,margin:0}}>Crowdfunding</h3><Btn small onClick={()=>setShowCF(true)}><Plus size={13}/> Add</Btn></div>{crowdfunding.length===0?<div style={{padding:20,textAlign:"center",color:T.textMut,fontSize:12}}>None yet</div>:crowdfunding.map(c=> <div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:`1px solid ${T.border}`}}><div><div style={{fontSize:13,color:T.text,fontWeight:600}}>{c.name}</div><div style={{fontSize:10,color:T.textMut}}>{c.date}</div></div><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:13,fontWeight:700,color:T.orange,fontFamily:"'JetBrains Mono'"}}>{fmt(c.amount)}</span><button onClick={()=>updateCF(p=>p.filter(x=>x.id!==c.id))} style={{background:"none",border:"none",cursor:"pointer",color:T.textMut}}><Trash2 size={12}/></button></div></div>)}</GC>
<Modal open={showSIP} onClose={()=>setShowSIP(false)} title="Add SIP"><Inp label="Fund" value={sf.name} onChange={v=>setSf(p=>({...p,name:v}))} placeholder="Nifty 50"/><Inp label="₹/month" value={sf.amountINR} onChange={v=>setSf(p=>({...p,amountINR:v}))} type="number"/><Inp label="Date" value={sf.date} onChange={v=>setSf(p=>({...p,date:v}))} type="number" placeholder="5"/><Btn onClick={()=>{if(!sf.name)return;updateConfig(p=>({...p,sips:[...p.sips,{id:`sip-${Date.now()}`,name:sf.name,amountINR:parseFloat(sf.amountINR)||0,date:parseInt(sf.date)||1}]}));setSf({name:"",amountINR:"",date:""});setShowSIP(false)}} style={{width:"100%",justifyContent:"center"}}><Plus size={14}/> Add</Btn></Modal>
<Modal open={showSt} onClose={()=>setShowSt(false)} title="Add Stock"><Inp label="Stock" value={stf.name} onChange={v=>setStf(p=>({...p,name:v}))} placeholder="TCS"/><Inp label="Qty" value={stf.qty} onChange={v=>setStf(p=>({...p,qty:v}))} type="number"/><Inp label="Buy Price ₹" value={stf.buyPrice} onChange={v=>setStf(p=>({...p,buyPrice:v}))} type="number"/><Btn onClick={()=>{if(!stf.name)return;updateConfig(p=>({...p,stocks:[...(p.stocks||[]),{id:`st-${Date.now()}`,name:stf.name,qty:parseFloat(stf.qty)||0,buyPrice:parseFloat(stf.buyPrice)||0}]}));setStf({name:"",qty:"",buyPrice:""});setShowSt(false)}} style={{width:"100%",justifyContent:"center"}}><Plus size={14}/> Add</Btn></Modal>
<Modal open={showCF} onClose={()=>setShowCF(false)} title="Add Crowdfunding"><Inp label="Name" value={cf2.name} onChange={v=>setCf2(p=>({...p,name:v}))} placeholder="Republic"/><Inp label="Amount $" value={cf2.amount} onChange={v=>setCf2(p=>({...p,amount:v}))} type="number"/><Inp label="Date" value={cf2.date} onChange={v=>setCf2(p=>({...p,date:v}))} type="date"/><Btn onClick={()=>{if(!cf2.name)return;updateCF(p=>[...p,{...cf2,id:Date.now(),amount:parseFloat(cf2.amount)||0,status:"active"}]);setCf2({name:"",amount:"",date:new Date().toISOString().split("T")[0]});setShowCF(false)}} style={{width:"100%",justifyContent:"center"}}><Plus size={14}/> Add</Btn></Modal></div>}

function Analytics({config,history}){if(history.length===0)return <div><h2 style={{fontFamily:"'DM Sans'",color:T.text,fontSize:21,fontWeight:700,margin:"0 0 22px"}}>Analytics</h2><GC><div style={{padding:40,textAlign:"center",color:T.textMut,fontSize:13}}>No history yet, boss. Archive your first month.</div></GC></div>;const sData=history.map(h=>({...h,rate:((h.savings/Math.max(config.salary,1))*100).toFixed(1)}));
return <div><h2 style={{fontFamily:"'DM Sans'",color:T.text,fontSize:21,fontWeight:700,margin:"0 0 22px"}}>Analytics</h2>
<div style={{display:"flex",gap:18,flexWrap:"wrap",marginBottom:18}}><GC style={{flex:"1 1 400px"}} delay={.04}><h3 style={{color:T.text,fontSize:13,fontWeight:600,margin:"0 0 14px"}}>Spending vs Savings</h3><ResponsiveContainer width="100%" height={230}><AreaChart data={history}><defs><linearGradient id="gs" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.red} stopOpacity={.3}/><stop offset="100%" stopColor={T.red} stopOpacity={0}/></linearGradient><linearGradient id="gv" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.accent} stopOpacity={.3}/><stop offset="100%" stopColor={T.accent} stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)"/><XAxis dataKey="month" tick={{fill:T.textMut,fontSize:11}}/><YAxis tick={{fill:T.textMut,fontSize:11}} tickFormatter={v=>`$${v}`}/><Tooltip {...tip}/><Area type="monotone" dataKey="spending" stroke={T.red} fill="url(#gs)" strokeWidth={2.5} name="Spending"/><Area type="monotone" dataKey="savings" stroke={T.accent} fill="url(#gv)" strokeWidth={2.5} name="Savings"/><Legend wrapperStyle={{fontSize:11}}/></AreaChart></ResponsiveContainer></GC>
<GC style={{flex:"1 1 400px"}} delay={.08}><h3 style={{color:T.text,fontSize:13,fontWeight:600,margin:"0 0 14px"}}>Savings Rate %</h3><ResponsiveContainer width="100%" height={230}><AreaChart data={sData}><defs><linearGradient id="gr" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.accent} stopOpacity={.4}/><stop offset="100%" stopColor={T.accent} stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)"/><XAxis dataKey="month" tick={{fill:T.textMut,fontSize:11}}/><YAxis tick={{fill:T.textMut,fontSize:11}} tickFormatter={v=>`${v}%`}/><Tooltip {...tip} formatter={v=>`${v}%`}/><Area type="monotone" dataKey="rate" stroke={T.accent} fill="url(#gr)" strokeWidth={3} dot={{fill:T.accent,r:4,stroke:T.bg}} name="Rate"/></AreaChart></ResponsiveContainer></GC></div>
<GC delay={.12}><h3 style={{color:T.text,fontSize:13,fontWeight:600,margin:"0 0 4px"}}>Spending — 3D</h3><ThreeScene data={history.map(h=>({label:h.month,value:h.spending}))} height={230}/></GC></div>}

function Calc({config}){const[inp,setInp]=useState("");const[res,setRes]=useState(null);const[ca,setCa]=useState("");const[cd,setCd]=useState("usd-inr");const calc=()=>{try{setRes(new Function("return "+inp.replace(/[^0-9+\-*/.() ]/g,""))())}catch{setRes("Error")}};const fixT=config.rent+toUSD(config.sips.reduce((s,x)=>s+x.amountINR,0),config.exchangeRate)+toUSD(config.studentLoan.amountINR,config.exchangeRate)+config.subscriptions.reduce((s,x)=>s+x.amount,0);
return <div><h2 style={{fontFamily:"'DM Sans'",color:T.text,fontSize:21,fontWeight:700,margin:"0 0 22px"}}>Calculator</h2><div style={{display:"flex",gap:18,flexWrap:"wrap"}}><GC style={{flex:"1 1 280px"}} delay={.04}><h3 style={{color:T.text,fontSize:13,fontWeight:600,margin:"0 0 14px"}}>Quick Math</h3><input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&calc()} placeholder="e.g. 3000 - 625" style={{width:"100%",padding:"13px 15px",background:"rgba(255,255,255,.03)",border:`1px solid ${T.border}`,borderRadius:10,color:T.text,fontSize:17,outline:"none",boxSizing:"border-box",fontFamily:"'JetBrains Mono'"}}/><Btn onClick={calc} style={{width:"100%",justifyContent:"center",marginTop:10}}>Calculate</Btn>{res!==null&&<div style={{marginTop:14,padding:16,background:T.accent+"08",borderRadius:10,border:`1px solid ${T.accent}22`}}><div style={{fontSize:10,color:T.textSec,textTransform:"uppercase",letterSpacing:"1px",fontWeight:600}}>Result</div><div style={{fontSize:30,fontWeight:700,color:T.accent,fontFamily:"'JetBrains Mono'",marginTop:4}}>{typeof res==="number"?res.toLocaleString("en-US",{maximumFractionDigits:2}):res}</div></div>}</GC>
<GC style={{flex:"1 1 280px"}} delay={.08}><h3 style={{color:T.text,fontSize:13,fontWeight:600,margin:"0 0 14px"}}>Converter</h3><Inp label="Amount" value={ca} onChange={setCa} type="number" placeholder="Amount"/><Inp label="Direction" value={cd} onChange={setCd} options={[{value:"usd-inr",label:"USD → INR"},{value:"inr-usd",label:"INR → USD"}]}/>{ca&&<div style={{marginTop:10,padding:16,background:T.blue+"0a",borderRadius:10,border:`1px solid ${T.blue}22`}}><div style={{fontSize:10,color:T.textSec,textTransform:"uppercase",letterSpacing:"1px",fontWeight:600}}>@ {config.exchangeRate}</div><div style={{fontSize:26,fontWeight:700,color:T.blue,fontFamily:"'JetBrains Mono'",marginTop:4}}>{cd==="usd-inr"?fmt(parseFloat(ca)*config.exchangeRate,"INR"):fmt(parseFloat(ca)/config.exchangeRate)}</div></div>}</GC>
<GC style={{flex:"1 1 280px"}} delay={.12}><h3 style={{color:T.text,fontSize:13,fontWeight:600,margin:"0 0 14px"}}>What-If</h3><div style={{padding:16,background:T.accent+"08",borderRadius:10,border:`1px solid ${T.accent}22`}}><div style={{fontSize:10,color:T.textSec,textTransform:"uppercase",letterSpacing:"1px",fontWeight:600}}>After fixed costs</div><div style={{fontSize:30,fontWeight:700,color:T.accent,fontFamily:"'JetBrains Mono'",marginTop:6}}>{fmt(config.salary-fixT)}</div><div style={{fontSize:10,color:T.textMut,marginTop:4}}>Salary {fmt(config.salary)} − Fixed {fmt(fixT)}</div></div></GC></div></div>}

function Sett({config,updateConfig}){const u=(path,val)=>updateConfig(prev=>{const next=JSON.parse(JSON.stringify(prev));const keys=path.split(".");let obj=next;for(let i=0;i<keys.length-1;i++)obj=obj[keys[i]];obj[keys[keys.length-1]]=val;return next});
return <div><h2 style={{fontFamily:"'DM Sans'",color:T.text,fontSize:21,fontWeight:700,margin:"0 0 22px"}}>Settings</h2><div style={{display:"flex",gap:18,flexWrap:"wrap"}}>
<GC style={{flex:"1 1 280px"}} delay={.04}><h3 style={{color:T.accent,fontSize:11,fontWeight:700,margin:"0 0 14px",letterSpacing:"1.5px",textTransform:"uppercase"}}>Income</h3><Inp label="Salary (USD)" value={config.salary} onChange={v=>u("salary",parseFloat(v)||0)} type="number"/><Inp label="Rent (USD)" value={config.rent} onChange={v=>u("rent",parseFloat(v)||0)} type="number"/><Inp label="Exchange Rate" value={config.exchangeRate} onChange={v=>u("exchangeRate",parseFloat(v)||83.5)} type="number"/></GC>
<GC style={{flex:"1 1 280px"}} delay={.08}><h3 style={{color:T.yellow,fontSize:11,fontWeight:700,margin:"0 0 14px",letterSpacing:"1.5px",textTransform:"uppercase"}}>Student Loan</h3><Inp label="EMI (INR)" value={config.studentLoan.amountINR} onChange={v=>u("studentLoan.amountINR",parseFloat(v)||0)} type="number"/><Inp label="Date" value={config.studentLoan.date} onChange={v=>u("studentLoan.date",parseInt(v)||1)} type="number"/><Inp label="Remaining (INR)" value={config.studentLoan.totalRemaining} onChange={v=>u("studentLoan.totalRemaining",parseFloat(v)||0)} type="number"/></GC>
<GC style={{flex:"1 1 280px"}} delay={.12}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><h3 style={{color:T.purple,fontSize:11,fontWeight:700,margin:0,letterSpacing:"1.5px",textTransform:"uppercase"}}>Subscriptions</h3><Btn small variant="ghost" onClick={()=>updateConfig(p=>({...p,subscriptions:[...p.subscriptions,{id:`sub${Date.now()}`,name:"",amount:0}]}))}><Plus size={12}/></Btn></div>{config.subscriptions.map((sub,idx)=> <div key={sub.id} style={{display:"flex",gap:6,alignItems:"flex-end",marginBottom:8}}><div style={{flex:1}}><Inp label="Name" value={sub.name} onChange={v=>u(`subscriptions.${idx}.name`,v)}/></div><div style={{width:80}}><Inp label="$/mo" value={sub.amount} onChange={v=>u(`subscriptions.${idx}.amount`,parseFloat(v)||0)} type="number"/></div><button onClick={()=>updateConfig(p=>({...p,subscriptions:p.subscriptions.filter(s=>s.id!==sub.id)}))} style={{background:"none",border:"none",cursor:"pointer",color:T.textMut,padding:"0 0 16px"}}><Trash2 size={12}/></button></div>)}</GC>
<GC style={{flex:"1 1 280px"}} delay={.16}><h3 style={{color:T.orange,fontSize:11,fontWeight:700,margin:"0 0 14px",letterSpacing:"1.5px",textTransform:"uppercase"}}>Card Dues</h3>{config.cards.map((card,idx)=> <div key={card.id} style={{marginBottom:12,padding:12,background:"rgba(255,255,255,.02)",borderRadius:10,border:`1px solid ${T.border}`}}><div style={{fontSize:12,fontWeight:700,color:T.text,marginBottom:8}}>{card.name}</div><Inp label="Due Date" value={card.dueDate} onChange={v=>u(`cards.${idx}.dueDate`,parseInt(v)||1)} type="number"/></div>)}</GC>
</div></div>}

// ── ONBOARDING ──
function Onboarding({onComplete}){const[step,setStep]=useState(0);const[cfg,setCfg]=useState({salary:"",rent:"",exchangeRate:"83.5",cards:[],sips:[],stocks:[],studentLoan:{amountINR:"",date:"",totalRemaining:""},subscriptions:[],customBudget:[]});const[lending,setLending]=useState([]);
const uc=(k,v)=>setCfg(p=>({...p,[k]:v}));const addC=()=>uc("cards",[...cfg.cards,{id:`c${Date.now()}`,name:"",dueDate:""}]);const addS=()=>uc("sips",[...cfg.sips,{id:`s${Date.now()}`,name:"",amountINR:"",date:""}]);const addSt=()=>uc("stocks",[...cfg.stocks,{id:`st${Date.now()}`,name:"",qty:"",buyPrice:""}]);const addSub=()=>uc("subscriptions",[...cfg.subscriptions,{id:`sub${Date.now()}`,name:"",amount:""}]);const addL=()=>setLending(p=>[...p,{id:`l${Date.now()}`,name:"",amount:"",currency:"USD",date:new Date().toISOString().split("T")[0],delayType:"flexible"}]);
const ua=(key,idx,field,val)=>{const arr=key==="lending"?[...lending]:[...cfg[key]];arr[idx]={...arr[idx],[field]:val};if(key==="lending")setLending(arr);else uc(key,arr)};const ra=(key,idx)=>{if(key==="lending")setLending(p=>p.filter((_,i)=>i!==idx));else uc(key,cfg[key].filter((_,i)=>i!==idx))};
const finish=()=>{const fc={salary:parseFloat(cfg.salary)||0,rent:parseFloat(cfg.rent)||0,exchangeRate:parseFloat(cfg.exchangeRate)||83.5,cards:cfg.cards.filter(c=>c.name).map(c=>({...c,dueDate:parseInt(c.dueDate)||1})),sips:cfg.sips.filter(s=>s.name).map(s=>({...s,amountINR:parseFloat(s.amountINR)||0,date:parseInt(s.date)||1})),stocks:cfg.stocks.filter(s=>s.name).map(s=>({...s,qty:parseFloat(s.qty)||0,buyPrice:parseFloat(s.buyPrice)||0})),studentLoan:{amountINR:parseFloat(cfg.studentLoan.amountINR)||0,date:parseInt(cfg.studentLoan.date)||1,totalRemaining:parseFloat(cfg.studentLoan.totalRemaining)||0},subscriptions:cfg.subscriptions.filter(s=>s.name).map(s=>({...s,amount:parseFloat(s.amount)||0})),customBudget:[]};const fl=lending.filter(l=>l.name).map(l=>({...l,amount:parseFloat(l.amount)||0,settled:false}));onComplete(fc,fl)};
const steps=[{t:"Welcome",s:"Let's get your financial HQ ready, boss."},{t:"Income",s:"Monthly take-home."},{t:"Housing",s:"Rent or housing."},{t:"Cards",s:"Credit cards & due dates."},{t:"Investments",s:"SIPs and stocks."},{t:"Loans",s:"Active loans."},{t:"Subscriptions",s:"Recurring payments."},{t:"Lending",s:"Who owes you?"},{t:"Review",s:"Looking good, sir?"}];
const ir={display:"flex",gap:8,alignItems:"flex-end",marginBottom:10,animation:"slideR .3s ease"};
return <div style={{height:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif",padding:20}}><div style={{width:"100%",maxWidth:560}}>
<div style={{display:"flex",gap:4,marginBottom:32}}>{steps.map((_,i)=> <div key={i} style={{flex:1,height:3,borderRadius:2,background:i<=step?T.accent:"rgba(255,255,255,0.06)",transition:"background .3s"}}/>)}</div>
<div style={{marginBottom:28}}><div style={{fontSize:9,color:T.accent,fontWeight:700,letterSpacing:"3px",fontFamily:"'JetBrains Mono'",marginBottom:8}}>STEP {step+1}/{steps.length}</div><h1 style={{fontSize:28,fontWeight:700,color:T.text,margin:"0 0 6px"}}>{steps[step].t}</h1><p style={{fontSize:13,color:T.textSec,margin:0}}>{steps[step].s}</p></div>
<GC hover={false} style={{marginBottom:24,minHeight:180}}>
{step===0&&<div style={{textAlign:"center"}}><div style={{width:60,height:60,borderRadius:16,background:T.grad1,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",boxShadow:"0 0 40px rgba(0,232,176,.2)"}}><Wallet size={28} color="#030507"/></div><p style={{color:T.textSec,fontSize:14,lineHeight:1.6}}>Vault — Your personal finance command center.<br/>A few questions to get everything dialed in.</p></div>}
{step===1&&<div><Inp label="Monthly Salary (USD)" value={cfg.salary} onChange={v=>uc("salary",v)} type="number" placeholder="e.g. 3000"/><Inp label="Exchange Rate (1 USD = ₹)" value={cfg.exchangeRate} onChange={v=>uc("exchangeRate",v)} type="number"/></div>}
{step===2&&<Inp label="Monthly Rent (USD)" value={cfg.rent} onChange={v=>uc("rent",v)} type="number" placeholder="e.g. 625"/>}
{step===3&&<div>{cfg.cards.map((c,i)=> <div key={c.id} style={ir}><div style={{flex:1}}><Inp label="Card" value={c.name} onChange={v=>ua("cards",i,"name",v)} placeholder="Discover"/></div><div style={{width:90}}><Inp label="Due" value={c.dueDate} onChange={v=>ua("cards",i,"dueDate",v)} type="number" placeholder="15"/></div><button onClick={()=>ra("cards",i)} style={{background:"none",border:"none",color:T.textMut,cursor:"pointer",padding:"0 0 16px"}}><Trash2 size={14}/></button></div>)}<Btn small variant="ghost" onClick={addC}><Plus size={13}/> Add Card</Btn></div>}
{step===4&&<div><div style={{fontSize:12,color:T.accent,fontWeight:700,marginBottom:12,letterSpacing:"1px"}}>SIPs</div>{cfg.sips.map((s,i)=> <div key={s.id} style={{...ir,flexWrap:"wrap"}}><div style={{flex:"1 1 100px"}}><Inp label="Fund" value={s.name} onChange={v=>ua("sips",i,"name",v)} placeholder="Nifty 50"/></div><div style={{width:90}}><Inp label="₹/mo" value={s.amountINR} onChange={v=>ua("sips",i,"amountINR",v)} type="number"/></div><div style={{width:60}}><Inp label="Date" value={s.date} onChange={v=>ua("sips",i,"date",v)} type="number"/></div><button onClick={()=>ra("sips",i)} style={{background:"none",border:"none",color:T.textMut,cursor:"pointer",padding:"0 0 16px"}}><Trash2 size={14}/></button></div>)}<Btn small variant="ghost" onClick={addS} style={{marginBottom:16}}><Plus size={13}/> Add SIP</Btn>
<div style={{fontSize:12,color:T.purple,fontWeight:700,marginBottom:12,letterSpacing:"1px"}}>STOCKS</div>{cfg.stocks.map((s,i)=> <div key={s.id} style={{...ir,flexWrap:"wrap"}}><div style={{flex:"1 1 80px"}}><Inp label="Stock" value={s.name} onChange={v=>ua("stocks",i,"name",v)} placeholder="TCS"/></div><div style={{width:60}}><Inp label="Qty" value={s.qty} onChange={v=>ua("stocks",i,"qty",v)} type="number"/></div><div style={{width:80}}><Inp label="Buy ₹" value={s.buyPrice} onChange={v=>ua("stocks",i,"buyPrice",v)} type="number"/></div><button onClick={()=>ra("stocks",i)} style={{background:"none",border:"none",color:T.textMut,cursor:"pointer",padding:"0 0 16px"}}><Trash2 size={14}/></button></div>)}<Btn small variant="ghost" onClick={addSt}><Plus size={13}/> Add Stock</Btn></div>}
{step===5&&<div><Inp label="Monthly EMI (INR)" value={cfg.studentLoan.amountINR} onChange={v=>setCfg(p=>({...p,studentLoan:{...p.studentLoan,amountINR:v}}))} type="number" placeholder="15000"/><Inp label="EMI Date" value={cfg.studentLoan.date} onChange={v=>setCfg(p=>({...p,studentLoan:{...p.studentLoan,date:v}}))} type="number" placeholder="1"/><Inp label="Remaining (INR)" value={cfg.studentLoan.totalRemaining} onChange={v=>setCfg(p=>({...p,studentLoan:{...p.studentLoan,totalRemaining:v}}))} type="number" placeholder="1500000"/><p style={{color:T.textMut,fontSize:11}}>No loans? Skip ahead, boss.</p></div>}
{step===6&&<div>{cfg.subscriptions.map((s,i)=> <div key={s.id} style={ir}><div style={{flex:1}}><Inp label="Name" value={s.name} onChange={v=>ua("subscriptions",i,"name",v)} placeholder="Spotify"/></div><div style={{width:80}}><Inp label="$/mo" value={s.amount} onChange={v=>ua("subscriptions",i,"amount",v)} type="number"/></div><button onClick={()=>ra("subscriptions",i)} style={{background:"none",border:"none",color:T.textMut,cursor:"pointer",padding:"0 0 16px"}}><Trash2 size={14}/></button></div>)}<Btn small variant="ghost" onClick={addSub}><Plus size={13}/> Add</Btn></div>}
{step===7&&<div>{lending.map((l,i)=> <div key={l.id} style={{...ir,flexWrap:"wrap"}}><div style={{flex:"1 1 80px"}}><Inp label="Name" value={l.name} onChange={v=>ua("lending",i,"name",v)} placeholder="Rahul"/></div><div style={{width:70}}><Inp label="Amt" value={l.amount} onChange={v=>ua("lending",i,"amount",v)} type="number"/></div><div style={{width:70}}><Inp label="Cur" value={l.currency} onChange={v=>ua("lending",i,"currency",v)} options={[{value:"USD",label:"$"},{value:"INR",label:"₹"}]}/></div><div style={{width:80}}><Inp label="Type" value={l.delayType} onChange={v=>ua("lending",i,"delayType",v)} options={[{value:"flexible",label:"Flex"},{value:"timed",label:"Timed"}]}/></div><button onClick={()=>ra("lending",i)} style={{background:"none",border:"none",color:T.textMut,cursor:"pointer",padding:"0 0 16px"}}><Trash2 size={14}/></button></div>)}<Btn small variant="ghost" onClick={addL}><Plus size={13}/> Add</Btn></div>}
{step===8&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,fontSize:13}}>{[["SALARY",`$${cfg.salary||"0"}/mo`],["RENT",`$${cfg.rent||"0"}/mo`],["CARDS",cfg.cards.filter(c=>c.name).length],["SIPs",cfg.sips.filter(s=>s.name).length],["STOCKS",cfg.stocks.filter(s=>s.name).length],["LENDING",lending.filter(l=>l.name).length+" people"]].map(([k,v],i)=> <div key={i} style={{padding:12,background:"rgba(255,255,255,.02)",borderRadius:10,border:`1px solid ${T.border}`}}><div style={{color:T.textMut,fontSize:10,marginBottom:4}}>{k}</div><div style={{color:T.text,fontWeight:600,fontFamily:"'JetBrains Mono'"}}>{v}</div></div>)}</div>}
</GC>
<div style={{display:"flex",gap:10,justifyContent:"space-between"}}>{step>0?<Btn variant="ghost" onClick={()=>setStep(s=>s-1)}>Back</Btn>:<div/>}{step<8?<Btn onClick={()=>setStep(s=>s+1)}>Continue <ChevR size={15}/></Btn>:<Btn onClick={finish}>Launch Vault <ChevR size={15}/></Btn>}</div>
{step===0&&<button onClick={()=>onComplete({salary:0,rent:0,exchangeRate:83.5,cards:[],sips:[],stocks:[],studentLoan:{amountINR:0,date:1,totalRemaining:0},subscriptions:[],customBudget:[]},[])} style={{display:"block",margin:"20px auto 0",background:"none",border:"none",color:T.textMut,fontSize:11,cursor:"pointer",fontFamily:"'DM Sans'",textDecoration:"underline"}}>Skip for now</button>}
</div></div>}

// ── DASHBOARD ──
function Dash({config,updateConfig,expenses,updateExpenses,payments,updatePayments,lending,history,updateHistory,onSetup}){
  const rate=config.exchangeRate;const sipUSD=config.sips.reduce((s,x)=>s+toUSD(x.amountINR,rate),0);const loanUSD=toUSD(config.studentLoan.amountINR,rate);const subsT=config.subscriptions.reduce((s,x)=>s+x.amount,0);const fixedT=config.rent+sipUSD+loanUSD+subsT;const varT=expenses.reduce((s,e)=>s+(e.currency==="USD"?e.amount:toUSD(e.amount,rate)),0);const rem=config.salary-fixedT-varT;const sr=((rem/Math.max(config.salary,1))*100).toFixed(1);const pendL=lending.filter(l=>!l.settled);const lendT=pendL.reduce((s,l)=>s+(l.currency==="USD"?l.amount:toUSD(l.amount,rate)),0);
  const pieSegs=[{name:"Rent",value:config.rent},{name:"SIPs",value:sipUSD},{name:"Loan",value:loanUSD},{name:"Subs",value:subsT},{name:"Spending",value:varT},{name:"Free",value:Math.max(0,rem)}].filter(s=>s.value>0);const totalPie=pieSegs.reduce((s,x)=>s+x.value,0);
  const alerts=[...config.cards.map(c=>({label:c.name,days:daysUntil(c.dueDate)})),...config.sips.map(s=>({label:s.name,days:daysUntil(s.date)})),config.studentLoan.amountINR>0?{label:"Loan EMI",days:daysUntil(config.studentLoan.date)}:null].filter(Boolean).sort((a,b)=>a.days-b.days);
  const[showAddBudget,setShowAddBudget]=useState(false);const[showNewMonth,setShowNewMonth]=useState(false);
  const toggle=id=>updatePayments(p=>({...p,[id]:!p[id]}));
  const archive=()=>{updateHistory(prev=>[...prev,{month:mNames[new Date().getMonth()],spending:fixedT+varT,savings:rem,variable:varT}].slice(-12));updateExpenses([]);updatePayments({});setShowNewMonth(false)};
  const incomplete=config.salary===0;

  return <div>
    {incomplete&&<div onClick={onSetup} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 20px",background:`linear-gradient(135deg,${T.yellow}08,${T.orange}05)`,border:`1px solid ${T.yellow}33`,borderRadius:14,marginBottom:18,cursor:"pointer",animation:"fadeUp .4s ease"}}><div style={{display:"flex",alignItems:"center",gap:12}}><div style={{width:32,height:32,borderRadius:9,background:T.yellow+"18",display:"flex",alignItems:"center",justifyContent:"center"}}><Wallet size={16} color={T.yellow}/></div><div><div style={{fontSize:13,fontWeight:700,color:T.text}}>Complete your setup, boss</div><div style={{fontSize:11,color:T.textSec,marginTop:2}}>Add salary, cards & investments to unlock full tracking</div></div></div><ChevR size={18} color={T.yellow}/></div>}
    <Greeting config={config} expenses={expenses} payments={payments} lending={lending}/>
    <div style={{display:"flex",gap:12,marginBottom:18,flexWrap:"wrap"}}><GC style={{flex:"1 1 auto",padding:"14px 20px"}} hover={false}><div style={{display:"flex",alignItems:"center",gap:7,marginBottom:10}}><div style={{animation:"pulse 2s infinite"}}><Bell size={13} color={T.yellow}/></div><span style={{fontSize:11,fontWeight:700,color:T.text,letterSpacing:"1.5px",textTransform:"uppercase"}}>Upcoming</span></div><div style={{display:"flex",gap:8,overflowX:"auto"}}>{alerts.length===0?<span style={{color:T.textMut,fontSize:12}}>All clear, boss</span>:alerts.slice(0,6).map((a,i)=> <div key={i} style={{display:"flex",alignItems:"center",gap:8,background:"rgba(255,255,255,.03)",borderRadius:10,padding:"8px 14px",minWidth:"fit-content",border:`1px solid ${T.border}`}}><span style={{fontSize:11,color:T.textSec,whiteSpace:"nowrap"}}>{a.label}</span><Badge days={a.days}/></div>)}</div></GC><GC style={{flexShrink:0,padding:"14px 20px",display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",cursor:"pointer",minWidth:140}} delay={.05} onClick={()=>setShowNewMonth(true)}><RefreshCw size={18} color={T.accent}/><span style={{fontSize:10,fontWeight:700,color:T.accent,marginTop:6,letterSpacing:"1px"}}>NEW MONTH</span></GC></div>
    <Modal open={showNewMonth} onClose={()=>setShowNewMonth(false)} title="New Month, boss?"><p style={{color:T.textSec,fontSize:13,lineHeight:1.6,margin:"0 0 16px"}}>Archive current month (spent: {fmt(fixedT+varT)}, saved: {fmt(rem)}). Lending carries over.</p><div style={{display:"flex",gap:10}}><Btn onClick={archive} style={{flex:1,justifyContent:"center"}}><Check size={14}/> Archive</Btn><Btn variant="ghost" onClick={()=>setShowNewMonth(false)} style={{flex:1,justifyContent:"center"}}>Cancel</Btn></div></Modal>
    <div style={{display:"flex",gap:14,marginBottom:18,flexWrap:"wrap"}}><div style={{flex:"1 1 500px",display:"flex",gap:12,flexWrap:"wrap"}}><Metric icon={DollarSign} label="Take Home" value={<Ctr value={config.salary}/>} sub={fmt(toINR(config.salary,rate),"INR")} delay={.04}/><Metric icon={ArrowDownRight} label="Outflow" value={<Ctr value={fixedT+varT}/>} color={T.red} delay={.08}/><Metric icon={PiggyBank} label="Remaining" value={<Ctr value={rem}/>} sub={`${sr}% savings`} color={rem>0?T.accent:T.red} delay={.12}/><Metric icon={Users} label="Lent Out" value={<Ctr value={lendT}/>} sub={`${pendL.length} pending`} color={T.yellow} delay={.16}/></div><ArcReactor config={config} expenses={expenses} payments={payments} lending={lending}/></div>
    <GC delay={.2} style={{marginBottom:18}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}><h3 style={{color:T.text,fontSize:14,fontWeight:700,margin:0}}>Budget Allocation</h3><Btn small variant="ghost" onClick={()=>setShowAddBudget(true)}><Plus size={13}/> Add</Btn></div><div style={{display:"flex",gap:20,alignItems:"center",flexWrap:"wrap"}}><div style={{flex:"1 1 250px",minWidth:210}}><ThreeDonut segments={pieSegs} height={220}/></div><div style={{flex:"1 1 230px",minWidth:190}}>{pieSegs.map((d,i)=>{const pct=totalPie>0?((d.value/totalPie)*100).toFixed(1):"0";return <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 10px",borderRadius:7,marginBottom:3,background:i%2===0?"rgba(255,255,255,.02)":"transparent"}}><div style={{display:"flex",alignItems:"center",gap:7}}><div style={{width:7,height:7,borderRadius:3,background:PC[i%PC.length]}}/><span style={{fontSize:12,color:T.text}}>{d.name}</span></div><div style={{display:"flex",gap:8}}><span style={{fontSize:11,fontWeight:600,color:T.textSec,fontFamily:"'JetBrains Mono'"}}>{fmt(d.value)}</span><span style={{fontSize:10,color:T.textMut,fontFamily:"'JetBrains Mono'",minWidth:32,textAlign:"right"}}>{pct}%</span></div></div>})}</div></div></GC>
    <Modal open={showAddBudget} onClose={()=>setShowAddBudget(false)} title="Add Budget Item">{(() => {const[n,setN]=useState("");const[a,setA]=useState("");const[c,setC]=useState("USD");return <div><Inp label="Name" value={n} onChange={setN} placeholder="e.g. Crowdfunding"/><Inp label="Amount/mo" value={a} onChange={setA} type="number"/><Inp label="Currency" value={c} onChange={setC} options={[{value:"USD",label:"USD"},{value:"INR",label:"INR"}]}/><Btn onClick={()=>{if(!n||!a)return;updateConfig(p=>({...p,customBudget:[...(p.customBudget||[]),{id:Date.now(),name:n,amount:parseFloat(a),currency:c}]}));setShowAddBudget(false)}} style={{width:"100%",justifyContent:"center"}}><Plus size={14}/> Add</Btn></div>})()}</Modal>
    <GC delay={.24} style={{marginBottom:18}}><h3 style={{color:T.text,fontSize:14,fontWeight:700,margin:"0 0 14px"}}>Monthly Actions</h3><div style={{display:"flex",flexDirection:"column",gap:6}}>{[...config.sips.map(s=>({id:`sip-${s.id}`,label:`${s.name} SIP`,amt:fmt(s.amountINR,"INR")})),config.studentLoan.amountINR>0?{id:"loan",label:"Loan EMI",amt:fmt(config.studentLoan.amountINR,"INR")}:null,...config.cards.map(c=>({id:`card-${c.id}`,label:`${c.name} Due`,amt:`${daysUntil(c.dueDate)}d`}))].filter(Boolean).map(item=>{const paid=payments[item.id];return <button key={item.id} onClick={()=>toggle(item.id)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",background:paid?T.accent+"0a":"rgba(255,255,255,.02)",border:`1px solid ${paid?T.accent+"33":T.border}`,borderRadius:10,cursor:"pointer",width:"100%",transition:"all .3s"}}><span style={{color:T.text,fontSize:12,fontWeight:500}}>{item.label}</span><div style={{display:"flex",alignItems:"center",gap:7}}><span style={{color:T.textSec,fontSize:11,fontFamily:"'JetBrains Mono'"}}>{item.amt}</span>{paid?<Check size={14} color={T.accent}/>:<Clock size={12} color={T.textMut}/>}</div></button>})}</div></GC>
    <GC delay={.28}><h3 style={{color:T.text,fontSize:14,fontWeight:700,margin:"0 0 4px"}}>Spending — 3D</h3>{history.length>0?<ThreeScene data={history.map(h=>({label:h.month,value:h.spending}))} height={230}/>:<div style={{padding:30,textAlign:"center",color:T.textMut,fontSize:12}}>Archive your first month to start tracking, boss</div>}</GC>
  </div>;
}

// ── NAV + APP ──
const navItems=[{id:"dashboard",label:"Dashboard",icon:LayoutDashboard},{id:"expenses",label:"Expenses",icon:Receipt},{id:"investments",label:"Investments",icon:TrendingUp},{id:"lending",label:"Lending",icon:HandCoins},{id:"split",label:"Split",icon:Users},{id:"assignments",label:"Assignments",icon:FolderOpen},{id:"analytics",label:"Analytics",icon:Activity},{id:"calculator",label:"Calculator",icon:Calculator},{id:"settings",label:"Settings",icon:Settings}];

export default function App(){
  const[page,setPage]=useState("dashboard");
  const[config,updateConfig,cl]=useStore("vault:config",null);
  const[expenses,updateExpenses,el]=useStore("vault:expenses",[]);
  const[lending,updateLending,ll]=useStore("vault:lending",[]);
  const[crowdfunding,updateCF,cfl]=useStore("vault:cf",[]);
  const[payments,updatePayments]=useStore("vault:payments",{});
  const[history,updateHistory]=useStore("vault:history",[]);
  const[splits,updateSplits]=useStore("vault:splits",{people:[],transactions:[]});
  const[assignments,updateAssignments]=useStore("vault:assignments",[]);
  const[showOnboarding,setShowOnboarding]=useState(false);
  const[sb,setSb]=useState(true);
  const loaded=cl&&el&&ll&&cfl;

  const handleComplete=(cfg,lend)=>{updateConfig(cfg);if(lend.length>0)updateLending(lend);setShowOnboarding(false)};

  if(!loaded)return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:T.bg,fontFamily:"'DM Sans'"}}><div style={{textAlign:"center"}}><div style={{width:48,height:48,borderRadius:14,background:T.grad1,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",animation:"pulse 1.5s infinite"}}><Wallet size={24} color="#030507"/></div><div style={{color:T.textSec,fontSize:13}}>Loading Vault...</div></div></div>;
  if(!config||showOnboarding)return <Onboarding onComplete={handleComplete}/>;

  const render=()=>{switch(page){
    case"dashboard":return <Dash config={config} updateConfig={updateConfig} expenses={expenses} updateExpenses={updateExpenses} payments={payments} updatePayments={updatePayments} lending={lending} history={history} updateHistory={updateHistory} onSetup={()=>setShowOnboarding(true)}/>;
    case"expenses":return <Exp config={config} expenses={expenses} updateExpenses={updateExpenses}/>;
    case"investments":return <Invest config={config} updateConfig={updateConfig} crowdfunding={crowdfunding} updateCF={updateCF}/>;
    case"lending":return <Lend config={config} lending={lending} updateLending={updateLending}/>;
    case"split":return <SplitPage config={config} splits={splits} updateSplits={updateSplits}/>;
    case"assignments":return <AssignmentsPage assignments={assignments} updateAssignments={updateAssignments}/>;
    case"analytics":return <Analytics config={config} history={history}/>;
    case"calculator":return <Calc config={config}/>;
    case"settings":return <Sett config={config} updateConfig={updateConfig}/>;
    default:return null;
  }};

  return <div style={{display:"flex",height:"100vh",background:T.bg,fontFamily:"'DM Sans',sans-serif",color:T.text,overflow:"hidden"}}>
    <div style={{width:sb?220:64,background:"rgba(8,12,20,.95)",borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",transition:"width .3s cubic-bezier(.16,1,.3,1)",overflow:"hidden",flexShrink:0}}>
      <div style={{padding:sb?"24px 20px 20px":"24px 12px 20px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:11}}>
        <div style={{width:36,height:36,borderRadius:11,background:T.grad1,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:"0 0 24px rgba(0,232,176,.18)"}}><Wallet size={18} color="#030507" strokeWidth={2.5}/></div>
        {sb&&<div><div style={{fontSize:15,fontWeight:700,color:T.text,lineHeight:1.1,letterSpacing:"-.5px"}}>Vault</div><div style={{fontSize:9,color:T.textMut,letterSpacing:"2px",textTransform:"uppercase"}}>Financial HQ</div></div>}
      </div>
      <nav style={{flex:1,padding:"10px 8px",overflow:"auto"}}>{navItems.map(item=>{const act=page===item.id;return <button key={item.id} onClick={()=>setPage(item.id)} className={`ni ${act?"act":""}`} style={{display:"flex",alignItems:"center",gap:11,width:"100%",padding:sb?"9px 14px":"9px 0",justifyContent:sb?"flex-start":"center",background:act?"rgba(0,232,176,.06)":"transparent",border:"none",borderRadius:9,cursor:"pointer",color:act?T.accent:T.textSec,fontSize:12,fontWeight:act?600:400,fontFamily:"'DM Sans'",marginBottom:1}}><item.icon size={16}/>{sb&&item.label}</button>})}</nav>
      <div style={{padding:"8px 12px",borderTop:`1px solid ${T.border}`}}><div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:5,height:5,borderRadius:"50%",background:T.accent,animation:"pulse 2s infinite"}}/>{sb&&<span style={{fontSize:9,color:T.textMut}}>Auto-saving</span>}</div></div>
      <button onClick={()=>setSb(!sb)} style={{padding:12,border:"none",borderTop:`1px solid ${T.border}`,background:"transparent",color:T.textMut,cursor:"pointer",display:"flex",justifyContent:"center"}}>{sb?<ChevronLeft size={16}/>:<ChevronRight size={16}/>}</button>
    </div>
    <div style={{flex:1,overflow:"auto",padding:"24px 28px"}}><div style={{maxWidth:1100,margin:"0 auto"}}>{render()}</div></div>
  </div>;
}
