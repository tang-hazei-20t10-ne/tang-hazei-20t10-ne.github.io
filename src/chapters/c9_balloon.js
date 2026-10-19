// Chapter 9: hot-air balloon flight at sunset over the island.
import content from '../content.js';
import { World3D, THREE, makeSky, billboard } from '../three/engine3d.js';
import { buildMountain, mountainHeight, SPOTS } from '../three/mountain.js';
import { birdSprite, mix } from '../core/sprites.js';
import { ui, wait } from '../core/ui.js';
import { audio } from '../core/audio.js';
import { input } from '../core/input.js';

const BALLOON_SONG = 'assets/balloon.mp3'; // Liszt, Liebestraum No. 3, see README credits
const C = content.balloon;
const easeIO = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export default async function balloon(game) {
  const sunDir = new THREE.Vector3(-0.75, 0.12, -0.62);
  const H = mountainHeight;
  const world = new World3D(game, { hires: 'ultra', mode: 'look', start: [SPOTS.balloon.x, H(SPOTS.balloon.x, SPOTS.balloon.z), SPOTS.balloon.z], yaw: Math.PI, pitch: 0, bloom: 0.55, bloomThreshold: 0.75, inputMode: '3d', minPitch: -1.3, maxPitch: 1.35 });
  input.setMode('3d');
  const sky = makeSky(['#4b5aa0', '#b77aa0', '#f5a46a', '#ffd796'], sunDir, { sun: '#fff1c0', glow: 0.8, sunSize: 0.9982 });
  world.add(sky);
  const lightAt = (k) => {
    const a = { fog: '#f3b27e', amb: '#ffd9b8', sun: '#ffcf8a', hs: '#ffc890' };
    const b = { fog: '#b07090', amb: '#c8a0c8', sun: '#ff9a7a', hs: '#d890a8' };
    world.setTime({ fog: mix(a.fog, b.fog, k), fogNear: 90, fogFar: 620, ambient: mix(a.amb, b.amb, k), ambientI: 0.5 - k * 0.1, sun: mix(a.sun, b.sun, k), sunI: 1.5 - k * 0.6, sunPos: [sunDir.x * 100, sunDir.y * 100 + 20 - k * 20, sunDir.z * 100], hemiSky: mix(a.hs, b.hs, k), hemiGround: '#5a4a6a', hemiI: 0.5 });
    sky.setStops([mix('#4b5aa0', '#2a2c6a', k), mix('#b77aa0', '#7a4a8a', k), mix('#f5a46a', '#e0707a', k), mix('#ffd796', '#ffb07a', k)]);
  };
  lightAt(0);
  world.grade.uniforms.tint.value.set('#fff2e4');
  const I = buildMountain(world);
  const S = world.scene;
  world.handPose = 'rim';

  // flight path
  const b0 = H(SPOTS.balloon.x, SPOTS.balloon.z), hs = H(2, -27);
  const pts = [
    [SPOTS.balloon.x, b0, SPOTS.balloon.z], [2, b0 + 8, 0], [4, 24, 22], [-24, 30, 10], [12, 32, 0], [30, 36, -16],
    [12, 38, 46], [0, 34, 84], [40, 40, 140], [88, 44, 186], [70, 46, 120], [14, 44, 40], [3, hs + 10, -22], [2, hs, -27],
  ].map((p) => new THREE.Vector3(...p));
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  const fast = game.debug && new URLSearchParams(location.search).has('fast');
  const DUR = fast ? 14 : 150;
  const marks = [[0.02, 'start', 'balloon_start'], [0.1, 'meadow'], [0.2, 'grove'], [0.28, 'lake'], [0.44, 'lighthouse'], [0.58, 'village', 'balloon_village'], [0.97, 'land', 'balloon_land']];
  let markI = 0;
  let flyT = 0, flying = false, bump = 0, flame = 0;
  const B = I.balloon;
  B.userData.basket.visible = false; B.userData.rim.visible = false; // the hands overlay draws the rim
  const up = new THREE.Vector3();

  // birds
  const birds = [];
  for (let i = 0; i < 9; i++) { const b = billboard(birdSprite(0, '#3b2b40'), 0.12, { centerY: 0.5 }); S.add(b); birds.push({ b, ph: Math.random() * 6, r: 6 + Math.random() * 10, h: Math.random() * 4 - 1, sp: 0.3 + Math.random() * 0.3 }); }
  let flock = 0;

  world.every((dt, t) => {
    if (flying) {
      flyT = Math.min(1, flyT + dt / DUR);
      const k = easeIO(flyT);
      const p = curve.getPointAt(k);
      bump = Math.max(0, bump - dt * 0.4);
      B.position.set(p.x, p.y + Math.sin(t * 0.7) * 0.15 + bump, p.z);
      lightAt(Math.min(1, flyT * 1.1));
      I.city.userData.setNight(0.15 + flyT * 0.75, t);
      while (markI < marks.length && flyT >= marks[markI][0]) { const [, id, toast] = marks[markI]; ui.note(C.lines[id], 3800); if (toast) world.toastOnce(toast); markI++; }
      if (flyT >= 1) { flying = false; finishFlight(); }
    }
    world.player.pos.set(B.position.x, B.position.y - world.player.eye + 1.75, B.position.z);
    // flame
    flame = Math.max(0, flame - dt);
    B.userData.flame.visible = flame > 0; B.userData.flame.scale.setScalar(0.8 + Math.random() * 0.5);
    B.userData.burner.intensity = flame > 0 ? 6 + Math.random() * 3 : 0;
    // birds orbit near the balloon, closer when waved at
    flock = Math.max(0, flock - dt * 0.15);
    birds.forEach((o, i) => {
      const r = o.r * (1 - flock * 0.6) + 3;
      o.b.position.set(B.position.x + Math.cos(t * o.sp + o.ph) * r, B.position.y + 2 + o.h + Math.sin(t * 1.3 + i) * 0.6, B.position.z + Math.sin(t * o.sp + o.ph) * r);
      o.b.setCanvas(birdSprite(Math.floor(t * 6 + i) % 2, flock > 0.3 ? '#5a4060' : '#3b2b40'));
    });
  });

  let finishResolve; const finished = new Promise((r) => { finishResolve = r; });
  const finishFlight = async () => { ui.actions(null); await wait(2500); finishResolve(); };

  // Hazei lifts both hands and lets a handful of petals go: they fly out in
  // front of the basket, rise on the warm air, then drift slowly down.
  let releasing = false;
  const bVel = new THREE.Vector3(), bLast = new THREE.Vector3(); let bInit = false;
  world.every((dt) => { if (dt <= 0) return; if (bInit) bVel.copy(B.position).sub(bLast).divideScalar(dt); bLast.copy(B.position); bInit = true; });
  const releasePetals = async () => {
    if (releasing) return; releasing = true;
    world.handPose = 'lantern'; audio.sfx('sparkle');
    const cols = ['#ffc2d4', '#ffd9e4', '#fff0f5', '#f6c45f', '#b49ae0', '#ff9ab8'];
    for (let burst = 0; burst < 3; burst++) {
      const fwd = new THREE.Vector3(); world.camera.getWorldDirection(fwd);
      fwd.y = Math.max(fwd.y, -0.1); fwd.normalize();
      const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
      const origin = world.camera.position.clone().addScaledVector(fwd, 1.2).add(new THREE.Vector3(0, -0.15, 0));
      for (let i = 0; i < 26; i++) {
        const v = bVel.clone().multiplyScalar(0.9).addScaledVector(fwd, 3 + Math.random() * 3).addScaledVector(right, (Math.random() - 0.5) * 3).add(new THREE.Vector3(0, 2.2 + Math.random() * 2, 0));
        world.fx.emit(origin.clone().addScaledVector(right, (Math.random() - 0.5) * 0.6), v, cols[(i + burst) % cols.length], 7 + Math.random() * 3, { kind: 1, size: 4 });
      }
      for (let i = 0; i < 6; i++) world.glow.emit(origin.clone().addScaledVector(right, (Math.random() - 0.5)), bVel.clone().addScaledVector(fwd, 2).add(new THREE.Vector3(0, 1.5, 0)), '#fff6d8', 1.4, { size: 3 });
      await wait(260);
    }
    await wait(500);
    world.handPose = 'rim'; releasing = false;
  };

  const actions = [
    { label: '🌸 ' + C.actions.petals, onClick: () => releasePetals() },
    { label: '🔥 ' + C.actions.burner, onClick: () => { flame = 1.6; bump = Math.min(2.5, bump + 1.2); audio.sfx('flame'); } },
    { label: '👋 ' + C.actions.wave, onClick: async () => { flock = 1; world.handPose = 'wave'; audio.sfx('chime'); await wait(1600); world.handPose = 'rim'; } },
    { label: '📷 ' + C.actions.photo, onClick: () => world.photo(C.lines.start.replace('…', ''), content.ui.photo) },
  ];

  // Liszt's Liebestraum No. 3 while drifting over the city (soft wind underneath);
  // the generated 'balloon' loop plays if the file is missing
  audio.scene(null, [['windHigh', 0.35]]);
  audio.playRecord(BALLOON_SONG, { loop: true, gain: 0.38 }).then((ok) => { if (!ok) audio.playMusic('balloon', 2); });
  I.city.userData.setNight(0.15);
  const fin = world.start();
  await game.enter();
  ui.controlsHint(input.touch ? content.ui.controls3DTouch.split('·')[1] : content.ui.controls3D.split('·')[1], 6000);
  await wait(2000);
  ui.actions(actions);
  audio.sfx('flame'); flame = 2;
  flying = true;
  await finished;
  audio.stopRecord(2);
  await game.leave(world);
  await fin;
}
