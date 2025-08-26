import React, { Fragment, useState, useEffect } from "react";
import { withRouter } from "react-router-dom/cjs/react-router-dom.min";
import Swal from "sweetalert2";
import clienteAxios from "../../config/axios";
// Importar librería para generar códigos QR
import QRCode from 'qrcode';

function GeneradorQR(props) {
    // Estados del componente
    const [numeroFactura, setNumeroFactura] = useState('');
    const [codigoQR, setCodigoQR] = useState('');
    const [cargando, setCargando] = useState(false);
    const [datosFactura, setDatosFactura] = useState(null);

    // Función para generar código QR
    const generarCodigoQR = async (texto) => {
        try {
            const qrCodeURL = await QRCode.toDataURL(texto, {
                width: 200,
                height: 200,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                },
                errorCorrectionLevel: 'M',
                type: 'image/png',
                quality: 0.92,
                margin: 1
            });
            return qrCodeURL;
        } catch (error) {
            console.error('Error generando QR:', error);
            throw error;
        }
    };

    // Función para buscar factura por número
    const buscarFactura = async () => {
        if (!numeroFactura.trim()) {
            Swal.fire({
                type: 'warning',
                title: 'Número requerido',
                text: 'Por favor ingresa un número de factura válido.'
            });
            return;
        }

        try {
            setCargando(true);
            const res = await clienteAxios.get(`/api/facturas/${numeroFactura}`);
            
            if (res.data.success) {
                const factura = res.data.factura;
                setDatosFactura(factura);
                
                // Crear datos para el QR (JSON con información de la factura)
                const datosQR = {
                    numeroFactura: factura.numero || numeroFactura,
                    fecha: factura.fecha,
                    cliente: factura.cliente,
                    total: factura.total,
                    productos: factura.productos,
                    empresa: 'Athena\'S Store'
                };

                // Generar código QR
                const qrGenerado = await generarCodigoQR(JSON.stringify(datosQR));
                setCodigoQR(qrGenerado);
                
                Swal.fire({
                    type: 'success',
                    title: 'Código QR generado',
                    text: 'El código QR se ha generado correctamente.',
                    timer: 2000
                });
            } else {
                throw new Error(res.data.mensaje || 'Factura no encontrada');
            }
            
            setCargando(false);
        } catch (error) {
            console.log(error);
            setCargando(false);
            
            let mensajeError = 'No se encontró la factura. Verifique el número ingresado.';
            
            if (error.response && error.response.data && error.response.data.mensaje) {
                mensajeError = error.response.data.mensaje;
            }

            Swal.fire({
                type: 'error',
                title: 'Error',
                text: mensajeError
            });
            
            // Limpiar código QR en caso de error
            setCodigoQR('');
            setDatosFactura(null);
        }
    };

    // Función para generar QR sin buscar factura (solo con el número)
    const generarQRSimple = async () => {
        if (!numeroFactura.trim()) {
            Swal.fire({
                type: 'warning',
                title: 'Número requerido',
                text: 'Por favor ingresa un número de factura válido.'
            });
            return;
        }

        try {
            setCargando(true);
            
            // Crear datos básicos para el QR
            const datosQR = {
                numeroFactura: numeroFactura,
                fecha: new Date().toISOString(),
                empresa: 'Athena\'S Store',
                generado: new Date().toLocaleString('es-CO')
            };

            const qrGenerado = await generarCodigoQR(JSON.stringify(datosQR));
            setCodigoQR(qrGenerado);
            
            setCargando(false);
            
            Swal.fire({
                type: 'success',
                title: 'Código QR generado',
                text: 'El código QR se ha generado correctamente.',
                timer: 2000
            });
            
        } catch (error) {
            console.log(error);
            setCargando(false);
            
            Swal.fire({
                type: 'error',
                title: 'Error',
                text: 'No se pudo generar el código QR. Intente nuevamente.'
            });
        }
    };

    // Manejar cambio en el input del número de factura
    const manejarCambioNumero = (e) => {
        setNumeroFactura(e.target.value);
        // Limpiar QR cuando se cambia el número
        if (codigoQR) {
            setCodigoQR('');
            setDatosFactura(null);
        }
    };

    // Función para guardar el código QR
    const guardarCodigoQR = async () => {
        if (!codigoQR) {
            Swal.fire({
                type: 'warning',
                title: 'No hay código QR',
                text: 'Primero debe generar un código QR para poder guardarlo.'
            });
            return;
        }

        try {
            const datosGuardar = {
                numeroFactura,
                codigoQR,
                datosFactura,
                fechaGeneracion: new Date()
            };

            const res = await clienteAxios.post('/api/codigos-qr', datosGuardar);
            
            if (res.data.success) {
                Swal.fire({
                    type: 'success',
                    title: 'Código QR guardado',
                    text: 'El código QR se ha guardado correctamente en la base de datos.',
                    confirmButtonText: 'Generar otro',
                    showCancelButton: true,
                    cancelButtonText: 'Ver códigos guardados'
                }).then((result) => {
                    if (result.isConfirmed) {
                        limpiarFormulario();
                    } else if (result.dismiss === Swal.DismissReason.cancel) {
                        props.history.push('/codigos-qr/lista');
                    }
                });
            }
            
        } catch (error) {
            console.log(error);
            Swal.fire({
                type: 'error',
                title: 'Error al guardar',
                text: 'No se pudo guardar el código QR. Intente nuevamente.'
            });
        }
    };

    // Función para descargar el código QR
    const descargarCodigoQR = () => {
        if (!codigoQR) {
            Swal.fire({
                type: 'warning',
                title: 'No hay código QR',
                text: 'Primero debe generar un código QR para poder descargarlo.'
            });
            return;
        }

        const link = document.createElement('a');
        link.download = `QR_Factura_${numeroFactura}.png`;
        link.href = codigoQR;
        link.click();
    };

    // Función para cancelar/limpiar
    const cancelar = () => {
        limpiarFormulario();
    };

    // Limpiar formulario
    const limpiarFormulario = () => {
        setNumeroFactura('');
        setCodigoQR('');
        setDatosFactura(null);
    };

    // Generar QR automáticamente cuando se presiona Enter
    const manejarKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            generarQRSimple();
        }
    };

    return (
        <Fragment>
            <div className="content">
                <div className="form">
                    {/* Header */}
                    <div className="header-qr">
                        <h2>Generador de Códigos QR</h2>
                        <p>Ingrese el número de factura para generar el código QR correspondiente</p>
                    </div>

                    {/* Input del número de factura */}
                    <div className="input-group">
                        <div className="label-container">
                            <label htmlFor="numfactura">Ingrese N° de factura</label>
                        </div>
                        <div className="input-container">
                            <input 
                                type="text" 
                                id="res_factura" 
                                name="numfactura"
                                value={numeroFactura}
                                onChange={manejarCambioNumero}
                                onKeyPress={manejarKeyPress}
                                placeholder="Ej: FAC-001, 12345..."
                                disabled={cargando}
                            />
                            <button 
                                type="button" 
                                className="btn-buscar"
                                onClick={buscarFactura}
                                disabled={cargando || !numeroFactura.trim()}
                            >
                                {cargando ? (
                                    <i className="fa fa-spinner fa-spin"></i>
                                ) : (
                                    <i className="fa fa-search"></i>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Información de la factura si se encontró */}
                    {datosFactura && (
                        <div className="factura-info">
                            <h3>Información de la Factura</h3>
                            <div className="info-grid">
                                <p><strong>Número:</strong> {datosFactura.numero}</p>
                                <p><strong>Fecha:</strong> {new Date(datosFactura.fecha).toLocaleDateString('es-CO')}</p>
                                <p><strong>Cliente:</strong> {datosFactura.cliente}</p>
                                <p><strong>Total:</strong> ${datosFactura.total?.toLocaleString('es-CO')}</p>
                            </div>
                        </div>
                    )}

                    {/* Área del código QR */}
                    <div className="qr-section">
                        <label htmlFor="codebr">Código QR Generado</label>
                        <div className="QR" name="codebr">
                            <div id="BRCode" className="qr-container">
                                {cargando ? (
                                    <div className="loading-qr">
                                        <i className="fa fa-spinner fa-spin"></i>
                                        <p>Generando código QR...</p>
                                    </div>
                                ) : codigoQR ? (
                                    <div className="qr-result">
                                        <img src={codigoQR} alt="Código QR" className="qr-image" />
                                        <div className="qr-actions">
                                            <button 
                                                type="button" 
                                                className="btn-download"
                                                onClick={descargarCodigoQR}
                                                title="Descargar QR"
                                            >
                                                <i className="fa fa-download"></i>
                                            </button>
                                            <button 
                                                type="button" 
                                                className="btn-regenerate"
                                                onClick={generarQRSimple}
                                                title="Regenerar QR"
                                            >
                                                <i className="fa fa-refresh"></i>
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="no-qr">
                                        <i className="fa fa-qrcode"></i>
                                        <p>No hay código QR generado</p>
                                        <small>Ingrese un número de factura y haga clic en buscar</small>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Opciones adicionales */}
                    <div className="opciones-adicionales">
                        <button 
                            type="button" 
                            className="btn-generar-simple"
                            onClick={generarQRSimple}
                            disabled={!numeroFactura.trim() || cargando}
                        >
                            <i className="fa fa-qrcode"></i>
                            {' '}Generar QR Simple
                        </button>
                    </div>

                    {/* Botones principales */}
                    <div className="botones">
                        <div className="boton">
                            <button 
                                type="button" 
                                className="btn-cancelar"
                                onClick={cancelar}
                            >
                                <i className="fa fa-times"></i>
                                {' '}Cancelar
                            </button>
                        </div>
                        <div className="boton">
                            <button 
                                type="button" 
                                className="btn-guardar"
                                onClick={guardarCodigoQR}
                                disabled={!codigoQR || cargando}
                            >
                                <i className="fa fa-save"></i>
                                {' '}Guardar
                            </button>
                        </div>
                    </div>

                    {/* Información adicional */}
                    <div className="info-adicional">
                        <div className="tip">
                            <i className="fa fa-lightbulb"></i>
                            <p><strong>Consejo:</strong> Presione Enter después de ingresar el número de factura para generar el QR rápidamente.</p>
                        </div>
                        <div className="tip">
                            <i className="fa fa-info-circle"></i>
                            <p><strong>Nota:</strong> El código QR contiene información completa de la factura en formato JSON.</p>
                        </div>
                    </div>
                </div>
            </div>
        </Fragment>
    );
}

export default withRouter(GeneradorQR);