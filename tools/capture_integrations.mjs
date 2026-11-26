import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const globalNodeModules = path.join(process.env.APPDATA || '', 'npm', 'node_modules');
const { chromium } = require(path.join(globalNodeModules, 'playwright'));

const ASSETMAPPER_URL = 'http://127.0.0.1:8091';
const ENCORE_URL = 'http://127.0.0.1:8092';
const DOCS_IMG_DIR = 'c:/wamp64/www/symfony/promosyon8/bundles/liveux-file-manager-bundle/docs/images';
const VIDEO_TMP_DIR = 'c:/wamp64/www/symfony/liveux-file-manager-demo/var-video-int';
const FFMPEG_EXE = path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WinGet', 'Links', 'ffmpeg.exe');

fs.mkdirSync(DOCS_IMG_DIR, { recursive: true });
fs.mkdirSync(VIDEO_TMP_DIR, { recursive: true });

function encodeGifAndMp4(rawWebm, baseName) {
    const gifOut = path.join(DOCS_IMG_DIR, `${baseName}.gif`);
    const paletteOut = path.join(VIDEO_TMP_DIR, `${baseName}_palette.png`);

    execFileSync(FFMPEG_EXE, [
        '-y', '-i', rawWebm,
        '-vf', 'fps=12,scale=960:-1:flags=lanczos,palettegen=stats_mode=diff',
        paletteOut,
    ], { stdio: 'pipe' });

    execFileSync(FFMPEG_EXE, [
        '-y', '-i', rawWebm, '-i', paletteOut,
        '-lavfi', 'fps=12,scale=960:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5',
        gifOut,
    ], { stdio: 'pipe' });

    const sizeMb = (fs.statSync(gifOut).size / (1024 * 1024)).toFixed(2);
    console.log(`Generated ${baseName}.gif (${sizeMb} MB)`);
}

async function recordClip(browser, baseName, screenshotName, fn) {
    const ctx = await browser.newContext({
        viewport: { width: 1280, height: 760 },
        deviceScaleFactor: 1,
        recordVideo: { dir: VIDEO_TMP_DIR, size: { width: 1280, height: 760 } },
    });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(`[${baseName} pageerror] ${e.message}`));
    page.on('console', (m) => {
        if (m.type() === 'error') {
            errors.push(`[${baseName} console] ${m.text()}`);
        }
    });

    await fn(page, async () => {
        if (screenshotName) {
            await page.screenshot({ path: path.join(DOCS_IMG_DIR, screenshotName) });
            console.log(`Captured ${screenshotName}`);
        }
    });

    const rawVideo = await page.video().path();
    await ctx.close();
    encodeGifAndMp4(rawVideo, baseName);
    return errors;
}

async function run() {
    const browser = await chromium.launch({ headless: true });
    const allErrors = [];

    try {
        // Pre-seed products in BOTH demos by visiting /forms once
        const seedCtx = await browser.newContext({ viewport: { width: 1280, height: 760 } });
        const seedPage = await seedCtx.newPage();
        for (const base of [ASSETMAPPER_URL, ENCORE_URL]) {
            await seedPage.goto(`${base}/forms`, { waitUntil: 'networkidle' });
            await seedPage.waitForTimeout(400);
        }
        // Verify Encore parity across ALL routes!
        for (const route of ['/', '/forms', '/collections', '/editors?editor=tinymce', '/admin']) {
            const res = await seedPage.goto(`${ENCORE_URL}${route}`, { waitUntil: 'networkidle' });
            if (!res || res.status() >= 400) {
                throw new Error(`Encore route ${route} returned status ${res ? res.status() : 'null'}`);
            }
            console.log(`[Encore Verified] ${route} -> HTTP ${res.status()}`);
        }
        await seedCtx.close();

        const onlyArg = process.argv.find((a) => a.startsWith('--only='));
        const onlySet = onlyArg ? new Set(onlyArg.slice('--only='.length).split(',')) : null;
        const shouldRun = (key) => !onlySet || onlySet.has(key);

        // 1) TINYMCE 7 DEDICATED GIF + SCREENSHOT
        if (shouldRun('tinymce')) allErrors.push(...await recordClip(browser, 'demo-editor-tinymce', 'editor-tinymce.png', async (page, snap) => {
            await page.goto(`${ASSETMAPPER_URL}/editors?editor=tinymce&theme=bootstrap5&icon_set=windows11&locale=en`, { waitUntil: 'networkidle' });
            await page.waitForSelector('.tox-tinymce', { timeout: 15000 });
            await page.waitForTimeout(1000);

            // Click quick trigger to open TinyMCE's Insert/Edit Image modal
            await page.locator('button', { hasText: 'Insert Image via TinyMCE Picker' }).click();
            await page.waitForSelector('.tox-dialog .tox-browse-url', { timeout: 10000 });
            await page.waitForTimeout(800);

            // Click TinyMCE's Browse URL button -> opens LiveUX FileManagerBundle over TinyMCE!
            await page.locator('.tox-dialog .tox-browse-url').first().click();
            await page.waitForSelector('dialog.liveux-fm-dialog[open] .liveux-fm-shell', { timeout: 10000 });
            await page.waitForTimeout(1200);

            // Double-click summer-campaign.webp
            await page.locator('dialog.liveux-fm-dialog[open] .liveux-fm-card', { hasText: 'summer-campaign.webp' }).first().dblclick();
            await page.waitForTimeout(1000);

            // Click TinyMCE Save button
            await page.locator('.tox-dialog button', { hasText: 'Save' }).first().click();
            await page.waitForTimeout(1400);
            await snap();
            await page.waitForTimeout(900);
        }));

        // 2) CKEDITOR 5 DEDICATED GIF + SCREENSHOT
        if (shouldRun('ckeditor5')) allErrors.push(...await recordClip(browser, 'demo-editor-ckeditor5', 'editor-ckeditor5.png', async (page, snap) => {
            await page.goto(`${ASSETMAPPER_URL}/editors?editor=ckeditor5&theme=bootstrap5&icon_set=windows11&locale=en`, { waitUntil: 'networkidle' });
            await page.waitForSelector('.ck-editor__editable', { timeout: 15000 });
            await page.waitForTimeout(1000);

            // Click Insert Media from LiveUX (OffCanvas)
            await page.locator('button', { hasText: 'Insert Media from LiveUX (OffCanvas)' }).click();
            await page.waitForSelector('dialog.liveux-fm-dialog[open] .liveux-fm-shell', { timeout: 10000 });
            await page.waitForTimeout(1200);

            // Select nordic-thermos.webp + confirm
            await page.locator('dialog.liveux-fm-dialog[open] .liveux-fm-card', { hasText: 'nordic-thermos.webp' }).first().click();
            await page.waitForTimeout(700);
            await page.locator('dialog.liveux-fm-dialog[open] [data-action*="confirmSelection"]').first().click();
            await page.waitForTimeout(1500);
            await snap();
            await page.waitForTimeout(900);
        }));

        // 3) TIPTAP 2 DEDICATED GIF + SCREENSHOT
        if (shouldRun('tiptap')) allErrors.push(...await recordClip(browser, 'demo-editor-tiptap', 'editor-tiptap.png', async (page, snap) => {
            await page.goto(`${ASSETMAPPER_URL}/editors?editor=tiptap&theme=bootstrap5&icon_set=windows11&locale=en`, { waitUntil: 'networkidle' });
            await page.waitForSelector('.ProseMirror', { timeout: 20000 });
            await page.waitForTimeout(1100);

            // Click toolbar button Insert Media (LiveUX)
            await page.locator('.tiptap-toolbar button.is-primary').click();
            await page.waitForSelector('dialog.liveux-fm-dialog[open] .liveux-fm-shell', { timeout: 10000 });
            await page.waitForTimeout(1200);

            // Select chronograph-watch.webp + confirm
            await page.locator('dialog.liveux-fm-dialog[open] .liveux-fm-card', { hasText: 'chronograph-watch.webp' }).first().click();
            await page.waitForTimeout(700);
            await page.locator('dialog.liveux-fm-dialog[open] [data-action*="confirmSelection"]').first().click();
            await page.waitForTimeout(1500);
            await snap();
            await page.waitForTimeout(900);
        }));

        // 4) EASYADMIN 5 CRUD DEDICATED GIF + SCREENSHOT
        if (shouldRun('easyadmin')) allErrors.push(...await recordClip(browser, 'demo-easyadmin', 'easyadmin-crud.png', async (page, snap) => {
            await page.goto(`${ASSETMAPPER_URL}/admin`, { waitUntil: 'networkidle' });
            await page.waitForSelector('table.datagrid tbody tr', { timeout: 15000 });
            await page.waitForTimeout(1600);

            // Open Edit page on first product (EasyAdmin 5 collapses row actions in dropdown-toggle)
            const editLink = page.locator('a.action-edit').first();
            if (await editLink.isVisible()) {
                await editLink.click();
            } else {
                await page.locator('.actions .dropdown-toggle').first().click();
                await page.waitForTimeout(450);
                await page.locator('a.action-edit').first().click();
            }
            await page.waitForSelector('.liveux-fm-picker', { timeout: 15000 });
            await page.waitForTimeout(1300);
            await snap();

            // Click Browse Media on Primary Photo (Compact) -> opens OffCanvas right inside EasyAdmin!
            await page.locator('.liveux-fm-picker button[data-action*="open"]').first().click();
            await page.waitForSelector('dialog.liveux-fm-dialog[open] .liveux-fm-shell', { timeout: 10000 });
            await page.waitForTimeout(1300);

            // Pick leather-notebook.webp
            await page.locator('dialog.liveux-fm-dialog[open] .liveux-fm-card', { hasText: 'leather-notebook.webp' }).first().dblclick();
            await page.waitForTimeout(1400);
        }));

        // 5) COLLECTIONTYPE & LIVECOLLECTIONTYPE DEDICATED GIF + SCREENSHOT
        if (shouldRun('collections')) allErrors.push(...await recordClip(browser, 'demo-collections', 'collections-live.png', async (page, snap) => {
            await page.goto(`${ASSETMAPPER_URL}/collections?theme=bootstrap5&icon_set=windows11&locale=en`, { waitUntil: 'networkidle' });
            await page.waitForSelector('button', { hasText: '+ Add Live Slide', timeout: 15000 });
            await page.waitForTimeout(1100);

            // Click + Add Live Slide (LiveComponent AJAX Idiomorph re-render!)
            await page.locator('button', { hasText: '+ Add Live Slide' }).click();
            await page.waitForSelector('strong:has-text("Slide #3")', { timeout: 10000 });
            await page.waitForTimeout(1000);

            // Open FileManager OffCanvas on the newly added Slide #3!
            const slide3Card = page.locator('.liveux-demo-card', { hasText: 'Slide #3' }).first();
            await slide3Card.locator('.liveux-fm-picker button[data-action*="open"]').first().click();
            await page.waitForSelector('dialog.liveux-fm-dialog[open] .liveux-fm-shell', { timeout: 10000 });
            await page.waitForTimeout(1200);

            // Double-click botanical-studio.webp
            await page.locator('dialog.liveux-fm-dialog[open] .liveux-fm-card', { hasText: 'botanical-studio.webp' }).first().dblclick();
            await page.waitForTimeout(1100);

            // Fill title and submit LiveCollection via AJAX
            await slide3Card.locator('input[type="text"]').first().fill('Botanical Studio Interior');
            await page.waitForTimeout(400);
            await page.locator('button', { hasText: 'Submit LiveCollection (AJAX)' }).click();
            await page.waitForSelector('strong:has-text("LiveCollection submitted")', { timeout: 10000 });
            await page.waitForTimeout(1200);
            await snap();
            await page.waitForTimeout(900);
        }));

        // 6) QUILL 2 DEDICATED GIF + SCREENSHOT
        if (shouldRun('quill')) allErrors.push(...await recordClip(browser, 'demo-editor-quill', 'editor-quill.png', async (page, snap) => {
            await page.goto(`${ASSETMAPPER_URL}/editors?editor=quill&theme=bootstrap5&icon_set=windows11&locale=en`, { waitUntil: 'networkidle' });
            await page.waitForSelector('.ql-toolbar button.ql-image', { timeout: 15000 });
            await page.waitForTimeout(1000);

            // Click Quill's own built-in Image toolbar icon!
            await page.locator('.ql-toolbar button.ql-image').first().click();
            await page.waitForSelector('dialog.liveux-fm-dialog[open] .liveux-fm-shell', { timeout: 10000 });
            await page.waitForTimeout(1200);

            await page.locator('dialog.liveux-fm-dialog[open] .liveux-fm-card', { hasText: 'ceramic-mug.webp' }).first().dblclick();
            await page.waitForTimeout(1400);
            await snap();
            await page.waitForTimeout(900);
        }));

        // 7) TRIX (EASYADMIN TEXTEDITORFIELD) DEDICATED GIF + SCREENSHOT
        if (shouldRun('trix')) allErrors.push(...await recordClip(browser, 'demo-editor-trix', 'editor-trix.png', async (page, snap) => {
            await page.goto(`${ASSETMAPPER_URL}/editors?editor=trix&theme=bootstrap5&icon_set=windows11&locale=en`, { waitUntil: 'networkidle' });
            await page.waitForSelector('trix-toolbar', { timeout: 15000 });
            await page.waitForTimeout(1000);

            await page.locator('button', { hasText: 'Insert Media into Trix' }).click();
            await page.waitForSelector('dialog.liveux-fm-dialog[open] .liveux-fm-shell', { timeout: 10000 });
            await page.waitForTimeout(1200);

            await page.locator('dialog.liveux-fm-dialog[open] .liveux-fm-card', { hasText: 'leather-notebook.webp' }).first().click();
            await page.waitForTimeout(650);
            await page.locator('dialog.liveux-fm-dialog[open] [data-action*="confirmSelection"]').first().click();
            await page.waitForTimeout(1400);
            await snap();
            await page.waitForTimeout(900);
        }));

        // 8) SUMMERNOTE DEDICATED GIF + SCREENSHOT
        if (shouldRun('summernote')) allErrors.push(...await recordClip(browser, 'demo-editor-summernote', 'editor-summernote.png', async (page, snap) => {
            await page.goto(`${ASSETMAPPER_URL}/editors?editor=summernote&theme=bootstrap5&icon_set=windows11&locale=en`, { waitUntil: 'networkidle' });
            await page.waitForSelector('.note-editor .note-editable', { timeout: 15000 });
            await page.waitForTimeout(1000);

            await page.locator('button', { hasText: 'Insert Media into Summernote' }).click();
            await page.waitForSelector('dialog.liveux-fm-dialog[open] .liveux-fm-shell', { timeout: 10000 });
            await page.waitForTimeout(1200);

            await page.locator('dialog.liveux-fm-dialog[open] .liveux-fm-card', { hasText: 'wireless-charger.webp' }).first().click();
            await page.waitForTimeout(650);
            await page.locator('dialog.liveux-fm-dialog[open] [data-action*="confirmSelection"]').first().click();
            await page.waitForTimeout(1400);
            await snap();
            await page.waitForTimeout(900);
        }));

        // 9) EDITOR.JS DEDICATED GIF + SCREENSHOT
        if (shouldRun('editorjs')) allErrors.push(...await recordClip(browser, 'demo-editor-editorjs', 'editor-editorjs.png', async (page, snap) => {
            await page.goto(`${ASSETMAPPER_URL}/editors?editor=editorjs&theme=bootstrap5&icon_set=windows11&locale=en`, { waitUntil: 'networkidle' });
            await page.waitForSelector('.codex-editor', { timeout: 15000 });
            await page.waitForTimeout(1100);

            await page.locator('button', { hasText: 'Insert Image Block (LiveUX)' }).click();
            await page.waitForSelector('dialog.liveux-fm-dialog[open] .liveux-fm-shell', { timeout: 10000 });
            await page.waitForTimeout(1200);

            await page.locator('dialog.liveux-fm-dialog[open] .liveux-fm-card', { hasText: 'enterprise-cloud.webp' }).first().click();
            await page.waitForTimeout(650);
            await page.locator('dialog.liveux-fm-dialog[open] [data-action*="confirmSelection"]').first().click();
            await page.waitForTimeout(1500);
            await snap();
            await page.waitForTimeout(900);
        }));

        // 10) GRAPESJS DEDICATED GIF + SCREENSHOT
        if (shouldRun('grapesjs')) allErrors.push(...await recordClip(browser, 'demo-editor-grapesjs', 'editor-grapesjs.png', async (page, snap) => {
            await page.goto(`${ASSETMAPPER_URL}/editors?editor=grapesjs&theme=bootstrap5&icon_set=windows11&locale=en`, { waitUntil: 'networkidle' });
            await page.waitForSelector('.gjs-editor', { timeout: 20000 });
            await page.waitForTimeout(1100);

            await page.locator('button', { hasText: 'Insert Media into GrapesJS' }).click();
            await page.waitForSelector('dialog.liveux-fm-dialog[open] .liveux-fm-shell', { timeout: 10000 });
            await page.waitForTimeout(1200);

            await page.locator('dialog.liveux-fm-dialog[open] .liveux-fm-card', { hasText: 'summer-campaign.webp' }).first().click();
            await page.waitForTimeout(700);
            await page.locator('dialog.liveux-fm-dialog[open] [data-action*="confirmSelection"]').first().click();
            await page.waitForTimeout(1600);
            await snap();
            await page.waitForTimeout(900);
        }));

        // 11) META LEXICAL DEDICATED GIF + SCREENSHOT
        if (shouldRun('lexical')) allErrors.push(...await recordClip(browser, 'demo-editor-lexical', 'editor-lexical.png', async (page, snap) => {
            await page.goto(`${ASSETMAPPER_URL}/editors?editor=lexical&theme=bootstrap5&icon_set=windows11&locale=en`, { waitUntil: 'networkidle' });
            await page.waitForSelector('#lexical-host p', { timeout: 20000 });
            await page.waitForTimeout(1100);

            await page.locator('button', { hasText: 'Insert Image into Lexical' }).click();
            await page.waitForSelector('dialog.liveux-fm-dialog[open] .liveux-fm-shell', { timeout: 10000 });
            await page.waitForTimeout(1200);

            await page.locator('dialog.liveux-fm-dialog[open] .liveux-fm-card', { hasText: 'botanical-studio.webp' }).first().click();
            await page.waitForTimeout(700);
            await page.locator('dialog.liveux-fm-dialog[open] [data-action*="confirmSelection"]').first().click();
            await page.waitForTimeout(1600);
            await snap();
            await page.waitForTimeout(900);
        }));
    } finally {
        await browser.close();
    }

    if (allErrors.length > 0) {
        console.error('INTEGRATION CONSOLE ERRORS:', allErrors);
        process.exit(1);
    }
    console.log('ALL 5 PER-FEATURE INTEGRATION GIFS + SCREENSHOTS & ENCORE PARITY VERIFIED WITH ZERO ERRORS!');
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
