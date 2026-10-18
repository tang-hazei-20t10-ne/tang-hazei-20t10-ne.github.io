// Chapter 10: stargazing hill. Dusk to night, constellations, shooting star.
import content from '../content.js';
import { World3D, THREE, makeSky, pixelTex } from '../three/engine3d.js';
import { buildIsland, islandHeight, SPOTS } from '../three/island.js';
import { canvas, mix } from '../core/sprites.js';
import { ui, wait } from '../core/ui.js';
import { audio } from '../core/audio.js';
import { input } from '../core/input.js';

const C = content.hill;
const P = content.prompts;

// Constellation shapes as [azimuth, elevation] offsets in degrees.
const SHAPES = [
  { name: 0, center: [20, 62], pts: [[0, -6], [-5, 0], [-6, 5], [-3, 8], [0, 5], [3, 8], [6, 5], [5, 0], [0, -6]] }, // heart
  { name: 1, center: [-35, 55], pts: [[0, 0], [0, 6], [0, 0], [5, 2], [0, 0], [4, -4], [0, 0], [-4, -4], [0, 0], [-5, 2]] }, // flower
  { name: 2, center: [75, 50], pts: [[-5, 0], [-4, 6], [-1, 3], [1, 3], [4, 6], [5, 0], [0, -4], [-5, 0]] }, // cat
  { name: 3, center: [-90, 48], pts: [[-7, 0], [-6, 6], [-3, 2], [0, 7], [3, 2], [6, 6], [7, 0], [-7, 0]] }, // crown
];
const dirFrom = (az, el) => { const a = THREE.MathUtils.degToRad(az), e = THREE.MathUtils.degToRad(el); return new THREE.Vector3(Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e)); };

export default async function hill(game) {
  const H = islandHeight;
  const top = new THREE.Vector3(-23, H(-23, -22), -22);
  const near = (x, z) => Math.hypot(x - top.x, z - top.z) < 13 && H(x, z) > 2;
  const world = new World3D(game, { start: [top.x, top.y, top.z + 1], yaw: 0.6, pitch: 0.05, heightAt: H, walkable: near, bloom: 0.6, bloomThreshold: 0.7, maxPitch: 1.5 });
  const sunDir = new THREE.Vector3(-0.8, 0.02, -0.55);
  const sky = makeSky(['#252a5c', '#5a3f7c', '#c45a7a', '#f39a6a'], sunDir, { sun: '#ffc68a', glow: 0.6 });
  world.add(sky);
  const I = buildIsland(world, { pickable: false });
  const S = world.scene;
  I.balloon.position.set(top.x + 5, H(top.x + 5, top.z + 4), top.z + 4);
  I.balloon.userData.env.scale.setScalar(1);

  // stars
  const starPos = [], starCol = [];
  for (let i = 0; i < 900; i++) { const d = dirFrom(Math.random() * 360, 5 + Math.pow(Math.random(), 0.7) * 85).multiplyScalar(800); starPos.push(d.x, d.y, d.z); const c = new THREE.Color(Math.random() < 0.15 ? '#ffe9b0' : Math.random() < 0.2 ? '#b8d0ff' : '#fff8ee'); starCol.push(c.r, c.g, c.b); }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3)); sg.setAttribute('color', new THREE.Float32BufferAttribute(starCol, 3));
  const starMat = new THREE.PointsMaterial({ size: 1.5, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0, fog: false });
  const stars = new THREE.Points(sg, starMat); S.add(stars);
  // milky band
  const band = []; for (let i = 0; i < 1200; i++) { const a = Math.random() * 360; const e = 30 + Math.sin(THREE.MathUtils.degToRad(a * 2)) * 25 + (Math.random() - 0.5) * 10; const d = dirFrom(a, e).multiplyScalar(790); band.push(d.x, d.y, d.z); }
  const bandG = new THREE.BufferGeometry(); bandG.setAttribute('position', new THREE.Float32BufferAttribute(band, 3));
  const bandMat = new THREE.PointsMaterial({ size: 1, sizeAttenuation: false, color: '#c8b8ff', transparent: true, opacity: 0, fog: false });
  S.add(new THREE.Points(bandG, bandMat));

  // constellations
  const cons = SHAPES.map((sh) => {
    const uniq = []; sh.pts.forEach(([a, e]) => { if (!uniq.some((u) => u[0] === a && u[1] === e)) uniq.push([a, e]); });
    const dirs = uniq.map(([a, e]) => dirFrom(sh.center[0] + a, sh.center[1] + e));
    const g = new THREE.BufferGeometry().setFromPoints(dirs.map((d) => d.clone().multiplyScalar(780)));
    const m = new THREE.PointsMaterial({ size: 4, sizeAttenuation: false, color: '#fff3c8', transparent: true, opacity: 0, fog: false });
    const pts = new THREE.Points(g, m); S.add(pts);
    const lines = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: '#ffe9a8', transparent: true, opacity: 0.85, fog: false }));
    S.add(lines);
    return { sh, uniq, dirs, pts, lit: new Set(), lines, done: false };
  });

  // blanket on the hill + telescope reuse + swing reuse
  const [bc, bx] = canvas(16, 16);
  for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) { bx.fillStyle = ((i >> 2) + (j >> 2)) % 2 ? '#e8e2f6' : '#7f6fb0'; bx.fillRect(i, j, 1, 1); }
  const blanketPos = new THREE.Vector3(top.x + 2.5, 0, top.z + 3); blanketPos.y = H(blanketPos.x, blanketPos.z) + 0.05;
  const blanket = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.8).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ map: pixelTex(bc) }));
  blanket.position.copy(blanketPos); S.add(blanket);

  // sky transition: dusk -> night over ~150s (faster once lying down)
  let night = 0; let lying = false; let wished = false;
  const fogA = '#8a5a8a', fogB = '#1a1d40';
  world.every((dt, t) => {
    night = Math.min(1, night + dt / (lying ? 50 : 150));
    const k = night;
    sky.setStops([mix('#252a5c', '#05061a', k), mix('#5a3f7c', '#0e1236', k), mix('#c45a7a', '#1d2350', k), mix('#f39a6a', '#2a2c60', k)]);
    sky.material.uniforms.glow.value = 0.6 * (1 - k);
    world.setTime({ fog: mix(fogA, fogB, k), fogNear: 40, fogFar: 300, ambient: mix('#c8a0c8', '#5060a0', k), ambientI: 0.55 - k * 0.15, sun: mix('#ff9a7a', '#9fb0ff', k), sunI: 0.9 - k * 0.5, sunPos: [-60, 20 + k * 40, -40], hemiSky: mix('#d890a8', '#3a4a8a', k), hemiGround: '#1a1428', hemiI: 0.45 });
    starMat.opacity = Math.min(1, Math.max(0, (k - 0.25) * 1.6)) * (0.8 + Math.sin(t * 2) * 0.05);
    bandMat.opacity = Math.max(0, (k - 0.5) * 0.9);
    // constellation stars become visible with the night
    const fwd = new THREE.Vector3(); world.camera.getWorldDirection(fwd);
    cons.forEach((c) => {
      c.pts.material.opacity = Math.min(1, Math.max(0, (k - 0.35) * 2)) * (c.done ? 1 : 0.75 + Math.sin(t * 3) * 0.25);
      if (k < 0.4 || c.done) return;
      c.dirs.forEach((d, i) => { if (!c.lit.has(i) && fwd.angleTo(d.clone().multiplyScalar(780).sub(world.camera.position)) < THREE.MathUtils.degToRad(lying ? 5 : 3.5)) { c.lit.add(i); audio.sfx('pop', { pitch: c.lit.size * 2 }); updateLines(c); } });
    });
    // fireflies
    if (Math.random() < dt * 4) world.glow.emit(top.clone().add(new THREE.Vector3((Math.random() - 0.5) * 22, 0.5 + Math.random() * 2, (Math.random() - 0.5) * 22)), new THREE.Vector3(), '#e9ff9a', 6, { kind: 3 });
    I.lighthouse.userData.pivot.visible = k > 0.2;
    if (!wished && cons.filter((c) => c.done).length >= 2 && !shooting) shootingStar();
    if (!wished && night >= 1 && !shooting && world.clock > 200) shootingStar();
  });

  const updateLines = (c) => {
    const verts = [];
    const idx = (p) => c.uniq.findIndex((u) => u[0] === p[0] && u[1] === p[1]);
    for (let i = 0; i < c.sh.pts.length - 1; i++) {
      const a = idx(c.sh.pts[i]), b = idx(c.sh.pts[i + 1]);
      if (c.lit.has(a) && c.lit.has(b)) { const A = c.dirs[a].clone().multiplyScalar(780), Bv = c.dirs[b].clone().multiplyScalar(780); verts.push(A, Bv); }
    }
    c.lines.geometry.dispose(); c.lines.geometry = new THREE.BufferGeometry().setFromPoints(verts);
    if (c.lit.size === c.uniq.length && !c.done) { c.done = true; audio.sfx('chime'); ui.note(`✦ ${C.constellationDone} ${C.constellations[c.sh.name]} ✦`, 3000); }
  };

  // shooting star
  let shooting = false;
  const shootingStar = async () => {
    shooting = true;
    await wait(2500);
    const fwd = new THREE.Vector3(); world.camera.getWorldDirection(fwd);
    const start = fwd.clone().multiplyScalar(700).add(new THREE.Vector3(-260, 160, 0));
    const dir = new THREE.Vector3(1, -0.45, 0.1).normalize();
    audio.sfx('whoosh');
    for (let k = 0; k < 70; k++) {
      const p = start.clone().addScaledVector(dir, k * 8);
      world.glow.emit(p, new THREE.Vector3(), k % 3 ? '#fff6d8' : '#ffd0e8', 0.9, { size: 3 });
      await wait(16);
    }
    world.toastOnce('hill_star');
    await ui.dialog([{ text: C.shootingStar, choices: ['✨'] }]);
    audio.sting([72, 76, 79, 84, 88], 'bell', 0.18);
    ui.note(C.wishMade, 3500);
    wished = true;
    ui.actions([...baseActions(), { label: C.goVillage + ' →', cls: '', onClick: () => game.leave(world) }]);
  };

  // interactions
  world.interact.add({ pos: blanketPos, range: 2.2, hold: 0.4, label: () => (lying ? P.stand : P.lie), onDone: () => {
    lying = !lying;
    if (lying) { world.locked = true; world.player.pos.copy(blanketPos); world.player.eye = 0.35; world.player.pitch = 1.1; world.hideHands = true; ui.note(C.lieDown, 3000); setTimeout(() => ui.note(C.constellationHint, 4200), 3500); audio.sfx('pop'); }
    else { world.locked = false; world.player.eye = 1.5; world.player.pitch = 0.1; world.hideHands = false; }
  } });
  world.interact.add({ pos: I.telescope.position, range: 2.2, hold: 0.3, label: P.telescope, onDone: async () => {
    const save = { pos: world.player.pos.clone(), yaw: world.player.yaw, pitch: world.player.pitch, fov: world.camera.fov };
    world.locked = true; world.hideHands = true; world.player.pos.copy(I.telescope.position); world.player.pitch = 0.9;
    let fov = save.fov;
    const stop = world.every((dt) => {
      fov += (12 - fov) * Math.min(1, dt * 2); world.camera.fov = fov; world.camera.updateProjectionMatrix();
      const x = world.hx, W = world.W, Hh = world.H, r = Hh * 0.42;
      x.fillStyle = '#05040a'; x.beginPath(); x.rect(0, 0, W, Hh); x.arc(W / 2, Hh / 2, r, 0, Math.PI * 2, true); x.fill();
      x.strokeStyle = '#c9a24a'; x.lineWidth = 3; x.beginPath(); x.arc(W / 2, Hh / 2, r, 0, Math.PI * 2); x.stroke();
    });
    ui.note(C.telescope, 3800); audio.sfx('chime');
    await wait(6500);
    stop(); world.camera.fov = save.fov; world.camera.updateProjectionMatrix();
    Object.assign(world.player, { yaw: save.yaw, pitch: save.pitch }); world.player.pos.copy(save.pos); world.locked = false; world.hideHands = lying;
  } });
  world.interact.add({ pos: I.swing.position, range: 2.4, hold: 0.4, label: P.swing, onDone: async () => {
    const P0 = world.player.pos.clone(); world.locked = true; world.handPose = 'lantern'; world.player.pos.copy(I.swing.position); world.player.eye = 1.0;
    ui.note(C.swing, 3000);
    const f = new THREE.Vector3(-Math.sin(world.player.yaw), 0, -Math.cos(world.player.yaw));
    const stop = world.every((dt, t) => { const k = Math.sin(t * 2.2); world.player.pos.copy(I.swing.position).addScaledVector(f, k * 1.1); world.player.pitch = 0.3 + k * 0.15; });
    await wait(9000); stop(); world.player.eye = 1.5; world.handPose = 'idle'; world.player.pos.copy(P0); world.player.pitch = 0.1; world.locked = false;
  } });

  const baseActions = () => [{ label: '📷 ' + content.ui.photo, onClick: () => world.photo(content.chapters[10].title, content.ui.photo) }];
  ui.actions(baseActions());

  audio.scene('hill', [['crickets', 0.8], ['wind', 0.3]]);
  const fin = world.start();
  await game.enter();
  await wait(2500);
  world.toastOnce('hill_arrive');
  if (game.debug && new URLSearchParams(location.search).has('fast')) night = 0.6;
  await fin;
}
