/* ==========================================================================
   CONFIGURAÇÃO SUPABASE E SEGURANÇA
   ========================================================================== */

const SUPABASE_URL = 'https://qezbrxgmwjhsezaqowcj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_xjcAgPhqKHoVvOZaXn_mEA_2bLG3Kl4';

// Inicialização do cliente Supabase
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Definição de Senhas e Estado Global
const SENHA_ADM_APP = 'APPADM'; 
const SENHA_ACESSO_SITE = 'FC2026';
let dadosRamais = [];

// --- SEGURANÇA DE ACESSO AO SITE ---
// Verifica se o usuário já possui o token de autorização no navegador
if (localStorage.getItem("fc_autorizado") !== "true") {
    const senha = prompt("🔒 Acesso Restrito Mascarenhas.\nDigite a senha de acesso:");
    
    if (senha === SENHA_ACESSO_SITE) {
        localStorage.setItem("fc_autorizado", "true");
        alert("✅ Acesso concedido!");
        location.reload(); // Recarrega para garantir que todos os módulos iniciem
    } else {
        // Bloqueia a renderização do site caso a senha esteja incorreta
        document.body.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; font-family:sans-serif; text-align:center;">
                <h1 style="color:#ef4444;">🚫 Acesso Negado</h1>
                <p style="color:#64748b;">Você não tem permissão para acessar este sistema.</p>
                <button onclick="location.reload()" style="padding:10px 20px; background:#003399; color:white; border:none; border-radius:5px; cursor:pointer;">Tentar Novamente</button>
            </div>
        `;
        throw new Error("Acesso interrompido: Senha incorreta.");
    }
}