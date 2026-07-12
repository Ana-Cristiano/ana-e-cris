/* Weather forecast using Open-Meteo API (free, no key required) */
(function () {
    'use strict';

    // Ribeirão da Ilha, Florianópolis coordinates
    var LAT = -27.7;
    var LON = -48.57;

    // Wedding date
    var WEDDING_DATE = '2026-09-05';

    var container = document.getElementById('weather-content');

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

    function fetchWeather() {
        var now = new Date();
        var weddingDate = new Date(WEDDING_DATE + 'T17:30:00-03:00');
        var daysUntil = Math.ceil((weddingDate - now) / (1000 * 60 * 60 * 24));

        // Open-Meteo forecast API supports up to 16 days
        // If wedding is within 16 days, get actual forecast
        // Otherwise show climate averages or current weather as reference
        if (daysUntil <= 16 && daysUntil > 0) {
            fetchForecast();
        } else {
            fetchCurrentAsReference();
        }
    }

    function fetchForecast() {
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
                    renderWeather({
                        code: data.daily.weathercode[0],
                        tempMax: Math.round(data.daily.temperature_2m_max[0]),
                        tempMin: Math.round(data.daily.temperature_2m_min[0]),
                        precipitation: data.daily.precipitation_probability_max[0],
                        wind: Math.round(data.daily.windspeed_10m_max[0]),
                        humidity: Math.round(data.daily.relative_humidity_2m_mean[0]),
                        isForecast: true
                    });
                }
            })
            .catch(function () {
                fetchCurrentAsReference();
            });
    }

    function fetchCurrentAsReference() {
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
                    renderWeather({
                        code: data.current_weather.weathercode,
                        tempMax: Math.round(data.daily.temperature_2m_max[0]),
                        tempMin: Math.round(data.daily.temperature_2m_min[0]),
                        precipitation: data.daily.precipitation_probability_max[0] || 0,
                        wind: Math.round(data.current_weather.windspeed),
                        humidity: Math.round(data.daily.relative_humidity_2m_mean[0]),
                        isForecast: false
                    });
                }
            })
            .catch(function () {
                container.innerHTML = '<p class="weather__loading">Não foi possível carregar a previsão.</p>';
            });
    }

    function renderWeather(weather) {
        var info = getWeatherInfo(weather.code);
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
                '<span class="weather__detail">💧 Chance de chuva: ' + weather.precipitation + '%</span>' +
                '<span class="weather__detail">💨 Umidade: ' + weather.humidity + '%</span>' +
                '<span class="weather__detail">🌬️ Vento: ' + weather.wind + ' km/h</span>' +
            '</div>';

        if (!weather.isForecast) {
            container.innerHTML += '<p class="weather__note">* Clima atual em Florianópolis. A previsão para o dia do casamento estará disponível mais próximo da data.</p>';
        }
    }

    fetchWeather();
})();
