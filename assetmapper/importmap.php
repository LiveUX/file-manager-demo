<?php

/**
 * Returns the importmap for this application.
 *
 * - "path" is a path inside the asset mapper system. Use the
 *     "debug:asset-map" command to see the full list of paths.
 *
 * - "entrypoint" (JavaScript only) set to true for any module that will
 *     be used as an "entrypoint" (and passed to the importmap() Twig function).
 *
 * The "importmap:require" command can be used to add new entries to this file.
 *
 * @return array<string, array{    // Import name as key, description of the imported file as value
 *     path: string,               // Logical, relative or absolute path to the file
 *     type?: 'js'|'css'|'json',   // Type of the file, defaults to 'js'
 *     entrypoint?: bool,          // Whether the file is an entrypoint, for 'js' only
 * }|array{
 *     version: string,            // Version of the remote package
 *     package_specifier?: string, // Remote "package-name/path" specifier, defaults to the import name
 *     type?: 'js'|'css'|'json',
 *     entrypoint?: bool,
 * }>
 */
return [
    'app' => ['path' => './assets/app.js', 'entrypoint' => true],
    '@hotwired/stimulus' => ['version' => '3.2.2'],
    '@symfony/stimulus-bundle' => ['path' => './vendor/symfony/stimulus-bundle/assets/dist/loader.js'],
    '@symfony/ux-live-component' => ['path' => './vendor/symfony/ux-live-component/assets/dist/live_controller.js'],
    '@liveux/file-manager-bundle/js/integrations/tinymce_adapter.js' => ['path' => '@liveux/file-manager-bundle/js/integrations/tinymce_adapter.js'],
    '@liveux/file-manager-bundle/js/integrations/ckeditor5_adapter.js' => ['path' => '@liveux/file-manager-bundle/js/integrations/ckeditor5_adapter.js'],
    '@liveux/file-manager-bundle/js/integrations/tiptap_adapter.js' => ['path' => '@liveux/file-manager-bundle/js/integrations/tiptap_adapter.js'],
    '@liveux/file-manager-bundle/js/integrations/quill_adapter.js' => ['path' => '@liveux/file-manager-bundle/js/integrations/quill_adapter.js'],
    '@liveux/file-manager-bundle/js/integrations/trix_adapter.js' => ['path' => '@liveux/file-manager-bundle/js/integrations/trix_adapter.js'],
    '@liveux/file-manager-bundle/js/integrations/summernote_adapter.js' => ['path' => '@liveux/file-manager-bundle/js/integrations/summernote_adapter.js'],
    '@liveux/file-manager-bundle/js/integrations/editorjs_adapter.js' => ['path' => '@liveux/file-manager-bundle/js/integrations/editorjs_adapter.js'],
    '@liveux/file-manager-bundle/js/integrations/grapesjs_adapter.js' => ['path' => '@liveux/file-manager-bundle/js/integrations/grapesjs_adapter.js'],
    '@liveux/file-manager-bundle/js/integrations/lexical_adapter.js' => ['path' => '@liveux/file-manager-bundle/js/integrations/lexical_adapter.js'],
];
