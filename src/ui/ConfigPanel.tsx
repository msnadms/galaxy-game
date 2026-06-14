import { useState } from 'react';
import { useUIStore } from '../store/uiStore';
import './ConfigPanel.css';

export function ConfigPanel() {
  const [expanded, setExpanded] = useState(false);
  const showHyperlanes = useUIStore((s) => s.showHyperlanes);
  const toggleHyperlanes = useUIStore((s) => s.toggleHyperlanes);

  return (
    <div className="config-panel">
      <button
        className="config-header"
        onClick={() => setExpanded((e) => !e)}
        title="Settings"
      >
        <span className="config-icon">⚙</span>
        <span className="config-label">Settings</span>
        <span className="config-chevron">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="config-body">
          <label className="config-row">
            <span className="config-row-label">Hyperlanes</span>
            <input
              type="checkbox"
              className="config-toggle-checkbox"
              checked={showHyperlanes}
              onChange={toggleHyperlanes}
            />
            <div className={`config-toggle ${showHyperlanes ? 'on' : 'off'}`} aria-hidden="true">
              <div className="config-toggle-thumb" />
            </div>
          </label>
        </div>
      )}
    </div>
  );
}
