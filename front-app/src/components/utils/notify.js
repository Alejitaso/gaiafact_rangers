import React, { useState, Fragment } from 'react';
import ClientesAxios from '../../config/axios';
import Swal from 'sweetalert2';
import styles from './notify.module.css'; // Importa tus estilos

function Notificaciones({ idUsuario }) {
    const [numeroFactura, setNumeroFactura] = useState("");
    const [numeroDocumentoUsuario, setNumeroDocumentoUsuario] = useState("");
    const [clienteEncontrado, setClienteEncontrado] = useState(null); // Nuevo estado para el cliente
    const [buscando, setBuscando] = useState(false); // Estado para la búsqueda

    // FUNCIÓN PARA BUSCAR EL CLIENTE Y CONFIRMAR EL CORREO
    const buscarCliente = async (documento) => {
        if (documento.length > 5) { // Búsqueda al tener suficientes caracteres
            setBuscando(true);
            try {
                // Llama al endpoint de tu Backend: /api/Usuario/documento/:documento
                // Se asume que este endpoint no requiere roles de gestor (o el token lo cumple)
                const res = await ClientesAxios.get(`/api/Usuario/documento/${documento}`);
                
                if (res.data.usuario) {
                    setClienteEncontrado(res.data.usuario);
                } else {
                    setClienteEncontrado(null);
                }
            } catch (error) {
                // Manejar error de conexión o 404
                setClienteEncontrado(null);
                console.error("Error al buscar cliente:", error);
            } finally {
                setBuscando(false);
            }
        } else {
            setClienteEncontrado(null);
        }
    };

    const handleDocumentoChange = (e) => {
        const documento = e.target.value;
        setNumeroDocumentoUsuario(documento);
        // Dispara la búsqueda al cambiar
        buscarCliente(documento);
    };

    const crearNotificacion = async (e) => {
        e.preventDefault();

        if (!numeroFactura || !numeroDocumentoUsuario || !clienteEncontrado) {
            Swal.fire("Error", "Debe ingresar el número de documento y factura, y el cliente debe ser encontrado.", "error");
            return;
        }

        // CONFIRMACIÓN VISUAL ANTES DE ENVIAR
        const { isConfirmed } = await Swal.fire({
            title: '¿Confirmar Envío?',
            html: `Se enviará la factura **#${numeroFactura}** al correo:<br><strong>${clienteEncontrado.correo_electronico}</strong>. ¿Es correcto?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, enviar',
            cancelButtonText: 'Cancelar'
        });

        if (!isConfirmed) {
            return;
        }

        try {
            // Llamada al backend
            const { data } = await ClientesAxios.post("/api/notificaciones/crear", {
                numeroFactura,
                numeroDocumentoUsuario
            });

            // Mostrar alerta al usuario confirmando que se envió el correo
            Swal.fire({
                icon: 'success',
                title: '¡Éxito!',
                text: data.mensaje,
                confirmButtonText: 'Aceptar'
            });

            // Limpiar campos
            cancelarAccion();

        } catch (error) {
            console.error(error);
            // El backend ya devuelve el mensaje de error del controlador
            const mensajeError = error.response?.data?.mensaje || "Error desconocido al crear la notificación.";
            Swal.fire("Error", mensajeError, "error");
        }
    };

    const cancelarAccion = () => {
        setNumeroFactura("");
        setNumeroDocumentoUsuario("");
        setClienteEncontrado(null); // Limpiar cliente encontrado
    };


    return (
        <Fragment>
            {/* ✅ CORRECCIÓN: Se usa la clase 'mainContainer' definida en tu CSS */}
            <div className={styles.mainContainer}> 
                <form className={styles.formContainer} onSubmit={crearNotificacion}>
                    
                    <div className={styles.inputGroup}>
                        <label>Ingrese el número de documento del cliente:</label>
                        <input
                            type="text"
                            value={numeroDocumentoUsuario}
                            onChange={handleDocumentoChange} // Conectado al manejador
                            placeholder="Ingrese el número de documento"
                            // ✅ Opción: Usar la clase 'clienteD' si prefieres su estilo específico
                            className={styles.clienteD} 
                            required
                        />
                    </div>
                    
                    {/* 🆕 Muestra la confirmación del cliente */}
                    {clienteEncontrado && (
                        // ✅ Usa la clase 'confirmacionCliente' (si existiera), o una clase semántica
                        <p className={styles.instruccion} style={{ color: 'var(--color-dos)', backgroundColor: 'var(--color-tres)', padding: '10px', borderRadius: '5px' }}>
                            ✅ Cliente encontrado: **{clienteEncontrado.nombre} {clienteEncontrado.apellido}**. Correo: **{clienteEncontrado.correo_electronico}**
                        </p>
                    )}
                    
                    <div className={styles.inputGroup}>
                        <label>Ingrese el número de la factura:</label>
                        <input
                            type="text"
                            value={numeroFactura}
                            onChange={(e) => setNumeroFactura(e.target.value)}
                            placeholder="Ingrese el número de factura"
                            required
                        />
                    </div>

                    <p className={styles.instruccion}>
                        Para enviar una notificación ingrese la información solicitada en los campos y elija "Enviar", 
                        de lo contrario presione "Cancelar".
                    </p>
                    
                    <div className={styles.buttonGroup}>
                        <button 
                            type="button" 
                            // El CSS solo tiene la clase 'enviar', si quieres estilos de "cancelar" debes definir una clase específica (ej. 'cancelarBtn')
                            className={styles.enviar} 
                            onClick={cancelarAccion}
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            className={styles.enviar} 
                            disabled={!clienteEncontrado || buscando} 
                        >
                            {buscando ? 'Buscando...' : 'Enviar'}
                        </button>
                    </div>
                </form>
            </div>
        </Fragment>
    );
}

export default Notificaciones