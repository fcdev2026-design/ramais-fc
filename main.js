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
        setInterval(verificarProximoOnibus, 30000);
    }

    // 3. OUVINTE DA BUSCA (Para busca em tempo real)
    const campoBusca = document.getElementById('search');
    if (campoBusca) {
        campoBusca.addEventListener('input', (e) => {
            renderTable(e.target.value);
        });
    }

    // 4. Carrega os dados dos ramais
    fetchData();

    // Atualizações Automáticas (Clima a cada 15 min)
    setInterval(() => {
        if (typeof buscarClimaAPI === "function") buscarClimaAPI();
    }, 900000); 
});

// --- CONTROLE DE NAVEGAÇÃO E HORÁRIOS ---

function abrirHorarios() {
    // 1. Renderiza os dados da tabela de horários e alerta antes de mostrar a tela
    // Certifique-se que o script de horários está carregado no HTML
    if (typeof renderTabelaHorarios === "function") {
        renderTabelaHorarios();
    }
    if (typeof verificarProximoOnibus === "function") {
        verificarProximoOnibus();
    }
    
    // 2. Muda para a tela de horários
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
            const termoAtual = document.getElementById('search')?.value || "";
            renderTable(termoAtual);
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

function filtrar() {
    const termo = document.getElementById('search')?.value || "";
    renderTable(termo);
}

// --- OPERAÇÕES CRUD ---

async function saveData() {
    const id = document.getElementById('form-id').value;
    const nome = document.getElementById('form-nome').value.toUpperCase();
    const setor = document.getElementById('form-setor').value.toUpperCase();
    const ramal = document.getElementById('form-ramal').value;

    if (!nome || !setor || !ramal) {
        alert("⚠️ Preencha todos os campos obrigatórios!");
        return;
    }

    const payload = { nome, setor, ramal };

    try {
        let res;
        if (id) {
            res = await _supabase.from('ramais').update(payload).eq('id', id);
        } else {
            res = await _supabase.from('ramais').insert([payload]);
        }

        if (res.error) throw res.error;

        alert("✅ Salvo com sucesso!");
        document.getElementById('form-id').value = "";
        await fetchData(); 
        switchView('consulta'); 

    } catch (err) {
        console.error("Erro:", err);
        alert("❌ Erro ao salvar dados.");
    }
}

function prepareAdd() {
    const senha = prompt("🔒 Senha administrativa para ADICIONAR:");
    if (senha === SENHA_ADM_APP) {
        document.getElementById('form-id').value = "";
        document.getElementById('form-nome').value = "";
        document.getElementById('form-setor').value = "";
        document.getElementById('form-ramal').value = "";
        document.getElementById('titulo-form').innerText = "➕ Novo Ramal";
        switchView('form'); 
    } else if (senha !== null) alert("❌ Senha incorreta!");
}

function prepareEdit(id) {
    const senha = prompt("🔒 Senha administrativa para EDITAR:");
    if (senha === SENHA_ADM_APP) {
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

async function confirmDelete(id) {
    const senha = prompt("🔒 Senha administrativa para EXCLUIR:");
    if (senha === SENHA_ADM_APP) {
        if(confirm("Deseja realmente excluir este ramal?")) {
            const { error } = await _supabase.from('ramais').delete().eq('id', id);
            if (!error) {
                alert("✅ Excluído!");
                fetchData();
            }
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