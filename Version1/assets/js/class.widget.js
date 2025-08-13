/* Log Viewer widget JavaScript */
class CWidgetLogviewer extends CWidget {
	onStart() {
		console.debug('[Logviewer] onStart');
		this._target.style.display = this._target.style.display || 'block';
		if (!this._target.style.getPropertyValue('--content-height')) {
			this._target.style.setProperty('--content-height', '240px');
		}
		this._events = this._events || {};
		this._events.resize = () => {
			const margin = 5;
			const padding = this.hasPadding() ? 10 : 0;
			const header_height = this._view_mode === ZBX_WIDGET_VIEW_MODE_HIDDEN_HEADER ? 0 : 33;
			const h = this._cell_height * this._pos.height - margin * 2 - padding * 2 - header_height;
			this._target.style.setProperty('--content-height', `${Math.max(120, h)}px`);
		};
		this._events.resize();

		this._content = document.createElement('div');
		this._content.id = 'logviewer-content';
		this._content.className = 'logviewer-content';
		this._content.style.cssText = 'width:100%;height:var(--content-height,240px);min-height:120px;overflow:auto;color:var(--text-color,#ddd);';
		this._content.textContent = 'Waiting for data…';
		this._target.appendChild(this._content);

		// Prepare iframe for full-document rendering
		this._iframe = document.createElement('iframe');
		this._iframe.title = 'logviewer-frame';
		this._iframe.style.cssText = 'width:100%;height:var(--content-height,240px);min-height:120px;border:0;display:none;background:transparent;';
		this._target.appendChild(this._iframe);
	}

	onActivate() {
		this._resize_observer = new ResizeObserver(this._events.resize);
		this._resize_observer.observe(this._target);
	}

	onDeactivate() {
		this._resize_observer && this._resize_observer.disconnect();
	}

	onUpdate(data) {
		console.log('[Logviewer] onUpdate', data);
		window.__logviewer_last = data;
		if (!data) return;

		let html = '';
		try {
			if (data && typeof data.value === 'string') {
				if ((data.encoding || '').toLowerCase() === 'base64') {
					const cleaned = data.value.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
					const pad = cleaned.length % 4 ? '='.repeat(4 - (cleaned.length % 4)) : '';
					const bin = atob(cleaned + pad);
					const bytes = new Uint8Array(bin.length);
					for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
					html = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
				}
				else {
					html = data.value;
				}
			}
		} catch (e) {
			console.warn('[Logviewer] decode error', e);
			html = '';
		}

		console.log('[Logviewer] decoded length', html.length, 'prefix:', (html || '').slice(0, 120));

		// Parse and strip only dangerous containers (keep <script> to re-execute below)
		let bodyHtml = html;
		try {
			const doc = new DOMParser().parseFromString(html, 'text/html');
			const body = doc && doc.body ? doc.body : null;
			if (body) {
				body.querySelectorAll('iframe, object, embed').forEach(n => n.remove());
				bodyHtml = body.innerHTML;
			}
		} catch (e) {
			console.warn('[Logviewer] HTML parse error', e);
		}

		if (this._iframe) this._iframe.style.display = 'none';
		this._content.style.display = 'block';
		this._content.innerHTML = bodyHtml && bodyHtml.trim() ? bodyHtml : (html && html.trim() ? html : '<em style="opacity:.6">(empty)</em>');

		// Try to execute inline scripts (external src will be honored by browser/CSP)
		this._executeEmbeddedScripts(this._content);
	}

	_executeEmbeddedScripts(container) {
		const scripts = Array.from(container.querySelectorAll('script'));
		for (const oldScript of scripts) {
			const newScript = document.createElement('script');
			for (const attr of oldScript.attributes) newScript.setAttribute(attr.name, attr.value);
			if (!oldScript.src) {
				newScript.textContent = oldScript.textContent;
			}
			oldScript.replaceWith(newScript);
		}
	}

	update(data) { return this.onUpdate(data); }
	render(data) { return this.onUpdate(data); }

	hasPadding() { return false; }
}

// Ensure the class is available globally for Zabbix loader
if (typeof window !== 'undefined') {
	window.CWidgetLogviewer = window.CWidgetLogviewer || CWidgetLogviewer;
}

