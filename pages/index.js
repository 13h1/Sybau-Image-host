// pages/index.js

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image'; // Importation du composant Image de Next.js

export default function Home() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [description, setDescription] = useState('');
  const [customName, setCustomName] = useState('');
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // --- thème ---
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };
  // --- Fin du thème ---

  // --- Tourne-Disque ---
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);

  const audioFiles = [
    { name: 'Bekamine', src: '/audio/Bekamine.mp3', discImage: '/discs/55asky.png' },
    { name: 'UET', src: '/audio/uet.mp3', discImage: '/discs/Luther.png' },
    // Ajoute autant de fichiers que tu veux ici
  ];

  const [currentAudioIndex, setCurrentAudioIndex] = useState(0);
  const currentAudio = audioFiles[currentAudioIndex];

  // Correction 1: Ajout de 'isPlaying' aux dépendances du useEffect à la ligne 88 (dans les logs)
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume;

      const setAudioData = () => {
        setDuration(audio.duration);
        setCurrentTime(audio.currentTime);
      };

      const setAudioTime = () => setCurrentTime(audio.currentTime);
      const togglePlayPause = () => setIsPlaying(!audio.paused);

      audio.addEventListener('loadeddata', setAudioData);
      audio.addEventListener('timeupdate', setAudioTime);
      audio.addEventListener('play', togglePlayPause);
      audio.addEventListener('pause', togglePlayPause);
      audio.addEventListener('ended', () => setIsPlaying(false));

      return () => {
        audio.removeEventListener('loadeddata', setAudioData);
        audio.removeEventListener('timeupdate', setAudioTime);
        audio.removeEventListener('play', togglePlayPause);
        audio.removeEventListener('pause', togglePlayPause);
        audio.removeEventListener('ended', () => setIsPlaying(false));
      };
    }
  }, [volume, isPlaying]); // <-- 'isPlaying' ajouté ici

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.load();
      if (isPlaying) {
        audioRef.current.play();
      }
    }
  }, [currentAudioIndex, isPlaying]); // Ajout de 'isPlaying' ici aussi pour s'assurer que la lecture est déclenchée lors du changement d'audio si 'isPlaying' est vrai

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (event) => {
    const audio = audioRef.current;
    audio.currentTime = event.target.value;
    setCurrentTime(audio.currentTime);
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleVolumeChange = (event) => {
    const newVolume = parseFloat(event.target.value);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    setVolume(newVolume);
  };

  const handleNextSong = () => {
    setCurrentAudioIndex((prevIndex) => (prevIndex + 1) % audioFiles.length);
    setIsPlaying(true);
  };

  const handlePrevSong = () => {
    setCurrentAudioIndex((prevIndex) => (prevIndex - 1 + audioFiles.length) % audioFiles.length);
    setIsPlaying(true);
  };
  // --- Fin logique du lecteur audio ---

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setUploadedUrl('');
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedFile) {
      setError("Veuillez sélectionner une image.");
      return;
    }

    setLoading(true);
    setError('');
    setUploadedUrl('');

    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('description', description);
    formData.append('customName', customName);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Erreur d'upload: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      setUploadedUrl(data.url);
      setSelectedFile(null);
      setDescription('');
      setCustomName('');

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      {/* Bouton de bascule du thème */}
      <button onClick={toggleTheme} className="theme-toggle-button">
        {theme === 'light' ? '🌙' : '☀️'} {/* Émojis directement acceptés ici */}
      </button>

      {/* Titre */}
      <h1 className="sybau-title">Sybau Imager</h1>

      {/* --- DÉBUT DU LECTEUR AUDIO (TOURNE-DISQUE) --- */}
      <div className="turntable-container">
        {/* Le lecteur audio HTML5, réel, masqué */}
        <audio ref={audioRef} src={currentAudio.src} preload="auto" />

        <div className="turntable-base">
          <div className={`turntable-disc ${isPlaying ? 'spinning' : ''}`}>
            {/* Correction 3: Utilisation du composant Image de Next.js */}
            <Image
              src={currentAudio.discImage}
              alt="Disc"
              className="disc-image"
              width={200} // Remplacez par la largeur de votre image de disque
              height={200} // Remplacez par la hauteur de votre image de disque
              priority // Pour le chargement rapide de l'image visible
            />
          </div>
          <div className="turntable-arm"></div>
        </div>

        <div className="turntable-controls">
          <div className="song-info">
            <p>{currentAudio.name}</p>
          </div>
          <div className="playback-buttons">
            <button onClick={handlePrevSong} className="control-button">
              &#9664;&#9664; {/* Double flèche gauche */}
            </button>
            <button onClick={handlePlayPause} className="control-button play-pause-button">
              {isPlaying ? '❚❚' : '▶️'} Pause ou Play ? 
            </button>
            <button onClick={handleNextSong} className="control-button">
              &#9654;&#9654; {/* Double flèche droite */}
            </button>
          </div>
          <div className="progress-bar-container">
            {/* Barre de progression */}
            <span>{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="progress-bar"
            />
            <span>{formatTime(duration)}</span>
          </div>
          {/* Nouvelle barre de volume */}
          <div className="volume-control-container">
            <span>Vol:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="volume-bar"
            />
          </div>
        </div>
      </div>
      {/* --- FIN DU LECTEUR AUDIO (TOURNE-DISQUE) --- */}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="image">Image :</label>
          <input
            type="file"
            id="image"
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description (optionnel) :</label>
          <input
            type="text"
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="chp une description"
          />
        </div>

        <div className="form-group">
          <label htmlFor="customName">Nom de l'URL (optionnel) :</label>
          <input
            type="text"
            id="customName"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            // Correction 4: Émoji crâne échappé
            placeholder="Ex: 13h1 est un bon dev &#128128;"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="upload-button"
        >
          {loading ? 'Uploader en cours...' : 'Uploader'}
        </button>
      </form>

      {error && <p className="error-message">{error}</p>}

      {uploadedUrl && (
        <div className="results-section">
          <h3>Image uploadée ! Voici votre lien :</h3>
          <a
            href={uploadedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="uploaded-link"
          >
            {uploadedUrl}
          </a>
          <button
            onClick={() => navigator.clipboard.writeText(uploadedUrl)}
            className="copy-button"
          >
            Copier le lien
          </button>

          <h3>Aperçu :</h3>
          {/* Correction 5: Utilisation du composant Image de Next.js */}
          <Image
            src={uploadedUrl}
            alt="Image uploadée"
            className="image-preview"
            width={600} // Largeur d'exemple, ajustez selon vos besoins
            height={400} // Hauteur d'exemple, ajustez selon vos besoins
            objectFit="contain" // Pour que l'image s'adapte sans être coupée
          />
        </div>
      )}
    </div>
  );
}
