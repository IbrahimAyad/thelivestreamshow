import React, { useEffect, useState } from 'react';
import { X, Keyboard } from 'lucide-react';

interface HelpOverlayProps {
  isVisible?: boolean;
  onClose?: () => void;
}

export const HelpOverlay: React.FC<HelpOverlayProps> = ({
  isVisible: controlledVisible,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(controlledVisible ?? false);

  useEffect(() => {
    if (controlledVisible !== undefined) {
      setIsVisible(controlledVisible);
    }
  }, [controlledVisible]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault();
        setIsVisible(prev => !prev);
        onClose?.();
      } else if (e.key === 'Escape' && isVisible) {
        setIsVisible(false);
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const shortcuts = [
    {
      category: 'Emergency Controls',
      items: [
        { key: 'B', description: 'Toggle Black Screen' },
        { key: 'T', description: 'Toggle Technical Difficulties' },
      ],
    },
    {
      category: 'Segment Navigation',
      items: [
        { key: 'S', description: 'Next Segment' },
        { key: 'N', description: 'Highlight Next Up Panel' },
      ],
    },
    {
      category: 'BetaBot Controls',
      items: [
        { key: 'Space', description: 'Play/Pause Audio' },
        { key: '→', description: 'Next Question' },
        { key: 'R', description: 'Regenerate TTS Audio' },
        { key: 'Q', description: 'Show Next Question Popup' },
      ],
    },
    {
      category: 'Overlays',
      items: [
        { key: 'L', description: 'Toggle Lower Third' },
        { key: '?', description: 'Toggle This Help' },
        { key: 'Esc', description: 'Close Dropdowns' },
      ],
    },
  ];

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  return (
    <div style={styles.overlay} onClick={handleClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={styles.titleContainer}>
            <Keyboard size={28} color="#00d9ff" />
            <h2 style={styles.title}>Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={handleClose}
            style={styles.closeButton}
            aria-label="Close help overlay"
          >
            <X size={24} />
          </button>
        </div>

        <div style={styles.content}>
          {shortcuts.map((section, idx) => (
            <div key={idx} style={styles.section}>
              <h3 style={styles.categoryTitle}>{section.category}</h3>
              <div style={styles.shortcutList}>
                {section.items.map((shortcut, itemIdx) => (
                  <div key={itemIdx} style={styles.shortcutItem}>
                    <kbd style={styles.key}>{shortcut.key}</kbd>
                    <span style={styles.description}>{shortcut.description}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={styles.footer}>
          <span style={styles.footerText}>
            Press <kbd style={styles.footerKey}>?</kbd> or <kbd style={styles.footerKey}>Esc</kbd> to close
          </span>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    animation: 'fadeIn 0.2s ease-in-out',
  },
  modal: {
    backgroundColor: '#0a1628',
    border: '2px solid #00d9ff',
    borderRadius: '16px',
    boxShadow: '0 0 40px rgba(0, 217, 255, 0.5)',
    maxWidth: '800px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto',
    animation: 'slideUp 0.3s ease-out',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px 32px',
    borderBottom: '2px solid rgba(0, 217, 255, 0.3)',
    position: 'sticky',
    top: 0,
    backgroundColor: '#0a1628',
    zIndex: 1,
  },
  titleContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  title: {
    margin: 0,
    color: '#00d9ff',
    fontSize: '28px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
  },
  closeButton: {
    background: 'transparent',
    border: '2px solid #00d9ff',
    borderRadius: '8px',
    color: '#00d9ff',
    cursor: 'pointer',
    padding: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
  },
  content: {
    padding: '32px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: '32px',
  },
  section: {
    marginBottom: '0',
  },
  categoryTitle: {
    color: '#00d9ff',
    fontSize: '18px',
    fontWeight: '700',
    marginBottom: '16px',
    marginTop: '0',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  shortcutList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  shortcutItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  key: {
    backgroundColor: '#1a2942',
    border: '2px solid #00d9ff',
    borderRadius: '6px',
    color: '#00d9ff',
    padding: '6px 12px',
    fontFamily: 'monospace',
    fontSize: '14px',
    fontWeight: '700',
    minWidth: '50px',
    textAlign: 'center',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
  },
  description: {
    color: '#e0e0e0',
    fontSize: '16px',
    flex: 1,
  },
  footer: {
    padding: '20px 32px',
    borderTop: '2px solid rgba(0, 217, 255, 0.3)',
    backgroundColor: '#0d1b2e',
    borderBottomLeftRadius: '16px',
    borderBottomRightRadius: '16px',
    textAlign: 'center',
  },
  footerText: {
    color: '#a0a0a0',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  footerKey: {
    backgroundColor: '#1a2942',
    border: '1px solid #00d9ff',
    borderRadius: '4px',
    color: '#00d9ff',
    padding: '4px 8px',
    fontFamily: 'monospace',
    fontSize: '12px',
    fontWeight: '700',
  },
};
