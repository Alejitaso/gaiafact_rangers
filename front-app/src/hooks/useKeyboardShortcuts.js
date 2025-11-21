import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const useKeyboardShortcuts = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleKeyDown = (event) => {
      const { ctrlKey, shiftKey, key, altKey, metaKey } = event;

      // Ignorar si el usuario está escribiendo en un input, textarea o select
      const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(
        document.activeElement.tagName
      );

      // Si está escribiendo, solo permitir atajos muy específicos con Ctrl
      if (isTyping && !ctrlKey) return;

      // Ignorar si está en rutas de login/recuperación
      const rutasExcluidas = ['/login', '/recuperar', '/nueva_contra'];
      if (rutasExcluidas.some(ruta => location.pathname.startsWith(ruta))) {
        return;
      }

      // Lista de atajos nativos del navegador que NO debemos prevenir
      const atajosNativos = {
        // Navegación y pestañas
        't': ctrlKey && !shiftKey, // Nueva pestaña
        'w': ctrlKey, // Cerrar pestaña
        'tab': ctrlKey, // Cambiar pestaña
        // Historial
        '[': ctrlKey, // Atrás
        ']': ctrlKey, // Adelante
        // Zoom
        '+': ctrlKey, // Zoom in
        '-': ctrlKey, // Zoom out
        '0': ctrlKey, // Reset zoom
        // Sistema
        'h': ctrlKey, // Historial
        'j': ctrlKey, // Descargas
        // Búsqueda del navegador (lo permitimos pero con advertencia)
      };

      // Si es un atajo nativo del navegador, no hacer nada
      const keyLower = key.toLowerCase();
      if (atajosNativos[keyLower]) {
        return; 
      }

      if (ctrlKey && shiftKey && !altKey && !metaKey) {
        switch (keyLower) {
          case 's':
            event.preventDefault();
            event.stopPropagation();
            if (window.confirm('¿Deseas cerrar sesión?')) {
              localStorage.removeItem('token');
              sessionStorage.clear();
              navigate('/login');
            }
            break;
          default:
            break;
        }
        return;
      }

      if (ctrlKey && !shiftKey && !altKey && !metaKey) {
        if (isTyping && keyLower !== 's') {
          return;
        }

        let handled = false;

        switch (keyLower) {
          case 'i':
            event.preventDefault();
            event.stopPropagation();
            navigate('/inicio');
            handled = true;
            break;

          case 'f':
            if (!isTyping) {
              event.preventDefault();
              event.stopPropagation();
              navigate('/facturacion');
              handled = true;
            }
            break;

          case 'g':
            event.preventDefault();
            event.stopPropagation();
            window.dispatchEvent(new CustomEvent('saveInvoice'));
            handled = true;
            break;

          case 'c':
            const hasSelection = window.getSelection().toString().length > 0;
            if (!hasSelection && !isTyping) {
              event.preventDefault();
              event.stopPropagation();
              window.dispatchEvent(new CustomEvent('cancelInvoice'));
              handled = true;
            }
            break;

          case 'b':
            event.preventDefault();
            event.stopPropagation();
            navigate('/vis-factura');
            handled = true;
            break;

          case 'q':
            event.preventDefault();
            event.stopPropagation();
            navigate('/codigoqr');
            handled = true;
            break;

          case 'r':
            // Ctrl+R es recargar página - usar solo si NO está en input
            if (!isTyping) {
              event.preventDefault();
              event.stopPropagation();
              navigate('/registro');
              handled = true;
            }
            break;

          case 'u':
            event.preventDefault();
            event.stopPropagation();
            navigate('/registro');
            handled = true;
            break;

          case 'p':
            // Ctrl+P es imprimir - prevenir solo si no está en input
            if (!isTyping) {
              event.preventDefault();
              event.stopPropagation();
              navigate('/registroproduct');
              handled = true;
            }
            break;

          case 'n':
            event.preventDefault();
            event.stopPropagation();
            navigate('/notify');
            handled = true;
            break;

          case 'e':
            event.preventDefault();
            event.stopPropagation();
            window.dispatchEvent(new CustomEvent('editProduct'));
            handled = true;
            break;

          case 'a':
            // Ctrl+A es seleccionar todo - solo si no hay texto
            const hasContent = document.body.textContent.trim().length > 0;
            if (!hasContent || !isTyping) {
              event.preventDefault();
              event.stopPropagation();
              navigate('/registroproduct');
              handled = true;
            }
            break;

          case 'd':
            event.preventDefault();
            event.stopPropagation();
            window.dispatchEvent(new CustomEvent('deleteProduct'));
            handled = true;
            break;

          case 'l':
            event.preventDefault();
            event.stopPropagation();
            navigate('/usuarios');
            handled = true;
            break;

          case 'k':
            event.preventDefault();
            event.stopPropagation();
            window.dispatchEvent(new CustomEvent('openContact'));
            handled = true;
            break;

          case 'z':
            if (!isTyping) {
              event.preventDefault();
              event.stopPropagation();
              window.dispatchEvent(new CustomEvent('undo'));
              handled = true;
            }
            break;

          case 'y':
            if (!isTyping) {
              event.preventDefault();
              event.stopPropagation();
              window.dispatchEvent(new CustomEvent('redo'));
              handled = true;
            }
            break;

          case 's':
            event.preventDefault();
            event.stopPropagation();
            window.dispatchEvent(new CustomEvent('saveForm'));
            handled = true;
            break;

          default:
            break;
        }

        if (handled && process.env.NODE_ENV === 'development') {
          console.log(`Atajo ejecutado: Ctrl+${key.toUpperCase()}`);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [navigate, location.pathname]);
};

export default useKeyboardShortcuts;    