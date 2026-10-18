// Chapter 12: the stage. First person -> cinematic third person, music-reactive
// show, then the bouquet and the wish.
import content from '../content.js';
import { World3D, THREE, makeSky, billboard, toon, pixelTex } from '../three/engine3d.js';
import { canvas, charSprite, LOOKS } from '../core/sprites.js';
import { ui, wait, esc, el } from '../core/ui.js';
import { audio } from '../core/audio.js';
import { state } from '../core/state.js';
import { drawBouquet, wishParts, wishHTML } from '../core/photo.js';

const C = content.stage;
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function parseLRC(text) {
  const out = [];
  for (const line of text.split(/\r?\n/)) {
    const tags = [...line.matchAll(/\[(\d+):(\d+(?:\.\d+)?)\]/g)];
    const words = line.replace(/\[[^\]]*\]/g, '').trim();
    for (const m of tags) out.push({ t: +m[1] * 60 + +m[2], text: words });
  }
  return out.sort((a, b) => a.t - b.t);
}

function silhouette(src, rim) {
  const [c, x] = canvas(src.width, src.height);
  x.drawImage(src, 0, 0);
  x.globalCompositeOperation = 'source-in'; x.fillStyle = '#251c3a'; x.fillRect(0, 0, c.width, c.height);
  // rim light on the top edge
  const d = x.getImageData(0, 0, c.width, c.height);
  const r = parseInt(rim.slice(1, 3), 16), g = parseInt(rim.slice(3, 5), 16), b = parseInt(rim.slice(5, 7), 16);
  for (let i = 0; i < c.width; i++) for (let j = 0; j < c.height; j++) {
    const k = (j * c.width + i) * 4;
    if (d.data[k + 3] > 0) { d.data[k] = (r + 0x25) / 2; d.data[k + 1] = (g + 0x1c) / 2; d.data[k + 2] = (b + 0x3a) / 2; break; }
  }
  x.globalCompositeOperation = 'source-over'; x.putImageData(d, 0, 0);
  return c;
}

function backdropTexture() {
  const [c, x] = canvas(160, 80);
  const g = x.createLinearGradient(0, 0, 0, 80); g.addColorStop(0, '#1b1640'); g.addColorStop(1, '#4a2c5e');
  x.fillStyle = g; x.fillRect(0, 0, 160, 80);
  for (let i = 0; i < 70; i++) { x.fillStyle = Math.random() < 0.3 ? '#ffe9a8' : '#fff6ea'; x.fillRect(Math.random() * 160 | 0, Math.random() * 60 | 0, 1, 1); }
  // moon
  x.fillStyle = '#f6e7c0'; for (let j = -9; j <= 9; j++) { const w = Math.round(Math.sqrt(81 - j * j)); x.fillRect(128 - w, 24 + j, w * 2, 1); }
  x.fillStyle = '#e2cf9e'; x.fillRect(123, 20, 3, 2); x.fillRect(131, 27, 3, 3); x.fillRect(126, 29, 2, 2);
  // garland of flowers along the bottom & top
  const cols = ['#f08fa8', '#f6c45f', '#ffffff', '#b49ae0', '#8fd3b6'];
  for (let i = 0; i < 160; i += 5) { const y = 72 + Math.round(Math.sin(i * 0.12) * 2); x.fillStyle = '#4f9a4a'; x.fillRect(i, y + 2, 5, 1); x.fillStyle = cols[(i / 5) % 5]; x.fillRect(i + 1, y, 3, 3); x.fillStyle = '#fff6a0'; x.fillRect(i + 2, y + 1, 1, 1); }
  for (let i = 0; i < 160; i += 8) { const y = 4 + Math.round(Math.sin(i * 0.08) * 3); x.fillStyle = '#c4587a'; x.fillRect(i, y, 8, 1); x.fillStyle = cols[(i / 8) % 5]; x.fillRect(i + 3, y + 1, 3, 4); }
  // name in pixel font
  x.font = '18px VT323'; x.textAlign = 'center'; x.fillStyle = '#3a2350'; x.fillText(content.playerName, 35, 31); x.fillStyle = '#ffd7e0'; x.fillText(content.playerName, 34, 30);
  return c;
}

function beamMesh(color, len = 11, radius = 1.5) {
  const geo = new THREE.ConeGeometry(radius, len, 24, 1, true);
  geo.translate(0, -len / 2, 0);
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { color: { value: new THREE.Color(color) }, intensity: { value: 0 }, len: { value: len } },
    vertexShader: 'varying float vY; varying vec3 vN; varying vec3 vV; uniform float len; void main(){ vY = -position.y / len; vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform vec3 color; uniform float intensity; varying float vY; varying vec3 vN; varying vec3 vV; void main(){ float edge = pow(abs(dot(vN, vV)), 1.6); float a = intensity * pow(1.0 - vY, 1.4) * edge * 0.55; gl_FragColor = vec4(color * a, a); }',
  });
  const m = new THREE.Mesh(geo, mat);
  m.renderOrder = 5;
  return m;
}

export default async function stage(game) {
  const world = new World3D(game, { mode: 'rail', start: [0, 0, 9], bloom: 0.5, bloomThreshold: 0.7, fov: 55, inputMode: 'none' });
  const S = world.scene;
  world.add(makeSky(['#05061a', '#0b0d2a', '#1a1a46', '#2a2456'], new THREE.Vector3(0.3, 0.5, -1), { sun: '#fff6d8', glow: 0.25, sunSize: 0.9996 }));
  world.setTime({ fog: '#1a1430', fogNear: 18, fogFar: 70, ambient: '#5a5aa0', ambientI: 0.5, sun: '#9fb0ff', sunI: 0.4, sunPos: [10, 30, 20], hemiSky: '#2a2a5a', hemiGround: '#100a18', hemiI: 0.4 });
  world.grade.uniforms.vignette.value = 0.55;
  world.bloom.threshold = 0.82;
  world.hideHands = true;

  // stars
  const sp = []; for (let i = 0; i < 700; i++) { const a = Math.random() * Math.PI * 2, e = 0.12 + Math.random() * 1.3; sp.push(new THREE.Vector3(Math.cos(a) * Math.cos(e) * 600, Math.sin(e) * 600, Math.sin(a) * Math.cos(e) * 600)); }
  S.add(new THREE.Points(new THREE.BufferGeometry().setFromPoints(sp), new THREE.PointsMaterial({ color: '#fff6e0', size: 1.5, sizeAttenuation: false, fog: false })));

  // ground & street
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 120).rotateX(-Math.PI / 2), toon('#3a3048'));
  S.add(ground);
  // stage
  const deck = new THREE.Mesh(new THREE.BoxGeometry(12, 1.2, 7), toon('#6a4a3a')); deck.position.set(0, 0.6, -0.5); S.add(deck);
  const floor = new THREE.Mesh(new THREE.BoxGeometry(12.1, 0.06, 7.1), toon('#8a5f45')); floor.position.set(0, 1.22, -0.5); S.add(floor);
  const lip = new THREE.Mesh(new THREE.BoxGeometry(12.2, 0.2, 0.2), toon('#f6c45f')); lip.position.set(0, 1.2, 3.0); S.add(lip);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), new THREE.MeshBasicMaterial({ map: pixelTex(backdropTexture()), fog: false })); back.position.set(0, 4.2, -3.9); S.add(back);
  for (const x of [-6.1, 6.1]) { const pole = new THREE.Mesh(new THREE.BoxGeometry(0.25, 7.5, 0.25), toon('#2a2a36')); pole.position.set(x, 3.75, 2.5); S.add(pole); }
  const truss = new THREE.Mesh(new THREE.BoxGeometry(12.6, 0.3, 0.3), toon('#2a2a36')); truss.position.set(0, 7.4, 2.5); S.add(truss);
  const truss2 = truss.clone(); truss2.position.z = -2.5; S.add(truss2);
  const stairs = new THREE.Group(); for (let i = 0; i < 3; i++) { const st = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.4 * (i + 1), 0.5), toon('#5a3e30')); st.position.set(4.6, 0.2 * (i + 1), 4.4 - i * 0.5); stairs.add(st); } S.add(stairs);
  // curtains
  for (const x of [-6.6, 6.6]) { const cur = new THREE.Mesh(new THREE.BoxGeometry(1.2, 7, 0.3), toon('#9a2a4a')); cur.position.set(x, 3.5, -3.6); S.add(cur); }
  // lanterns strung around
  const lanternPts = [];
  for (let i = 0; i < 40; i++) { const t = i / 39; lanternPts.push(new THREE.Vector3(-14 + t * 28, 5.2 + Math.sin(t * Math.PI * 4) * -0.5, 9 + Math.sin(t * Math.PI) * 4)); }
  const lanternM = new THREE.Points(new THREE.BufferGeometry().setFromPoints(lanternPts), new THREE.PointsMaterial({ color: '#ffb35a', size: 5, sizeAttenuation: false }));
  S.add(lanternM);

  // lights + beams
  const beamCols = ['#ff7ab0', '#7fb0ff', '#ffd27a', '#b48aff', '#7fffd0', '#ff9a7a'];
  const beams = beamCols.map((c, i) => {
    const b = beamMesh(c);
    b.position.set(-5 + i * 2, 7.2, 2.5);
    b.userData = { base: (i - 2.5) * 0.12, ph: i * 1.3, on: 0 };
    S.add(b);
    const fx = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.45, 8), new THREE.MeshBasicMaterial({ color: c })); fx.position.copy(b.position).add(new THREE.Vector3(0, 0.1, 0)); S.add(fx);
    b.userData.fixture = fx;
    return b;
  });
  const key = new THREE.SpotLight('#fff0e0', 0, 30, 0.45, 0.6, 1); key.position.set(0, 9, 9); key.target.position.set(0, 1.4, 0); S.add(key, key.target);
  const wash = new THREE.PointLight('#ff8ab0', 0, 18); wash.position.set(0, 4, 2); S.add(wash);
  const wash2 = new THREE.PointLight('#7fa0ff', 0, 18); wash2.position.set(0, 3, -2); S.add(wash2);

  // Hazei & partner billboards
  const hazei = billboard(charSprite(LOOKS.hazei(), { pose: 'idle' }), 0.065);
  hazei.material.color.set('#e8dcea'); hazei.position.set(0, 1.25, 0.6); hazei.visible = false; S.add(hazei);
  const partner = billboard(charSprite(LOOKS.partner(), { pose: 'sit' }), 0.06);
  partner.material.color.set('#d8cce0'); partner.position.set(0.6, 0.0, 5.0); S.add(partner);

  // audience silhouettes
  const crowd = [];
  const looks = [LOOKS.kidA, LOOKS.kidB, LOOKS.hatGuy, LOOKS.florist, LOOKS.fruitUncle, LOOKS.barista, LOOKS.bakerAunt, LOOKS.shopLady, { ...LOOKS.partner(), glasses: false }, { ...LOOKS.hazei(), hairStyle: 'bun' }];
  const rims = ['#ff9ac8', '#9ab8ff', '#ffd89a', '#c8a8ff'];
  for (let row = 0; row < 7; row++) {
    const n = 9 + row * 2;
    for (let i = 0; i < n; i++) {
      const x = -((n - 1) / 2) * 1.0 + i * 1.0 + (Math.random() - 0.5) * 0.4;
      const z = 5.4 + row * 1.15 + (Math.random() - 0.5) * 0.3;
      if (row === 0 && Math.abs(x - 0.6) < 0.8) continue;
      const lk = looks[(row * 7 + i) % looks.length];
      const img = silhouette(charSprite(lk, { pose: Math.random() < 0.3 ? 'cheer' : 'idle' }), rims[(i + row) % 4]);
      const b = billboard(img, 0.058); b.position.set(x, 0, z); S.add(b);
      b.userData = { ph: Math.random() * 6, x, stick: Math.random() < 0.45 ? ['#ff6fb0', '#7fe0ff', '#ffe066', '#b48aff', '#ffffff'][Math.floor(Math.random() * 5)] : null };
      crowd.push(b);
    }
  }
  // glow sticks as points
  const stickGeo = new THREE.BufferGeometry();
  const sticks = crowd.filter((c) => c.userData.stick);
  const stickPos = new Float32Array(sticks.length * 3), stickCol = new Float32Array(sticks.length * 3);
  sticks.forEach((s, i) => { const c = new THREE.Color(s.userData.stick); stickCol.set([c.r, c.g, c.b], i * 3); });
  stickGeo.setAttribute('position', new THREE.BufferAttribute(stickPos, 3)); stickGeo.setAttribute('color', new THREE.BufferAttribute(stickCol, 3));
  const stickPts = new THREE.Points(stickGeo, new THREE.PointsMaterial({ size: 4, sizeAttenuation: false, vertexColors: true }));
  S.add(stickPts);

  // camera rig
  const cam = world.camera;
  const look = new THREE.Vector3(0, 2, 0);
  let camPos = new THREE.Vector3(0, 1.55, 6.2);
  const setCam = (p, l) => { camPos.copy(p); look.copy(l); };
  world.opts.update = () => { cam.position.copy(camPos); cam.lookAt(look); };

  // music-reactive state
  let analyser = null, freq = null; let energy = { bass: 0, mid: 0, high: 0 };
  let showT = 0; let lightsOn = 0; let songPlaying = false; let crowdEnergy = 0.3;
  world.every((dt, t) => {
    if (analyser) {
      analyser.getByteFrequencyData(freq);
      const avg = (a, b) => { let s = 0; for (let i = a; i < b; i++) s += freq[i]; return s / ((b - a) * 255); };
      const tgt = { bass: avg(1, 8), mid: avg(8, 60), high: avg(60, 200) };
      for (const k in energy) energy[k] += (tgt[k] - energy[k]) * Math.min(1, dt * 12);
    } else { energy.bass *= 0.95; energy.mid *= 0.95; energy.high *= 0.95; }
    showT += dt;
    beams.forEach((b, i) => {
      const u = b.userData;
      const kick = songPlaying ? energy.bass * 1.1 : 0;
      b.material.uniforms.intensity.value = u.on * (0.35 + kick + (songPlaying ? Math.max(0, Math.sin(t * 2 + u.ph)) * 0.2 : 0));
      b.rotation.z = u.base + Math.sin(t * (0.4 + energy.mid * 0.6) + u.ph) * (songPlaying ? 0.35 : 0.08);
      b.rotation.x = 0.45 + Math.cos(t * 0.3 + u.ph) * 0.2;
      u.fixture.visible = u.on > 0.1;
    });
    key.intensity = lightsOn * (14 + energy.mid * 22);
    wash.intensity = lightsOn * (3 + energy.bass * 10); wash2.intensity = lightsOn * (2 + energy.high * 10);
    wash.color.setHSL((t * 0.05) % 1, 0.7, 0.6);
    world.bloom.strength = 0.45 + energy.bass * 0.7;
    crowdEnergy += ((songPlaying ? 0.6 + energy.bass : 0.25) - crowdEnergy) * Math.min(1, dt * 2);
    crowd.forEach((c, i) => {
      const u = c.userData;
      c.position.x = u.x + Math.sin(t * (1.5 + crowdEnergy) + u.ph) * 0.08 * crowdEnergy;
      c.position.y = Math.max(0, Math.sin(t * 4 + u.ph) * 0.06 * crowdEnergy * (energy.bass > 0.55 ? 2 : 1));
    });
    sticks.forEach((s, i) => { stickPos.set([s.position.x + Math.sin(t * 3 + s.userData.ph) * 0.25, 1.75 + s.position.y + Math.cos(t * 3 + s.userData.ph) * 0.12, s.position.z], i * 3); });
    stickGeo.attributes.position.needsUpdate = true;
    // dust in the beams + petals
    if (lightsOn > 0 && Math.random() < dt * (6 + energy.high * 40)) world.glow.emit(new THREE.Vector3((Math.random() - 0.5) * 10, 1.5 + Math.random() * 5, (Math.random() - 0.5) * 6), new THREE.Vector3((Math.random() - 0.5) * 0.1, 0.05, 0), '#fff2d8', 4, { kind: 3 });
    if (songPlaying && Math.random() < dt * (2 + energy.bass * 10)) world.fx.emit(new THREE.Vector3((Math.random() - 0.5) * 12, 8, (Math.random() - 0.5) * 6), new THREE.Vector3(0.2, -0.6, 0), ['#ffc2d4', '#ffd9e4', '#fff0f5', '#ffe9a8'][Math.floor(Math.random() * 4)], 10, { kind: 1 });
  });

  audio.scene(null, [['crowd', 0.5]]);
  const fin = world.start();
  await game.enter({ dark: true });

  // ---------------------------------------------------- step up
  hazei.visible = false;
  setCam(new THREE.Vector3(4.6, 1.6, 6.6), new THREE.Vector3(1.5, 2.0, 0));
  await new Promise((resolve) => {
    world.interact.add({ always: true, label: content.prompts.stage, hold: 0.6, onDone: resolve });
  });
  world.interact.clear();
  // camera lifts from first person to cinematic third person, Hazei appears on stage
  audio.sfx('whoosh');
  hazei.visible = true; hazei.material.opacity = 0; hazei.material.transparent = true;
  const from = camPos.clone(), to = new THREE.Vector3(0, 2.3, 17);
  const lf = look.clone(), lt = new THREE.Vector3(0, 2.8, 0);
  for (let k = 0; k <= 1; k += 1 / 90) { setCam(from.clone().lerp(to, ease(k)), lf.clone().lerp(lt, ease(k))); hazei.material.opacity = Math.min(1, k * 2); await wait(16); }
  hazei.material.opacity = 1;
  ui.note(C.intro, 3000);
  audio.setBeds([['crowd', 0.25]], 3);
  // lights on in sequence
  for (const b of beams) { b.userData.on = 1; audio.sfx('pop', { pitch: beams.indexOf(b) * 2 }); await wait(380); }
  lightsOn = 1;
  await wait(800);

  // ---------------------------------------------------- song
  const buf = await audio.songBuffer();
  if (audio.songIsFallback) ui.note(content.ui.songMissing, 3500);
  if (audio.ctx.state !== 'running') {
    await new Promise((r) => { ui.actions([{ label: '▶ ' + content.ui.tapToPlay, cls: '', onClick: () => { audio.resume(); r(); } }]); });
    ui.actions(null);
  }
  let lyrics = [];
  try { const r = await fetch(content.song.lyrics); if (r.ok) lyrics = parseLRC(await r.text()); } catch { /* optional */ }
  audio.setBeds([], 2); audio.playMusic(null, 1.5);
  const fast = game.debug && new URLSearchParams(location.search).has('fast');
  const song = audio.playSong(buf);
  analyser = song.analyser; freq = new Uint8Array(analyser.frequencyBinCount);
  songPlaying = true;
  const dur = fast ? 10 : song.duration;
  // camera choreography keyframes: [fraction, pos, look]
  const keys = [
    [0.0, [0, 2.3, 17], [0, 2.8, 0]],
    [0.12, [0, 2.6, 13], [0, 2.4, 0]],
    [0.3, [0, 2.0, 5.8], [0, 2.2, 0.6]],
    [0.4, [-6.5, 2.6, 5.0], [0, 2.1, 0.6]],
    [0.55, [6.5, 2.6, 5.0], [0, 2.1, 0.6]],
    [0.66, [1.6, 1.4, 3.6], [0, 2.3, 0.6]],
    [0.78, [0, 7.5, 21], [0, 2.5, 0]],
    [0.9, [0, 5.0, 16], [0, 2.4, 0]],
    [1.0, [0, 3.4, 11], [0, 2.1, 0.6]],
  ].map(([f, p, l]) => [f, new THREE.Vector3(...p), new THREE.Vector3(...l)]);
  let lyricIdx = -1;
  await new Promise((resolve) => {
    const stop = world.every((dt, t) => {
      const st = fast ? Math.min(song.time * (song.duration / 10), song.duration) : song.time;
      const f = Math.min(1, Math.max(0, st / song.duration));
      let i = 0; while (i < keys.length - 2 && keys[i + 1][0] < f) i++;
      const [f0, p0, l0] = keys[i], [f1, p1, l1] = keys[i + 1];
      const k = ease(Math.min(1, (f - f0) / (f1 - f0)));
      setCam(p0.clone().lerp(p1, k).add(new THREE.Vector3(Math.sin(t * 0.4) * 0.15, Math.sin(t * 0.33) * 0.08, 0)), l0.clone().lerp(l1, k));
      // singing animation
      const open = energy.mid > 0.32 && Math.floor(t * 6) % 2 === 0;
      hazei.setCanvas(charSprite(LOOKS.hazei(), { pose: 'sing', mood: open ? 'normal' : 'happy', frame: 0 }));
      hazei.position.y = 1.25 + (energy.bass > 0.6 ? 0.03 : 0);
      partner.setCanvas(charSprite(LOOKS.partner(), { pose: f > 0.75 && Math.floor(t * 2) % 2 ? 'cheer' : 'sit', mood: 'happy' }));
      // lyrics
      if (lyrics.length) { let j = lyrics.length - 1; while (j >= 0 && lyrics[j].t > st) j--; if (j !== lyricIdx) { lyricIdx = j; ui.lyrics(j >= 0 ? lyrics[j].text : ''); } }
      if ((fast && song.time >= 10) || song.time >= song.duration + 0.3) { stop(); resolve(); }
    });
  });
  if (fast) song.stop();
  songPlaying = false; ui.lyrics('');

  // ---------------------------------------------------- applause & bouquet
  audio.sfx('applause'); audio.setBeds([['crowd', 0.8]], 0.5);
  ui.note(C.applause, 3500);
  for (let i = 0; i < 160; i++) world.fx.emit(new THREE.Vector3((Math.random() - 0.5) * 14, 7 + Math.random() * 4, (Math.random() - 0.5) * 8 + 1), new THREE.Vector3(0.2, -0.8 - Math.random() * 0.5, 0), ['#ffc2d4', '#ffd9e4', '#fff0f5', '#ffe9a8', '#f08fa8'][i % 5], 12, { kind: 1 });
  hazei.setCanvas(charSprite(LOOKS.hazei(), { pose: 'cheer', mood: 'happy' }));
  setCam(new THREE.Vector3(2.5, 3.2, 10.5), new THREE.Vector3(0.5, 1.6, 2.5));
  await wait(2200);
  // partner stands and walks to the stage
  const path = [new THREE.Vector3(0.6, 0, 5.0), new THREE.Vector3(4.6, 0, 5.0), new THREE.Vector3(4.6, 1.22, 3.1), new THREE.Vector3(1.1, 1.22, 0.7)];
  partner.setCanvas(charSprite(LOOKS.partner(), { pose: 'idle', mood: 'happy' }));
  await wait(500);
  for (let s = 0; s < path.length - 1; s++) {
    const a = path[s], b = path[s + 1]; const d = a.distanceTo(b); const steps = Math.ceil(d / 0.05);
    for (let k = 1; k <= steps; k++) {
      partner.position.lerpVectors(a, b, k / steps);
      const flip = b.x < a.x;
      partner.setCanvas(charSprite(LOOKS.partner(), { pose: 'walk', frame: Math.floor(k / 4) % 4, mood: 'happy' }), flip);
      setCam(new THREE.Vector3(1.2, 3.4, 10), partner.position.clone().lerp(new THREE.Vector3(0.5, 1.8, 0.6), 0.6).add(new THREE.Vector3(0, 0.6, 0)));
      await wait(18);
    }
  }
  partner.setCanvas(charSprite(LOOKS.partner(), { pose: 'bouquet', mood: 'happy' }), true);
  setCam(new THREE.Vector3(0.6, 2.1, 4.6), new THREE.Vector3(0.6, 2.05, 0.6));
  audio.setBeds([['crowd', 0.3]], 2);
  audio.playMusic('hill', 3);
  await wait(900);
  await ui.dialog([{ who: 'partner', text: C.bouquetLine }]);
  const picked = state.data.flowers;
  const bq = drawBouquet(picked, 288);
  const gifted = bq.flowers.some((f) => f.gift);
  if (gifted) await ui.dialog([{ who: 'partner', text: C.giftNote }]);
  // bouquet handover
  partner.setCanvas(charSprite(LOOKS.partner(), { pose: 'idle', mood: 'happy' }), true);
  hazei.setCanvas(charSprite(LOOKS.hazei(), { pose: 'bouquet', mood: 'happy' }));
  audio.sfx('yay'); audio.sfx('sparkle');
  for (let k = 0; k < 14; k++) world.glow.emit(new THREE.Vector3(0.3 + (Math.random() - 0.5), 2.6 + Math.random(), 0.8), new THREE.Vector3((Math.random() - 0.5) * 0.5, 0.8, 0), ['#ff8fb0', '#ffc2d4', '#ffe9a8'][k % 3], 2);
  await new Promise((resolve) => {
    ui.onModalClose = resolve;
    ui.modal((s) => {
      s.insertAdjacentHTML('beforeend', `<h2 class="center">${esc(content.epilogue.bouquetLabel)}</h2><p class="sub center">${esc(C.happy)}</p>`);
      bq.canvas.className = 'photo-preview'; bq.canvas.style.width = 'min(288px, 70vw)'; bq.canvas.style.background = 'radial-gradient(#ffe9f0, #ffd2df)'; bq.canvas.style.borderRadius = '12px';
      s.appendChild(bq.canvas);
      const row = el('div', 'row mt'); row.style.justifyContent = 'center';
      const b = el('button', 'btn', esc(content.ui.next)); b.onclick = () => ui.closeModal(); row.appendChild(b); s.appendChild(row);
    }, { closeable: false });
  });
  // wish reveal
  const parts = wishParts(state.data.omakase);
  await new Promise((resolve) => {
    ui.onModalClose = resolve;
    ui.modal((s) => {
      s.insertAdjacentHTML('beforeend', `<h2 class="center">${esc(C.wishTitle)}</h2>` + wishHTML(parts, 0.9));
      const row = el('div', 'row mt'); row.style.justifyContent = 'center';
      const b = el('button', 'btn', esc(C.toEpilogue)); b.onclick = () => ui.closeModal(); row.appendChild(b); s.appendChild(row);
      b.style.opacity = '0'; b.style.transition = 'opacity .8s'; setTimeout(() => { b.style.opacity = '1'; }, 7500);
    }, { closeable: false });
  });
  await game.leave(world, { dark: true, ms: 1400 });
  await fin;
  audio.stopAll(2);
}
