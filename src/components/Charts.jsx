import { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { T, toUSD } from "../config/theme";
import { GC } from "./ui";

// ── 3D DONUT CHART ──
export function ThreeDonut({ segments, height = 230 }) {
  const ref = useRef();
  const raf = useRef();

  useEffect(() => {
    if (!ref.current || !segments.length) return;
    const w = ref.current.clientWidth, h = height;
    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
    cam.position.set(0, 4, 6);
    cam.lookAt(0, 0, 0);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    ref.current.innerHTML = "";
    ref.current.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dl = new THREE.DirectionalLight(0xffffff, 0.7);
    dl.position.set(3, 5, 3);
    scene.add(dl);
    scene.add(new THREE.PointLight(0x00e8b0, 0.4, 20));

    const total = segments.reduce((s, x) => s + x.value, 0);
    const cols = [0x00e8b0, 0x3b82f6, 0xff6b35, 0xa855f7, 0xffbe0b, 0xff3b5c, 0x06b6d4];
    let startAngle = 0;
    const group = new THREE.Group();

    segments.forEach((seg, i) => {
      if (seg.value <= 0) return;
      const angle = (seg.value / total) * Math.PI * 2;
      const shape = new THREE.Shape();
      for (let j = 0; j <= 32; j++) {
        const a = startAngle + (j / 32) * angle;
        shape.lineTo(Math.cos(a) * 2.2, Math.sin(a) * 2.2);
      }
      for (let j = 32; j >= 0; j--) {
        const a = startAngle + (j / 32) * angle;
        shape.lineTo(Math.cos(a) * 1.2, Math.sin(a) * 1.2);
      }
      shape.closePath();
      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: 0.5, bevelEnabled: true,
        bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2,
      });
      const mat = new THREE.MeshPhongMaterial({
        color: cols[i % cols.length], transparent: true, opacity: 0.88,
        emissive: cols[i % cols.length], emissiveIntensity: 0.1, shininess: 60,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      group.add(mesh);
      startAngle += angle;
    });

    scene.add(group);
    let a = 0;
    const animate = () => {
      raf.current = requestAnimationFrame(animate);
      a += 0.005;
      group.rotation.y = a;
      renderer.render(scene, cam);
    };
    animate();

    return () => { cancelAnimationFrame(raf.current); renderer.dispose(); };
  }, [segments, height]);

  return <div ref={ref} style={{ width: "100%", height, borderRadius: 14, overflow: "hidden" }} />;
}

// ── 3D BAR CHART ──
export function ThreeScene({ data, height = 240 }) {
  const ref = useRef();
  const raf = useRef();

  useEffect(() => {
    if (!ref.current || !data.length) return;
    const w = ref.current.clientWidth, h = height;
    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
    cam.position.set(8, 6, 12);
    cam.lookAt(0, 1, 0);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    ref.current.innerHTML = "";
    ref.current.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const dl = new THREE.DirectionalLight(0xffffff, 0.8);
    dl.position.set(5, 8, 5);
    scene.add(dl);

    const gridMat = new THREE.MeshBasicMaterial({ color: 0x0a1020, wireframe: true, transparent: true, opacity: 0.25 });
    const grid = new THREE.Mesh(new THREE.PlaneGeometry(16, 16, 16, 16), gridMat);
    grid.rotation.x = -Math.PI / 2;
    scene.add(grid);

    const cols = [0x00e8b0, 0x3b82f6, 0xff6b35, 0xa855f7, 0xffbe0b, 0x00b4d8];
    const max = Math.max(...data.map((d) => d.value), 1);

    data.forEach((d, i) => {
      const barH = (d.value / max) * 4.5;
      const geo = new THREE.BoxGeometry(0.8, barH, 0.8);
      const mat = new THREE.MeshPhongMaterial({
        color: cols[i % cols.length], transparent: true, opacity: 0.85,
        emissive: cols[i % cols.length], emissiveIntensity: 0.12, shininess: 80,
      });
      const bar = new THREE.Mesh(geo, mat);
      bar.position.set((i - data.length / 2) * 1.6 + 0.8, barH / 2, 0);
      scene.add(bar);

      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo),
        new THREE.LineBasicMaterial({ color: cols[i % cols.length], transparent: true, opacity: 0.35 })
      );
      edges.position.copy(bar.position);
      scene.add(edges);
    });

    let angle = 0;
    const animate = () => {
      raf.current = requestAnimationFrame(animate);
      angle += 0.003;
      cam.position.x = 12 * Math.sin(angle);
      cam.position.z = 12 * Math.cos(angle);
      cam.lookAt(0, 1.5, 0);
      renderer.render(scene, cam);
    };
    animate();

    return () => { cancelAnimationFrame(raf.current); renderer.dispose(); };
  }, [data, height]);

  return <div ref={ref} style={{ width: "100%", height, borderRadius: 14, overflow: "hidden" }} />;
}

// ── ARC REACTOR HEALTH GAUGE ──
export function ArcReactor({ config, expenses, payments, lending }) {
  const [anim, setAnim] = useState(0);
  const rf = useRef();
  const r = config.exchangeRate;

  const sipUSD = config.sips.reduce((s, x) => s + toUSD(x.amountINR, r), 0);
  const fixedT = config.rent + sipUSD + toUSD(config.studentLoan.amountINR, r) + config.subscriptions.reduce((s, x) => s + x.amount, 0);
  const varT = expenses.reduce((s, e) => s + (e.currency === "USD" ? e.amount : toUSD(e.amount, r)), 0);
  const rem = config.salary - fixedT - varT;

  const savScore = Math.min(((rem / Math.max(config.salary, 1)) * 100) / 50, 1) * 30;
  const paidC = Object.values(payments).filter(Boolean).length;
  const totalA = config.sips.length + config.cards.length + 1;
  const payScore = (paidC / Math.max(totalA, 1)) * 30;
  const pendLend = lending.filter((l) => !l.settled).reduce((s, l) => s + (l.currency === "USD" ? l.amount : toUSD(l.amount, r)), 0);
  const lendScore = Math.max(0, 20 - (pendLend / Math.max(config.salary, 1)) * 40);
  const loanProg = config.studentLoan.totalRemaining > 0 ? 1 - config.studentLoan.totalRemaining / 2000000 : 1;
  const loanScore = Math.max(0, loanProg * 20);

  const health = Math.min(Math.round(savScore + payScore + lendScore + loanScore), 100);
  const color = health >= 70 ? T.accent : health >= 40 ? T.yellow : T.red;

  useEffect(() => {
    let s = 0;
    const step = (ts) => {
      if (!s) s = ts;
      const p = Math.min((ts - s) / 1500, 1);
      setAnim(1 - Math.pow(1 - p, 3));
      if (p < 1) rf.current = requestAnimationFrame(step);
    };
    rf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rf.current);
  }, [health]);

  const sz = 160, cx = sz / 2, cy = sz / 2, r1 = 64, r2 = 54;
  const c1 = 2 * Math.PI * r1, c2 = 2 * Math.PI * r2;

  return (
    <GC style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 12px", minWidth: 180 }} delay={0.2}>
      <div style={{ fontSize: 9, color: T.textSec, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 8 }}>HEALTH</div>
      <div style={{ position: "relative", width: sz, height: sz }}>
        <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`}>
          <circle cx={cx} cy={cy} r={r1} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="5" />
          <circle cx={cx} cy={cy} r={r1} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
            strokeDasharray={c1} strokeDashoffset={c1 * (1 - (health / 100) * anim)}
            transform={`rotate(-90 ${cx} ${cy})`} style={{ filter: `drop-shadow(0 0 6px ${color}66)` }} />
          <circle cx={cx} cy={cy} r={r2} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="3" />
          <circle cx={cx} cy={cy} r={r2} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" opacity="0.4"
            strokeDasharray={c2} strokeDashoffset={c2 * (1 - (health / 100) * anim * 0.85)}
            transform={`rotate(-90 ${cx} ${cy})`} />
          <circle cx={cx} cy={cy} r="4" fill={color} opacity="0.6" style={{ filter: `drop-shadow(0 0 6px ${color})` }}>
            <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2s" repeatCount="indefinite" />
          </circle>
          {Array.from({ length: 24 }).map((_, i) => {
            const a = ((i / 24) * 360 - 90) * Math.PI / 180;
            return (
              <line key={i}
                x1={cx + (r1 + 4) * Math.cos(a)} y1={cy + (r1 + 4) * Math.sin(a)}
                x2={cx + (r1 + 8) * Math.cos(a)} y2={cy + (r1 + 8) * Math.sin(a)}
                stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
            );
          })}
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 30, fontWeight: 700, color: T.text, fontFamily: "'JetBrains Mono'", letterSpacing: "-2px" }}>
            {Math.round(health * anim)}
          </div>
          <div style={{ fontSize: 8, color: T.textMut, fontWeight: 600, letterSpacing: "1px" }}>/ 100</div>
        </div>
      </div>
      <div style={{ fontSize: 10, color, fontWeight: 600, marginTop: 6, fontFamily: "'JetBrains Mono'" }}>
        {health >= 70 ? "OPTIMAL" : health >= 40 ? "MODERATE" : "CRITICAL"}
      </div>
    </GC>
  );
}