/* ==========================================================================
   5. NÚCLEO OPERACIONAL (MAIN) - VERSÃO PROTEGIDA COM SIDEBAR E ANTI-CACHE
   ========================================================================== */

let dadosRamais = []; 

// --- FUNÇÕES DE TRADUÇÃO (BASE64) ---
const codificar = (str) => {
    if (str === null || str === undefined) return "";
    return btoa(unescape(encodeURIComponent(String(str))));
};

const decodificar = (str) => {
    if (!str) return "";
    try {
        return decodeURIComponent(escape(atob(String(str))));
    } catch (e) {
        return String(str); 
    }
};

// --- SENHAS PROTEGIDAS (Disfarçadas no código) ---
const S1 = "QVBQQURN"; 
const S2 = "RkMyMDI2"; 

// --- GERENCIADOR ANTI-CACHE AUTOMÁTICO ---
function carregarConfigSemCache() {
    const script = document.createElement('script');
    // Injeta o timestamp (?t=...) para forçar o navegador a buscar o config.js atualizado do servidor
    script.src = 'config.js?t=' + Date.now();
    
    // Quando o arquivo terminar de carregar e registrar a LISTA_MESTRA, o sistema processa os dados
    script.onload = () => {
        console.log("✅ 'config.js' carregado com sucesso via barreira anti-cache.");
        fetchData();
    };

    script.onerror = () => {
        console.error("❌ Erro crítico: Não foi possível carregar o arquivo 'config.js'.");
        fetchData(); // Tenta carregar o cache local mesmo se falhar
    };

    document.head.appendChild(script);
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 Sistema Operacional Local Iniciado...");
    
    if (typeof buscarClimaAPI === "function") buscarClimaAPI();
    if (typeof initSmartCalendar === "function") initSmartCalendar();
    if (typeof mpRender === "function") mpRender();
    
    if (typeof verificarProximoOnibus === "function") {
        verificarProximoOnibus();
        setInterval(verificarProximoOnibus, 30000);
    }

    const campoBusca = document.getElementById('search');
    if (campoBusca) {
        campoBusca.addEventListener('input', (e) => {
            renderTable(e.target.value);
        });
    }

    // Inicia a chamada dinâmica do banco de dados local
    carregarConfigSemCache();

    setInterval(() => {
        if (typeof buscarClimaAPI === "function") buscarClimaAPI();
    }, 900000); 
});

// --- CONTROLE DE NAVEGAÇÃO ---

function abrirHorarios() {
    if (typeof renderTabelaHorarios === "function") renderTabelaHorarios();
    if (typeof verificarProximoOnibus === "function") verificarProximoOnibus();
    switchView('horarios');
}

function switchView(view, skipMenu = false) {
    const sections = document.querySelectorAll('.view-section');
    sections.forEach(v => {
        v.classList.remove('active');
        v.style.display = 'none'; 
    });

    const target = document.getElementById('view-' + view);
    if (target) {
        target.classList.add('active');
        target.style.display = 'block'; 
        window.scrollTo(0, 0);
    }

    if (!skipMenu) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar && sidebar.classList.contains('active')) {
            toggleMenu();
        }
    }
}

// --- GERENCIAMENTO DE DADOS BLINDADO ---

function fetchData() {
    // Busca a versão dinâmica se existir no config.js, caso contrário adota a padrão "1.1"
    const VERSAO_SISTEMA = window.VERSAO_ATUAL_LISTA || "1.1"; 

    const cache = localStorage.getItem('cache_fc_ramais');
    const versaoSalva = localStorage.getItem('versao_ramais');
    
    // Se a versão mudou, se o cache não existe ou está corrompido como vazio
    if (versaoSalva !== VERSAO_SISTEMA || !cache || cache === "[]") { 
        console.warn("🚨 Nova versão ou inconsistência detectada! Forçando sincronização...");
        
        // Limpa o registro desatualizado do LocalStorage
        localStorage.removeItem('cache_fc_ramais');
        
        if (window.LISTA_MESTRA && window.LISTA_MESTRA.length > 0) {
            // Injeta a lista fresca que veio do config.js
            dadosRamais = [...window.LISTA_MESTRA];
            localStorage.setItem('cache_fc_ramais', JSON.stringify(dadosRamais));
            localStorage.setItem('versao_ramais', VERSAO_SISTEMA);
            console.log(`✅ Sincronização concluída: Versão ${VERSAO_SISTEMA} ativada.`);
        } else {
            console.error("❌ Erro: A lista mestra do config.js não pôde ser lida no escopo global.");
            dadosRamais = [];
        }
    } else {
        // Se já está na versão certa, consome direto do armazenamento local do usuário
        dadosRamais = JSON.parse(cache); 
    }
    
    renderTable(); 
}

function renderTable(filtro = "") {
    const corpo = document.getElementById('corpoTabela');
    if (!corpo) return;

    // ATUALIZA O CONTADOR NA TELA COM O TOTAL DO ARRAY
    const contador = document.getElementById('contador-ramais');
    if (contador) {
        contador.innerText = dadosRamais.length;
    }

    const termo = filtro.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").trim();

    const filtrados = dadosRamais.filter(i => {
        const nome = decodificar(i.nome || "").toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
        const setor = decodificar(i.setor || "").toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
        const ramal = decodificar(i.ramal || "").toLowerCase().trim();
        return nome.includes(termo) || setor.includes(termo) || ramal.includes(termo);
    });

    const grupos = filtrados.reduce((acc, item) => {
        const s = decodificar(item.setor) || "OUTROS";
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
                    <div style="font-weight:600; color:#1e293b;">${decodificar(p.nome)}</div>
                    <div style="font-size:11px;color:#64748b;">📍 ${decodificar(p.setor)}</div>
                    <div style="margin-top:8px;display:flex;gap:15px;">
                        <span onclick="prepareEdit('${p.id}')" style="color:#2563eb; cursor:pointer; font-size:11px; font-weight:700;">EDITAR</span>
                        <span onclick="confirmDelete('${p.id}')" style="color:#ef4444; cursor:pointer; font-size:11px; font-weight:700;">EXCLUIR</span>
                    </div>
                </td>
                <td style="text-align:right; vertical-align:middle;">
                    <span class="ramal-badge">📞 ${decodificar(p.ramal)}</span>
                </td>
            </tr>`).join('');
        return header + itens;
    }).join('');
}

// --- OPERAÇÕES CRUD (COM PRIVACIDADE E SENHA OCULTA) ---

function checkAuth() {
    const senha = prompt("🔒 Digite a senha administrativa:");
    if (senha === null) return false;
    
    const sC = codificar(senha);
    if (sC === S1 || sC === S2) {
        return true;
    } else {
        alert("❌ Senha incorreta!");
        return false;
    }
}

function saveData() {
    const id = document.getElementById('form-id').value;
    const n = document.getElementById('form-nome').value.toUpperCase().trim();
    const s = document.getElementById('form-setor').value.toUpperCase().trim();
    const r = document.getElementById('form-ramal').value.trim();

    if (!n || !s || !r) {
        alert("⚠️ Preencha todos os campos!");
        return;
    }

    const novoDado = { 
        id: id || self.crypto.randomUUID(), 
        nome: codificar(n), 
        setor: codificar(s), 
        ramal: codificar(r) 
    };

    const index = dadosRamais.findIndex(x => x.id === id);
    if (index !== -1) {
        dadosRamais[index] = novoDado;
    } else {
        dadosRamais.push(novoDado);
    }

    localStorage.setItem('cache_fc_ramais', JSON.stringify(dadosRamais));
    alert("✅ Dados salvos com sucesso!");
    
    // Limpa o formulário após salvar
    document.getElementById('form-id').value = "";
    document.getElementById('form-nome').value = "";
    document.getElementById('form-setor').value = "";
    document.getElementById('form-ramal').value = "";

    renderTable();
    switchView('consulta');
}

function prepareAdd() {
    if (checkAuth()) {
        document.getElementById('form-id').value = "";
        document.getElementById('form-nome').value = "";
        document.getElementById('form-setor').value = "";
        document.getElementById('form-ramal').value = "";
        const t = document.getElementById('titulo-form');
        if(t) t.innerText = "➕ Novo Ramal";
        switchView('form');
    }
}

function prepareEdit(id) {
    if (checkAuth()) {
        const item = dadosRamais.find(r => r.id == id);
        if (!item) return;
        document.getElementById('form-id').value = item.id;
        document.getElementById('form-nome').value = decodificar(item.nome);
        document.getElementById('form-setor').value = decodificar(item.setor);
        document.getElementById('form-ramal').value = decodificar(item.ramal);
        const t = document.getElementById('titulo-form');
        if(t) t.innerText = "📝 Editar Ramal";
        switchView('form', true); 
    }
}

function confirmDelete(id) {
    if (checkAuth()) {
        if(confirm("Deseja realmente excluir este ramal?")) {
            dadosRamais = dadosRamais.filter(r => r.id !== id);
            localStorage.setItem('cache_fc_ramais', JSON.stringify(dadosRamais));
            renderTable();
            alert("✅ Excluído!");
        }
    }
}

// --- FUNÇÃO GLOBAL PARA CADASTRO VIA CONSOLE/SCRIPT EXTERNO ---
window.cadastrarNovoRamal = function(setor, nome, ramal) {
    if (!setor || !nome || !ramal) {
        console.error("⚠️ Erro: Preencha todos os parâmetros (setor, nome, ramal)");
        return null;
    }

    const novoDado = {
        id: self.crypto.randomUUID(),
        nome: codificar(nome.toUpperCase().trim()),
        setor: codificar(setor.toUpperCase().trim()),
        ramal: codificar(String(ramal).trim())
    };

    dadosRamais.push(novoDado);
    localStorage.setItem('cache_fc_ramais', JSON.stringify(dadosRamais));
    renderTable();

    console.log(`✅ ${nome} cadastrado com sucesso no Array e LocalStorage!`);
    return novoDado;
};

// --- UTILITÁRIOS ---

function toggleMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    if (sidebar && overlay) {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    }
}

function toggleModal(show) {
    const m = document.getElementById('modalAcidente');
    if (m) m.style.display = show ? 'flex' : 'none';
}

// --- PROTEÇÃO CONTRA LIMPEZA DO LOCALSTORAGE ---
window.addEventListener('storage', (e) => {
    if (e.key === 'cache_fc_ramais' && (!e.newValue || e.newValue === "[]")) {
        if (window.LISTA_MESTRA && window.LISTA_MESTRA.length > 0) {
            dadosRamais = [...window.LISTA_MESTRA];
            localStorage.setItem('cache_fc_ramais', JSON.stringify(dadosRamais));
            renderTable();
            console.error("🚨 Detetada tentativa de apagar os dados! Sistema restaurado com config.js.");
        }
    }
});