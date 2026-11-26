<?php

declare(strict_types=1);

namespace App\Form;

use LiveUX\FileManagerBundle\Form\FileManagerPickerType;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;

final class SlideItemType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $theme = is_string($options['fm_theme']) ? $options['fm_theme'] : 'bootstrap5';
        $locale = is_string($options['fm_locale']) ? $options['fm_locale'] : 'en';

        $builder
            ->add('title', TextType::class, [
                'label' => 'Slide Title',
                'required' => false,
                'attr' => ['placeholder' => 'e.g. Summer Hero Slide', 'class' => 'liveux-demo-input'],
            ])
            ->add('image', FileManagerPickerType::class, [
                'label' => 'Slide Cover Image',
                'required' => false,
                'profile' => 'default',
                'theme' => $theme,
                'locale' => $locale,
                'variant' => 'compact',
                'mode' => 'offcanvas',
                'position' => 'end',
                'button_label' => 'Select Image',
            ])
            ->add('attachments', FileManagerPickerType::class, [
                'label' => 'Additional Assets (Multiple)',
                'required' => false,
                'profile' => 'default',
                'theme' => $theme,
                'locale' => $locale,
                'multiple' => true,
                'max_files' => 4,
                'variant' => 'input',
                'mode' => 'modal',
                'button_label' => 'Add Files',
            ]);
    }

    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([
            'fm_theme' => 'bootstrap5',
            'fm_locale' => 'en',
        ]);
    }
}
