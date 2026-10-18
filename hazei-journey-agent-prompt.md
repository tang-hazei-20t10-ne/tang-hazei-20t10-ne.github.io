# Build brief: "Hazei's Journey", a pixel-art browser game gift

You are building a small, polished, emotionally warm browser game as a personal gift for a woman named **Hazei** on **Vietnamese Women's Day (20 October)**. The creator (the "partner") plays no role in design decisions you can't infer from this brief, so make good creative calls yourself and list what you decided in the README. Visual quality and emotional tone matter far more than feature count.

## 1. Goals and feel

- The whole experience should feel like **a day out together**, not a challenge. Gentle, cozy, a little cute. Hazei should finish it feeling relaxed, loved and special.
- **No fail states, no timers, no scores, no wrong choices, no combat.** Every interaction rewards curiosity with a small delight (a heart, a sparkle, a sound, a line of text).
- Playtime about 40 to 60 minutes in total, split into short chapters of roughly 3 to 6 minutes each, with saved progress so it can be played in several sittings. The player can wander, but the story always moves forward gently.
- Ending: Hazei performs her own song on a beautiful stage, then the partner gives her a bouquet made of the flowers she picked, together with a personal wish.
- **All text the player sees or hears must be Vietnamese**, warm and informal: every line of dialogue (partner, chef, NPCs, Hazei's quick replies), the Discord messages, partner toasts, interaction prompts, buttons, menus, dish and drink descriptions, loading and error messages, lyrics captions, and the final wish. Never leave English strings in the player-facing experience, and make sure fonts, text rendering and file encoding (UTF-8) handle Vietnamese diacritics everywhere. Only the code, comments and README may be in English.

## 2. Hard constraints

- Static site deployable to **GitHub Pages**: relative paths, no backend, no accounts, no analytics, no ads. A build step is fine if the output is committed or built by a GitHub Actions workflow. Include a README with exact deploy steps.
- Works on modern desktop and mobile browsers (touch controls required). Handle resize and orientation change. Keep it smooth on mid-range phones.
- All user-facing text and personal details live in **one content/config file** (see section 10) so the creator can edit them without touching code.
- Implementation choices (engine, libraries, language, structure) are **yours**. Pick what gives the best visuals and reliability. Do not over-engineer.

## 3. Art direction

- **Pixel art in the spirit of A Short Hike**, for both 2D and 3D parts. Mood references: A Short Hike (cozy exploration, low-res 3D), Alto's Odyssey (layered parallax, gradient skies, calm), Flower (wind, petals), Firewatch (sunset palettes).
- 3D parts should be rendered at low internal resolution and upscaled with nearest-neighbor filtering, with low-poly or billboard-sprite content, so everything reads as one pixel world. Prevent shimmering when the camera moves.
- One shared, deliberately chosen **palette** across all chapters, shifting with time of day. The whole game is one day: dawn, midday, afternoon, dusk, night.
- Atmosphere is the priority: colored fog, warm angled light, gradient skies, swaying grass and trees, drifting petals, fireflies, dust motes, soft bloom, gentle camera motion.
- Characters are small expressive pixel sprites with idle, walk, and emote animations. Hazei has long dark hair. The partner's look is configurable (hair, glasses, outfit colors) with sensible placeholders. Characters should be cute, not realistic.
- Use a legible pixel-style font, but keep long text readable (Vietnamese diacritics must render correctly everywhere).
- The previous prototype looked ugly because of flat colors, no depth, no lighting and static scenes. Do not repeat that. **Take screenshots of your own work, critique them, and iterate on the visuals** before calling a chapter done.

## 4. Characters and companionship

- **Hazei** is the player character in the 2D chapters. In every 3D chapter she is seen in first person (only her pixel hands appear). On the stage she becomes visible again.
- **The partner** is an NPC who **follows Hazei in every 2D chapter** and is absent from every 3D chapter until the stage. He is the one who gives the final bouquet.
- Partner behavior (2D): follows a step or two behind with a slight delay, stops when she stops, stands beside her at points of interest, sits next to her on benches and at the omakase counter and café table, shows small emote bubbles (heart, laugh, thumbs up, surprise), crouches next to the dog or cat when she pets it, and reacts when she picks a flower. He never blocks her and never needs input.
- In the 3D chapters he is still present in spirit: occasional small Discord-style message toasts from him appear in a screen corner at configured moments (as if they are still in a voice call). The texts live in the content file.

## 5. Interaction system (important)

Build a reusable interaction system used by every chapter. Examples must feel tactile and kind:

- **Pet the dog or cat**: it approaches when she is near, hold the action to pet, tail wag, closed eyes, floating hearts, soft sound. The dog can then trot after her for a stretch.
- **Pick flowers**: hold to pluck, the stem appears in her hand and flies into a bouquet "pocket" UI. Flowers have varied species and colors. A subtle indicator shows how many she has.
- Butterflies land on her hand if she stands still among flowers.
- **Sit and rest** on benches and swings (camera lowers, sky shifts a little).
- **Release a floating lantern** or balloon and watch it rise.
- **Photo mode** at viewpoints: a polaroid-style frame, saves to a downloadable image.
- **Write her name in sand** on the beach, then waves slowly wash it away.
- **Puddle jumping**, feeding ducks, opening an umbrella in light rain, chatting with simple NPCs (shopkeepers, kids, the chef).
- Interactions give gentle feedback (animation, particles, audio) and never penalize. Show clear but unobtrusive prompts. Supports keyboard, mouse, and touch.
- **Bouquet logic**: the flowers she actually picks go into the final bouquet, shown as a composed arrangement. If she picked few or none, quietly add gift flowers so the final bouquet always looks full and lovely. Do not tell her she did it "wrong".

## 6. Story flow and chapters

Progress between chapters with soft transitions. Save progress (localStorage) so a refresh resumes. Add a `?debug` mode to jump between chapters.

### Chapter 0: Discord opening
Recreate the **Discord desktop look** freely, including the real logo and visual style (dark theme, server rail, channel list, message list with avatars, timestamps, typing indicator, soft notification sound).
1. A DM conversation between the partner and Hazei plays out with timed messages in a scripted style that sounds natural for two close friends who usually hang out on Discord. Hazei can tap suggested quick replies or just continue. Never require typing. The partner invites her to join a voice channel in a server.
2. A "Join Voice" button leads to a voice channel view with both avatars. The speaking ring glows green as if someone is talking.
3. An **activity launcher** card named "Hazei's Journey" with a **"Bắt đầu chuyến hành trình"** button. When pressed, the activity window **grows smoothly until it fills the entire screen**, then dissolves into the first 2D scene.
4. Start audio on this first user gesture so later autoplay is not blocked.

### Chapter 1: Dawn meadow walk (2D side-scrolling)
Sunrise over meadow and village path: dog, chickens, windmill, flowers, butterflies, a bench. Hazei and the partner walk together. Introduce picking flowers, petting the dog, resting on the bench.

### Chapter 2: Morning market and photo booth (2D)
A lively morning street market under awnings and bunting: vendors, kids, pigeons, steaming food carts, a florist. Hazei browses stalls, and each stall offers a tiny delight: tasting a snack (happy animation), smelling flowers, trying on a straw hat or sunglasses (the sprite visibly changes), short warm chats with vendors. Highlight: a **photo booth** where both characters pose together. She picks a backdrop and a pose, prop or emote for each of four frames, and a **photo strip** is produced, downloadable as an image and added to an in-game album. The partner joins every pose with his own animation.

### Chapter 3: Countryside train ride (2D, pure sightseeing)
They sit side by side at the window of a small vintage train. The window view scrolls slowly through rice terraces, a lake, a tunnel with a starry ceiling, a hill town, a field where kids wave, and distant hot-air balloons. It is almost entirely passive so she can simply look and enjoy. Light options: open the window (wind and drifting petals), wave at people outside, share a snack with the partner, pick a song for the carriage speakers from a few instrumental loops. Time of day advances gently toward late morning.

### Chapter 4: Bookshop and record store (2D interior)
A cozy secondhand bookshop with a record corner and a sleeping cat. She browses shelves and pulls out books to read a short, gentle line (write original lines for the game about hope, courage and being yourself, do not quote real books). She tries records on a turntable (short instrumental loops), pets the cat, and the partner browses nearby with emotes and an occasional recommendation. She may take home a bookmark that is kept as a keepsake and shown again in the epilogue.

### Chapter 5: Omakase (2D interior, midday)
Counter, chef, both seated. **Five rounds.** Each round the chef presents **two dishes**, Hazei picks one, then the chef explains its meaning (typewriter text, warm chef personality). Every option has a lovely meaning, so no choice is wrong. The meaning of each chosen dish contributes one **wish fragment**. After five rounds the fragments combine into Hazei's personal wish, revealed at the end of the game, so every playthrough yields a slightly different wish. Draft content (Vietnamese, to be refined by the creator) is in section 10.

### Chapter 6: Café (2D interior)
They move to a café. A menu offers **teas, coffees, and smoothies** for Hazei to choose from. The partner orders a **Caramel Macchiato**. Both drinks arrive with latte-art hearts where applicable, and a cozy moment follows (steam, a window view, small dialogue, emotes).

### Chapter 7: Seaside afternoon (2D)
Beach and boardwalk at golden hour: waves, crabs, shells, a lighthouse in the distance, writing her name in the sand, releasing a lantern.

### Optional, chapter 7b: Rainy street
Umbrella, puddles, a cat under an awning. Cut it if the journey already feels full.

### Chapter 8: The island at golden hour (3D, first person)
A small explorable pixel island at golden hour, in the spirit of A Short Hike. **First-person view, only Hazei's hands visible.** Free exploration with soft guidance (drifting petals or a faint glow hint toward the next area, never a hard waypoint). Include: a flower meadow, a cherry blossom grove with falling petals, a lake with a small boat, a hilltop telescope viewpoint, a swing, a picnic blanket, a sleeping cat, a friendly dog, a lighthouse to climb, butterflies and fireflies. Invisible boundaries should feel natural (shoreline, hedges, gentle slopes), never a hard wall message. Mobile needs a virtual joystick plus look-drag. Ambient audio and partner message toasts support the mood.

### Chapter 9: Hot-air balloon at sunset (3D, passive sightseeing)
Hazei climbs into a balloon basket (first person, hands on the rim). A gentle automatic flight carries her over the whole island: the meadow, the cherry blossom grove, the lake, the lighthouse, and a glowing lantern village far away. She can look around freely. Optional light interactions: drop a handful of petals, wave at birds, take photos with photo mode, pull the burner lever for a soft flame glow. She lands on a quiet hillside.

### Chapter 10: Stargazing hill (3D, dusk to night)
A grassy hill with fireflies, an old tree with a swing, a small telescope and a blanket. The sky shifts from dusk to a full starry night. She can lie down on the blanket (camera looks up), gently connect stars into constellations (stars glow when looked at, lines appear and form simple shapes), and look through the telescope. Then a **shooting star** crosses the sky and she makes a wish, a quiet moment with a short line of Vietnamese text and a partner toast.

### Chapter 11: Lantern festival village (3D, night)
A village full of strings of lanterns, food stalls and friendly NPCs. Gentle games that can never be failed: ring toss, scooping goldfish and releasing them, painting a lantern in colors she chooses and releasing it into the sky, and a small fireworks show she triggers herself. The main street leads to the stage at its far end. As she walks, the crowd gathers and the village sounds fade down.

### Chapter 12: The stage (finale)
When Hazei walks to the stage and steps up, the camera transitions from first person to a **cinematic third-person view**, and she becomes a visible pixel character. The partner's character appears seated in the **front row**.
- Night falls. Stage lights come on in sequence. Visible volumetric light beams, haze, bloom, dust and petal particles. The audience is backlit silhouettes swaying with glow sticks and phone lights.
- Her song (`assets/song.mp3`) starts. **Lighting and motion react to the music** (analyser-based) so the show feels alive. Camera choreography: from the audience looking up, slow push in, side glides, a wide pull back at the climax. Fade out ambient music when the song starts. If audio autoplay is blocked, show a tap-to-play fallback.
- Optional synced lyrics from an LRC-style file if one is provided.
- When the song ends: applause, petals rain down, the partner stands, walks onto the stage and **hands her the bouquet** (built from her picks). Show her happy reaction, then reveal the assembled wish.

### Epilogue
Return to the Discord voice channel screen, where the partner's final message and the full wish appear. Show the **album** of photos she took (photo booth strip, photo mode shots) and keepsakes (such as the bookmark) as attachments in the partner's last message, with download buttons. Offer saving the wish as an image card and a quiet replay button.

## 7. Audio

Soft ambient loops per chapter, small SFX for interactions (pluck, pet, chime, page), a mute and volume control. Use free or generated audio and note any licensing in the README. The song file is supplied by the creator, so keep it a replaceable asset.

## 8. Robustness and polish

- Loading screen with a progress hint, graceful failure messages in Vietnamese, no console errors.
- Respect reduced-motion preferences, keep text sizes readable on phones, pause when the tab is hidden.
- Keep total asset size modest for mobile data. Preload the song and key assets.
- Clean transitions: no flash of unstyled content, no abrupt cuts between chapters.

## 9. Process expectations

1. Plan the architecture and write a short design note in the README.
2. Build a thin **end-to-end vertical slice first** (Discord opening, one 2D chapter, the island, the stage, the epilogue) with placeholder art, then raise visual quality chapter by chapter.
3. After each chapter, run it in a real browser, screenshot it, review the screenshots critically, and fix visual problems.
4. Test desktop and a mobile viewport with touch.
5. Finish with the README: how to run, how to edit content, how to replace the song, how to deploy to GitHub Pages, and a list of decisions you made.

## 10. Content and config (single editable file)

Everything below is a **placeholder with a draft**, to be edited by the creator. Mark anything the creator must supply with `TODO`.

- `playerName`: "Hazei". `partnerName`: TODO. Partner look: TODO (hair, glasses, outfit colors), default to a friendly neutral look. Avatars for the Discord screens: TODO, use generated pixel avatars if missing. Server and channel names: TODO, with cute defaults.
- Discord DM script: about 8 to 12 short, natural, affectionate messages leading to the voice invite (draft it in a casual Vietnamese voice and mark it for editing).
- Song: `assets/song.mp3`, optional `assets/song.lrc`.
- Partner toasts in the 3D chapter: 4 to 6 short messages with triggers (arrive on island, pick first flower, near the lighthouse, and so on).
- Closing line of the wish: TODO. The wish is assembled as: opening line + the five fragments chosen in the omakase + closing line + "Chúc mừng ngày Phụ nữ Việt Nam 20/10!".

### Omakase draft content (Vietnamese, refine freely)

| Round | Option A | Option B |
|---|---|---|
| 1. Khai vị | Trứng hấp chawanmushi: "Mềm như một buổi sáng không vội vã." Fragment: "luôn có những khoảng bình yên cho riêng mình" | Đậu hũ lạnh với hoa ăn được: "Thanh mát và nở hoa ngay trên đĩa." Fragment: "ở đâu cũng nở được một mùa hoa của riêng mình" |
| 2. Sashimi | Cá cam hamachi: "Món của những khởi đầu mới." Fragment: "mỗi ngày đều bắt đầu bằng một điều háo hức" | Cá ngừ béo otoro: "Hiếm và béo ngậy, chỉ dành cho lúc muốn trân trọng." Fragment: "luôn được đối đãi bằng sự trân trọng" |
| 3. Nigiri | Sò điệp hotate: "Ngọt hậu, như những niềm vui nhỏ." Fragment: "nhặt được thật nhiều niềm vui nhỏ" | Nhím biển uni: "Vị của biển đọng lại, quý và hiếm có." Fragment: "nhớ rằng mình quý và hiếm có" |
| 4. Món nóng | Tôm tempura: "Tôm cong lưng là biểu tượng của sống lâu và khoẻ mạnh." Fragment: "sống thật khoẻ và thật lâu" | Lươn nướng anago: "Mềm mà dẻo dai, bền bỉ." Fragment: "dẻo dai đi qua mọi chặng đường" |
| 5. Tráng miệng | Mochi dâu: "Chua nhẹ được bọc trong lớp ngọt." Fragment: "mọi điều chua cay đều được bọc trong ngọt ngào" | Pudding matcha: "Đắng nhẹ rồi hậu ngọt." Fragment: "ngày khó nào cũng có hậu ngọt" |

The chef's full explanation per dish should be 2 to 3 warm sentences in the content file, ending naturally into the fragment.

### Café menu draft
Trà: hoa cúc, đào cam sả, ô long sữa, matcha latte. Cà phê: latte, cappuccino, bạc xỉu. Sinh tố: xoài, dâu, bơ. Each item has a short cute description line.

## 11. Acceptance checklist

- Opening Discord screen to a full-screen expansion to chapter 1 works smoothly.
- The partner follows in every 2D chapter, with the interactions and emotes described.
- Omakase has five rounds with two options each, the chef explains each choice, and the choices change the final wish.
- Café menu works and the partner orders a Caramel Macchiato.
- Chapters 2 to 4 (market with photo booth, train ride, bookshop) are playable, each with at least three distinct interactions, and the partner follows throughout.
- The island is first person, pixel styled, explorable on desktop and mobile, with at least five distinct interactions.
- The balloon ride, stargazing hill and lantern festival (chapters 9 to 11) are playable in first person with the partner absent, and lead naturally to the stage.
- The album collects every photo taken and appears in the epilogue.
- The stage sequence is cinematic with music-reactive lighting, the partner appears in the front row, he hands over the bouquet built from her picks, and the wish is revealed.
- Epilogue returns to Discord.
- No fail states anywhere. Progress persists. README is complete. Site builds and deploys to GitHub Pages.
