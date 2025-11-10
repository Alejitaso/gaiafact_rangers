import React, { Fragment, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import styles from './inicio.module.css';

const Inicio = () => {
    const carouselRef = useRef(null);
    const intervalRef = useRef(null);

    const [images, setImages] = useState([]); // ← ahora vienen del backend
    const [currentRotation, setCurrentRotation] = useState(0);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    // Cargar imágenes del backend
    const cargarImagenes = async () => {
        try {
            const res = await axios.get('http://localhost:4000/api/imagenes/carousel');
            if (res.data.exito && res.data.imagenes) {
                // Agregamos la URL completa
                const urls = res.data.imagenes.map(img => `http://localhost:4000${img}`);
                setImages(urls);
                console.log('🖼️ Imágenes cargadas:', urls);
            } else {
                console.warn('⚠️ No se encontraron imágenes');
            }
        } catch (error) {
            console.error('❌ Error al cargar imágenes del backend:', error);
        }
    };

    const numItems = images.length;
    const angleStep = numItems > 0 ? 360 / numItems : 0;

    const updateCarousel = (rotation) => {
        if (!carouselRef.current) return;
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

            item.classList.remove(styles.visible, styles.centerItem);
            if (isVisible) item.classList.add(styles.visible);
            if (isCenter) {
                item.classList.add(styles.centerItem);
                setCurrentIndex(index);
            }
        });
    };

    const showNextItem = () => {
        const newRotation = currentRotation - angleStep;
        setCurrentRotation(newRotation);
        updateCarousel(newRotation);
    };

    const startAutoSlide = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(showNextItem, 3000);
    };

    const stopAutoSlide = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
    };

    const handleMouseEnter = () => {
        setIsHovered(true);
        stopAutoSlide();
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        startAutoSlide();
    };

    useEffect(() => {
        cargarImagenes(); // 👈 cargar imágenes desde el backend
    }, []);

    useEffect(() => {
        if (images.length > 0) {
            updateCarousel(0);
            if (!isHovered) startAutoSlide();
        }
        return () => stopAutoSlide();
    }, [images, isHovered]);

    return (
        <Fragment>
            <div className={styles.curvedCarouselWrapper}>
                <div 
                    className={styles.curvedCarousel}
                    ref={carouselRef}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
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
                                    onError={(e) => e.target.src = '/fallback.jpg'} 
                                />
                            </div>
                        ))
                    ) : (
                        <p>Cargando imágenes...</p>
                    )}
                </div>
            </div>

            <div className={styles.slang}>
                <h2>Nuestra prioridad es cuidar el planeta</h2>
            </div>
        </Fragment>
    );
};

export default Inicio;
