// Chapter 8: first-person walk on the mountain behind the school at golden hour.
import content from '../content.js';
import { World3D, THREE, makeSky, billboard, drawFist } from '../three/engine3d.js';
import { buildMountain, mountainHeight, surfaceHeight, mountainWalkable, pondLevel, SPOTS } from '../three/mountain.js';
import { Guide } from '../three/guide.js';
import { TIMES } from '../core/palette.js';
import { flowerSprite, randomFlower, dogSprite, catSprite, butterflySprite, flowerBig } from '../core/sprites.js';
import { ui, wait } from '../core/ui.js';
import { audio } from '../core/audio.js';
import { input } from '../core/input.js';
import { state } from '../core/state.js';

const C = content.island;
const P = content.prompts;

export function flyFlowerFromBottom(f) {
  const t = ui.flowerChipRect();
  const tx = t.width ? t.left + t.width / 2 : innerWidth - 60, ty = t.height ? t.top + t.height / 2 : 30;
  const sx = innerWidth * 0.75, sy = innerHeight * 0.8;
  const c = document.createElement('canvas'); c.width = c.height = 48;
  const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(flowerBig(f.species, f.color), 0, 0, 48, 48);
  Object.assign(c.style, { position: 'fixed', left: sx - 24 + 'px', top: sy - 24 + 'px', width: '48px', height: '48px', zIndex: 60, pointerEvents: 'none', imageRendering: 'pixelated' });
  document.body.appendChild(c);
  const a = c.animate([{ transform: 'translate(0,0) scale(1.2)' }, { transform: `translate(${(tx - sx) * 0.3}px, ${(ty - sy) * 0.5 - 60}px) scale(1.4) rotate(-20deg)`, offset: 0.4 }, { transform: `translate(${tx - sx}px, ${ty - sy}px) scale(.4) rotate(20deg)`, opacity: 0.7 }], { duration: 1000, easing: 'cubic-bezier(.5,0,.4,1)' });
  a.onfinish = () => c.remove();
}

export default async function island(game) {
  const pal = TIMES.golden;
  const sunDir = new THREE.Vector3(-0.75, 0.16, -0.62);
  const world = new World3D(game, { hires: 'ultra',
    start: [SPOTS.spawn.x, mountainHeight(SPOTS.spawn.x, SPOTS.spawn.z), SPOTS.spawn.z], yaw: 0, pitch: 0.05,
    heightAt: surfaceHeight,
    walkable: mountainWalkable,
    bloom: 0.32, bloomThreshold: 0.86,
  });
  world.add(makeSky(['#4b5aa0', '#b77aa0', '#f5a46a', '#ffd796'], sunDir, { sun: '#fff1c0', glow: 0.8, sunSize: 0.9982 }));
  world.setTime({ fog: '#f0c4b0', fogNear: 120, fogFar: 1000, ambient: '#e6e0ff', ambientI: 0.42, sun: '#ffe2a8', sunI: 1.45, sunPos: [sunDir.x * 100, sunDir.y * 100 + 30, sunDir.z * 100], hemiSky: '#b8c4ff', hemiGround: '#7a5a5a', hemiI: 0.6 });
  world.grade.uniforms.tint.value.set('#ffffff'); world.grade.uniforms.saturation.value = 1.12;
  const I = buildMountain(world);
  I.city.userData.setNight(0.3);
  world.every((dt, t) => I.city.userData.setNight(0.3 + Math.min(0.25, t / 900)));
  const S = world.scene;
  const H = mountainHeight;
  const at = I.at;
  const done = { meadow: false, grove: false, lake: false, hill: false, lighthouse: false };
  let interactions = 0;
  const G = C.guide;
  const tPos = (v) => () => v;
  const guide = new Guide(world, { title: G.title, optionalTitle: G.optional, steps: [
    { id: 'flowers', text: G.flowers, label: G.m.flowers, pos: SPOTS.meadow.clone().setY(H(SPOTS.meadow.x, SPOTS.meadow.z)), total: 3 },
    { id: 'grove', text: G.grove, label: G.m.grove, pos: SPOTS.grove.clone().setY(H(SPOTS.grove.x, SPOTS.grove.z)) },
    { id: 'boat', text: G.boat, label: G.m.boat, pos: () => I.boat.position },
    { id: 'tower', text: G.tower, label: G.m.tower, pos: null },
    { id: 'telescope', text: G.telescope, label: G.m.telescope, pos: () => I.telescope.position },
    { id: 'balloon', text: G.balloon, label: G.m.balloon, pos: () => I.balloon.position, hidden: true },
    { id: 'dog', text: G.dog, short: G.m.dog, optional: true, pos: null },
    { id: 'cat', text: G.cat, short: G.m.cat, optional: true, pos: null },
    { id: 'ducks', text: G.ducks, optional: true, pos: null },
    { id: 'bell', text: G.bell, short: G.m.bell, optional: true, pos: null },
    { id: 'swing', text: G.swing, short: G.m.swing, optional: true, pos: () => I.swing.position },
    { id: 'photo', text: G.photo, optional: true },
  ] });
  world.opts.cleanup = () => guide.destroy();
  let picked = 0;
  const did = (id) => { interactions++; if (id) guide.done(id); };

  // ------------------------------------------------ pickable flowers
  const pickSpots = [];
  for (let i = 0; i < 18; i++) {
    const inGrove = i >= 12;
    const x = inGrove ? -25 + (I.rnd() - 0.5) * 14 : 2 + (I.rnd() - 0.5) * 22;
    const z = inGrove ? 6 + (I.rnd() - 0.5) * 14 : 26 + (I.rnd() - 0.5) * 18;
    if (!mountainWalkable(x, z)) continue;
    pickSpots.push([x, z]);
  }
  pickSpots.forEach(([x, z]) => {
    const f = randomFlower(I.rnd);
    const spr = billboard(flowerSprite(f.species, f.color), 0.1);
    spr.position.copy(at(x, z)); S.add(spr);
    const item = world.interact.add({
      pos: spr.position, range: 2.2, hold: 0.5, label: P.pick,
      onHold: () => { world.handPose = 'reach'; },
      onRelease: () => { world.handPose = 'idle'; },
      onDone: async () => {
        S.remove(spr); world.interact.remove(item);
        audio.sfx('pluck');
        for (let k = 0; k < 8; k++) world.glow.emit(spr.position.clone().add(new THREE.Vector3(0, 0.6, 0)), new THREE.Vector3((Math.random() - 0.5) * 1.5, Math.random() * 1.5, (Math.random() - 0.5) * 1.5), '#fff2b0', 0.8);
        world.handPose = 'flower'; world.handItem = flowerSprite(f.species, f.color);
        await wait(700);
        game.addFlower(f); flyFlowerFromBottom(f);
        world.handPose = 'idle'; world.handItem = null;
        world.toastOnce('island_flower'); picked++; guide.progress('flowers', picked); did();
      },
    });
    // twinkle
    world.every((dt, t) => { if (spr.parent && Math.random() < dt * 0.4) world.glow.emit(spr.position.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.3, 0.7 + Math.random() * 0.3, (Math.random() - 0.5) * 0.3)), new THREE.Vector3(0, 0.3, 0), '#fffbe0', 0.9); });
  });

  // ------------------------------------------------ dog
  const dog = billboard(dogSprite(0), 0.07); dog.position.copy(at(6, 20)); S.add(dog);
  const dogS = { follow: 0, pet: false, t: 0, dir: 1 };
  world.every((dt, t) => {
    dogS.t += dt;
    const p = world.player.pos; const d = new THREE.Vector3(p.x - dog.position.x, 0, p.z - dog.position.z); const dist = d.length();
    let moving = false;
    if (!dogS.pet) {
      const want = dogS.follow > 0 ? 5 : (dist < 9 ? 4.5 : 999);
      if (dogS.follow > 0) {
        // aim for a spot ~5 m behind Hazei
        const back = new THREE.Vector3(Math.sin(world.player.yaw), 0, Math.cos(world.player.yaw)).multiplyScalar(5);
        const tgt = new THREE.Vector3(p.x + back.x, 0, p.z + back.z); const dd = tgt.sub(dog.position).setY(0);
        if (dd.length() > 0.8) { const sp = Math.min(4.2, dd.length() * 1.5); dd.normalize(); dog.position.x += dd.x * dt * sp; dog.position.z += dd.z * dt * sp; moving = true; }
      } else if (dist > want && dist < 9) { d.normalize(); dog.position.x += d.x * dt * 3.2; dog.position.z += d.z * dt * 3.2; moving = true; }
      else if (dogS.follow <= 0 && dist > 9) { dog.position.x += Math.sin(t * 0.3) * dt * 0.8; dog.position.z += Math.cos(t * 0.23) * dt * 0.8; moving = true; }
      if (dogS.follow > 0) dogS.follow -= dt;
    }
    dog.position.y = H(dog.position.x, dog.position.z);
    // flip by screen-relative movement
    const right = new THREE.Vector3(Math.cos(world.player.yaw), 0, -Math.sin(world.player.yaw));
    if (moving) dogS.dir = Math.sign(d.dot(right)) || dogS.dir;
    dog.setCanvas(dogSprite(moving ? Math.floor(dogS.t * 9) % 4 : (dist < 4 ? Math.floor(dogS.t * 6) % 2 : 0), dogS.pet || dist < 4 ? 'happy' : 'normal', moving ? 'stand' : 'sit'), dogS.dir < 0);
  });
  world.interact.add({ pos: dog.position, range: 2.2, hold: 1.0, label: P.pet,
    onHold: () => { dogS.pet = true; world.handPose = 'pet'; if (Math.random() < 0.06) world.glow.emit(dog.position.clone().add(new THREE.Vector3(0, 1, 0)), new THREE.Vector3(0, 0.8, 0), '#ff8fb0', 1.2); },
    onRelease: () => { dogS.pet = false; world.handPose = 'idle'; },
    onDone: async () => {
      audio.sfx('woof'); audio.sfx('pet');
      for (let k = 0; k < 6; k++) world.glow.emit(dog.position.clone().add(new THREE.Vector3((Math.random() - 0.5), 1 + Math.random() * 0.5, (Math.random() - 0.5))), new THREE.Vector3(0, 0.9, 0), ['#ff8fb0', '#ffc2d4'][k % 2], 1.6);
      ui.note(C.dog, 2600);
      await wait(600); dogS.pet = false; world.handPose = 'idle'; dogS.follow = 70; did('dog');
    } });

  // ------------------------------------------------ cat on the blanket
  const cat = billboard(catSprite('sleep', 0, 'orange'), 0.06); cat.position.copy(I.blanket.position).add(new THREE.Vector3(-0.7, 0, 0.4)); S.add(cat);
  let catHappy = 0;
  world.every((dt, t) => { catHappy -= dt; cat.setCanvas(catHappy > 0 ? catSprite('happy', Math.floor(t * 3) % 2, 'orange') : catSprite('sleep', Math.floor(t * 0.8) % 2, 'orange')); });
  world.interact.add({ pos: cat.position, range: 2.2, hold: 1.0, label: P.pet, priority: 1,
    onHold: () => { world.handPose = 'pet'; catHappy = 0.5; },
    onRelease: () => { world.handPose = 'idle'; },
    onDone: async () => { audio.sfx('purr'); audio.sfx('meow'); catHappy = 3; ui.note(C.cat, 2600); world.toastOnce('island_cat'); for (let k = 0; k < 5; k++) world.glow.emit(cat.position.clone().add(new THREE.Vector3(0, 0.6, 0)), new THREE.Vector3((Math.random() - 0.5) * 0.4, 0.8, 0), '#ff8fb0', 1.4); await wait(500); world.handPose = 'idle'; did('cat'); } });

  // ------------------------------------------------ butterflies
  const bflies = [];
  for (let i = 0; i < 7; i++) {
    const col = ['#f6c45f', '#f59ac0', '#9ec1ff', '#ffffff'][i % 4];
    const b = billboard(butterflySprite(0, col), 0.05, { centerY: 0.5 });
    const home = i < 5 ? at(2 + (I.rnd() - 0.5) * 20, 26 + (I.rnd() - 0.5) * 16) : at(-25 + (I.rnd() - 0.5) * 10, 6);
    b.userData = { home, col, ph: I.rnd() * 10, landed: false, px: 0.05 };
    S.add(b); bflies.push(b);
  }
  let stillT = 0;
  world.every((dt, t) => {
    if (!world.moving && !world.locked) stillT += dt; else stillT = 0;
    for (const b of bflies) {
      const u = b.userData;
      if (u.landed) {
        if (world.moving || world.locked) { u.landed = false; world.handPose = world.handPose === 'palm' ? 'idle' : world.handPose; world.handItem = null; b.visible = true; }
        continue;
      }
      b.position.set(u.home.x + Math.sin(t * 0.6 + u.ph) * 2.5, u.home.y + 0.9 + Math.sin(t * 1.4 + u.ph) * 0.4, u.home.z + Math.cos(t * 0.5 + u.ph) * 2.5);
      b.setCanvas(butterflySprite(Math.floor(t * 10 + u.ph) % 2, u.col));
    }
    if (stillT > 2.5 && world.handPose === 'idle') {
      const p = world.player.pos;
      const b = bflies.find((b) => b.position.distanceTo(p) < 6);
      if (b) { b.userData.landed = true; b.visible = false; world.handPose = 'palm'; world.handItem = butterflySprite(0, b.userData.col); audio.sfx('sparkle'); ui.note(C.butterfly, 2600); stillT = -8; did(); }
    }
    if (world.handPose === 'palm' && world.handItem) { const lb = bflies.find((b) => b.userData.landed); if (lb) world.handItem = butterflySprite(Math.floor(t * 2) % 2, lb.userData.col); }
  });

  // ------------------------------------------------ swing
  world.interact.add({ pos: I.swing.position, range: 2.4, hold: 0.4, label: P.swing,
    onDone: async () => {
      const P0 = world.player.pos.clone(); const yaw0 = world.player.yaw;
      world.locked = true; world.handPose = 'lantern';
      world.player.pos.copy(I.swing.position); world.player.eye = 1.0;
      world.player.yaw = Math.atan2(-(SPOTS.city.x - I.swing.position.x), -(SPOTS.city.z - I.swing.position.z));
      world.toastOnce('island_swing'); ui.note(C.swing, 3000); did('swing');
      const f = new THREE.Vector3(-Math.sin(world.player.yaw), 0, -Math.cos(world.player.yaw));
      const stop = world.every((dt, t) => {
        const k = Math.sin(t * 2.2);
        world.player.pos.copy(I.swing.position).addScaledVector(f, k * 1.1);
        world.camOffsetY = 0.2 - Math.abs(k) * -0.35;
        world.player.pitch = -0.05 + k * 0.12;
      });
      await wait(9000);
      stop(); world.camOffsetY = 0; world.player.eye = 1.5; world.handPose = 'idle';
      world.player.pos.copy(P0); world.player.yaw = yaw0; world.locked = false;
    } });

  // ------------------------------------------------ telescope
  world.interact.add({ pos: I.telescope.position, range: 2.2, hold: 0.3, label: P.telescope,
    onDone: async () => {
      const save = { pos: world.player.pos.clone(), yaw: world.player.yaw, pitch: world.player.pitch, fov: world.camera.fov };
      world.locked = true; world.hideHands = true;
      world.player.pos.copy(I.telescope.position);
      const v = SPOTS.city.clone().sub(I.telescope.position).sub(new THREE.Vector3(0, 1.5, 0));
      world.player.yaw = Math.atan2(-v.x, -v.z); world.player.pitch = Math.atan2(v.y, Math.hypot(v.x, v.z));
      let fov = save.fov;
      const stop = world.every((dt) => {
        fov += (14 - fov) * Math.min(1, dt * 2); world.camera.fov = fov; world.camera.updateProjectionMatrix();
        const x = world.hx, W = world.W, Hh = world.H; const r = Hh * 0.42;
        x.fillStyle = '#120d18'; x.beginPath(); x.rect(0, 0, W, Hh); x.arc(W / 2, Hh / 2, r, 0, Math.PI * 2, true); x.fill();
        x.strokeStyle = '#c9a24a'; x.lineWidth = 3; x.beginPath(); x.arc(W / 2, Hh / 2, r, 0, Math.PI * 2); x.stroke();
      });
      ui.note(C.telescope, 4000); audio.sfx('chime'); did('telescope');
      await wait(6000);
      stop(); world.camera.fov = save.fov; world.camera.updateProjectionMatrix();
      world.player.pos.copy(save.pos); world.player.yaw = save.yaw; world.player.pitch = save.pitch;
      world.locked = false; world.hideHands = false;
    } });

  // ------------------------------------------------ boat
  // The route is worked out from the pond's real shoreline: a berth by the pier
  // deep enough to float the hull, then a smooth loop that keeps clear of the
  // banks and comes back to the berth heading the way it left.
  const route = (() => {
    // (the ground drops below the water line again outside the pond's bank, so only count what is inside it)
    const wl = pondLevel(), depth = (x, z) => (Math.hypot(x - SPOTS.lake.x, z - SPOTS.lake.z) > 6.1 ? 1 : mountainHeight(x, z) - wl);
    let cx = 0, cz = 0, n = 0;
    for (let x = 10; x <= 30; x += 0.5) for (let z = -6; z <= 14; z += 0.5) if (depth(x, z) < -1.8) { cx += x; cz += z; n++; }
    const c = new THREE.Vector2(cx / n, cz / n);
    const N = 24, reach = [];
    for (let i = 0; i < N; i++) { const a = (i / N) * Math.PI * 2; let r = 0; while (r < 9 && depth(c.x + Math.cos(a) * (r + 0.2), c.y + Math.sin(a) * (r + 0.2)) < -0.7) r += 0.2; reach.push(r); }
    const loop = reach.map((r, i) => {
      const m = Math.min(r, (reach[(i + N - 1) % N] + r + reach[(i + 1) % N]) / 3), a = (i / N) * Math.PI * 2, rr = Math.max(1.2, m - 2.1);
      return new THREE.Vector3(c.x + Math.cos(a) * rr, wl, c.y + Math.sin(a) * rr);
    });
    // the berth: the nearest spot to the pier where bow, middle and stern all float
    const pier = new THREE.Vector2(SPOTS.pier.x, SPOTS.pier.z), dir = c.clone().sub(pier).normalize();
    let berth = null;
    for (let k = 1; k < 7 && !berth; k += 0.2) for (const side of [1, -1]) {
      const b = pier.clone().add(dir.clone().multiplyScalar(k)).add(new THREE.Vector2(-dir.y, dir.x).multiplyScalar(side * 1.1));
      if ([-1.5, 0, 1.5].every((o) => [-0.7, 0.7].every((q) => depth(b.x + dir.x * o - dir.y * q, b.y + dir.y * o + dir.x * q) < -0.55))) { berth = b; break; }
    }
    const M = new THREE.Vector3(berth.x, wl, berth.y);
    let j = 0; loop.forEach((p, i) => { if (p.distanceTo(M) < loop[j].distanceTo(M)) j = i; });
    const pts = [M];
    for (let k = 1; k < N; k++) { const p = loop[(j + k) % N]; if (p.distanceTo(M) > 1.8) pts.push(p); }
    const curve = new THREE.CatmullRomCurve3(pts, true, 'centripetal');
    if (window.__game?.debug) window.__boatRoute = { curve, depth };
    return { curve, len: curve.getLength(), wl };
  })();
  const restHeading = () => { const tg = route.curve.getTangentAt(0); return Math.atan2(tg.x, tg.z); };
  I.boat.rotation.order = 'YXZ';
  I.boat.position.copy(route.curve.getPointAt(0)); I.boat.rotation.set(0, restHeading(), 0);
  // the oars rest along the gunwales while the boat is moored
  const oarPose = (oar, sweep, dip, feather) => { oar.rotation.set(feather, sweep, dip); };
  I.boat.userData.oars.forEach((o) => oarPose(o, -1.25, 0.12, 1.4));
  world.every((dt, t) => { if (!rowing) { I.boat.position.y = route.wl + Math.sin(t * 1.3) * 0.015; I.boat.rotation.z = Math.sin(t * 0.9) * 0.012; } });
  let rowing = false;
  const angDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
  world.interact.add({ pos: I.boat.position, range: 2.8, hold: 0.4, label: P.boat, cond: () => !rowing,
    onDone: async () => {
      const save = world.player.pos.clone(), saveEye = world.player.eye;
      rowing = true; world.locked = true; world.handPose = 'none';
      world.toastOnce('island_boat'); ui.note(C.boat, 3000); did('boat');
      const { curve, len, wl } = route, boat = I.boat, oars = boat.userData.oars;
      // climb in: seated on the stern thwart, facing the bow
      world.player.eye = 0.95;
      let heading = restHeading();
      world.player.yaw = heading + Math.PI; world.player.pitch = -0.14;
      let s = 0, v = 0, ph = 0.6, el = 0, wakeT = 0, lastPh = ph;
      const grips = [new THREE.Vector3(), new THREE.Vector3()], tmp = new THREE.Vector3();
      const sm = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
      await new Promise((resolve) => {
        const stop = world.every((dt, t) => {
          dt = Math.min(dt, 0.05); el += dt;
          const remain = len - s, stroking = el > 0.8 && remain > 3.4;
          // stroke cycle: the drive pulls the blades through the water, the recovery lifts and swings them forward
          if (stroking || ph < 0.999) ph += dt / 1.9;
          if (!stroking && ph >= 1) ph = 1;
          const u = ph % 1, inDrive = stroking && u < 0.45;
          const drive = inDrive ? Math.sin((Math.PI * u) / 0.45) : 0;
          v += (drive * 2.3 - v * 0.7) * dt;
          if (!stroking) v = Math.min(v, Math.sqrt(2 * 0.3 * Math.max(0, remain)) + 0.03); // glide in to the berth
          s = Math.min(len, s + v * dt);
          const p = curve.getPointAt(s / len), tg = curve.getTangentAt(s / len), h = Math.atan2(tg.x, tg.z);
          // the view turns with the boat, whatever way Hazei is looking
          const turn = angDiff(h, heading); world.player.yaw += turn; heading = h;
          const roll = Math.sin(t * 1.1) * 0.022 - (turn / Math.max(dt, 1e-3)) * 0.04, pitch = -drive * 0.035 + Math.sin(t * 1.7) * 0.01;
          boat.position.set(p.x, wl + Math.sin(t * 1.4) * 0.02 - drive * 0.015, p.z); boat.rotation.set(pitch, h, roll);
          world.roll = roll * 0.7;
          const seat = boat.localToWorld(tmp.set(0, 0, -0.85));
          world.player.pos.set(seat.x, wl - 0.02, seat.z);
          // oars
          const dipK = stroking ? sm(0, 0.07, u) * (1 - sm(0.4, 0.5, u)) : 0;
          const sweep = !stroking && ph >= 1 ? -0.55 : u < 0.45 ? -0.55 + 1.1 * sm(0, 0.45, u) : 0.55 - 1.1 * sm(0.45, 1, u);
          oars.forEach((o) => oarPose(o, sweep, -0.26 * dipK + 0.1 * (1 - dipK), (1 - dipK) * 1.3));
          // the catch: a splash where each blade bites, rings spreading through the drive
          if (stroking && lastPh % 1 > 0.9 && u < 0.1) { audio.sfx('oar'); oars.forEach((o) => { const b = o.localToWorld(tmp.copy(o.userData.blade)); for (let k = 0; k < 6; k++) world.fx.emit(new THREE.Vector3(b.x, wl + 0.05, b.z), new THREE.Vector3((Math.random() - 0.5) * 0.8, 1 + Math.random() * 0.8, (Math.random() - 0.5) * 0.8), '#ffffff', 0.6, { kind: 2, size: 2 }); }); }
          if (inDrive && Math.random() < dt * 14) oars.forEach((o) => { const b = o.localToWorld(tmp.copy(o.userData.blade)); world.fx.emit(new THREE.Vector3(b.x, wl + 0.03, b.z), new THREE.Vector3((Math.random() - 0.5) * 0.3, 0, (Math.random() - 0.5) * 0.3), '#e8fbff', 1.4); });
          lastPh = ph;
          // a V of foam opening out behind the stern, a ripple at the bow
          wakeT -= dt;
          if (v > 0.25 && wakeT < 0) {
            wakeT = 0.06;
            for (const sd of [-1, 1]) {
              const q = boat.localToWorld(tmp.set(sd * 0.45, 0, -1.3));
              const out = new THREE.Vector3(Math.cos(h) * sd, 0, -Math.sin(h) * sd).multiplyScalar(0.35 * v);
              world.fx.emit(new THREE.Vector3(q.x, wl + 0.03, q.z), out, '#f2fdff', 2.2, { size: 2 });
              const bw = boat.localToWorld(tmp.set(sd * 0.2, 0, 1.25));
              if (Math.random() < 0.5) world.fx.emit(new THREE.Vector3(bw.x, wl + 0.04, bw.z), out.multiplyScalar(1.4), '#ffffff', 0.9);
            }
          }
          // Hazei's hands on the oar grips
          world.camera.updateMatrixWorld();
          oars.forEach((o, i) => { o.updateMatrixWorld(); const g = o.localToWorld(grips[i].copy(o.userData.grip)).project(world.camera); grips[i].set((g.x + 1) / 2 * world.W, (1 - g.y) / 2 * world.H, g.z); });
          grips.forEach((g, i) => { if (g.z < 1) drawFist(world.hx, world.H, g.x, g.y, i === 0, i === 0 ? 0.35 : -0.35); });
          if (s >= len - 0.02 && v < 0.06) { stop(); resolve(); }
        });
      });
      boat.position.copy(curve.getPointAt(0)); boat.rotation.set(0, restHeading(), 0);
      oars.forEach((o) => oarPose(o, -1.25, 0.12, 1.4));
      world.roll = 0; world.player.eye = saveEye; world.player.pos.copy(save);
      world.handPose = 'idle'; world.locked = false; rowing = false;
    } });

  // ------------------------------------------------ lighthouse
  I.tower.updateMatrixWorld();
  const door = I.tower.localToWorld(new THREE.Vector3(0, 0, 3.2));
  door.y = H(door.x, door.z);
  let onTop = false;
  const climbDown = async () => {
    await ui.fade(true, { ms: 500 });
    onTop = false; world.mode = 'fp'; world.player.pos.copy(door).add(new THREE.Vector3(0, 0, 1)); world.locked = false;
    ui.actions(baseActions());
    await ui.fade(false, { ms: 500 });
  };
  world.interact.add({ pos: door, range: 2.5, hold: 0.4, label: P.climb,
    onDone: async () => {
      await ui.fade(true, { ms: 600 });
      onTop = true; world.mode = 'look';
      world.player.pos.copy(I.tower.localToWorld(new THREE.Vector3(0, 9.15, 0)));
      { const v = SPOTS.city.clone().sub(world.player.pos); world.player.yaw = Math.atan2(-v.x, -v.z); world.player.pitch = -0.1; }
      ui.actions([{ label: '📷 ' + content.ui.photo, onClick: () => world.photo(C.lighthouseTop, content.ui.photo) }, { label: P.descend, onClick: climbDown }]);
      await ui.fade(false, { ms: 600 });
      ui.note(C.lighthouseTop, 3500); audio.sfx('chime'); did('tower');
    } });

  guide.step('tower').pos = door.clone();
  guide.step('dog').pos = dog.position; guide.step('cat').pos = cat.position;

  // ------------------------------------------------ ducks at the pier, bell at the red gate
  world.interact.add({ pos: SPOTS.pier.clone().setY(pondLevel()), range: 2.4, hold: 0.5, label: P.feed, onDone: async () => {
    world.handPose = 'reach'; audio.sfx('pop');
    for (let k = 0; k < 16; k++) world.fx.emit(SPOTS.pier.clone().setY(pondLevel() + 0.8), new THREE.Vector3((SPOTS.lake.x - SPOTS.pier.x) * 0.2 + (Math.random() - 0.5), 1 + Math.random(), (SPOTS.lake.z - SPOTS.pier.z) * 0.2 + (Math.random() - 0.5)), '#f2d16b', 1.2, { kind: 2 });
    await wait(500); audio.sfx('quack'); ui.note(C.ducks, 2600); world.handPose = 'idle'; did('ducks');
  } });
  I.shrine.updateMatrixWorld();
  const bellPos = SPOTS.shrine.clone().setY(H(SPOTS.shrine.x, SPOTS.shrine.z));
  guide.step('bell').pos = bellPos;
  world.interact.add({ pos: bellPos, range: 2.6, hold: 0.4, label: P.bell, onDone: async () => {
    world.handPose = 'reach'; audio.sfx('jingle');
    for (let k = 0; k < 10; k++) world.glow.emit(bellPos.clone().add(new THREE.Vector3(0, 2, 0)), new THREE.Vector3((Math.random() - 0.5) * 1.5, Math.random() * 1.2, (Math.random() - 0.5) * 1.5), '#ffe9a8', 1.2);
    ui.note(C.bell, 2800); await wait(600); world.handPose = 'idle'; did('bell');
  } });

  // ------------------------------------------------ balloon
  let balloonReady = false;
  world.interact.add({ pos: I.balloon.position, range: 3.2, hold: 0.6, label: P.balloon, cond: () => balloonReady,
    onDone: async () => { audio.sfx('yay'); await game.leave(world); } });

  // ------------------------------------------------ guidance wisps + area notes + toasts
  const order = [['meadow', SPOTS.meadow], ['grove', SPOTS.grove], ['lake', SPOTS.lake], ['hill', SPOTS.hill], ['lighthouse', SPOTS.lighthouse]];
  let wispT = 0, petalT = 0, fireT = 0, startT = 0;
  world.every((dt, t) => {
    startT += dt;
    const p = world.player.pos;
    for (const [k, v] of order) if (!done[k] && Math.hypot(p.x - v.x, p.z - v.z) < 10) { done[k] = true; ui.note(C.hints[k], 2400); if (k === 'lighthouse') world.toastOnce('island_lighthouse'); if (k === 'grove') guide.done('grove'); }
    const mainDone = ['flowers', 'grove', 'boat', 'tower', 'telescope'].filter((id) => guide.step(id).done).length;
    if (!balloonReady && (mainDone >= 3 || startT > 300)) { balloonReady = true; guide.show('balloon'); setTimeout(() => { world.toastOnce('island_balloon'); ui.note(C.balloonReady, 3000); }, 1200); }
    if (balloonReady && !guide.forced && (mainDone >= 5 || startT > 480)) guide.force('balloon');
    const next = guide.current ? guide.posOf(guide.current) || I.balloon.position : I.balloon.position;
    wispT -= dt;
    if (wispT < 0 && !world.locked) {
      wispT = 2.8;
      const dir = new THREE.Vector3(next.x - p.x, 0, next.z - p.z);
      if (dir.length() > 6) {
        dir.normalize();
        for (let k = 0; k < 5; k++) {
          const o = p.clone().add(new THREE.Vector3(dir.x * (1.5 + k * 0.4) + (Math.random() - 0.5), 1.0 + Math.random() * 0.8, dir.z * (1.5 + k * 0.4) + (Math.random() - 0.5)));
          world.glow.emit(o, dir.clone().multiplyScalar(1.8).add(new THREE.Vector3(0, 0.15, 0)), k % 2 ? '#ffe9a0' : '#ffc2d4', 3.2, { kind: 1 });
        }
      }
    }
    // cherry petals
    petalT -= dt;
    if (petalT < 0) { petalT = 0.08; const tr = I.trees[Math.floor(Math.random() * 8)]; world.fx.emit(tr.position.clone().add(new THREE.Vector3((Math.random() - 0.5) * 3, 3 + Math.random() * 1.5, (Math.random() - 0.5) * 3)), new THREE.Vector3(0.3, -0.5, 0.1), ['#ffc2d4', '#ffd9e4', '#fff0f5'][Math.floor(Math.random() * 3)], 6, { kind: 1 }); }
    // fireflies by the lake + motes
    fireT -= dt;
    if (fireT < 0) { fireT = 0.25; world.glow.emit(new THREE.Vector3(20 + (Math.random() - 0.5) * 14, pondLevel() + 0.6 + Math.random() * 1.5, 4 + (Math.random() - 0.5) * 14), new THREE.Vector3(), '#e9ff9a', 6, { kind: 3 }); world.glow.emit(p.clone().add(new THREE.Vector3((Math.random() - 0.5) * 8, 0.5 + Math.random() * 2.5, (Math.random() - 0.5) * 8)), new THREE.Vector3(0, 0.05, 0), '#fff4c8', 5, { kind: 3 }); }
  });

  const baseActions = () => [{ label: '📷 ' + content.ui.photo, onClick: async () => { guide.hide(true); await world.photo(C.title, content.ui.photo); guide.hide(false); guide.done('photo'); } }];
  ui.actions(baseActions());

  audio.scene('island', [['wind', 0.5], ['birds', 0.8]]);
  const fin = world.start();
  await game.enter();
  ui.controlsHint(input.touch ? content.ui.controls3DTouch : content.ui.controls3D, 9000);
  await wait(2500);
  world.toastOnce('island_arrive');
  await fin;
}
