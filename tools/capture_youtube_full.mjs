import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const globalNodeModules = path.join(process.env.APPDATA || '', 'npm', 'node_modules');
const { chromium } = require(path.join(globalNodeModules, 'playwright'));

const ASSETMAPPER_URL = 'http://127.0.0.1:8091';
const DOCS_IMG_DIR = 'c:/wamp64/www/symfony/promosyon8/bundles/liveux-file-manager-bundle/docs/images';
const VIDEO_TMP_DIR = 'c:/wamp64/www/symfony/liveux-file-manager-demo/var-video-yt';
const FFMPEG_EXE = path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WinGet', 'Links', 'ffmpeg.exe');
const FFPROBE_EXE = path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WinGet', 'Links', 'ffprobe.exe');

fs.mkdirSync(DOCS_IMG_DIR, { recursive: true });
fs.mkdirSync(VIDEO_TMP_DIR, { recursive: true });

function formatTimestamp(ms) {
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

async function waitForFmReady(page, extraMs = 450) {
    await page.waitForSelector('.liveux-fm-root .liveux-fm-shell', { timeout: 15000 });
    await page.waitForTimeout(extraMs);
    await page.evaluate(async () => {
        const imgs = Array.from(document.querySelectorAll('img'));
        await Promise.all(imgs.map((img) => {
            if (img.complete) return Promise.resolve();
            return new Promise((res) => {
                img.addEventListener('load', res, { once: true });
                img.addEventListener('error', res, { once: true });
                setTimeout(res, 4000);
            });
        }));
    });
    await page.waitForTimeout(200);
}

async function showChapterBadge(page, stepLabel, title, subtitle = '') {
    await page.evaluate(({ stepLabel, title, subtitle }) => {
        let el = document.getElementById('liveux-yt-chapter-badge');
        if (!el) {
            el = document.createElement('div');
            el.id = 'liveux-yt-chapter-badge';
            el.style.cssText = [
                'position:fixed',
                'left:28px',
                'bottom:24px',
                'z-index:2147483647',
                'display:flex',
                'align-items:center',
                'gap:14px',
                'padding:12px 20px',
                'border-radius:16px',
                'background:rgba(15, 23, 42, 0.92)',
                'backdrop-filter:blur(12px)',
                '-webkit-backdrop-filter:blur(12px)',
                'border:1px solid rgba(148, 163, 184, 0.30)',
                'box-shadow:0 18px 44px rgba(2, 6, 23, 0.45)',
                'color:#f8fafc',
                'font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif',
                'pointer-events:none',
                'max-width:820px',
            ].join(';');
            document.body.appendChild(el);
        }
        el.innerHTML = '';
        const pill = document.createElement('span');
        pill.textContent = stepLabel;
        pill.style.cssText = [
            'padding:5px 12px',
            'border-radius:999px',
            'background:linear-gradient(90deg,#2563eb,#7c3aed)',
            'color:#ffffff',
            'font-size:12px',
            'font-weight:800',
            'letter-spacing:0.05em',
            'text-transform:uppercase',
            'white-space:nowrap',
        ].join(';');

        const textWrap = document.createElement('div');
        textWrap.style.cssText = 'display:flex;flex-direction:column;gap:2px;';

        const h = document.createElement('div');
        h.textContent = title;
        h.style.cssText = 'font-size:16px;font-weight:800;line-height:1.2;color:#ffffff;';

        textWrap.appendChild(h);
        if (subtitle) {
            const sub = document.createElement('div');
            sub.textContent = subtitle;
            sub.style.cssText = 'font-size:12.5px;font-weight:500;color:#cbd5e1;line-height:1.3;';
            textWrap.appendChild(sub);
        }
        el.appendChild(pill);
        el.appendChild(textWrap);
    }, { stepLabel, title, subtitle });
}

/**
 * Generates an original, 100% royalty-free, copyright-safe upbeat ambient tech
 * stereo WAV soundtrack (48 kHz, 16-bit PCM) tailored to exact video duration.
 *
 * Progression: Fmaj9 -> G6 -> Am9 -> Cmaj9 (106 BPM)
 * Layers: Warm Rhodes-like E-Piano pads, silky stereo plucked arpeggio with delay,
 *         warm sub-bass, and subtle lo-fi soft kick + hi-hat groove.
 */
function generateSoundtrackWav(outWavPath, durationSec) {
    const sampleRate = 48000;
    const totalSamples = Math.ceil(durationSec * sampleRate);
    const left = new Float32Array(totalSamples);
    const right = new Float32Array(totalSamples);

    const bpm = 106;
    const beatSec = 60 / bpm;
    const barSec = beatSec * 4;
    const sixteenthSec = beatSec / 4;

    const midiToFreq = (m) => 440 * Math.pow(2, (m - 69) / 12);

    // 4-bar chord loop: Fmaj9, G6, Am9, Cmaj9 (MIDI notes)
    const chords = [
        { bass: 41, pad: [53, 57, 60, 64, 67], arp: [60, 64, 67, 69, 72, 69, 67, 64] }, // Fmaj9
        { bass: 43, pad: [55, 59, 62, 64, 67], arp: [62, 64, 67, 71, 74, 71, 67, 64] }, // G6
        { bass: 45, pad: [57, 60, 64, 67, 71], arp: [64, 67, 71, 72, 76, 72, 71, 67] }, // Am9
        { bass: 48, pad: [55, 60, 64, 67, 71], arp: [64, 67, 71, 74, 76, 74, 71, 67] }, // Cmaj9
    ];

    // Precompute PRNG noise for soft hi-hat / snare texture
    let seed = 133742;
    const rand = () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return (seed / 0xffffffff) * 2 - 1;
    };

    // Render bar by bar
    const totalBars = Math.ceil(durationSec / barSec);
    for (let bar = 0; bar < totalBars; bar++) {
        const chord = chords[bar % chords.length];
        const barStartSample = Math.floor(bar * barSec * sampleRate);
        const barLenSamples = Math.floor(barSec * sampleRate);
        const barEndSample = Math.min(totalSamples, barStartSample + barLenSamples);

        // 1) Warm Rhodes-style E-Piano Chord Pad
        const padFreqs = chord.pad.map(midiToFreq);
        for (let i = barStartSample; i < barEndSample; i++) {
            const t = (i - barStartSample) / sampleRate;
            const barFrac = t / barSec;
            const attack = Math.min(1, t / 0.14);
            const release = Math.min(1, Math.max(0, (barSec - t) / 0.35));
            const env = attack * release * (0.72 + 0.28 * Math.exp(-t * 0.9));
            const tremL = 0.92 + 0.08 * Math.sin(2 * Math.PI * 3.2 * t);
            const tremR = 0.92 + 0.08 * Math.sin(2 * Math.PI * 3.2 * t + 1.4);

            let sumL = 0;
            let sumR = 0;
            for (let n = 0; n < padFreqs.length; n++) {
                const f = padFreqs[n];
                const ph = 2 * Math.PI * f * t;
                const tone = Math.sin(ph) + 0.18 * Math.sin(2 * ph) * Math.exp(-t * 1.4) + 0.05 * Math.sin(3 * ph) * Math.exp(-t * 3.0);
                const pan = (n / (padFreqs.length - 1)) * 0.6 + 0.2; // 0.2..0.8 stereo spread
                sumL += tone * (1 - pan);
                sumR += tone * pan;
            }
            const gain = 0.085 * env;
            left[i] += sumL * gain * tremL;
            right[i] += sumR * gain * tremR;

            // 2) Warm Sub-Bass (hits on beat 1 and beat 3.5)
            const bassFreq = midiToFreq(chord.bass);
            const beatPos = (t / beatSec) % 4;
            let bassEnv = 0;
            if (beatPos < 2.2) {
                bassEnv = Math.min(1, beatPos / 0.03) * Math.exp(-beatPos * 1.15);
            } else if (beatPos >= 2.5) {
                const bt = beatPos - 2.5;
                bassEnv = Math.min(1, bt / 0.03) * Math.exp(-bt * 1.4);
            }
            const bPh = 2 * Math.PI * bassFreq * t;
            const bassSample = (Math.sin(bPh) + 0.22 * Math.sin(2 * bPh)) * 0.14 * bassEnv;
            left[i] += bassSample;
            right[i] += bassSample;

            // Gentle energy lift after bar 1 (intro)
            if (bar >= 1) {
                // 3) Soft Lo-Fi Kick on beats 0 and 2.5 (subtle & warm)
                const kickTimes = [0, beatSec * 2, beatSec * 2.5];
                for (const kt of kickTimes) {
                    const dt = t - kt;
                    if (dt >= 0 && dt < 0.16) {
                        const kFreq = 48 + 92 * Math.exp(-dt * 34);
                        const kEnv = Math.exp(-dt * 24) * Math.min(1, dt / 0.003);
                        const kSample = Math.sin(2 * Math.PI * kFreq * dt) * 0.14 * kEnv;
                        left[i] += kSample;
                        right[i] += kSample;
                    }
                }
                // Soft brushed hi-hat on 8th notes
                const eighth = beatSec / 2;
                const ht = t % eighth;
                if (ht < 0.028) {
                    const hEnv = Math.exp(-ht * 130);
                    const accent = (Math.floor(t / eighth) % 2 === 0) ? 0.018 : 0.011;
                    const hSample = rand() * accent * hEnv;
                    left[i] += hSample * 0.85;
                    right[i] += hSample * 1.15;
                }
                // Soft rim tap on beats 1 and 3
                for (const rt of [beatSec, beatSec * 3]) {
                    const dt = t - rt;
                    if (dt >= 0 && dt < 0.045) {
                        const rEnv = Math.exp(-dt * 95);
                        const rSample = (Math.sin(2 * Math.PI * 820 * dt) * 0.4 + rand() * 0.6) * 0.035 * rEnv;
                        left[i] += rSample * 1.05;
                        right[i] += rSample * 0.95;
                    }
                }
            }

            // Prevent unused warning on barFrac
            void barFrac;
        }

        // 4) Silky Stereo Plucked Arpeggio (8th-note melody)
        if (bar >= 1) {
            const steps = 8;
            for (let s = 0; s < steps; s++) {
                // Subtle rhythmic variation: skip step 6 on odd bars for breathing room
                if (bar % 2 === 1 && s === 6) continue;
                const noteFreq = midiToFreq(chord.arp[s % chord.arp.length]);
                const noteStart = barStartSample + Math.floor(s * (beatSec / 2) * sampleRate);
                const noteDur = Math.floor(0.55 * sampleRate);
                const noteEnd = Math.min(totalSamples, noteStart + noteDur);
                const pan = s % 2 === 0 ? 0.30 : 0.70;
                for (let i = noteStart; i < noteEnd; i++) {
                    const dt = (i - noteStart) / sampleRate;
                    const env = Math.min(1, dt / 0.008) * Math.exp(-dt * 5.8);
                    const ph = 2 * Math.PI * noteFreq * dt;
                    const sig = (Math.sin(ph) + 0.25 * Math.sin(2 * ph) * Math.exp(-dt * 9)) * 0.062 * env;
                    left[i] += sig * (1 - pan);
                    right[i] += sig * pan;
                }
            }
        }
    }

    // Simple stereo ping-pong delay (3/16 note) for lush studio space
    const delaySamplesL = Math.floor(sixteenthSec * 3 * sampleRate);
    const delaySamplesR = Math.floor(sixteenthSec * 6 * sampleRate);
    for (let i = delaySamplesR; i < totalSamples; i++) {
        left[i] += right[i - delaySamplesL] * 0.22;
        right[i] += left[i - delaySamplesR] * 0.18;
    }

    // Smooth Fade-In (2.5s), Fade-Out (4.0s), and soft limiter
    const fadeInSamples = Math.floor(2.5 * sampleRate);
    const fadeOutSamples = Math.floor(4.0 * sampleRate);
    const wavBuf = Buffer.alloc(44 + totalSamples * 4);
    wavBuf.write('RIFF', 0);
    wavBuf.writeUInt32LE(36 + totalSamples * 4, 4);
    wavBuf.write('WAVE', 8);
    wavBuf.write('fmt ', 12);
    wavBuf.writeUInt32LE(16, 16);
    wavBuf.writeUInt16LE(1, 20); // PCM
    wavBuf.writeUInt16LE(2, 22); // Stereo
    wavBuf.writeUInt32LE(sampleRate, 24);
    wavBuf.writeUInt32LE(sampleRate * 4, 28);
    wavBuf.writeUInt16LE(4, 32);
    wavBuf.writeUInt16LE(16, 34);
    wavBuf.write('data', 36);
    wavBuf.writeUInt32LE(totalSamples * 4, 40);

    let offset = 44;
    for (let i = 0; i < totalSamples; i++) {
        let env = 0.82;
        if (i < fadeInSamples) {
            env *= i / fadeInSamples;
        } else if (i > totalSamples - fadeOutSamples) {
            env *= Math.max(0, (totalSamples - i) / fadeOutSamples);
        }
        const l = Math.tanh(left[i] * env * 1.15);
        const r = Math.tanh(right[i] * env * 1.15);
        wavBuf.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(l * 32767))), offset);
        wavBuf.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(r * 32767))), offset + 2);
        offset += 4;
    }

    fs.writeFileSync(outWavPath, wavBuf);
    console.log(`Synthesized stereo soundtrack WAV (${durationSec.toFixed(1)}s): ${outWavPath}`);
}

async function run() {
    const browser = await chromium.launch({ headless: true });
    const consoleErrors = [];
    const chapters = [];
    let t0 = 0;
    const markChapter = (title) => {
        chapters.push(`${formatTimestamp(Date.now() - t0)} ${title}`);
    };

    try {
        // Seed products first
        const seedCtx = await browser.newContext({ viewport: { width: 1280, height: 760 } });
        const seedPage = await seedCtx.newPage();
        await seedPage.goto(`${ASSETMAPPER_URL}/forms`, { waitUntil: 'networkidle' });
        await seedPage.waitForTimeout(400);
        await seedCtx.close();

        console.log('Starting Full HD 1920x1080 14-Chapter YouTube Showcase recording...');
        const ytCtx = await browser.newContext({
            viewport: { width: 1920, height: 1080 },
            recordVideo: { dir: VIDEO_TMP_DIR, size: { width: 1920, height: 1080 } },
        });
        const page = await ytCtx.newPage();
        page.on('pageerror', (e) => consoleErrors.push(`[yt pageerror] ${e.message}`));
        page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(`[yt console] ${m.text()}`); });

        t0 = Date.now();

        // =========================================================================
        // CHAPTER 01: DARK HERO BANNER INTRO
        // =========================================================================
        markChapter('Intro — LiveUX FileManagerBundle Overview');
        await page.goto(`${ASSETMAPPER_URL}/banner-studio?mode=dark`, { waitUntil: 'networkidle' });
        await page.evaluate(() => {
            document.documentElement.style.cssText = 'width:1920px;height:1080px;overflow:hidden;background:#060b18;display:flex;align-items:center;justify-content:center;';
            document.body.style.cssText = 'width:1280px;height:640px;transform:scale(1.5);transform-origin:center center;overflow:hidden;';
        });
        await page.waitForTimeout(4000);

        // =========================================================================
        // CHAPTER 02: CORE FILE BROWSER — TREE, NAVIGATION, SEARCH, FILTER & SORT
        // =========================================================================
        markChapter('Core File Browser — Tree, Search, Filters, Grid/List & Sorting');
        await page.goto(`${ASSETMAPPER_URL}/?theme=bootstrap5&icon_set=windows11&locale=en&scheme=light`, { waitUntil: 'networkidle' });
        await waitForFmReady(page, 600);
        await showChapterBadge(page, '01 / 13 • File Browser', 'Hybrid 0ms File Browser & Deep Folder Tree', 'Quick Access pinned folders, multi-volume sidebar, compact JSON & hybrid pagination');
        await page.waitForTimeout(2600);

        // Navigate into Products folder via sidebar tree
        const prodTreeBtn = page.locator('.liveux-fm-tree-item', { hasText: 'Products' }).first();
        if (await prodTreeBtn.count()) {
            await prodTreeBtn.click();
            await page.waitForTimeout(1800);
        }
        // Navigate into Banners folder
        const banTreeBtn = page.locator('.liveux-fm-tree-item', { hasText: 'Banners' }).first();
        if (await banTreeBtn.count()) {
            await banTreeBtn.click();
            await page.waitForTimeout(1600);
        }
        // Return to Media Library root
        const rootTreeBtn = page.locator('.liveux-fm-tree-item', { hasText: 'Media Library' }).first();
        if (await rootTreeBtn.count()) {
            await rootTreeBtn.click();
            await page.waitForTimeout(1500);
        }

        // Grid <-> List View toggle
        await showChapterBadge(page, '01 / 13 • Views & Search', 'Grid / List View, Instant 0ms Search & Type Filters', 'Client-side instant filtering for ≤500 items, auto server pagination for huge folders');
        const listBtn = page.locator('[data-view="list"]').first();
        if (await listBtn.count()) {
            await listBtn.click();
            await page.waitForTimeout(2000);
        }
        const gridBtn = page.locator('[data-view="grid"]').first();
        if (await gridBtn.count()) {
            await gridBtn.click();
            await page.waitForTimeout(1200);
        }

        // Instant Search
        const searchInput = page.locator('input[data-action*="onSearchInput"]').first();
        if (await searchInput.count()) {
            await searchInput.click();
            await searchInput.fill('thermos');
            await page.waitForTimeout(1800);
            await searchInput.fill('');
            await page.waitForTimeout(1000);
        }

        // Type Filter (Images -> All)
        const typeSelect = page.locator('select[data-action*="setTypeFilter"]').first();
        if (await typeSelect.count()) {
            await typeSelect.selectOption('image');
            await page.waitForTimeout(1500);
            await typeSelect.selectOption('all');
            await page.waitForTimeout(900);
        }

        // =========================================================================
        // CHAPTER 03: BUILT-IN DAM TOOLKIT — INSPECTOR, LIGHTBOX, FOLDER COLORS, SETTINGS, SHORTCUTS & TRASH
        // =========================================================================
        markChapter('DAM Toolkit — Inspector, Lightbox, Folder Colors, Settings & Trash');
        await showChapterBadge(page, '02 / 13 • DAM Toolkit', 'File Inspector, Lightbox Preview & Folder Customization', 'SEO metadata, tags, focal point, folder colors/badges, keyboard shortcuts & Trash');

        // Select nordic-thermos.webp to open Inspector
        const thermosCard = page.locator('.liveux-fm-card', { hasText: 'nordic-thermos.webp' }).first();
        if (await thermosCard.count()) {
            await thermosCard.click();
            await page.waitForTimeout(2000);
            // Press Space to open high-res Lightbox!
            await page.keyboard.press('Space');
            await page.waitForTimeout(2200);
            await page.keyboard.press('Escape');
            await page.waitForTimeout(800);
        }

        // Folder Color & Badge Customizer ('I')
        const firstFolderTile = page.locator('.liveux-fm-folder-tile').first();
        if (await firstFolderTile.count()) {
            await firstFolderTile.click();
            await page.waitForTimeout(450);
            await page.keyboard.press('i');
            await page.waitForTimeout(2200);
            await page.keyboard.press('Escape');
            await page.waitForTimeout(700);
        }

        // Settings Menu (Folder Style Card <-> Tile + Size Slider)
        const settingsBtn = page.locator('button[data-action*="toggleSettingsMenu"]').first();
        if (await settingsBtn.count()) {
            await settingsBtn.click();
            await page.waitForTimeout(1600);
            const cardStyleBtn = page.locator('[data-folder-style="card"]').first();
            if (await cardStyleBtn.count()) {
                await cardStyleBtn.click();
                await page.waitForTimeout(1700);
            }
            const tileStyleBtn = page.locator('[data-folder-style="tile"]').first();
            if (await tileStyleBtn.count()) {
                await tileStyleBtn.click();
                await page.waitForTimeout(1000);
            }
            await page.keyboard.press('Escape');
            await page.waitForTimeout(600);
        }

        // Keyboard Shortcuts Modal ('?')
        await page.keyboard.press('Shift+?');
        await page.waitForTimeout(2000);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(600);

        // Trash / Recycle Bin (visible sidebar button)
        const trashBtn = page.locator('.liveux-fm-sidebar button[data-action*="toggleTrash"]').first();
        if (await trashBtn.count() && await trashBtn.isVisible()) {
            await trashBtn.click();
            await page.waitForTimeout(1700);
            await trashBtn.click();
            await page.waitForTimeout(800);
        }

        // =========================================================================
        // CHAPTER 04: ALL 9 ZERO-DEPENDENCY THEMES + LIGHT & DARK MODE
        // =========================================================================
        markChapter('All 9 Zero-Dependency Themes + Light & Dark Mode');
        const themeTour = [
            { theme: 'bootstrap5', scheme: 'light', title: 'Bootstrap 5 (Light)', note: 'Zero-dependency scoped CSS — crisp enterprise light theme' },
            { theme: 'tailwind', scheme: 'light', title: 'Tailwind CSS (Light)', note: 'Modern utility aesthetic without requiring Tailwind build' },
            { theme: 'shadcn', scheme: 'dark', title: 'shadcn/ui (Dark Mode)', note: 'High-contrast zinc/slate dark surfaces & sharp borders' },
            { theme: 'flowbite', scheme: 'dark', title: 'Flowbite 4 (Dark Mode)', note: 'Native Flowbite 4 color tokens & blue-indigo accents' },
            { theme: 'daisyui', scheme: 'light', title: 'DaisyUI 5 (Variable Bridge)', note: 'Inherits live DaisyUI CSS custom properties automatically' },
            { theme: 'tabler', scheme: 'light', title: 'Tabler Admin (Light)', note: 'Designed for Symfony / Tabler admin dashboards' },
            { theme: 'preline', scheme: 'light', title: 'Preline UI (Light)', note: 'Clean SaaS typography & soft rounded controls' },
            { theme: 'material', scheme: 'light', title: 'Material Design 3 (Light)', note: 'Tonal elevation surfaces & pill geometry' },
            { theme: 'unstyled', scheme: 'dark', title: 'Unstyled Base (Dark Mode)', note: '100% customizable blank canvas via --liveux-fm-* CSS variables' },
        ];
        for (const t of themeTour) {
            await page.goto(`${ASSETMAPPER_URL}/?theme=${t.theme}&icon_set=windows11&locale=en&scheme=${t.scheme}`, { waitUntil: 'networkidle' });
            await waitForFmReady(page, 300);
            await showChapterBadge(page, '03 / 13 • 9 Themes', `Theme: ${t.title}`, t.note);
            await page.waitForTimeout(1800);
        }

        // =========================================================================
        // CHAPTER 05: ALL 6 UNIFIED MIT SVG ICON SETS
        // =========================================================================
        markChapter('All 6 Built-in MIT SVG Icon Sets');
        const iconTour = [
            { set: 'windows11', label: 'Windows 11 Fluent' },
            { set: 'macos', label: 'macOS Big Sur / Sequoia' },
            { set: 'classic', label: 'Classic Crisp' },
            { set: 'linux', label: 'Linux Breeze / Papirus' },
            { set: 'minimal', label: 'Minimal Line' },
            { set: 'vscode', label: 'VS Code Material Icons' },
        ];
        for (const ic of iconTour) {
            await page.goto(`${ASSETMAPPER_URL}/?theme=bootstrap5&icon_set=${ic.set}&locale=en&scheme=light`, { waitUntil: 'networkidle' });
            await waitForFmReady(page, 280);
            await showChapterBadge(page, '04 / 13 • 6 Icon Sets', `SVG Icon Set: ${ic.label}`, '3-tier unified SVG system: 6 file sets + 49 overridable UI icons + 14 folder badges');
            await page.waitForTimeout(1600);
        }

        // =========================================================================
        // CHAPTER 06: 12 BUILT-IN LANGUAGES + NATIVE ARABIC RTL
        // =========================================================================
        markChapter('12 Built-in Languages + Native Arabic RTL');
        const langTour = [
            { code: 'en', label: 'English (LTR)', note: '493 keys + 100% placeholder parity across all 12 built-in languages' },
            { code: 'tr', label: 'Türkçe (LTR)', note: 'Native Turkish UI with Turkish İ/I/ı search folding' },
            { code: 'fr', label: 'Français (LTR)', note: 'Native French localization across every button, modal & tooltip' },
            { code: 'de', label: 'Deutsch (LTR)', note: 'Native German UI with localized decimal formatting (132,6 KB)' },
            { code: 'es', label: 'Español (LTR)', note: 'Neutral international developer Spanish' },
            { code: 'ar', label: 'العربية — Native RTL (dir="rtl")', note: 'Automatic logical CSS mirroring, BiDi-safe file sizes & RTL keyboard navigation' },
            { code: 'ja', label: '日本語 — Japanese (CJK)', note: 'IME-safe CJK search & native Japanese file manager UI' },
            { code: 'zh_CN', label: '简体中文 — Simplified Chinese (CJK)', note: 'Full Simplified Chinese localization & 1-char CJK recursive search' },
        ];
        for (const lang of langTour) {
            await page.goto(`${ASSETMAPPER_URL}/?theme=bootstrap5&icon_set=windows11&locale=${lang.code}&scheme=light`, { waitUntil: 'networkidle' });
            await waitForFmReady(page, 300);
            await showChapterBadge(page, '05 / 13 • 12 Languages', `Locale: ${lang.label}`, lang.note);
            await page.waitForTimeout(1900);
        }

        // =========================================================================
        // CHAPTER 07: SYMFONY FORMTYPE (ALL 5 VARIANTS + MULTI-GALLERY)
        // =========================================================================
        markChapter('Symfony FormType (5 Variants & Multi-File Gallery)');
        await page.goto(`${ASSETMAPPER_URL}/forms?theme=bootstrap5&icon_set=windows11&locale=en&scheme=light`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(900);
        await showChapterBadge(page, '06 / 13 • FormType', 'Symfony FileManagerPickerType & Doctrine', '5 variants (compact, card, dropzone, avatar, input) + drag/keyboard-reorderable gallery');
        await page.waitForTimeout(2300);

        const moveRightBtn = page.locator('.liveux-fm-picker-move-btn').nth(1);
        if (await moveRightBtn.count()) {
            await moveRightBtn.click();
            await page.waitForTimeout(1000);
        }
        const firstSelectBtn = page.locator('.liveux-fm-picker button[data-action*="open"]').first();
        if (await firstSelectBtn.count()) {
            await firstSelectBtn.click();
            await page.waitForSelector('dialog.liveux-fm-dialog[open] .liveux-fm-shell', { timeout: 10000 });
            await page.waitForTimeout(1400);
            const pickCard = page.locator('dialog.liveux-fm-dialog[open] .liveux-fm-card', { hasText: 'leather-notebook.webp' }).first();
            if (await pickCard.count()) {
                await pickCard.dblclick();
                await page.waitForTimeout(1400);
            } else {
                await page.keyboard.press('Escape');
            }
        }

        // =========================================================================
        // CHAPTER 08: COLLECTIONTYPE & LIVECOLLECTIONTYPE
        // =========================================================================
        markChapter('Dynamic CollectionType & Symfony UX LiveCollectionType');
        await page.goto(`${ASSETMAPPER_URL}/collections?theme=bootstrap5&icon_set=windows11&locale=en&scheme=light`, { waitUntil: 'networkidle' });
        await page.waitForSelector('button:has-text("+ Add Live Slide")', { timeout: 15000 });
        await showChapterBadge(page, '07 / 13 • Collections', 'CollectionType & Symfony UX LiveCollectionType', 'Seamless Idiomorph AJAX re-renders — pickers stay synced automatically');
        await page.waitForTimeout(1600);

        await page.locator('button', { hasText: '+ Add Live Slide' }).click();
        await page.waitForSelector('strong:has-text("Slide #3")', { timeout: 10000 });
        await page.waitForTimeout(1200);

        const livePickBtns = page.locator('.liveux-fm-picker button[data-action*="open"]');
        const liveBtnCount = await livePickBtns.count();
        if (liveBtnCount > 0) {
            await livePickBtns.nth(liveBtnCount - 1).click();
            await page.waitForSelector('dialog.liveux-fm-dialog[open] .liveux-fm-shell', { timeout: 10000 });
            await page.waitForTimeout(1300);
            await page.locator('dialog.liveux-fm-dialog[open] .liveux-fm-card', { hasText: 'ceramic-mug.webp' }).first().dblclick();
            await page.waitForTimeout(1500);
        }

        // =========================================================================
        // CHAPTER 09: WYSIWYG EDITORS PART 1 (TINYMCE 7, CKEDITOR 5, TIPTAP 2)
        // =========================================================================
        markChapter('WYSIWYG Editors (TinyMCE 5/6/7/8, CKEditor 5, Tiptap 2)');

        // TinyMCE 7
        await page.goto(`${ASSETMAPPER_URL}/editors?editor=tinymce&theme=bootstrap5&icon_set=windows11&locale=en`, { waitUntil: 'networkidle' });
        await page.waitForSelector('.tox-tinymce', { timeout: 15000 });
        await showChapterBadge(page, '08 / 13 • Editors (1/9)', 'TinyMCE 5 / 6 / 7 / 8 Integration', 'Native Top-Layer <dialog> opens cleanly above TinyMCE modals — zero z-index conflicts');
        await page.waitForTimeout(1300);
        await page.locator('button', { hasText: 'Insert Image via TinyMCE Picker' }).click();
        await page.waitForSelector('.tox-dialog .tox-browse-url', { timeout: 10000 });
        await page.waitForTimeout(900);
        await page.locator('.tox-dialog .tox-browse-url').first().click();
        await page.waitForSelector('dialog.liveux-fm-dialog[open] .liveux-fm-shell', { timeout: 10000 });
        await page.waitForTimeout(1300);
        await page.locator('dialog.liveux-fm-dialog[open] .liveux-fm-card', { hasText: 'summer-campaign.webp' }).first().dblclick();
        await page.waitForTimeout(900);
        await page.locator('.tox-dialog button', { hasText: 'Save' }).first().click();
        await page.waitForTimeout(1700);

        // CKEditor 5
        await page.goto(`${ASSETMAPPER_URL}/editors?editor=ckeditor5&theme=bootstrap5&icon_set=windows11&locale=en`, { waitUntil: 'networkidle' });
        await page.waitForSelector('.ck-editor__editable', { timeout: 15000 });
        await showChapterBadge(page, '08 / 13 • Editors (2/9)', 'CKEditor 5 Classic Integration', 'Multi-select image insertion & automatic safe download links for documents');
        await page.waitForTimeout(1200);
        await page.locator('button', { hasText: 'Insert Media from LiveUX (OffCanvas)' }).click();
        await page.waitForSelector('dialog.liveux-fm-dialog[open] .liveux-fm-shell', { timeout: 10000 });
        await page.waitForTimeout(1200);
        await page.locator('dialog.liveux-fm-dialog[open] .liveux-fm-card', { hasText: 'nordic-thermos.webp' }).first().click();
        await page.waitForTimeout(600);
        await page.locator('dialog.liveux-fm-dialog[open] [data-action*="confirmSelection"]').first().click();
        await page.waitForTimeout(1600);

        // Tiptap 2
        await page.goto(`${ASSETMAPPER_URL}/editors?editor=tiptap&theme=bootstrap5&icon_set=windows11&locale=en`, { waitUntil: 'networkidle' });
        await page.waitForSelector('.ProseMirror', { timeout: 20000 });
        await showChapterBadge(page, '08 / 13 • Editors (3/9)', 'Tiptap 2 (ProseMirror) Integration', 'Preserves SEO alt/title metadata & inserts sanitized links for PDFs/ZIPs');
        await page.waitForTimeout(1200);
        await page.locator('button[data-action="editors-demo#insertIntoTiptap"]').first().click();
        await page.waitForSelector('dialog.liveux-fm-dialog[open] .liveux-fm-shell', { timeout: 10000 });
        await page.waitForTimeout(1200);
        await page.locator('dialog.liveux-fm-dialog[open] .liveux-fm-card', { hasText: 'chronograph-watch.webp' }).first().click();
        await page.waitForTimeout(600);
        await page.locator('dialog.liveux-fm-dialog[open] [data-action*="confirmSelection"]').first().click();
        await page.waitForTimeout(1600);

        // =========================================================================
        // CHAPTER 10: WYSIWYG & BLOCK EDITORS PART 2 (QUILL 2, TRIX, SUMMERNOTE, EDITOR.JS)
        // =========================================================================
        markChapter('WYSIWYG & Block Editors (Quill 2, Trix, Summernote, Editor.js)');

        // Quill 2
        await page.goto(`${ASSETMAPPER_URL}/editors?editor=quill&theme=bootstrap5&icon_set=windows11&locale=en`, { waitUntil: 'networkidle' });
        await page.waitForSelector('.ql-toolbar button.ql-image', { timeout: 15000 });
        await showChapterBadge(page, '09 / 13 • Editors (4/9)', 'Quill 2 Integration', 'Hooks directly into Quill snow toolbar image button via createQuillImageHandler()');
        await page.waitForTimeout(1100);
        await page.locator('.ql-toolbar button.ql-image').first().click();
        await page.waitForSelector('dialog.liveux-fm-dialog[open] .liveux-fm-shell', { timeout: 10000 });
        await page.waitForTimeout(1100);
        await page.locator('dialog.liveux-fm-dialog[open] .liveux-fm-card', { hasText: 'botanical-studio.webp' }).first().dblclick();
        await page.waitForTimeout(1500);

        // Trix
        await page.goto(`${ASSETMAPPER_URL}/editors?editor=trix&theme=bootstrap5&icon_set=windows11&locale=en`, { waitUntil: 'networkidle' });
        await page.waitForSelector('trix-editor', { timeout: 15000 });
        await showChapterBadge(page, '09 / 13 • Editors (5/9)', 'Trix Editor (EasyAdmin TextEditorField)', 'Inserts rich Trix image attachments & safe document links into <trix-editor>');
        await page.waitForTimeout(1100);
        await page.locator('button', { hasText: 'Insert Media into Trix' }).click();
        await page.waitForSelector('dialog.liveux-fm-dialog[open] .liveux-fm-shell', { timeout: 10000 });
        await page.waitForTimeout(1100);
        await page.locator('dialog.liveux-fm-dialog[open] .liveux-fm-card', { hasText: 'ceramic-mug.webp' }).first().click();
        await page.waitForTimeout(600);
        await page.locator('dialog.liveux-fm-dialog[open] [data-action*="confirmSelection"]').first().click();
        await page.waitForTimeout(1500);

        // Summernote
        await page.goto(`${ASSETMAPPER_URL}/editors?editor=summernote&theme=bootstrap5&icon_set=windows11&locale=en`, { waitUntil: 'networkidle' });
        await page.waitForSelector('.note-editor .note-editable', { timeout: 15000 });
        await showChapterBadge(page, '09 / 13 • Editors (6/9)', 'Summernote Integration', 'Classic Bootstrap admin panel editor with strict DOM XSS protection');
        await page.waitForTimeout(1100);
        await page.locator('button', { hasText: 'Insert Media into Summernote' }).click();
        await page.waitForSelector('dialog.liveux-fm-dialog[open] .liveux-fm-shell', { timeout: 10000 });
        await page.waitForTimeout(1100);
        await page.locator('dialog.liveux-fm-dialog[open] .liveux-fm-card', { hasText: 'wireless-charger.webp' }).first().click();
        await page.waitForTimeout(600);
        await page.locator('dialog.liveux-fm-dialog[open] [data-action*="confirmSelection"]').first().click();
        await page.waitForTimeout(1500);

        // Editor.js
        await page.goto(`${ASSETMAPPER_URL}/editors?editor=editorjs&theme=bootstrap5&icon_set=windows11&locale=en`, { waitUntil: 'networkidle' });
        await page.waitForSelector('.codex-editor', { timeout: 15000 });
        await showChapterBadge(page, '09 / 13 • Editors (7/9)', 'Editor.js (Block JSON Editor)', 'Inserts structured image/simpleImage blocks with captions into JSON content');
        await page.waitForTimeout(1100);
        await page.locator('button', { hasText: 'Insert Image Block (LiveUX)' }).click();
        await page.waitForSelector('dialog.liveux-fm-dialog[open] .liveux-fm-shell', { timeout: 10000 });
        await page.waitForTimeout(1100);
        await page.locator('dialog.liveux-fm-dialog[open] .liveux-fm-card', { hasText: 'enterprise-cloud.webp' }).first().click();
        await page.waitForTimeout(600);
        await page.locator('dialog.liveux-fm-dialog[open] [data-action*="confirmSelection"]').first().click();
        await page.waitForTimeout(1500);

        // =========================================================================
        // CHAPTER 11: GRAPESJS VISUAL PAGE BUILDER & META LEXICAL
        // =========================================================================
        markChapter('GrapesJS Page Builder & Meta Lexical Integration');

        // GrapesJS
        await page.goto(`${ASSETMAPPER_URL}/editors?editor=grapesjs&theme=bootstrap5&icon_set=windows11&locale=en`, { waitUntil: 'networkidle' });
        await page.waitForSelector('.gjs-editor', { timeout: 20000 });
        await showChapterBadge(page, '10 / 13 • Editors (8/9)', 'GrapesJS Visual Page & Email Builder', 'Replaces built-in Asset Manager or drops responsive image components onto the canvas');
        await page.waitForTimeout(1200);
        await page.locator('button', { hasText: 'Insert Media into GrapesJS' }).click();
        await page.waitForSelector('dialog.liveux-fm-dialog[open] .liveux-fm-shell', { timeout: 10000 });
        await page.waitForTimeout(1200);
        await page.locator('dialog.liveux-fm-dialog[open] .liveux-fm-card', { hasText: 'summer-campaign.webp' }).first().click();
        await page.waitForTimeout(600);
        await page.locator('dialog.liveux-fm-dialog[open] [data-action*="confirmSelection"]').first().click();
        await page.waitForTimeout(1800);

        // Meta Lexical
        await page.goto(`${ASSETMAPPER_URL}/editors?editor=lexical&theme=bootstrap5&icon_set=windows11&locale=en`, { waitUntil: 'networkidle' });
        await page.waitForSelector('#lexical-host p', { timeout: 20000 });
        await showChapterBadge(page, '10 / 13 • Editors (9/9)', 'Meta Lexical Rich-Text Engine', 'Dispatches INSERT_IMAGE_COMMAND with strict XSS URL guard & SEO altText');
        await page.waitForTimeout(1200);
        await page.locator('button', { hasText: 'Insert Image into Lexical' }).click();
        await page.waitForSelector('dialog.liveux-fm-dialog[open] .liveux-fm-shell', { timeout: 10000 });
        await page.waitForTimeout(1200);
        await page.locator('dialog.liveux-fm-dialog[open] .liveux-fm-card', { hasText: 'botanical-studio.webp' }).first().click();
        await page.waitForTimeout(600);
        await page.locator('dialog.liveux-fm-dialog[open] [data-action*="confirmSelection"]').first().click();
        await page.waitForTimeout(1800);

        // =========================================================================
        // CHAPTER 12: EASYADMIN 5 CRUD (FileManagerField)
        // =========================================================================
        markChapter('EasyAdmin 4/5 CRUD (FileManagerField)');
        await page.goto(`${ASSETMAPPER_URL}/admin`, { waitUntil: 'networkidle' });
        await page.waitForSelector('table.datagrid tbody tr', { timeout: 15000 });
        await showChapterBadge(page, '11 / 13 • EasyAdmin 5', 'EasyAdmin 4/5 Native FileManagerField', 'Zero hard dependency — single & gallery pickers straight inside EasyAdmin CRUD');
        await page.waitForTimeout(1800);

        const editLink = page.locator('a.action-edit').first();
        if (await editLink.isVisible()) {
            await editLink.click();
        } else {
            await page.locator('.actions .dropdown-toggle').first().click();
            await page.waitForTimeout(450);
            await page.locator('a.action-edit').first().click();
        }
        await page.waitForSelector('.liveux-fm-picker', { timeout: 15000 });
        await showChapterBadge(page, '11 / 13 • EasyAdmin 5', 'EasyAdmin Edit Form + Live OffCanvas Picker', '16 fluent methods: setProfile(), setVariant(), setMultiple(), setMaxFiles() & more');
        await page.waitForTimeout(1600);

        await page.locator('.liveux-fm-picker button[data-action*="open"]').first().click();
        await page.waitForSelector('dialog.liveux-fm-dialog[open] .liveux-fm-shell', { timeout: 10000 });
        await page.waitForTimeout(1300);
        await page.locator('dialog.liveux-fm-dialog[open] .liveux-fm-card', { hasText: 'leather-notebook.webp' }).first().dblclick();
        await page.waitForTimeout(1600);

        // =========================================================================
        // CHAPTER 13: NATIVE <dialog> MODAL, OFFCANVAS & RESPONSIVE MOBILE (390x844)
        // =========================================================================
        markChapter('Native <dialog> Modal, 4-Direction OffCanvas & Mobile Experience');
        await page.goto(`${ASSETMAPPER_URL}/modals?theme=bootstrap5&icon_set=windows11&locale=en&scheme=light`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(800);
        await showChapterBadge(page, '12 / 13 • Modal & OffCanvas', 'Native HTML5 <dialog> Top Layer & JS Promise API', 'window.LiveUXFileManager.open() — Modal & 4-direction OffCanvas (start|end|top|bottom)');
        await page.waitForTimeout(1500);

        // Centered Modal + live selection output
        await page.locator('button', { hasText: 'Centered Modal (Multi-Select)' }).click();
        await page.waitForSelector('dialog.liveux-fm-dialog[open] .liveux-fm-shell', { timeout: 10000 });
        await page.waitForTimeout(1400);
        await page.locator('dialog.liveux-fm-dialog[open] .liveux-fm-card', { hasText: 'chronograph-watch.webp' }).first().click();
        await page.waitForTimeout(600);
        await page.locator('dialog.liveux-fm-dialog[open] [data-action*="confirmSelection"]').first().click();
        await page.waitForTimeout(1600);

        // OffCanvas Right
        await page.locator('button', { hasText: 'OffCanvas Right (End)' }).click();
        await page.waitForSelector('dialog.liveux-fm-dialog[open] .liveux-fm-shell', { timeout: 10000 });
        await page.waitForTimeout(1700);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(600);

        // Mobile Studio (390x844 Live Phone Frame)
        await page.goto(`${ASSETMAPPER_URL}/mobile-studio?theme=bootstrap5&icon_set=windows11&locale=en&scheme=light`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1100);
        await showChapterBadge(page, '13 / 13 • Mobile-First', 'Responsive Mobile Fullscreen & Native Bottom Sheet', 'Adaptive 100dvh modal, slide-in touch folder drawer & rounded bottom sheet');

        const phoneFrame = page.frameLocator('#mobile-demo-frame');
        await phoneFrame.locator('button', { hasText: 'Centered Modal (Multi-Select)' }).click();
        await phoneFrame.locator('dialog.liveux-fm-dialog[open] .liveux-fm-shell').waitFor({ timeout: 10000 });
        await page.waitForTimeout(1600);

        const mobileMenuBtn = phoneFrame.locator('dialog.liveux-fm-dialog[open] [data-action*="toggleSidebar"]').first();
        if (await mobileMenuBtn.count()) {
            await mobileMenuBtn.click();
            await page.waitForTimeout(1600);
            await mobileMenuBtn.click();
            await page.waitForTimeout(800);
        }
        const mobileCloseBtn = phoneFrame.locator('dialog.liveux-fm-dialog[open] [data-action*="closeDialog"]').first();
        if (await mobileCloseBtn.count()) {
            await mobileCloseBtn.click();
        }
        await page.waitForTimeout(800);

        await phoneFrame.locator('button', { hasText: 'Mobile Bottom Sheet Mode' }).click();
        await phoneFrame.locator('dialog.liveux-fm-dialog[open] .liveux-fm-shell').waitFor({ timeout: 10000 });
        await page.waitForTimeout(2400);

        // =========================================================================
        // CHAPTER 14: OUTRO — LIGHT HERO BANNER SPLASH
        // =========================================================================
        markChapter('Outro — Install with Composer');
        await page.goto(`${ASSETMAPPER_URL}/banner-studio?mode=light`, { waitUntil: 'networkidle' });
        await page.evaluate(() => {
            document.documentElement.style.cssText = 'width:1920px;height:1080px;overflow:hidden;background:#eef4ff;display:flex;align-items:center;justify-content:center;';
            document.body.style.cssText = 'width:1280px;height:640px;transform:scale(1.5);transform-origin:center center;overflow:hidden;';
        });
        await page.waitForTimeout(4500);

        const ytRawVideo = await page.video().path();
        await ytCtx.close();

        // Measure exact video duration via ffprobe
        const probeOut = execFileSync(FFPROBE_EXE, [
            '-v', 'error',
            '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1',
            ytRawVideo,
        ], { encoding: 'utf8' }).trim();
        const videoDurationSec = Math.max(10, parseFloat(probeOut) || 180);
        console.log(`Recorded raw Full HD video duration: ${videoDurationSec.toFixed(2)}s`);

        // Synthesize copyright-free stereo soundtrack matching exact duration
        const wavPath = path.join(VIDEO_TMP_DIR, 'soundtrack.wav');
        generateSoundtrackWav(wavPath, videoDurationSec);

        // Mux 1080p H.264 High Profile + AAC 192k stereo audio into YouTube-ready MP4
        const ytMp4Out = path.join(DOCS_IMG_DIR, 'demo-youtube-showcase.mp4');
        execFileSync(FFMPEG_EXE, [
            '-y',
            '-i', ytRawVideo,
            '-i', wavPath,
            '-map', '0:v:0',
            '-map', '1:a:0',
            '-c:v', 'libx264',
            '-profile:v', 'high',
            '-pix_fmt', 'yuv420p',
            '-crf', '19',
            '-preset', 'medium',
            '-r', '30',
            '-c:a', 'aac',
            '-b:a', '192k',
            '-ar', '48000',
            '-shortest',
            '-movflags', '+faststart',
            ytMp4Out,
        ], { stdio: 'inherit' });

        const finalMb = (fs.statSync(ytMp4Out).size / (1024 * 1024)).toFixed(2);
        console.log(`\nSUCCESS! Generated Full HD 1080p YouTube Showcase with Stereo Soundtrack:`);
        console.log(`  File:     ${ytMp4Out}`);
        console.log(`  Size:     ${finalMb} MB`);
        console.log(`  Duration: ${formatTimestamp(videoDurationSec * 1000)} (${videoDurationSec.toFixed(1)}s)`);
        console.log('\nYouTube Chapter Timestamps:');
        for (const ch of chapters) {
            console.log(`  ${ch}`);
        }
    } finally {
        await browser.close();
    }

    if (consoleErrors.length > 0) {
        console.warn('Non-fatal console messages:', consoleErrors);
    }
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
