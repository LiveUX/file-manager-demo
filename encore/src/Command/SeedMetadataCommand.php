<?php

declare(strict_types=1);

namespace App\Command;

use LiveUX\FileManagerBundle\Config\ConfigProviderInterface;
use LiveUX\FileManagerBundle\Metadata\FolderMetadata;
use LiveUX\FileManagerBundle\Metadata\FolderMetadataStorageInterface;
use LiveUX\FileManagerBundle\Security\PathNormalizer;
use LiveUX\FileManagerBundle\Storage\VolumeRegistry;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(name: 'app:seed-metadata', description: 'Seeds colorful folders and SEO metadata for the demo.')]
final class SeedMetadataCommand extends Command
{
    public function __construct(
        private readonly ConfigProviderInterface $configProvider,
        private readonly VolumeRegistry $volumeRegistry,
        private readonly PathNormalizer $pathNormalizer,
        private readonly FolderMetadataStorageInterface $metadataStorage,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $profile = $this->configProvider->getProfile('default');
        $volume = $this->volumeRegistry->getVolumeForProfile($profile, 'media_library');

        $entries = [
            'Products' => new FolderMetadata(color: '#2563eb', icon: 'bag', pinned: true),
            'Banners' => new FolderMetadata(color: '#7c3aed', icon: 'image', pinned: true),
            'Documents' => new FolderMetadata(color: '#0d9488', icon: 'doc', pinned: false),
            'Icons' => new FolderMetadata(color: '#d97706', icon: 'star', pinned: false),
            'nordic-thermos.webp' => new FolderMetadata(
                alt: 'Matte cobalt insulated stainless steel thermos 500ml',
                title: 'Nordic Matte Thermos Pro',
                caption: 'Double-wall vacuum insulated bottle in cobalt blue finish.',
                tags: ['thermos', 'cobalt', 'product', 'featured'],
                focalPoint: ['x' => 0.50, 'y' => 0.42],
            ),
            'summer-campaign.webp' => new FolderMetadata(
                alt: 'Summer Collection 2026 hero campaign banner',
                title: 'Summer Campaign 2026 Hero',
                caption: 'WebP-optimized 1200x630 promotional banner.',
                tags: ['banner', 'campaign', '2026', 'hero'],
                focalPoint: ['x' => 0.48, 'y' => 0.45],
            ),
        ];

        foreach ($entries as $path => $meta) {
            $key = $this->pathNormalizer->buildCanonicalKey($volume, $path, $profile->basePath);
            $this->metadataStorage->save($key, $meta);
        }

        $output->writeln('<info>Seeded folder colors, badges & file SEO metadata into Doctrine SQLite.</info>');

        return Command::SUCCESS;
    }
}
