import React, { Fragment, useState, useRef } from "react";
import { withRouter } from "react-router-dom/cjs/react-router-dom.min";
import Swal from "sweetalert2";
import clienteAxios from "../../config/axios";

function SubirImagen(props) {
    // Estados del componente
    const [archivo, setArchivo] = useState(null);
    const [previewImagen, setPreviewImagen] = useState('');
    const [cargando, setCargando] = useState(false);
    const [arrastrando, setArrastrando] = useState(false);
    
    // Referencia al input de archivo
    const fileInputRef = useRef(null);

    // Función para manejar la selección de archivo
    const manejarSeleccionArchivo = (e) => {
        const archivoSeleccionado = e.target.files[0];
        procesarArchivo(archivoSeleccionado);
    };

    // Función para procesar el archivo seleccionado
    const procesarArchivo = (archivoSeleccionado) => {
        if (!archivoSeleccionado) return;

        // Validar que sea una imagen
        if (!archivoSeleccionado.type.startsWith('image/')) {
            Swal.fire({
                type: 'error',
                title: 'Archivo inválido',
                text: 'Por favor selecciona solo archivos de imagen (JPG, PNG, GIF, etc.)'
            });
            return;
        }

        // Validar tamaño (máximo 5MB)
        const tamañoMaximo = 5 * 1024 * 1024; // 5MB
        if (archivoSeleccionado.size > tamañoMaximo) {
            Swal.fire({
                type: 'error',
                title: 'Archivo muy grande',
                text: 'El archivo no puede ser mayor a 5MB. Por favor selecciona una imagen más pequeña.'
            });
            return;
        }

        // Guardar archivo en estado
        setArchivo(archivoSeleccionado);

        // Crear preview de la imagen
        const reader = new FileReader();
        reader.onload = (e) => {
            setPreviewImagen(e.target.result);
        };
        reader.readAsDataURL(archivoSeleccionado);
    };

    // Función para abrir el selector de archivos
    const abrirSelectorArchivos = () => {
        fileInputRef.current.click();
    };

    // Función para agregar/subir la imagen
    const agregarImagen = async () => {
        if (!archivo) {
            Swal.fire({
                type: 'warning',
                title: 'No hay imagen seleccionada',
                text: 'Por favor selecciona una imagen antes de continuar.'
            });
            return;
        }

        try {
            setCargando(true);

            // Crear FormData para enviar la imagen
            const formData = new FormData();
            formData.append('imagen', archivo);
            formData.append('nombre', archivo.name);
            formData.append('tamaño', archivo.size);
            formData.append('tipo', archivo.type);
            formData.append('fechaSubida', new Date().toISOString());

            const res = await clienteAxios.post('/api/imagenes', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                onUploadProgress: (progressEvent) => {
                    const porcentaje = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    // Aquí podrías actualizar una barra de progreso
                    console.log(`Progreso: ${porcentaje}%`);
                }
            });

            setCargando(false);

            if (res.status === 200 || res.status === 201) {
                Swal.fire({
                    title: 'Imagen subida correctamente',
                    html: `
                        <div style="text-align: center; margin: 20px 0;">
                            <img src="${previewImagen}" style="max-width: 200px; max-height: 200px; border-radius: 8px; margin-bottom: 15px;" />
                            <p><strong>Nombre:</strong> ${archivo.name}</p>
                            <p><strong>Tamaño:</strong> ${formatearTamaño(archivo.size)}</p>
                            <p><strong>Tipo:</strong> ${archivo.type}</p>
                        </div>
                    `,
                    icon: 'success',
                    confirmButtonText: 'Subir otra imagen',
                    showCancelButton: true,
                    cancelButtonText: 'Ver galería',
                    confirmButtonColor: '#28a745',
                    cancelButtonColor: '#007bff'
                }).then((result) => {
                    if (result.isConfirmed) {
                        limpiarFormulario();
                    } else if (result.dismiss === Swal.DismissReason.cancel) {
                        props.history.push('/galeria');
                    }
                });
            }

        } catch (error) {
            console.log(error);
            setCargando(false);
            
            let mensajeError = 'No se pudo subir la imagen. Intente nuevamente.';
            
            if (error.response && error.response.data && error.response.data.mensaje) {
                mensajeError = error.response.data.mensaje;
            }

            Swal.fire({
                type: 'error',
                title: 'Error al subir imagen',
                text: mensajeError
            });
        }
    };

    // Función para limpiar el formulario
    const limpiarFormulario = () => {
        setArchivo(null);
        setPreviewImagen('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Función para formatear el tamaño del archivo
    const formatearTamaño = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const tamaños = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + tamaños[i];
    };

    // Funciones para drag and drop
    const manejarDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setArrastrando(true);
    };

    const manejarDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setArrastrando(false);
    };

    const manejarDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const manejarDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setArrastrando(false);

        const archivos = Array.from(e.dataTransfer.files);
        if (archivos.length > 0) {
            procesarArchivo(archivos[0]);
        }
    };

    // Función para remover imagen seleccionada
    const removerImagen = () => {
        Swal.fire({
            title: '¿Remover imagen?',
            text: '¿Estás seguro de que quieres remover la imagen seleccionada?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, remover',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#dc3545'
        }).then((result) => {
            if (result.isConfirmed) {
                limpiarFormulario();
                Swal.fire({
                    title: 'Imagen removida',
                    text: 'La imagen ha sido removida correctamente.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        });
    };

    return (
        <Fragment>
            <main className="agregar-imagen-container">
                <section className="upload-card">
                    {/* Área de upload */}
                    <div 
                        className={`upload-box ${arrastrando ? 'dragging' : ''} ${previewImagen ? 'has-image' : ''}`}
                        id="uploadBox"
                        onClick={abrirSelectorArchivos}
                        onDragEnter={manejarDragEnter}
                        onDragLeave={manejarDragLeave}
                        onDragOver={manejarDragOver}
                        onDrop={manejarDrop}
                    >
                        {previewImagen ? (
                            // Vista previa de la imagen
                            <div className="image-preview">
                                <img src={previewImagen} alt="Vista previa" />
                                <div className="image-overlay">
                                    <div className="image-info">
                                        <p><strong>{archivo?.name}</strong></p>
                                        <p>{formatearTamaño(archivo?.size || 0)}</p>
                                        <div className="image-actions">
                                            <button 
                                                type="button"
                                                className="btn-change"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    abrirSelectorArchivos();
                                                }}
                                            >
                                                <i className="fa-solid fa-edit"></i>
                                                Cambiar
                                            </button>
                                            <button 
                                                type="button"
                                                className="btn-remove"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removerImagen();
                                                }}
                                            >
                                                <i className="fa-solid fa-trash"></i>
                                                Remover
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // Vista por defecto sin imagen
                            <>
                                <i className="fa-solid fa-upload"></i>
                                <p>
                                    {arrastrando ? 
                                        'Suelta la imagen aquí' : 
                                        'Subir imagen'
                                    }
                                </p>
                                <small>
                                    Haz clic aquí o arrastra una imagen
                                    <br />
                                    (Máximo 5MB - JPG, PNG, GIF)
                                </small>
                            </>
                        )}
                        
                        <input 
                            type="file" 
                            id="fileInput"
                            ref={fileInputRef}
                            accept="image/*" 
                            hidden
                            onChange={manejarSeleccionArchivo}
                        />
                    </div>

                    {/* Información adicional */}
                    {archivo && (
                        <div className="file-details">
                            <h3>Detalles de la imagen:</h3>
                            <div className="details-grid">
                                <div className="detail-item">
                                    <strong>Nombre:</strong>
                                    <span>{archivo.name}</span>
                                </div>
                                <div className="detail-item">
                                    <strong>Tamaño:</strong>
                                    <span>{formatearTamaño(archivo.size)}</span>
                                </div>
                                <div className="detail-item">
                                    <strong>Tipo:</strong>
                                    <span>{archivo.type}</span>
                                </div>
                                <div className="detail-item">
                                    <strong>Última modificación:</strong>
                                    <span>{new Date(archivo.lastModified).toLocaleDateString('es-CO')}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Botón agregar */}
                    <button 
                        className={`btn-agregar ${!archivo || cargando ? 'disabled' : ''}`}
                        id="agregarBtn"
                        onClick={agregarImagen}
                        disabled={!archivo || cargando}
                    >
                        {cargando ? (
                            <>
                                <i className="fa fa-spinner fa-spin"></i>
                                Subiendo...
                            </>
                        ) : (
                            <>
                                <i className="fa-solid fa-plus"></i>
                                Agregar
                            </>
                        )}
                    </button>

                    {/* Consejos */}
                    <div className="upload-tips">
                        <h4><i className="fa-solid fa-lightbulb"></i> Consejos:</h4>
                        <ul>
                            <li>Formatos soportados: JPG, PNG, GIF, WebP</li>
                            <li>Tamaño máximo: 5MB por imagen</li>
                            <li>Puedes arrastrar y soltar la imagen</li>
                            <li>Para mejor calidad, usa imágenes de alta resolución</li>
                        </ul>
                    </div>
                </section>
            </main>
        </Fragment>
    );
}

export default SubirImagen;