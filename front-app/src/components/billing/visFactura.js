import React, { Fragment, useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import clienteAxios from '../../config/axios';
import styles from './VisFactura.module.css';

const VisFactura = () => {
    const [facturas, setFacturas] = useState([]);
    const [facturasFiltradas, setFacturasFiltradas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [filtroTipo, setFiltroTipo] = useState('todo');
    const [busqueda, setBusqueda] = useState('');
    const [ordenamiento, setOrdenamiento] = useState('descendente');
    const [criterioOrden, setCriterioOrden] = useState('fecha');
    const [fechaBusqueda, setFechaBusqueda] = useState('');
    const [mostrarCalendario, setMostrarCalendario] = useState(false);
    const [mesCalendario, setMesCalendario] = useState(new Date().getMonth());
    const [anioCalendario, setAnioCalendario] = useState(new Date().getFullYear());
    const [mensajeEstado, setMensajeEstado] = useState('');
    const [descargando, setDescargando] = useState(false);
    
    const calendarioRef = useRef(null);
    const filtroTipoRef = useRef(null);

    useEffect(() => {
        obtenerFacturas();
    }, []);

    useEffect(() => {
        filtrarYOrdenarFacturas();
    }, [facturas, filtroTipo, busqueda, ordenamiento, criterioOrden, fechaBusqueda]);

    // Cerrar calendario al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (calendarioRef.current && !calendarioRef.current.contains(event.target)) {
                setMostrarCalendario(false);
            }
        };

        if (mostrarCalendario) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [mostrarCalendario]);

    // Manejo de tecla Escape para cerrar calendario
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && mostrarCalendario) {
                setMostrarCalendario(false);
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [mostrarCalendario]);

    const obtenerFacturas = async () => {
        try {
            setCargando(true);
            setMensajeEstado('Cargando facturas del sistema');
            const res = await clienteAxios.get('/api/facturas');
            setFacturas(Array.isArray(res.data) ? res.data : []);
            setMensajeEstado(`${res.data.length} facturas cargadas correctamente`);
        } catch (error) {
            console.error('Error al obtener facturas:', error);
            setMensajeEstado('Error al cargar las facturas');
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudieron cargar las facturas',
                didOpen: () => {
                    const popup = Swal.getPopup();
                    if (popup) {
                        popup.setAttribute('role', 'alertdialog');
                        popup.setAttribute('aria-live', 'assertive');
                    }
                }
            });
            setFacturas([]);
        } finally {
            setCargando(false);
        }
    };

    const filtrarYOrdenarFacturas = () => {
        let resultado = [...facturas];

        // Aplicar búsqueda por fecha específica
        if (fechaBusqueda) {
            resultado = resultado.filter(factura => {
                const fechaFactura = new Date(factura.fecha_emision).toISOString().split('T')[0];
                return fechaFactura === fechaBusqueda;
            });
        }

        // Aplicar búsqueda por número o cliente
        if (busqueda.trim()) {
            resultado = resultado.filter(factura => {
                const numeroFactura = factura.numero_factura?.toString().toLowerCase() || '';
                const cliente = `${factura.usuario?.nombre || ''} ${factura.usuario?.apellido || ''}`.toLowerCase();
                const terminoBusqueda = busqueda.toLowerCase();

                return numeroFactura.includes(terminoBusqueda) || cliente.includes(terminoBusqueda);
            });
        }

        // Aplicar filtro por tipo
        if (filtroTipo !== 'todo') {
            const ahora = new Date();
            const hace7Dias = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
            const hace30Dias = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000);

            resultado = resultado.filter(factura => {
                const fechaFactura = new Date(factura.fecha_emision);

                switch (filtroTipo) {
                    case 'hoy':
                        return fechaFactura.toDateString() === ahora.toDateString();
                    case 'semana':
                        return fechaFactura >= hace7Dias;
                    case 'mes':
                        return fechaFactura >= hace30Dias;
                    default:
                        return true;
                }
            });
        }

        // Aplicar ordenamiento
        resultado.sort((a, b) => {
            let valorA, valorB;

            switch (criterioOrden) {
                case 'numero':
                    valorA = parseInt(a.numero_factura?.replace(/\D/g, '') || 0);
                    valorB = parseInt(b.numero_factura?.replace(/\D/g, '') || 0);
                    break;
                case 'cliente':
                    valorA = `${a.usuario?.nombre || ''} ${a.usuario?.apellido || ''}`.toLowerCase();
                    valorB = `${b.usuario?.nombre || ''} ${b.usuario?.apellido || ''}`.toLowerCase();
                    break;
                case 'total':
                    valorA = a.total || 0;
                    valorB = b.total || 0;
                    break;
                case 'fecha':
                default:
                    valorA = new Date(a.fecha_emision);
                    valorB = new Date(b.fecha_emision);
            }

            if (valorA < valorB) return ordenamiento === 'ascendente' ? -1 : 1;
            if (valorA > valorB) return ordenamiento === 'ascendente' ? 1 : -1;
            return 0;
        });

        setFacturasFiltradas(resultado);
        
        // Actualizar mensaje de estado para lectores de pantalla
        let mensaje = `${resultado.length} factura${resultado.length !== 1 ? 's' : ''} encontrada${resultado.length !== 1 ? 's' : ''}`;
        if (busqueda) mensaje += ` para "${busqueda}"`;
        if (fechaBusqueda) mensaje += ` en fecha ${new Date(fechaBusqueda).toLocaleDateString('es-CO')}`;
        setMensajeEstado(mensaje);
    };

    const seleccionarFecha = (dia) => {
        // ❌ ORIGINAL (CREA FECHA LOCAL)
        // const fecha = new Date(anioCalendario, mesCalendario, dia);

        // ✅ CORRECCIÓN: Creamos la fecha local y luego ajustamos
        // para obtener el formato YYYY-MM-DD sin el desplazamiento.
        const fechaLocal = new Date(anioCalendario, mesCalendario, dia);
        
        // Obtenemos los componentes para el formato YYYY-MM-DD
        const año = fechaLocal.getFullYear();
        const mes = String(fechaLocal.getMonth() + 1).padStart(2, '0');
        const día = String(fechaLocal.getDate()).padStart(2, '0');
        
        // Generamos la cadena YYYY-MM-DD
        const fechaFormateada = `${año}-${mes}-${día}`;

        // Guardar y mostrar
        setFechaBusqueda(fechaFormateada);
        // Usamos la fecha local para el mensaje al usuario
        setMensajeEstado(`Fecha seleccionada: ${fechaLocal.toLocaleDateString('es-CO')}`);

        // Opcional: cerrar calendario
        setMostrarCalendario(false);
    };

    // ... el resto del código

    const obtenerDiasDelMes = () => {
        return new Date(anioCalendario, mesCalendario + 1, 0).getDate();
    };

    const obtenerPrimerDia = () => {
        const primerDia = new Date(anioCalendario, mesCalendario, 1).getDay();
        return primerDia === 0 ? 6 : primerDia - 1; // 0 → 6 (domingo al final), 1 → 0, etc.
    };

    const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const diasCortos = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

    const limpiarFecha = () => {
        setFechaBusqueda('');
        setMostrarCalendario(false);
        setMensajeEstado('Filtro de fecha eliminado');
    };

    const descargarPDF = async (idFactura, numeroFactura) => {
        try {
            setDescargando(true);
            setMensajeEstado(`Descargando factura ${numeroFactura}`);
            
            const res = await clienteAxios.get(`/api/facturas/${idFactura}/pdf`, {
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `factura-${numeroFactura}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            setMensajeEstado(`Factura ${numeroFactura} descargada correctamente`);
            
            Swal.fire({
                icon: 'success',
                title: '¡Descargado!',
                text: 'La factura se descargó correctamente',
                timer: 2000,
                showConfirmButton: false,
                didOpen: () => {
                    const popup = Swal.getPopup();
                    if (popup) {
                        popup.setAttribute('role', 'status');
                        popup.setAttribute('aria-live', 'polite');
                    }
                }
            });
        } catch (error) {
            console.error('Error al descargar PDF:', error);
            setMensajeEstado(`Error al descargar factura ${numeroFactura}`);
            
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo descargar la factura',
                didOpen: () => {
                    const popup = Swal.getPopup();
                    if (popup) {
                        popup.setAttribute('role', 'alertdialog');
                        popup.setAttribute('aria-live', 'assertive');
                    }
                }
            });
        } finally {
            setDescargando(false);
        }
    };

    const formatearPrecio = (precio) => {
        return precio.toLocaleString('es-CO', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
    };

    const formatearFecha = (fecha) => {
        return new Date(fecha).toLocaleDateString('es-CO');
    };

    const cambiarMes = (direccion) => {
        if (direccion === 'anterior') {
            if (mesCalendario === 0) {
                setMesCalendario(11);
                setAnioCalendario(anioCalendario - 1);
            } else {
                setMesCalendario(mesCalendario - 1);
            }
        } else {
            if (mesCalendario === 11) {
                setMesCalendario(0);
                setAnioCalendario(anioCalendario + 1);
            } else {
                setMesCalendario(mesCalendario + 1);
            }
        }
    };

    return (
        <Fragment>
            {/* Región de anuncios para lectores de pantalla */}
            <div 
                role="status"
                aria-live="polite" 
                aria-atomic="true"
                className={styles.srOnly}
            >
                {mensajeEstado}
            </div>

            <main className={styles.visFactura} role="main" aria-labelledby="facturas-title">
                <div className={styles.visForm}>
                    <h1 id="facturas-title" className={styles.srOnly}>
                        Sistema de Visualización de Facturas
                    </h1>

                    {/* Barra de filtros y búsqueda */}
                    <section aria-labelledby="filtros-title" className={styles.barraBusquedaCompleta}>
                        <h2 id="filtros-title" className={styles.srOnly}>Filtros y Búsqueda</h2>
                        
                        <div className={styles.filtroBusqueda}>
                            <label htmlFor="filtro-tipo" className={styles.srOnly}>
                                Filtrar facturas por periodo
                            </label>
                            <select 
                                id="filtro-tipo"
                                ref={filtroTipoRef}
                                className={styles.filtroBusquedaSelect}
                                value={filtroTipo}
                                onChange={(e) => {
                                    setFiltroTipo(e.target.value);
                                    setMensajeEstado(`Filtro cambiado a ${e.target.options[e.target.selectedIndex].text}`);
                                }}
                                aria-describedby="filtro-tipo-hint"
                            >
                                <option value="todo">Todas las facturas</option>
                                <option value="hoy">Hoy</option>
                                <option value="semana">Última semana</option>
                                <option value="mes">Último mes</option>
                            </select>
                            <span id="filtro-tipo-hint" className={styles.srOnly}>
                                Seleccione el periodo de tiempo para filtrar las facturas
                            </span>
                        </div>

                        {/* Selector de fecha con calendario */}
                        <div 
                            className={styles.filtroBusqueda} 
                            style={{ position: 'relative' }}
                            ref={calendarioRef}
                        >
                            <label htmlFor="btn-calendario" className={styles.srOnly}>
                                Seleccionar fecha específica
                            </label>
                            <button 
                                id="btn-calendario"
                                className={styles.btnCalendario}
                                onClick={() => setMostrarCalendario(!mostrarCalendario)}
                                aria-expanded={mostrarCalendario}
                                aria-haspopup="dialog"
                                aria-controls="calendario-picker"
                                aria-label={fechaBusqueda 
                                    ? `Fecha seleccionada: ${new Date(fechaBusqueda + 'T00:00:00').toLocaleDateString('es-CO')}. Click para cambiar` // MODIFICACIÓN LÍNEA 313
                                    : 'Seleccionar fecha específica'}
                            >
                                <i className="fas fa-calendar" aria-hidden="true"></i>
                                <span>
                                    {fechaBusqueda 
                                        ? new Date(fechaBusqueda + 'T00:00:00').toLocaleDateString('es-CO') // MODIFICACIÓN LÍNEA 318
                                        : 'Seleccionar fecha'}
                                </span>
                            </button>

                            {fechaBusqueda && (
                                <button 
                                    className={styles.btnLimpiar}
                                    onClick={limpiarFecha}
                                    aria-label="Limpiar filtro de fecha"
                                    title="Limpiar fecha"
                                >
                                    <i className="fas fa-times" aria-hidden="true"></i>
                                </button>
                            )}

                            {mostrarCalendario && (
                                <div 
                                    id="calendario-picker"
                                    className={styles.calendario}
                                    role="dialog"
                                    aria-modal="false"
                                    aria-label="Selector de fecha"
                                >
                                    <div className={styles.calendarioEncabezado}>
                                        <button 
                                            onClick={() => cambiarMes('anterior')}
                                            aria-label="Mes anterior"
                                        >
                                            <i className="fas fa-chevron-left" aria-hidden="true"></i>
                                        </button>
                                        
                                        <label htmlFor="select-mes" className={styles.srOnly}>
                                            Seleccionar mes
                                        </label>
                                        <select 
                                            id="select-mes"
                                            value={mesCalendario}
                                            onChange={(e) => {
                                                setMesCalendario(Number(e.target.value));
                                                setMensajeEstado(`Mes cambiado a ${meses[Number(e.target.value)]}`);
                                            }}
                                            className={styles.selectMes}
                                            aria-label="Mes actual"
                                        >
                                            {meses.map((mes, idx) => (
                                                <option key={idx} value={idx}>{mes}</option>
                                            ))}
                                        </select>
                                        
                                        <label htmlFor="select-anio" className={styles.srOnly}>
                                            Seleccionar año
                                        </label>
                                        <select 
                                            id="select-anio"
                                            value={anioCalendario}
                                            onChange={(e) => {
                                                setAnioCalendario(Number(e.target.value));
                                                setMensajeEstado(`Año cambiado a ${e.target.value}`);
                                            }}
                                            className={styles.selectAnio}
                                            aria-label="Año actual"
                                        >
                                            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(year => (
                                                <option key={year} value={year}>{year}</option>
                                            ))}
                                        </select>
                                        
                                        <button 
                                            onClick={() => cambiarMes('siguiente')}
                                            aria-label="Mes siguiente"
                                        >
                                            <i className="fas fa-chevron-right" aria-hidden="true"></i>
                                        </button>
                                    </div>

                                    <table 
                                        className={styles.tablaCalendario}
                                        role="grid"
                                        aria-label={`Calendario de ${meses[mesCalendario]} ${anioCalendario}`}
                                    >
                                        <thead>
                                            <tr role="row">
                                                {diasCortos.map((dia, idx) => (
                                                    <th 
                                                        key={dia} 
                                                        scope="col"
                                                        aria-label={dias[idx]}
                                                    >
                                                        {dia}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Array.from({ length: Math.ceil((obtenerDiasDelMes() + obtenerPrimerDia()) / 7) }, (_, semana) => (
                                                <tr key={semana} role="row">
                                                    {Array.from({ length: 7 }, (_, dia) => {
                                                        const diaNum = semana * 7 + dia - obtenerPrimerDia() + 1;
                                                        const esValido = diaNum > 0 && diaNum <= obtenerDiasDelMes();
                                                        return (
                                                            <td key={dia} role="gridcell">
                                                                {esValido && (
                                                                    <button 
                                                                        onClick={() => seleccionarFecha(diaNum)}
                                                                        className={styles.btnDia}
                                                                        aria-label={`${diaNum} de ${meses[mesCalendario]} de ${anioCalendario}`}
                                                                    >
                                                                        {diaNum}
                                                                    </button>
                                                                )}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div className={styles.filtroBusqueda}>
                            <label htmlFor="criterio-orden" className={styles.srOnly}>
                                Criterio de ordenamiento
                            </label>
                            <select 
                                id="criterio-orden"
                                className={styles.filtroBusquedaSelect}
                                value={criterioOrden}
                                onChange={(e) => {
                                    setCriterioOrden(e.target.value);
                                    setMensajeEstado(`Ordenando por ${e.target.options[e.target.selectedIndex].text}`);
                                }}
                                aria-describedby="criterio-orden-hint"
                            >
                                <option value="fecha">Ordenar por: Fecha</option>
                                <option value="numero">Ordenar por: Número</option>
                                <option value="cliente">Ordenar por: Cliente</option>
                                <option value="total">Ordenar por: Total</option>
                            </select>
                            <span id="criterio-orden-hint" className={styles.srOnly}>
                                Seleccione el campo por el cual ordenar las facturas
                            </span>
                        </div>

                        <div className={styles.filtroBusqueda}>
                            <label htmlFor="direccion-orden" className={styles.srOnly}>
                                Dirección del ordenamiento
                            </label>
                            <select 
                                id="direccion-orden"
                                className={styles.filtroBusquedaSelect}
                                value={ordenamiento}
                                onChange={(e) => {
                                    setOrdenamiento(e.target.value);
                                    setMensajeEstado(`Orden cambiado a ${e.target.value}`);
                                }}
                                aria-describedby="direccion-orden-hint"
                            >
                                <option value="descendente">Descendente</option>
                                <option value="ascendente">Ascendente</option>
                            </select>
                            <span id="direccion-orden-hint" className={styles.srOnly}>
                                Seleccione si desea ordenar de forma ascendente o descendente
                            </span>
                        </div>
                        
                        <div className={styles.barraBusqueda}>
                            <label htmlFor="busqueda-factura" className={styles.srOnly}>
                                Buscar factura por número o cliente
                            </label>
                            <input 
                                type="search"
                                id="busqueda-factura"
                                className={styles.barraBusquedaInput} 
                                placeholder="Buscar por número o cliente..." 
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                aria-describedby="busqueda-hint"
                            />
                            <i 
                                className={`fa-solid fa-search ${styles.barraBusquedaIcon}`}
                                aria-hidden="true"
                            ></i>
                            <span id="busqueda-hint" className={styles.srOnly}>
                                Ingrese número de factura o nombre del cliente para buscar
                            </span>
                        </div>
                    </section>

                    {/* Información de búsqueda */}
                    <section 
                        className={styles.infoFacturas}
                        aria-labelledby="info-resultados"
                        role="status"
                        aria-live="polite"
                    >
                        <h2 id="info-resultados" className={styles.srOnly}>
                            Información de resultados
                        </h2>
                        <p>
                            Total de facturas: <strong>{facturasFiltradas.length}</strong>
                        </p>
                        {busqueda && (
                            <p>Buscando: <strong>"{busqueda}"</strong></p>
                        )}
                        {fechaBusqueda && (
                            <p>
                                Fecha: <strong>{new Date(fechaBusqueda).toLocaleDateString('es-CO')}</strong>
                            </p>
                        )}
                        {filtroTipo !== 'todo' && (
                            <p>Filtro: <strong>{filtroTipo}</strong></p>
                        )}
                    </section>
                    
                    {/* Tabla de facturas */}
                    {cargando ? (
                        <div 
                            className={styles.loadingContainer}
                            role="status"
                            aria-live="polite"
                            aria-busy="true"
                        >
                            <i className="fa fa-spinner fa-spin" aria-hidden="true"></i>
                            <p>Cargando facturas...</p>
                        </div>
                    ) : (
                        <div className={styles.tableContainer}>
                            <table 
                                className={styles.inventoryTable}
                                role="table"
                                aria-label="Lista de facturas"
                                aria-describedby="info-resultados"
                            >
                                <thead>
                                    <tr role="row">
                                        <th scope="col" className={styles.inventoryTableTh}>
                                            Nº Factura
                                        </th>
                                        <th scope="col" className={styles.inventoryTableTh}>
                                            Cliente
                                        </th>
                                        <th scope="col" className={styles.inventoryTableTh}>
                                            Total
                                        </th>
                                        <th scope="col" className={styles.inventoryTableTh}>
                                            Fecha
                                        </th>
                                        <th scope="col" className={styles.inventoryTableTh}>
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {facturasFiltradas.length === 0 ? (
                                        <tr role="row">
                                            <td 
                                                colSpan="5" 
                                                style={{ 
                                                    textAlign: 'center', 
                                                    padding: '20px', 
                                                    color: 'var(--color-tres)' 
                                                }}
                                                role="cell"
                                            >
                                                {busqueda 
                                                    ? 'No se encontraron facturas que coincidan con la búsqueda' 
                                                    : 'No hay facturas registradas'}
                                            </td>
                                        </tr>
                                    ) : (
                                        facturasFiltradas.map((factura, index) => (
                                            <tr 
                                                key={factura._id} 
                                                className={index % 2 === 1 ? styles.inventoryTableTrEven : ''}
                                                role="row"
                                            >
                                                <td 
                                                    className={styles.inventoryTableTd}
                                                    role="cell"
                                                    data-label="Nº Factura"
                                                >
                                                    {factura.numero_factura}
                                                </td>
                                                <td 
                                                    className={styles.inventoryTableTd}
                                                    role="cell"
                                                    data-label="Cliente"
                                                >
                                                    {factura.usuario?.nombre} {factura.usuario?.apellido}
                                                </td>
                                                <td 
                                                    className={styles.inventoryTableTd}
                                                    role="cell"
                                                    data-label="Total"
                                                >
                                                    <span aria-label={`${formatearPrecio(factura.total)} pesos colombianos`}>
                                                        ${formatearPrecio(factura.total)}
                                                    </span>
                                                </td>
                                                <td 
                                                    className={styles.inventoryTableTd}
                                                    role="cell"
                                                    data-label="Fecha"
                                                >
                                                    {formatearFecha(factura.fecha_emision)}
                                                </td>
                                                <td 
                                                    className={styles.inventoryTableTd}
                                                    role="cell"
                                                    data-label="Acciones"
                                                >
                                                    <button 
                                                        onClick={() => descargarPDF(factura._id, factura.numero_factura)}
                                                        className={styles.btnDescargar}
                                                        aria-label={`Descargar PDF de factura ${factura.numero_factura}`}
                                                        disabled={descargando}
                                                        aria-busy={descargando}
                                                    >
                                                        <i className="fa-solid fa-download" aria-hidden="true"></i> 
                                                        <span>PDF</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </Fragment>
    );
};

export default VisFactura;