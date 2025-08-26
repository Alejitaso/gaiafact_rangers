import React, { Fragment, useState } from "react";
import { withRouter } from "react-router-dom/cjs/react-router-dom.min";
import Swal from "sweetalert2";
import clienteAxios from "../../config/axios";

function RegistroProducto(props) {
    // Estado del producto
    const [producto, datosProducto] = useState({
        nombre: '',
        cantidad: '',
        precio: '',
        tipoPrenda: '',
        descripcion: ''
    });

    // Estado para manejar loading
    const [cargando, setCargando] = useState(false);

    // Función para registrar el producto
    const registrarProducto = async e => {
        e.preventDefault();

        // Validar que todos los campos estén llenos
        if (!producto.nombre || !producto.cantidad || !producto.precio || 
            !producto.tipoPrenda || !producto.descripcion) {
            Swal.fire({
                type: 'error',
                title: 'Campos incompletos',
                text: 'Por favor llena todos los campos'
            });
            return;
        }

        // Validar que cantidad y precio sean números válidos
        if (isNaN(producto.cantidad) || producto.cantidad < 0) {
            Swal.fire({
                type: 'error',
                title: 'Cantidad inválida',
                text: 'La cantidad debe ser un número mayor o igual a 0'
            });
            return;
        }

        if (isNaN(producto.precio) || producto.precio < 0) {
            Swal.fire({
                type: 'error',
                title: 'Precio inválido',
                text: 'El precio debe ser un número mayor o igual a 0'
            });
            return;
        }

        setCargando(true);

        try {
            // Preparar datos para enviar
            const datosEnvio = {
                nombre: producto.nombre.trim(),
                cantidad: parseInt(producto.cantidad),
                precio: parseFloat(producto.precio),
                tipoPrenda: producto.tipoPrenda,
                descripcion: producto.descripcion.trim()
            };

            const res = await clienteAxios.post('/api/productos', datosEnvio, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            setCargando(false);

            if (res.status === 201) {
                // Mostrar modal de éxito con opciones
                const result = await Swal.fire({
                    title: 'Producto registrado correctamente',
                    html: `
                        <div style="text-align: left; margin: 20px 0;">
                            <h4><i class="fas fa-box"></i> ${res.data.producto.nombre}</h4>
                            <p><strong>Cantidad:</strong> ${res.data.producto.cantidad} unidades</p>
                            <p><strong>Precio:</strong> $${formatearPrecio(res.data.producto.precio)}</p>
                            <p><strong>Tipo:</strong> ${res.data.producto.tipoPrenda}</p>
                            <p><strong>Descripción:</strong> ${res.data.producto.descripcion}</p>
                        </div>
                    `,
                    icon: 'success',
                    showCancelButton: true,
                    showDenyButton: true,
                    confirmButtonText: 'Ver Inventario',
                    cancelButtonText: 'Registrar otro',
                    denyButtonText: 'Editar producto',
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#28a745',
                    denyButtonColor: '#ffc107'
                });

                // Limpiar formulario
                limpiarFormulario();

                // Manejar respuesta del modal
                if (result.isConfirmed) {
                    props.history.push('/inventario');
                } else if (result.isDenied) {
                    props.history.push(`/productos/editar/${res.data.producto._id}`);
                } else if (result.dismiss === Swal.DismissReason.cancel) {
                    // Quedarse en la misma página para registrar otro producto
                }
            }

        } catch (error) {
            console.log(error);
            setCargando(false);
            
            let mensajeError = 'Intente nuevamente';
            
            if (error.response && error.response.data && error.response.data.mensaje) {
                mensajeError = error.response.data.mensaje;
            }

            Swal.fire({
                type: 'error',
                title: 'Hubo un error',
                text: mensajeError
            });
        }
    }

    // Leer datos del formulario
    const leerInformacionProducto = e => {
        datosProducto({
            ...producto,
            [e.target.name]: e.target.value
        });
    }

    // Limpiar formulario
    const limpiarFormulario = () => {
        datosProducto({
            nombre: '',
            cantidad: '',
            precio: '',
            tipoPrenda: '',
            descripcion: ''
        });
    }

    // Formatear precio
    const formatearPrecio = (precio) => {
        return precio.toLocaleString('es-CO', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
    }

    return (
        <Fragment>
            <div className="background-container"></div>
            
            <div className="main-content">
                <header>
                    <div className="logos">
                        <div className="logo-izquierdo">
                            <img src="../img/logo_final (1).png" alt="Logo Izquierdo" />
                        </div>
                        <div className="nombre-tienda">
                            Athena'S
                        </div>
                        <div className="logo-derecho">
                            <img src="../img/logo_athena_S.png" alt="Logo Derecho" />
                        </div>
                    </div>
                    <div className="nombre">
                        <h1>Registro de producto</h1>
                    </div>
                </header>

                <form className="register-form" onSubmit={registrarProducto}>
                    <div className="text">
                        <input 
                            type="text" 
                            placeholder="NOMBRE DEL PRODUCTO" 
                            name="nombre"
                            value={producto.nombre}
                            onChange={leerInformacionProducto}
                            required 
                        />
                    </div>

                    <div className="text">
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

                    <div className="text">
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

                    <div className="text">
                        <select 
                            name="tipoPrenda"
                            value={producto.tipoPrenda}
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
                            className="textarea1" 
                            placeholder="DESCRIPCIÓN DEL PRODUCTO" 
                            name="descripcion"
                            value={producto.descripcion}
                            onChange={leerInformacionProducto}
                            required
                        />
                    </div>

                    <div className="boton">
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

                <footer className="footer">
                    <div className="linea"></div>
                    <div className="copyright">
                        <h2>© 2025 Gaiafact</h2>
                    </div>
                </footer>
            </div>
        </Fragment>
    );
}

export default withRouter(RegistroProducto);