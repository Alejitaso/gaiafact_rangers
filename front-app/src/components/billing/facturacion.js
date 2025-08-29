import React, { Fragment } from 'react';
import './Facturacion.css';

const Facturacion = () => {
    return (
    <Fragment>
        <div className="facturacion-container">
        <div className="facturacion-form">
            <select id="clienteD">
            <option value="">Seleccione tipo de documento</option>
            <option value="CC">Cédula de ciudadanía</option>
            <option value="CE">Cédula de extranjería</option>
            <option value="NIT">NIT</option>
            <option value="Pasaporte">Pasaporte</option>
            </select>
            <input type="text" id="facturaN" placeholder="Número documento" />
            <input type="text" placeholder="Nombres" />
            <input type="text" placeholder="Apellidos" />
            <input type="text" placeholder="Teléfono" />
            <input type="email" placeholder="Correo" />
        </div>
        <div class="boton_añadir">
            <button className="fa-solid fa-plus"></button>
        </div>
        <table className="facturacion-tabla">
            <thead>
            <tr>
                <th>ID</th>
                <th>Nombre producto</th>
                <th>Borrar</th>
                <th>Precio</th>
            </tr>
            </thead>
            <tbody>
            <tr>
                <td>01</td>
                <td>Producto X</td>
                <td>
                <button className="fa-solid fa-trash-can"></button>
                </td>
                <td>$20.000</td>
            </tr>
            </tbody>
        </table>
        <div className="botones-finales">
            <button>Cancelar</button>
            <button id="sendButton">Generar</button>
        </div>
        </div>
    </Fragment>
    );
};

export default Facturacion;