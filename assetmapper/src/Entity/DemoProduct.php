<?php

declare(strict_types=1);

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'demo_product')]
class DemoProduct
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 160)]
    private string $title = 'LiveUX Demo Product';

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $compactImage = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $cardImage = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $dropzoneImage = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $avatarImage = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $documentFile = null;

    /** @var list<string> */
    #[ORM\Column(type: Types::JSON)]
    private array $galleryImages = [];

    public function getId(): ?int { return $this->id; }
    public function getTitle(): string { return $this->title; }
    public function setTitle(string $title): self { $this->title = $title; return $this; }
    public function getCompactImage(): ?string { return $this->compactImage; }
    public function setCompactImage(?string $compactImage): self { $this->compactImage = $compactImage; return $this; }
    public function getCardImage(): ?string { return $this->cardImage; }
    public function setCardImage(?string $cardImage): self { $this->cardImage = $cardImage; return $this; }
    public function getDropzoneImage(): ?string { return $this->dropzoneImage; }
    public function setDropzoneImage(?string $dropzoneImage): self { $this->dropzoneImage = $dropzoneImage; return $this; }
    public function getAvatarImage(): ?string { return $this->avatarImage; }
    public function setAvatarImage(?string $avatarImage): self { $this->avatarImage = $avatarImage; return $this; }
    public function getDocumentFile(): ?string { return $this->documentFile; }
    public function setDocumentFile(?string $documentFile): self { $this->documentFile = $documentFile; return $this; }
    /** @return list<string> */
    public function getGalleryImages(): array { return $this->galleryImages; }
    /** @param list<string> $galleryImages */
    public function setGalleryImages(array $galleryImages): self { $this->galleryImages = array_values($galleryImages); return $this; }
}
