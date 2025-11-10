// components/utils/KeyboardShortcutsHelp.js
import React, { useState, useEffect } from 'react';
import './KeyboardShortcutsHelp.css';

const KeyboardShortcutsHelp = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Cerrar con tecla Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const shortcutCategories = [
    {
      title: '🏠 Navegación',
      shortcuts: [
        { keys: 'Ctrl + I', description: 'Ir a Inicio' },
        { keys: 'Ctrl + B', description: 'Ver Facturas' },
        { keys: 'Ctrl + N', description: 'Notificaciones' },
        { keys: 'Ctrl + K', description: 'Contacto' },
      ]
    },
    {
      title: '📄 Facturación',
      shortcuts: [
        { keys: 'Ctrl + F', description: 'Abrir Facturación', warning: 'Puede conflictuar con búsqueda del navegador' },
        { keys: 'Ctrl + G', description: 'Guardar Factura' },
        { keys: 'Ctrl + C', description: 'Cancelar Factura', warning: 'No funciona con texto seleccionado' },
        { keys: 'Ctrl + Q', description: 'Códigos QR/Barras' },
      ]
    },
    {
      title: '📦 Inventario',
      shortcuts: [
        { keys: 'Ctrl + E', description: 'Editar Producto' },
        { keys: 'Ctrl + A', description: 'Agregar Producto', warning: 'Puede conflictuar con seleccionar todo' },
        { keys: 'Ctrl + D', description: 'Eliminar Producto' },
      ]
    },
    {
      title: '➕ Registro',
      shortcuts: [
        { keys: 'Ctrl + R', description: 'Ir a Registro', warning: 'Puede conflictuar con recargar página' },
        { keys: 'Ctrl + U', description: 'Registro de Usuario' },
        { keys: 'Ctrl + P', description: 'Registro de Producto', warning: 'Puede conflictuar con imprimir' },
      ]
    },
    {
      title: '👥 Usuarios',
      shortcuts: [
        { keys: 'Ctrl + L', description: 'Gestión de Usuarios (Admin)' },
      ]
    },
    {
      title: '💾 Acciones Generales',
      shortcuts: [
        { keys: 'Ctrl + S', description: 'Guardar Cambios' },
        { keys: 'Ctrl + Z', description: 'Deshacer (en app)' },
        { keys: 'Ctrl + Y', description: 'Rehacer (en app)' },
        { keys: 'Ctrl + Shift + S', description: 'Cerrar Sesión' },
      ]
    }
  ];

  return (
    <>
      {/* Botón flotante para abrir la ayuda */}
      <button
        className="shortcuts-help-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Atajos de teclado"
        aria-label="Mostrar atajos de teclado"
      >
        <span role="img" aria-hidden="true">⌨️</span>
      </button>

      {/* Modal de ayuda */}
      {isOpen && (
        <div 
          className="shortcuts-modal-overlay" 
          onClick={() => setIsOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="shortcuts-title"
        >
          <div className="shortcuts-modal" onClick={(e) => e.stopPropagation()}>
            <div className="shortcuts-header">
              <h2 id="shortcuts-title">⌨️ Atajos de Teclado</h2>
              <button 
                className="close-btn" 
                onClick={() => setIsOpen(false)}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <div className="shortcuts-content">
              <div className="shortcuts-note">
                <strong>💡 Nota:</strong> Los atajos no funcionan mientras escribes en campos de texto.
                Algunos atajos pueden tener conflictos con funciones nativas del navegador.
              </div>

              {shortcutCategories.map((category, index) => (
                <div key={index} className="shortcuts-category">
                  <div className="shortcuts-category-title">
                    {category.title}
                  </div>
                  <div className="shortcuts-list">
                    {category.shortcuts.map((shortcut, idx) => (
                      <div key={idx} className="shortcut-item">
                        <kbd className="shortcut-keys">{shortcut.keys}</kbd>
                        <div className="shortcut-desc">
                          <span>{shortcut.description}</span>
                          {shortcut.warning && (
                            <small className="warning">
                              ⚠️ {shortcut.warning}
                            </small>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="shortcuts-note" style={{ marginTop: '20px', background: '#e3f2fd', borderLeftColor: '#2196f3' }}>
                <strong>💡 Consejo:</strong> Presiona <kbd style={{ 
                  padding: '2px 6px', 
                  background: 'var(--color-tres)', 
                  color: 'white', 
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>ESC</kbd> para cerrar esta ventana.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default KeyboardShortcutsHelp;