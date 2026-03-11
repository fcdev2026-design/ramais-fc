/* ==========================================================================
   MÓDULO: MEDIA PLAYER (Lógica de Áudio e Playlist)
   ========================================================================== */

const playlistData = [
    { nome: "Louis armstrong", musica: "What a Wonderful World", estilo: "relax", url: "https://archive.org/download/louis-armstrong-what-a-wonderful-world-vinyl-single-1967/A-What%20A%20Wonderful%20World.mp3" },
    { nome: "The Cranberries", musica: "Linger", estilo: "relax", url: "https://ia800900.us.archive.org/32/items/the-cranberries-linger/The%20Cranberries%20-%20Linger.mp4" },
    { nome: "Tears For Fears", musica: "Woman In Chains", estilo: "foco", url: "https://dn711302.ca.archive.org/0/items/Tears_For_Fears_And_Oleta_Adams_Woman_In_Chains/Tears_For_Fears_And_Oleta_Adams_Woman_In_Chains.mp4" }, 
    { nome: "Legião Urbana", musica: "Quase sem querer", estilo: "foco", url: "https://archive.org/download/1986-legiao-urbana-dois/02%20-%20Quase%20sem%20querer.mp3" }, 
    { nome: "Christopher Cross", musica: "Sailing", estilo: "relax", url: "https://archive.org/download/youtube-JNAgBRB7ouY/Christopher_Cross_-_Sailing_NAVEGANDO_SIN_RUMBO_.-JNAgBRB7ouY.mp4" },
    { nome: "Djavan", musica: "Oceano", estilo: "relax", url: "https://archive.org/download/05.-oceano/05.%20Oceano.mp3" },
    { nome: "Djavan", musica: "Outono", estilo: "relax", url: "https://archive.org/download/05.-oceano/06.%20Outono.mp3" },
    { nome: "Djavan", musica: "Meu Bem Querer", estilo: "relax", url: "https://archive.org/download/14.-milagreiro-feat.-cassia-eller/08.%20Meu%20Bem%20Querer.mp3" },
    { nome: "Os Paralamas do Sucesso", musica: "Romance Ideal", estilo: "foco", url: "https://archive.org/download/6-mensagem-de-amor/4%20-%20Romance%20Ideal.mp3" },
    { nome: "Marina Lima", musica: "Virgem", estilo: "foco", url: "https://archive.org/download/04.-hearts_202504/06.%20Virgem.mp3" },
    { nome: "Marina Lima", musica: "Fullgás", estilo: "foco", url: "https://archive.org/download/09.-veneno-veleno_202404/01.%20Fullg%C3%A1s.mp3" }
];

// Captura o elemento de áudio definido no index.html
const audioPlayer = document.getElementById('mainAudioPlayer');

// Inicializa a renderização
function mpRender() {
    mpFilter('todos');
}

// Filtra e renderiza a lista no HTML
function mpFilter(estilo) {
    const listContainer = document.getElementById('mp-list');
    if (!listContainer) return;

    // Atualiza a aparência dos botões de filtro (abas)
    document.querySelectorAll('.mp-tab-btn').forEach(btn => {
        btn.classList.remove('active');
        // Compara o texto do botão com o estilo selecionado
        if (btn.innerText.toLowerCase() === estilo.toLowerCase()) {
            btn.classList.add('active');
        }
    });

    // Lógica de filtragem: 'todos' mostra tudo, caso contrário filtra por 'estilo'
    const filtradas = estilo === 'todos' 
        ? playlistData 
        : playlistData.filter(m => m.estilo.toLowerCase() === estilo.toLowerCase());

    // Renderiza a lista formatada para o menu lateral
    listContainer.innerHTML = filtradas.map(m => `
        <div class="mp-item" 
             onclick="mpPlay('${m.url}', '${m.musica}')" 
             style="cursor: pointer; padding: 12px 10px; border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.3s;">
            <div class="mp-item-title" style="color: #ffffff; font-weight: 600; font-size: 13px; margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${m.musica}
            </div>
            <div class="mp-item-artist" style="color: #FFD400; font-size: 11px; font-weight: 500; opacity: 0.9;">
                ${m.nome} • <span style="text-transform: uppercase; font-size: 9px; opacity: 0.6;">${m.estilo}</span>
            </div>
        </div>
    `).join('');
}

// Função para iniciar o play de uma música específica
function mpPlay(url, titulo) {
    if (!audioPlayer) return;
    
    // Atualiza a fonte e inicia a reprodução
    audioPlayer.src = url;
    audioPlayer.play().catch(e => console.error("Erro ao reproduzir áudio:", e));
    
    // Atualiza interface
    const displayNome = document.getElementById('mp-now-playing');
    const btnPlayPause = document.getElementById('mp-play-pause');
    
    if (displayNome) displayNome.innerText = "🎵 " + titulo;
    if (btnPlayPause) btnPlayPause.innerText = "⏸️";
}

// Alterna entre Play e Pause
function mpToggle() {
    if (!audioPlayer || !audioPlayer.src) return;

    const btnPlayPause = document.getElementById('mp-play-pause');
    
    if (audioPlayer.paused) {
        audioPlayer.play();
        if (btnPlayPause) btnPlayPause.innerText = "⏸️";
    } else {
        audioPlayer.pause();
        if (btnPlayPause) btnPlayPause.innerText = "▶️";
    }
}

// Para a música e reseta o player
function mpStop() {
    if (!audioPlayer) return;
    
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
    
    const btnPlayPause = document.getElementById('mp-play-pause');
    const displayNome = document.getElementById('mp-now-playing');
    
    if (btnPlayPause) btnPlayPause.innerText = "▶️";
    if (displayNome) displayNome.innerText = "Selecione uma música";
}

// Controle de volume (0.0 a 1.0)
function mpVolume(val) {
    if (audioPlayer) {
        audioPlayer.volume = val / 100;
    }
}

// Evento automático: quando a música acabar, reseta o botão
if (audioPlayer) {
    audioPlayer.onended = () => {
        const btnPlayPause = document.getElementById('mp-play-pause');
        if (btnPlayPause) btnPlayPause.innerText = "▶️";
    };
}