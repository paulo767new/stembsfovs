import React, { useRef, useEffect } from 'react';

const StemButton = ({ 
  name, 
  icon: Icon, 
  color, 
  isActive, 
  isPlaying, 
  onClick,
  audioSystem,
  stemKey 
}) => {
  const canvasRef = useRef(null);
  const glowRef = useRef(null);
  const requestRef = useRef();

  const draw = () => {
    if (!canvasRef.current || !audioSystem || !isActive || !isPlaying) {
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
      if (isActive && isPlaying) {
        requestRef.current = requestAnimationFrame(draw);
      }
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    const stemData = audioSystem.getStemData(stemKey);
    if (!stemData) {
      requestRef.current = requestAnimationFrame(draw);
      return;
    }

    const { dataArray, rms } = stemData;
    
    ctx.clearRect(0, 0, width, height);

    ctx.lineWidth = 3;
    // Darker and highly visible wave color
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.beginPath();

    const sliceWidth = width * 2.0 / dataArray.length;
    let x = 0;

    // Draw half the points for performance
    for (let i = 0; i < dataArray.length; i += 2) {
      const v = dataArray[i] / 128.0;
      const y = v * height / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    if (glowRef.current) {
      glowRef.current.style.opacity = Math.min(rms * 3, 1);
    }

    requestRef.current = requestAnimationFrame(draw);
  };

  useEffect(() => {
    if (isActive && isPlaying) {
      requestRef.current = requestAnimationFrame(draw);
    } else {
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
      if (glowRef.current) {
        glowRef.current.style.opacity = 0;
      }
      cancelAnimationFrame(requestRef.current);
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [isActive, isPlaying]);

  return (
    <button 
      className={`stem-button ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      <div 
        className="stem-icon-wrapper" 
        style={{ backgroundColor: isActive ? color : '#888888' }}
      >
        <div className="stem-icon-glow" ref={glowRef} style={{ backgroundColor: color }}></div>
        <Icon size={24} />
      </div>
      <canvas 
        ref={canvasRef} 
        className="stem-canvas" 
        width={300} 
        height={60} 
      />
      {!isPlaying && (
        <div className="stem-content">
          ← {isActive ? 'desactivar' : 'activar'} {name}
        </div>
      )}
    </button>
  );
};

export default StemButton;
