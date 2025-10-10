import React, { Fragment, useState, useEffect } from "react";
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

    // ✅ Limpieza TOTAL de cualquier popup en montaje o cambio de ruta
    useEffect(() => {
        cerrarForzadoSweetAlert();
    }, [location.pathname]);

    const cerrarForzadoSweetAlert = () => {
        try {
            Swal.close();
            // Eliminar manualmente cualquier contenedor residual
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
        return nombre && cantidad && precio && tipo_prenda && descripcion;
    };

    const validarCantidad = () => !isNaN(producto.cantidad) && producto.cantidad >= 0;
    const validarPrecio = () => !isNaN(producto.precio) && producto.precio >= 0;

    const mostrarErrorValidacion = (titulo, mensaje) => {
        cerrarForzadoSweetAlert();
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

        try {
            const datosEnvio = prepararDatosEnvio();
            const res = await clienteAxios.post('/api/productos', datosEnvio, {
                headers: { 'Content-Type': 'application/json' }
            });

            setCargando(false);

            if (res.status === 201 || res.status === 200) {
                limpiarFormulario();
                mostrarPopupExito(datosEnvio);
            } else {
                mostrarErrorValidacion("Aviso", "El servidor respondió pero con un estado inesperado.");
            }

        } catch (error) {
            setCargando(false);
            mostrarErrorValidacion('Hubo un error', error.response?.data?.mensaje || 'Intente nuevamente');
        }
    };

    const mostrarPopupExito = async (productoRegistrado) => {
        cerrarForzadoSweetAlert(); // ✅ Garantiza que no haya otro abierto
        Swal.fire({
            title: '¡Producto registrado correctamente!',
            html: `
                <div style="text-align: left; margin: 15px 0;">
                    <h4><i class="fas fa-box"></i> ${productoRegistrado.nombre}</h4>
                    <p><strong>Cantidad:</strong> ${productoRegistrado.cantidad} unidades</p>
                    <p><strong>Precio:</strong> $${formatearPrecio(productoRegistrado.precio)}</p>
                    <p><strong>Tipo:</strong> ${productoRegistrado.tipo_prenda}</p>
                    <p><strong>Descripción:</strong> ${productoRegistrado.descripcion}</p>
                </div>
                <div>
                    <button id="btnInventario" class="swal2-custom-btn">
                        <i class="fas fa-boxes"></i> Inventario
                    </button>
                    <button id="btnRegistrar" class="swal2-custom-btn">
                        <i class="fas fa-plus"></i> Registrar
                    </button>
                    <button id="btnEditar" class="swal2-custom-btn">
                        <i class="fas fa-edit"></i> Editar
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
            }
        });
    };

    return (
        <Fragment>
            <div className="background-container"></div>
            <div className="main-content">
                <form className={`register-form ${styles['register-form'] || ''}`} onSubmit={registrarProducto}>
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
            </div>
        </Fragment>
    );
}

export default RegistroProducto;
