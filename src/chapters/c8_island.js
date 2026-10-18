// Chapter 8: first-person walk on the mountain behind the school at golden hour.
import content from '../content.js';
import { World3D, THREE, makeSky, billboard } from '../three/engine3d.js';
import { buildMountain, mountainHeight, mountainWalkable, pondLevel, SPOTS } from '../three/mountain.js';
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
  const world = new World3D(game, {
    start: [SPOTS.spawn.x, mountainHeight(SPOTS.spawn.x, SPOTS.spawn.z), SPOTS.spawn.z], yaw: 0, pitch: 0.05,
    heightAt: mountainHeight,
    walkable: mountainWalkable,
    bloom: 0.5, bloomThreshold: 0.78,
  });
  world.add(makeSky(['#4b5aa0', '#b77aa0', '#f5a46a', '#ffd796'], sunDir, { sun: '#fff1c0', glow: 0.8, sunSize: 0.9982 }));
  world.setTime({ fog: '#f3b27e', fogNear: 70, fogFar: 560, ambient: '#ffd9b8', ambientI: 0.5, sun: '#ffcf8a', sunI: 1.6, sunPos: [sunDir.x * 100, sunDir.y * 100 + 20, sunDir.z * 100], hemiSky: '#ffc890', hemiGround: '#6a5a7a', hemiI: 0.55 });
  world.grade.uniforms.tint.value.set('#fff2e4');
  const I = buildMountain(world);
  I.city.userData.setNight(0.15);
  world.every((dt, t) => I.city.userData.setNight(0.15 + Math.min(0.25, t / 900), t));
  const S = world.scene;
  const H = mountainHeight;
  const at = I.at;
  const done = { meadow: false, grove: false, lake: false, hill: false, lighthouse: false };
  let interactions = 0;
  const did = () => { interactions++; };

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
        world.toastOnce('island_flower'); did();
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
      const want = dogS.follow > 0 ? 2.2 : (dist < 9 ? 2.5 : 999);
      if (dist > want && dist < (dogS.follow > 0 ? 60 : 9)) { d.normalize(); dog.position.x += d.x * dt * 3.2; dog.position.z += d.z * dt * 3.2; moving = true; }
      else if (dogS.follow <= 0 && dist > 9) { dog.position.x += Math.sin(t * 0.3) * dt * 0.8; dog.position.z += Math.cos(t * 0.23) * dt * 0.8; moving = true; }
      if (dogS.follow > 0) dogS.follow -= dt;
    }
    dog.position.y = H(dog.position.x, dog.position.z);
    // flip by screen-relative movement
    const right = new THREE.Vector3(Math.cos(world.player.yaw), 0, -Math.sin(world.player.yaw));
    if (moving) dogS.dir = Math.sign(d.dot(right)) || dogS.dir;
    dog.setCanvas(dogSprite(moving ? Math.floor(dogS.t * 9) % 4 : (dist < 4 ? Math.floor(dogS.t * 6) % 2 : 0), dogS.pet || dist < 4 ? 'happy' : 'normal', moving ? 'stand' : 'sit'), dogS.dir < 0);
  });
  world.interact.add({ pos: dog.position, range: 2.4, hold: 1.0, label: P.pet, priority: 1,
    onHold: () => { dogS.pet = true; world.handPose = 'pet'; if (Math.random() < 0.06) world.glow.emit(dog.position.clone().add(new THREE.Vector3(0, 1, 0)), new THREE.Vector3(0, 0.8, 0), '#ff8fb0', 1.2); },
    onRelease: () => { dogS.pet = false; world.handPose = 'idle'; },
    onDone: async () => {
      audio.sfx('woof'); audio.sfx('pet');
      for (let k = 0; k < 6; k++) world.glow.emit(dog.position.clone().add(new THREE.Vector3((Math.random() - 0.5), 1 + Math.random() * 0.5, (Math.random() - 0.5))), new THREE.Vector3(0, 0.9, 0), ['#ff8fb0', '#ffc2d4'][k % 2], 1.6);
      ui.note(C.dog, 2600);
      await wait(600); dogS.pet = false; world.handPose = 'idle'; dogS.follow = 70; did();
    } });

  // ------------------------------------------------ cat on the blanket
  const cat = billboard(catSprite('sleep', 0, 'orange'), 0.06); cat.position.copy(I.blanket.position).add(new THREE.Vector3(-0.7, 0, 0.4)); S.add(cat);
  let catHappy = 0;
  world.every((dt, t) => { catHappy -= dt; cat.setCanvas(catHappy > 0 ? catSprite('happy', Math.floor(t * 3) % 2, 'orange') : catSprite('sleep', Math.floor(t * 0.8) % 2, 'orange')); });
  world.interact.add({ pos: cat.position, range: 2.2, hold: 1.0, label: P.pet, priority: 1,
    onHold: () => { world.handPose = 'pet'; catHappy = 0.5; },
    onRelease: () => { world.handPose = 'idle'; },
    onDone: async () => { audio.sfx('purr'); audio.sfx('meow'); catHappy = 3; ui.note(C.cat, 2600); world.toastOnce('island_cat'); for (let k = 0; k < 5; k++) world.glow.emit(cat.position.clone().add(new THREE.Vector3(0, 0.6, 0)), new THREE.Vector3((Math.random() - 0.5) * 0.4, 0.8, 0), '#ff8fb0', 1.4); await wait(500); world.handPose = 'idle'; did(); } });

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

  // ------------------------------------------------ blanket sit
  let sitting = false;
  world.interact.add({ pos: I.blanket.position, range: 2.0, hold: 0.3, label: () => (sitting ? P.stand : P.blanket),
    onDone: async () => {
      sitting = !sitting;
      if (sitting) { world.locked = true; world.player.eye = 0.75; audio.sfx('pop'); ui.note(C.blanket, 3000); did(); }
      else { world.locked = false; world.player.eye = 1.5; }
    } });

  // ------------------------------------------------ swing
  world.interact.add({ pos: I.swing.position, range: 2.4, hold: 0.4, label: P.swing,
    onDone: async () => {
      const P0 = world.player.pos.clone(); const yaw0 = world.player.yaw;
      world.locked = true; world.handPose = 'lantern';
      world.player.pos.copy(I.swing.position); world.player.eye = 1.0;
      world.player.yaw = Math.atan2(-(SPOTS.city.x - I.swing.position.x), -(SPOTS.city.z - I.swing.position.z));
      world.toastOnce('island_swing'); ui.note(C.swing, 3000); did();
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
      ui.note(C.telescope, 4000); audio.sfx('chime'); did();
      await wait(6000);
      stop(); world.camera.fov = save.fov; world.camera.updateProjectionMatrix();
      world.player.pos.copy(save.pos); world.player.yaw = save.yaw; world.player.pitch = save.pitch;
      world.locked = false; world.hideHands = false;
    } });

  // ------------------------------------------------ boat
  world.interact.add({ pos: I.boat.position, range: 2.8, hold: 0.4, label: P.boat,
    onDone: async () => {
      const save = world.player.pos.clone();
      world.locked = true; world.handPose = 'rim';
      world.toastOnce('island_boat'); ui.note(C.boat, 3000); audio.sfx('splash'); did();
      const c = new THREE.Vector3(20, 0, 4); const r = 4.6; const wl = pondLevel();
      const a0 = Math.atan2(I.boat.position.z - c.z, I.boat.position.x - c.x);
      const dur = 16; let k = 0;
      const stop = world.every((dt, t) => {
        k += dt / dur; const a = a0 + k * Math.PI * 2;
        I.boat.position.set(c.x + Math.cos(a) * r, wl + Math.sin(t * 2) * 0.04, c.z + Math.sin(a) * r);
        I.boat.rotation.y = -a;
        world.player.pos.set(I.boat.position.x, wl + 0.1, I.boat.position.z);
        if (Math.random() < dt * 3) world.fx.emit(I.boat.position.clone().add(new THREE.Vector3((Math.random() - 0.5) * 1.5, 0.1, (Math.random() - 0.5) * 1.5)), new THREE.Vector3(0, 0.2, 0), '#ffffff', 0.8);
      });
      await wait(dur * 1000);
      stop(); world.player.pos.copy(save); world.handPose = 'idle'; world.locked = false;
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
      ui.note(C.lighthouseTop, 3500); audio.sfx('chime'); did();
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
    for (const [k, v] of order) if (!done[k] && Math.hypot(p.x - v.x, p.z - v.z) < 10) { done[k] = true; ui.note(C.hints[k], 2400); if (k === 'lighthouse') world.toastOnce('island_lighthouse'); }
    if (!balloonReady && (interactions >= 4 || startT > 200)) { balloonReady = true; setTimeout(() => { world.toastOnce('island_balloon'); ui.note(C.balloonReady, 3000); }, 1200); }
    const next = balloonReady && (interactions >= 6 || Object.values(done).every(Boolean) || startT > 320) ? I.balloon.position : (order.find(([k]) => !done[k])?.[1] || I.balloon.position);
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

  const baseActions = () => [{ label: '📷 ' + content.ui.photo, onClick: () => world.photo(C.title, content.ui.photo) }];
  ui.actions(baseActions());

  audio.scene('island', [['wind', 0.5], ['birds', 0.8]]);
  const fin = world.start();
  await game.enter();
  ui.controlsHint(input.touch ? content.ui.controls3DTouch : content.ui.controls3D, 9000);
  await wait(2500);
  world.toastOnce('island_arrive');
  await fin;
}
