import React, { Fragment } from 'react';
import styles from './header.module.css';

import logoIzquierdo from '../layout/logos/logo_final (1).webp';
import logoDerecho from '../layout/logos/logo_athena_S.webp';

const Header = ({ title }) => {
    return (
        <Fragment>
            <header>
                <div className={styles.linea_1}></div>
                <div className={styles.logos}>
                    <div className={styles.logoizquierdo}>
                        <img 
                            src={logoIzquierdo} 
                            alt="Logo Izquierdo"
                            onError={(e) => console.error('Error cargando logo izquierdo:', e)}
                        />
                    </div>
                    <div className={styles.nombretienda}>Athena'S</div>
                    <div className={styles.logoderecho}>
                        <img 
                            src={logoDerecho} 
                            alt="Logo Derecho"
                            onError={(e) => console.error('Error cargando logo derecho:', e)}
                        />
                    </div>
                </div>
                <div className={styles.linea_2}>
                    <h1>{title}</h1>
                </div>
            </header>
        </Fragment>
    );
};

export default Header;