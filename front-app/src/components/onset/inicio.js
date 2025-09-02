import React, { Fragment, useEffect, useRef, useState } from 'react';
import styles from './inicio.module.css';

// Importar imágenes desde la carpeta onset/img
import img1 from './img/imagen_1.jpg';
import img2 from './img/imagen_1.jpg';
import img3 from './img/imagen_1.jpg';
import img4 from './img/imagen_1.jpg';
import img5 from './img/imagen_1.jpg';
import img6 from './img/imagen_1.jpg';
import img7 from './img/imagen_1.jpg';
import img8 from './img/imagen_1.jpg';
import img9 from './img/imagen_1.jpg';
import img10 from './img/imagen_1.jpg';

const Inicio = () => {
    // Array con todas las imágenes importadas
    const images = [img1, img2, img3, img4, img5, img6, img7, img8, img9, img10];
    
    // Referencias de React en lugar de querySelector
    const carouselRef = useRef(null);
    const intervalRef = useRef(null);
    
    // Estados para el carrusel
    const [currentRotation, setCurrentRotation] = useState(0);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    
    const numItems = images.length;
    const angleStep = 360 / numItems;
    
    // Función para actualizar el carrusel
    const updateCarousel = (rotation) => {
        if (!carouselRef.current) return;
        
        const carouselItems = carouselRef.current.querySelectorAll(`.${styles.curvedCarouselItem}`);
        
        // Aplicar transformación al contenedor principal
        carouselRef.current.style.transform = `rotateX(-15deg) rotateY(${rotation}deg)`;
        
        // Actualizar cada item
        carouselItems.forEach((item, index) => {
            const itemAngle = index * angleStep;
            
            // Calcular ángulo relativo
            let relativeAngle = (itemAngle + rotation) % 360;
            if (relativeAngle > 180) relativeAngle -= 360;
            if (relativeAngle < -180) relativeAngle += 360;
            
            // Establecer variable CSS personalizada
            item.style.setProperty('--angle', itemAngle);
            
            // Determinar visibilidad y posición central
            const isVisible = Math.abs(relativeAngle) < (angleStep * (numItems / 2 - 0.5));
            const isCenter = Math.abs(relativeAngle) < (angleStep / 2);
            
            // Remover clases anteriores
            item.classList.remove(styles.visible, styles.centerItem);
            
            // Agregar clases según estado
            if (isVisible) {
                item.classList.add(styles.visible);
            }
            if (isCenter) {
                item.classList.add(styles.centerItem);
                setCurrentIndex(index);
            }
        });
    };
    
    // Función para avanzar al siguiente item
    const showNextItem = () => {
        const newRotation = currentRotation - angleStep;
        setCurrentRotation(newRotation);
        updateCarousel(newRotation);
    };
    
    // Iniciar auto-slide
    const startAutoSlide = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        intervalRef.current = setInterval(showNextItem, 3000);
    };
    
    // Pausar auto-slide
    const stopAutoSlide = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
    };
    
    // Manejar hover
    const handleMouseEnter = () => {
        setIsHovered(true);
        stopAutoSlide();
    };
    
    const handleMouseLeave = () => {
        setIsHovered(false);
        startAutoSlide();
    };
    
    // Effect para inicializar y limpiar el carrusel
    useEffect(() => {
        console.log('Componente Inicio montado');
        console.log('Número de imágenes:', images.length);
        
        // Pequeño delay para asegurar que el DOM esté listo
        const initTimer = setTimeout(() => {
            // Inicializar el carrusel
            updateCarousel(currentRotation);
            
            // Iniciar auto-slide si no está en hover
            if (!isHovered) {
                startAutoSlide();
            }
        }, 100);
        
        return () => {
            clearTimeout(initTimer);
            stopAutoSlide();
        };
    }, []);
    
    // Effect para manejar el auto-slide basado en hover
    useEffect(() => {
        if (isHovered) {
            stopAutoSlide();
        } else {
            startAutoSlide();
        }
        
        return () => stopAutoSlide();
    }, [isHovered]);
    
    // Effect de limpieza al desmontar
    useEffect(() => {
        return () => {
            stopAutoSlide();
        };
    }, []);
    
    return (
        <Fragment>
            <div className={styles.curvedCarouselWrapper}>
                <div 
                    className={styles.curvedCarousel}
                    ref={carouselRef}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    {images.map((image, index) => (
                        <div 
                            key={index} 
                            className={styles.curvedCarouselItem}
                            style={{ '--angle': index * angleStep }}
                        >
                            <img 
                                src={image} 
                                alt={`Imagen ${index + 1}`}
                                onLoad={() => console.log(`Imagen ${index + 1} cargada exitosamente`)}
                                onError={(e) => {
                                    console.error(`Error cargando imagen ${index + 1}:`, e);
                                    // Fallback: podrías poner una imagen por defecto aquí
                                }}
                            />
                        </div>
                    ))}
                </div>
            </div>
            <div className={styles.slang}>
                <h2>Nuestra prioridad es cuidar el planeta</h2>
            </div>
        </Fragment>
    );
};

export default Inicio;