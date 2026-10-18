// Chapter 10: stargazing on the summit deck. Dusk to night, constellations,
// shooting star, the city glittering below.
import content from '../content.js';
import { World3D, THREE, makeSky, pixelTex, toon } from '../three/engine3d.js';
import { buildMountain, mountainHeight, surfaceHeight, mountainWalkable, SPOTS } from '../three/mountain.js';
import { Guide } from '../three/guide.js';
import { canvas, mix } from '../core/sprites.js';
import { ui, wait } from '../core/ui.js';
import { audio } from '../core/audio.js';
import { input } from '../core/input.js';

const C = content.hill;
const G = C.guide;
const P = content.prompts;

const dirFrom = (az, el) => { const a = THREE.MathUtils.degToRad(az), e = THREE.MathUtils.degToRad(el); return new THREE.Vector3(Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e)); };

export default async function hill(game) {
  const H = mountainHeight;
  const deck = SPOTS.deck;
  // constellations sit in the part of the sky you see when lying down facing the city
  const cityAz = THREE.MathUtils.radToDeg(Math.atan2(SPOTS.city.x - deck.x, -(SPOTS.city.z - deck.z)));
  const SHAPES = [
    { name: 0, center: [cityAz, 66], pts: [[0, -6], [-5, 0], [-6, 5], [-3, 8], [0, 5], [3, 8], [6, 5], [5, 0], [0, -6]] }, // heart
    { name: 1, center: [cityAz - 38, 52], pts: [[0, 0], [0, 6], [0, 0], [5, 2], [0, 0], [4, -4], [0, 0], [-4, -4], [0, 0], [-5, 2]] }, // flower
    { name: 2, center: [cityAz + 38, 52], pts: [[-5, 0], [-4, 6], [-1, 3], [1, 3], [4, 6], [5, 0], [0, -4], [-5, 0]] }, // cat
    { name: 3, center: [cityAz, 44], pts: [[-7, 0], [-6, 6], [-3, 2], [0, 7], [3, 2], [6, 6], [7, 0], [-7, 0]] }, // crown
  ];
  const near = (x, z) => Math.hypot(x - deck.x, z - deck.z) < 16 && mountainWalkable(x, z);
  const start = new THREE.Vector3(deck.x + 6.5, 0, deck.z + 0.5);
  const world = new World3D(game, { hires: true, start: [start.x, surfaceHeight(start.x, start.z), start.z], yaw: Math.PI / 2, pitch: -0.05, heightAt: surfaceHeight, walkable: near, bloom: 0.6, bloomThreshold: 0.7, maxPitch: 1.5 });
  const sunDir = new THREE.Vector3(-0.8, 0.02, -0.55);
  const sky = makeSky(['#252a5c', '#5a3f7c', '#c45a7a', '#f39a6a'], sunDir, { sun: '#ffc68a', glow: 0.6 });
  world.add(sky);
  const I = buildMountain(world);
  const S = world.scene;
  I.balloon.position.set(5, H(5, -31), -31); // where the balloon landed

  // stars + milky band
  const starPos = [], starCol = [];
  for (let i = 0; i < 1100; i++) { const d = dirFrom(Math.random() * 360, 5 + Math.pow(Math.random(), 0.7) * 85).multiplyScalar(800); starPos.push(d.x, d.y, d.z); const c = new THREE.Color(Math.random() < 0.15 ? '#ffe9b0' : Math.random() < 0.2 ? '#b8d0ff' : '#fff8ee'); starCol.push(c.r, c.g, c.b); }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3)); sg.setAttribute('color', new THREE.Float32BufferAttribute(starCol, 3));
  const starMat = new THREE.PointsMaterial({ size: 1.5, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0, fog: false });
  S.add(new THREE.Points(sg, starMat));
  const band = []; for (let i = 0; i < 1400; i++) { const a = Math.random() * 360; const e = 30 + Math.sin(THREE.MathUtils.degToRad(a * 2)) * 25 + (Math.random() - 0.5) * 10; const d = dirFrom(a, e).multiplyScalar(790); band.push(d.x, d.y, d.z); }
  const bandG = new THREE.BufferGeometry(); bandG.setAttribute('position', new THREE.Float32BufferAttribute(band, 3));
  const bandMat = new THREE.PointsMaterial({ size: 1, sizeAttenuation: false, color: '#c8b8ff', transparent: true, opacity: 0, fog: false });
  S.add(new THREE.Points(bandG, bandMat));

  // constellations
  const cons = SHAPES.map((sh) => {
    const uniq = []; sh.pts.forEach(([a, e]) => { if (!uniq.some((u) => u[0] === a && u[1] === e)) uniq.push([a, e]); });
    const dirs = uniq.map(([a, e]) => dirFrom(sh.center[0] + a, sh.center[1] + e));
    const g = new THREE.BufferGeometry().setFromPoints(dirs.map((d) => d.clone().multiplyScalar(780)));
    const m = new THREE.PointsMaterial({ size: 5, sizeAttenuation: false, color: '#fff3c8', transparent: true, opacity: 0, fog: false });
    const pts = new THREE.Points(g, m); S.add(pts);
    const lines = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: '#ffe9a8', transparent: true, opacity: 0.9, fog: false }));
    S.add(lines);
    return { sh, uniq, dirs, pts, lit: new Set(), lines, done: false };
  });
  const starWorld = (d) => d.clone().multiplyScalar(780);

  // ---- the stargazing blanket in the middle of the deck, lit by two paper lanterns
  const [bc, bx] = canvas(16, 16);
  for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) { bx.fillStyle = ((i >> 2) + (j >> 2)) % 2 ? '#f6efe4' : '#8f7fd0'; bx.fillRect(i, j, 1, 1); }
  bx.fillStyle = '#f6c45f'; for (let i = 0; i < 16; i++) { bx.fillRect(i, 0, 1, 1); bx.fillRect(i, 15, 1, 1); }
  const blanketPos = new THREE.Vector3(deck.x - 0.5, I.deckTop + 0.02, deck.z + 0.5);
  const blanket = new THREE.Mesh(new THREE.PlaneGeometry(3, 2.2).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ map: pixelTex(bc), emissive: '#3a2a5a', emissiveIntensity: 0.4 }));
  blanket.position.copy(blanketPos); S.add(blanket);
  for (const [dx, col] of [[-1.2, '#f08fa8'], [1.2, '#f6c45f']]) { const cush = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.18, 0.45), toon(col)); cush.position.copy(blanketPos).add(new THREE.Vector3(dx, 0.09, -0.85)); S.add(cush); }
  const lanternLights = [];
  for (const dx of [-1.9, 1.9]) {
    const lan = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.2, 0.45, 8), new THREE.MeshBasicMaterial({ color: '#ffcf7a' })); body.position.y = 0.3; lan.add(body);
    const capT = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.22, 0.08, 8), toon('#6a4430')); capT.position.y = 0.56; lan.add(capT);
    const pl = new THREE.PointLight('#ffb460', 4, 6, 1.6); pl.position.y = 0.4; lan.add(pl); lanternLights.push(pl);
    lan.position.copy(blanketPos).add(new THREE.Vector3(dx, 0, 0.6)); S.add(lan);
  }

  // ---- guidance
  const guide = new Guide(world, { title: G.title, optionalTitle: G.optional, steps: [
    { id: 'lie', text: G.lie, label: G.m.lie, pos: blanketPos },
    { id: 'stars', text: G.stars, total: 4 },
    { id: 'wish', text: G.wish, hidden: true },
    { id: 'village', text: G.village, hidden: true },
    { id: 'telescope', text: G.telescope, short: G.m.telescope, optional: true, pos: () => I.telescope.position },
    { id: 'swing', text: G.swing, short: G.m.swing, optional: true, pos: () => I.swing.position },
  ] });
  world.opts.cleanup = () => guide.destroy();

  // ---- sky transition: dusk -> night (faster once lying down)
  let night = 0; let lying = false; let wished = false; let waitNoted = false;
  const fogA = '#8a5a8a', fogB = '#1a1d40';
  world.every((dt, t) => {
    night = Math.min(1, night + dt / (lying ? 35 : 140));
    const k = night;
    sky.setStops([mix('#252a5c', '#05061a', k), mix('#5a3f7c', '#0e1236', k), mix('#c45a7a', '#1d2350', k), mix('#f39a6a', '#2a2c60', k)]);
    sky.material.uniforms.glow.value = 0.6 * (1 - k);
    I.city.userData.setNight(0.6 + k * 0.4);
    world.setTime({ fog: mix(fogA, fogB, k), fogNear: 120, fogFar: 900, ambient: mix('#c8a0c8', '#5060a0', k), ambientI: 0.55 - k * 0.15, sun: mix('#ff9a7a', '#9fb0ff', k), sunI: 0.9 - k * 0.5, sunPos: [-60, 20 + k * 40, -40], hemiSky: mix('#d890a8', '#3a4a8a', k), hemiGround: '#1a1428', hemiI: 0.45 });
    starMat.opacity = Math.min(1, Math.max(0, (k - 0.25) * 1.6)) * (0.8 + Math.sin(t * 2) * 0.05);
    bandMat.opacity = Math.max(0, (k - 0.5) * 0.9);
    lanternLights.forEach((l, i) => { l.intensity = 3 + k * 3 + Math.sin(t * 6 + i) * 0.4; });
    // constellation stars
    const fwd = new THREE.Vector3(); world.camera.getWorldDirection(fwd);
    const ready = k >= 0.4;
    cons.forEach((c) => {
      c.pts.material.opacity = Math.min(1, Math.max(0, (k - 0.35) * 2)) * (c.done ? 1 : 0.75 + Math.sin(t * 3) * 0.25);
      if (!ready || c.done) return;
      c.dirs.forEach((d, i) => { if (!c.lit.has(i) && fwd.angleTo(starWorld(d).sub(world.camera.position)) < THREE.MathUtils.degToRad(lying ? 6 : 4)) { c.lit.add(i); audio.sfx('pop', { pitch: c.lit.size * 2 }); updateLines(c); } });
    });
    // point at the next star to look at while lying down
    if (lying && ready && !guide.step('stars').done) {
      const c = cons.find((cc) => !cc.done);
      const i = c ? c.dirs.findIndex((_, j) => !c.lit.has(j)) : -1;
      guide.override = i >= 0 ? { pos: starWorld(c.dirs[i]), label: G.m.star, sky: true } : null;
    } else guide.override = null;
    if (lying && !ready && !waitNoted) { waitNoted = true; ui.note(G.waiting, 3000); }
    // fireflies
    if (Math.random() < dt * 4) { const fx = deck.x + (Math.random() - 0.5) * 24, fz = deck.z + (Math.random() - 0.5) * 24; world.glow.emit(new THREE.Vector3(fx, H(fx, fz) + 0.5 + Math.random() * 2, fz), new THREE.Vector3(), '#e9ff9a', 6, { kind: 3 }); }
    const nDone = cons.filter((c) => c.done).length;
    if (!wished && !shooting && ((nDone >= 2 && lying) || (night >= 1 && world.clock > 260))) shootingStar();
  });

  const updateLines = (c) => {
    const verts = [];
    const idx = (p) => c.uniq.findIndex((u) => u[0] === p[0] && u[1] === p[1]);
    for (let i = 0; i < c.sh.pts.length - 1; i++) {
      const a = idx(c.sh.pts[i]), b = idx(c.sh.pts[i + 1]);
      if (c.lit.has(a) && c.lit.has(b)) verts.push(starWorld(c.dirs[a]), starWorld(c.dirs[b]));
    }
    c.lines.geometry.dispose(); c.lines.geometry = new THREE.BufferGeometry().setFromPoints(verts);
    if (c.lit.size === c.uniq.length && !c.done) {
      c.done = true; audio.sfx('chime'); ui.note(`✦ ${C.constellationDone} ${C.constellations[c.sh.name]} ✦`, 3000);
      const n = cons.filter((cc) => cc.done).length;
      guide.progress('stars', n);
      if (n >= 2) guide.show('wish');
    }
  };

  // ---- shooting star
  let shooting = false;
  const shootingStar = async () => {
    shooting = true;
    guide.show('wish'); guide.force('wish');
    await wait(2500);
    const fwd = new THREE.Vector3(); world.camera.getWorldDirection(fwd);
    const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
    const startP = world.camera.position.clone().addScaledVector(fwd, 600).addScaledVector(right, -260).add(new THREE.Vector3(0, 120, 0));
    const dir = right.clone().add(new THREE.Vector3(0, -0.45, 0)).normalize();
    audio.sfx('whoosh');
    for (let k = 0; k < 70; k++) {
      world.glow.emit(startP.clone().addScaledVector(dir, k * 8), new THREE.Vector3(), k % 3 ? '#fff6d8' : '#ffd0e8', 0.9, { size: 3 });
      await wait(16);
    }
    world.toastOnce('hill_star');
    await ui.dialog([{ text: C.shootingStar, choices: ['✨'] }]);
    audio.sting([72, 76, 79, 84, 88], 'bell', 0.18);
    ui.note(C.wishMade, 3500);
    wished = true;
    guide.done('wish'); guide.forced = null; guide.show('village'); guide.force('village');
    ui.actions([...baseActions(), { label: C.goVillage + ' →', cls: '', onClick: () => { guide.done('village'); game.leave(world); } }]);
  };

  // ---- interactions
  world.interact.add({ pos: blanketPos, range: 2.4, hold: 0.4, label: () => (lying ? P.stand : P.lie), onDone: () => {
    lying = !lying;
    if (lying) {
      world.locked = true; world.player.pos.copy(blanketPos); world.player.eye = 0.35;
      world.player.yaw = Math.atan2(-(SPOTS.city.x - deck.x), -(SPOTS.city.z - deck.z)); world.player.pitch = 1.1;
      world.hideHands = true; audio.sfx('pop'); guide.done('lie');
      ui.note(C.lieDown, 3000); setTimeout(() => { if (lying) ui.note(C.constellationHint, 4200); }, 3500);
    } else { world.locked = false; world.player.eye = 1.5; world.player.pitch = 0.1; world.hideHands = false; }
  } });
  world.interact.add({ pos: I.telescope.position, range: 2.2, hold: 0.3, label: P.telescope, onDone: async () => {
    const save = { pos: world.player.pos.clone(), yaw: world.player.yaw, pitch: world.player.pitch, fov: world.camera.fov };
    world.locked = true; world.hideHands = true; guide.hide(true);
    world.player.pos.copy(I.telescope.position);
    { const v = SPOTS.city.clone().sub(I.telescope.position).sub(new THREE.Vector3(0, 1.5, 0)); world.player.yaw = Math.atan2(-v.x, -v.z); world.player.pitch = Math.atan2(v.y, Math.hypot(v.x, v.z)); }
    let fov = save.fov;
    const stop = world.every((dt) => {
      fov += (14 - fov) * Math.min(1, dt * 2); world.camera.fov = fov; world.camera.updateProjectionMatrix();
      const x = world.hx, W = world.W, Hh = world.H, r = Hh * 0.42;
      x.fillStyle = '#05040a'; x.beginPath(); x.rect(0, 0, W, Hh); x.arc(W / 2, Hh / 2, r, 0, Math.PI * 2, true); x.fill();
      x.strokeStyle = '#c9a24a'; x.lineWidth = 3; x.beginPath(); x.arc(W / 2, Hh / 2, r, 0, Math.PI * 2); x.stroke();
    });
    ui.note(C.telescope, 3800); audio.sfx('chime'); guide.done('telescope');
    await wait(6500);
    stop(); world.camera.fov = save.fov; world.camera.updateProjectionMatrix();
    Object.assign(world.player, { yaw: save.yaw, pitch: save.pitch }); world.player.pos.copy(save.pos); world.locked = lying; world.hideHands = lying; guide.hide(false);
  } });
  world.interact.add({ pos: I.swing.position, range: 2.4, hold: 0.4, label: P.swing, onDone: async () => {
    const P0 = world.player.pos.clone(); world.locked = true; world.handPose = 'lantern'; world.player.pos.copy(I.swing.position); world.player.eye = 1.0;
    ui.note(C.swing, 3000); guide.done('swing');
    const f = new THREE.Vector3(-Math.sin(world.player.yaw), 0, -Math.cos(world.player.yaw));
    const stop = world.every((dt, t) => { const k = Math.sin(t * 2.2); world.player.pos.copy(I.swing.position).addScaledVector(f, k * 1.1); world.player.pitch = 0.3 + k * 0.15; });
    await wait(9000); stop(); world.player.eye = 1.5; world.handPose = 'idle'; world.player.pos.copy(P0); world.player.pitch = 0.1; world.locked = false;
  } });

  const baseActions = () => [{ label: '📷 ' + content.ui.photo, onClick: async () => { guide.hide(true); await world.photo(content.chapters[10].title, content.ui.photo); guide.hide(false); } }];
  ui.actions(baseActions());

  audio.scene('hill', [['crickets', 0.8], ['wind', 0.3]]);
  const fin = world.start();
  await game.enter();
  ui.controlsHint(input.touch ? content.ui.controls3DTouch : content.ui.controls3D, 6000);
  await wait(2500);
  world.toastOnce('hill_arrive');
  if (game.debug && new URLSearchParams(location.search).has('fast')) night = 0.6;
  await fin;
}
