<?php

declare(strict_types=1);

namespace App\Controller\Admin;

use App\Entity\DemoProduct;
use EasyCorp\Bundle\EasyAdminBundle\Attribute\AdminDashboard;
use EasyCorp\Bundle\EasyAdminBundle\Config\Assets;
use EasyCorp\Bundle\EasyAdminBundle\Config\Dashboard;
use EasyCorp\Bundle\EasyAdminBundle\Config\MenuItem;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractDashboardController;
use EasyCorp\Bundle\EasyAdminBundle\Router\AdminUrlGenerator;
use Symfony\Component\HttpFoundation\Response;

#[AdminDashboard(routePath: '/admin', routeName: 'admin')]
final class DashboardController extends AbstractDashboardController
{
    public function index(): Response
    {
        /** @var AdminUrlGenerator $urlGenerator */
        $urlGenerator = $this->container->get(AdminUrlGenerator::class);

        return $this->redirect(
            $urlGenerator->setController(DemoProductCrudController::class)->generateUrl(),
        );
    }

    public function configureDashboard(): Dashboard
    {
        return Dashboard::new()
            ->setTitle('<span style="font-weight:800; color:#2563eb;">LiveUX</span> EasyAdmin 5 Demo')
            ->setFaviconPath('/images/liveux-logo.webp');
    }

    public function configureAssets(): Assets
    {
        return Assets::new()
            ->addAssetMapperEntry('app');
    }

    public function configureMenuItems(): iterable
    {
        yield MenuItem::section('FileManagerField CRUD');
        yield MenuItem::linkTo(DemoProductCrudController::class, 'Demo Products', 'fa fa-box');

        yield MenuItem::section('Back to Showcase');
        yield MenuItem::linkToUrl('Inline Browser', 'fa fa-folder-open', '/');
        yield MenuItem::linkToUrl('FormType Pickers', 'fa fa-images', '/forms');
        yield MenuItem::linkToUrl('Collection & LiveCollection', 'fa fa-layer-group', '/collections');
        yield MenuItem::linkToUrl('WYSIWYG Editors', 'fa fa-pen-nib', '/editors');
        yield MenuItem::linkToUrl('Modal & OffCanvas', 'fa fa-window-restore', '/modals');
    }
}
