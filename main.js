/* ==========================================================================
   5. NÚCLEO OPERACIONAL (MAIN) - REVISADO E AJUSTADO
   ========================================================================== */



document.addEventListener('DOMContentLoaded', () => {
    console.log("Sistema Iniciado...");
    // 1. Inicializa módulos visuais
    if (typeof buscarClimaAPI === "function") buscarClimaAPI();
    if (typeof initSmartCalendar === "function") initSmartCalendar();
    if (typeof mpRender === "function") mpRender();
    
    // 2. Inicializa o alerta de ônibus IMEDIATAMENTE
    if (typeof verificarProximoOnibus === "function") {
        verificarProximoOnibus();
        // Mantém o alerta atualizando a cada 30s
        setInterval(verificarProximoOnibus, 30000);
    }

    // 3. Carrega os dados dos ramais
    fetchData();

    // Atualizações Automáticas (Clima a cada 15 min)
    setInterval(() => {
        if (typeof buscarClimaAPI === "function") buscarClimaAPI();
    }, 900000); 
});

// --- CONTROLE DE NAVEGAÇÃO E EXIBIÇÃO ---

function abrirHorarios() {
    // 1. Renderiza os dados da tabela e alerta antes de mostrar a tela
    if (typeof renderTabelaHorarios === "function") renderTabelaHorarios();
    if (typeof verificarProximoOnibus === "function") verificarProximoOnibus();
    
    // 2. Muda para a tela de horários (o switchView já fecha o menu)
    switchView('horarios');
}

function switchView(view, skipMenu = false) {
    // 1. Esconde todas as seções
    const sections = document.querySelectorAll('.view-section');
    sections.forEach(v => {
        v.classList.remove('active');
        v.style.display = 'none'; 
    });

    // 2. Mostra a seção alvo
    const target = document.getElementById('view-' + view);
    if (target) {
        target.classList.add('active');
        target.style.display = 'block'; 
        window.scrollTo(0, 0);
    }

    // 3. Fecha o menu lateral e o overlay automaticamente
    if (!skipMenu) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar && sidebar.classList.contains('active')) {
            toggleMenu(); // Esta função já cuida do sidebar e do overlay
        }
    }
}

// --- BUSCA E RENDERIZAÇÃO DE RAMAIS ---

async function fetchData() {
    // Tenta carregar do cache primeiro para dar velocidade
    const cache = localStorage.getItem('cache_fc_ramais');
    if (cache) { 
        dadosRamais = JSON.parse(cache); 
        renderTable(); 
    }
    
    try {
        // Busca dados frescos do Supabase
        const { data, error } = await _supabase
            .from('ramais')
            .select('*')
            .order('setor', { ascending: true });

        if (!error && data) {
            dadosRamais = data;
            localStorage.setItem('cache_fc_ramais', JSON.stringify(data));
            renderTable(document.getElementById('search')?.value || "");
        }
    } catch (e) { 
        console.error("Erro Supabase:", e); 
    }
}

function renderTable(filtro = "") {
    const corpo = document.getElementById('corpoTabela');
    if (!corpo) return;

    const termo = filtro.toLowerCase().trim();
    const filtrados = dadosRamais.filter(i => {
        const nome = (i.nome || "").toLowerCase();
        const setor = (i.setor || "").toLowerCase();
        const ramal = (i.ramal || "").toString();
        return nome.includes(termo) || setor.includes(termo) || ramal.includes(termo);
    });

    // Agrupamento por setor
    const grupos = filtrados.reduce((acc, item) => {
        const s = item.setor || "OUTROS";
        if (!acc[s]) acc[s] = [];
        acc[s].push(item);
        return acc;
    }, {});

    const setoresOrdenados = Object.keys(grupos).sort();

    if (setoresOrdenados.length === 0) {
        corpo.innerHTML = `<tr><td colspan="2" style="text-align:center; padding: 30px; color: #64748b;">Nenhum ramal encontrado.</td></tr>`;
        return;
    }

    corpo.innerHTML = setoresOrdenados.map(setor => {
        const header = `<tr class="row-setor"><td colspan="2">📂 ${setor}</td></tr>`;
        const itens = grupos[setor].map(p => `
            <tr class="item-row">
                <td>
                    <div style="font-weight:600;">${p.nome || 'Sem Nome'}</div>
                    <div style="font-size:11px;color:#64748b;">📍 ${p.setor || 'Geral'}</div>
                    <div style="margin-top:8px;display:flex;gap:15px;">
                        <span onclick="prepareEdit('${p.id}')" style="color:#2563eb; cursor:pointer; font-size:12px; font-weight:700;">Editar</span>
                        <span onclick="confirmDelete('${p.id}')" style="color:#ef4444; cursor:pointer; font-size:12px; font-weight:700;">Excluir</span>
                    </div>
                </td>
                <td style="text-align:right;"><span class="ramal-badge">📞 ${p.ramal}</span></td>
            </tr>`).join('');
        return header + itens;
    }).join('');
}

// --- OPERAÇÕES (CRUD) COM SENHA ---

function prepareAdd() {
    const senha = prompt("🔒 Digite a senha administrativa para ADICIONAR:");
    if (senha === SENHA_ADM_APP) {
        document.getElementById('form-id').value = "";
        document.getElementById('form-nome').value = "";
        document.getElementById('form-setor').value = "";
        document.getElementById('form-ramal').value = "";
        document.getElementById('titulo-form').innerText = "➕ Novo Ramal";
        switchView('form'); 
    } else if (senha !== null) { 
        alert("❌ Senha incorreta!"); 
    }
}

function prepareEdit(id) {
    const senha = prompt("🔒 Digite a senha administrativa para EDITAR:");
    if (senha === SENHA_ADM_APP) {
        const item = dadosRamais.find(r => r.id == id);
        if (!item) return;
        
        document.getElementById('form-id').value = item.id;
        document.getElementById('form-nome').value = item.nome;
        document.getElementById('form-setor').value = item.setor;
        document.getElementById('form-ramal').value = item.ramal;
        document.getElementById('titulo-form').innerText = "📝 Editar Ramal";
        
        switchView('form', true); 
    } else if (senha !== null) { 
        alert("❌ Senha incorreta!"); 
    }
}

// --- UTILITÁRIOS ---

function toggleMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    if (sidebar && overlay) {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    }
}

function filtrar() { renderTable(document.getElementById('search')?.value || ""); }

function toggleModal(show) {
    const m = document.getElementById('modalAcidente');
    if (m) m.style.display = show ? 'flex' : 'none';
}