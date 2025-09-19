import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// 🚩 Elimina esta línea de importación
// import loadingVideo from './videos/loading.mp4'; 

const root = ReactDOM.createRoot(document.getElementById('root'));

function Main() {
  const [isLoading, setIsLoading] = useState(true);

  // Esta función se llamará cuando el video termine
  const handleVideoEnd = () => {
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="loading-screen">
        <video 
          className="loading-video" 
          autoPlay 
          muted 
          onEnded={handleVideoEnd} // Llama a la función al finalizar el video
        >
          {/* 🚩🚩 Usa esta ruta absoluta 🚩🚩 */}
          <source src="/videos/loading.mp4" type="video/mp4" />
          Tu navegador no soporta el video.
        </video>
      </div>
    );
  }

  return (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

root.render(<Main />);

reportWebVitals();