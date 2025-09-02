import React, { Fragment } from 'react';
import styles from './VisFactura.module.css';

const VisFactura = () => {
    return (
        <Fragment>
            <div className={styles.visFactura}>
                <header>
                    <h1>Ver Facturas</h1>
                </header>
                
                <div className={styles.visForm}>
                    <div className={styles.barraBusquedaCompleta}>
                        <div className={styles.filtroBusqueda}>
                            <select className={styles.filtroBusquedaSelect}>
                                <option value="">Filtrar por...</option>
                                <option value="numero">Número</option>
                                <option value="estado">Estado</option>
                            </select>
                        </div>
                        
                        <div className={styles.barraBusqueda}>
                            <input 
                                type="text" 
                                className={styles.barraBusquedaInput} 
                                placeholder="Buscar..." 
                            />
                            <i className={`fa-solid fa-search ${styles.barraBusquedaIcon}`}></i>
                        </div>
                        
                        <div className={styles.calendarioBusqueda}>
                            <input 
                                type="date" 
                                className={styles.calendarioBusquedaInput} 
                            />
                        </div>
                    </div>
                    
                    <table className={styles.inventoryTable}>
                        <thead>
                            <tr>
                                <th className={styles.inventoryTableTh}>N°</th>
                                <th className={styles.inventoryTableTh}>Estado</th>
                                <th className={styles.inventoryTableTh}>Fecha</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className={styles.inventoryTableTd}>1</td>
                                <td className={styles.inventoryTableTd}>Pendiente</td>
                                <td className={styles.inventoryTableTd}>2025-08-28</td>
                            </tr>
                            <tr className={styles.inventoryTableTrEven}>
                                <td className={styles.inventoryTableTd}>2</td>
                                <td className={styles.inventoryTableTd}>Completado</td>
                                <td className={styles.inventoryTableTd}>2025-08-27</td>
                            </tr>
                            <tr>
                                <td className={styles.inventoryTableTd}>3</td>
                                <td className={styles.inventoryTableTd}>En proceso</td>
                                <td className={styles.inventoryTableTd}>2025-08-26</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </Fragment>
    );
};

export default VisFactura;