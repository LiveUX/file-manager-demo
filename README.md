# LiveUX FileManagerBundle — Official Demo Applications

Four complete, ready-to-run Symfony showcase applications demonstrating **LiveUX FileManagerBundle** across **Symfony 6.4 LTS**, **Symfony 7.4 LTS**, and **Symfony 8.1** with both **AssetMapper** and **Webpack Encore**.

- **Main Bundle Repository:** [LiveUX/file-manager-bundle](https://github.com/LiveUX/file-manager-bundle)
- **License:** MIT

---

## Included Demo Applications

| Directory | Symfony Version | Asset Pipeline | EasyAdmin | Default Local URL |
| :--- | :--- | :--- | :--- | :--- |
| [`symfony64/`](symfony64/) | **Symfony 6.4 LTS** | AssetMapper (Zero-Build) | EasyAdmin 4 | `http://127.0.0.1:8093` |
| [`symfony7/`](symfony7/) | **Symfony 7.4 LTS** | AssetMapper (Zero-Build) | EasyAdmin 4 | `http://127.0.0.1:8094` |
| [`assetmapper/`](assetmapper/) | **Symfony 8.1** | AssetMapper (Zero-Build) | EasyAdmin 5 | `http://127.0.0.1:8091` |
| [`encore/`](encore/) | **Symfony 8.1** | Webpack Encore | EasyAdmin 5 | `http://127.0.0.1:8092` |

---

## What Every Demo Showcases

Every demo app includes the exact same full feature matrix:

| Route | Feature Showcase |
| :--- | :--- |
| `/` | Inline File Browser with live switchers for **9 Themes**, **6 SVG Icon Sets**, **12 Languages** (including **Native Arabic RTL** `/?locale=ar`), and **Light / Dark Mode** |
| `/forms` | `FileManagerPickerType` with all **5 variants** (`compact`, `card`, `dropzone`, `avatar`, `input`) + reorderable Multi-File Gallery persisted to SQLite via Doctrine ORM |
| `/collections` | Dynamic Symfony `CollectionType` & **Symfony UX `LiveCollectionType`** (AJAX Idiomorph live add/remove rows) |
| `/editors` | All **9 built-in zero-dependency editors**: TinyMCE 5/6/7/8, CKEditor 5, Tiptap 2, Quill 2, Trix, Summernote, Editor.js, GrapesJS, and Meta Lexical |
| `/modals` | Native HTML5 `<dialog>` Top-Layer Modal & 4-direction OffCanvas (`start`, `end`, `top`, `bottom`) + `window.LiveUXFileManager.open()` Promise API |
| `/mobile-studio` | Interactive `390×844` mobile viewport showcasing responsive touch topbar, slide-in folder drawer, fullscreen modal & native bottom sheet |
| `/admin` | **EasyAdmin 4 / 5** CRUD with native `FileManagerField` (single & multi-file gallery) |

---

## Requirements

- **PHP 8.3+** (`ext-dom`, `ext-fileinfo`, `ext-libxml`, `ext-pdo_sqlite`, optional `ext-gd` / `ext-zip`)
- **Composer 2.x**
- **Node.js 20+ & npm** *(only required for the `encore/` Webpack Encore demo)*

---

## Quick Start

### 1. Symfony 6.4 LTS (AssetMapper + EasyAdmin 4)

```bash
cd symfony64
composer install
php bin/console doctrine:schema:create
php -S 127.0.0.1:8093 -t public
```

Open `http://127.0.0.1:8093` in your browser.

---

### 2. Symfony 7.4 LTS (AssetMapper + EasyAdmin 4)

```bash
cd symfony7
composer install
php bin/console doctrine:schema:create
php -S 127.0.0.1:8094 -t public
```

Open `http://127.0.0.1:8094` in your browser.

---

### 3. Symfony 8.1 (AssetMapper + EasyAdmin 5)

```bash
cd assetmapper
composer install
php bin/console doctrine:schema:create
php -S 127.0.0.1:8091 -t public
```

Open `http://127.0.0.1:8091` in your browser.

---

### 4. Symfony 8.1 (Webpack Encore + EasyAdmin 5)

```bash
cd encore
composer install
npm install
npm run build
php bin/console doctrine:schema:create
php -S 127.0.0.1:8092 -t public
```

Open `http://127.0.0.1:8092` in your browser.

---

## Using Packagist vs. Local Path Repository

By default, these demos can either install `liveux/file-manager-bundle` from Packagist or point to a local checkout during bundle development:

- **From Packagist (recommended for standalone clone):** Remove the `"repositories"` block in `composer.json` and require `"liveux/file-manager-bundle": "^0.1"`.
- **Local Bundle Development:** Keep the `"type": "path"` repository pointing to your local `liveux-file-manager-bundle` checkout (`"symlink": true`).

---

## Useful Demo Query Parameters

You can link directly to any theme, icon set, language, or color scheme:

- Arabic RTL: `http://127.0.0.1:8091/?locale=ar`
- Japanese + Dark Mode + shadcn: `http://127.0.0.1:8091/?theme=shadcn&scheme=dark&locale=ja`
- GrapesJS Editor: `http://127.0.0.1:8091/editors?editor=grapesjs`
- Meta Lexical Editor: `http://127.0.0.1:8091/editors?editor=lexical`
- EasyAdmin CRUD: `http://127.0.0.1:8091/admin`

---

## License

MIT License.
