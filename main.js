/* ==========================================================================
   5. NÚCLEO OPERACIONAL (MAIN) - VERSÃO PROTEGIDA COM SIDEBAR
   ========================================================================== */

let dadosRamais = []; 

// --- FUNÇÕES DE TRADUÇÃO (BASE64) ---
const codificar = (str) => btoa(unescape(encodeURIComponent(str)));

const decodificar = (str) => {
    if (!str) return "";
    try {
        return decodeURIComponent(escape(atob(str)));
    } catch (e) {
        return str; 
    }
};

// --- SENHAS PROTEGIDAS (Disfarçadas no código) ---
const S1 = "QVBQQURN"; 
const S2 = "RkMyMDI2"; 

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

    fetchData();

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

// --- GERENCIAMENTO DE DADOS ---

function fetchData() {
    const cache = localStorage.getItem('cache_fc_ramais');
    
    // Se o cache existir e NÃO for uma array vazia "[]"
    if (cache && cache !== "[]") { 
        dadosRamais = JSON.parse(cache); 
    } else if (window.LISTA_MESTRA && window.LISTA_MESTRA.length > 0) {
        // SE ALGUÉM APAGOU: O sistema pega a lista original do config.js e injeta de volta!
        dadosRamais = [...window.LISTA_MESTRA];
        localStorage.setItem('cache_fc_ramais', JSON.stringify(dadosRamais));
        console.warn("⚠️ LocalStorage estava vazio! Dados do config.js injetados automaticamente.");
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
        const ramal = decodificar(i.ramal || "").toString();
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
        ramal: codificar(ramal.trim())
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
    // Se a chave dos ramais foi apagada ou modificada externamente
    if (e.key === 'cache_fc_ramais' && (!e.newValue || e.newValue === "[]")) {
        if (window.LISTA_MESTRA && window.LISTA_MESTRA.length > 0) {
            dadosRamais = [...window.LISTA_MESTRA];
            localStorage.setItem('cache_fc_ramais', JSON.stringify(dadosRamais));
            renderTable();
            console.error("🚨 Detetada tentativa de apagar os dados! Sistema restaurado com config.js.");
        }
    }
});