import React, { Fragment } from 'react';
import styles from './footer.module.css';

const Footer = () => {
    return (
    <Fragment>
        <footer className="footer">
        <div className={styles.linea}></div>
        <div className={styles.copyright}>
            <h2>© 2025 Gaiafact</h2>
        </div>
        </footer>
    </Fragment>
    );
};

export default Footer;