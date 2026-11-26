<?php

declare(strict_types=1);

namespace App\Form;

use LiveUX\FileManagerBundle\Form\FileManagerPickerType;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\Form\FormEvent;
use Symfony\Component\Form\FormEvents;
use Symfony\Component\OptionsResolver\OptionsResolver;
use Symfony\UX\LiveComponent\Form\Type\LiveCollectionType;

final class LiveSlidesFormType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $theme = is_string($options['fm_theme']) ? $options['fm_theme'] : 'bootstrap5';
        $locale = is_string($options['fm_locale']) ? $options['fm_locale'] : 'en';

        $builder
            ->add('slides', LiveCollectionType::class, [
                'label' => false,
                'entry_type' => SlideItemType::class,
                'entry_options' => [
                    'label' => false,
                    'fm_theme' => $theme,
                    'fm_locale' => $locale,
                ],
                'allow_add' => true,
                'allow_delete' => true,
                'button_add_options' => [
                    'label' => '+ Add Live Slide',
                    'attr' => ['class' => 'liveux-demo-btn is-primary'],
                ],
                'button_delete_options' => [
                    'label' => 'Remove Slide',
                    'attr' => ['class' => 'liveux-demo-btn'],
                ],
            ])
            ->add('logos', LiveCollectionType::class, [
                'label' => false,
                'entry_type' => FileManagerPickerType::class,
                'entry_options' => [
                    'label' => false,
                    'profile' => 'default',
                    'theme' => $theme,
                    'locale' => $locale,
                    'variant' => 'compact',
                    'mode' => 'offcanvas',
                    'position' => 'end',
                    'button_label' => 'Choose Asset',
                ],
                'allow_add' => true,
                'allow_delete' => true,
                'button_add_options' => [
                    'label' => '+ Add Brand Asset Row',
                    'attr' => ['class' => 'liveux-demo-btn is-primary'],
                ],
                'button_delete_options' => [
                    'label' => 'Remove',
                    'attr' => ['class' => 'liveux-demo-btn'],
                ],
            ]);

        // Normalize newly added empty scalar LiveCollection rows ([] -> '') before FileManagerPickerType HPP check
        $builder->get('logos')->addEventListener(FormEvents::PRE_SUBMIT, static function (FormEvent $event): void {
            $rows = $event->getData();
            if (is_array($rows)) {
                $event->setData(array_map(static fn (mixed $v): mixed => $v === [] ? '' : $v, $rows));
            }
        });
    }

    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([
            'fm_theme' => 'bootstrap5',
            'fm_locale' => 'en',
        ]);
    }
}
