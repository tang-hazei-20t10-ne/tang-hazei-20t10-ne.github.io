// Chapter 0: a Discord-like DM -> voice channel -> activity launch.
import content from '../content.js';
import { ui, wait, esc, el } from '../core/ui.js';
import { audio } from '../core/audio.js';
import { input } from '../core/input.js';
import { avatar, canvas, charSprite, LOOKS, flowerSprite } from '../core/sprites.js';
import { TIMES, ditherGradient } from '../core/palette.js';
import { ridgeStrip, treeSprite } from '../two/props.js';

const D = content.discord;
export const DISCORD_LOGO = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>';

export const ICON = {
  hash: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M10.99 3.16A1 1 0 1 0 9 2.84L8.15 8H4a1 1 0 0 0 0 2h3.82l-.67 4H3a1 1 0 1 0 0 2h3.82l-.8 4.84a1 1 0 0 0 1.97.32L8.85 16h4.97l-.8 4.84a1 1 0 0 0 1.97.32l.86-5.16H20a1 1 0 1 0 0-2h-3.82l.67-4H21a1 1 0 1 0 0-2h-3.82l.8-4.84a1 1 0 1 0-1.97-.32L15.15 8h-4.97l.8-4.84ZM14.15 14l.67-4H9.85l-.67 4h4.97Z"/></svg>',
  speaker: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 3a1 1 0 0 0-1-1h-.06a1 1 0 0 0-.74.32L5.92 7H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2.92l4.28 4.68a1 1 0 0 0 .74.32H11a1 1 0 0 0 1-1V3ZM15.1 20.75c-.58.14-1.1-.33-1.1-.92v-.03c0-.5.37-.92.85-1.05a7 7 0 0 0 0-13.5A1.11 1.11 0 0 1 14 4.2v-.03c0-.6.52-1.06 1.1-.92a9 9 0 0 1 0 17.5Z"/><path fill="currentColor" d="M15.16 16.51c-.57.28-1.16-.2-1.16-.83v-.14c0-.43.28-.8.63-1.02a3 3 0 0 0 0-5.04c-.35-.23-.63-.6-.63-1.02v-.14c0-.63.59-1.1 1.16-.83a5 5 0 0 1 0 9.02Z"/></svg>',
  mic: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a4 4 0 0 0-4 4v4a4 4 0 0 0 8 0V6a4 4 0 0 0-4-4Z"/><path fill="currentColor" d="M6 10a1 1 0 0 0-2 0 8 8 0 0 0 7 7.94V20H9a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-2v-2.06A8 8 0 0 0 20 10a1 1 0 1 0-2 0 6 6 0 0 1-12 0Z"/></svg>',
  head: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 3a9 9 0 0 0-8.95 10h1.87a5 5 0 0 1 4.1 2.13l1.37 1.97a3.1 3.1 0 0 1-.17 3.78 2.85 2.85 0 0 1-3.55.74 11 11 0 1 1 10.66 0c-1.27.71-2.73.23-3.55-.74a3.1 3.1 0 0 1-.17-3.78l1.38-1.97a5 5 0 0 1 4.1-2.13h1.86A9 9 0 0 0 12 3Z"/></svg>',
  gear: '<svg viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M10.56 1.1c-.46.05-.7.53-.64.98.18 1.16-.19 2.2-.98 2.53-.8.33-1.79-.15-2.49-1.1-.27-.36-.78-.52-1.14-.24-.77.59-1.45 1.27-2.04 2.04-.28.36-.12.87.24 1.14.96.7 1.43 1.7 1.1 2.49-.33.8-1.37 1.16-2.53.98-.45-.07-.93.18-.99.64a11.1 11.1 0 0 0 0 2.88c.06.46.54.7.99.64 1.16-.18 2.2.19 2.53.98.33.8-.14 1.79-1.1 2.49-.36.27-.52.78-.24 1.14.59.77 1.27 1.45 2.04 2.04.36.28.87.12 1.14-.24.7-.95 1.7-1.43 2.49-1.1.8.33 1.16 1.37.98 2.53-.07.45.18.93.64.99a11.1 11.1 0 0 0 2.88 0c.46-.06.7-.54.64-.99-.18-1.16.19-2.2.98-2.53.8-.33 1.79.14 2.49 1.1.27.36.78.52 1.14.24.77-.59 1.45-1.27 2.04-2.04.28-.36.12-.87-.24-1.14-.95-.7-1.43-1.7-1.1-2.49.33-.8 1.37-1.16 2.53-.98.45.07.93-.18.99-.64a11.1 11.1 0 0 0 0-2.88c-.06-.46-.54-.7-.99-.64-1.16.18-2.2-.19-2.53-.98-.33-.8.14-1.79 1.1-2.49.36-.27.52-.78.24-1.14a11.07 11.07 0 0 0-2.04-2.04c-.36-.28-.87-.12-1.14.24-.7.96-1.7 1.43-2.49 1.1-.8-.33-1.16-1.37-.98-2.53.07-.45-.18-.93-.64-.99a11.1 11.1 0 0 0-2.88 0ZM16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" clip-rule="evenodd"/></svg>',
  cam: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M4 4a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h11a3 3 0 0 0 3-3v-2.12a1 1 0 0 0 .55.9l3 1.5a1 1 0 0 0 1.45-.9V7.62a1 1 0 0 0-1.45-.9l-3 1.5a1 1 0 0 0-.55.9V7a3 3 0 0 0-3-3H4Z"/></svg>',
  rocket: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M20.97 2.94a1 1 0 0 0-.9-.9c-3.6-.31-7.07 1.07-9.38 3.64L8.6 5.5a3 3 0 0 0-2.37.88L3.3 9.3a1 1 0 0 0 .54 1.7l3.2.53 5.42 5.42.53 3.2a1 1 0 0 0 1.7.54l2.92-2.93a3 3 0 0 0 .88-2.37l-.18-2.09c2.57-2.31 3.95-5.78 3.64-9.38ZM15 11a2 2 0 1 1 0-4 2 2 0 0 1 0 4ZM5.3 16.29a1 1 0 0 1 1.41 1.42l-2.5 2.5a1 1 0 0 1-1.42-1.42l2.5-2.5Z"/></svg>',
  hang: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M21.1 13.6c-.18.34-.6.45-.97.34l-3.68-1.04a1 1 0 0 1-.72-.86l-.2-1.84a12.1 12.1 0 0 0-7.06 0l-.2 1.84a1 1 0 0 1-.72.86l-3.68 1.04c-.37.1-.79 0-.97-.34a3.9 3.9 0 0 1 .57-4.47c4.95-4.5 12.06-4.5 17.02 0a3.9 3.9 0 0 1 .58 4.47Z"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M13 5a1 1 0 1 0-2 0v6H5a1 1 0 1 0 0 2h6v6a1 1 0 1 0 2 0v-6h6a1 1 0 1 0 0-2h-6V5Z"/></svg>',
  people: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M13 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/><path fill="currentColor" d="M3 5v-.75C3 3.56 3.56 3 4.25 3s1.24.56 1.33 1.25C6.12 8.65 9.46 12 13 12h1a8 8 0 0 1 8 8 2 2 0 0 1-2 2 .21.21 0 0 1-.2-.15 7.65 7.65 0 0 0-1.32-2.3c-.15-.2-.42-.06-.39.17l.25 2c.02.15-.1.28-.25.28H9a2 2 0 0 1-2-2v-2.22c0-1.57-.67-3.05-1.53-4.37A15.85 15.85 0 0 1 3 5Z"/></svg>',
  back: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M3.3 11.3a1 1 0 0 0 0 1.4l7 7a1 1 0 0 0 1.4-1.4L6.42 13H20a1 1 0 1 0 0-2H6.41l5.3-5.3a1 1 0 0 0-1.42-1.4l-7 7Z"/></svg>',
};

export const CSS = `
.dc { position:absolute; inset:0; z-index:20; display:grid; grid-template-columns:72px 240px 1fr; background:#1e1f22; color:#dbdee1; font-family:'gg sans','Nunito',system-ui,sans-serif; font-weight:600; overflow:hidden; }
.dc svg { width:20px; height:20px; display:block; }
.dc button { font-family:inherit; }
.dc-rail { background:#1e1f22; display:flex; flex-direction:column; align-items:center; gap:8px; padding:12px 0; }
.dc-ico { position:relative; width:48px; height:48px; border-radius:50%; display:grid; place-items:center; background:#313338; color:#dbdee1; transition:border-radius .2s, background .2s; font-weight:800; font-size:16px; }
.dc-ico svg { width:28px; height:28px; }
.dc-ico.active, .dc-ico:hover { border-radius:16px; background:#5865f2; color:#fff; }
.dc-ico.green { color:#23a55a; } .dc-ico.green:hover { background:#23a55a; color:#fff; }
.dc-ico.active::before { content:''; position:absolute; left:-16px; width:8px; height:40px; border-radius:0 4px 4px 0; background:#fff; }
.dc-ico .ping { position:absolute; right:-4px; bottom:-4px; min-width:20px; height:20px; padding:0 5px; border-radius:10px; background:#f23f43; color:#fff; font-size:12px; font-weight:800; display:grid; place-items:center; border:3px solid #1e1f22; }
.dc-sep { width:32px; height:2px; background:#35363c; border-radius:1px; }
.dc-side { background:#2b2d31; display:flex; flex-direction:column; min-width:0; }
.dc-side .top { height:48px; display:flex; align-items:center; padding:0 10px; border-bottom:1px solid #1f2023; box-shadow:0 1px 0 rgba(0,0,0,.15); font-weight:800; color:#f2f3f5; }
.dc-search { width:100%; height:28px; border-radius:4px; background:#1e1f22; color:#949ba4; font-size:13px; display:flex; align-items:center; padding:0 8px; font-weight:600; }
.dc-list { flex:1; overflow:auto; padding:8px; }
.dc-item { display:flex; align-items:center; gap:10px; padding:6px 8px; border-radius:4px; color:#949ba4; margin-bottom:2px; font-size:15px; }
.dc-item.active { background:#404249; color:#fff; }
.dc-item img, .dc-item canvas { width:32px; height:32px; border-radius:50%; image-rendering:pixelated; }
.dc-cat { font-size:12px; text-transform:uppercase; letter-spacing:.02em; color:#949ba4; padding:16px 8px 4px; font-weight:800; }
.dc-voice-users { padding-left:34px; }
.dc-voice-users .u { display:flex; align-items:center; gap:8px; padding:3px 6px; color:#dbdee1; font-size:14px; }
.dc-voice-users .u canvas, .dc-voice-users .u img { width:24px; height:24px; border-radius:50%; image-rendering:pixelated; }
.dc-voice-users .u.speak canvas, .dc-voice-users .u.speak img { box-shadow:0 0 0 2px #23a55a; }
.dc-user { background:#232428; padding:8px; display:flex; align-items:center; gap:8px; }
.dc-user .av { position:relative; } .dc-user .av canvas, .dc-user .av img { width:32px; height:32px; border-radius:50%; image-rendering:pixelated; }
.dc-user .av::after { content:''; position:absolute; right:-2px; bottom:-2px; width:10px; height:10px; border-radius:50%; background:#23a55a; border:3px solid #232428; }
.dc-user .nm { flex:1; min-width:0; font-size:14px; color:#f2f3f5; line-height:1.15; } .dc-user .nm small { display:block; color:#949ba4; font-size:12px; }
.dc-user .ic { color:#b5bac1; display:flex; gap:10px; }
.dc-vc { background:#232428; border-bottom:1px solid #2e2f34; padding:8px 10px; display:none; }
.dc-vc.on { display:block; } .dc-vc b { color:#23a55a; font-size:14px; display:flex; gap:6px; align-items:center; } .dc-vc small { color:#949ba4; font-size:12px; }
.dc-main { background:#313338; display:flex; flex-direction:column; min-width:0; position:relative; }
.dc-head { height:48px; flex:none; display:flex; align-items:center; gap:8px; padding:0 16px; border-bottom:1px solid #26272b; box-shadow:0 1px 0 rgba(0,0,0,.12); color:#f2f3f5; font-weight:800; }
.dc-head .at { color:#80848e; font-size:22px; font-weight:600; }
.dc-head canvas, .dc-head img { width:24px; height:24px; border-radius:50%; image-rendering:pixelated; }
.dc-head .back { display:none; color:#b5bac1; background:none; border:0; padding:0 6px 0 0; }
.dc-msgs { flex:1; overflow-y:auto; padding:16px 0 8px; display:flex; flex-direction:column; touch-action:pan-y; }
.dc-msgs .spacer { flex:1; }
.dc-intro { padding:0 16px 16px; border-bottom:1px solid #3f4147; margin:0 16px 12px; padding-left:0; }
.dc-intro canvas, .dc-intro img { width:80px; height:80px; border-radius:50%; image-rendering:pixelated; }
.dc-intro h3 { margin:8px 0 2px; color:#f2f3f5; font-size:26px; font-weight:800; } .dc-intro p { margin:0; color:#b5bac1; font-size:14px; }
.dc-msg { display:flex; gap:14px; padding:2px 16px 2px 16px; animation:dcIn .25s ease-out; }
.dc-msg.first { margin-top:14px; }
.dc-msg .av { width:40px; flex:none; } .dc-msg .av canvas, .dc-msg .av img { width:40px; height:40px; border-radius:50%; image-rendering:pixelated; }
.dc-msg .meta { display:flex; gap:8px; align-items:baseline; } .dc-msg .meta b { color:#f2f3f5; font-weight:700; } .dc-msg .meta b.p { color:#a4b8f5; } .dc-msg .meta b.h { color:#f5a3bd; } .dc-msg .meta small { color:#949ba4; font-size:12px; font-weight:600; }
.dc-msg .tx { color:#dbdee1; font-size:16px; line-height:1.375; font-weight:500; word-break:break-word; }
.dc-msg:hover { background:#2e3035; }
@keyframes dcIn { from { opacity:0; transform:translateY(6px); } }
.dc-invite { margin-top:6px; width:min(432px,100%); background:#2b2d31; border-radius:8px; padding:16px; }
.dc-invite .k { font-size:12px; font-weight:800; color:#b5bac1; text-transform:uppercase; margin-bottom:12px; }
.dc-invite .row { display:flex; align-items:center; gap:14px; }
.dc-invite .srv { width:50px; height:50px; border-radius:16px; background:#5865f2; color:#fff; display:grid; place-items:center; font-weight:800; font-size:18px; flex:none; }
.dc-invite .nm { flex:1; min-width:0; } .dc-invite .nm b { color:#f2f3f5; display:block; font-size:16px; } .dc-invite .nm small { color:#b5bac1; font-size:13px; display:flex; gap:4px; align-items:center; }
.dc-invite .nm small svg { width:14px; height:14px; }
.dc-btn { background:#248046; color:#fff; border:0; border-radius:4px; padding:10px 18px; font-size:14px; font-weight:700; cursor:pointer; }
.dc-btn:hover { background:#1a6334; } .dc-btn.blurple { background:#5865f2; } .dc-btn.blurple:hover { background:#4752c4; }
.dc-btn.pulse { animation:dcPulse 1.6s infinite; }
@keyframes dcPulse { 50% { box-shadow:0 0 0 6px rgba(35,165,90,.3); } }
.dc-typing { height:24px; padding:0 16px; font-size:13px; color:#dbdee1; display:flex; align-items:center; gap:6px; opacity:0; }
.dc-typing.on { opacity:1; }
.dc-typing i { width:6px; height:6px; border-radius:50%; background:#dbdee1; animation:dcDot 1.2s infinite; display:inline-block; }
.dc-typing i:nth-child(2){ animation-delay:.15s } .dc-typing i:nth-child(3){ animation-delay:.3s }
@keyframes dcDot { 30% { opacity:.3; transform:translateY(-2px); } }
.dc-replies { display:flex; gap:8px; flex-wrap:wrap; padding:0 16px 8px; min-height:0; }
.dc-reply { background:#404249; color:#f2f3f5; border:1px solid #4e5058; border-radius:18px; padding:8px 14px; font-size:15px; cursor:pointer; animation:dcIn .3s; font-weight:600; }
.dc-reply:hover { background:#5865f2; border-color:#5865f2; }
.dc-reply.ghost { background:transparent; color:#949ba4; }
.dc-compose { margin:0 16px 20px; height:44px; flex:none; border-radius:8px; background:#383a40; display:flex; align-items:center; gap:12px; padding:0 14px; color:#6d6f78; font-size:15px; }
.dc-compose .plus { width:24px; height:24px; border-radius:50%; background:#b5bac1; color:#383a40; display:grid; place-items:center; }
.dc-compose .plus svg { width:16px; height:16px; }
.dc-vstage { flex:1; background:#000; position:relative; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px; padding:16px; min-height:0; }
.dc-tiles { display:flex; gap:16px; flex-wrap:wrap; justify-content:center; width:100%; }
.dc-tile { position:relative; width:min(340px,42vw); aspect-ratio:16/9; border-radius:8px; display:grid; place-items:center; transition:box-shadow .15s; }
.dc-tile.p { background:#3e4a7a; } .dc-tile.h { background:#7a3e5e; }
.dc-tile canvas, .dc-tile img { width:min(88px,18vw); height:min(88px,18vw); border-radius:50%; image-rendering:pixelated; }
.dc-tile .lbl { position:absolute; left:8px; bottom:8px; background:rgba(0,0,0,.55); color:#fff; padding:3px 8px; border-radius:4px; font-size:13px; }
.dc-tile.speak { box-shadow:inset 0 0 0 3px #23a55a; }
.dc-tile.speak canvas, .dc-tile.speak img { box-shadow:0 0 0 4px #23a55a; }
.dc-tile.act { background:#111214; overflow:hidden; cursor:pointer; }
.dc-tile.act canvas { width:100%; height:100%; border-radius:0; }
.dc-controls { display:flex; gap:12px; padding:12px; justify-content:center; background:#000; }
.dc-cbtn { width:56px; height:48px; border-radius:24px; border:0; background:#2b2d31; color:#dbdee1; display:grid; place-items:center; }
.dc-cbtn.red { background:#da373c; color:#fff; } .dc-cbtn.hl { background:#5865f2; color:#fff; animation:dcPulse 1.6s infinite; }
.dc-shelf { position:absolute; left:50%; bottom:82px; transform:translateX(-50%); width:min(440px,calc(100% - 24px)); background:#2b2d31; border-radius:12px; padding:16px; box-shadow:0 12px 40px rgba(0,0,0,.6); animation:dcUp .4s cubic-bezier(.2,1.2,.4,1); z-index:2; }
@keyframes dcUp { from { opacity:0; transform:translate(-50%,30px); } }
.dc-shelf h4 { margin:0; color:#f2f3f5; font-size:18px; font-weight:800; } .dc-shelf .s { color:#b5bac1; font-size:13px; margin-bottom:12px; }
.dc-card { background:#1e1f22; border-radius:10px; overflow:hidden; }
.dc-card .art { position:relative; aspect-ratio:16/8; background:#000; }
.dc-card .art canvas { width:100%; height:100%; image-rendering:pixelated; display:block; }
.dc-card .body { padding:12px 14px 14px; } .dc-card .body b { display:block; color:#f2f3f5; font-size:17px; font-weight:800; } .dc-card .body p { margin:4px 0 10px; color:#b5bac1; font-size:14px; font-weight:500; }
.dc-card .players { display:flex; align-items:center; gap:6px; color:#949ba4; font-size:12px; margin-bottom:12px; }
.dc-card .players canvas { width:20px; height:20px; border-radius:50%; image-rendering:pixelated; margin-right:-10px; border:2px solid #1e1f22; }
.dc-card .players span { margin-left:14px; }
.dc-card .dc-btn { width:100%; padding:12px; font-size:15px; }
.dc-grow { position:fixed; z-index:75; overflow:hidden; border-radius:10px; background:#000; transition:all 1.5s cubic-bezier(.65,0,.25,1); }
.dc-grow canvas { width:100%; height:100%; image-rendering:pixelated; display:block; object-fit:cover; }
.dc-members { display:none; }
@media (min-width:1200px) { .dc { grid-template-columns:72px 240px 1fr 240px; } .dc-members { display:block; background:#2b2d31; padding:16px 8px; } }
@media (max-width:760px) { .dc { grid-template-columns:1fr; } .dc-rail, .dc-side { display:none; } .dc-head .back { display:block; } .dc-tile { width:min(340px,80vw); } .dc-msg .tx { font-size:15px; } }
@media (max-height:520px) { .dc-tile { width:min(220px,30vw); } .dc-shelf { bottom:70px; } .dc-card .art { aspect-ratio:16/6; } }
`;

export function avatarNode(who) {
  const src = content.avatars[who];
  if (src) { const i = new Image(); i.src = src; i.alt = ''; return i; }
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(avatar(who, 64), 0, 0);
  return c;
}
export const now = () => { const d = new Date(); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };

// Pixel art for the activity card: dawn meadow with both characters.
export function activityArt(w = 192, h = 96) {
  const [c, x] = canvas(w, h);
  const pal = TIMES.dawn;
  ditherGradient(x, w, h, pal.sky, 0, 14);
  // sun
  x.fillStyle = '#fff0c4'; for (let j = -8; j <= 8; j++) { const ww = Math.round(Math.sqrt(64 - j * j)); x.fillRect(w * 0.68 - ww, h * 0.58 + j, ww * 2, 1); }
  x.drawImage(ridgeStrip(w, 40, { seed: 4, base: '#9a7fb8', peak: 0.7, freq: 0.04, rough: 0.6, snow: false }), 0, h - 62);
  x.drawImage(ridgeStrip(w, 30, { seed: 9, base: '#7fa86f', peak: 0.5, freq: 0.03, trees: 12, treeCol: '#5f8a5a' }), 0, h - 42);
  x.fillStyle = '#79b062'; x.fillRect(0, h - 18, w, 18);
  x.fillStyle = '#d9b98a'; x.fillRect(0, h - 11, w, 4);
  const t = treeSprite('round', 1.1, 3);
  x.drawImage(t.img, 18 - t.ox, h - 14 - t.oy);
  for (let i = 0; i < 24; i++) { const f = flowerSprite(['daisy', 'tulip', 'cosmos', 'poppy'][i % 4], ['#ffffff', '#f06d8a', '#f59ac0', '#e9473f'][i % 4]); x.drawImage(f, (i * 37) % w, h - 22 + (i % 3) * 2); }
  const hz = charSprite(LOOKS.hazei(), { pose: 'idle', mood: 'happy' });
  const pt = charSprite(LOOKS.partner(), { pose: 'idle', mood: 'happy' });
  x.drawImage(pt, w * 0.42 - 12, h - 38);
  x.drawImage(hz, w * 0.52 - 12, h - 38);
  // title
  x.fillStyle = 'rgba(40,20,40,.35)'; x.fillRect(0, 0, w, 18);
  return c;
}

export default async function discord(game) {
  const style = el('style', '', CSS); document.head.appendChild(style);
  const root = el('div', 'dc');
  game.app.appendChild(root);
  ui.hud(false); input.setMode('none');
  audio.scene(null, []);

  root.innerHTML = `
    <nav class="dc-rail">
      <div class="dc-ico active home">${DISCORD_LOGO}</div>
      <div class="dc-sep"></div>
      <div class="dc-ico srv">${esc(D.serverInitials)}</div>
      <div class="dc-ico green">${ICON.plus}</div>
    </nav>
    <aside class="dc-side">
      <div class="top dm-top"><div class="dc-search">${esc(D.friends)} · ${esc(D.dmLabel)}</div></div>
      <div class="dc-list"></div>
      <div class="dc-vc"><b>${ICON.speaker}${esc(D.voiceConnected)}</b><small>${esc(D.voiceChannel)} / ${esc(D.serverName)}</small></div>
      <div class="dc-user"><div class="av"></div><div class="nm">${esc(D.hazeiHandle)}<small>${esc(D.online)}</small></div><div class="ic">${ICON.mic}${ICON.head}${ICON.gear}</div></div>
    </aside>
    <main class="dc-main"></main>
    <aside class="dc-members"><div class="dc-cat">${esc(D.online)} — 2</div><div class="dc-item m1"></div><div class="dc-item m2"></div></aside>`;
  root.querySelector('.dc-user .av').appendChild(avatarNode('hazei'));
  const m1 = root.querySelector('.m1'); m1.append(avatarNode('partner'), document.createTextNode(D.partnerHandle));
  const m2 = root.querySelector('.m2'); m2.append(avatarNode('hazei'), document.createTextNode(D.hazeiHandle));
  const list = root.querySelector('.dc-list');
  const main = root.querySelector('.dc-main');
  const railSrv = root.querySelector('.srv');
  const railHome = root.querySelector('.home');

  // ---------------- DM view
  list.innerHTML = `<div class="dc-item">${ICON.people}${esc(D.friends)}</div><div class="dc-cat">${esc(D.dmLabel)}</div>`;
  const dmItem = el('div', 'dc-item active'); dmItem.append(avatarNode('partner'), document.createTextNode(D.partnerHandle));
  list.appendChild(dmItem);
  main.innerHTML = `
    <div class="dc-head"><button class="back">${ICON.back}</button><span class="at">@</span><span class="hav"></span>${esc(D.partnerHandle)}</div>
    <div class="dc-msgs"><div class="spacer"></div><div class="dc-intro"><div class="iav"></div><h3>${esc(D.partnerHandle)}</h3><p>Đây là khởi đầu cuộc trò chuyện trực tiếp của bạn với <b>@${esc(D.partnerHandle)}</b>.</p></div></div>
    <div class="dc-typing"><span><i></i> <i></i> <i></i></span><span><b>${esc(D.partnerHandle)}</b> ${esc(D.typing)}</span></div>
    <div class="dc-replies"></div>
    <div class="dc-compose"><span class="plus">${ICON.plus}</span>${esc(D.messagePlaceholder)}${esc(D.partnerHandle)}</div>`;
  main.querySelector('.hav').appendChild(avatarNode('partner'));
  main.querySelector('.iav').appendChild(avatarNode('partner'));
  const msgs = main.querySelector('.dc-msgs');
  const typing = main.querySelector('.dc-typing');
  const replies = main.querySelector('.dc-replies');

  await ui.fade(false, { dark: true, ms: 800 });

  let lastFrom = null;
  const addMsg = (from, nodeOrText) => {
    const first = from !== lastFrom; lastFrom = from;
    const m = el('div', 'dc-msg' + (first ? ' first' : ''));
    const av = el('div', 'av'); if (first) av.appendChild(avatarNode(from));
    const body = el('div', '');
    body.style.minWidth = '0';
    if (first) body.appendChild(el('div', 'meta', `<b class="${from === 'partner' ? 'p' : 'h'}">${esc(from === 'partner' ? D.partnerHandle : D.hazeiHandle)}</b><small>${esc(D.today)} ${now()}</small>`));
    if (typeof nodeOrText === 'string') body.appendChild(el('div', 'tx', esc(nodeOrText))); else body.appendChild(nodeOrText);
    m.append(av, body); msgs.appendChild(m);
    msgs.scrollTop = msgs.scrollHeight;
  };

  let joinResolve;
  const joined = new Promise((r) => { joinResolve = r; });
  const fast = game.debug && new URLSearchParams(location.search).has('fast');

  for (const item of D.dm) {
    if (item.replies) {
      const pick = await new Promise((resolve) => {
        replies.innerHTML = '';
        item.replies.forEach((r) => { const b = el('button', 'dc-reply', esc(r)); b.onclick = () => resolve(r); replies.appendChild(b); });
        msgs.scrollTop = msgs.scrollHeight;
      });
      replies.innerHTML = '';
      if (pick) { audio.sfx('send'); addMsg('hazei', pick); await wait(fast ? 50 : 700); }
      continue;
    }
    // partner message with typing indicator
    typing.classList.add('on');
    const len = item.invite ? 20 : item.text.length;
    await wait(fast ? 60 : Math.min(2200, 650 + len * 32));
    typing.classList.remove('on');
    if (item.invite) {
      const card = el('div', 'dc-invite', `<div class="k">Bạn được mời vào kênh thoại</div><div class="row"><div class="srv">${esc(D.serverInitials)}</div><div class="nm"><b>${esc(D.serverName)}</b><small>${ICON.speaker}${esc(D.voiceChannel)}</small></div><button class="dc-btn pulse">${esc(D.joinVoice)}</button></div>`);
      card.querySelector('button').onclick = () => joinResolve();
      addMsg('partner', card);
    } else addMsg('partner', item.text);
    audio.sfx('notify');
    await wait(fast ? 40 : 450);
  }
  await joined;

  // ---------------- voice view
  audio.sfx('join');
  railHome.classList.remove('active'); railSrv.classList.add('active');
  root.querySelector('.dm-top').innerHTML = `<span>${esc(D.serverName)}</span>`;
  list.innerHTML = `<div class="dc-cat">Kênh chat</div>${D.textChannels.map((c) => `<div class="dc-item">${ICON.hash}${esc(c)}</div>`).join('')}<div class="dc-cat">Kênh thoại</div><div class="dc-item active">${ICON.speaker}${esc(D.voiceChannel)}</div><div class="dc-voice-users"></div>`;
  const vu = list.querySelector('.dc-voice-users');
  const uP = el('div', 'u'); uP.append(avatarNode('partner'), document.createTextNode(D.partnerHandle));
  const uH = el('div', 'u'); uH.append(avatarNode('hazei'), document.createTextNode(D.hazeiHandle));
  vu.append(uP, uH);
  root.querySelector('.dc-vc').classList.add('on');
  main.innerHTML = `
    <div class="dc-head"><button class="back">${ICON.back}</button>${ICON.speaker}${esc(D.voiceChannel)}</div>
    <div class="dc-vstage"><div class="dc-tiles"></div></div>
    <div class="dc-controls"><button class="dc-cbtn">${ICON.mic}</button><button class="dc-cbtn">${ICON.cam}</button><button class="dc-cbtn rocket">${ICON.rocket}</button><button class="dc-cbtn red">${ICON.hang}</button></div>`;
  const tiles = main.querySelector('.dc-tiles');
  const tP = el('div', 'dc-tile p'); tP.append(avatarNode('partner')); tP.appendChild(el('div', 'lbl', esc(D.partnerHandle)));
  const tH = el('div', 'dc-tile h'); tH.append(avatarNode('hazei')); tH.appendChild(el('div', 'lbl', esc(D.hazeiHandle)));
  tiles.append(tP, tH);
  // speaking rings
  let speakOn = true;
  const speak = setInterval(() => {
    if (!speakOn) return;
    const p = Math.random() < 0.6; const h = !p && Math.random() < 0.5;
    tP.classList.toggle('speak', p); uP.classList.toggle('speak', p);
    tH.classList.toggle('speak', h); uH.classList.toggle('speak', h);
  }, 700);
  await wait(fast ? 100 : 2200);

  // activity shelf
  const rocket = main.querySelector('.rocket');
  rocket.classList.add('hl');
  const shelf = el('div', 'dc-shelf');
  const art = activityArt();
  shelf.innerHTML = `<h4>${esc(D.activitiesTitle)}</h4><div class="s">${esc(D.activitiesHint)}</div><div class="dc-card"><div class="art"></div><div class="body"><b>${esc(D.activityName)}</b><p>${esc(D.activityDesc)}</p><div class="players"></div><button class="dc-btn blurple">${esc(D.startButton)}</button></div></div>`;
  shelf.querySelector('.art').appendChild(art);
  const pl = shelf.querySelector('.players'); pl.append(avatarNode('partner'), avatarNode('hazei'), el('span', '', esc(D.activityPlayers)));
  main.querySelector('.dc-vstage').appendChild(shelf);
  audio.sfx('chime');
  const startBtn = shelf.querySelector('button');
  startBtn.focus({ preventScroll: true });
  await new Promise((r) => { startBtn.onclick = r; rocket.onclick = r; });
  audio.sfx('whoosh');
  audio.init();

  // grow the activity window to full screen
  const artBox = shelf.querySelector('.art');
  const r = artBox.getBoundingClientRect();
  const grow = el('div', 'dc-grow');
  const big = activityArt(Math.round(innerWidth / 4), Math.round(innerHeight / 4));
  grow.appendChild(big);
  Object.assign(grow.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
  game.app.appendChild(grow);
  shelf.style.visibility = 'hidden';
  await wait(30);
  Object.assign(grow.style, { left: '0px', top: '0px', width: innerWidth + 'px', height: innerHeight + 'px', borderRadius: '0px' });
  await wait(1600);
  speakOn = false; clearInterval(speak);
  root.remove(); style.remove();
  game.handoff = grow;
  ui.fadeEl.classList.remove('on');
}
