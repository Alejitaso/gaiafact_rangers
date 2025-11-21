import React, { Fragment, useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import clienteAxios from "../../config/axios";
import styles from './registroProduct.module.css';

function RegistroProducto() {
    const navigate = useNavigate();
    const location = useLocation();

    const [producto, setProducto] = useState({
        nombre: '',
        cantidad: '',
        precio: '',
        tipo_prenda: '',
        descripcion: ''
    });

    const [cargando, setCargando] = useState(false);
    const [mensajeEstado, setMensajeEstado] = useState('');
    const [errores, setErrores] = useState({});

    const nombreInputRef = useRef(null);
    const anuncioRef = useRef(null);

    // Limpieza TOTAL de cualquier popup en montaje o cambio de ruta
    useEffect(() => {
        cerrarForzadoSweetAlert();
        // Focus en el primer campo al cargar
        if (nombreInputRef.current) {
            nombreInputRef.current.focus();
        }
    }, [location.pathname]);

    // Anunciar mensajes para lectores de pantalla
    const anunciar = (mensaje) => {
        setMensajeEstado(mensaje);
        setTimeout(() => setMensajeEstado(''), 100);
    };

    const cerrarForzadoSweetAlert = () => {
        try {
            Swal.close();
            const containers = document.querySelectorAll('.swal2-container');
            containers.forEach(c => c.remove());
            const popups = document.querySelectorAll('.swal2-popup');
            popups.forEach(p => p.remove());
        } catch (e) {
            console.warn("No había popups para cerrar");
        }
    };

    const validarCamposCompletos = () => {
        const { nombre, cantidad, precio, tipo_prenda, descripcion } = producto;
        const nuevosErrores = {};

        if (!nombre.trim()) nuevosErrores.nombre = 'El nombre es requerido';
        if (!cantidad) nuevosErrores.cantidad = 'La cantidad es requerida';
        if (!precio) nuevosErrores.precio = 'El precio es requerido';
        if (!tipo_prenda) nuevosErrores.tipo_prenda = 'El tipo de prenda es requerido';
        if (!descripcion.trim()) nuevosErrores.descripcion = 'La descripción es requerida';

        setErrores(nuevosErrores);
        return Object.keys(nuevosErrores).length === 0;
    };

    const validarCantidad = () => {
        const cantidad = parseFloat(producto.cantidad);
        if (isNaN(cantidad) || cantidad < 0) {
            setErrores(prev => ({ ...prev, cantidad: 'La cantidad debe ser un número mayor o igual a 0' }));
            return false;
        }
        return true;
    };

    const validarPrecio = () => {
        const precio = parseFloat(producto.precio);
        if (isNaN(precio) || precio < 0) {
            setErrores(prev => ({ ...prev, precio: 'El precio debe ser un número mayor o igual a 0' }));
            return false;
        }
        return true;
    };

    const mostrarErrorValidacion = (titulo, mensaje) => {
        cerrarForzadoSweetAlert();
        anunciar(`Error: ${mensaje}`);
        Swal.fire({
            title: titulo,
            text: mensaje,
            icon: 'error',
            confirmButtonText: 'Aceptar',
            backdrop: true,
            allowOutsideClick: true,
            allowEscapeKey: true,
            allowEnterKey: true,
            customClass: {
                popup: 'custom-swal-popup',
                title: 'custom-swal-title',
                htmlContainer: 'custom-swal-html'
            },
            willClose: cerrarForzadoSweetAlert
        });
    };

    const leerInformacionProducto = (e) => {
        const { name, value } = e.target;
        setProducto({
            ...producto,
            [name]: value
        });
        // Limpiar error del campo cuando el usuario empiece a escribir
        if (errores[name]) {
            setErrores(prev => {
                const nuevosErrores = { ...prev };
                delete nuevosErrores[name];
                return nuevosErrores;
            });
        }
    };

    const limpiarFormulario = () => {
        setProducto({
            nombre: '',
            cantidad: '',
            precio: '',
            tipo_prenda: '',
            descripcion: ''
        });
        setErrores({});
        anunciar('Formulario limpiado');
        if (nombreInputRef.current) {
            nombreInputRef.current.focus();
        }
    };

    const formatearPrecio = (precio) => {
        return precio.toLocaleString('es-CO', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
    };

    const prepararDatosEnvio = () => ({
        nombre: producto.nombre.trim(),
        cantidad: parseInt(producto.cantidad),
        precio: parseFloat(producto.precio),
        tipo_prenda: producto.tipo_prenda,
        descripcion: producto.descripcion.trim()
    });

    const registrarProducto = async (e) => {
        e.preventDefault();

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
        anunciar('Registrando producto, por favor espere');

        try {
            const datosEnvio = prepararDatosEnvio();
            const res = await clienteAxios.post('/api/productos', datosEnvio, {
                headers: { 'Content-Type': 'application/json' }
            });

            setCargando(false);

            if (res.status === 201 || res.status === 200) {
                limpiarFormulario();
                anunciar(`Producto ${datosEnvio.nombre} registrado exitosamente`);
                mostrarPopupExito(datosEnvio);
            } else {
                mostrarErrorValidacion("Aviso", "El servidor respondió pero con un estado inesperado.");
            }

        } catch (error) {
            setCargando(false);
            anunciar('Error al registrar el producto');
            mostrarErrorValidacion('Hubo un error', error.response?.data?.mensaje || 'Intente nuevamente');
        }
    };

    const mostrarPopupExito = async (productoRegistrado) => {
        cerrarForzadoSweetAlert();
        Swal.fire({
            title: '¡Producto registrado correctamente!',
            html: `
                <div style="text-align: left; margin: 15px 0;">
                    <h4><i class="fas fa-box" aria-hidden="true"></i> ${productoRegistrado.nombre}</h4>
                    <p><strong>Cantidad:</strong> ${productoRegistrado.cantidad} unidades</p>
                    <p><strong>Precio:</strong> $${formatearPrecio(productoRegistrado.precio)}</p>
                    <p><strong>Tipo:</strong> ${productoRegistrado.tipo_prenda}</p>
                    <p><strong>Descripción:</strong> ${productoRegistrado.descripcion}</p>
                </div>
                <div>
                    <button id="btnInventario" class="swal2-custom-btn" aria-label="Ir a inventario">
                        <i class="fas fa-boxes" aria-hidden="true"></i> Inventario
                    </button>
                    <button id="btnRegistrar" class="swal2-custom-btn" aria-label="Registrar otro producto">
                        <i class="fas fa-plus" aria-hidden="true"></i> Registrar
                    </button>
                    <button id="btnEditar" class="swal2-custom-btn" aria-label="Ir a editar productos">
                        <i class="fas fa-edit" aria-hidden="true"></i> Editar
                    </button>
                </div>
            `,
            showConfirmButton: false,
            backdrop: true,
            allowOutsideClick: true,
            allowEscapeKey: true,
            allowEnterKey: true,
            customClass: {
                popup: 'custom-swal-popup',
                title: 'custom-swal-title',
                htmlContainer: 'custom-swal-html'
            },
            willClose: cerrarForzadoSweetAlert,
            didOpen: () => {
                const cerrarYNavegar = (ruta) => {
                    cerrarForzadoSweetAlert();
                    setTimeout(() => navigate(ruta), 100);
                };

                document.getElementById('btnInventario').addEventListener('click', () => cerrarYNavegar('/inventario'));
                document.getElementById('btnRegistrar').addEventListener('click', () => cerrarForzadoSweetAlert());
                document.getElementById('btnEditar').addEventListener('click', () => cerrarYNavegar('/inventario'));

                // Focus en el primer botón para accesibilidad
                document.getElementById('btnInventario')?.focus();
            }
        });
    };

    return (
        <Fragment>
            {/* Región de anuncios en vivo para lectores de pantalla */}
            <div 
                role="status" 
                aria-live="polite" 
                aria-atomic="true"
                className="sr-only"
                ref={anuncioRef}
            >
                {mensajeEstado}
            </div>

            <div className="background-container"></div>
            <div className="main-content">
                <form 
                    className={`register-form ${styles['register-form'] || ''}`} 
                    onSubmit={registrarProducto}
                    noValidate
                    role="form"
                    aria-label="Formulario de registro de productos"
                >
                    {/* Título principal oculto visualmente pero accesible */}
                    <h1 className="sr-only">Registro de Producto</h1>

                    {/* Campo: Nombre del producto */}
                    <div className={`text ${styles.text || ''}`}>
                        <label htmlFor="nombre" className="sr-only">
                            Nombre del producto
                        </label>
                        <input 
                            ref={nombreInputRef}
                            id="nombre"
                            type="text" 
                            placeholder="NOMBRE DEL PRODUCTO" 
                            name="nombre"
                            value={producto.nombre}
                            onChange={leerInformacionProducto}
                            aria-required="true"
                            aria-invalid={!!errores.nombre}
                            aria-describedby={errores.nombre ? "error-nombre" : undefined}
                            required 
                        />
                        {errores.nombre && (
                            <span id="error-nombre" className={styles.errorMessage} role="alert">
                                {errores.nombre}
                            </span>
                        )}
                    </div>

                    {/* Campo: Cantidad */}
                    <div className={`text ${styles.text || ''}`}>
                        <label htmlFor="cantidad" className="sr-only">
                            Cantidad de unidades
                        </label>
                        <input 
                            id="cantidad"
                            type="number" 
                            placeholder="CANTIDAD" 
                            name="cantidad"
                            value={producto.cantidad}
                            onChange={leerInformacionProducto}
                            min="0"
                            aria-required="true"
                            aria-invalid={!!errores.cantidad}
                            aria-describedby={errores.cantidad ? "error-cantidad" : undefined}
                            required 
                        />
                        {errores.cantidad && (
                            <span id="error-cantidad" className={styles.errorMessage} role="alert">
                                {errores.cantidad}
                            </span>
                        )}
                    </div>

                    {/* Campo: Precio */}
                    <div className={`text ${styles.text || ''}`}>
                        <label htmlFor="precio" className="sr-only">
                            Precio unitario del producto
                        </label>
                        <input 
                            id="precio"
                            type="number" 
                            placeholder="PRECIO UNITARIO" 
                            name="precio"
                            value={producto.precio}
                            onChange={leerInformacionProducto}
                            min="0"
                            step="0.01"
                            aria-required="true"
                            aria-invalid={!!errores.precio}
                            aria-describedby={errores.precio ? "error-precio" : undefined}
                            required 
                        />
                        {errores.precio && (
                            <span id="error-precio" className={styles.errorMessage} role="alert">
                                {errores.precio}
                            </span>
                        )}
                    </div>

                    {/* Campo: Tipo de prenda */}
                    <div className={`text ${styles.text || ''}`}>
                        <label htmlFor="tipo_prenda" className="sr-only">
                            Tipo de prenda
                        </label>
                        <select 
                            id="tipo_prenda"
                            name="tipo_prenda"
                            value={producto.tipo_prenda}
                            onChange={leerInformacionProducto}
                            aria-required="true"
                            aria-invalid={!!errores.tipo_prenda}
                            aria-describedby={errores.tipo_prenda ? "error-tipo" : undefined}
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
                        {errores.tipo_prenda && (
                            <span id="error-tipo" className={styles.errorMessage} role="alert">
                                {errores.tipo_prenda}
                            </span>
                        )}
                    </div>

                    {/* Campo: Descripción */}
                    <div>
                        <label htmlFor="descripcion" className="sr-only">
                            Descripción del producto
                        </label>
                        <textarea 
                            id="descripcion"
                            className={`textarea1 ${styles.textarea1 || ''}`}
                            placeholder="DESCRIPCIÓN DEL PRODUCTO" 
                            name="descripcion"
                            value={producto.descripcion}
                            onChange={leerInformacionProducto}
                            aria-required="true"
                            aria-invalid={!!errores.descripcion}
                            aria-describedby={errores.descripcion ? "error-descripcion" : undefined}
                            rows="4"
                            required
                        />
                        {errores.descripcion && (
                            <span id="error-descripcion" className={styles.errorMessage} role="alert">
                                {errores.descripcion}
                            </span>
                        )}
                    </div>

                    {/* Botón de envío */}
                    <div className={`boton ${styles.boton || ''}`}>
                        <button 
                            id="enviar" 
                            type="submit" 
                            disabled={cargando}
                            aria-label={cargando ? 'Registrando producto' : 'Agregar producto al inventario'}
                            aria-busy={cargando}
                        >
                            {cargando ? (
                                <>
                                    <i className="fa fa-spinner fa-spin" aria-hidden="true"></i>
                                    {' '}Registrando...
                                </>
                            ) : (
                                'Agregar'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </Fragment>
    );
}

export default RegistroProducto;