/* Weather for the wedding site using Open-Meteo (free, no key required).
 *
 * Two independent cards, loaded in parallel:
 *   "Hoje" .................. current weather, always available
 *   "Dia do Casamento" ...... real forecast when within 16 days of 05/09/2026,
 *                             otherwise climate average for that date
 *                             (ERA5 reanalysis, Sept 5th of 2021-2025)
 */
(function () {
    'use strict';

    // Ribeirão da Ilha, Florianópolis coordinates
    var LAT = -27.7;
    var LON = -48.57;

    // Wedding date
    var WEDDING_DATE = '2026-09-05';

    // Climate reference: average over the most recent Sept 5ths (2021-2025)
    var CLIMATE_FROM = 2021;
    var CLIMATE_TO = 2025;

    var todayContainer = document.getElementById('weather-today');
    var weddingContainer = document.getElementById('weather-wedding');

    // WMO Weather interpretation codes
    var weatherCodes = {
        0: { desc: 'Céu limpo', icon: '☀️' },
        1: { desc: 'Parcialmente limpo', icon: '🌤️' },
        2: { desc: 'Parcialmente nublado', icon: '⛅' },
        3: { desc: 'Nublado', icon: '☁️' },
        45: { desc: 'Neblina', icon: '🌫️' },
        48: { desc: 'Neblina com geada', icon: '🌫️' },
        51: { desc: 'Garoa leve', icon: '🌦️' },
        53: { desc: 'Garoa moderada', icon: '🌦️' },
        55: { desc: 'Garoa intensa', icon: '🌧️' },
        61: { desc: 'Chuva leve', icon: '🌧️' },
        63: { desc: 'Chuva moderada', icon: '🌧️' },
        65: { desc: 'Chuva forte', icon: '⛈️' },
        80: { desc: 'Pancadas leves', icon: '🌦️' },
        81: { desc: 'Pancadas moderadas', icon: '🌧️' },
        82: { desc: 'Pancadas fortes', icon: '⛈️' },
        95: { desc: 'Tempestade', icon: '⛈️' },
        96: { desc: 'Tempestade com granizo', icon: '⛈️' }
    };

    function getWeatherInfo(code) {
        return weatherCodes[code] || { desc: 'Indisponível', icon: '🌡️' };
    }

    /* Rough icon/description for the climate case, derived from avg rainfall */
    function climateInfo(precipitation) {
        if (precipitation > 10) return { desc: 'Chuvoso', icon: '🌧️' };
        if (precipitation > 3) return { desc: 'Parcialmente chuvoso', icon: '🌦️' };
        if (precipitation > 0.5) return { desc: 'Pancadas isoladas', icon: '🌤️' };
        return { desc: 'Predominantemente seco', icon: '☀️' };
    }

    function average(values, idx) {
        var sum = 0, count = 0;
        for (var i = 0; i < idx.length; i++) {
            var v = values[idx[i]];
            if (v !== null && !isNaN(v)) { sum += v; count++; }
        }
        return count ? Math.round(sum / count) : 0;
    }

    /* ------------------- Card 1: today's weather ------------------- */
    function fetchToday() {
        var url = 'https://api.open-meteo.com/v1/forecast?' +
            'latitude=' + LAT +
            '&longitude=' + LON +
            '&current_weather=true' +
            '&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,windspeed_10m_max,relative_humidity_2m_mean' +
            '&timezone=America/Sao_Paulo' +
            '&forecast_days=1';

        fetch(url)
            .then(function (res) { return res.json(); })
            .then(function (data) {
                if (data.current_weather && data.daily) {
                    renderWeather(todayContainer, {
                        code: data.current_weather.weathercode,
                        tempMax: Math.round(data.daily.temperature_2m_max[0]),
                        tempMin: Math.round(data.daily.temperature_2m_min[0]),
                        precipitation: data.daily.precipitation_probability_max[0] || 0,
                        precipUnit: '%',
                        wind: Math.round(data.current_weather.windspeed),
                        humidity: Math.round(data.daily.relative_humidity_2m_mean[0]),
                        note: null
                    });
                } else {
                    showError(todayContainer);
                }
            })
            .catch(function () { showError(todayContainer); });
    }

    /* ------------- Card 2: weather for the wedding day ------------- */
    function fetchWedding() {
        var now = new Date();
        var weddingDate = new Date(WEDDING_DATE + 'T17:30:00-03:00');
        var daysUntil = Math.ceil((weddingDate - now) / (1000 * 60 * 60 * 24));

        // Open-Meteo forecast API supports up to 16 days ahead
        if (daysUntil <= 16 && daysUntil > 0) {
            fetchWeddingForecast();
        } else {
            fetchWeddingClimate();
        }
    }

    function fetchWeddingForecast() {
        var url = 'https://api.open-meteo.com/v1/forecast?' +
            'latitude=' + LAT +
            '&longitude=' + LON +
            '&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max,windspeed_10m_max,relative_humidity_2m_mean' +
            '&timezone=America/Sao_Paulo' +
            '&start_date=' + WEDDING_DATE +
            '&end_date=' + WEDDING_DATE;

        fetch(url)
            .then(function (res) { return res.json(); })
            .then(function (data) {
                if (data.daily) {
                    renderWeather(weddingContainer, {
                        code: data.daily.weathercode[0],
                        tempMax: Math.round(data.daily.temperature_2m_max[0]),
                        tempMin: Math.round(data.daily.temperature_2m_min[0]),
                        precipitation: data.daily.precipitation_probability_max[0],
                        precipUnit: '%',
                        wind: Math.round(data.daily.windspeed_10m_max[0]),
                        humidity: Math.round(data.daily.relative_humidity_2m_mean[0]),
                        note: null
                    });
                } else {
                    fetchWeddingClimate();
                }
            })
            .catch(fetchWeddingClimate);
    }

    function fetchWeddingClimate() {
        // One call for the whole range; the response contains EVERY day in it,
        // so keep only the Sept 5th rows before averaging.
        var url = 'https://archive-api.open-meteo.com/v1/era5?' +
            'latitude=' + LAT +
            '&longitude=' + LON +
            '&start_date=' + CLIMATE_FROM + '-09-05' +
            '&end_date=' + CLIMATE_TO + '-09-05' +
            '&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,relative_humidity_2m_mean' +
            '&timezone=America/Sao_Paulo';

        fetch(url)
            .then(function (res) { return res.json(); })
            .then(function (data) {
                if (!data.daily) { showError(weddingContainer); return; }

                var idx = [];
                for (var i = 0; i < data.daily.time.length; i++) {
                    if (data.daily.time[i].slice(5, 10) === '09-05') idx.push(i);
                }
                if (idx.length === 0) { showError(weddingContainer); return; }

                renderWeather(weddingContainer, {
                    code: null,
                    tempMax: average(data.daily.temperature_2m_max, idx),
                    tempMin: average(data.daily.temperature_2m_min, idx),
                    precipitation: average(data.daily.precipitation_sum, idx),
                    precipUnit: 'mm',
                    wind: average(data.daily.windspeed_10m_max, idx),
                    humidity: average(data.daily.relative_humidity_2m_mean, idx),
                    note: '* Média climática dos últimos ' + (CLIMATE_TO - CLIMATE_FROM + 1) +
                          ' anos (ERA5) para 05/09. A previsão real fica disponível 16 dias antes da data.'
                });
            })
            .catch(function () { showError(weddingContainer); });
    }

    /* ------------------------- Rendering ------------------------- */
    function renderWeather(container, weather) {
        var info = (weather.code !== null && weather.code !== undefined)
            ? getWeatherInfo(weather.code)
            : climateInfo(weather.precipitation);
        var avgTemp = Math.round((weather.tempMax + weather.tempMin) / 2);

        container.innerHTML =
            '<div class="weather__main">' +
                '<span class="weather__icon">' + info.icon + '</span>' +
                '<div>' +
                    '<div class="weather__temp">' + avgTemp + '°C</div>' +
                    '<div class="weather__desc">' + info.desc + '</div>' +
                    '<div class="weather__minmax">Máx ' + weather.tempMax + '°C | Mín ' + weather.tempMin + '°C</div>' +
                '</div>' +
            '</div>' +
            '<div class="weather__details">' +
                '<span class="weather__detail">' +
                    (weather.precipUnit === '%'
                        ? '💧 Chance de chuva: ' + weather.precipitation + '%'
                        : '🌧️ Precipitação média: ' + weather.precipitation + ' mm') +
                '</span>' +
                '<span class="weather__detail">💨 Umidade: ' + weather.humidity + '%</span>' +
                '<span class="weather__detail">🌬️ Vento: ' + weather.wind + ' km/h</span>' +
            '</div>';

        if (weather.note) {
            container.innerHTML += '<p class="weather__note">' + weather.note + '</p>';
        }
    }

    function showError(container) {
        container.innerHTML = '<p class="weather__loading">Não foi possível carregar.</p>';
    }

    // Fire both cards in parallel — they are independent
    fetchToday();
    fetchWedding();
})();
