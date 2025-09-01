import React, { Fragment } from 'react';
import styles from './VisFactura.module.css';

const VisFactura = () => {
return (
    <Fragment>
    <div className={styles.visFactura}>
        <header>
            <h1>Ver Facturas</h1>
        </header>
        <div className="vis-form">
            <div className={styles.visForm}>
            <div className={styles.barrabusquedacompleta}>
            <div className={styles.filtrobusqueda}>
                <select className={styles.filtroBusquedaSelect}>
                <option value="">Filtrar por...</option>
                <option value="numero">Número</option>
                <option value="estado">Estado</option>
                </select>
            </div>
            <div className="barra-busqueda">
                    <input type="text" className={styles.barraBusquedaInput} placeholder="Buscar..." />
            </div>
            <div className={styles.calendario-busqueda}>
                    <input type="date" className={styles.calendarioBusquedaInput} />
            </div>
            </div>
            <table className={styles.inventory-table}>
            <thead>
                <tr>
                 <th className={styles.inventoryTableTh}>N°</th>
                <th>Estado</th>
                <th>Fecha</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                 <td className={styles.inventoryTableTd}>1</td>
                 <td className={styles.inventoryTableTd}>Pendiente</td>
                 <td className={styles.inventoryTableTd}>2025-08-28</td>
                </tr>
            </tbody>
            </table>
        </div>
        </div>
    </div>
    </Fragment>
    );
};

export default VisFactura;