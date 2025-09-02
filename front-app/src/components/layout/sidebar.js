import React, { Fragment } from 'react';
import styles from './sidebar.module.css';

const Sidebar = () => {
  const toggleNav = () => {
    const screenWidth = window.innerWidth;
    const sidebar = document.getElementById("mySidebar");
    const mainContent = document.getElementById("main");
    const contactInfo = document.getElementById("contactInfo");
    const codeInfo = document.getElementById("codeInfo");
    const regInfo = document.getElementById("regInfo");

    if (screenWidth >= 768) {
      if (sidebar.classList.contains("open")) {
        if (
          (contactInfo && contactInfo.classList.contains("expanded")) ||
          (codeInfo && codeInfo.classList.contains("expanded")) ||
          (regInfo && regInfo.classList.contains("expanded"))
        ) {
          contactInfo?.classList.remove("expanded");
          codeInfo?.classList.remove("expanded");
          regInfo?.classList.remove("expanded");
        }
        setTimeout(() => {
          sidebar.classList.remove("open");
          sidebar.style.width = "80px";
          mainContent.style.marginLeft = "80px";
        }, 300);
      } else {
        sidebar.classList.add("open");
        sidebar.style.width = "250px";
        mainContent.style.marginLeft = "250px";
      }
    } else {
      if (sidebar.classList.contains("open")) {
        if (
          (contactInfo && contactInfo.classList.contains("expanded")) ||
          (codeInfo && codeInfo.classList.contains("expanded")) ||
          (regInfo && regInfo.classList.contains("expanded"))
        ) {
          contactInfo?.classList.remove("expanded");
          codeInfo?.classList.remove("expanded");
          regInfo?.classList.remove("expanded");
        }
        setTimeout(() => {
          sidebar.classList.remove("open");
          sidebar.style.width = "50px";
          mainContent.style.marginLeft = "50px";
        }, 300);
      } else {
        sidebar.classList.add("open");
        sidebar.style.width = "38%";
        mainContent.style.marginLeft = "38%";
      }
    }
  };

  const toggleContactInfo = (event) => {
    event.preventDefault();
    const contactInfo = document.getElementById("contactInfo");
    const sidebar = document.getElementById("mySidebar");

    if (!sidebar.classList.contains("open")) {
      toggleNav();
      setTimeout(() => {
        contactInfo?.classList.toggle("expanded");
      }, 400);
    } else {
      contactInfo?.classList.toggle("expanded");
    }
  };

  const toggleCodeInfo = (event) => {
    event.preventDefault();
    const codeInfo = document.getElementById("codeInfo");
    const sidebar = document.getElementById("mySidebar");

    if (!sidebar.classList.contains("open")) {
      toggleNav();
      setTimeout(() => {
        codeInfo?.classList.toggle("expanded");
      }, 400);
    } else {
      codeInfo?.classList.toggle("expanded");
    }
  };

  const toggleRegInfo = (event) => {
    event.preventDefault();
    const regInfo = document.getElementById("regInfo");
    const sidebar = document.getElementById("mySidebar");

    if (!sidebar.classList.contains("open")) {
      toggleNav();
      setTimeout(() => {
        regInfo?.classList.toggle("expanded");
      }, 400);
    } else {
      regInfo?.classList.toggle("expanded");
    }
  };

  return (
    <Fragment>
      <div id="mySidebar" className={styles.sidebar}>
        <button className={styles.openbtn} onClick={toggleNav}>
          &#9776;
        </button>
        <a 
          onClick={(e) => { e.preventDefault(); window.location.href = "/inicio"; }} 
          className={styles.sidebarLink}
        >
          <i className="fa-solid fa-home"></i> 
          <span className={styles.linkText}>Inicio</span>
        </a>
        <a 
          onClick={(e) => { e.preventDefault(); window.location.href = "/facturacion"; }} 
          className={styles.sidebarLink}
        >
          <i className="fa-solid fa-money-bills"></i> 
          <span className={styles.linkText}>Facturación</span>
        </a>
        <a 
          onClick={(e) => { e.preventDefault(); window.location.href = "/vis-factura"; }} 
          className={styles.sidebarLink}
        >
          <i className="fa-solid fa-list-ul"></i> 
          <span className={styles.linkText}>Ver factura</span>
        </a>
        <a className={styles.codeInfo} onClick={toggleCodeInfo}>
          <i className="fa-solid fa-qrcode"></i> 
          <span className={styles.linkText}>Codigos</span>
        </a>
        <div id="codeInfo" className={`${styles.contactInfo} ${styles.expan}`}>
          <a 
            onClick={() => (window.location.href = "../utils/codigo_qr.html")} 
            className={styles.sidebarLink}
          >
            <i className="fa-solid fa-qrcode"></i> 
            <span className={styles.linkText}>QR</span>
          </a>
          <a 
            onClick={() => (window.location.href = "../utils/codigo_br.html")} 
            className={styles.sidebarLink}
          >
            <i className="fa-solid fa-barcode"></i> 
            <span className={styles.linkText}>Barras</span>
          </a>
        </div>
        <a onClick={toggleRegInfo} className={styles.sidebarLink}>
          <i className="fa-solid fa-folder-plus"></i> 
          <span className={styles.linkText}>Registro</span>
        </a>
        <div id="regInfo" className={`${styles.contactInfo} ${styles.expan}`}>
          <a 
            href="#" 
            onClick={() => (window.location.href = "/registro")} 
            className={styles.sidebarLink}
          >
            <i className="fa-solid fa-user"></i> 
            <span className={styles.linkText}>Usuario</span>
          </a>
          <a 
            onClick={() => (window.location.href = "../products/registro_p.html")} 
            className={styles.sidebarLink}
          >
            <i className="fa-solid fa-box"></i> 
            <span className={styles.linkText}>Producto</span>
          </a>
          <a 
            href="#" 
            onClick={() => (window.location.href = "/Img")} 
            className={styles.sidebarLink}
          >
            <i className="fa-solid fa-upload"></i> 
            <span className={styles.linkText}>Agregar IMG</span>
          </a>
        </div>
        <a 
          onClick={() => (window.location.href = "../utils/notify.html")} 
          className={styles.sidebarLink}
        >
          <i className="fa-solid fa-bell"></i> 
          <span className={styles.linkText}>Notificaciones</span>
        </a>
        <a 
          onClick={() => (window.location.href = "../products/inventario.html")} 
          className={styles.sidebarLink}
        >
          <i className="fa-solid fa-clipboard-list"></i> 
          <span className={styles.linkText}>Inventario</span>
        </a>
        <a 
          onClick={() => (window.location.href = "../user/perfil.html")} 
          className={styles.sidebarLink}
        >
          <i className="fa-solid fa-user-secret"></i> 
          <span className={styles.linkText}>Perfil</span>
        </a>
        <a className={styles.contactToggle} onClick={toggleContactInfo}>
          <i className="fa-solid fa-envelope"></i> 
          <span className={styles.linkText}>Contacto</span>
        </a>
        <div id="contactInfo" className={styles.contactInfo}>
          <p>Email: contacto@gaiafact.com</p>
          <p>Tel: +57 310 123 4567</p>
          <p>Dir: Cra 10 # 20-30, Dosquebradas</p>
        </div>
        <div className={styles.salir}>
          <a 
            onClick={() => (window.location.href = "../auth/login.html")} 
            className={styles.sidebarLink}
          >
            <i className="fa-solid fa-sign-out-alt"></i> 
            <span className={styles.linkText}>Salir</span>
          </a>
        </div>
      </div>
    </Fragment>
  );
};

export default Sidebar;