/* ==========================================================================
   CONFIGURAÇÃO SUPABASE E SEGURANÇA
   ========================================================================== */

const SUPABASE_URL = 'https://qezbrxgmwjhsezaqowcj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_xjcAgPhqKHoVvOZaXn_mEA_2bLG3Kl4';

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const SENHA_ADM_APP = 'APPADM'; 
const SENHA_ACESSO_SITE = 'FC2026';
let dadosRamais = []; // Definição global da variável de dados

if (localStorage.getItem("fc_autorizado") !== "true") {
    const senha = prompt("🔒 Acesso Restrito Mascarenhas.\nDigite a senha de acesso:");
    if (senha === SENHA_ACESSO_SITE) {
        localStorage.setItem("fc_autorizado", "true");
        alert("✅ Acesso concedido!");
        location.reload();
    } else {
        document.body.innerHTML = `<div style="text-align:center; margin-top:100px;"><h1>🚫 Acesso Negado</h1></div>`;
        throw new Error("Acesso interrompido.");
    }
}