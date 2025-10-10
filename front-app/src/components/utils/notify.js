import React, { useState, useEffect, Fragment } from 'react';
import usuarioAxios from '../../config/axios';
import Swal from 'sweetalert2';
import styles from './notify.module.css';


function Notificaciones({ idUsuario }) {

    const [numeroFactura, setNumeroFactura] = useState("");
    const [numeroDocumentoUsuario, setNumeroDocumentoUsuario] = useState("");

    const crearNotificacion = async (e) => {
        e.preventDefault();
        try {
            const { data } = await usuarioAxios.post("/notificaciones/crear", {
                numeroFactura,
                numeroDocumentoUsuario
            });
            Swal.fire("Éxito", data.mensaje, "success");
            setNumeroFactura("");
            setNumeroDocumentoUsuario("");
        } catch (error) {
            console.error(error); 
            Swal.fire("Error", "No se pudo crear la notificación", "error");
        }
    };

    const cancelarAccion = () => {
        Swal.fire("Cancelado", "Se canceló la acción", "info");
        setNumeroFactura("");
        setNumeroDocumentoUsuario("");
    };

    return (
        <Fragment>
            <div className={styles.mainContainer}>

                {/* Formulario para crear notificación */}
                <form onSubmit={crearNotificacion}>

                    <div className={styles.inputGroup}>
                        <label>Ingrese el documento del cliente:</label>
                        <input
                            type="text"
                            value={numeroDocumentoUsuario}
                            onChange={(e) => setNumeroDocumentoUsuario(e.target.value)}
                            placeholder="Ingrese el número de documento"
                            required
                        />
                    </div>
                    
                    <div className={styles.inputGroup}>
                        <label>Ingrese el numero de la factura:</label>
                        <input
                            type="text"
                            value={numeroFactura}
                            onChange={(e) => setNumeroFactura(e.target.value)}
                            placeholder="Ingrese el número de factura"
                            required
                        />
                    </div>
                    

                    <p className={styles.instruccion}>
                        Para enviar una notificacion ingrese la informacion solicitada en los campos solicitados y elija la opcion para enviar, de lo contrario cancelar.
                    </p>
                    
                    <div className={styles.buttonGroup}>
                        <button type="button" className={styles.enviar} onClick={cancelarAccion}>
                            Cancelar
                        </button>
                        <button type="submit" className={styles.enviar}>
                            Enviar
                        </button>
                        
                    </div>
                </form>
            </div>
        </Fragment>
    );
}

export default Notificaciones;