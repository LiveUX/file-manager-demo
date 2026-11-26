<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\DemoProduct;
use App\Form\DemoProductType;
use App\Form\StandardCollectionFormType;
use Doctrine\ORM\EntityManagerInterface;
use LiveUX\FileManagerBundle\Icon\IconSetRegistry;
use LiveUX\FileManagerBundle\Theme\FileManagerThemes;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

final class DemoController extends AbstractController
{
    public function __construct(
        private readonly IconSetRegistry $iconSetRegistry,
    ) {
    }

    #[Route('/', name: 'demo_browser')]
    public function browser(Request $request): Response
    {
        return $this->render('demo/browser.html.twig', $this->buildViewParams($request, 'browser'));
    }

    #[Route('/forms', name: 'demo_forms')]
    public function forms(Request $request, EntityManagerInterface $em): Response
    {
        $params = $this->buildViewParams($request, 'forms');
        $this->seedSampleProductsIfNeeded($em);

        /** @var DemoProduct $product */
        $product = $em->getRepository(DemoProduct::class)->findOneBy([], ['id' => 'ASC']);

        $form = $this->createForm(DemoProductType::class, $product, [
            'fm_theme' => $params['activeTheme'],
            'fm_locale' => $params['activeLocale'],
        ]);
        $form->handleRequest($request);

        $saved = false;
        if ($form->isSubmitted() && $form->isValid()) {
            $em->flush();
            $saved = true;
        }

        return $this->render('demo/forms.html.twig', [
            ...$params,
            'form' => $form->createView(),
            'product' => $product,
            'saved' => $saved,
        ]);
    }

    #[Route('/collections', name: 'demo_collections')]
    public function collections(Request $request): Response
    {
        $params = $this->buildViewParams($request, 'collections');
        $standardForm = $this->createForm(StandardCollectionFormType::class, [
            'slides' => [
                [
                    'title' => 'Chronograph Watch Edition',
                    'image' => '/uploads/media/Products/chronograph-watch.webp',
                    'attachments' => ['/uploads/media/Documents/product-catalog-2026.pdf'],
                ],
                [
                    'title' => 'Minimalist Workspace Flatlay',
                    'image' => '/uploads/media/Products/wireless-charger.webp',
                    'attachments' => [],
                ],
            ],
        ], [
            'fm_theme' => $params['activeTheme'],
            'fm_locale' => $params['activeLocale'],
        ]);
        $standardForm->handleRequest($request);

        $standardSubmitted = null;
        if ($standardForm->isSubmitted() && $standardForm->isValid()) {
            $standardSubmitted = $standardForm->getData();
        }

        return $this->render('demo/collections.html.twig', [
            ...$params,
            'standardForm' => $standardForm->createView(),
            'standardSubmitted' => $standardSubmitted,
        ]);
    }

    #[Route('/editors', name: 'demo_editors')]
    public function editors(Request $request): Response
    {
        $params = $this->buildViewParams($request, 'editors');
        $rawEditor = $request->query->getString('editor', 'tinymce');
        $allowed = ['tinymce', 'ckeditor5', 'tiptap', 'quill', 'trix', 'summernote', 'editorjs', 'grapesjs', 'lexical'];
        $activeEditor = in_array($rawEditor, $allowed, true) ? $rawEditor : 'tinymce';

        return $this->render('demo/editors.html.twig', [
            ...$params,
            'activeEditor' => $activeEditor,
        ]);
    }

    #[Route('/modals', name: 'demo_modals')]
    public function modals(Request $request): Response
    {
        return $this->render('demo/modals.html.twig', $this->buildViewParams($request, 'modals'));
    }

    #[Route('/banner-studio', name: 'demo_banner')]
    public function bannerStudio(Request $request): Response
    {
        $mode = $request->query->getString('mode', 'light') === 'dark' ? 'dark' : 'light';

        return $this->render('demo/banner_studio.html.twig', [
            'mode' => $mode,
        ]);
    }

    #[Route('/mobile-studio', name: 'demo_mobile_studio')]
    public function mobileStudio(Request $request): Response
    {
        return $this->render('demo/mobile_studio.html.twig', $this->buildViewParams($request, 'mobile'));
    }

    private function seedSampleProductsIfNeeded(EntityManagerInterface $em): void
    {
        $repo = $em->getRepository(DemoProduct::class);
        if ($repo->count([]) >= 3) {
            return;
        }

        if ($repo->count([]) === 0) {
            $em->persist(
                (new DemoProduct())
                    ->setTitle('Nordic Matte Thermos Pro')
                    ->setCompactImage('/uploads/media/Products/nordic-thermos.webp')
                    ->setCardImage('/uploads/media/Banners/summer-campaign.webp')
                    ->setDropzoneImage('/uploads/media/Products/ceramic-mug.webp')
                    ->setAvatarImage('/uploads/brand/liveux-logo.webp')
                    ->setDocumentFile('/uploads/media/Documents/product-catalog-2026.pdf')
                    ->setGalleryImages([
                        '/uploads/media/Products/nordic-thermos.webp',
                        '/uploads/media/Products/ceramic-mug.webp',
                        '/uploads/media/Products/leather-notebook.webp',
                        '/uploads/media/Banners/summer-campaign.webp',
                    ]),
            );
        }

        $em->persist(
            (new DemoProduct())
                ->setTitle('Artisan Seafoam Ceramic Mug')
                ->setCompactImage('/uploads/media/Products/ceramic-mug.webp')
                ->setCardImage('/uploads/media/Banners/botanical-studio.webp')
                ->setDropzoneImage('/uploads/media/Products/wireless-charger.webp')
                ->setAvatarImage('/uploads/media/liveux-brand-card.webp')
                ->setDocumentFile('/uploads/media/Documents/product-catalog-2026.pdf')
                ->setGalleryImages([
                    '/uploads/media/Products/ceramic-mug.webp',
                    '/uploads/media/Banners/botanical-studio.webp',
                ]),
        );

        $em->persist(
            (new DemoProduct())
                ->setTitle('Executive Cognac Notebook A5')
                ->setCompactImage('/uploads/media/Products/leather-notebook.webp')
                ->setCardImage('/uploads/media/Banners/enterprise-cloud.webp')
                ->setDropzoneImage('/uploads/media/Products/chronograph-watch.webp')
                ->setAvatarImage('/uploads/brand/liveux-logo.webp')
                ->setDocumentFile('/uploads/media/Documents/product-catalog-2026.pdf')
                ->setGalleryImages([
                    '/uploads/media/Products/leather-notebook.webp',
                    '/uploads/media/Products/chronograph-watch.webp',
                    '/uploads/media/Products/wireless-charger.webp',
                ]),
        );

        $em->flush();
    }

    /**
     * @return array<string, mixed>
     */
    private function buildViewParams(Request $request, string $activePage): array
    {
        $theme = FileManagerThemes::sanitizeDynamic($request->query->get('theme')) ?? 'bootstrap5';
        $rawIcon = $request->query->getString('icon_set', 'windows11');
        $iconSet = $this->iconSetRegistry->isBuiltinSet($rawIcon) ? $rawIcon : 'windows11';
        $supportedLocales = ['en', 'tr', 'fr', 'de', 'es', 'ar', 'it', 'pt', 'nl', 'pl', 'ja', 'zh_CN'];
        $rawLocale = $request->query->getString('locale', 'en');
        $locale = in_array($rawLocale, $supportedLocales, true) ? $rawLocale : 'en';
        $scheme = $request->query->getString('scheme', 'light') === 'dark' ? 'dark' : 'light';

        return [
            'activePage' => $activePage,
            'activeTheme' => $theme,
            'activeIconSet' => $iconSet,
            'activeLocale' => $locale,
            'activeScheme' => $scheme,
            'themes' => FileManagerThemes::ALL,
            'iconSets' => $this->iconSetRegistry->getAvailableSets(),
            'locales' => $supportedLocales,
        ];
    }
}
