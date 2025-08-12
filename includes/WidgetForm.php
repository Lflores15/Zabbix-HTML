<?php declare(strict_types = 0);

namespace Widgets\Logviewer\Includes;

use Zabbix\Widgets\{CWidgetForm, CWidgetField};
use Zabbix\Widgets\Fields\{CWidgetFieldMultiSelectItem};

class WidgetForm extends CWidgetForm {
	public function addFields(): self {
		return $this->addField(
			(new CWidgetFieldMultiSelectItem('itemid', _('Item')))
				->setFlags(CWidgetField::FLAG_NOT_EMPTY | CWidgetField::FLAG_LABEL_ASTERISK)
				->setMultiple(false)
		);
	}
}
