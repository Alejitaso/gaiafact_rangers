import React, { Fragment, useState, useRef } from "react";
import styles from "./loadImg.module.css";
import Swal from "sweetalert2";
import clienteAxios from "../../config/axios";
import axios from "axios";

// Componente para subir imágenes al carrusel
function SubirImagen(props) {
    // Estados del componente
    const [archivo, setArchivo] = useState(null);
    const [previewImagen, setPreviewImagen] = useState('');
    const [cargando, setCargando] = useState(false);
    const [arrastrando, setArrastrando] = useState(false);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [archivoReemplazo, setArchivoReemplazo] = useState(null);
    const [indiceReemplazo, setIndiceReemplazo] = useState('');
    const [mensajeEstado, setMensajeEstado] = useState('');
    const [progresoSubida, setProgresoSubida] = useState(0);

    // Referencias
    const fileInputRef = useRef(null);
    const fileReplaceInputRef = useRef(null);
    const anuncioRef = useRef(null);
    const uploadBoxRef = useRef(null);

    // Anunciar mensajes para lectores de pantalla
    const anunciar = (mensaje) => {
        setMensajeEstado(mensaje);
        setTimeout(() => setMensajeEstado(''), 100);
    };

    // Función para manejar la selección de archivo
    const manejarSeleccionArchivo = (e) => {
        const archivoSeleccionado = e.target.files[0];
        procesarArchivo(archivoSeleccionado);
    };

    // Función para procesar el archivo seleccionado
    const procesarArchivo = (archivoSeleccionado) => {
        if (!archivoSeleccionado) return;

        if (!archivoSeleccionado.type.startsWith('image/')) {
            anunciar('Error: El archivo seleccionado no es una imagen válida');
            Swal.fire({
                icon: 'error',
                title: 'Archivo inválido',
                text: 'Por favor selecciona solo archivos de imagen (JPG, PNG, GIF, etc.)'
            });
            return;
        }

        // Validar tamaño (máximo 5MB)
        const tamañoMaximo = 5 * 1024 * 1024; 
        if (archivoSeleccionado.size > tamañoMaximo) {
            anunciar('Error: El archivo es muy grande, debe ser menor a 5 megabytes');
            Swal.fire({
                icon: 'error',
                title: 'Archivo muy grande',
                text: 'El archivo no puede ser mayor a 5MB. Por favor selecciona una imagen más pequeña.'
            });
            return;
        }

        // Guardar archivo en estado
        setArchivo(archivoSeleccionado);
        anunciar(`Imagen ${archivoSeleccionado.name} seleccionada correctamente. Tamaño: ${formatearTamaño(archivoSeleccionado.size)}`);

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
            anunciar('No hay imagen seleccionada');
            Swal.fire({
                icon: 'warning',
                title: 'No hay imagen seleccionada',
                text: 'Por favor selecciona una imagen antes de continuar.'
            });
            return;
        }

        try {
            setCargando(true);
            setProgresoSubida(0);
            anunciar('Subiendo imagen, por favor espere');

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
            formData.set('limite', '10'); 
            
            const res = await clienteAxios.post('/api/imagenes/carousel', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                onUploadProgress: (progressEvent) => {
                    const porcentaje = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    setProgresoSubida(porcentaje);
                    if (porcentaje % 25 === 0) { // Anunciar cada 25%
                        anunciar(`Progreso de subida: ${porcentaje} por ciento`);
                    }
                }
            });

            setCargando(false);
            setProgresoSubida(0);

            if (res.status === 200 || res.status === 201) {
                anunciar('Imagen subida correctamente');
                Swal.fire({
                    title: 'Imagen subida correctamente',
                    html: `
                        <div style="text-align: center; margin: 20px 0;">
                            <img src="${previewImagen}" alt="Vista previa de ${archivo.name}" style="max-width: 200px; max-height: 200px; border-radius: 8px; margin-bottom: 15px;" />
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
            setProgresoSubida(0);
            
            let mensajeError = 'No se pudo subir la imagen. Intente nuevamente.';
            
            if (error.response && error.response.data && error.response.data.mensaje) {
                mensajeError = error.response.data.mensaje;
            }

            anunciar(`Error: ${mensajeError}`);
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
        anunciar('Formulario limpiado, listo para seleccionar una nueva imagen');
        if (uploadBoxRef.current) {
            uploadBoxRef.current.focus();
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
        anunciar('Archivo detectado, suéltalo para cargarlo');
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
            anunciar('Procesando archivo soltado');
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
                anunciar('Imagen removida correctamente');
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

    // Función para manejar el teclado en la zona de upload
    const manejarKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            abrirSelectorArchivos();
        }
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
        minHeight: '48px',
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
        width: '36px',
        height: '36px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '16px',
        transition: 'all 0.3s ease'
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

            {/* Input de archivo oculto */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={manejarSeleccionArchivo}
                style={{ display: 'none' }}
                aria-label="Seleccionar archivo de imagen"
            />
            
            <main className={styles.agregarimagencontainer} role="main">
                <section 
                    className={styles.uploadcard}
                    aria-labelledby="upload-title"
                >
                    <h1 id="upload-title" className="sr-only">
                        Subir imagen al carrusel
                    </h1>

                    <div
                        ref={uploadBoxRef}
                        className={`${styles.uploadbox} ${arrastrando ? styles.dragging : ""} ${previewImagen ? styles.hasImage : ""}`}
                        id="uploadBox"
                        onClick={abrirSelectorArchivos}
                        onDragEnter={manejarDragEnter}
                        onDragLeave={manejarDragLeave}
                        onDragOver={manejarDragOver}
                        onDrop={manejarDrop}
                        onKeyDown={manejarKeyDown}
                        role="button"
                        tabIndex="0"
                        aria-label={previewImagen ? `Vista previa de ${archivo?.name}. Presiona Enter para cambiar imagen` : "Hacer clic o arrastrar imagen aquí. Máximo 5 megabytes"}
                        aria-describedby="upload-instructions"
                    >
                        {previewImagen ? (
                            <div className={styles.imagepreview}>
                                <img 
                                    src={previewImagen} 
                                    alt={`Vista previa de ${archivo?.name}`}
                                    role="img"
                                />
                                <button 
                                    style={estilosBotonRemover}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removerImagen();
                                    }}
                                    aria-label={`Remover imagen ${archivo?.name}`}
                                    title="Remover imagen"
                                    onMouseEnter={(e) => {
                                        e.target.style.backgroundColor = 'rgba(220, 53, 69, 1)';
                                        e.target.style.transform = 'scale(1.1)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = 'rgba(220, 53, 69, 0.9)';
                                        e.target.style.transform = 'scale(1)';
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.outline = '3px solid #dc3545';
                                        e.target.style.outlineOffset = '2px';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.outline = 'none';
                                    }}
                                >
                                    <i className="fa-solid fa-times" aria-hidden="true"></i>
                                </button>
                            </div>
                        ) : (
                            <>
                                <i className="fa-solid fa-upload" aria-hidden="true"></i>
                                <p>{arrastrando ? "Suelta la imagen aquí" : "Subir imagen"}</p>
                                <small id="upload-instructions">
                                    Haz clic aquí o arrastra una imagen
                                    <br />
                                    (Máximo 5MB - JPG, PNG, GIF)
                                </small>
                            </>
                        )}
                    </div>

                    {/* Barra de progreso */}
                    {cargando && progresoSubida > 0 && (
                        <div 
                            role="progressbar" 
                            aria-valuenow={progresoSubida} 
                            aria-valuemin="0" 
                            aria-valuemax="100"
                            aria-label={`Progreso de subida: ${progresoSubida} por ciento`}
                            style={{
                                width: '100%',
                                height: '20px',
                                backgroundColor: '#e0e0e0',
                                borderRadius: '10px',
                                marginTop: '15px',
                                overflow: 'hidden'
                            }}
                        >
                            <div style={{
                                width: `${progresoSubida}%`,
                                height: '100%',
                                backgroundColor: '#28a745',
                                transition: 'width 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '12px',
                                fontWeight: 'bold'
                            }}>
                                {progresoSubida}%
                            </div>
                        </div>
                    )}

                    {archivo && (
                        <div style={{
                            marginTop: '20px',
                            padding: '15px',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            textAlign: 'left'
                        }}
                        role="region"
                        aria-labelledby="detalles-titulo"
                        >
                            <h3 id="detalles-titulo">Detalles de la imagen:</h3>
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
                        aria-label={cargando ? `Subiendo imagen, progreso ${progresoSubida} por ciento` : 'Agregar imagen al carrusel'}
                        aria-busy={cargando}
                        aria-disabled={!archivo || cargando}
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
                        onFocus={(e) => {
                            e.target.style.outline = '3px solid var(--color-tres)';
                            e.target.style.outlineOffset = '4px';
                        }}
                        onBlur={(e) => {
                            e.target.style.outline = 'none';
                        }}
                    >
                        {cargando ? (
                            <>
                                <i className="fa fa-spinner fa-spin" aria-hidden="true"></i>
                                {' '}Subiendo...
                            </>
                        ) : (
                            <>
                                <i className="fa-solid fa-plus" aria-hidden="true"></i>
                                {' '}Agregar
                            </>
                        )}
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', marginTop: '15px', justifyContent: 'center' }}>
                        {/* Botón para alternar formulario */}
                        <button
                            type="button"
                            onClick={() => {
                                setMostrarFormulario(!mostrarFormulario);
                                anunciar(mostrarFormulario ? 'Formulario de reemplazo cerrado' : 'Formulario de reemplazo abierto');
                            }}
                            aria-expanded={mostrarFormulario}
                            aria-controls="form-reemplazo"
                            style={{
                                padding: '10px 20px',
                                backgroundColor: '#ffffffff',
                                color: '#254454',
                                border: '2px solid #254454',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                fontWeight: 'bolder',
                                minHeight: '44px',
                                transition: 'all 0.3s ease'
                            }}
                            onFocus={(e) => {
                                e.target.style.outline = '3px solid #254454';
                                e.target.style.outlineOffset = '2px';
                            }}
                            onBlur={(e) => {
                                e.target.style.outline = 'none';
                            }}
                        >
                            {mostrarFormulario ? 'Cancelar' : 'Reemplazar imagen'}
                        </button>
                    </div>

                    {/* Formulario desplegable */}
                    {mostrarFormulario && (
                        <form
                            id="form-reemplazo"
                            role="form"
                            aria-label="Formulario para reemplazar imagen existente"
                            onSubmit={async (e) => {
                                e.preventDefault();
                                const archivo = archivoReemplazo;
                                const indice = parseInt(indiceReemplazo);

                                if (!archivo) {
                                    anunciar('Error: Debes seleccionar una imagen');
                                    Swal.fire({ icon: 'warning', title: 'Selecciona una imagen' });
                                    return;
                                }

                                if (isNaN(indice) || indice < 1 || indice > 10) {
                                    anunciar('Error: El número debe estar entre 1 y 10');
                                    Swal.fire({ icon: 'error', title: 'Número inválido', text: 'Elige un número entre 1 y 10' });
                                    return;
                                }

                                try {
                                    anunciar('Reemplazando imagen, por favor espere');
                                    const formData = new FormData();
                                    formData.append('imagen', archivo);
                                    formData.append('index', indice - 1);

                                    const res = await axios.post('http://localhost:4000/api/imagenes/carousel', formData, {
                                        headers: { 'Content-Type': 'multipart/form-data' },
                                    });

                                    anunciar('Imagen reemplazada exitosamente');
                                    Swal.fire({
                                        icon: 'success',
                                        title: 'Éxito',
                                        text: res.data.mensaje,
                                    });

                                    setMostrarFormulario(false);
                                    setArchivoReemplazo(null);
                                    setIndiceReemplazo('');
                                } catch (error) {
                                    anunciar('Error al reemplazar la imagen');
                                    Swal.fire({
                                        icon: 'error',
                                        title: 'Error al reemplazar',
                                        text: error.response?.data?.mensaje || 'Hubo un error al subir la imagen.',
                                    });
                                }
                            }}
                            style={{
                                marginTop: '15px',
                                padding: '15px',
                                border: '1px solid #ccc',
                                borderRadius: '8px',
                                backgroundColor: '#254454'
                            }}
                        >
                            <div style={{ marginBottom: '10px'}}>
                                <label htmlFor="file-replace" style={{ display: 'block', marginBottom: '5px' }}>
                                    Selecciona nueva imagen:
                                </label>
                                <input
                                    ref={fileReplaceInputRef}
                                    id="file-replace"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        setArchivoReemplazo(e.target.files[0]);
                                        if (e.target.files[0]) {
                                            anunciar(`Archivo ${e.target.files[0].name} seleccionado para reemplazo`);
                                        }
                                    }}
                                    aria-required="true"
                                    style={{ fontSize: '16px' }}
                                />
                            </div>

                            <div style={{ marginBottom: '10px' }}>
                                <label htmlFor="indice-replace" style={{ display: 'block', marginBottom: '5px' }}>
                                    Número de imagen a reemplazar (1–10):
                                </label>
                                <input 
                                    id="indice-replace"
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={indiceReemplazo}
                                    onChange={(e) => setIndiceReemplazo(e.target.value)}
                                    aria-required="true"
                                    aria-describedby="indice-help"
                                    style={{
                                        width: '90%',
                                        padding: '8px',
                                        borderRadius: '5px',
                                        border: '1px solid #ccc',
                                        fontSize: '16px'
                                    }}
                                />
                                <small id="indice-help" style={{ display: 'block', marginTop: '5px', fontSize: '14px' }}>
                                    Ingresa un número entre 1 y 10
                                </small>
                            </div>

                            <button
                                type="submit"
                                aria-label="Confirmar reemplazo de imagen"
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    backgroundColor: '#3d718bff',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    minHeight: '44px',
                                    transition: 'all 0.3s ease'
                                }}
                                onFocus={(e) => {
                                    e.target.style.outline = '3px solid #3d718bff';
                                    e.target.style.outlineOffset = '2px';
                                }}
                                onBlur={(e) => {
                                    e.target.style.outline = 'none';
                                }}
                            >
                                Confirmar reemplazo
                            </button>
                        </form>
                    )}

                    <div 
                        style={{
                            marginTop: '20px',
                            padding: '15px',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '8px',
                            textAlign: 'left'
                        }}
                        role="region"
                        aria-labelledby="consejos-titulo"
                    >
                        <h4 id="consejos-titulo">
                            <i className="fa-solid fa-lightbulb" aria-hidden="true"></i> Consejos:
                        </h4>
                        <ul style={{ listStyleType: 'none', paddingLeft: '0' }}>
                            <li style={{ padding: '3px 0', fontSize: '14px' }}>
                                <span aria-hidden="true">✓</span> Formatos soportados: JPG, PNG, GIF, WebP
                            </li>
                            <li style={{ padding: '3px 0', fontSize: '14px' }}>
                                <span aria-hidden="true">✓</span> Tamaño máximo: 5MB por imagen
                            </li>
                            <li style={{ padding: '3px 0', fontSize: '14px' }}>
                                <span aria-hidden="true">✓</span> Puedes arrastrar y soltar la imagen
                            </li>
                            <li style={{ padding: '3px 0', fontSize: '14px' }}>
                                <span aria-hidden="true">✓</span> Para mejor calidad, usa imágenes de alta resolución
                            </li>
                        </ul>
                    </div>
                </section>
            </main>
        </Fragment>
    );
}

export default SubirImagen;