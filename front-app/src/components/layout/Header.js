import React, { Fragment } from 'react';
import styles from'./header.module.css'

const Header = ({ title }) => {
    return (
    <Fragment>
        <header>
            <div className={styles.linea_1}></div>
        <div className={styles.logos}>
            <div className={styles.logoizquierdo}>
            <img src="../logos/logo_final (1).png" alt="Logo Izquierdo" />
            </div>
            <div className={styles.nombretienda}>Athena'S</div>
            <div className={styles.logoderecho}>
            <img src="../logos/logo_athena_S.png" alt="Logo Derecho" />
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