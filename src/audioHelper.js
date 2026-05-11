export class AudioSystem {
  constructor() {
    this.context = null;
    this.stems = {};
    this.isPlaying = false;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    this.context = new (window.AudioContext || window.webkitAudioContext)();
    this.initialized = true;
  }

  async loadStems(codigo, stemsList) {
    if (!this.initialized) this.init();
    
    // Cleanup if reloading
    for (const key in this.stems) {
      this.stems[key].audio.pause();
      this.stems[key].audio.removeAttribute('src');
    }
    this.stems = {};
    
    for (const stem of stemsList) {
      const audio = new Audio();
      audio.src = `/assets/stems/${codigo}/${stem}.m4a`;
      audio.loop = true; // Let's loop the track for practice
      audio.crossOrigin = "anonymous";
      
      const source = this.context.createMediaElementSource(audio);
      const analyser = this.context.createAnalyser();
      analyser.fftSize = 256;
      
      const gainNode = this.context.createGain();
      
      source.connect(analyser);
      analyser.connect(gainNode);
      gainNode.connect(this.context.destination);
      
      this.stems[stem] = {
        audio,
        analyser,
        gainNode,
        dataArray: new Uint8Array(analyser.frequencyBinCount)
      };
    }
  }

  play() {
    if (!this.initialized) return;
    if (this.context.state === 'suspended') {
      this.context.resume();
    }
    
    for (const key in this.stems) {
      this.stems[key].audio.play();
    }
    this.isPlaying = true;
  }
  
  pause() {
    for (const key in this.stems) {
      this.stems[key].audio.pause();
    }
    this.isPlaying = false;
  }

  stop() {
    this.pause();
    this.seek(0);
  }
  
  seek(time) {
    for (const key in this.stems) {
      this.stems[key].audio.currentTime = time;
    }
  }
  
  setStemVolume(stem, volume) {
    if (this.stems[stem]) {
      this.stems[stem].gainNode.gain.setTargetAtTime(volume, this.context.currentTime, 0.05);
    }
  }

  getStemData(stem) {
    if (!this.stems[stem]) return null;
    const analyser = this.stems[stem].analyser;
    const dataArray = this.stems[stem].dataArray;
    analyser.getByteTimeDomainData(dataArray);
    
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const v = (dataArray[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / dataArray.length);
    
    return { dataArray, rms };
  }
}
