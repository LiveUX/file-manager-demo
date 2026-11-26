<?php

declare(strict_types=1);

namespace App\Form;

use App\Entity\DemoProduct;
use LiveUX\FileManagerBundle\Form\FileManagerPickerType;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;

final class DemoProductType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $theme = is_string($options['fm_theme']) ? $options['fm_theme'] : 'bootstrap5';
        $locale = is_string($options['fm_locale']) ? $options['fm_locale'] : 'en';

        $builder
            ->add('title', TextType::class, ['label' => 'Product Title'])
            ->add('compactImage', FileManagerPickerType::class, [
                'label' => 'Compact Variant (OffCanvas)',
                'profile' => 'default',
                'theme' => $theme,
                'locale' => $locale,
                'variant' => 'compact',
                'mode' => 'offcanvas',
                'position' => 'end',
            ])
            ->add('cardImage', FileManagerPickerType::class, [
                'label' => 'Card Variant (Cover Image)',
                'profile' => 'default',
                'theme' => $theme,
                'locale' => $locale,
                'variant' => 'card',
                'mode' => 'modal',
            ])
            ->add('dropzoneImage', FileManagerPickerType::class, [
                'label' => 'Dropzone Variant (Hero Banner)',
                'profile' => 'default',
                'theme' => $theme,
                'locale' => $locale,
                'variant' => 'dropzone',
                'mode' => 'modal',
            ])
            ->add('avatarImage', FileManagerPickerType::class, [
                'label' => 'Avatar Variant (Brand Logo)',
                'profile' => 'default',
                'theme' => $theme,
                'locale' => $locale,
                'variant' => 'avatar',
                'mode' => 'modal',
            ])
            ->add('documentFile', FileManagerPickerType::class, [
                'label' => 'Input Variant (PDF / Spec Sheet)',
                'profile' => 'default',
                'theme' => $theme,
                'locale' => $locale,
                'variant' => 'input',
                'mode' => 'modal',
            ])
            ->add('galleryImages', FileManagerPickerType::class, [
                'label' => 'Multi-Select Gallery (Drag / Keyboard / Touch Reorder)',
                'profile' => 'default',
                'theme' => $theme,
                'locale' => $locale,
                'variant' => 'compact',
                'multiple' => true,
                'max_files' => 8,
                'mode' => 'modal',
            ]);
    }

    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([
            'data_class' => DemoProduct::class,
            'fm_theme' => 'bootstrap5',
            'fm_locale' => 'en',
        ]);
    }
}
