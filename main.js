/* ==========================================================================
   5. NÚCLEO OPERACIONAL (MAIN) - AJUSTADO (FECHAMENTO DE MENU)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    console.log("Sistema Iniciado...");

    // Inicialização de módulos externos
    if (typeof renderTabelaHorarios === "function") renderTabelaHorarios();
    if (typeof verificarProximoOnibus === "function") verificarProximoOnibus();
    if (typeof initSmartCalendar === "function") initSmartCalendar();
    if (typeof mpRender === "function") mpRender();
    if (typeof buscarClimaAPI === "function") buscarClimaAPI();

    fetchData();

    // Atualizações em Tempo Real
    setInterval(() => {
        if (typeof verificarProximoOnibus === "function") verificarProximoOnibus(); 
    }, 30000); 

    setInterval(() => {
        if (typeof buscarClimaAPI === "function") buscarClimaAPI();
    }, 900000); 
});

// --- BUSCA E RENDERIZAÇÃO DE RAMAIS ---
async function fetchData() {
    const cache = localStorage.getItem('cache_fc_ramais');
    if (cache) { 
        dadosRamais = JSON.parse(cache); 
        renderTable(); 
    }
    
    try {
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

// --- OPERAÇÕES (CRUD) ---

function prepareAdd() {
    const senha = prompt("🔒 Digite a senha administrativa para ADICIONAR:");
    if (senha === SENHA_ADM_APP) {
        // Reset dos campos
        document.getElementById('form-id').value = "";
        document.getElementById('form-nome').value = "";
        document.getElementById('form-setor').value = "";
        document.getElementById('form-ramal').value = "";
        
        document.getElementById('titulo-form').innerText = "➕ Novo Ramal";
        
        // Ativa a visão do formulário e FECHA o menu
        switchView('form', false); 
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
        
        // Ativa a visão do formulário. 
        // Aqui skipMenu é true porque o botão de editar está na tabela, não no menu.
        switchView('form', true); 
    } else if (senha !== null) { 
        alert("❌ Senha incorreta!"); 
    }
}

async function saveData() {
    const id = document.getElementById('form-id').value;
    const nome = document.getElementById('form-nome').value;
    const setor = document.getElementById('form-setor').value;
    const ramal = document.getElementById('form-ramal').value;

    if (!nome || !setor || !ramal) {
        alert("⚠️ Preencha Nome, Setor e Ramal!");
        return;
    }

    const payload = { 
        nome: nome.toUpperCase(), 
        setor: setor.toUpperCase(), 
        ramal: ramal
    };

    try {
        let res;
        if (id) {
            res = await _supabase.from('ramais').update(payload).eq('id', id);
        } else {
            res = await _supabase.from('ramais').insert([payload]);
        }

        if (res.error) throw res.error;
        
        alert("✅ Ramal salvo com sucesso!");
        fetchData();
        switchView('consulta', true);
    } catch (err) { 
        console.error("Erro ao salvar:", err);
        alert("❌ Erro ao salvar dados no banco."); 
    }
}

async function confirmDelete(id) {
    const senha = prompt("⚠️ Senha ADM para EXCLUIR:");
    if (senha === SENHA_ADM_APP) {
        if (confirm("Apagar este ramal permanentemente?")) {
            const { error } = await _supabase.from('ramais').delete().eq('id', id);
            if (!error) { 
                alert("🗑️ Ramal excluído!"); 
                fetchData(); 
            } else {
                alert("❌ Erro ao excluir.");
            }
        }
    } else if (senha !== null) { alert("❌ Senha incorreta!"); }
}

// --- NAVEGAÇÃO ---
function toggleMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    
    if (sidebar && overlay) {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    }
}

function switchView(view, skipMenu = false) {
    // 1. Esconde todas as seções
    const sections = document.querySelectorAll('.view-section');
    sections.forEach(v => {
        v.classList.remove('active');
        v.style.display = 'none'; // Reforço visual
    });

    // 2. Mostra a seção alvo
    const target = document.getElementById('view-' + view);
    if (target) {
        target.classList.add('active');
        target.style.display = 'block'; // Reforço visual
        window.scrollTo(0, 0);
    }

    // 3. Lógica do Menu: Se skipMenu for false, ele fecha o menu se estiver aberto
    if (!skipMenu) {
        const isMenuOpen = document.getElementById('sidebar')?.classList.contains('active');
        if (isMenuOpen) toggleMenu();
    }
}

function filtrar() { renderTable(document.getElementById('search')?.value || ""); }

function toggleModal(show) {
    const m = document.getElementById('modalAcidente');
    if (m) m.style.display = show ? 'flex' : 'none';
}