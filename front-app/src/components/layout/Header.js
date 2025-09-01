import React, { Fragment } from 'react';
import './main.css';
import './header.css'

const Header = ({ title }) => {
    return (
    <Fragment>
        <header>
            <div className="linea_1"></div>
        <div className="logos">
            <div className="logo-izquierdo">
            <img src="../logos/logo_final (1).png" alt="Logo Izquierdo" />
            </div>
            <div className="nombre-tienda">Athena'S</div>
            <div className="logo-derecho">
            <img src="../logos/logo_athena_S.png" alt="Logo Derecho" />
            </div>
        </div>
        <div className="linea_2">
            <h1>{title}</h1>
        </div>
        </header>
    </Fragment>
    );
};

export default Header;