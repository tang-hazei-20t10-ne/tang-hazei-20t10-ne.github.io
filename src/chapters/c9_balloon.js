// Chapter 9: hot-air balloon flight at sunset over the island.
import content from '../content.js';
import { World3D, THREE, makeSky, billboard } from '../three/engine3d.js';
import { buildIsland, islandHeight, SPOTS } from '../three/island.js';
import { birdSprite, mix } from '../core/sprites.js';
import { ui, wait } from '../core/ui.js';
import { audio } from '../core/audio.js';
import { input } from '../core/input.js';

const C = content.balloon;
const easeIO = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export default async function balloon(game) {
  const sunDir = new THREE.Vector3(-0.75, 0.12, -0.62);
  const H = islandHeight;
  const world = new World3D(game, { mode: 'look', start: [SPOTS.balloon.x, H(SPOTS.balloon.x, SPOTS.balloon.z), SPOTS.balloon.z], yaw: Math.PI, pitch: 0, bloom: 0.55, bloomThreshold: 0.75, inputMode: '3d', minPitch: -1.3, maxPitch: 1.35 });
  input.setMode('3d');
  const sky = makeSky(['#4b5aa0', '#b77aa0', '#f5a46a', '#ffd796'], sunDir, { sun: '#fff1c0', glow: 0.8, sunSize: 0.9982 });
  world.add(sky);
  const lightAt = (k) => {
    const a = { fog: '#f3b27e', amb: '#ffd9b8', sun: '#ffcf8a', hs: '#ffc890' };
    const b = { fog: '#b07090', amb: '#c8a0c8', sun: '#ff9a7a', hs: '#d890a8' };
    world.setTime({ fog: mix(a.fog, b.fog, k), fogNear: 60, fogFar: 340, ambient: mix(a.amb, b.amb, k), ambientI: 0.5 - k * 0.1, sun: mix(a.sun, b.sun, k), sunI: 1.5 - k * 0.6, sunPos: [sunDir.x * 100, sunDir.y * 100 + 20 - k * 20, sunDir.z * 100], hemiSky: mix(a.hs, b.hs, k), hemiGround: '#5a4a6a', hemiI: 0.5 });
    sky.setStops([mix('#4b5aa0', '#2a2c6a', k), mix('#b77aa0', '#7a4a8a', k), mix('#f5a46a', '#e0707a', k), mix('#ffd796', '#ffb07a', k)]);
  };
  lightAt(0);
  world.grade.uniforms.tint.value.set('#fff2e4');
  const I = buildIsland(world, { pickable: false });
  const S = world.scene;
  world.handPose = 'rim';

  // flight path
  const hillY = H(-23, -22);
  const pts = [
    [SPOTS.balloon.x, H(SPOTS.balloon.x, SPOTS.balloon.z), SPOTS.balloon.z], [2, 9, 0], [4, 19, 18], [-14, 23, 24], [-28, 24, 8], [-12, 26, -6], [16, 24, 4], [30, 27, -18],
    [52, 31, -58], [44, 30, -84], [10, 27, -64], [-14, 24, -40], [-23, hillY + 6, -26], [-23, hillY, -22],
  ].map((p) => new THREE.Vector3(...p));
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  const fast = game.debug && new URLSearchParams(location.search).has('fast');
  const DUR = fast ? 14 : 150;
  const marks = [[0.02, 'start', 'balloon_start'], [0.13, 'meadow'], [0.28, 'grove'], [0.42, 'lake'], [0.53, 'lighthouse'], [0.64, 'village', 'balloon_village'], [0.97, 'land', 'balloon_land']];
  let markI = 0;
  let flyT = 0, flying = false, bump = 0, flame = 0;
  const B = I.balloon;
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
    // lighthouse lights up later in the flight
    I.lighthouse.userData.pivot.visible = flyT > 0.45;
  });

  let finishResolve; const finished = new Promise((r) => { finishResolve = r; });
  const finishFlight = async () => { ui.actions(null); await wait(2500); finishResolve(); };

  const actions = [
    { label: '🌸 ' + C.actions.petals, onClick: () => { audio.sfx('sparkle'); for (let i = 0; i < 60; i++) world.fx.emit(B.position.clone().add(new THREE.Vector3((Math.random() - 0.5) * 1.4, 0.8, (Math.random() - 0.5) * 1.4)), new THREE.Vector3((Math.random() - 0.5) * 1.2, -0.6 - Math.random() * 0.6, (Math.random() - 0.5) * 1.2), ['#ffc2d4', '#ffd9e4', '#fff0f5', '#f6c45f', '#b49ae0'][i % 5], 9, { kind: 1 }); } },
    { label: '🔥 ' + C.actions.burner, onClick: () => { flame = 1.6; bump = Math.min(2.5, bump + 1.2); audio.sfx('flame'); } },
    { label: '👋 ' + C.actions.wave, onClick: async () => { flock = 1; world.handPose = 'wave'; audio.sfx('chime'); await wait(1600); world.handPose = 'rim'; } },
    { label: '📷 ' + C.actions.photo, onClick: () => world.photo(C.lines.start.replace('…', ''), content.ui.photo) },
  ];

  audio.scene('balloon', [['windHigh', 0.6]]);
  const fin = world.start();
  await game.enter();
  ui.controlsHint(input.touch ? content.ui.controls3DTouch.split('·')[1] : content.ui.controls3D.split('·')[1], 6000);
  await wait(2000);
  ui.actions(actions);
  audio.sfx('flame'); flame = 2;
  flying = true;
  await finished;
  await game.leave(world);
  await fin;
}
