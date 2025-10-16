import React, { Fragment, useState, useRef } from "react";
import styles from "./loadImg.module.css";
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
                icon: 'error',
                title: 'Archivo inválido',
                text: 'Por favor selecciona solo archivos de imagen (JPG, PNG, GIF, etc.)'
            });
            return;
        }

        // Validar tamaño (máximo 5MB)
        const tamañoMaximo = 5 * 1024 * 1024; // 5MB
        if (archivoSeleccionado.size > tamañoMaximo) {
            Swal.fire({
                icon: 'error',
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
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    // Función para agregar/subir la imagen
    const agregarImagen = async () => {
        if (!archivo) {
            Swal.fire({
                icon: 'warning',
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

            // Crear nombre único para evitar conflictos
            const timestamp = Date.now();
            const extension = archivo.name.split('.').pop();
            const nombreUnico = `imagen_${timestamp}.${extension}`;
            
            // Actualizar FormData con el nombre único
            formData.set('nombre', nombreUnico);
            formData.set('carpetaDestino', 'onset/img');
            formData.set('limite', '10'); // Límite de 10 imágenes
            
            const res = await clienteAxios.post('/api/imagenes/carousel', formData, {

                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                onUploadProgress: (progressEvent) => {
                    const porcentaje = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
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
                icon: 'error',
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

    // Estilos para los botones
    const estilosBotonAgregar = {
        backgroundColor: (!archivo || cargando) ? '#6c757d' : 'var(--color-dos)',
        color: (!archivo || cargando) ? '#ffffff' : 'var(--color-uno)',
        padding: '12px 25px',
        border: `2px solid ${(!archivo || cargando) ? '#6c757d' : 'var(--color-tres)'}`,
        borderRadius: '8px',
        cursor: (!archivo || cargando) ? 'not-allowed' : 'pointer',
        fontSize: '18px',
        fontWeight: 'bold',
        transition: 'all 0.3s ease',
        marginTop: '20px',
        minWidth: '150px',
        opacity: (!archivo || cargando) ? 0.6 : 1
    };

    const estilosBotonRemover = {
        position: 'absolute',
        top: '8px',
        right: '8px',
        backgroundColor: 'rgba(220, 53, 69, 0.9)',
        color: 'white',
        border: 'none',
        borderRadius: '50%',
        width: '30px',
        height: '30px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        transition: 'all 0.3s ease'
    };

    return (
        <Fragment>
            {/* Input de archivo oculto */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={manejarSeleccionArchivo}
                style={{ display: 'none' }}
            />
            
            <main className={styles.agregarimagencontainer}>
                <section className={styles.uploadcard}>
                    <div
                        className={`${styles.uploadbox} ${arrastrando ? styles.dragging : ""} ${previewImagen ? styles.hasImage : ""}`}
                        id="uploadBox"
                        onClick={abrirSelectorArchivos}
                        onDragEnter={manejarDragEnter}
                        onDragLeave={manejarDragLeave}
                        onDragOver={manejarDragOver}
                        onDrop={manejarDrop}
                    >
                        {previewImagen ? (
                            <div className={styles.imagepreview}>
                                <img src={previewImagen} alt="Vista previa" />
                                <button 
                                    style={estilosBotonRemover}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removerImagen();
                                    }}
                                    title="Remover imagen"
                                    onMouseEnter={(e) => {
                                        e.target.style.backgroundColor = 'rgba(220, 53, 69, 1)';
                                        e.target.style.transform = 'scale(1.1)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = 'rgba(220, 53, 69, 0.9)';
                                        e.target.style.transform = 'scale(1)';
                                    }}
                                >
                                    <i className="fa-solid fa-times"></i>
                                </button>
                            </div>
                        ) : (
                            <>
                                <i className="fa-solid fa-upload"></i>
                                <p>{arrastrando ? "Suelta la imagen aquí" : "Subir imagen"}</p>
                                <small>
                                    Haz clic aquí o arrastra una imagen
                                    <br />
                                    (Máximo 5MB - JPG, PNG, GIF)
                                </small>
                            </>
                        )}
                    </div>

                    {archivo && (
                        <div style={{
                            marginTop: '20px',
                            padding: '15px',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            textAlign: 'left'
                        }}>
                            <h3>Detalles de la imagen:</h3>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr',
                                gap: '8px',
                                marginTop: '10px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                                    <strong>Nombre:</strong>
                                    <span>{archivo.name}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                                    <strong>Tamaño:</strong>
                                    <span>{formatearTamaño(archivo.size)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                                    <strong>Tipo:</strong>
                                    <span>{archivo.type}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                                    <strong>Última modificación:</strong>
                                    <span>{new Date(archivo.lastModified).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <button
                        style={estilosBotonAgregar}
                        id="agregarBtn"
                        onClick={agregarImagen}
                        disabled={!archivo || cargando}
                        onMouseEnter={(e) => {
                            if (!(!archivo || cargando)) {
                                e.target.style.backgroundColor = 'var(--color-cinco)';
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!(!archivo || cargando)) {
                                e.target.style.backgroundColor = 'var(--color-dos)';
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = 'none';
                            }
                        }}
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

                    <div style={{
                        marginTop: '20px',
                        padding: '15px',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '8px',
                        textAlign: 'left'
                    }}>
                        <h4><i className="fa-solid fa-lightbulb"></i> Consejos:</h4>
                        <ul style={{ listStyleType: 'none', paddingLeft: '0' }}>
                            <li style={{ padding: '3px 0', fontSize: '14px' }}>✓ Formatos soportados: JPG, PNG, GIF, WebP</li>
                            <li style={{ padding: '3px 0', fontSize: '14px' }}>✓ Tamaño máximo: 5MB por imagen</li>
                            <li style={{ padding: '3px 0', fontSize: '14px' }}>✓ Puedes arrastrar y soltar la imagen</li>
                            <li style={{ padding: '3px 0', fontSize: '14px' }}>✓ Para mejor calidad, usa imágenes de alta resolución</li>
                        </ul>
                    </div>
                </section>
            </main>
            
        </Fragment>
    );
}

export default SubirImagen;