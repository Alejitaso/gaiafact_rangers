import React, { Fragment, useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import clienteAxios from '../../config/axios';
import styles from './Facturacion.module.css';

const Facturacion = () => {
    const [showPopup, setShowPopup] = useState(false);
    const [showErrorPopup, setShowErrorPopup] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [errorTitle, setErrorTitle] = useState('');
    const [activeTab, setActiveTab] = useState('barcode');
    const [barcodeInput, setBarcodeInput] = useState('');
    const [productId, setProductId] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [isListening, setIsListening] = useState(false);
    const [productos, setProductos] = useState([]);
    const [productosFactura, setProductosFactura] = useState([]);
    const [cargandoProductos, setCargandoProductos] = useState(false);
    const [esperandoProducto, setEsperandoProducto] = useState(false);
    const [generandoFactura, setGenerandoFactura] = useState(false);
    const [mensajeEstado, setMensajeEstado] = useState('');
    
    const [tipoDocumento, setTipoDocumento] = useState('');
    const [numeroDocumento, setNumeroDocumento] = useState('');
    const [nombres, setNombres] = useState('');
    const [apellidos, setApellidos] = useState('');
    const [telefono, setTelefono] = useState('');
    const [correo, setCorreo] = useState('');
    
    // Estados para el manejo de clientes
    const [buscandoCliente, setBuscandoCliente] = useState(false);
    const [clienteEncontrado, setClienteEncontrado] = useState(false);
    const [clienteId, setClienteId] = useState(null);
    const [camposHabilitados, setCamposHabilitados] = useState(true);
    
    const barcodeInputRef = useRef(null);
    const timeoutRef = useRef(null);
    const documentoTimeoutRef = useRef(null);
    const popupRef = useRef(null);
    const errorPopupRef = useRef(null);
    const previousFocusRef = useRef(null);
    const tipoDocumentoRef = useRef(null);

    const mostrarError = (titulo, mensaje) => {
        setErrorTitle(titulo);
        setErrorMessage(mensaje);
        setShowErrorPopup(true);
        setMensajeEstado(`Error: ${titulo}. ${mensaje}`);
    };

    const cerrarErrorPopup = () => {
        setShowErrorPopup(false);
        setErrorTitle('');
        setErrorMessage('');
        
        // Restaurar foco
        if (previousFocusRef.current) {
            previousFocusRef.current.focus();
            previousFocusRef.current = null;
        }
    };

    // Gestión de foco para popups
    useEffect(() => {
        if (showPopup) {
            previousFocusRef.current = document.activeElement;
            
            setTimeout(() => {
                if (activeTab === 'barcode' && barcodeInputRef.current) {
                    barcodeInputRef.current.focus();
                    setIsListening(true);
                }
            }, 300);
        }
    }, [showPopup, activeTab]);

    // Trap focus en popup
    useEffect(() => {
        if (showPopup && popupRef.current) {
            const focusableElements = popupRef.current.querySelectorAll(
                'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            const handleTab = (e) => {
                if (e.key === 'Tab') {
                    if (e.shiftKey && document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    } else if (!e.shiftKey && document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
                
                if (e.key === 'Escape') {
                    cerrarPopup();
                }
            };

            document.addEventListener('keydown', handleTab);
            return () => document.removeEventListener('keydown', handleTab);
        }
    }, [showPopup]);

    useEffect(() => {
        setBarcodeInput('');
        setProductId('');
        setQuantity(1);
        setIsListening(false);
    }, [activeTab]);

    const obtenerProductos = async () => {
        try {
            setCargandoProductos(true);
            setMensajeEstado('Cargando productos del inventario');
            const res = await clienteAxios.get('/api/productos');
            
            if (res.data && Array.isArray(res.data)) {
                setProductos(res.data);
                setMensajeEstado(`${res.data.length} productos cargados`);
            } else {
                setProductos([]);
                setMensajeEstado('No hay productos disponibles');
            }
            setCargandoProductos(false);
        } catch (error) {
            console.error('Error al obtener productos:', error);
            setCargandoProductos(false);
            if (error.response && error.response.status !== 404) {
                mostrarError('Error de conexión', 'No se pudo conectar con el servidor');
            } else {
                setProductos([]);
            }
        }
    };

    useEffect(() => {
        obtenerProductos();
    }, []);

    const buscarClientePorDocumento = async (documento) => {
        if (!documento || documento.length < 5) {
            return;
        }

        try {
            setBuscandoCliente(true);
            setMensajeEstado('Buscando cliente en el sistema');
            const res = await clienteAxios.get(`/api/Usuario/documento/${documento}`);
            
            if (res.data && res.data.usuario) {
                const cliente = res.data.usuario;
                setClienteEncontrado(true);
                setClienteId(cliente._id);
                setNombres(cliente.nombre || '');
                setApellidos(cliente.apellido || '');
                setTelefono(cliente.telefono || '');
                setCorreo(cliente.correo_electronico || '');
                setTipoDocumento(cliente.tipo_documento || '');
                setCamposHabilitados(false);
                setMensajeEstado(`Cliente encontrado: ${cliente.nombre} ${cliente.apellido}`);
                
                Swal.fire({
                    icon: 'success',
                    title: 'Cliente encontrado',
                    text: `${cliente.nombre} ${cliente.apellido}`,
                    timer: 2000,
                    showConfirmButton: false,
                    didOpen: () => {
                        const popup = Swal.getPopup();
                        if (popup) {
                            popup.setAttribute('role', 'alertdialog');
                            popup.setAttribute('aria-live', 'assertive');
                        }
                    }
                });
            } else {
                setClienteEncontrado(false);
                setClienteId(null);
                setNombres('');
                setApellidos('');
                setTelefono('');
                setCorreo('');
                setCamposHabilitados(true);
                setMensajeEstado('Cliente no registrado. Complete los datos para registrar nuevo cliente');
                
                Swal.fire({
                    icon: 'info',
                    title: 'Cliente no registrado',
                    text: 'Complete los datos para registrar al nuevo cliente',
                    timer: 3000,
                    showConfirmButton: false,
                    didOpen: () => {
                        const popup = Swal.getPopup();
                        if (popup) {
                            popup.setAttribute('role', 'alertdialog');
                            popup.setAttribute('aria-live', 'polite');
                        }
                    }
                });
            }
            setBuscandoCliente(false);
        } catch (error) {
            setBuscandoCliente(false);
            console.error('Error al buscar cliente:', error);
            
            if (error.response && error.response.status === 404) {
                setClienteEncontrado(false);
                setClienteId(null);
                setNombres('');
                setApellidos('');
                setTelefono('');
                setCorreo('');
                setCamposHabilitados(true);
                setMensajeEstado('Cliente no encontrado. Complete los datos para nuevo registro');
                
                Swal.fire({
                    icon: 'info',
                    title: 'Cliente no registrado',
                    text: 'Complete los datos para registrar al nuevo cliente',
                    timer: 3000,
                    showConfirmButton: false
                });
            }
        }
    };

    const handleNumeroDocumentoChange = (value) => {
        setNumeroDocumento(value);
        
        clearTimeout(documentoTimeoutRef.current);
        
        documentoTimeoutRef.current = setTimeout(() => {
            if (value.length >= 5 && tipoDocumento) {
                buscarClientePorDocumento(value);
            }
        }, 800);
    };

    const registrarNuevoCliente = async () => {
        try {
            const datosCliente = {
                nombre: nombres,
                apellido: apellidos,
                tipo_documento: tipoDocumento,
                numero_documento: numeroDocumento,
                correo_electronico: correo,
                telefono: telefono,
                password: 'temporal123',
                estado: 'Activo',
                tipo_usuario: 'CLIENTE'
            };

            const res = await clienteAxios.post('/api/Usuario', datosCliente);
            
            if (res.data) {
                setClienteEncontrado(true);
                setClienteId(res.data._id || null);
                setCamposHabilitados(false);
                setMensajeEstado('Cliente registrado exitosamente');
                
                Swal.fire({
                    icon: 'success',
                    title: '¡Cliente registrado!',
                    text: 'El cliente ha sido registrado exitosamente',
                    timer: 2000,
                    showConfirmButton: false
                });
                
                return true;
            }
        } catch (error) {
            console.error('Error al registrar cliente:', error);
            
            let mensajeError = 'Error al registrar el cliente';
            if (error.response?.data?.mensaje) {
                mensajeError = error.response.data.mensaje;
            }
            
            mostrarError('Error al registrar', mensajeError);
            return false;
        }
    };

    const handleBarcodeInput = (value) => {
        setBarcodeInput(value);
        
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            if (value.length >= 8) {
                handleProductSearch('barcode', value);
            }
        }, 500);
    };

    const handleProductSearch = async (searchType, searchValue) => {
        try {
            setEsperandoProducto(true);
            setMensajeEstado('Buscando producto');
            let producto = null;
            
            if (searchType === 'barcode') {
                producto = productos.find(p => 
                    p.codigo_barras_datos === searchValue
                );
            } else {
                producto = productos.find(p => 
                    p.codigo_barras_datos === searchValue ||
                    p._id.substring(p._id.length - 6).toUpperCase() === searchValue.toUpperCase()
                );
            }

            setEsperandoProducto(false);

            if (producto) {
                cerrarPopup();
                mostrarConfirmacionProducto(producto);
            } else {
                cerrarPopup();
                mostrarError(
                    'Producto no encontrado',
                    `No se encontró ningún producto con ${searchType === 'barcode' ? 'código de barras' : 'código o ID'}: ${searchValue}`
                );
            }
        } catch (error) {
            setEsperandoProducto(false);
            console.error('Error al buscar producto:', error);
            cerrarPopup();
            mostrarError('Error', 'Error al buscar el producto');
        }
    };

    const mostrarConfirmacionProducto = (producto) => {
        setMensajeEstado(`Producto encontrado: ${producto.nombre}`);
        
        Swal.fire({
            title: '¿Agregar este producto?',
            html: `
                <div style="text-align: left; margin: 20px 0;">
                    <h4><i class="fas fa-box"></i> ${producto.nombre}</h4>
                    <p><strong>ID:</strong> ${producto._id.substring(producto._id.length - 6).toUpperCase()}</p>
                    <p><strong>Precio:</strong> $${formatearPrecio(producto.precio)}</p>
                    <p><strong>Stock disponible:</strong> ${producto.cantidad} unidades</p>
                    <p><strong>Tipo:</strong> ${producto.tipo_prenda}</p>
                    <div style="margin-top: 15px;">
                        <label for="cantidadProducto" style="display: block; margin-bottom: 5px;"><strong>Cantidad a agregar:</strong></label>
                        <input 
                            type="number" 
                            id="cantidadProducto" 
                            value="${quantity}" 
                            min="1" 
                            max="${producto.cantidad}"
                            aria-label="Cantidad del producto"
                            aria-describedby="stock-info"
                            style="width: 80px; padding: 5px; border: 2px solid #276177; border-radius: 4px;"
                        />
                        <span id="stock-info" class="sr-only">Stock disponible: ${producto.cantidad} unidades</span>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Agregar a factura',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#276177',
            cancelButtonColor: '#d33',
            didOpen: () => {
                const popup = Swal.getPopup();
                if (popup) {
                    popup.setAttribute('role', 'dialog');
                    popup.setAttribute('aria-modal', 'true');
                    popup.setAttribute('aria-labelledby', 'swal2-title');
                }
                
                const input = document.getElementById('cantidadProducto');
                if (input) {
                    input.focus();
                    input.select();
                }
            },
            preConfirm: () => {
                const cantidadInput = document.getElementById('cantidadProducto');
                const cantidadSeleccionada = parseInt(cantidadInput.value);
                
                if (cantidadSeleccionada <= 0) {
                    Swal.showValidationMessage('La cantidad debe ser mayor a 0');
                    return false;
                }
                
                if (cantidadSeleccionada > producto.cantidad) {
                    Swal.showValidationMessage(`Solo hay ${producto.cantidad} unidades disponibles`);
                    return false;
                }
                
                return cantidadSeleccionada;
            }
        }).then((result) => {
            if (result.isConfirmed) {
                agregarProductoAFactura(producto, result.value);
            }
        });
    };

    const agregarProductoAFactura = (producto, cantidad) => {
        const productoExistente = productosFactura.find(p => p.id === producto._id);
        
        if (productoExistente) {
            setProductosFactura(prev => 
                prev.map(p => 
                    p.id === producto._id 
                        ? { ...p, cantidad: p.cantidad + cantidad }
                        : p
                )
            );
            setMensajeEstado(`Cantidad actualizada: ${producto.nombre}, total ${productoExistente.cantidad + cantidad} unidades`);
        } else {
            const nuevoProducto = {
                id: producto._id,
                nombre: producto.nombre,
                precio: producto.precio,
                cantidad: cantidad,
                stock: producto.cantidad,
                tipo_prenda: producto.tipo_prenda
            };
            
            setProductosFactura(prev => [...prev, nuevoProducto]);
            setMensajeEstado(`Producto agregado: ${producto.nombre}, cantidad ${cantidad}`);
        }

        Swal.fire({
            icon: 'success',
            title: '¡Producto agregado!',
            text: `${producto.nombre} (x${cantidad}) agregado a la factura`,
            timer: 2000,
            showConfirmButton: false
        });
    };

    const generarFactura = async () => {
        if (productosFactura.length === 0) {
            mostrarError('Error', 'Debe agregar al menos un producto a la factura');
            return;
        }

        if (!tipoDocumento || !numeroDocumento || !nombres || !apellidos || !telefono) {
            mostrarError('Datos incompletos', 'Complete todos los datos del cliente');
            return;
        }

        setGenerandoFactura(true);
        setMensajeEstado('Generando factura, por favor espere');

        try {
            if (!clienteEncontrado) {
                const registrado = await registrarNuevoCliente();
                if (!registrado) {
                    setGenerandoFactura(false);
                    return;
                }
            }

            const subtotal = productosFactura.reduce((sum, producto) => {
                return sum + (producto.precio * producto.cantidad);
            }, 0);

            const iva = subtotal * 0.19; 
            const total = subtotal + iva;

            const datosFactura = {
                subtotal,
                iva,
                total,
                numero_factura: 'F' + Math.floor(Math.random() * 100000),
                usuario: {
                    nombre: nombres,
                    apellido: apellidos,
                    tipo_documento: tipoDocumento,
                    numero_documento: numeroDocumento,
                    correo_electronico: correo,
                    telefono: telefono
                },
                productos_factura: productosFactura.map(p => ({
                    producto_id: p.id,
                    cantidad: p.cantidad,
                    precio: p.precio
                }))
            };

            console.log('productosFactura mapeado:', productosFactura.map(p => ({ producto_id: p._id, cantidad: p.cantidad, precio: p.precio })));
            const res = await clienteAxios.post('/api/facturas', datosFactura);
            
            setMensajeEstado('Factura generada exitosamente');
            Swal.fire('Correcto', 'Factura generada y guardada', 'success');
            
            limpiarFormulario();

        } catch (error) {
            console.error('Error al generar la factura:', error.response?.data?.mensaje || error.message);
            mostrarError('Error de Validación', 'Error al generar la factura. Verifique los datos e intente nuevamente.');
        } finally {
            setGenerandoFactura(false);
        }
    };

    const limpiarFormulario = () => {
        setTipoDocumento('');
        setNumeroDocumento('');
        setNombres('');
        setApellidos('');
        setTelefono('');
        setCorreo('');
        setProductosFactura([]);
        setClienteEncontrado(false);
        setClienteId(null);
        setCamposHabilitados(true);
        setMensajeEstado('Formulario limpiado, listo para nueva factura');
        
        // Regresar foco al primer campo
        if (tipoDocumentoRef.current) {
            tipoDocumentoRef.current.focus();
        }
    };

    const cancelarFactura = () => {
        Swal.fire({
            title: '¿Cancelar factura?',
            text: 'Se perderán todos los datos ingresados',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, cancelar',
            cancelButtonText: 'No, continuar',
            didOpen: () => {
                const popup = Swal.getPopup();
                if (popup) {
                    popup.setAttribute('role', 'alertdialog');
                    popup.setAttribute('aria-modal', 'true');
                }
            }
        }).then((result) => {
            if (result.isConfirmed) {
                limpiarFormulario();
                Swal.fire('Cancelado', 'La factura ha sido cancelada', 'success');
            }
        });
    };

    const abrirPopup = () => {
        setShowPopup(true);
        setActiveTab('barcode');
        setBarcodeInput('');
        setProductId('');
        setQuantity(1);
        setMensajeEstado('Ventana de búsqueda de productos abierta');
    };

    const cerrarPopup = () => {
        setShowPopup(false);
        setBarcodeInput('');
        setProductId('');
        setQuantity(1);
        setIsListening(false);
        clearTimeout(timeoutRef.current);
        
        // Restaurar foco
        if (previousFocusRef.current) {
            previousFocusRef.current.focus();
            previousFocusRef.current = null;
        }
    };

    const buscarProducto = () => {
        const searchValue = activeTab === 'barcode' ? barcodeInput.trim() : productId.trim();
        
        if (!searchValue) {
            mostrarError(
                'Campo vacío',
                `Por favor ingrese ${activeTab === 'barcode' ? 'el código de barras' : 'el ID del producto'}`
            );
            return;
        }

        handleProductSearch(activeTab, searchValue);
    };

    const eliminarProducto = (productId, productName) => {
        setProductosFactura(prev => prev.filter(p => p.id !== productId));
        setMensajeEstado(`Producto eliminado: ${productName}`);
    };

    const formatearPrecio = (precio) => {
        return precio.toLocaleString('es-CO', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
    };

    const calcularTotal = () => {
        return productosFactura.reduce((total, producto) => 
            total + (producto.precio * producto.cantidad), 0
        );
    };

    return (
        <Fragment>
            {/* Región de anuncios para lectores de pantalla */}
            <div 
                role="status"
                aria-live="polite" 
                aria-atomic="true"
                className="sr-only"
            >
                {mensajeEstado}
            </div>

            <main className={styles.facturacionContainer} role="main" aria-labelledby="facturacion-title">
                <h1 id="facturacion-title" className="sr-only">Sistema de Facturación</h1>
                
                <section aria-labelledby="datos-cliente-title" className={styles.facturacionForm}>
                    <h2 id="datos-cliente-title" className="sr-only">Datos del Cliente</h2>
                    
                    <label htmlFor="tipo-documento" className="sr-only">Tipo de documento</label>
                    <select 
                        id="tipo-documento"
                        ref={tipoDocumentoRef}
                        value={tipoDocumento}
                        onChange={(e) => {
                            setTipoDocumento(e.target.value);
                            if (numeroDocumento.length >= 5) {
                                buscarClientePorDocumento(numeroDocumento);
                            }
                        }}
                        disabled={buscandoCliente}
                        aria-required="true"
                        aria-describedby="tipo-doc-hint"
                    >
                        <option value="">Seleccione tipo de documento</option>
                        <option value="Cedula de ciudadania">Cédula de ciudadanía</option>
                        <option value="Cedula extranjeria">Cédula de extranjería</option>
                        <option value="Nit">NIT</option>
                        <option value="Pasaporte">Pasaporte</option>
                    </select>
                    <span id="tipo-doc-hint" className="sr-only">Requerido. Seleccione el tipo de documento del cliente</span>
                    
                    <div style={{ position: 'relative', width: '48.5%' }}>
                        <label htmlFor="numero-documento" className="sr-only">Número de documento</label>
                        <input 
                            type="text"
                            id="numero-documento"
                            placeholder="Número documento"
                            value={numeroDocumento}
                            onChange={(e) => handleNumeroDocumentoChange(e.target.value)}
                            disabled={buscandoCliente}
                            aria-required="true"
                            aria-describedby="numero-doc-hint"
                            aria-busy={buscandoCliente}
                            style={{ width: '100%' }}
                        />
                        <span id="numero-doc-hint" className="sr-only">
                            {buscandoCliente ? 'Buscando cliente en el sistema' : 'Requerido. Mínimo 5 caracteres. Se buscará automáticamente'}
                        </span>
                        {buscandoCliente && (
                            <i 
                                className="fa fa-spinner fa-spin"
                                aria-hidden="true"
                                style={{
                                    position: 'absolute',
                                    right: '10px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: 'var(--color-tres)'
                                }}
                            ></i>
                        )}
                    </div>
                    
                    <label htmlFor="nombres" className="sr-only">Nombres</label>
                    <input 
                        type="text"
                        id="nombres"
                        placeholder="Nombres" 
                        value={nombres}
                        onChange={(e) => setNombres(e.target.value)}
                        disabled={!camposHabilitados || buscandoCliente}
                        aria-required="true"
                        aria-readonly={!camposHabilitados}
                        aria-describedby="nombres-hint"
                        style={{
                            backgroundColor: !camposHabilitados ? '#f0f0f0' : 'white'
                        }}
                    />
                    <span id="nombres-hint" className="sr-only">
                        {!camposHabilitados ? 'Campo autocompletado desde base de datos' : 'Requerido'}
                    </span>
                    
                    <label htmlFor="apellidos" className="sr-only">Apellidos</label>
                    <input 
                        type="text"
                        id="apellidos"
                        placeholder="Apellidos"
                        value={apellidos}
                        onChange={(e) => setApellidos(e.target.value)}
                        disabled={!camposHabilitados || buscandoCliente}
                        aria-required="true"
                        aria-readonly={!camposHabilitados}
                        style={{
                            backgroundColor: !camposHabilitados ? '#f0f0f0' : 'white'
                        }}
                    />
                    
                    <label htmlFor="telefono" className="sr-only">Teléfono</label>
                    <input 
                        type="tel"
                        id="telefono"
                        placeholder="Teléfono"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        disabled={!camposHabilitados || buscandoCliente}
                        aria-required="true"
                        aria-readonly={!camposHabilitados}
                        autoComplete="tel"
                        style={{
                            backgroundColor: !camposHabilitados ? '#f0f0f0' : 'white'
                        }}
                    />
                    
                    <label htmlFor="correo" className="sr-only">Correo electrónico (opcional)</label>
                    <input 
                        type="email"
                        id="correo"
                        placeholder="Correo (opcional)"
                        value={correo}
                        onChange={(e) => setCorreo(e.target.value)}
                        disabled={!camposHabilitados || buscandoCliente}
                        aria-readonly={!camposHabilitados}
                        autoComplete="email"
                        style={{
                            backgroundColor: !camposHabilitados ? '#f0f0f0' : 'white'
                        }}
                    />
                    
                    {clienteEncontrado && (
                        <small 
                            role="status"
                            aria-live="polite"
                            style={{ 
                                color: '#28a745', 
                                marginTop: '-10px', 
                                display: 'block',
                                fontWeight: 'bold'
                            }}
                        >
                            ✓ Cliente encontrado en el sistema
                        </small>
                    )}
                </section>
                
                <div className={styles.botonAnadir}>
                    <button 
                        onClick={abrirPopup}
                        aria-label="Agregar producto a la factura"
                        className="fa-solid fa-plus"
                    ></button>
                </div>
                
                <section aria-labelledby="productos-table-title">
                    <h2 id="productos-table-title" className="sr-only">Productos en la Factura</h2>
                    <table 
                        className={styles.facturacionTabla}
                        role="table"
                        aria-label="Lista de productos en la factura"
                    >
                        <thead>
                            <tr>
                                <th scope="col">ID</th>
                                <th scope="col">Nombre producto</th>
                                <th scope="col">Cantidad</th>
                                <th scope="col">Precio Unit.</th>
                                <th scope="col">Subtotal</th>
                                <th scope="col">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cargandoProductos ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: 'var(--color-tres)' }}>
                                        <i className="fa fa-spinner fa-spin" aria-hidden="true"></i>
                                        <p>Cargando productos...</p>
                                    </td>
                                </tr>
                            ) : esperandoProducto ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: 'var(--color-tres)' }}>
                                        <i className="fa fa-search fa-spin" aria-hidden="true"></i>
                                        <p>Esperando producto...</p>
                                    </td>
                                </tr>
                            ) : generandoFactura ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: 'var(--color-tres)' }}>
                                        <i className="fa fa-cog fa-spin" aria-hidden="true"></i>
                                        <p>Generando factura...</p>
                                    </td>
                                </tr>
                            ) : productosFactura.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: 'var(--color-tres)' }}>
                                        <i className="fas fa-inbox" aria-hidden="true"></i>
                                        <p>No hay productos en la factura</p>
                                        <small>Use el botón "+" para agregar productos</small>
                                    </td>
                                </tr>
                            ) : (
                                <>
                                    {productosFactura.map((producto) => (
                                        <tr key={producto.id}>
                                            <td>{producto.id.substring(producto.id.length - 6).toUpperCase()}</td>
                                            <td>
                                                <div>
                                                    <strong>{producto.nombre}</strong>
                                                    {producto.tipo_prenda && (
                                                        <small style={{ display: 'block', color: 'var(--color-tres)' }}>
                                                            {producto.tipo_prenda}
                                                        </small>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <span style={{ 
                                                    color: producto.cantidad > producto.stock ? 'red' : 'inherit',
                                                    fontWeight: producto.cantidad > producto.stock ? 'bold' : 'normal'
                                                }}>
                                                    {producto.cantidad}
                                                </span>
                                                {producto.stock && (
                                                    <small style={{ display: 'block', color: 'var(--color-tres)' }}>
                                                        Stock: {producto.stock}
                                                    </small>
                                                )}
                                            </td>
                                            <td>${formatearPrecio(producto.precio)}</td>
                                            <td style={{ fontWeight: 'bold' }}>
                                                ${formatearPrecio(producto.precio * producto.cantidad)}
                                            </td>
                                            <td>
                                                <button 
                                                    className="fa-solid fa-trash-can"
                                                    onClick={() => eliminarProducto(producto.id, producto.nombre)}
                                                    aria-label={`Eliminar ${producto.nombre} de la factura`}
                                                ></button>
                                            </td>
                                        </tr>
                                    ))}
                                    {productosFactura.length > 0 && (
                                        <tr style={{ 
                                            backgroundColor: 'var(--color-cuatro)', 
                                            fontWeight: 'bold',
                                            borderTop: '2px solid var(--color-tres)'
                                        }}>
                                            <td colSpan="4" style={{ textAlign: 'right', fontSize: '16px' }}>
                                                TOTAL:
                                            </td>
                                            <td style={{ fontSize: '18px', color: 'var(--color-uno)' }}>
                                                <span aria-label={`Total de la factura: ${formatearPrecio(calcularTotal())} pesos`}>
                                                    ${formatearPrecio(calcularTotal())}
                                                </span>
                                            </td>
                                            <td></td>
                                        </tr>
                                    )}
                                </>
                            )}
                        </tbody>
                    </table>
                </section>
                
                <div className={styles.botonesFinales} role="group" aria-label="Acciones de factura">
                    <button 
                        onClick={cancelarFactura}
                        disabled={generandoFactura}
                        aria-label="Cancelar factura actual"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={generarFactura} 
                        disabled={generandoFactura || productosFactura.length === 0}
                        aria-busy={generandoFactura}
                        aria-label={generandoFactura ? "Generando factura, por favor espere" : "Generar factura"}
                        aria-describedby={productosFactura.length === 0 ? "generar-hint" : undefined}
                    >
                        {generandoFactura ? 'Generando...' : 'Generar'}
                    </button>
                    {productosFactura.length === 0 && (
                        <span id="generar-hint" className="sr-only">
                            Debe agregar al menos un producto para generar la factura
                        </span>
                    )}
                </div>
            </main>

            {/* Popup para agregar productos */}
            {showPopup && (
                <div 
                    className={styles.popup} 
                    style={{ display: 'flex' }} 
                    onClick={cerrarPopup}
                    role="presentation"
                >
                    <div 
                        ref={popupRef}
                        className={styles.popupContent} 
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="popup-title"
                    >
                        <button 
                            className={styles.popupCloseButton}
                            onClick={cerrarPopup}
                            aria-label="Cerrar ventana de búsqueda"
                        >
                            ×
                        </button>

                        <h3 id="popup-title">Agregar Producto</h3>

                        {/* Pestañas */}
                        <div className={styles.popupTabs} role="tablist" aria-label="Métodos de búsqueda">
                            <button
                                role="tab"
                                aria-selected={activeTab === 'barcode'}
                                aria-controls="barcode-panel"
                                id="barcode-tab"
                                className={`${styles.popupTabButton} ${activeTab === 'barcode' ? styles.active : ''}`}
                                onClick={() => setActiveTab('barcode')}
                            >
                                <i className="fas fa-barcode" aria-hidden="true"></i> Código Barras
                            </button>
                            <button
                                role="tab"
                                aria-selected={activeTab === 'id'}
                                aria-controls="id-panel"
                                id="id-tab"
                                className={`${styles.popupTabButton} ${activeTab === 'id' ? styles.active : ''}`}
                                onClick={() => setActiveTab('id')}
                            >
                                <i className="fas fa-hashtag" aria-hidden="true"></i> Por ID
                            </button>
                        </div>

                        {/* Contenido según pestaña activa */}
                        {activeTab === 'barcode' ? (
                            <div 
                                className={styles.popupInputContainer}
                                role="tabpanel"
                                id="barcode-panel"
                                aria-labelledby="barcode-tab"
                            >
                                <p>
                                    {isListening ? (
                                        <><i className="fas fa-barcode fa-spin" aria-hidden="true"></i> Esperando código de barras...</>
                                    ) : (
                                        'Escanee el código o ingrese manualmente'
                                    )}
                                </p>
                                
                                <label htmlFor="barcode-input" className="sr-only">
                                    Código de barras del producto
                                </label>
                                <input
                                    ref={barcodeInputRef}
                                    type="text"
                                    id="barcode-input"
                                    placeholder="Código de barras"
                                    value={barcodeInput}
                                    onChange={(e) => handleBarcodeInput(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            buscarProducto();
                                        }
                                    }}
                                    className={styles.popupInput}
                                    aria-describedby="barcode-hint"
                                />
                                <span id="barcode-hint" className="sr-only">
                                    Mínimo 8 caracteres. Presione Enter para buscar
                                </span>
                            </div>
                        ) : (
                            <div 
                                className={styles.popupInputContainer}
                                role="tabpanel"
                                id="id-panel"
                                aria-labelledby="id-tab"
                            >
                                <p>Ingrese el ID del producto (últimos 6 caracteres)</p>
                                
                                <label htmlFor="product-id-input" className="sr-only">
                                    ID del producto
                                </label>
                                <input
                                    type="text"
                                    id="product-id-input"
                                    placeholder="ID del producto"
                                    value={productId}
                                    onChange={(e) => setProductId(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            buscarProducto();
                                        }
                                    }}
                                    className={styles.popupInput}
                                    aria-describedby="id-hint"
                                />
                                <span id="id-hint" className="sr-only">
                                    Últimos 6 caracteres del ID. Presione Enter para buscar
                                </span>
                            </div>
                        )}

                        {/* Botones de acción */}
                        <div className={styles.popupButtonsContainer}>
                            <button
                                onClick={buscarProducto}
                                className={`${styles.popupButton} ${styles.popupButtonPrimary}`}
                                aria-label="Buscar producto"
                            >
                                <i className="fas fa-search" aria-hidden="true"></i> Buscar
                            </button>
                            <button
                                onClick={cerrarPopup}
                                className={`${styles.popupButton} ${styles.popupButtonSecondary}`}
                            >
                                Cancelar
                            </button>
                        </div>

                        <p className={styles.popupMessage} role="note">
                            💡 El lector de código de barras se detecta automáticamente
                        </p>
                    </div>
                </div>
            )}

            {/* Popup de error personalizado */}
            {showErrorPopup && (
                <div 
                    className={styles.popup} 
                    style={{ display: 'flex' }} 
                    onClick={cerrarErrorPopup}
                    role="presentation"
                >
                    <div 
                        ref={errorPopupRef}
                        className={styles.popupContent} 
                        onClick={(e) => e.stopPropagation()}
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="error-title"
                        aria-describedby="error-message"
                    >
                        <button 
                            className={styles.popupCloseButton}
                            onClick={cerrarErrorPopup}
                            aria-label="Cerrar mensaje de error"
                        >
                            ×
                        </button>

                        <div className={styles.errorContent}>
                            <i className="fas fa-exclamation-triangle" aria-hidden="true"></i>
                        </div>
                        <h3 id="error-title" className={styles.errorTitle}>{errorTitle}</h3>
                        <p id="error-message" className={styles.errorMessage}>{errorMessage}</p>

                        <button
                            onClick={cerrarErrorPopup}
                            className={`${styles.popupButton} ${styles.popupButtonPrimary}`}
                            style={{ marginTop: '20px' }}
                            aria-label="Cerrar mensaje y volver al formulario"
                        >
                            Entendido
                        </button>
                    </div>
                </div>
            )}
        </Fragment>
    );
};

export default Facturacion;