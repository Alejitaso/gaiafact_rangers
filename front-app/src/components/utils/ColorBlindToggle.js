// components/utils/ColorBlindToggle.js
import React, { useState, useEffect } from 'react';
import styles from './ColorBlindToggle.module.css';

// Definición de los modos de daltonismo disponibles
const COLOR_MODES = {
  normal: 'Normal',
  protanopia: 'Protanopia',
  deuteranopia: 'Deuteranopia',
  tritanopia: 'Tritanopia',
};

const STORAGE_KEY = 'colorblind-mode';

// Componente para alternar modos de color para daltonismo
const ColorBlindToggle = () => {
  const [mode, setMode] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || 'normal';
  });

  const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        document.body.className = '';
        if (mode !== 'normal') {
            document.body.classList.add(`colorblind-${mode}`);
        }
    }, [mode]);

  const handleSetMode = (newMode) => {
    setMode(newMode);
    localStorage.setItem(STORAGE_KEY, newMode);
    setIsOpen(false);
  };

  // Renderizado del componente
  return (
    <div className={styles.colorblindToggleWrapper}>
      <button
        className={styles.colorblindBtn}
        onClick={() => setIsOpen(!isOpen)}
        title="Adaptar colores para daltonismo"
        aria-label="Cambiar modo de color para daltonismo"
      >
        🎨
      </button>

      {isOpen && (
        <div className={styles.colorblindMenu}>
          {Object.entries(COLOR_MODES).map(([key, label]) => (
            <button
              key={key}
              className={`${styles.colorblindOption} ${mode === key ? styles.active : ''}`}
              onClick={() => handleSetMode(key)}
              aria-pressed={mode === key}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ColorBlindToggle;