<?php

declare(strict_types=1);

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

final class EncoreDemoController extends AbstractController
{
    #[Route('/', name: 'encore_home')]
    public function index(): Response
    {
        return $this->render('encore.html.twig');
    }
}
