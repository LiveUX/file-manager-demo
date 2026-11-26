<?php

declare(strict_types=1);

namespace App\Form;

use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\CollectionType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;

final class StandardCollectionFormType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder->add('slides', CollectionType::class, [
            'label' => false,
            'entry_type' => SlideItemType::class,
            'entry_options' => [
                'label' => false,
                'fm_theme' => $options['fm_theme'],
                'fm_locale' => $options['fm_locale'],
            ],
            'allow_add' => true,
            'allow_delete' => true,
            'prototype' => true,
            'by_reference' => false,
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
