// script.js - animación Canvas + voces con Web Speech API
// Configuración
    const LAUNCH_DURATION = 5000;
    const CHARACTER_COLORS = [
      { suit: '#3b82f6', visor: '#60a5fa', skin: '#fcd5b8' },
      { suit: '#22c55e', visor: '#86efac', skin: '#e8c4a0' },
      { suit: '#f97316', visor: '#fdba74', skin: '#f5d0b8' }
    ];
    const CHARACTER_NAMES = ['Comandante', 'Piloto', 'Ingeniera'];
    const CHARACTER_VOICES = [
      // Cada personaje tiene un tono y una velocidad distinta.
      // rate más bajo = habla más lento y se entiende mejor.
      { pitch: 0.75, rate: 0.78 }, // Comandante: voz grave y pausada
      { pitch: 1.15, rate: 0.84 }, // Piloto: voz media y clara
      { pitch: 1.35, rate: 0.80 }  // Ingeniera: voz más aguda y tranquila
    ];

    const DIALOG_SCRIPT = [
      // Las duraciones están ajustadas para que la burbuja y la boca duren
      // lo mismo que la voz aproximada de cada personaje.
      { character: 0, text: "Equipo, esta es nuestra misión más importante.", duration: 4200 },
      { character: 1, text: "Los motores están listos, Comandante.", duration: 3400 },
      { character: 2, text: "Sistemas de navegación calibrados al cien por ciento.", duration: 5000 },
      { character: 0, text: "Excelente trabajo. El planeta Aurora nos espera.", duration: 4400 },
      { character: 1, text: "Nunca había visto un planeta tan brillante.", duration: 4000 },
      { character: 2, text: "Sus anillos emiten una energía única.", duration: 3800 },
      { character: 0, text: "Por eso debemos estudiarlo. Podría salvar nuestra civilización.", duration: 5600 },
      { character: 1, text: "Coordenadas confirmadas. Listo para despegar.", duration: 3800 },
      { character: 2, text: "¡Todos los sistemas en verde!", duration: 3000 },
      { character: 0, text: "Muy bien equipo... ¡Despegue!", duration: 3600 }
    ];

    const TOTAL_DIALOG_TIME = DIALOG_SCRIPT.reduce((sum, d) => sum + d.duration, 0);
    const TOTAL_DURATION = TOTAL_DIALOG_TIME + LAUNCH_DURATION;

    // Estado
    let isPlaying = false;
    let currentTime = 0;
    let lastTimestamp = 0;
    let animationId = null;
    let stars = [];
    let lastSpokenIndex = -1;

    // Elementos DOM
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const btnStart = document.getElementById('btnStart');
    const btnPause = document.getElementById('btnPause');
    const btnRestart = document.getElementById('btnRestart');
    const timeDisplay = document.getElementById('timeDisplay');

    // Inicializar estrellas
    function initStars() {
      stars = [];
      for (let i = 0; i < 100; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 0.5,
          speed: Math.random() * 0.5 + 0.1,
          twinkle: Math.random() * Math.PI * 2
        });
      }
    }

    // Dibujar fondo espacial
    function drawBackground(time) {
      // Gradiente de fondo
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#0a0a1a');
      gradient.addColorStop(0.5, '#1a1a3a');
      gradient.addColorStop(1, '#0f0f2a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Estrellas
      stars.forEach(star => {
        const twinkle = Math.sin(time / 500 + star.twinkle) * 0.5 + 0.5;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * twinkle, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + twinkle * 0.7})`;
        ctx.fill();
        
        star.x -= star.speed;
        if (star.x < 0) star.x = canvas.width;
      });

      // Planeta Aurora
      const planetX = canvas.width - 120;
      const planetY = 100;
      const planetRadius = 60;

      // Brillo del planeta
      const glow = ctx.createRadialGradient(planetX, planetY, planetRadius * 0.5, planetX, planetY, planetRadius * 2);
      glow.addColorStop(0, 'rgba(100, 200, 255, 0.3)');
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.fillRect(planetX - planetRadius * 2, planetY - planetRadius * 2, planetRadius * 4, planetRadius * 4);

      // Planeta
      const planetGradient = ctx.createRadialGradient(planetX - 20, planetY - 20, 0, planetX, planetY, planetRadius);
      planetGradient.addColorStop(0, '#64d8ff');
      planetGradient.addColorStop(0.5, '#3b82f6');
      planetGradient.addColorStop(1, '#1e40af');
      ctx.beginPath();
      ctx.arc(planetX, planetY, planetRadius, 0, Math.PI * 2);
      ctx.fillStyle = planetGradient;
      ctx.fill();

      // Anillos del planeta
      ctx.save();
      ctx.translate(planetX, planetY);
      ctx.rotate(Math.sin(time / 2000) * 0.1);
      ctx.scale(1, 0.3);
      ctx.beginPath();
      ctx.arc(0, 0, planetRadius * 1.8, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(200, 230, 255, 0.6)';
      ctx.lineWidth = 8;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, planetRadius * 1.5, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(150, 200, 255, 0.4)';
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.restore();

      // Panel de control
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, canvas.height - 80, canvas.width, 80);
      ctx.fillStyle = '#2a2a4e';
      ctx.fillRect(0, canvas.height - 80, canvas.width, 5);

      // Luces del panel
      for (let i = 0; i < 15; i++) {
        const blinkPhase = Math.sin(time / 300 + i * 0.5) > 0;
        ctx.beginPath();
        ctx.arc(50 + i * 50, canvas.height - 40, 6, 0, Math.PI * 2);
        ctx.fillStyle = blinkPhase ? ['#22c55e', '#ef4444', '#eab308'][i % 3] : '#333';
        ctx.fill();
      }
    }

    // Dibujar personaje
    function drawCharacter(x, y, colorIndex, isSpeaking, time, name) {
      const colors = CHARACTER_COLORS[colorIndex];
      const bounce = Math.sin(time / 300) * 3;
      const armSwing = Math.sin(time / 400) * 0.3;

      ctx.save();
      ctx.translate(x, y + bounce);

      // Cuerpo (traje espacial)
      ctx.beginPath();
      ctx.ellipse(0, 20, 35, 45, 0, 0, Math.PI * 2);
      ctx.fillStyle = colors.suit;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Detalles del traje
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(-15, 0, 30, 40);

      // Brazos
      ctx.save();
      ctx.translate(-38, 10);
      ctx.rotate(armSwing);
      ctx.beginPath();
      ctx.ellipse(0, 20, 12, 25, 0, 0, Math.PI * 2);
      ctx.fillStyle = colors.suit;
      ctx.fill();
      // Guante
      ctx.beginPath();
      ctx.arc(0, 42, 10, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.translate(38, 10);
      ctx.rotate(-armSwing);
      ctx.beginPath();
      ctx.ellipse(0, 20, 12, 25, 0, 0, Math.PI * 2);
      ctx.fillStyle = colors.suit;
      ctx.fill();
      // Guante
      ctx.beginPath();
      ctx.arc(0, 42, 10, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.restore();

      // Casco
      ctx.beginPath();
      ctx.arc(0, -30, 38, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = '#ddd';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Visor
      ctx.beginPath();
      ctx.ellipse(0, -28, 28, 25, 0, 0, Math.PI * 2);
      const visorGradient = ctx.createLinearGradient(-28, -53, 28, -3);
      visorGradient.addColorStop(0, colors.visor);
      visorGradient.addColorStop(1, 'rgba(0,0,0,0.3)');
      ctx.fillStyle = visorGradient;
      ctx.fill();

      // Cara dentro del visor
      ctx.fillStyle = colors.skin;
      ctx.beginPath();
      ctx.ellipse(0, -25, 20, 18, 0, 0, Math.PI * 2);
      ctx.fill();

      // Ojos
      const blinkPhase = Math.sin(time / 2000) > 0.95;
      const eyeHeight = blinkPhase ? 1 : 5;
      ctx.fillStyle = '#333';
      ctx.beginPath();
      ctx.ellipse(-8, -30, 4, eyeHeight, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(8, -30, 4, eyeHeight, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pupilas
      if (!blinkPhase) {
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-8, -30, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(8, -30, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Boca
      const mouthOpen = isSpeaking ? Math.abs(Math.sin(time / 150)) * 7 + 2 : 3;
      ctx.beginPath();
      if (isSpeaking) {
        ctx.ellipse(0, -18, 6, mouthOpen, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#8B0000';
      } else {
        ctx.arc(0, -18, 4, 0, Math.PI);
        ctx.fillStyle = '#c97878';
      }
      ctx.fill();

      // Detalles del personaje
      if (colorIndex === 1) {
        // Piloto - pelo puntiagudo visible
        ctx.fillStyle = '#4a3728';
        ctx.beginPath();
        ctx.moveTo(-10, -55);
        ctx.lineTo(0, -65);
        ctx.lineTo(10, -55);
        ctx.closePath();
        ctx.fill();
      } else if (colorIndex === 2) {
        // Ingeniera - coleta
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.ellipse(25, -35, 8, 15, 0.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Nombre
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(name, 0, 85);

      ctx.restore();
    }

    // Dibujar cohete en despegue
    function drawRocketLaunch(progress) {
      const rocketY = canvas.height - 100 - (progress * 400);
      const rocketX = canvas.width / 2;
      const shake = Math.sin(progress * 50) * 3;

      ctx.save();
      ctx.translate(rocketX + shake, rocketY);

      // Llamas
      const flameHeight = 40 + Math.random() * 20;
      const flameGradient = ctx.createLinearGradient(0, 30, 0, 30 + flameHeight);
      flameGradient.addColorStop(0, '#fff');
      flameGradient.addColorStop(0.2, '#ffff00');
      flameGradient.addColorStop(0.5, '#ff8800');
      flameGradient.addColorStop(1, 'transparent');
      
      ctx.beginPath();
      ctx.moveTo(-20, 30);
      ctx.quadraticCurveTo(-25, 50, 0, 30 + flameHeight);
      ctx.quadraticCurveTo(25, 50, 20, 30);
      ctx.fillStyle = flameGradient;
      ctx.fill();

      // Cuerpo del cohete
      ctx.beginPath();
      ctx.moveTo(0, -60);
      ctx.lineTo(-25, 0);
      ctx.lineTo(-25, 30);
      ctx.lineTo(25, 30);
      ctx.lineTo(25, 0);
      ctx.closePath();
      ctx.fillStyle = '#e0e0e0';
      ctx.fill();
      ctx.strokeStyle = '#999';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Punta del cohete
      ctx.beginPath();
      ctx.moveTo(0, -60);
      ctx.lineTo(-15, -30);
      ctx.lineTo(15, -30);
      ctx.closePath();
      ctx.fillStyle = '#ef4444';
      ctx.fill();

      // Ventana
      ctx.beginPath();
      ctx.arc(0, -10, 12, 0, Math.PI * 2);
      ctx.fillStyle = '#60a5fa';
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Aletas
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(-25, 10);
      ctx.lineTo(-40, 35);
      ctx.lineTo(-25, 30);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(25, 10);
      ctx.lineTo(40, 35);
      ctx.lineTo(25, 30);
      ctx.fill();

      ctx.restore();
    }

    // Dibujar dialogo
    function drawDialog(text, characterIndex) {
      const positions = [150, canvas.width / 2, canvas.width - 150];
      const x = positions[characterIndex];
      const y = 50;

      // Burbuja
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.beginPath();
      ctx.roundRect(x - 150, y - 25, 300, 50, 10);
      ctx.fill();
      ctx.strokeStyle = CHARACTER_COLORS[characterIndex].suit;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Triangulo
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.beginPath();
      ctx.moveTo(x - 10, y + 25);
      ctx.lineTo(x + 10, y + 25);
      ctx.lineTo(x, y + 40);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x - 10, y + 25);
      ctx.lineTo(x, y + 40);
      ctx.strokeStyle = CHARACTER_COLORS[characterIndex].suit;
      ctx.stroke();

      // Texto
      ctx.fillStyle = '#1a1a2e';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Dividir texto si es muy largo
      const maxWidth = 280;
      const words = text.split(' ');
      let line = '';
      let lines = [];
      
      for (let word of words) {
        const testLine = line + word + ' ';
        if (ctx.measureText(testLine).width > maxWidth) {
          lines.push(line);
          line = word + ' ';
        } else {
          line = testLine;
        }
      }
      lines.push(line);

      const lineHeight = 18;
      const startY = y - (lines.length - 1) * lineHeight / 2;
      lines.forEach((l, i) => {
        ctx.fillText(l.trim(), x, startY + i * lineHeight);
      });
    }

    // Hablar con Web Speech API
    function speak(text, characterIndex) {
      if (!window.speechSynthesis) return;
      
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const spanishVoices = voices.filter(v => v.lang.startsWith('es'));
      
      if (spanishVoices.length > 0) {
        utterance.voice = spanishVoices[characterIndex % spanishVoices.length];
      }
      
      const config = CHARACTER_VOICES[characterIndex];
      utterance.pitch = config.pitch;
      utterance.rate = config.rate;
      utterance.lang = 'es-ES';
      utterance.volume = 1;
      
      window.speechSynthesis.speak(utterance);
    }

    // Obtener dialogo actual
    function getCurrentDialog(time) {
      let elapsed = 0;
      for (let i = 0; i < DIALOG_SCRIPT.length; i++) {
        elapsed += DIALOG_SCRIPT[i].duration;
        if (time < elapsed) {
          return { index: i, dialog: DIALOG_SCRIPT[i] };
        }
      }
      return null;
    }

    // Animacion principal
    function animate(timestamp) {
      if (!lastTimestamp) lastTimestamp = timestamp;
      const delta = timestamp - lastTimestamp;
      lastTimestamp = timestamp;

      if (isPlaying) {
        currentTime += delta;
        
        if (currentTime >= TOTAL_DURATION) {
          currentTime = TOTAL_DURATION;
          isPlaying = false;
          btnPause.textContent = 'Continuar';
        }
      }

      // Dibujar fondo
      drawBackground(currentTime);

      // Obtener dialogo actual
      const dialogInfo = getCurrentDialog(currentTime);
      let speakingCharacter = -1;

      if (dialogInfo) {
        speakingCharacter = dialogInfo.dialog.character;
        
        // Reproducir voz
        if (dialogInfo.index !== lastSpokenIndex) {
          lastSpokenIndex = dialogInfo.index;
          speak(dialogInfo.dialog.text, dialogInfo.dialog.character);
        }
      }

      // Calcular tiempo total de dialogos
      const totalDialogTime = TOTAL_DIALOG_TIME;
      const isLaunching = currentTime > totalDialogTime;

      if (isLaunching) {
        // Escena de despegue
        const launchProgress = (currentTime - totalDialogTime) / (TOTAL_DURATION - totalDialogTime);
        drawRocketLaunch(Math.min(launchProgress, 1));
        
        // Texto de despegue
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('DESPEGUE!', canvas.width / 2, canvas.height / 2 - 50);
      } else {
        // Dibujar personajes
        const positions = [150, canvas.width / 2, canvas.width - 150];
        CHARACTER_NAMES.forEach((name, i) => {
          drawCharacter(
            positions[i],
            canvas.height - 180,
            i,
            speakingCharacter === i,
            currentTime,
            name
          );
        });

        // Dibujar diálogo actual
        if (dialogInfo) {
          drawDialog(dialogInfo.dialog.text, dialogInfo.dialog.character);
        }
      }

      // Actualizar tiempo
      timeDisplay.textContent = `Tiempo: ${(currentTime / 1000).toFixed(1)}s / ${(TOTAL_DURATION / 1000).toFixed(1)}s`;

      animationId = requestAnimationFrame(animate);
    }

    // Event listeners
    btnStart.addEventListener('click', () => {
      // Cargar voces
      if (window.speechSynthesis) {
        window.speechSynthesis.getVoices();
      }
      
      initStars();
      isPlaying = true;
      currentTime = 0;
      lastSpokenIndex = -1;
      lastTimestamp = 0;
      
      btnStart.style.display = 'none';
      btnPause.style.display = 'inline-block';
      btnRestart.style.display = 'inline-block';
      
      if (animationId) cancelAnimationFrame(animationId);
      animationId = requestAnimationFrame(animate);
    });

    btnPause.addEventListener('click', () => {
      isPlaying = !isPlaying;
      btnPause.textContent = isPlaying ? 'Pausar' : 'Continuar';
      
      if (window.speechSynthesis) {
        if (isPlaying) {
          window.speechSynthesis.resume();
        } else {
          window.speechSynthesis.pause();
        }
      }
    });

    btnRestart.addEventListener('click', () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      
      currentTime = 0;
      lastSpokenIndex = -1;
      lastTimestamp = 0;
      isPlaying = true;
      btnPause.textContent = 'Pausar';
      initStars();
    });

    // Inicializar
    initStars();
    drawBackground(0);
    CHARACTER_NAMES.forEach((name, i) => {
      drawCharacter(
        [150, canvas.width / 2, canvas.width - 150][i],
        canvas.height - 180,
        i,
        false,
        0,
        name
      );
    });

    // Pre-cargar voces
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }
