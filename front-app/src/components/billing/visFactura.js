import React, { Fragment } from 'react';
import './VisFactura.css';

const VisFactura = () => {
return (
    <Fragment>
    <div className="vis-factura">
        <header>
            <h1>Ver Facturas</h1>
        </header>
        <div className="vis-form">
            <div className="barra-busqueda-completa">
            <div className="filtro-busqueda">
                <select className="selector-filtro">
                <option value="">Filtrar por...</option>
                <option value="numero">Número</option>
                <option value="estado">Estado</option>
                </select>
            </div>
            <div className="barra-busqueda">
                <input type="text" placeholder="Buscar..." />
            </div>
            <div className="calendario-busqueda">
                <input type="date" className="selector-fecha" />
            </div>
            </div>
            <table className="inventory-table">
            <thead>
                <tr>
                <th>N°</th>
                <th>Estado</th>
                <th>Fecha</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                <td>1</td>
                <td>Pendiente</td>
                <td>2025-08-28</td>
                </tr>
            </tbody>
            </table>
        </div>
        </div>
    </Fragment>
    );
};

export default VisFactura;