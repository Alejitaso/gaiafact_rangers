import React, { Fragment, useEffect, useRef, useState, useMemo, useCallback } from 'react';
import ClientesAxios from '../../config/axios';
import styles from './inicio.module.css';
import LogsViewer from '../admin/LogsViewer';

const TIEMPO_SLIDE = 6000; // 6 segundos

const Inicio = React.memo(() => {
  const carouselRef = useRef(null);
  const rafRef = useRef(null);

  const [images, setImages] = useState([]);
  const [currentRotation, setCurrentRotation] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // ✅ Memoiza cálculos pesados
  const numItems = useMemo(() => images.length, [images]);
  const angleStep = useMemo(() => (numItems > 0 ? 360 / numItems : 0), [numItems]);

  // ✅ Carga de imágenes con lazy loading
  const cargarImagenes = useCallback(async () => {
    try {
      const res = await ClientesAxios.get('api/imagenes/carousel');
      if (res.data.exito && res.data.imagenes) {
        const urls = res.data.imagenes.map(img => `${process.env.REACT_APP_API_URL}${img}`);
        setImages(urls);
      } else {
        setImages([]);
      }
    } catch (error) {
      console.error('❌ Error al cargar imágenes:', error);
      setImages([]);
    }
  }, []);

  // ✅ Memoiza la lógica del carrusel
  const updateCarousel = useCallback((rotation) => {
    if (!carouselRef.current || numItems === 0) return;
    const carouselItems = carouselRef.current.querySelectorAll(`.${styles.curvedCarouselItem}`);
    carouselRef.current.style.transform = `rotateX(-15deg) rotateY(${rotation}deg)`;

    carouselItems.forEach((item, index) => {
      const itemAngle = index * angleStep;
      let relativeAngle = (itemAngle + rotation) % 360;
      if (relativeAngle > 180) relativeAngle -= 360;
      if (relativeAngle < -180) relativeAngle += 360;

      item.style.setProperty('--angle', itemAngle);

      const isVisible = Math.abs(relativeAngle) < (angleStep * (numItems / 2 - 0.5));
      const isCenter = Math.abs(relativeAngle) < (angleStep / 2);

      item.classList.toggle(styles.visible, isVisible);
      item.classList.toggle(styles.centerItem, isCenter);
      if (isCenter) setCurrentIndex(index);
    });
  }, [angleStep, numItems, styles]);

  // ✅ Animación suave con setTimeout (6 segundos)
  const showNextItem = useCallback(() => {
    if (angleStep === 0) return;
    setCurrentRotation(prev => prev - angleStep);
  }, [angleStep]);

  const startAutoSlide = useCallback(() => {
    const step = () => {
      showNextItem();
      rafRef.current = setTimeout(step, TIEMPO_SLIDE);
    };
    step();
  }, [showNextItem]);

  const stopAutoSlide = useCallback(() => {
    if (rafRef.current) {
      clearTimeout(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  // ✅ Efectos limpios y optimizados
  useEffect(() => {
    cargarImagenes();
    return () => {
      stopAutoSlide();
      if (carouselRef.current) carouselRef.current.style.transform = '';
    };
  }, [cargarImagenes, stopAutoSlide]);

  useEffect(() => {
    updateCarousel(currentRotation);
  }, [currentRotation, updateCarousel]);

  useEffect(() => {
    if (images.length > 0 && angleStep > 0 && !isPaused) {
      if (!isHovered) {
        startAutoSlide();
      } else {
        stopAutoSlide();
      }
    }
    return () => stopAutoSlide();
  }, [isHovered, images.length, angleStep, startAutoSlide, stopAutoSlide, isPaused]);

  return (
    <Fragment>
      {/* Botón de pausa / reanudar */}
      

      <div className={styles.curvedCarouselWrapper}>
        <div
          className={styles.curvedCarousel}
          ref={carouselRef}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onFocus={() => setIsHovered(true)} // ✅ teclado
          onBlur={() => setIsHovered(false)}
          tabIndex={0} // ✅ focusable
          aria-label="Carrusel de imágenes"
        >
          {images.length > 0 ? (
            images.map((image, index) => (
              <div
                key={index}
                className={styles.curvedCarouselItem}
                style={{ '--angle': index * angleStep }}
              >
                <img
                  src={image}
                  alt={`Imagen ${index + 1}`}
                  loading="lazy"
                  decoding="async"
                  onError={(e) => (e.target.src = '/fallback.jpg')}
                />
              </div>
            ))
          ) : (
            <p style={{ color: 'white', textAlign: 'center' }}>Cargando imágenes...</p>
          )}
        </div>
      </div>

      <div className={styles.slang}>
        <h2>Nuestra prioridad es cuidar el planeta</h2>
      </div>

      {["ADMINISTRADOR", "SUPERADMIN"].includes((localStorage.getItem("tipo_usuario") || "").toUpperCase()) && <LogsViewer />}
    </Fragment>
  );
});

export default Inicio;