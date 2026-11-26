<?php

declare(strict_types=1);

namespace App\Twig\Components;

use App\Form\LiveSlidesFormType;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Form\FormInterface;
use Symfony\UX\LiveComponent\Attribute\AsLiveComponent;
use Symfony\UX\LiveComponent\Attribute\LiveAction;
use Symfony\UX\LiveComponent\Attribute\LiveProp;
use Symfony\UX\LiveComponent\DefaultActionTrait;
use Symfony\UX\LiveComponent\LiveCollectionTrait;

#[AsLiveComponent('LiveSlidesForm')]
final class LiveSlidesFormComponent extends AbstractController
{
    use DefaultActionTrait;
    use LiveCollectionTrait;

    #[LiveProp]
    public string $fmTheme = 'bootstrap5';

    #[LiveProp]
    public string $fmLocale = 'en';

    /** @var array<string, mixed>|null */
    public ?array $savedPayload = null;

    protected function instantiateForm(): FormInterface
    {
        return $this->createForm(LiveSlidesFormType::class, [
            'slides' => [
                [
                    'title' => 'Mediterranean Summer Launch',
                    'image' => '/uploads/media/Banners/summer-campaign.webp',
                    'attachments' => ['/uploads/media/Documents/product-catalog-2026.pdf'],
                ],
                [
                    'title' => 'Nordic Matte Thermos Spotlight',
                    'image' => '/uploads/media/Products/nordic-thermos.webp',
                    'attachments' => [],
                ],
            ],
            'logos' => [
                '/uploads/media/liveux-brand-card.webp',
                '/uploads/media/Products/ceramic-mug.webp',
            ],
        ], [
            'fm_theme' => $this->fmTheme,
            'fm_locale' => $this->fmLocale,
        ]);
    }

    #[LiveAction]
    public function save(): void
    {
        $this->submitForm();
        /** @var array<string, mixed> $data */
        $data = $this->getForm()->getData();
        $this->savedPayload = $data;
    }
}
