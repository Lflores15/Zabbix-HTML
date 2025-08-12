<?php declare(strict_types = 0);
/**
 * Log Viewer widget form view.
 *
 * @var CView $this
 * @var array $data
 */

$form = new CWidgetFormView($data);

$form
	->addField(new CWidgetFieldMultiSelectItemView($data['fields']['itemid']))
	->show();
