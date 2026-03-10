/* =============================================================
   LOGICA PARA REMOVER O "CARREGANDO..." E EXIBIR OS DADOS
   ============================================================= */

function initSmartCalendar() {
    const agora = new Date();
    const diaAtual = agora.getDate();
    const mesAtual = agora.getMonth();
    const anoAtual = agora.getFullYear();

    const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

    // 1. Atualiza o Cabeçalho (Mês e Ano)
    const header = document.getElementById('calendar-month-year');
    if (header) header.innerText = `${meses[mesAtual]} ${anoAtual}`;

    // 2. Gera os Dias do Calendário
    const containerDias = document.getElementById('calendar-days-container');
    if (containerDias) {
        containerDias.innerHTML = "";
        const ultimoDia = new Date(anoAtual, mesAtual + 1, 0).getDate();
        
        for (let i = 1; i <= ultimoDia; i++) {
            const span = document.createElement('span');
            span.innerText = i;
            if (i === diaAtual) span.classList.add('today');
            containerDias.appendChild(span);
        }
    }

    // 3. Lista de Feriados (Atualizada)
    const feriados = [
        { d: "01/01", n: "Confraternização" },
        { d: "06/03", n: "Data Magna (PE)" }, 
        { d: "21/04", n: "Tiradentes" },
        { d: "01/05", n: "Dia do Trabalho" },
        { d: "07/09", n: "Independência" },
        { d: "12/10", n: "Nossa Sra. Aparecida" },
        { d: "02/11", n: "Finados" },
        { d: "15/11", n: "Proclamação República" },
        { d: "20/11", n: "Zumbi dos Palmares" },
        { d: "25/12", n: "Natal" }
    ];

    const listaFeriados = document.getElementById('holidays-list');
    if (listaFeriados) {
        listaFeriados.innerHTML = feriados.map(f => `
            <li><span class="holiday-date">${f.d}</span> <span>${f.n}</span></li>
        `).join('');
    }

    // 4. Inicia o Timer do Regressímetro (Atualizado com Segundos)
    const atualizarTimer = () => {
        const agora = new Date();
        const alvo = new Date(`January 1, ${anoAtual + 1} 00:00:00`);
        const diff = alvo - agora;

        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff / (1000 * 60 * 60)) % 24).toString().padStart(2, '0');
        const m = Math.floor((diff / 1000 / 60) % 60).toString().padStart(2, '0');
        const s = Math.floor((diff / 1000) % 60).toString().padStart(2, '0');

        const timer = document.getElementById('countdown-timer');
        if (timer) timer.innerText = `${d}d ${h}h ${m}m ${s}s`;
    };

    atualizarTimer();
    setInterval(atualizarTimer, 1000); // Atualiza a cada 1 segundo (estilo cronômetro)
}

// EXECUÇÃO IMEDIATA
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSmartCalendar);
} else {
    initSmartCalendar();
}