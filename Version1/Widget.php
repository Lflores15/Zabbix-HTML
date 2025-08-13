<?php declare(strict_types = 0);

namespace Widgets\Logviewer;

use Zabbix\Core\CWidget;

class Widget extends CWidget {
    public function getDefaultName(): string {
        return _(message: 'Log Viewer');
    }
}