import React, { Fragment, useState, useEffect } from 'react';
import clienteAxios from '../../config/axios';
import styles from './VisFactura.module.css';

const VisFactura = () => {
    const [facturas, setFacturas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [filtro, setFiltro] = useState('');
    const [busqueda, setBusqueda] = useState('');

    useEffect(() => {
        obtenerFacturas();
    }, []);

    const obtenerFacturas = async () => {
        try {
            setCargando(true);
            const res = await clienteAxios.get('/api/facturas');
            setFacturas(res.data);
        } catch (error) {
            console.error('Error al obtener facturas:', error);
        } finally {
            setCargando(false);
        }
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
        } catch (error) {
            console.error('Error al descargar PDF:', error);
        }
    };

    return (
        <Fragment>
            <div className={styles.visFactura}>
                <header>
                    <h1>Ver Facturas</h1>
                </header>
                
                <div className={styles.visForm}>
                    <div className={styles.barraBusquedaCompleta}>
                        <div className={styles.filtroBusqueda}>
                            <select 
                                className={styles.filtroBusquedaSelect}
                                value={filtro}
                                onChange={(e) => setFiltro(e.target.value)}
                            >
                                <option value="">Filtrar por...</option>
                                <option value="numero">Número</option>
                                <option value="cliente">Cliente</option>
                            </select>
                        </div>
                        
                        <div className={styles.barraBusqueda}>
                            <input 
                                type="text" 
                                className={styles.barraBusquedaInput} 
                                placeholder="Buscar..." 
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                            />
                            <i className={`fa-solid fa-search ${styles.barraBusquedaIcon}`}></i>
                        </div>
                    </div>
                    
                    <table className={styles.inventoryTable}>
                        <thead>
                            <tr>
                                <th className={styles.inventoryTableTh}>N° Factura</th>
                                <th className={styles.inventoryTableTh}>Cliente</th>
                                <th className={styles.inventoryTableTh}>Total</th>
                                <th className={styles.inventoryTableTh}>Fecha</th>
                                <th className={styles.inventoryTableTh}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cargando ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                                        Cargando facturas...
                                    </td>
                                </tr>
                            ) : facturas.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                                        No hay facturas registradas
                                    </td>
                                </tr>
                            ) : (
                                facturas.map((factura, index) => (
                                    <tr key={factura._id} className={index % 2 === 1 ? styles.inventoryTableTrEven : ''}>
                                        <td className={styles.inventoryTableTd}>{factura.numero_factura}</td>
                                        <td className={styles.inventoryTableTd}>
                                            {factura.usuario.nombre} {factura.usuario.apellido}
                                        </td>
                                        <td className={styles.inventoryTableTd}>
                                            ${factura.total.toLocaleString('es-CO')}
                                        </td>
                                        <td className={styles.inventoryTableTd}>
                                            {new Date(factura.fecha_emision).toLocaleDateString('es-CO')}
                                        </td>
                                        <td className={styles.inventoryTableTd}>
                                            <button 
                                                onClick={() => descargarPDF(factura._id, factura.numero_factura)}
                                                style={{ 
                                                    padding: '5px 10px', 
                                                    cursor: 'pointer',
                                                    backgroundColor: '#276177',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px'
                                                }}
                                            >
                                                <i className="fa-solid fa-download"></i> PDF
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Fragment>
    );
};

export default VisFactura;