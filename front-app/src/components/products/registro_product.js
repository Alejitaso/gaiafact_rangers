import React, { Fragment, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import clienteAxios from "../../config/axios";
import styles from './registroProduct.module.css';

function RegistroProducto() {
    const navigate = useNavigate();
    
    // ===== ESTADOS DEL COMPONENTE =====
    const [producto, setProducto] = useState({
        nombre: '',
        cantidad: '',
        precio: '',
        tipo_prenda: '',
        descripcion: ''
    });

    const [cargando, setCargando] = useState(false);
    const [showPopup, setShowPopup] = useState(false);

    // ===== FUNCIONES DE VALIDACIÓN =====
    const validarCamposCompletos = () => {
        const { nombre, cantidad, precio, tipo_prenda, descripcion } = producto;
        return nombre && cantidad && precio && tipo_prenda && descripcion;
    };

    const validarCantidad = () => {
        return !isNaN(producto.cantidad) && producto.cantidad >= 0;
    };

    const validarPrecio = () => {
        return !isNaN(producto.precio) && producto.precio >= 0;
    };

    const mostrarErrorValidacion = (titulo, mensaje) => {
        Swal.fire({
            icon: 'error',
            title: titulo,
            text: mensaje,
            confirmButtonColor: '#d33'
        });
    };

    // ===== FUNCIONES DE MANEJO DE DATOS =====
    const leerInformacionProducto = (e) => {
        setProducto({
            ...producto,
            [e.target.name]: e.target.value
        });
    };

    const limpiarFormulario = () => {
        setProducto({
            nombre: '',
            cantidad: '',
            precio: '',
            tipo_prenda: '',
            descripcion: ''
        });
    };

    const formatearPrecio = (precio) => {
        return precio.toLocaleString('es-CO', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
    };

    const prepararDatosEnvio = () => {
        return {
            nombre: producto.nombre.trim(),
            cantidad: parseInt(producto.cantidad),
            precio: parseFloat(producto.precio),
            tipo_prenda: producto.tipo_prenda,
            descripcion: producto.descripcion.trim()
        };
    };

    // ===== FUNCIÓN PRINCIPAL DE REGISTRO =====
    const registrarProducto = async (e) => {
        e.preventDefault();

        // Validaciones
        if (!validarCamposCompletos()) {
            mostrarErrorValidacion('Campos incompletos', 'Por favor llena todos los campos');
            return;
        }

        if (!validarCantidad()) {
            mostrarErrorValidacion('Cantidad inválida', 'La cantidad debe ser un número mayor o igual a 0');
            return;
        }

        if (!validarPrecio()) {
            mostrarErrorValidacion('Precio inválido', 'El precio debe ser un número mayor o igual a 0');
            return;
        }

        setCargando(true);

        try {
            const datosEnvio = prepararDatosEnvio();
            
            const res = await clienteAxios.post('/api/productos', datosEnvio, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            setCargando(false);

            if (res.status === 201) {
                limpiarFormulario();
                mostrarPopupExito(res.data.producto);
            }

        } catch (error) {
            console.log(error);
            setCargando(false);
            
            let mensajeError = 'Intente nuevamente';
            
            if (error.response?.data?.mensaje) {
                mensajeError = error.response.data.mensaje;
            }

            mostrarErrorValidacion('Hubo un error', mensajeError);
        }
    };

    // ===== FUNCIÓN PARA MOSTRAR POPUP DE ÉXITO =====
    const mostrarPopupExito = async (productoRegistrado) => {
        // Primero mostrar el popup personalizado
        setShowPopup(true);
        
        // También mostrar el mensaje de éxito con SweetAlert
        Swal.fire({
            title: '¡Producto registrado correctamente!',
            html: `
                <div style="text-align: left; margin: 20px 0;">
                    <h4><i class="fas fa-box"></i> ${productoRegistrado.nombre}</h4>
                    <p><strong>Cantidad:</strong> ${productoRegistrado.cantidad} unidades</p>
                    <p><strong>Precio:</strong> $${formatearPrecio(productoRegistrado.precio)}</p>
                    <p><strong>Tipo:</strong> ${productoRegistrado.tipo_prenda}</p>
                    <p><strong>Descripción:</strong> ${productoRegistrado.descripcion}</p>
                </div>
            `,
            icon: 'success',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#28a745',
            timer: 5000,
            timerProgressBar: true
        });
    };

    // ===== FUNCIONES DEL POPUP =====
    const cerrarPopup = () => {
        setShowPopup(false);
    };

    const handleNavigation = (ruta) => {
        navigate(ruta);
        cerrarPopup();
    };

    // ===== RENDER DEL COMPONENTE =====
    return (
        <Fragment>
            <div className="background-container"></div>
            
            <div className="main-content">
                <form className={`register-form ${styles['register-form'] || ''}`} onSubmit={registrarProducto}>
                    
                    {/* Campo Nombre */}
                    <div className={`text ${styles.text || ''}`}>
                        <input 
                            type="text" 
                            placeholder="NOMBRE DEL PRODUCTO" 
                            name="nombre"
                            value={producto.nombre}
                            onChange={leerInformacionProducto}
                            required 
                        />
                    </div>

                    {/* Campo Cantidad */}
                    <div className={`text ${styles.text || ''}`}>
                        <input 
                            type="number" 
                            placeholder="CANTIDAD" 
                            name="cantidad"
                            value={producto.cantidad}
                            onChange={leerInformacionProducto}
                            min="0"
                            required 
                        />
                    </div>

                    {/* Campo Precio */}
                    <div className={`text ${styles.text || ''}`}>
                        <input 
                            type="number" 
                            placeholder="PRECIO UNITARIO" 
                            name="precio"
                            value={producto.precio}
                            onChange={leerInformacionProducto}
                            min="0"
                            step="0.01"
                            required 
                        />
                    </div>

                    {/* Select Tipo de Prenda */}
                    <div className={`text ${styles.text || ''}`}>
                        <select 
                            name="tipo_prenda"
                            value={producto.tipo_prenda}
                            onChange={leerInformacionProducto}
                            required
                        >
                            <option value="" disabled>TIPO DE PRENDA</option>
                            <option value="Camisetas">Camisetas</option>
                            <option value="Camisas">Camisas</option>
                            <option value="Pantalones">Pantalones</option>
                            <option value="Vestidos">Vestidos</option>
                            <option value="Faldas">Faldas</option>
                            <option value="Sacos">Sacos</option>
                        </select>
                    </div>

                    {/* Campo Descripción */}
                    <div>
                        <textarea 
                            className={`textarea1 ${styles.textarea1 || ''}`}
                            placeholder="DESCRIPCIÓN DEL PRODUCTO" 
                            name="descripcion"
                            value={producto.descripcion}
                            onChange={leerInformacionProducto}
                            required
                        />
                    </div>

                    {/* Botón de Envío */}
                    <div className={`boton ${styles.boton || ''}`}>
                        <button 
                            id="enviar" 
                            type="submit" 
                            disabled={cargando}
                        >
                            {cargando ? (
                                <>
                                    <i className="fa fa-spinner fa-spin"></i>
                                    {' '}Registrando...
                                </>
                            ) : (
                                'Agregar'
                            )}
                        </button>
                    </div>
                </form>

                {/* Popup de navegación - Solo aparece después de registrar */}
                {showPopup && (
                    <div className={styles.popupOverlay} onClick={cerrarPopup}>
                        <div className={styles.popupContainer} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.popupHeader}>
                                <h3>¿Qué deseas hacer ahora?</h3>
                                <button className={styles.popupClose} onClick={cerrarPopup}>
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                            
                            <div className={styles.popupContent}>
                                <button 
                                    className={`${styles.popupButton} ${styles.registrar}`}
                                    onClick={() => {
                                        cerrarPopup();
                                        // Permanecer en la misma página para registrar otro
                                    }}
                                >
                                    <i className="fas fa-plus"></i>
                                    <span>Registrar otro producto</span>
                                </button>

                                <button 
                                    className={`${styles.popupButton} ${styles.inventario}`}
                                    onClick={() => handleNavigation('/inventario')}
                                >
                                    <i className="fas fa-boxes"></i>
                                    <span>Ver Inventario</span>
                                </button>

                                <button 
                                    className={`${styles.popupButton} ${styles.editar}`}
                                    onClick={() => handleNavigation('/productos/editar')}
                                >
                                    <i className="fas fa-edit"></i>
                                    <span>Editar Productos</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Fragment>
    );
}

export default RegistroProducto;