<?php

namespace IIIFStorage\Media;

use Digirati\OmekaShared\Framework\AbstractIngester;
use Omeka\Form\Element\Ckeditor;
use Omeka\Media\Ingester\IngesterInterface;
use Omeka\Stdlib\ErrorStore;
use Omeka\Stdlib\HtmlPurifier;
use Zend\Form\Element;
use Zend\View\Renderer\PhpRenderer;

class HtmlIngester extends AbstractIngester implements IngesterInterface
{

    /**
     * @var HtmlPurifier
     */
    private $htmlPurifier;

    public function __construct(HtmlPurifier $htmlPurifier)
    {
        $this->htmlPurifier = $htmlPurifier;
    }

    /**
     * @param string $operation either "create" or "update"
     * @return Element[]
     * @throws \Exception
     */
    public function getFormElements(string $operation): array
    {

        return [
            (new Ckeditor('html'))
                ->setOptions([
                    'label' => 'HTML', // @translate
                    'info' => 'HTML or plain text.', // @translate
                ])
                ->setAttributes([
                    'rows' => 15,
                    'id' => 'media-html-' . bin2hex(random_bytes(10)),
                    'class' => 'media-html',
                ]),
            $this->getLocaleField(),
            $this->getSiteRolesField(),
        ];
    }

    public function prepareData(array &$data, ErrorStore $errorStore)
    {
        $html = isset($data['html']) ? $this->htmlPurifier->purify($data['html']) : '';
        $data['html'] = $html;
    }

    /**
     * @param PhpRenderer $view
     * @param array $formElements
     * @return string
     */
    public function renderFormElements(PhpRenderer $view, array $formElements)
    {
        $view->ckEditor();
        return parent::renderFormElements($view, $formElements); // TODO: Change the autogenerated stub
    }

    /**
     * Get a human-readable label for this ingester.
     *
     * @return string
     */
    public function getLabel()
    {
        return 'HTML';
    }

    /**
     * Get the name of the renderer for media ingested by this ingester
     *
     * @return string
     */
    public function getRenderer()
    {
        return 'html';
    }
}