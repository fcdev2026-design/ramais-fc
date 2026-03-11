async function buscarClimaAPI() {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=-8.05&longitude=-34.88&current=temperature_2m,weather_code&timezone=America%2FRecife`;
        const response = await fetch(url);
        const data = await response.json();

        if (data && data.current) {
            const temp = Math.round(data.current.temperature_2m);
            const code = data.current.weather_code;
            const codigosChuva = [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99];
            const codigosNublado = [1, 2, 3];
            
            let statusTexto = "Céu Limpo";
            let temChuva = codigosChuva.includes(code);

            if (temChuva) statusTexto = "Alerta de Chuva";
            else if (codigosNublado.includes(code)) statusTexto = "Tempo Nublado";

            const climaInfo = { temp, chuva: temChuva, msg: statusTexto, lastUpdate: new Date().toLocaleTimeString() };
            localStorage.setItem('weather_data_v2', JSON.stringify(climaInfo));
            atualizarRelogioTela();
        }
    } catch (e) { console.error("Erro ao buscar clima:", e); }
}

function atualizarRelogioTela() {
    const agora = new Date();
    const horaFormatada = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const bar = document.getElementById('clima-container');
    if (!bar) return;

    const cache = localStorage.getItem('weather_data_v2');
    let dadosClima = cache ? JSON.parse(cache) : { temp: "--", chuva: false, msg: "Carregando..." };

    bar.innerHTML = `<span>${dadosClima.chuva ? "⚠️" : "☀️"} Recife: ${dadosClima.temp}°C | ${dadosClima.msg} | 🕒 ${horaFormatada}</span>`;
    bar.style.color = dadosClima.chuva ? "#ff4444" : "var(--fc-primary)";
}