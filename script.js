// Clé API de WeatherAPI.com
const API_KEY = 'b281d86f8c6b4983933122047251003';
const BASE_URL = 'https://api.weatherapi.com/v1';

// Éléments DOM
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const locationBtn = document.getElementById('location-btn');
const weatherInfo = document.getElementById('weather-info');
const forecastContainer = document.getElementById('forecast-container');
const loader = document.getElementById('loader');
const errorContainer = document.getElementById('error-container');
const errorMessage = document.getElementById('error-message');

// Éléments d'affichage météo
const cityElement = document.getElementById('city');
const dateElement = document.getElementById('date');
const temperatureElement = document.getElementById('temperature');
const feelsLikeElement = document.getElementById('feels-like');
const weatherIconElement = document.getElementById('weather-icon');
const weatherConditionElement = document.getElementById('weather-condition');
const windElement = document.getElementById('wind');
const humidityElement = document.getElementById('humidity');
const visibilityElement = document.getElementById('visibility');
const uvElement = document.getElementById('uv');

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    // Afficher le loader immédiatement
    showLoader();
    
    // Vérifier si les coordonnées sont enregistrées en localStorage
    const savedLocation = localStorage.getItem('weatherLocation');
    
    if (savedLocation) {
        const { lat, lon } = JSON.parse(savedLocation);
        getWeatherByCoordinates(lat, lon);
    } else {
        // Par défaut, afficher la météo de Paris
        getWeatherByCity('Paris');
    }
    
    // Événements
    searchBtn.addEventListener('click', handleSearch);
    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
    locationBtn.addEventListener('click', getUserLocation);
});

// Fonctions principales
function handleSearch() {
    const city = cityInput.value.trim();
    if (city) {
        showLoader();
        getWeatherByCity(city);
    }
}

function getUserLocation() {
    showLoader();
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                // Sauvegarder la position en localStorage
                localStorage.setItem('weatherLocation', JSON.stringify({ lat: latitude, lon: longitude }));
                getWeatherByCoordinates(latitude, longitude);
            },
            (error) => {
                hideLoader();
                showError(`Impossible d'obtenir votre position: ${error.message}`);
            }
        );
    } else {
        hideLoader();
        showError("La géolocalisation n'est pas supportée par votre navigateur");
    }
}

async function getWeatherByCity(city) {
    try {
        const currentResponse = await fetch(`${BASE_URL}/current.json?key=${API_KEY}&q=${city}&lang=fr&aqi=yes`);
        const forecastResponse = await fetch(`${BASE_URL}/forecast.json?key=${API_KEY}&q=${city}&days=7&lang=fr&aqi=no`);
        
        if (!currentResponse.ok || !forecastResponse.ok) {
            throw new Error('Ville introuvable ou erreur API');
        }
        
        const currentData = await currentResponse.json();
        const forecastData = await forecastResponse.json();
        
        updateWeatherUI(currentData, forecastData);
        hideLoader();
        hideError();
        showWeatherInfo();
        
        // Mise à jour de l'arrière-plan en fonction de l'heure locale
        updateBackgroundByTime(currentData.location.localtime);
    } catch (error) {
        hideLoader();
        showError('Ville introuvable. Veuillez réessayer.');
        console.error('Erreur:', error);
    }
}

async function getWeatherByCoordinates(lat, lon) {
    try {
        const currentResponse = await fetch(`${BASE_URL}/current.json?key=${API_KEY}&q=${lat},${lon}&lang=fr&aqi=yes`);
        const forecastResponse = await fetch(`${BASE_URL}/forecast.json?key=${API_KEY}&q=${lat},${lon}&days=7&lang=fr&aqi=no`);
        
        if (!currentResponse.ok || !forecastResponse.ok) {
            throw new Error('Erreur lors de la récupération des données météo');
        }
        
        const currentData = await currentResponse.json();
        const forecastData = await forecastResponse.json();
        
        updateWeatherUI(currentData, forecastData);
        hideLoader();
        hideError();
        showWeatherInfo();
        
        // Mise à jour de l'arrière-plan en fonction de l'heure locale
        updateBackgroundByTime(currentData.location.localtime);
    } catch (error) {
        hideLoader();
        showError('Erreur lors de la récupération des données météo');
        console.error('Erreur:', error);
    }
}

// Fonction de mise à jour de l'interface utilisateur
function updateWeatherUI(currentData, forecastData) {
    // Données météo actuelle
    const { location, current } = currentData;
    
    // Mettre à jour les informations de localisation
    cityElement.textContent = `${location.name}, ${location.country}`;
    
    // Mettre à jour la date avec la date actuelle du lieu
    dateElement.textContent = formatDate(location.localtime);
    
    // Mettre à jour les informations météo principales
    temperatureElement.textContent = `${Math.round(current.temp_c)}°C`;
    feelsLikeElement.textContent = `Ressenti: ${Math.round(current.feelslike_c)}°C`;
    weatherIconElement.src = `https:${current.condition.icon}`;
    weatherConditionElement.textContent = current.condition.text;
    
    // Mettre à jour les détails météo
    windElement.textContent = `${current.wind_kph} km/h`;
    humidityElement.textContent = `${current.humidity}%`;
    visibilityElement.textContent = `${current.vis_km} km`;
    uvElement.textContent = current.uv;
    
    // Mettre à jour les prévisions
    updateForecastUI(forecastData);
}

function updateForecastUI(forecastData) {
    forecastContainer.innerHTML = '';
    
    const { forecast } = forecastData;
    
    forecast.forecastday.forEach((day, index) => {
        // Sauter le jour actuel
        if (index === 0) return;
        
        const forecastDay = document.createElement('div');
        forecastDay.className = 'forecast-day';
        
        forecastDay.innerHTML = `
            <p>${formatDay(day.date)}</p>
            <img src="https:${day.day.condition.icon}" alt="${day.day.condition.text}">
            <p class="forecast-temp">${Math.round(day.day.maxtemp_c)}° / ${Math.round(day.day.mintemp_c)}°</p>
            <p class="forecast-desc">${day.day.condition.text}</p>
        `;
        
        forecastContainer.appendChild(forecastDay);
    });
}

// Fonctions utilitaires
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    return date.toLocaleDateString('fr-FR', options);
}

function formatDay(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { weekday: 'short' });
}

function updateBackgroundByTime(dateTimeString) {
    const date = new Date(dateTimeString);
    const hours = date.getHours();
    
    const body = document.body;
    
    // Enlever les classes existantes
    body.classList.remove('day-mode', 'night-mode');
    
    // Ajouter la classe appropriée en fonction de l'heure
    if (hours >= 6 && hours < 18) {
        body.classList.add('day-mode');
    } else {
        body.classList.add('night-mode');
    }
}

// Fonctions de gestion de l'interface
function showLoader() {
    loader.classList.remove('hidden');
    weatherInfo.classList.add('hidden');
    errorContainer.classList.add('hidden');
}

function hideLoader() {
    loader.classList.add('hidden');
}

function showWeatherInfo() {
    weatherInfo.classList.remove('hidden');
}

function showError(message) {
    errorContainer.classList.remove('hidden');
    errorMessage.textContent = message;
    weatherInfo.classList.add('hidden');
}

function hideError() {
    errorContainer.classList.add('hidden');
} 