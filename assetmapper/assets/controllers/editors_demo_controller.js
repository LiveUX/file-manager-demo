import { Controller } from '@hotwired/stimulus';
import { createTinyMceFilePicker } from '@liveux/file-manager-bundle/js/integrations/tinymce_adapter.js';
import { openFileManagerForCKEditor5 } from '@liveux/file-manager-bundle/js/integrations/ckeditor5_adapter.js';
import { insertFromFileManager } from '@liveux/file-manager-bundle/js/integrations/tiptap_adapter.js';
import { createQuillImageHandler, openFileManagerForQuill } from '@liveux/file-manager-bundle/js/integrations/quill_adapter.js';
import { openFileManagerForTrix } from '@liveux/file-manager-bundle/js/integrations/trix_adapter.js';
import { openFileManagerForSummernote } from '@liveux/file-manager-bundle/js/integrations/summernote_adapter.js';
import { openFileManagerForEditorJs } from '@liveux/file-manager-bundle/js/integrations/editorjs_adapter.js';
import { createGrapesJsAssetManagerConfig, openFileManagerForGrapesJs } from '@liveux/file-manager-bundle/js/integrations/grapesjs_adapter.js';
import { openFileManagerForLexical } from '@liveux/file-manager-bundle/js/integrations/lexical_adapter.js';

function loadCssOnce(href) {
    if (document.querySelector(`link[href="${href}"]`)) {
        return;
    }
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = href;
    document.head.appendChild(l);
}

function loadScriptOnce(src, globalCheck) {
    if (globalCheck()) {
        return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) {
            existing.addEventListener('load', () => resolve(), { once: true });
            existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), { once: true });
            const poll = setInterval(() => {
                if (globalCheck()) {
                    clearInterval(poll);
                    resolve();
                }
            }, 50);
            setTimeout(() => clearInterval(poll), 12000);
            return;
        }
        const s = document.createElement('script');
        s.src = src;
        s.referrerPolicy = 'origin';
        s.onload = () => resolve();
        s.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(s);
    });
}

export default class extends Controller {
    static targets = [
        'tinymceTextarea',
        'ckeditorHost',
        'tiptapHost',
        'quillHost',
        'trixEditor',
        'summernoteTextarea',
        'editorJsHost',
        'grapesJsHost',
        'lexicalHost',
    ];
    static values = {
        theme: { type: String, default: 'bootstrap5' },
        iconSet: { type: String, default: 'windows11' },
        locale: { type: String, default: 'en' },
        activeEditor: { type: String, default: 'tinymce' },
    };

    connect() {
        this.tinyInstance = null;
        this.ckEditor = null;
        this.tiptapEditor = null;
        this.quillInstance = null;
        this.summernoteEl = null;
        this.editorJsInstance = null;
        this.grapesJsEditor = null;
        this.lexicalEditor = null;
        this.lexicalInsertImageCmd = null;
        this.lexicalFormatTextCmd = null;

        const map = {
            tinymce: () => this.initTinyMce(),
            ckeditor5: () => this.initCkEditor(),
            tiptap: () => this.initTiptap(),
            quill: () => this.initQuill(),
            trix: () => this.initTrix(),
            summernote: () => this.initSummernote(),
            editorjs: () => this.initEditorJs(),
            grapesjs: () => this.initGrapesJs(),
            lexical: () => this.initLexical(),
        };
        if (map[this.activeEditorValue]) {
            map[this.activeEditorValue]();
        }
    }

    disconnect() {
        if (this.tinyInstance && window.tinymce) {
            window.tinymce.remove(this.tinyInstance);
            this.tinyInstance = null;
        }
        if (this.ckEditor) {
            this.ckEditor.destroy().catch(() => {});
            this.ckEditor = null;
        }
        if (this.tiptapEditor) {
            this.tiptapEditor.destroy();
            this.tiptapEditor = null;
        }
        if (this.editorJsInstance && typeof this.editorJsInstance.destroy === 'function') {
            this.editorJsInstance.destroy();
            this.editorJsInstance = null;
        }
        if (this.grapesJsEditor && typeof this.grapesJsEditor.destroy === 'function') {
            this.grapesJsEditor.destroy();
            this.grapesJsEditor = null;
        }
        if (this.lexicalEditor) {
            this.lexicalEditor.setRootElement(null);
            this.lexicalEditor = null;
        }
    }

    baseFmOptions(extra = {}) {
        return {
            profile: 'default',
            theme: this.themeValue,
            iconSet: this.iconSetValue,
            locale: this.localeValue,
            ...extra,
        };
    }

    // 1. TinyMCE 5/6/7/8
    async initTinyMce() {
        if (!this.hasTinymceTextareaTarget) return;
        await loadScriptOnce('https://cdn.jsdelivr.net/npm/tinymce@7.6.0/tinymce.min.js', () => Boolean(window.tinymce));
        window.tinymce.init({
            target: this.tinymceTextareaTarget,
            license_key: 'gpl',
            height: 360,
            menubar: false,
            branding: false,
            plugins: 'image link media lists table code',
            toolbar: 'undo redo | blocks | bold italic | alignleft aligncenter alignright | bullist numlist | image media link | code',
            content_style: 'body { font-family: system-ui, sans-serif; font-size: 15px; } img { max-width: 340px; height: auto; border-radius: 10px; box-shadow: 0 8px 20px rgba(15,23,42,0.12); }',
            file_picker_types: 'file image media',
            file_picker_callback: createTinyMceFilePicker(this.baseFmOptions({ mode: 'modal' })),
            setup: (editor) => { this.tinyInstance = editor; },
        });
    }

    openTinyMceImageDialog() {
        this.tinyInstance?.execCommand('mceImage');
    }

    // 2. CKEditor 5
    async initCkEditor() {
        if (!this.hasCkeditorHostTarget) return;
        await loadScriptOnce('https://cdn.jsdelivr.net/npm/@ckeditor/ckeditor5-build-classic@41.4.2/build/ckeditor.js', () => Boolean(window.ClassicEditor));
        this.ckEditor = await window.ClassicEditor.create(this.ckeditorHostTarget, {
            toolbar: ['heading', '|', 'bold', 'italic', 'link', 'bulletedList', 'numberedList', 'blockQuote', '|', 'undo', 'redo'],
        });
    }

    async insertIntoCkEditor() {
        if (!this.ckEditor) return;
        await openFileManagerForCKEditor5(this.ckEditor, this.baseFmOptions({ mode: 'offcanvas', position: 'end', multiple: true }));
    }

    // 3. Tiptap 2
    async initTiptap() {
        if (!this.hasTiptapHostTarget) return;
        const [{ Editor }, { default: StarterKit }, { default: Image }, { default: Link }] = await Promise.all([
            import(/* webpackIgnore: true */ 'https://esm.sh/@tiptap/core@2.11.5'),
            import(/* webpackIgnore: true */ 'https://esm.sh/@tiptap/starter-kit@2.11.5'),
            import(/* webpackIgnore: true */ 'https://esm.sh/@tiptap/extension-image@2.11.5'),
            import(/* webpackIgnore: true */ 'https://esm.sh/@tiptap/extension-link@2.11.5'),
        ]);
        this.tiptapEditor = new Editor({
            element: this.tiptapHostTarget,
            extensions: [StarterKit, Image.configure({ inline: false }), Link.configure({ openOnClick: false })],
            content: '<h2>Modern Headless Rich Text — Tiptap 2</h2><p>Click <strong>Insert Media (LiveUX)</strong> in the toolbar above to insert high-resolution WebP images with SEO <code>alt</code> attributes.</p>',
        });
    }

    async insertIntoTiptap() {
        if (!this.tiptapEditor) return;
        await insertFromFileManager(this.tiptapEditor, this.baseFmOptions({ mode: 'modal', multiple: true }));
    }

    tiptapBold() { this.tiptapEditor?.chain().focus().toggleBold().run(); }
    tiptapItalic() { this.tiptapEditor?.chain().focus().toggleItalic().run(); }
    tiptapHeading() { this.tiptapEditor?.chain().focus().toggleHeading({ level: 2 }).run(); }
    tiptapBullet() { this.tiptapEditor?.chain().focus().toggleBulletList().run(); }

    // 4. Quill 2
    async initQuill() {
        if (!this.hasQuillHostTarget) return;
        loadCssOnce('https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.snow.css');
        await loadScriptOnce('https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.js', () => Boolean(window.Quill));
        this.quillInstance = new window.Quill(this.quillHostTarget, {
            theme: 'snow',
            modules: {
                toolbar: {
                    container: [[{ header: [1, 2, false] }], ['bold', 'italic', 'underline'], [{ list: 'ordered' }, { list: 'bullet' }], ['link', 'image'], ['clean']],
                    handlers: {
                        image: createQuillImageHandler(() => this.quillInstance, this.baseFmOptions({ mode: 'offcanvas', position: 'end' })),
                    },
                },
            },
        });
    }

    async insertIntoQuill() {
        if (!this.quillInstance) return;
        await openFileManagerForQuill(this.quillInstance, this.baseFmOptions({ mode: 'offcanvas', position: 'end', multiple: true }));
    }

    // 5. Trix (EasyAdmin TextEditorField)
    async initTrix() {
        loadCssOnce('https://cdn.jsdelivr.net/npm/trix@2.1.12/dist/trix.css');
        await loadScriptOnce('https://cdn.jsdelivr.net/npm/trix@2.1.12/dist/trix.umd.min.js', () => Boolean(window.Trix));
    }

    async insertIntoTrix() {
        if (!this.hasTrixEditorTarget) return;
        await openFileManagerForTrix(this.trixEditorTarget, this.baseFmOptions({ mode: 'modal', multiple: true }));
    }

    // 6. Summernote Lite
    async initSummernote() {
        if (!this.hasSummernoteTextareaTarget) return;
        loadCssOnce('https://cdn.jsdelivr.net/npm/summernote@0.9.0/dist/summernote-lite.min.css');
        await loadScriptOnce('https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js', () => Boolean(window.jQuery));
        await loadScriptOnce('https://cdn.jsdelivr.net/npm/summernote@0.9.0/dist/summernote-lite.min.js', () => Boolean(window.jQuery?.fn?.summernote));
        this.summernoteEl = window.jQuery(this.summernoteTextareaTarget);
        this.summernoteEl.summernote({
            height: 280,
            toolbar: [
                ['style', ['style']],
                ['font', ['bold', 'italic', 'underline', 'clear']],
                ['para', ['ul', 'ol', 'paragraph']],
                ['insert', ['link']],
                ['view', ['codeview']],
            ],
        });
    }

    async insertIntoSummernote() {
        if (!this.summernoteEl) return;
        await openFileManagerForSummernote(this.summernoteEl, this.baseFmOptions({ mode: 'offcanvas', position: 'end', multiple: true }));
    }

    // 7. Editor.js
    async initEditorJs() {
        if (!this.hasEditorJsHostTarget) return;
        await loadScriptOnce('https://cdn.jsdelivr.net/npm/@editorjs/editorjs@2.30.7', () => Boolean(window.EditorJS));
        await loadScriptOnce('https://cdn.jsdelivr.net/npm/@editorjs/header@2.8.8', () => Boolean(window.Header));
        await loadScriptOnce('https://cdn.jsdelivr.net/npm/@editorjs/simple-image@1.6.0', () => Boolean(window.SimpleImage));
        this.editorJsInstance = new window.EditorJS({
            holder: this.editorJsHostTarget,
            tools: {
                header: window.Header,
                simpleImage: window.SimpleImage,
            },
            data: {
                blocks: [
                    { type: 'header', data: { text: 'Block-Based JSON Content — Editor.js', level: 2 } },
                    { type: 'paragraph', data: { text: 'Click Insert Image Block (LiveUX) above to insert structured image blocks with captions directly from LiveUX FileManagerBundle.' } },
                ],
            },
        });
    }

    async insertIntoEditorJs() {
        if (!this.editorJsInstance) return;
        await openFileManagerForEditorJs(this.editorJsInstance, this.baseFmOptions({
            mode: 'modal',
            multiple: true,
            imageBlockType: 'simpleImage',
        }));
    }

    // 8. GrapesJS (Visual Page Builder)
    async initGrapesJs() {
        if (!this.hasGrapesJsHostTarget) return;
        loadCssOnce('https://cdn.jsdelivr.net/npm/grapesjs@0.21.13/dist/css/grapes.min.css');
        await loadScriptOnce('https://cdn.jsdelivr.net/npm/grapesjs@0.21.13/dist/grapes.min.js', () => Boolean(window.grapesjs));
        this.grapesJsEditor = window.grapesjs.init({
            container: this.grapesJsHostTarget,
            height: '420px',
            width: 'auto',
            storageManager: false,
            assetManager: createGrapesJsAssetManagerConfig(this.baseFmOptions({ mode: 'modal' })),
            components: `
                <section style="padding:28px 32px;font-family:system-ui,sans-serif;background:#f8fafc;color:#0f172a;">
                    <h2 style="margin:0 0 8px;font-size:24px;">Visual Page Builder — GrapesJS</h2>
                    <p style="margin:0 0 14px;color:#475569;">Double-click any image on the canvas or click <strong>Insert Media into GrapesJS</strong> above to browse assets via LiveUX FileManagerBundle.</p>
                </section>
            `,
        });
    }

    async insertIntoGrapesJs() {
        if (!this.grapesJsEditor) return;
        await openFileManagerForGrapesJs(this.grapesJsEditor, this.baseFmOptions({
            mode: 'offcanvas',
            position: 'end',
            multiple: true,
        }));
    }

    // 9. Meta Lexical
    async initLexical() {
        if (!this.hasLexicalHostTarget) return;
        const lexical = await import(/* webpackIgnore: true */ 'https://esm.sh/lexical@0.20.0');
        const {
            createEditor,
            createCommand,
            COMMAND_PRIORITY_EDITOR,
            FORMAT_TEXT_COMMAND,
            DecoratorNode,
            $getRoot,
            $createParagraphNode,
            $createTextNode,
            $insertNodes,
        } = lexical;

        class DemoImageNode extends DecoratorNode {
            static getType() { return 'demo-image'; }
            static clone(node) { return new DemoImageNode(node.__src, node.__alt, node.__key); }
            constructor(src, alt, key) {
                super(key);
                this.__src = src;
                this.__alt = alt;
            }
            createDOM() {
                const figure = document.createElement('figure');
                const img = document.createElement('img');
                img.src = this.__src;
                img.alt = this.__alt || '';
                figure.appendChild(img);
                if (this.__alt) {
                    const cap = document.createElement('figcaption');
                    cap.textContent = this.__alt;
                    figure.appendChild(cap);
                }
                return figure;
            }
            updateDOM() { return false; }
            decorate() { return null; }
        }

        const INSERT_IMAGE_COMMAND = createCommand('INSERT_IMAGE_COMMAND');
        this.lexicalInsertImageCmd = INSERT_IMAGE_COMMAND;
        this.lexicalFormatTextCmd = FORMAT_TEXT_COMMAND;

        const editor = createEditor({
            namespace: 'LiveUXDemoLexical',
            nodes: [DemoImageNode],
            onError(error) { console.error(error); },
        });
        editor.setRootElement(this.lexicalHostTarget);

        editor.registerCommand(
            INSERT_IMAGE_COMMAND,
            (payload) => {
                editor.update(() => {
                    const root = $getRoot();
                    const imageNode = new DemoImageNode(payload.src, payload.altText || payload.title || '');
                    root.append(imageNode);
                });
                return true;
            },
            COMMAND_PRIORITY_EDITOR,
        );

        editor.update(() => {
            const root = $getRoot();
            const heading = $createParagraphNode();
            heading.append($createTextNode('Meta Lexical Rich-Text Engine — LiveUX FileManagerBundle'));
            const body = $createParagraphNode();
            body.append($createTextNode('Click "Insert Image into Lexical" above to dispatch INSERT_IMAGE_COMMAND with strict XSS URL validation and SEO altText metadata.'));
            root.append(heading, body);
        });

        this.lexicalEditor = editor;
    }

    async insertIntoLexical() {
        if (!this.lexicalEditor || !this.lexicalInsertImageCmd) return;
        await openFileManagerForLexical(this.lexicalEditor, this.baseFmOptions({
            mode: 'modal',
            multiple: true,
            insertImageCommand: this.lexicalInsertImageCmd,
        }));
    }

    lexicalBold() {
        if (this.lexicalEditor && this.lexicalFormatTextCmd) {
            this.lexicalEditor.dispatchCommand(this.lexicalFormatTextCmd, 'bold');
        }
    }

    lexicalItalic() {
        if (this.lexicalEditor && this.lexicalFormatTextCmd) {
            this.lexicalEditor.dispatchCommand(this.lexicalFormatTextCmd, 'italic');
        }
    }
}
