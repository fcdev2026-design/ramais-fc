// CONFIGURAÇÃO SUPABASE
const SUPABASE_URL = 'https://qezbrxgmwjhsezaqowcj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_xjcAgPhqKHoVvOZaXn_mEA_2bLG3Kl4';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Senhas Ofuscadas (APPADM e FC2026)
const _0xaf2 = ['\x41\x50\x50\x41\x44\x4d', '\x46\x43\x32\x30\x32\x36', '\x66\x63\x5f\x61\x75\x74\x6f\x72\x69\x7a\x61\x64\x6f'];
const SENHA_MESTRA = _0xaf2[0]; // APPADM
const SENHA_ACESSO_SITE = _0xaf2[1]; // FC2026

let dadosRamais = [];
const camposIds = ['n-nome', 'n-setor', 'n-ramal', 'n-contato'];

// 1. TRAVA DE SEGURANÇA PARA ACESSO AO SITE
(function validarAcesso() {
    if (localStorage.getItem(_0xaf2[2]) !== "true") {
        const senha = prompt("Acesso Restrito Ferreira Costa. Digite a senha da unidade:");
        if (senha === SENHA_ACESSO_SITE) {
            localStorage.setItem(_0xaf2[2], "true");
        } else {
            alert("Senha incorreta!");
            document.body.innerHTML = `<div style="display:flex; justify-content:center; align-items:center; height:100vh; font-family:sans-serif; color:#666; text-align:center;">
                <div><h1>🚫 Acesso Negado</h1><p>Este sistema é de uso interno exclusivo.</p></div>
            </div>`;
            throw new Error("Acesso negado");
        }
    }
})();

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    fetchData();
    setupValidations();
});

// Busca dados do Supabase
async function fetchData() {
    const { data, error } = await _supabase
        .from('ramais')
        .select('*')
        .order('setor', { ascending: true });

    if (error) {
        console.error('Erro ao buscar dados:', error);
    } else {
        dadosRamais = data;
        renderTable(document.getElementById('search').value);
    }
}

function setupValidations() {
    camposIds.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', function() {
                if (this.value.trim() !== "") {
                    this.classList.add('input-success');
                    this.classList.remove('input-error');
                } else {
                    this.classList.add('input-error');
                    this.classList.remove('input-success');
                }
            });
        }
    });
}

function renderTable(filtro = "") {
    const corpo = document.getElementById('corpoTabela');
    if (!corpo) return;
    
    corpo.innerHTML = "";
    if (filtro.trim() === "") return;

    const termo = filtro.toLowerCase();
    const dadosFiltrados = dadosRamais.filter(item => 
        (item.nome && item.nome.toLowerCase().includes(termo)) || 
        (item.setor && item.setor.toLowerCase().includes(termo)) || 
        (item.ramal && item.ramal.includes(termo))
    );
    
    const grupos = {};
    dadosFiltrados.forEach(item => {
        if(!grupos[item.setor]) grupos[item.setor] = [];
        grupos[item.setor].push(item);
    });

    Object.keys(grupos).forEach(setor => {
        corpo.innerHTML += `<tr class="row-setor"><td colspan="2">${setor}</td></tr>`;
        grupos[setor].forEach(p => {
            corpo.innerHTML += `
            <tr class="item-row">
                <td>
                    <div style="font-weight:700; font-size:15px;">${p.nome}</div>
                    <div style="font-size:11px; color:var(--text-muted);">${p.setor}</div>
                    <div class="actions">
                        <button class="btn-action btn-edit" onclick="editItem('${p.id}')">Editar</button>
                        <button class="btn-action btn-delete" onclick="deleteItem('${p.id}')">Excluir</button>
                    </div>
                </td>
                <td style="text-align:right;">
                    <span class="ramal-badge">📞 ${p.ramal}</span>
                </td>
            </tr>`;
        });
    });
}

// FUNÇÃO SALVAR AJUSTADA COM SENHA APPADM
async function save() {
    if(prompt("🔒 Confirme a senha administrativa (APPADM) para salvar:") !== SENHA_MESTRA) return alert("Operação cancelada.");

    const nome = document.getElementById('n-nome').value.toUpperCase().trim();
    const setor = document.getElementById('n-setor').value.toUpperCase().trim();
    const ramal = document.getElementById('n-ramal').value.trim();
    const contato = document.getElementById('n-contato').value.trim();
    const id = document.getElementById('edit-id').value;

    if(!nome || !setor || !ramal) return alert("Preencha os campos obrigatórios!");

    const payload = { nome, setor, ramal, contato };

    try {
        if(!id) {
            const { error } = await _supabase.from('ramais').insert([payload]);
            if(error) throw error;
        } else {
            const { error } = await _supabase.from('ramais').update(payload).eq('id', id);
            if(error) throw error;
        }
        alert("Salvo com sucesso!");
        await fetchData();
        switchView('consulta', true);
    } catch (err) {
        alert("Erro na operação: " + err.message);
    }
}

async function deleteItem(id) {
    if(prompt("🔒 Senha administrativa necessária para EXCLUIR:") !== SENHA_MESTRA) return alert("Ação cancelada: Senha incorreta.");
    
    if(confirm("Deseja excluir este contato permanentemente?")) {
        const { error } = await _supabase.from('ramais').delete().eq('id', id);
        if(!error) {
            alert("Excluído!");
            fetchData();
        } else {
            alert("Erro ao excluir.");
        }
    }
}

function editItem(id) {
    if(prompt("🔒 Senha administrativa necessária para EDITAR:") !== SENHA_MESTRA) return alert("Ação cancelada: Senha incorreta.");
    
    const item = dadosRamais.find(i => i.id == id);
    if(!item) return;

    document.getElementById('form-title').innerText = "Editar Cadastro";
    document.getElementById('edit-id').value = item.id;
    document.getElementById('n-nome').value = item.nome;
    document.getElementById('n-setor').value = item.setor;
    document.getElementById('n-ramal').value = item.ramal;
    document.getElementById('n-contato').value = item.contato || "";
    
    switchView('cadastro', true);
}

// FUNÇÃO NOVO RAMAL AJUSTADA COM SENHA APPADM
function prepareAdd() {
    if(prompt("🔒 Senha administrativa necessária para CADASTRAR NOVO:") !== SENHA_MESTRA) return alert("Acesso negado.");

    document.getElementById('form-title').innerText = "Cadastrar Novo";
    document.getElementById('edit-id').value = "";
    camposIds.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.value = "";
    });
    switchView('cadastro');
}

function toggleMenu() {
    document.getElementById('sidebar').classList.toggle('active');
    document.getElementById('overlay').classList.toggle('active');
}

function switchView(view, skipMenu) {
    document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
    const target = document.getElementById('view-' + view);
    if(target) target.classList.add('active');
    if(!skipMenu) toggleMenu();
}

function filtrar() { renderTable(document.getElementById('search').value); }

function logout() {
    localStorage.removeItem(_0xaf2[2]);
    location.reload();
}

function aplicarMascaraTelefone(input) {
    let v = input.value.replace(/\D/g, '');
    v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
    v = v.replace(/(\d)(\d{4})$/, "$1-$2");
    input.value = v;
}
