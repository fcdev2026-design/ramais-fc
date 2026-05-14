/* ==========================================================================
   5. NÚCLEO OPERACIONAL (MAIN) - VERSÃO LOCAL COM SENHA "APPADM"
   ========================================================================== */

let dadosRamais = []; 

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
    
    if (cache) { 
        dadosRamais = JSON.parse(cache); 
    } else if (window.LISTA_MESTRA) {
        dadosRamais = window.LISTA_MESTRA;
        localStorage.setItem('cache_fc_ramais', JSON.stringify(dadosRamais));
    }
    
    renderTable(); 
}

function renderTable(filtro = "") {
    const corpo = document.getElementById('corpoTabela');
    if (!corpo) return;

    const termo = filtro.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").trim();

    const filtrados = dadosRamais.filter(i => {
        const nome = (i.nome || "").toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
        const setor = (i.setor || "").toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
        const ramal = (i.ramal || "").toString();
        return nome.includes(termo) || setor.includes(termo) || ramal.includes(termo);
    });

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
                    <div style="font-weight:600; color:#1e293b;">${p.nome || 'Sem Nome'}</div>
                    <div style="font-size:11px;color:#64748b;">📍 ${p.setor || 'Geral'}</div>
                    <div style="margin-top:8px;display:flex;gap:15px;">
                        <span onclick="prepareEdit('${p.id}')" style="color:#2563eb; cursor:pointer; font-size:11px; font-weight:700;">EDITAR</span>
                        <span onclick="confirmDelete('${p.id}')" style="color:#ef4444; cursor:pointer; font-size:11px; font-weight:700;">EXCLUIR</span>
                    </div>
                </td>
                <td style="text-align:right; vertical-align:middle;">
                    <span class="ramal-badge">📞 ${p.ramal}</span>
                </td>
            </tr>`).join('');
        return header + itens;
    }).join('');
}

// --- OPERAÇÕES CRUD (COM VALIDAÇÃO DE SENHA "APPADM") ---

function saveData() {
    const id = document.getElementById('form-id').value;
    const nome = document.getElementById('form-nome').value.toUpperCase().trim();
    const setor = document.getElementById('form-setor').value.toUpperCase().trim();
    const ramal = document.getElementById('form-ramal').value.trim();

    if (!nome || !setor || !ramal) {
        alert("⚠️ Preencha todos os campos!");
        return;
    }

    if (id) {
        const index = dadosRamais.findIndex(r => r.id === id);
        if (index !== -1) dadosRamais[index] = { id, nome, setor, ramal };
    } else {
        const novo = { id: self.crypto.randomUUID(), nome, setor, ramal };
        dadosRamais.push(novo);
    }

    localStorage.setItem('cache_fc_ramais', JSON.stringify(dadosRamais));
    alert("✅ Dados salvos com sucesso!");
    renderTable();
    switchView('consulta');
}

function prepareAdd() {
    // Exigência da senha específica conforme solicitado
    const senha = prompt("🔒 Digite a senha administrativa para ADICIONAR:");
    
    if (senha === "APPADM") {
        document.getElementById('form-id').value = "";
        document.getElementById('form-nome').value = "";
        document.getElementById('form-setor').value = "";
        document.getElementById('form-ramal').value = "";
        document.getElementById('titulo-form').innerText = "➕ Novo Ramal";
        switchView('form');
    } else if (senha !== null) {
        alert("❌ Senha incorreta! Acesso negado.");
    }
}

function prepareEdit(id) {
    const senha = prompt("🔒 Digite a senha administrativa para EDITAR:");
    if (senha === "APPADM") {
        const item = dadosRamais.find(r => r.id == id);
        if (!item) return;
        document.getElementById('form-id').value = item.id;
        document.getElementById('form-nome').value = item.nome;
        document.getElementById('form-setor').value = item.setor;
        document.getElementById('form-ramal').value = item.ramal;
        document.getElementById('titulo-form').innerText = "📝 Editar Ramal";
        switchView('form', true); 
    } else if (senha !== null) alert("❌ Senha incorreta!");
}

function confirmDelete(id) {
    const senha = prompt("🔒 Digite a senha administrativa para EXCLUIR:");
    if (senha === "APPADM") {
        if(confirm("Deseja realmente excluir este ramal?")) {
            dadosRamais = dadosRamais.filter(r => r.id !== id);
            localStorage.setItem('cache_fc_ramais', JSON.stringify(dadosRamais));
            renderTable();
            alert("✅ Excluído!");
        }
    } else if (senha !== null) alert("❌ Senha incorreta!");
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

function toggleModal(show) {
    const m = document.getElementById('modalAcidente');
    if (m) m.style.display = show ? 'flex' : 'none';
}