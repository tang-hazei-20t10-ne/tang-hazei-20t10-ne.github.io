# Hazei's Journey 🌷

A small, cozy pixel-art browser game made as a gift for Hazei on Vietnamese Women's Day (20/10).
One whole day out together: a Discord chat at the start, dawn in a meadow, a morning market with a photo
booth, a train ride, a bookshop, an omakase lunch, a café, the seaside, the mountain behind the school at
golden hour (with the city glittering below), a balloon flight at sunset, stargazing on the summit, a lantern festival, and finally her own song on a stage, a bouquet
made of the flowers she picked, and a wish built from her lunch choices.

No fail states, no timers, no scores. Everything the player sees is in Vietnamese.

---

## Run it locally

```bash
npm install
npm run dev          # http://localhost:5173
```

Useful URL flags:

| URL | What it does |
|---|---|
| `?debug` | Shows a small panel to jump to any chapter, add 5 flowers, or reset the save. |
| `?debug&fast` | Same, plus faster Discord typing, train ride, balloon flight and a 10-second song (for testing). |

Progress is saved automatically in `localStorage` (chapter, picked flowers, omakase choices, drink,
bookmark, outfit, settings). Photos go to IndexedDB. Refreshing the page offers "Đi tiếp từ chỗ cũ"
(continue) or "Bắt đầu lại từ đầu" (restart).

## Edit the words and personal details

**Mino's dialogue has its own file: `src/thoai-mino.js`**, in the order it appears in the game
(Discord chat, every chapter, the 3D-chapter Discord toasts, the bouquet line, the wish, the final
messages). All other player-facing text lives in **`src/content.js`** (UTF-8). Things you should fill in are
marked `TODO`:

- `partnerName` – your name as shown in dialogue (`Mino`). Dialogue uses cậu–tớ, as friends.
- `partnerLook` – hair colour/style, glasses, hoodie and trouser colours of your pixel character.
- `avatars` – optional square images (e.g. `assets/me.png`) for the Discord screens. Leave `null` to use the
  generated pixel avatars. Put the files in `public/assets/`.
- `discord` – server name, your Discord handle, channel names, and the opening DM script
  (`dm`: partner messages plus `{ replies: [...] }` steps where Hazei can tap a quick reply).
- `toasts` – the little Discord messages from you during the 3D chapters.
- `omakase.rounds` – the five rounds, two dishes each, the chef's explanation and the wish fragment.
- `wish.closing` – your closing line of the wish. The final wish is
  `opening + the five chosen fragments + closing + "Chúc mừng ngày Phụ nữ Việt Nam 20/10!"`.
- `epilogue.signoff` – your last message in the Discord epilogue.
- `song.title` – optional title of the song.

You do not need to touch any other file to change text.

## Train window video

The train window plays `public/assets/train-window.mp4` (muted, looping). The default clip is
"The view of Mount Cang and Erhai Lake outside the train K9613" by Nikita Yang, CC BY-SA 4.0, via
Wikimedia Commons (colour-graded and re-encoded); the credit shows in the window. To use another clip,
replace the file (mp4/H.264 plays everywhere, keep it a few MB) and update `train.videoCredit` in
`content.js`. If the file is missing, a pixel-art landscape is shown instead.

## Replace the song

Put her song at **`public/assets/song.mp3`** (keep the name, or change `song.file` in `content.js`).
Optionally add synced lyrics as **`public/assets/song.lrc`** (standard LRC format, `[mm:ss.xx] line`).

If the mp3 is missing, the stage plays a generated instrumental so the ending still works
(a small note says so). The song is fetched in the background while the game loads, and the stage
shows a tap-to-play button if the browser blocks audio.

## Deploy to GitHub Pages

The repo includes `.github/workflows/deploy.yml`, which builds with Vite and publishes `dist/`.

1. Create a GitHub repository and push this folder to the `main` branch:
   ```bash
   git init && git add -A && git commit -m "Hazei's Journey"
   git branch -M main
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```
2. On GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. The "Deploy to GitHub Pages" workflow runs on every push to `main` (or run it by hand from the
   Actions tab). When it finishes, the site is at `https://<you>.github.io/<repo>/`.

All paths are relative (`base: './'` in `vite.config.js`), so it works from any sub-path.
To build by hand: `npm run build` and upload the `dist/` folder to any static host.

## Controls

- **Desktop 2D**: ← → or A D to walk (or click where to go). Hold **E** / **Space** to interact.
- **Desktop 3D**: W A S D to walk, drag with the mouse to look, hold **E** to interact.
- **Phone**: on-screen arrows (2D) or a joystick (3D), swipe to look, hold the heart button to interact.
  Interaction prompts can also be pressed directly.
- The 📷 button takes a polaroid photo (saved to the album, downloadable). The camera icon at the top right
  opens the album; the speaker button mutes and shows a volume slider.

---

## Design notes

**Stack.** Vite + plain JavaScript modules, Three.js for the 3D chapters, no other runtime libraries.
Each chapter is its own module (`src/chapters/cN_*.js`) and is loaded on demand, so the first screen
is small; Three.js is only downloaded in the background after start.

```
src/
  content.js            all Vietnamese text and personal details (edit this)
  main.js               boot, loading screen, chapter sequencing, save/resume, debug panel
  core/
    sprites.js          procedural pixel-art: characters, animals, flowers, dishes, emotes
    palette.js          the shared time-of-day palette (dawn → night) and dithered gradients
    audio.js            WebAudio: generative music presets, nature beds, SFX, the song + analyser
    ui.js               DOM overlay: dialogue with typewriter, bubbles, prompts, toasts, modals, HUD
    input.js            keyboard / mouse / touch (arrows, joystick, look-drag)
    interact.js         the shared hold-to-interact system used by every 2D and 3D chapter
    photo.js            polaroids, photo strip, bouquet composition, wish card, downloads
    state.js            localStorage progress + IndexedDB album
  two/                  2D engine (integer-scaled pixel canvas, parallax, characters, partner AI,
                        particles, light rays, cheap bloom, colour grading) + shared props
  three/                3D engine (low-res render target, toon shading, bloom, dither/posterize
                        pass, first-person controller, billboards, particles, pixel hands) + the island
```

**One pixel world.** The mountain/city chapters and the concert render at a higher internal resolution
(about 400 px tall) for more detail while keeping the pixel look. 2D scenes render to a canvas about 190 px tall, scaled by an integer factor with
nearest-neighbour filtering. 3D scenes render at about 216 px tall, with 3-step toon shading, a bloom pass
and a final pass that posterizes with ordered (Bayer) dithering, then upscale the same way. Characters,
animals and flowers in 3D are billboards drawn by the same sprite code as the 2D chapters, so both halves
share one look. The camera is smoothed to reduce shimmering.

**One day, one palette.** `palette.js` defines dawn, morning, noon, afternoon, golden, dusk and night.
Chapters interpolate between them (the meadow brightens as you walk, the train moves toward noon, the
seaside slides into golden hour, the balloon flight into dusk, the hill into full night).

**Art is generated, not loaded.** Every sprite and background is drawn procedurally into small canvases
(characters with idle/walk/sit/crouch/hold/wave/heart/peace/jump/sing poses and moods, a shiba, cats,
chickens, pigeons, ducks, crabs, butterflies, seven flower species, twelve dishes, drinks, etc.).
No external art or audio files are needed except the song.

**Audio is generated.** Music is generative WebAudio (pads, plucks, bells, koto, flute, keys, soft drums)
with a preset per chapter; nature beds (birds, wind, waves, gulls, crickets, crowd, train) and SFX are
synthesized. So there is nothing to license. On the stage, lights, bloom, particles and the crowd react to
an `AnalyserNode` on the song.

## Decisions I made

- **Engine:** plain JS + Canvas 2D for 2D chapters and Three.js for 3D; no game framework, to keep it small
  and fully controllable.
- **Fonts:** VT323 (pixel font with full Vietnamese support) for titles and prompts, Nunito for longer text
  so it stays readable on phones. Both are bundled (no external font requests).
- **Mino's look:** short dark hair, round glasses, soft-blue hoodie. Edit in `content.js`.
- **The partner** follows a step behind in all 2D chapters, sits beside Hazei on benches, at the omakase
  counter, the café table and on the train, crouches with her by the dog, reacts to every flower, and joins
  every photo-booth pose. In the 3D chapters he is present only as Discord toasts until the stage.
- **Finale:** a concert hall (raked seating, two balcony levels, ~2,000 glow sticks, a 34 m LED wall with
  music-reactive visuals, side screens with a close-up of Hazei, moving-head beams, lasers, a follow spot,
  pyro and confetti at the climax). Hazei plays a grand piano while she sings. Chapter numbers are not shown.
- **Story order:** Discord → meadow (dawn) → market + photo booth → train → bookshop → omakase → café →
  seaside → the mountain behind the school (golden hour; the telescope looks down on the city) → balloon
  (sunset, over the school and the city) → the summit at night (stars above, city lights below) →
  lantern village → stage → Discord epilogue.
- **Cut:** the optional rainy street (7b), because the day already felt full. Puddles/umbrella are therefore
  not included; feeding is done with the meadow chickens.
- **The summit** of the same mountain is the stargazing spot, so the balloon can land there.
- **Bouquet:** uses the flowers she actually picked (meadow, market gift, seaside, island), up to 21;
  if fewer than 11, gift flowers are added quietly and Mino simply says he added a few.
- **Wish:** "Hazei à, anh chúc em…" + five fragments from the omakase + closing line + the 20/10 greeting ("Hazei ơi, tớ chúc cậu…").
  It appears on the stage, in the Discord epilogue, and as a downloadable card.
- **Album:** every polaroid and the photo strip are kept in IndexedDB and shown as attachments in the epilogue,
  along with the bouquet image, the wish card and the bookmark keepsake (if she took it in the bookshop).
- **Step-by-step guidance in the 3D maps:** a task list in the corner (collapsed to the current step on
  phones; tap to expand), a floating marker with distance over the current goal, small markers on nearby
  optional things, and an arrow at the screen edge when the goal is off-screen. While lying on the summit
  blanket, the marker points at the next star to look at. Signposts on the mountain paths name each area.
- **Gentle guidance:** on the mountain, golden wisps drift toward the next unexplored area; the balloon appears
  after a few interactions or a few minutes. Boundaries are a ring of trees and the school fence, never a message.
- **Accessibility/robustness:** respects `prefers-reduced-motion`, pauses (and suspends audio) when the tab is
  hidden, handles resize/orientation, shows Vietnamese error text, and keeps all text in the DOM so
  Vietnamese diacritics always render correctly.

## Licensing

All code, art and sound in this project are original and generated in code, except the train-window
video (CC BY-SA 4.0, credited above). Fonts: VT323 and Nunito
(SIL Open Font License) via `@fontsource`. Three.js is MIT. The Discord look and logo are used privately
for a personal, non-commercial gift. The song belongs to its owner and is not included.
