/* ==========================================================================
   4. MÓDULO: ÔNIBUS TRANSLADO (GRADE E ALERTAS) - AJUSTADO
   ========================================================================== */

const gradeHorariosOnibus = [
    // Horários do Estacionamento (Manhã)
    { h: "07:20", orig: "ESTAC." }, { h: "07:35", orig: "ESTAC." }, { h: "07:50", orig: "ESTAC." },
    { h: "08:05", orig: "ESTAC." }, { h: "08:20", orig: "ESTAC." }, { h: "08:35", orig: "ESTAC." },
    { h: "08:50", orig: "ESTAC." }, { h: "09:05", orig: "ESTAC." }, { h: "09:20", orig: "ESTAC." },
    { h: "09:35", orig: "ESTAC." }, { h: "09:50", orig: "ESTAC." }, { h: "10:05", orig: "ESTAC." },
    { h: "10:20", orig: "ESTAC." }, { h: "10:35", orig: "ESTAC." }, { h: "10:50", orig: "ESTAC." },
    { h: "11:05", orig: "ESTAC." }, { h: "11:20", orig: "ESTAC." }, { h: "11:35", orig: "ESTAC." },
    { h: "12:05", orig: "ESTAC." }, { h: "12:20", orig: "ESTAC." }, { h: "12:35", orig: "ESTAC." },
    { h: "12:50", orig: "ESTAC." }, { h: "13:05", orig: "ESTAC." },

    // Horários da Loja (Tarde/Noite)
    { h: "14:10", orig: "LOJA" }, { h: "14:30", orig: "LOJA" }, { h: "14:50", orig: "LOJA" },
    { h: "15:10", orig: "LOJA" }, { h: "15:30", orig: "LOJA" }, { h: "15:50", orig: "LOJA" },
    { h: "16:10", orig: "LOJA" }, { h: "16:30", orig: "LOJA" }, { h: "16:50", orig: "LOJA" },
    { h: "17:10", orig: "LOJA" }, { h: "17:30", orig: "LOJA" }, { h: "17:50", orig: "LOJA" },
    { h: "18:10", orig: "LOJA" }, { h: "18:30", orig: "LOJA" }, { h: "18:50", orig: "LOJA" },
    { h: "19:10", orig: "LOJA" }, { h: "19:30", orig: "LOJA" }, { h: "19:50", orig: "LOJA" },
    { h: "21:10", orig: "LOJA" }, { h: "21:30", orig: "LOJA" }, { h: "21:50", orig: "LOJA" },
    { h: "22:10", orig: "LOJA" }, { h: "22:25", orig: "LOJA" }
];

// --- FUNÇÃO 1: DESENHA A TABELA FIXA NA TELA ---
function renderTabelaHorarios() {
    const corpoBus = document.getElementById('corpoBus');
    if (!corpoBus) return;

    const horariosEstac = gradeHorariosOnibus.filter(item => item.orig === "ESTAC.");
    const horariosLoja = gradeHorariosOnibus.filter(item => item.orig === "LOJA");

    const totalLinhas = Math.max(horariosEstac.length, horariosLoja.length);
    let html = "";

    for (let i = 0; i < totalLinhas; i++) {
        // Marcadores de Intervalo baseados na posição da lista
        if (i === 18) { 
            html += `<tr class="interval-row"><td colspan="2" style="text-align:center; background:#e0f2fe; color:#0369a1; font-weight:700; padding:10px;">⏸️ INTERVALO ALMOÇO: 13:00 às 14:00 (Retorno na Loja às 14:10)</td></tr>`;
        }
        if (i === 23) {
            html += `<tr class="interval-row"><td colspan="2" style="text-align:center; background:#fef3c7; color:#92400e; font-weight:700; padding:10px;">⏸️ INTERVALO JANTA: 20:00 às 21:00 (Retorno na Loja às 21:10)</td></tr>`;
        }

        const hEstac = horariosEstac[i] ? horariosEstac[i].h : "--:--";
        const hLoja = horariosLoja[i] ? horariosLoja[i].h : "--:--";

        html += `
            <tr>
                <td><span style="color:#003399; font-weight:700;">ESTAC. ➔ LOJA:</span> ${hEstac}</td>
                <td><span style="color:#003399; font-weight:700;">LOJA ➔ ESTAC.:</span> ${hLoja}</td>
            </tr>
        `;
    }
    corpoBus.innerHTML = html;
}

// --- FUNÇÃO 2: CONTROLA O BANNER DE ALERTA (MARQUEE) ---
function verificarProximoOnibus() {
    const alerta = document.getElementById('alerta-onibus');
    const texto = document.getElementById('texto-alerta');
    if (!alerta || !texto) return;

    const agora = new Date();
    const hora = agora.getHours();
    const minutos = agora.getMinutes();
    const horaAtualMinutos = (hora * 60) + minutos;

    // Garante que o alerta esteja visível
    alerta.style.display = 'flex';

    // 1. VERIFICAÇÃO DE INTERVALOS
    const intervaloAlmoco = (hora >= 13 && hora < 14);
    const intervaloJanta = (hora >= 20 && hora < 21);

    if (intervaloAlmoco || intervaloJanta) {
        alerta.style.backgroundColor = '#FFD400'; 
        alerta.style.color = '#003399';
        texto.innerHTML = `⏸️ <b>MODO INTERVALO:</b> MOTORISTAS EM DESCANSO. PRÓXIMA VIAGEM ÀS ${intervaloAlmoco ? '14:10' : '21:10'}.`;
        return; 
    }

    // 2. BUSCA O PRÓXIMO ÔNIBUS NA GRADE
    const proximo = gradeHorariosOnibus.find(item => {
        const [h, m] = item.h.split(':').map(Number);
        return (h * 60 + m) > horaAtualMinutos;
    });

    if (proximo) {
        const [hProx, mProx] = proximo.h.split(':').map(Number);
        const horaProxMinutos = (hProx * 60) + mProx;
        const faltam = horaProxMinutos - horaAtualMinutos;

        if (faltam <= 5 && faltam > 0) {
            let trajeto = proximo.orig === "ESTAC." ? "ESTACIONAMENTO ➔ LOJA" : "LOJA ➔ ESTACIONAMENTO";
            alerta.style.backgroundColor = '#34d82e'; 
            alerta.style.color = '#000000';
            texto.innerHTML = `🚌 <b>SAÍDA EM ${faltam} MINUTOS:</b> ÔNIBUS DAS ${proximo.h} (${trajeto}) ⚠️ `;
        } else {
            alerta.style.backgroundColor = 'white'; 
            alerta.style.color = '#000000';
            texto.innerHTML = `🚌 📢 <b>TRANSLADO FC:</b> HORÁRIOS ATUALIZADOS COM SAÍDAS DO ESTACIONAMENTO E DA LOJA. CONFIRA A GRADE NO MENU LATERAL!`;
        }
    } else {
        alerta.style.backgroundColor = '#334155'; 
        alerta.style.color = '#ffffff';
        texto.innerHTML = `🏁 <b>ENCERRADO:</b> O TRANSLADO FINALIZOU AS VIAGENS DE HOJE. RETORNO AMANHÃ ÀS 07:20.`;
    }
}

/* ==========================================================================
   INICIALIZAÇÃO AUTOMÁTICA
   ========================================================================== */

// 1. Executa assim que o script carregar para mostrar o banner imediatamente
verificarProximoOnibus();

// 2. Cria um loop para atualizar o banner a cada 30 segundos sozinho
setInterval(() => {
    verificarProximoOnibus();
}, 30000);
