import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const globalNodeModules = path.join(process.env.APPDATA || '', 'npm', 'node_modules');
const { chromium } = require(path.join(globalNodeModules, 'playwright'));

const ASSETMAPPER_URL = 'http://127.0.0.1:8091';
const DOCS_IMG_DIR = 'c:/wamp64/www/symfony/promosyon8/bundles/liveux-file-manager-bundle/docs/images';
const DEMO_IMG_DIR = 'c:/wamp64/www/symfony/liveux-file-manager-demo/assetmapper/public/images';
const VIDEO_TMP_DIR = 'c:/wamp64/www/symfony/liveux-file-manager-demo/var-video';
const FFMPEG_EXE = path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WinGet', 'Links', 'ffmpeg.exe');

fs.mkdirSync(DOCS_IMG_DIR, { recursive: true });
fs.mkdirSync(VIDEO_TMP_DIR, { recursive: true });

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

/**
 * Injects a sleek, broadcast-quality chapter indicator overlay into the bottom-left corner of the video frame.
 */
async function showChapterBadge(page, stepLabel, title, subtitle = '') {
    await page.evaluate(({ stepLabel, title, subtitle }) => {
        let el = document.getElementById('liveux-yt-chapter-badge');
        if (!el) {
            el = document.createElement('div');
            el.id = 'liveux-yt-chapter-badge';
            el.style.cssText = [
                'position:fixed',
                'left:28px',
                'bottom:26px',
                'z-index:2147483647',
                'display:flex',
                'align-items:center',
                'gap:14px',
                'padding:12px 20px',
                'border-radius:16px',
                'background:rgba(15, 23, 42, 0.90)',
                'backdrop-filter:blur(12px)',
                '-webkit-backdrop-filter:blur(12px)',
                'border:1px solid rgba(148, 163, 184, 0.30)',
                'box-shadow:0 18px 44px rgba(2, 6, 23, 0.45)',
                'color:#f8fafc',
                'font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif',
                'pointer-events:none',
                'max-width:720px',
            ].join(';');
            document.body.appendChild(el);
        }
        el.innerHTML = '';
        const pill = document.createElement('span');
        pill.textContent = stepLabel;
        pill.style.cssText = [
            'padding:5px 11px',
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

async function run() {
    const browser = await chromium.launch({ headless: true });
    const consoleErrors = [];

    try {
        // =========================================================================
        // 1) RAZOR-SHARP @2x BANNER PREVIEWS + LIGHT & DARK GITHUB HERO BANNERS
        // =========================================================================
        const bannerPreviewCtx = await browser.newContext({
            viewport: { width: 1180, height: 740 },
            deviceScaleFactor: 2,
        });
        const bpPage = await bannerPreviewCtx.newPage();
        bpPage.on('pageerror', (e) => consoleErrors.push(`[banner pageerror] ${e.message}`));
        bpPage.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(`[banner console] ${m.text()}`); });

        await bpPage.goto(`${ASSETMAPPER_URL}/?theme=bootstrap5&icon_set=windows11&locale=en&scheme=light`, { waitUntil: 'networkidle' });
        await waitForFmReady(bpPage);
        await bpPage.locator('.liveux-fm-root').first().screenshot({
            path: path.join(DEMO_IMG_DIR, 'banner-preview-light.png'),
        });

        await bpPage.goto(`${ASSETMAPPER_URL}/?theme=shadcn&icon_set=windows11&locale=en&scheme=dark`, { waitUntil: 'networkidle' });
        await waitForFmReady(bpPage);
        await bpPage.locator('.liveux-fm-root').first().screenshot({
            path: path.join(DEMO_IMG_DIR, 'banner-preview-dark.png'),
        });
        await bannerPreviewCtx.close();

        const bannerCtx = await browser.newContext({
            viewport: { width: 1280, height: 640 },
            deviceScaleFactor: 2,
        });
        const bPage = await bannerCtx.newPage();
        await bPage.goto(`${ASSETMAPPER_URL}/banner-studio?mode=light`, { waitUntil: 'networkidle' });
        await bPage.waitForTimeout(450);
        await bPage.screenshot({ path: path.join(DOCS_IMG_DIR, 'banner-light.png') });
        console.log('Captured ultra-sharp banner-light.png (2560x1280 @2x)');

        await bPage.goto(`${ASSETMAPPER_URL}/banner-studio?mode=dark`, { waitUntil: 'networkidle' });
        await bPage.waitForTimeout(450);
        await bPage.screenshot({ path: path.join(DOCS_IMG_DIR, 'banner-dark.png') });
        console.log('Captured ultra-sharp banner-dark.png (2560x1280 @2x)');
        await bannerCtx.close();

        // =========================================================================
        // 2) FULL HD 1080p COMPREHENSIVE YOUTUBE SHOWCASE VIDEO (10 CHAPTERS, NO ABOUT)
        // =========================================================================
        console.log('Starting Full HD 1920x1080 YouTube showcase recording...');
        const ytCtx = await browser.newContext({
            viewport: { width: 1920, height: 1080 },
            recordVideo: { dir: VIDEO_TMP_DIR, size: { width: 1920, height: 1080 } },
        });
        const page = await ytCtx.newPage();
        page.on('pageerror', (e) => consoleErrors.push(`[yt pageerror] ${e.message}`));
        page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(`[yt console] ${m.text()}`); });

        // --- INTRO: Full-Screen Banner Splash (Light -> Dark) ---
        await page.goto(`${ASSETMAPPER_URL}/banner-studio?mode=dark`, { waitUntil: 'networkidle' });
        // Scale 1280x640 banner cleanly to fill 1920x1080 (exact 1.5x zoom with zero clipping)
        await page.evaluate(() => {
            document.documentElement.style.cssText = 'width:1920px;height:1080px;overflow:hidden;background:#060b18;display:flex;align-items:center;justify-content:center;';
            document.body.style.cssText = 'width:1280px;height:640px;transform:scale(1.5);transform-origin:center center;overflow:hidden;';
        });
        await page.waitForTimeout(3200);

        // --- CHAPTER 01: Core Browser, Navigation, Grid/List, Search & Filter ---
        await page.goto(`${ASSETMAPPER_URL}/?theme=bootstrap5&icon_set=windows11&locale=en&scheme=light`, { waitUntil: 'networkidle' });
        await waitForFmReady(page);
        await showChapterBadge(page, '01 / 10', 'Core File Browser & 0ms Hybrid Speed', 'Instant navigation, full folder tree, Grid/List view, search & live Inspector');
        await page.waitForTimeout(2400);

        // Select an image to open right Inspector
        await page.locator('.liveux-fm-card', { hasText: 'nordic-thermos.webp' }).first().click();
        await page.waitForTimeout(1600);

        // Enter Products folder by double-clicking
        await page.locator('.liveux-fm-folder-tile', { hasText: 'Products' }).first().dblclick();
        await page.waitForTimeout(1600);

        // Go back to root via Up button
        await page.locator('[data-action*="goUp"]').first().click();
        await page.waitForTimeout(1300);

        // Switch to List View & sort by Size
        await page.locator('[data-action*="setViewMode"][data-view="list"]').first().click();
        await page.waitForTimeout(1500);
        await page.locator('[data-action*="setSortBy"]').first().selectOption('size');
        await page.waitForTimeout(1300);
        await page.locator('[data-action*="setSortBy"]').first().selectOption('name');
        await page.locator('[data-action*="setViewMode"][data-view="grid"]').first().click();
        await page.waitForTimeout(1100);

        // Filter by Images + Search live
        await page.locator('[data-action*="setTypeFilter"]').first().selectOption('image');
        await page.waitForTimeout(1200);
        await page.locator('[data-action*="setTypeFilter"]').first().selectOption('all');
        const searchBox = page.locator('[data-action*="onSearchInput"]').first();
        await searchBox.fill('summer');
        await page.waitForTimeout(1400);
        await searchBox.fill('');
        await page.waitForTimeout(900);

        // --- CHAPTER 02: ALL 9 ZERO-DEPENDENCY BUILT-IN THEMES ---
        const themeTour = [
            { id: 'bootstrap5', scheme: 'light', label: 'Bootstrap 5 (Light)', note: 'Classic neutral borders & Bootstrap 5 design tokens' },
            { id: 'bootstrap5', scheme: 'dark', label: 'Bootstrap 5 (Dark)', note: 'WCAG 2.1 AA verified automatic & explicit dark surfaces' },
            { id: 'tailwind', scheme: 'light', label: 'Tailwind CSS v4', note: 'Indigo accents & crisp Slate surfaces — zero purge config' },
            { id: 'shadcn', scheme: 'dark', label: 'Shadcn / UI (Dark)', note: 'Monochrome Zinc precision for modern SaaS panels' },
            { id: 'flowbite', scheme: 'light', label: 'Flowbite 4', note: 'Flowbite blue & Gray-50/900 admin aesthetics' },
            { id: 'daisyui', scheme: 'light', label: 'DaisyUI 5 Variable Bridge', note: 'Inherits live --color-primary & --color-base-* host tokens' },
            { id: 'tabler', scheme: 'light', label: 'Tabler / EasyAdmin', note: 'Enterprise slate workspace with sharp 4px controls' },
            { id: 'preline', scheme: 'light', label: 'Preline UI', note: 'Clean neutral surfaces & bright modern blue accents' },
            { id: 'material', scheme: 'light', label: 'Material Design 3', note: 'Tonal violet elevation & pill-shaped controls' },
            { id: 'unstyled', scheme: 'light', label: 'Unstyled (Headless Base)', note: 'Inherits host fonts & backgrounds for 100% custom CSS' },
        ];
        for (const t of themeTour) {
            await page.goto(`${ASSETMAPPER_URL}/?theme=${t.id}&icon_set=windows11&locale=en&scheme=${t.scheme}`, { waitUntil: 'networkidle' });
            await waitForFmReady(page, 300);
            await showChapterBadge(page, '02 / 10 • Themes', `Theme: ${t.label}`, t.note);
            await page.waitForTimeout(2000);
        }

        // --- CHAPTER 03: ALL 6 BUILT-IN SVG ICON SETS ---
        const iconTour = [
            { id: 'windows11', label: 'Windows 11', note: 'Dual-tone warm folders & modern fluent file icons' },
            { id: 'macos', label: 'macOS Finder', note: 'Soft blue Finder folders & crisp monochrome UI icons' },
            { id: 'classic', label: 'Classic Vector', note: 'Clean universal vector icon pack (default fallback)' },
            { id: 'linux', label: 'Linux / Adwaita', note: 'GNOME-inspired open-source desktop icons' },
            { id: 'minimal', label: 'Minimal Outline', note: 'Ultra-clean thin stroke minimalist iconography' },
            { id: 'vscode', label: 'VS Code Developer', note: 'Sharp developer-oriented file & folder icon set' },
        ];
        for (const ic of iconTour) {
            await page.goto(`${ASSETMAPPER_URL}/?theme=bootstrap5&icon_set=${ic.id}&locale=en&scheme=light`, { waitUntil: 'networkidle' });
            await waitForFmReady(page, 300);
            await showChapterBadge(page, '03 / 10 • Icon Sets', `Icon Set: ${ic.label}`, ic.note);
            await page.waitForTimeout(1900);
        }

        // --- CHAPTER 04: SETTINGS POPOVER FEATURES (NO ABOUT!) ---
        await page.goto(`${ASSETMAPPER_URL}/?theme=bootstrap5&icon_set=windows11&locale=en&scheme=light`, { waitUntil: 'networkidle' });
        await waitForFmReady(page);
        await showChapterBadge(page, '04 / 10', 'Settings Menu, Live Card Sizing & Quota', 'Color scheme, Tile/Card folders, 96px-320px size slider, Quota & Shortcuts');

        // Open Settings popover
        await page.locator('[data-action*="toggleSettings"]').first().click();
        await page.waitForSelector('.liveux-fm-popover.is-open, .liveux-fm-popover', { timeout: 5000 });
        await page.waitForTimeout(1200);

        const pop = page.locator('.liveux-fm-popover').first();

        // Toggle Dark mode live via Settings popover
        await pop.locator('[data-action*="setColorScheme"][data-scheme="dark"]').click();
        await page.waitForTimeout(1500);
        await pop.locator('[data-action*="setColorScheme"][data-scheme="light"]').click();
        await page.waitForTimeout(1100);

        // Toggle Folder Style: Card -> Tile
        await pop.locator('[data-action*="setFolderStyle"][data-folder-style="card"]').click();
        await page.waitForTimeout(1600);
        await pop.locator('[data-action*="setFolderStyle"][data-folder-style="tile"]').click();
        await page.waitForTimeout(1100);

        // Drag Item Size Slider smoothly (116px -> 240px -> 160px)
        const slider = pop.locator('[data-action*="onItemSizeInput"]');
        for (const px of [116, 196, 240, 160]) {
            await slider.fill(String(px));
            await slider.dispatchEvent('input');
            await page.waitForTimeout(800);
        }

        // Toggle Tree Lines
        const treeLinesCb = pop.locator('[data-action*="toggleTreeLines"]');
        await treeLinesCb.click();
        await page.waitForTimeout(900);
        await treeLinesCb.click();
        await page.waitForTimeout(700);

        // Open Storage Quota Breakdown Modal (scoped to popover so it doesn't hit hidden sidebar-fallback pill!)
        await pop.locator('[data-action*="openQuotaDetailsModal"]').click();
        await page.waitForTimeout(2100);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(600);

        // Open Keyboard Shortcuts Cheat Sheet Modal (via Settings)
        await page.locator('[data-action*="toggleSettings"]').first().click();
        await page.waitForTimeout(500);
        await pop.locator('[data-action*="openShortcutsModal"]').click();
        await page.waitForTimeout(2400);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(600);

        // --- CHAPTER 05: CONTEXT MENU, FOLDER CUSTOMIZE, METADATA & SIGNED SHARE ---
        await showChapterBadge(page, '05 / 10', 'Context Menu, Folder Colors, Metadata & Share', 'Quick Action Bar, 18 colors + 14 badges, SEO Alt + Focal Point, HMAC Share');

        // Right-click a folder to display compact context menu
        const bannersFolder = page.locator('.liveux-fm-folder-tile', { hasText: 'Banners' }).first();
        await bannersFolder.click({ button: 'right' });
        await page.waitForTimeout(1800);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(400);

        // Open Folder Customize modal ('I')
        await bannersFolder.click();
        await page.waitForTimeout(350);
        await page.keyboard.press('i');
        await page.waitForSelector('.liveux-fm-modal-backdrop.is-open', { timeout: 8000 });
        await page.waitForTimeout(1200);
        // Click a couple of color swatches live to show instant preview!
        const swatches = page.locator('.liveux-fm-modal-backdrop.is-open .liveux-fm-swatch');
        const swatchCount = await swatches.count();
        if (swatchCount > 8) {
            await swatches.nth(4).click();
            await page.waitForTimeout(800);
            await swatches.nth(9).click();
            await page.waitForTimeout(900);
        }
        await page.keyboard.press('Escape');
        await page.waitForTimeout(600);

        // Open File Metadata & Focal Point modal ('I') on nordic-thermos.webp
        const thermosCard = page.locator('.liveux-fm-card', { hasText: 'nordic-thermos.webp' }).first();
        await thermosCard.click();
        await page.waitForTimeout(400);
        await page.keyboard.press('i');
        await page.waitForSelector('.liveux-fm-modal-backdrop.is-open', { timeout: 8000 });
        await page.waitForTimeout(2200);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(600);

        // Open Signed HMAC Share Link modal ('S')
        await thermosCard.click();
        await page.waitForTimeout(350);
        await page.keyboard.press('s');
        await page.waitForSelector('.liveux-fm-modal-backdrop.is-open', { timeout: 8000 });
        await page.waitForTimeout(2000);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(600);

        // --- CHAPTER 06: BUILT-IN CANVAS IMAGE EDITOR & UNIVERSAL LIGHTBOX ---
        await showChapterBadge(page, '06 / 10', 'Canvas Image Editor & Universal Lightbox', 'Crop aspect ratios (1:1 / 4:3 / 16:9), rotate, flip, WebP export & gallery zoom');

        await thermosCard.click();
        await page.waitForTimeout(350);
        await page.keyboard.press('e');
        await page.waitForSelector('.liveux-fm-modal-backdrop.is-open canvas', { timeout: 8000 });
        await page.waitForTimeout(1300);

        // Click aspect ratio 1:1 -> 16:9 -> Rotate 90
        const ratio11 = page.locator('.liveux-fm-modal-backdrop.is-open button', { hasText: '1:1' }).first();
        if (await ratio11.count()) {
            await ratio11.click();
            await page.waitForTimeout(900);
        }
        const ratio169 = page.locator('.liveux-fm-modal-backdrop.is-open button', { hasText: '16:9' }).first();
        if (await ratio169.count()) {
            await ratio169.click();
            await page.waitForTimeout(900);
        }
        const rotBtn = page.locator('.liveux-fm-modal-backdrop.is-open button[data-action*="rotateImage"]').first();
        if (await rotBtn.count()) {
            await rotBtn.click();
            await page.waitForTimeout(1000);
        }
        await page.keyboard.press('Escape');
        await page.waitForTimeout(600);

        // Open Universal Lightbox ('Space') on summer-campaign.webp and browse next photo
        const summerCard = page.locator('.liveux-fm-card', { hasText: 'summer-campaign.webp' }).first();
        await summerCard.click();
        await page.waitForTimeout(350);
        await page.keyboard.press('Space');
        await page.waitForTimeout(1800);
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(1600);
        await page.keyboard.press('ArrowLeft');
        await page.waitForTimeout(1100);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(600);

        // --- CHAPTER 07: GLOBAL MULTILINGUAL + AUTOMATIC RTL ---
        const langTour = [
            { code: 'en', label: 'English (LTR)', note: '493 synchronized keys — default fallback locale' },
            { code: 'tr', label: 'Türkçe (LTR)', note: 'Full Turkish UI with Turkish İ/I/ı search folding' },
            { code: 'fr', label: 'Français (LTR)', note: 'Native French localization across all modals & labels' },
            { code: 'ar', label: 'العربية — Automatic RTL (dir="rtl")', note: 'Logical CSS flips sidebar, breadcrumbs, shortcuts & drawers automatically' },
        ];
        for (const lang of langTour) {
            await page.goto(`${ASSETMAPPER_URL}/?theme=bootstrap5&icon_set=windows11&locale=${lang.code}&scheme=light`, { waitUntil: 'networkidle' });
            await waitForFmReady(page, 350);
            await showChapterBadge(page, '07 / 10 • i18n & RTL', `Locale: ${lang.label}`, lang.note);
            await page.waitForTimeout(2300);
        }

        // --- CHAPTER 08: SYMFONY FORMTYPE PICKERS (ALL 5 VARIANTS + MULTI-GALLERY) ---
        await page.goto(`${ASSETMAPPER_URL}/forms?theme=bootstrap5&icon_set=windows11&locale=en&scheme=light`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(900);
        await showChapterBadge(page, '08 / 10', 'Symfony FileManagerPickerType & Doctrine', '5 ready variants (compact, card, dropzone, avatar, input) + reorderable multi-gallery');
        await page.waitForTimeout(2400);

        // Demonstrate gallery reorder button (accessible keyboard/touch reorder!)
        const moveRightBtn = page.locator('.liveux-fm-picker-move-btn').nth(1);
        if (await moveRightBtn.count()) {
            await moveRightBtn.click();
            await page.waitForTimeout(1100);
        }

        // Open OffCanvas picker right from the Compact form field!
        const firstSelectBtn = page.locator('.liveux-fm-picker button[data-action*="open"]').first();
        if (await firstSelectBtn.count()) {
            await firstSelectBtn.click();
            await page.waitForSelector('dialog.liveux-fm-dialog[open] .liveux-fm-shell', { timeout: 10000 });
            await page.waitForTimeout(1500);
            // Pick leather-notebook.webp inside the dialog
            const pickCard = page.locator('dialog.liveux-fm-dialog[open] .liveux-fm-card', { hasText: 'leather-notebook.webp' }).first();
            if (await pickCard.count()) {
                await pickCard.dblclick();
                await page.waitForTimeout(1500);
            } else {
                await page.keyboard.press('Escape');
                await page.waitForTimeout(600);
            }
        }

        // --- CHAPTER 09: MODAL, 4-DIRECTION OFFCANVAS & JS PROMISE API ---
        await page.goto(`${ASSETMAPPER_URL}/modals?theme=bootstrap5&icon_set=windows11&locale=en&scheme=light`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(700);
        await showChapterBadge(page, '09 / 10', 'Native <dialog> Modal, OffCanvas & JS API', 'Zero z-index conflicts — works with TinyMCE, CKEditor 5, Tiptap & custom JS');
        await page.waitForTimeout(1400);

        // 1) Centered Modal + select a file to show live JSON payload
        await page.locator('button', { hasText: 'Centered Modal (Multi-Select)' }).click();
        await page.waitForSelector('dialog.liveux-fm-dialog[open] .liveux-fm-shell', { timeout: 10000 });
        await page.waitForTimeout(1600);
        const modalCard = page.locator('dialog.liveux-fm-dialog[open] .liveux-fm-card', { hasText: 'chronograph-watch.webp' }).first();
        if (await modalCard.count()) {
            await modalCard.click();
            await page.waitForTimeout(700);
            const confirmBtn = page.locator('dialog.liveux-fm-dialog[open] [data-action*="confirmSelection"]').first();
            if (await confirmBtn.count()) {
                await confirmBtn.click();
                await page.waitForTimeout(1600);
            } else {
                await page.keyboard.press('Escape');
            }
        } else {
            await page.keyboard.press('Escape');
        }
        await page.waitForTimeout(700);

        // 2) OffCanvas Right (End)
        await page.locator('button', { hasText: 'OffCanvas Right (End)' }).click();
        await page.waitForSelector('dialog.liveux-fm-dialog[open] .liveux-fm-shell', { timeout: 10000 });
        await page.waitForTimeout(2000);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(700);

        // 3) OffCanvas Bottom
        await page.locator('button', { hasText: 'OffCanvas Bottom (Mobile Sheet)' }).click();
        await page.waitForSelector('dialog.liveux-fm-dialog[open] .liveux-fm-shell', { timeout: 10000 });
        await page.waitForTimeout(1900);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(700);

        // --- CHAPTER 10: RESPONSIVE MOBILE-FIRST EXPERIENCE (390x844 LIVE PHONE FRAME) ---
        await page.goto(`${ASSETMAPPER_URL}/mobile-studio?theme=bootstrap5&icon_set=windows11&locale=en&scheme=light`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1200);
        await showChapterBadge(page, '10 / 10', 'Mobile-First Fullscreen & Native Bottom Sheet', 'Adaptive 100dvh modal, swipeable folder drawer & rounded touch sheet');

        const phoneFrame = page.frameLocator('#mobile-demo-frame');
        // 1) Open Fullscreen Mobile Modal inside phone
        await phoneFrame.locator('button', { hasText: 'Centered Modal (Multi-Select)' }).click();
        await phoneFrame.locator('dialog.liveux-fm-dialog[open] .liveux-fm-shell').waitFor({ timeout: 10000 });
        await page.waitForTimeout(1800);

        // Open mobile slide-in folder drawer inside the phone!
        const mobileMenuBtn = phoneFrame.locator('dialog.liveux-fm-dialog[open] [data-action*="toggleSidebar"]').first();
        if (await mobileMenuBtn.count()) {
            await mobileMenuBtn.click();
            await page.waitForTimeout(1700);
            await mobileMenuBtn.click();
            await page.waitForTimeout(900);
        }
        // Close mobile modal
        const mobileCloseBtn = phoneFrame.locator('dialog.liveux-fm-dialog[open] [data-action*="closeDialog"]').first();
        if (await mobileCloseBtn.count()) {
            await mobileCloseBtn.click();
        }
        await page.waitForTimeout(900);

        // 2) Open Mobile Native Bottom Sheet inside phone!
        await phoneFrame.locator('button', { hasText: 'Mobile Bottom Sheet Mode' }).click();
        await phoneFrame.locator('dialog.liveux-fm-dialog[open] .liveux-fm-shell').waitFor({ timeout: 10000 });
        await page.waitForTimeout(2400);

        // --- OUTRO: Light Hero Banner Splash ---
        await page.goto(`${ASSETMAPPER_URL}/banner-studio?mode=light`, { waitUntil: 'networkidle' });
        await page.evaluate(() => {
            document.documentElement.style.cssText = 'width:1920px;height:1080px;overflow:hidden;background:#eef4ff;display:flex;align-items:center;justify-content:center;';
            document.body.style.cssText = 'width:1280px;height:640px;transform:scale(1.5);transform-origin:center center;overflow:hidden;';
        });
        await page.waitForTimeout(2800);

        const ytRawVideo = await page.video().path();
        await ytCtx.close();

        // Encode crisp Full HD 1080p YouTube MP4 (H.264 High Profile, CRF 19, faststart)
        const ytMp4Out = path.join(DOCS_IMG_DIR, 'demo-youtube-showcase.mp4');
        execFileSync(FFMPEG_EXE, [
            '-y', '-i', ytRawVideo,
            '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
            '-crf', '19', '-preset', 'medium', '-r', '30', '-movflags', '+faststart',
            ytMp4Out,
        ], { stdio: 'inherit' });
        console.log('Generated Full HD 1080p YouTube video: demo-youtube-showcase.mp4');

        // =========================================================================
        // 3) PUNCHY 18-SECOND GITHUB README HIGHLIGHT (GIF + 720p MP4 — NO ABOUT!)
        // =========================================================================
        const ghCtx = await browser.newContext({
            viewport: { width: 1280, height: 720 },
            recordVideo: { dir: VIDEO_TMP_DIR, size: { width: 1280, height: 720 } },
        });
        const ghPage = await ghCtx.newPage();
        await ghPage.goto(`${ASSETMAPPER_URL}/?theme=bootstrap5&icon_set=windows11&locale=en&scheme=light`, { waitUntil: 'networkidle' });
        await waitForFmReady(ghPage);
        await ghPage.waitForTimeout(1200);

        // Select thermos + Inspector
        await ghPage.locator('.liveux-fm-card', { hasText: 'nordic-thermos.webp' }).first().click();
        await ghPage.waitForTimeout(1100);

        // Folder customize ('I')
        await ghPage.locator('.liveux-fm-folder-tile').first().click();
        await ghPage.waitForTimeout(350);
        await ghPage.keyboard.press('i');
        await ghPage.waitForTimeout(1400);
        await ghPage.keyboard.press('Escape');
        await ghPage.waitForTimeout(450);

        // Canvas Image Editor ('E')
        await ghPage.locator('.liveux-fm-card', { hasText: 'nordic-thermos.webp' }).first().click();
        await ghPage.waitForTimeout(350);
        await ghPage.keyboard.press('e');
        await ghPage.waitForTimeout(1600);
        await ghPage.keyboard.press('Escape');
        await ghPage.waitForTimeout(450);

        // Dark Mode (Shadcn Dark)
        await ghPage.goto(`${ASSETMAPPER_URL}/?theme=shadcn&icon_set=macos&locale=en&scheme=dark`, { waitUntil: 'networkidle' });
        await waitForFmReady(ghPage, 350);
        await ghPage.waitForTimeout(1400);

        // DaisyUI 5 Theme
        await ghPage.goto(`${ASSETMAPPER_URL}/?theme=daisyui&icon_set=windows11&locale=en&scheme=light`, { waitUntil: 'networkidle' });
        await waitForFmReady(ghPage, 350);
        await ghPage.waitForTimeout(1300);

        // Form Pickers
        await ghPage.goto(`${ASSETMAPPER_URL}/forms?theme=bootstrap5&icon_set=windows11&locale=en&scheme=light`, { waitUntil: 'networkidle' });
        await ghPage.waitForTimeout(1500);

        const ghRawVideo = await ghPage.video().path();
        await ghCtx.close();

        const ghMp4Out = path.join(DOCS_IMG_DIR, 'demo-showcase.mp4');
        const ghGifOut = path.join(DOCS_IMG_DIR, 'demo-showcase.gif');
        const paletteOut = path.join(VIDEO_TMP_DIR, 'palette.png');

        execFileSync(FFMPEG_EXE, [
            '-y', '-i', ghRawVideo,
            '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '22', '-preset', 'medium', '-movflags', '+faststart',
            ghMp4Out,
        ], { stdio: 'inherit' });

        execFileSync(FFMPEG_EXE, [
            '-y', '-i', ghRawVideo,
            '-vf', 'fps=12,scale=960:-1:flags=lanczos,palettegen=stats_mode=diff',
            paletteOut,
        ], { stdio: 'inherit' });

        execFileSync(FFMPEG_EXE, [
            '-y', '-i', ghRawVideo, '-i', paletteOut,
            '-lavfi', 'fps=12,scale=960:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5',
            ghGifOut,
        ], { stdio: 'inherit' });

        console.log('Generated GitHub highlight demo-showcase.mp4 & demo-showcase.gif');
    } finally {
        await browser.close();
    }

    if (consoleErrors.length > 0) {
        console.error('CONSOLE ERRORS DETECTED:', consoleErrors);
        process.exit(1);
    }
    console.log('ALL BANNERS & FULL HD YOUTUBE SHOWCASE COMPLETED WITH ZERO CONSOLE ERRORS!');
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
