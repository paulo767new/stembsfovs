import React, { useState, useEffect, useRef } from 'react';
import { Mic, Speaker, Guitar, Music, Check } from 'lucide-react';
import StemButton from './components/StemButton';
import { AudioSystem } from './audioHelper';
import './index.css';

const STEMS_INFO = [
  { key: 'vocals', name: 'vocales', color: '#2ECC71', icon: Mic },
  { key: 'drums', name: 'batería', color: '#F1C40F', icon: Speaker },
  { key: 'bass', name: 'bajo', color: '#E67E22', icon: Guitar },
  { key: 'ins', name: 'instrumentos', color: '#00BCD4', icon: Music },
];

function App() {
  const [songData, setSongData] = useState(null);
  const [activeStems, setActiveStems] = useState({
    vocals: false, drums: false, bass: false, ins: false
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [alignMode, setAlignMode] = useState(true);
  const [isReady, setIsReady] = useState(false);
  
  const audioSystemRef = useRef(null);
  const alignTimeoutRef = useRef(null);

  useEffect(() => {
    fetch('/assets/songs.json')
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          const pathCode = window.location.pathname.substring(1).replace(/\/$/, "");
          let matchedSong = data.find(s => s.codigo === pathCode);
          
          if (!matchedSong && pathCode === "") {
            matchedSong = data[0];
            window.history.replaceState(null, "", `/${matchedSong.codigo}`);
          }
          
          if (matchedSong) {
            setSongData(matchedSong);
          } else {
            setSongData({ error: true });
          }
        }
      })
      .catch(err => console.error("Error loading songs.json", err));
  }, []);

  useEffect(() => {
    if (songData && !songData.error && !audioSystemRef.current) {
      const sys = new AudioSystem();
      audioSystemRef.current = sys;
      sys.loadStems(songData.codigo, STEMS_INFO.map(s => s.key)).then(() => {
        // Force a 3 second delay to ensure audios are fully ready
        setTimeout(() => {
          setIsReady(true);
        }, 3000);
      });
    }
    return () => {
      if (audioSystemRef.current) {
        audioSystemRef.current.pause();
      }
    }
  }, [songData]);

  useEffect(() => {
    if (!audioSystemRef.current || !isReady) return;
    
    if (isPlaying) {
      if (alignMode && alignTimeoutRef.current) {
        return;
      }
      
      Object.keys(activeStems).forEach(stem => {
        audioSystemRef.current.setStemVolume(stem, activeStems[stem] ? 1 : 0);
      });
    }
  }, [activeStems, isPlaying, isReady]);

  const toggleStem = (stemKey) => {
    setActiveStems(prev => ({
      ...prev,
      [stemKey]: !prev[stemKey]
    }));
  };

  const handlePlayPause = () => {
    if (!isReady || !audioSystemRef.current) return;
    
    const sys = audioSystemRef.current;

    if (isPlaying) {
      sys.stop();
      setIsPlaying(false);
      if (alignTimeoutRef.current) {
        clearTimeout(alignTimeoutRef.current);
        alignTimeoutRef.current = null;
      }
    } else {
      sys.init(); 
      
      if (alignMode && songData.espera_segundos) {
        Object.keys(activeStems).forEach(stem => sys.setStemVolume(stem, 1));
        
        alignTimeoutRef.current = setTimeout(() => {
          Object.keys(activeStems).forEach(stem => {
            sys.setStemVolume(stem, activeStems[stem] ? 1 : 0);
          });
          alignTimeoutRef.current = null;
        }, songData.espera_segundos * 1000);
      } else {
        Object.keys(activeStems).forEach(stem => {
          sys.setStemVolume(stem, activeStems[stem] ? 1 : 0);
        });
      }
      
      sys.play();
      setIsPlaying(true);
    }
  };

  if (songData && songData.error) {
    return <div className="loading">Canción no encontrada</div>;
  }

  if (!isReady || !songData) {
    return <div className="loading">Cargando audios...</div>;
  }

  return (
    <div className="app-container">
      <div className="cover-art-container">
        <img 
          src={`/assets/covers/${songData.codigo}.jpg`} 
          alt={`Cover of ${songData.nombre}`}
          className="cover-art"
        />
      </div>

      <div className="stems-container">
        {STEMS_INFO.map(stem => (
          <StemButton
            key={stem.key}
            stemKey={stem.key}
            name={stem.name}
            color={stem.color}
            icon={stem.icon}
            isActive={activeStems[stem.key]}
            isPlaying={isPlaying}
            onClick={() => toggleStem(stem.key)}
            audioSystem={audioSystemRef.current}
          />
        ))}
      </div>

      <div className="align-container" onClick={() => setAlignMode(!alignMode)}>
        <div className={`align-checkbox ${alignMode ? 'checked' : ''}`}>
          {alignMode && <Check size={28} color="white" />}
        </div>
        <div className="align-text">
          empezar con {songData.espera_segundos} segundos de todos los stems para poder alinearte mejor
        </div>
      </div>

      <button 
        className={`listo-button ${isPlaying ? 'playing' : ''}`}
        onClick={handlePlayPause}
      >
        {isPlaying ? 'parar' : 'listo'}
      </button>
    </div>
  );
}

export default App;
