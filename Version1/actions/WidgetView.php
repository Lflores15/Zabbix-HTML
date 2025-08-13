<?php declare(strict_types = 0);

namespace Widgets\Logviewer\Actions;

use CControllerDashboardWidgetView;

class WidgetView extends CControllerDashboardWidgetView {
    protected function doAction(): void {
        $payload = [
            'name' => 'Log Viewer',
            'info' => [],
            'user' => ['debug_mode' => 0],
            'value' => '',
            'encoding' => 'base64'
        ];

        try {
            $itemid = null;

            if (isset($this->fields_values['itemid'])) {
                $v = $this->fields_values['itemid'];
                if (is_array($v)) { $first = reset($v); if ($first !== null && $first !== '') { $itemid = (string) $first; } }
                elseif (is_scalar($v) && $v !== '') { $itemid = (string) $v; }
            }

            if (!$itemid && isset($_REQUEST['fields']['itemid'])) {
                $fi = $_REQUEST['fields']['itemid'];
                if (is_array($fi)) { $first = reset($fi); if (is_array($first)) { $first = reset($first); } if ($first !== null && $first !== '') { $itemid = (string) $first; } }
                elseif (is_scalar($fi) && $fi !== '') { $itemid = (string) $fi; }
            }
            if (!$itemid && !empty($_REQUEST['itemid'])) { $itemid = (string) $_REQUEST['itemid']; }

            if ($itemid && class_exists('API')) {
                try {
                    $items = \API::Item()->get([
                        'itemids' => [$itemid],
                        'output' => ['lastvalue', 'value_type'],
                        'webitems' => true
                    ]);

                    if ($items) {
                        $item = $items[0];
                        if (isset($item['lastvalue']) && $item['lastvalue'] !== '') {
                            $payload['value'] = base64_encode((string) $item['lastvalue']);
                        }
                        else {
                            $history_type = isset($item['value_type']) ? (int) $item['value_type'] : 4;
                            $history = \API::History()->get([
                                'itemids' => [$itemid],
                                'history' => $history_type,
                                'sortfield' => 'clock',
                                'sortorder' => 'DESC',
                                'limit' => 1
                            ]);
                            if ($history && isset($history[0]['value'])) {
                                $payload['value'] = base64_encode((string) $history[0]['value']);
                            }
                        }
                    }
                }
                catch (\Throwable $e) {
                    $payload['error'] = 'API error';
                }
            }
        }
        catch (\Throwable $e) {
            $payload['error'] = 'Controller error';
        }

        // Wrap in { data: ... } envelope expected by jsLoader
        $response = ['data' => $payload];

        while (ob_get_level() > 0) { @ob_end_clean(); }
        if (!headers_sent()) {
            header('Content-Type: application/json; charset=utf-8');
            header('Cache-Control: no-store');
        }
        echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
}

