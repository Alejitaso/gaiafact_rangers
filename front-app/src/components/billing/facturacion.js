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
    
    const [tipoDocumento, setTipoDocumento] = useState('');
    const [numeroDocumento, setNumeroDocumento] = useState('');
    const [nombres, setNombres] = useState('');
    const [apellidos, setApellidos] = useState('');
    const [telefono, setTelefono] = useState('');
    const [correo, setCorreo] = useState('');
    
    // Nuevos estados para el manejo de clientes
    const [buscandoCliente, setBuscandoCliente] = useState(false);
    const [clienteEncontrado, setClienteEncontrado] = useState(false);
    const [clienteId, setClienteId] = useState(null);
    const [camposHabilitados, setCamposHabilitados] = useState(true);
    
    const barcodeInputRef = useRef(null);
    const timeoutRef = useRef(null);
    const documentoTimeoutRef = useRef(null);

    const mostrarError = (titulo, mensaje) => {
        setErrorTitle(titulo);
        setErrorMessage(mensaje);
        setShowErrorPopup(true);
    };

    const cerrarErrorPopup = () => {
        setShowErrorPopup(false);
        setErrorTitle('');
        setErrorMessage('');
    };

    useEffect(() => {
        if (showPopup && activeTab === 'barcode' && barcodeInputRef.current) {
            setTimeout(() => {
                barcodeInputRef.current.focus();
                setIsListening(true);
            }, 300);
        }
    }, [showPopup, activeTab]);

    useEffect(() => {
        setBarcodeInput('');
        setProductId('');
        setQuantity(1);
        setIsListening(false);
    }, [activeTab]);

    const obtenerProductos = async () => {
        try {
            setCargandoProductos(true);
            const res = await clienteAxios.get('/api/productos');
            
            if (res.data && Array.isArray(res.data)) {
                setProductos(res.data);
            } else {
                setProductos([]);
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

    // 🔍 Nueva función para buscar cliente por documento
    const buscarClientePorDocumento = async (documento) => {
        if (!documento || documento.length < 5) {
            return;
        }

        try {
            setBuscandoCliente(true);
            const res = await clienteAxios.get(`/api/Usuario/documento/${documento}`);
            
            if (res.data && res.data.usuario) {
                // Cliente encontrado - autocompletar datos
                const cliente = res.data.usuario;
                setClienteEncontrado(true);
                setClienteId(cliente._id);
                setNombres(cliente.nombre || '');
                setApellidos(cliente.apellido || '');
                setTelefono(cliente.telefono || '');
                setCorreo(cliente.correo_electronico || '');
                setTipoDocumento(cliente.tipo_documento || '');
                setCamposHabilitados(false);
                
                Swal.fire({
                    icon: 'success',
                    title: 'Cliente encontrado',
                    text: `${cliente.nombre} ${cliente.apellido}`,
                    timer: 2000,
                    showConfirmButton: false
                });
            } else {
                // Cliente no encontrado - habilitar campos para registro
                setClienteEncontrado(false);
                setClienteId(null);
                setNombres('');
                setApellidos('');
                setTelefono('');
                setCorreo('');
                setCamposHabilitados(true);
                
                Swal.fire({
                    icon: 'info',
                    title: 'Cliente no registrado',
                    text: 'Complete los datos para registrar al nuevo cliente',
                    timer: 3000,
                    showConfirmButton: false
                });
            }
            setBuscandoCliente(false);
        } catch (error) {
            setBuscandoCliente(false);
            console.error('Error al buscar cliente:', error);
            
            // Si el error es 404, el cliente no existe
            if (error.response && error.response.status === 404) {
                setClienteEncontrado(false);
                setClienteId(null);
                setNombres('');
                setApellidos('');
                setTelefono('');
                setCorreo('');
                setCamposHabilitados(true);
                
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

    // Handler para el cambio en el número de documento con delay
    const handleNumeroDocumentoChange = (value) => {
        setNumeroDocumento(value);
        
        // Limpiar timeout anterior
        clearTimeout(documentoTimeoutRef.current);
        
        // Crear nuevo timeout para buscar después de 800ms
        documentoTimeoutRef.current = setTimeout(() => {
            if (value.length >= 5 && tipoDocumento) {
                buscarClientePorDocumento(value);
            }
        }, 800);
    };

    // 📝 Función para registrar nuevo cliente
    const registrarNuevoCliente = async () => {
        try {
            const datosCliente = {
                nombre: nombres,
                apellido: apellidos,
                tipo_documento: tipoDocumento,
                numero_documento: numeroDocumento,
                correo_electronico: correo,
                telefono: telefono,
                password: 'temporal123', // Contraseña temporal
                estado: 'Activo',
                tipo_usuario: 'CLIENTE'
            };

            const res = await clienteAxios.post('/api/Usuario', datosCliente);
            
            if (res.data) {
                setClienteEncontrado(true);
                setClienteId(res.data._id || null);
                setCamposHabilitados(false);
                
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
                        <label style="display: block; margin-bottom: 5px;"><strong>Cantidad a agregar:</strong></label>
                        <input 
                            type="number" 
                            id="cantidadProducto" 
                            value="${quantity}" 
                            min="1" 
                            max="${producto.cantidad}"
                            style="width: 80px; padding: 5px; border: 2px solid #276177; border-radius: 4px;"
                        />
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Agregar a factura',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#276177',
            cancelButtonColor: '#d33',
            didOpen: () => {
                const input = document.getElementById('cantidadProducto');
                input.focus();
                input.select();
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
        // Validar que hay productos
        if (productosFactura.length === 0) {
            mostrarError('Error', 'Debe agregar al menos un producto a la factura');
            return;
        }

        // Validar datos del cliente
        if (!tipoDocumento || !numeroDocumento || !nombres || !apellidos || !telefono) {
            mostrarError('Datos incompletos', 'Complete todos los datos del cliente');
            return;
        }

        setGenerandoFactura(true);

        try {
            // Si el cliente no existe, registrarlo primero
            if (!clienteEncontrado) {
                const registrado = await registrarNuevoCliente();
                if (!registrado) {
                    setGenerandoFactura(false);
                    return;
                }
            }

            const total = productosFactura.reduce((sum, producto) => {
                return sum + (producto.precio * producto.cantidad);
            }, 0);

            const datosFactura = {
                total: total,
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
                    producto: p.nombre,
                    cantidad: p.cantidad,
                    precio: p.precio
                }))
            };
            
            console.log('📄 Datos de la factura a enviar:', datosFactura);

            const res = await clienteAxios.post('/api/facturas', datosFactura);
            
            Swal.fire('Correcto', 'Factura generada y guardada', 'success');
            console.log(res.data);
            
            limpiarFormulario();

        } catch (error) {
            console.error('❌ Error al generar la factura:', error.response?.data?.mensaje || error.message);
            setErrorTitle('Error de Validación');
            setErrorMessage('Error al generar la factura. Verifique los datos e intente nuevamente.');
            setShowErrorPopup(true);
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
            cancelButtonText: 'No, continuar'
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
    };

    const cerrarPopup = () => {
        setShowPopup(false);
        setBarcodeInput('');
        setProductId('');
        setQuantity(1);
        setIsListening(false);
        clearTimeout(timeoutRef.current);
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

    const eliminarProducto = (productId) => {
        setProductosFactura(prev => prev.filter(p => p.id !== productId));
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
            <div className={styles.facturacionContainer}>
                <div className={styles.facturacionForm}>
                    <select 
                        value={tipoDocumento}
                        onChange={(e) => {
                            setTipoDocumento(e.target.value);
                            // Si ya hay número de documento, buscar cliente
                            if (numeroDocumento.length >= 5) {
                                buscarClientePorDocumento(numeroDocumento);
                            }
                        }}
                        disabled={buscandoCliente}
                    >
                        <option value="">Seleccione tipo de documento</option>
                        <option value="Cedula de ciudadania">Cédula de ciudadanía</option>
                        <option value="Cedula extranjeria">Cédula de extranjería</option>
                        <option value="Nit">NIT</option>
                        <option value="Pasaporte">Pasaporte</option>
                    </select>
                    <div style={{ position: 'relative', width: '48.5%' }}>
                        <input 
                            type="text" 
                            placeholder="Número documento"
                            value={numeroDocumento}
                            onChange={(e) => handleNumeroDocumentoChange(e.target.value)}
                            disabled={buscandoCliente}
                            style={{ width: '100%' }}
                        />
                        {buscandoCliente && (
                            <i 
                                className="fa fa-spinner fa-spin" 
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
                    <input 
                        type="text" 
                        placeholder="Nombres" 
                        value={nombres}
                        onChange={(e) => setNombres(e.target.value)}
                        disabled={!camposHabilitados || buscandoCliente}
                        style={{
                            backgroundColor: !camposHabilitados ? '#f0f0f0' : 'white'
                        }}
                    />
                    <input 
                        type="text" 
                        placeholder="Apellidos"
                        value={apellidos}
                        onChange={(e) => setApellidos(e.target.value)}
                        disabled={!camposHabilitados || buscandoCliente}
                        style={{
                            backgroundColor: !camposHabilitados ? '#f0f0f0' : 'white'
                        }}
                    />
                    <input 
                        type="text" 
                        placeholder="Teléfono"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        disabled={!camposHabilitados || buscandoCliente}
                        style={{
                            backgroundColor: !camposHabilitados ? '#f0f0f0' : 'white'
                        }}
                    />
                    <input 
                        type="email" 
                        placeholder="Correo (opcional)"
                        value={correo}
                        onChange={(e) => setCorreo(e.target.value)}
                        disabled={!camposHabilitados || buscandoCliente}
                        style={{
                            backgroundColor: !camposHabilitados ? '#f0f0f0' : 'white'
                        }}
                    />
                    {clienteEncontrado && (
                        <small style={{ 
                            color: '#28a745', 
                            marginTop: '-10px', 
                            display: 'block',
                            fontWeight: 'bold'
                        }}>
                            ✓ Cliente encontrado en el sistema
                        </small>
                    )}
                </div>
                
                <div className={styles.botonAnadir}>
                    <button onClick={abrirPopup} className="fa-solid fa-plus"></button>
                </div>
                
                <table className={styles.facturacionTabla}>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre producto</th>
                            <th>Cantidad</th>
                            <th>Precio Unit.</th>
                            <th>Subtotal</th>
                            <th>Borrar</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cargandoProductos ? (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: 'var(--color-tres)' }}>
                                    <i className="fa fa-spinner fa-spin"></i>
                                    <p>Cargando productos...</p>
                                </td>
                            </tr>
                        ) : esperandoProducto ? (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: 'var(--color-tres)' }}>
                                    <i className="fa fa-search fa-spin"></i>
                                    <p>Esperando producto...</p>
                                </td>
                            </tr>
                        ) : generandoFactura ? (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: 'var(--color-tres)' }}>
                                    <i className="fa fa-cog fa-spin"></i>
                                    <p>Generando factura...</p>
                                </td>
                            </tr>
                        ) : productosFactura.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: 'var(--color-tres)' }}>
                                    <i className="fas fa-inbox"></i>
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
                                                onClick={() => eliminarProducto(producto.id)}
                                                title={`Eliminar ${producto.nombre}`}
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
                                            ${formatearPrecio(calcularTotal())}
                                        </td>
                                        <td></td>
                                    </tr>
                                )}
                            </>
                        )}
                    </tbody>
                </table>
                
                <div className={styles.botonesFinales}>
                    <button onClick={cancelarFactura} disabled={generandoFactura}>
                        Cancelar
                    </button>
                    <button 
                        onClick={generarFactura} 
                        disabled={generandoFactura || productosFactura.length === 0}
                    >
                        {generandoFactura ? 'Generando...' : 'Generar'}
                    </button>
                </div>
            </div>

            {/* Popup para agregar productos */}
            {showPopup && (
                <div className={styles.popup} style={{ display: 'flex' }} onClick={cerrarPopup}>
                    <div className={styles.popupContent} onClick={(e) => e.stopPropagation()}>
                        <button 
                            className={styles.popupCloseButton}
                            onClick={cerrarPopup}
                        >
                            ×
                        </button>

                        <h3>Agregar Producto</h3>

                        {/* Pestañas */}
                        <div className={styles.popupTabs}>
                            <button
                                className={`${styles.popupTabButton} ${activeTab === 'barcode' ? styles.active : ''}`}
                                onClick={() => setActiveTab('barcode')}
                            >
                                <i className="fas fa-barcode"></i> Código Barras
                            </button>
                            <button
                                className={`${styles.popupTabButton} ${activeTab === 'id' ? styles.active : ''}`}
                                onClick={() => setActiveTab('id')}
                            >
                                <i className="fas fa-hashtag"></i> Por ID
                            </button>
                        </div>

                        {/* Contenido según pestaña activa */}
                        {activeTab === 'barcode' ? (
                            <div className={styles.popupInputContainer}>
                                <p>
                                    {isListening ? (
                                        <><i className="fas fa-barcode fa-spin"></i> Esperando código de barras...</>
                                    ) : (
                                        'Escanee el código o ingrese manualmente'
                                    )}
                                </p>
                                
                                <input
                                    ref={barcodeInputRef}
                                    type="text"
                                    placeholder="Código de barras"
                                    value={barcodeInput}
                                    onChange={(e) => handleBarcodeInput(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            buscarProducto();
                                        }
                                    }}
                                    className={styles.popupInput}
                                />
                            </div>
                        ) : (
                            <div className={styles.popupInputContainer}>
                                <p>Ingrese el ID del producto (últimos 6 caracteres)</p>
                                
                                <input
                                    type="text"
                                    placeholder="ID del producto"
                                    value={productId}
                                    onChange={(e) => setProductId(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            buscarProducto();
                                        }
                                    }}
                                    className={styles.popupInput}
                                />
                            </div>
                        )}

                        {/* Botones de acción */}
                        <div className={styles.popupButtonsContainer}>
                            <button
                                onClick={buscarProducto}
                                className={`${styles.popupButton} ${styles.popupButtonPrimary}`}
                            >
                                <i className="fas fa-search"></i> Buscar
                            </button>
                            <button
                                onClick={cerrarPopup}
                                className={`${styles.popupButton} ${styles.popupButtonSecondary}`}
                            >
                                Cancelar
                            </button>
                        </div>

                        <p className={styles.popupMessage}>
                            💡 El lector de código de barras se detecta automáticamente
                        </p>
                    </div>
                </div>
            )}

            {/* Popup de error personalizado */}
            {showErrorPopup && (
                <div className={styles.popup} style={{ display: 'flex' }} onClick={cerrarErrorPopup}>
                    <div className={styles.popupContent} onClick={(e) => e.stopPropagation()}>
                        <button 
                            className={styles.popupCloseButton}
                            onClick={cerrarErrorPopup}
                        >
                            ×
                        </button>

                        <div className={styles.errorContent}>
                            <i className="fas fa-exclamation-triangle"></i>
                        </div>
                        <h3 className={styles.errorTitle}>{errorTitle}</h3>
                        <p className={styles.errorMessage}>{errorMessage}</p>

                        <button
                            onClick={cerrarErrorPopup}
                            className={`${styles.popupButton} ${styles.popupButtonPrimary}`}
                            style={{ marginTop: '20px' }}
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