<?php

declare(strict_types=1);

namespace App\Controller\Admin;

use App\Entity\DemoProduct;
use EasyCorp\Bundle\EasyAdminBundle\Config\Action;
use EasyCorp\Bundle\EasyAdminBundle\Config\Actions;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\IdField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;
use LiveUX\FileManagerBundle\Bridge\EasyAdmin\FileManagerField;

/**
 * @extends AbstractCrudController<DemoProduct>
 */
final class DemoProductCrudController extends AbstractCrudController
{
    public static function getEntityFqcn(): string
    {
        return DemoProduct::class;
    }

    public function configureCrud(Crud $crud): Crud
    {
        return $crud
            ->setEntityLabelInSingular('Product')
            ->setEntityLabelInPlural('Products (LiveUX FileManagerField)')
            ->setPageTitle(Crud::PAGE_INDEX, 'Products — EasyAdmin 5 + LiveUX FileManagerField')
            ->setPageTitle(Crud::PAGE_EDIT, 'Edit Product Media')
            ->setDefaultSort(['id' => 'ASC']);
    }

    public function configureActions(Actions $actions): Actions
    {
        return $actions->add(Crud::PAGE_INDEX, Action::DETAIL);
    }

    public function configureFields(string $pageName): iterable
    {
        yield IdField::new('id')->hideOnForm();
        yield TextField::new('title', 'Product Title');

        yield FileManagerField::new('compactImage', 'Primary Photo (Compact)')
            ->setProfile('default')
            ->setTheme('bootstrap5')
            ->setVariant('compact')
            ->setMode('offcanvas')
            ->setPosition('end')
            ->setButtonLabel('Browse Media');

        yield FileManagerField::new('cardImage', 'Hero Banner (Card)')
            ->setProfile('default')
            ->setTheme('bootstrap5')
            ->setVariant('card')
            ->setMode('modal')
            ->hideOnIndex();

        yield FileManagerField::new('dropzoneImage', 'Feature Shot (Dropzone)')
            ->setProfile('default')
            ->setTheme('bootstrap5')
            ->setVariant('dropzone')
            ->setMode('offcanvas')
            ->setPosition('end')
            ->hideOnIndex();

        yield FileManagerField::new('avatarImage', 'Brand Logo (Avatar)')
            ->setProfile('default')
            ->setTheme('bootstrap5')
            ->setVariant('avatar')
            ->setMode('modal');

        yield FileManagerField::new('documentFile', 'Spec PDF (Input)')
            ->setProfile('default')
            ->setTheme('bootstrap5')
            ->setVariant('input')
            ->setMode('modal')
            ->hideOnIndex();

        yield FileManagerField::new('galleryImages', 'Product Gallery (Multi-Select)')
            ->setProfile('default')
            ->setTheme('bootstrap5')
            ->setMultiple(true)
            ->setMaxFiles(8)
            ->setVariant('card')
            ->setMode('modal')
            ->setButtonLabel('Add to Gallery');
    }
}
