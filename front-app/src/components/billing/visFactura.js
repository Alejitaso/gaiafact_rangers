import React, { Fragment, useState, useEffect } from 'react';
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

    useEffect(() => {
        obtenerFacturas();
    }, []);

    useEffect(() => {
        filtrarYOrdenarFacturas();
    }, [facturas, filtroTipo, busqueda, ordenamiento, criterioOrden, fechaBusqueda]);

    const obtenerFacturas = async () => {
        try {
            setCargando(true);
            const res = await clienteAxios.get('/api/facturas');
            console.log('📦 Respuesta completa:', res.data);
            const facturasData = res.data.facturas || res.data;
            setFacturas(Array.isArray(facturasData) ? facturasData : []);
        } catch (error) {
            console.error('Error al obtener facturas:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudieron cargar las facturas'
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
    };

    const seleccionarFecha = (dia) => {
        const mesFormato = String(mesCalendario + 1).padStart(2, '0');
        const diaFormato = String(dia).padStart(2, '0');
        setFechaBusqueda(`${anioCalendario}-${mesFormato}-${diaFormato}`);
        setMostrarCalendario(false);
    };

    const obtenerDiasDelMes = () => {
        return new Date(anioCalendario, mesCalendario + 1, 0).getDate();
    };

    const obtenerPrimerDia = () => {
        return new Date(anioCalendario, mesCalendario, 1).getDay();
    };

    const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const dias = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

    const limpiarFecha = () => {
        setFechaBusqueda('');
        setMostrarCalendario(false);
    };

    const descargarPDF = async (idFactura, numeroFactura) => {
        try {
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

            Swal.fire({
                icon: 'success',
                title: '¡Descargado!',
                text: 'La factura se descargó correctamente',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (error) {
            console.error('Error al descargar PDF:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo descargar la factura'
            });
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

    return (
        <Fragment>
            <div className={styles.visFactura}>
                <div className={styles.visForm}>
                    {/* Barra de filtros y búsqueda */}
                    <div className={styles.barraBusquedaCompleta}>
                        <div className={styles.filtroBusqueda}>
                            <select 
                                className={styles.filtroBusquedaSelect}
                                value={filtroTipo}
                                onChange={(e) => setFiltroTipo(e.target.value)}
                            >
                                <option value="todo">Todas las facturas</option>
                                <option value="hoy">Hoy</option>
                                <option value="semana">Última semana</option>
                                <option value="mes">Último mes</option>
                            </select>
                        </div>

                        {/* Selector de fecha con calendario */}
                        <div className={styles.filtroBusqueda} style={{ position: 'relative' }}>
                            <button 
                                className={styles.btnCalendario}
                                onClick={() => setMostrarCalendario(!mostrarCalendario)}
                            >
                                <i className="fas fa-calendar"></i>
                                {fechaBusqueda ? new Date(fechaBusqueda).toLocaleDateString('es-CO') : 'Seleccionar fecha'}
                            </button>

                            {fechaBusqueda && (
                                <button 
                                    className={styles.btnLimpiar}
                                    onClick={limpiarFecha}
                                    title="Limpiar fecha"
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            )}

                            {mostrarCalendario && (
                                <div className={styles.calendario}>
                                    <div className={styles.calendarioEncabezado}>
                                        <button onClick={() => setMesCalendario(mesCalendario === 0 ? 11 : mesCalendario - 1)}>
                                            <i className="fas fa-chevron-left"></i>
                                        </button>
                                        <select 
                                            value={mesCalendario}
                                            onChange={(e) => setMesCalendario(Number(e.target.value))}
                                            className={styles.selectMes}
                                        >
                                            {meses.map((mes, idx) => (
                                                <option key={idx} value={idx}>{mes}</option>
                                            ))}
                                        </select>
                                        <select 
                                            value={anioCalendario}
                                            onChange={(e) => setAnioCalendario(Number(e.target.value))}
                                            className={styles.selectAnio}
                                        >
                                            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(year => (
                                                <option key={year} value={year}>{year}</option>
                                            ))}
                                        </select>
                                        <button onClick={() => setMesCalendario(mesCalendario === 11 ? 0 : mesCalendario + 1)}>
                                            <i className="fas fa-chevron-right"></i>
                                        </button>
                                    </div>

                                    <table className={styles.tablaCalendario}>
                                        <thead>
                                            <tr>
                                                {dias.map(dia => (
                                                    <th key={dia}>{dia}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Array.from({ length: Math.ceil((obtenerDiasDelMes() + obtenerPrimerDia()) / 7) }, (_, semana) => (
                                                <tr key={semana}>
                                                    {Array.from({ length: 7 }, (_, dia) => {
                                                        const diaNum = semana * 7 + dia - obtenerPrimerDia() + 1;
                                                        const esValido = diaNum > 0 && diaNum <= obtenerDiasDelMes();
                                                        return (
                                                            <td key={dia}>
                                                                {esValido && (
                                                                    <button 
                                                                        onClick={() => seleccionarFecha(diaNum)}
                                                                        className={styles.btnDia}
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
                            <select 
                                className={styles.filtroBusquedaSelect}
                                value={criterioOrden}
                                onChange={(e) => setCriterioOrden(e.target.value)}
                            >
                                <option value="fecha">Ordenar por: Fecha</option>
                                <option value="numero">Ordenar por: Número</option>
                                <option value="cliente">Ordenar por: Cliente</option>
                                <option value="total">Ordenar por: Total</option>
                            </select>
                        </div>

                        <div className={styles.filtroBusqueda}>
                            <select 
                                className={styles.filtroBusquedaSelect}
                                value={ordenamiento}
                                onChange={(e) => setOrdenamiento(e.target.value)}
                            >
                                <option value="descendente">Descendente</option>
                                <option value="ascendente">Ascendente</option>
                            </select>
                        </div>
                        
                        <div className={styles.barraBusqueda}>
                            <input 
                                type="text" 
                                className={styles.barraBusquedaInput} 
                                placeholder="Buscar por número o cliente..." 
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                            />
                            <i className={`fa-solid fa-search ${styles.barraBusquedaIcon}`}></i>
                        </div>
                    </div>

                    {/* Información de búsqueda */}
                    <div className={styles.infoFacturas}>
                        <p>Total de facturas: <strong>{facturasFiltradas.length}</strong></p>
                        {busqueda && (
                            <p>Buscando: <strong>"{busqueda}"</strong></p>
                        )}
                        {fechaBusqueda && (
                            <p>Fecha: <strong>{new Date(fechaBusqueda).toLocaleDateString('es-CO')}</strong></p>
                        )}
                        {filtroTipo !== 'todo' && (
                            <p>Filtro: <strong>{filtroTipo}</strong></p>
                        )}
                    </div>
                    
                    {/* Tabla de facturas */}
                    {cargando ? (
                        <div className={styles.loadingContainer}>
                            <i className="fa fa-spinner fa-spin"></i>
                            <p>Cargando facturas...</p>
                        </div>
                    ) : (
                        <table className={styles.inventoryTable}>
                            <thead>
                                <tr>
                                    <th className={styles.inventoryTableTh}>Nº Factura</th>
                                    <th className={styles.inventoryTableTh}>Cliente</th>
                                    <th className={styles.inventoryTableTh}>Total</th>
                                    <th className={styles.inventoryTableTh}>Fecha</th>
                                    <th className={styles.inventoryTableTh}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {facturasFiltradas.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: 'var(--color-tres)' }}>
                                            {busqueda ? 'No se encontraron facturas que coincidan con la búsqueda' : 'No hay facturas registradas'}
                                        </td>
                                    </tr>
                                ) : (
                                    facturasFiltradas.map((factura, index) => (
                                        <tr key={factura._id} className={index % 2 === 1 ? styles.inventoryTableTrEven : ''}>
                                            <td className={styles.inventoryTableTd}>{factura.numero_factura}</td>
                                            <td className={styles.inventoryTableTd}>
                                                {factura.usuario?.nombre} {factura.usuario?.apellido}
                                            </td>
                                            <td className={styles.inventoryTableTd}>
                                                ${formatearPrecio(factura.total)}
                                            </td>
                                            <td className={styles.inventoryTableTd}>
                                                {formatearFecha(factura.fecha_emision)}
                                            </td>
                                            <td className={styles.inventoryTableTd}>
                                                <button 
                                                    onClick={() => descargarPDF(factura._id, factura.numero_factura)}
                                                    className={styles.btnDescargar}
                                                    title="Descargar PDF"
                                                >
                                                    <i className="fa-solid fa-download"></i> PDF
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </Fragment>
    );
};

export default VisFactura;