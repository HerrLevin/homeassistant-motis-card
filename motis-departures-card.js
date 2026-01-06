class MotisDeparturesCard extends HTMLElement {
  setConfig(config) {
    if (!config) throw new Error('No configuration provided');
    this._config = config;
    this._entities = [];
    if (config.entities && Array.isArray(config.entities)) {
      this._entities = config.entities.slice(0);
    } else if (config.entity) {
      this._entities = [config.entity];
    }

    if (!this._entities.length) throw new Error('You must define at least one `entity` or an `entities` array');

    this.attachShadow({ mode: 'open' });
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  getCardSize() {
    // Rough estimate for Lovelace
    return 3 + (this._entities ? this._entities.length : 0);
  }

  _render() {
    if (!this.shadowRoot || !this._hass) return;

    const style = `
      :host { font-family: var(--paper-font-body1_-_font-family, Roboto, 'Noto Sans', 'Helvetica Neue', Arial); display: block; }
      ha-card { padding: 12px; box-sizing: border-box; }
      .title { font-weight: 500; margin-bottom: 8px; font-size: 16px; }
      .list { display: flex; flex-direction: column; gap: 8px; }
      .row { display:flex; align-items:center; gap:12px; }
      .time { min-width:56px; font-weight:600; font-size:14px; }
      .meta { display:flex; flex-direction:column; }
      .destination { font-size:14px; }
      .destination .dest { color: var(--primary-text-color); }
      .destination .platform { color: var(--secondary-text-color); font-size:12px; }
      .chip { padding:4px 8px; border-radius:12px; font-weight:600; font-size:12px; display:inline-block; min-width:36px; text-align:center; }
      .empty { color: var(--secondary-text-color); }
      @keyframes blink {
            0% {
                opacity: 1;
            }

            50% {
                opacity: 0;
            }

            100% {
                opacity: 1;
            }
        }
        .blinking-text {
            animation: blink 1s infinite;
        }
    `;

    const title = this._config.title || 'Next departures';

    const items = this._entities
      .map((entId) => this._hass.states[entId])
      .filter(Boolean)
      .map((state) => {
        const attrs = state.attributes || {};
        const label = attrs.label || attrs.route || attrs.display_name || '';
        const dest = attrs.destination || attrs.headsign || '';
        const platform = attrs.platform || '';
        const plannedTime = attrs.planned_time || null;
        const realTime = attrs.realtime_time || null;
        const time = state.attributes && state.attributes.realtime_time_local ? state.attributes.realtime_time_local : (state.state && state.state.length ? (new Date(state.state).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})) : state.state);
        const hasRealTime = attrs.realtime || false;
        const until = attrs.time_until_departure || '';
        const cancelled = attrs.cancelled ? true : false;
        const routeColor = (attrs.route_color && attrs.route_color.startsWith('#')) ? attrs.route_color : (attrs.route_color ? ('#' + attrs.route_color) : '#ffffff');
        const routeTextColor = (attrs.route_text_color && attrs.route_text_color.startsWith('#')) ? attrs.route_text_color : (attrs.route_text_color ? ('#' + attrs.route_text_color) : '#000000');

        let delay = null;
        if (plannedTime && realTime && hasRealTime) {
            const plannedDate = new Date(plannedTime);
            const realDate = new Date(realTime);
            delay = Math.round((realDate - plannedDate) / 60000); // delay in minutes
        }

        return { id: state.entity_id, label, dest, platform, time, until, cancelled, routeColor, routeTextColor, delay };
      });

    let content = `\n      <ha-card>\n        <div class="title">${this._escapeHtml(title)}</div>\n`;

    if (!items.length) {
      content += `<div class="empty">No departures available</div>`;
    } else {
      content += `<div class="list">`;
      for (const it of items) {
        const chipStyle = `background:${it.routeColor}; color:${it.routeTextColor};`;
        const delayColor = it.delay === null ? null : (it.delay > 2 ? '#ff0000' : '#00aa00');
        const delayStyle = delayColor ? `color:${delayColor}; font-weight:600; font-size: 10px;` : '';
        let delay = '';
        if (it.delay !== null) {
          delay = `<span style="${delayStyle}">(${it.delay > 0 ? '+' : ''}${it.delay} min)</span>`;
        }
        const blinkingText = it.until && isNaN(parseInt(it.until.charAt(0))) ? '.blinking-text' : '';
        const cancelledBadge = it.cancelled ? ' (cancelled)' : '';
        content += `
        <div class="row">
            <div class="time">${this._escapeHtml(it.time || '')}</div>
            <div class="chip" style="${chipStyle}">${this._escapeHtml(it.label || '')}</div>
            <div class="meta">
                <div class="destination">
                    <span class="dest">${this._escapeHtml(it.dest || '')}</span>
                    <span style="font-weight:400">${this._escapeHtml(cancelledBadge)}</span>
                </div>
                <div class="platform">
                    ${this._escapeHtml(it.platform || '')}
                    <span style="color: ${delayColor}" class="${blinkingText}">${it.until ? ' Â· ' + this._escapeHtml(it.until) : ''}</span>
                    ${delay}
                </div>
            </div>
        </div>`;
      }
      content += `</div>`;
    }

    content += `</ha-card>`;

    this.shadowRoot.innerHTML = `<style>${style}</style>${content}`;
  }

  _escapeHtml(str) {
    if (!str && str !== 0) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

customElements.define('motis-departures-card', MotisDeparturesCard);


