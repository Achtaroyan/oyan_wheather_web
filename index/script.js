const apiKey = "9f0a27ebe990b7801f03b72a75713aaf";
let isCelsius = JSON.parse(localStorage.getItem("isCelsius")) ?? true;
let favorites = JSON.parse(localStorage.getItem("favorites")) ?? [];
let recentSearches = JSON.parse(localStorage.getItem("recentSearches")) ?? [];

const defaultCity = "Jakarta";

// Ambil elemen
const locationName = document.getElementById("location-name");
const temperature = document.getElementById("temperature");
const condition = document.getElementById("condition");
const details = document.getElementById("details");
const extraDetails = document.getElementById("extra-details");
const weatherIcon = document.getElementById("weather-icon");
const forecastContainer = document.getElementById("forecast");
const hourlyContainer = document.getElementById("hourly");
const compareInput = document.getElementById("compare-input");
const compareResult = document.getElementById("compare-result");
const suggestionsEl = document.getElementById("suggestions");

const loadingEl = document.getElementById("loading");
const currentWeatherEl = document.getElementById("current-weather");

const toggleUnitBtn = document.getElementById("toggle-unit");
const toggleThemeBtn = document.getElementById("toggle-theme");
const searchBtn = document.getElementById("search-btn");
const cityInput = document.getElementById("city-input");
const saveFavoriteBtn = document.getElementById("save-favorite");
const shareBtn = document.getElementById("share-weather");
const compareBtn = document.getElementById("compare-btn");
const recentSearchesEl = document.getElementById("recent-searches");
const favoritesEl = document.getElementById("favorites");

/* ---------- Core: Ambil Cuaca ---------- */
async function getWeather(lat, lon) {
  try {
    showLoading();
    const unit = isCelsius ? "metric" : "imperial";
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${unit}&appid=${apiKey}&lang=id`
    );
    if (!res.ok) throw new Error("Gagal ambil data cuaca");
    const data = await res.json();
    displayCurrentWeather(data);
    getForecast(lat, lon);
    getHourlyForecast(lat, lon);
    getExtraData(lat, lon);
    hideLoading();
    checkForNotifications(data.main.temp);
  } catch (err) {
    hideLoading();
    alert(err.message);
  }
}

function displayCurrentWeather(data) {
  locationName.textContent = `${data.name}, ${data.sys.country}`;
  temperature.textContent = `${Math.round(data.main.temp)}° ${isCelsius ? "C" : "F"}`;
  condition.textContent = data.weather[0].description;
  details.textContent = `💧 ${data.main.humidity}% | 🌬️ ${data.wind.speed} ${isCelsius ? "m/s" : "mph"} | 🤔 ${Math.round(data.main.feels_like)}°`;
  const sunrise = new Date(data.sys.sunrise * 1000).toLocaleTimeString("id-ID");
  const sunset = new Date(data.sys.sunset * 1000).toLocaleTimeString("id-ID");
  extraDetails.textContent = `🌅 ${sunrise} | 🌇 ${sunset}`;
  weatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
  currentWeatherEl.classList.remove("hidden");
}

/* ---------- Forecast (5 Hari) ---------- */
async function getForecast(lat, lon) {
  const unit = isCelsius ? "metric" : "imperial";
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${unit}&appid=${apiKey}&lang=id`
  );
  const data = await res.json();
  displayForecast(data.list);
}

function displayForecast(list) {
  forecastContainer.innerHTML = "";
  const daily = {};
  list.forEach(item => {
    const date = item.dt_txt.split(" ")[0];
    if (!daily[date]) daily[date] = item;
  });
  Object.keys(daily).slice(0, 5).forEach(date => {
    const day = daily[date];
    const div = document.createElement("div");
    div.className = "forecast-day";
    div.innerHTML = `
      <p>${new Date(date).toLocaleDateString("id-ID", { weekday: "short" })}</p>
      <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png" />
      <p>${Math.round(day.main.temp_max)}° / ${Math.round(day.main.temp_min)}°</p>
    `;
    div.addEventListener("click", () => {
      alert(`Detail: ${day.weather[0].description}, kelembaban: ${day.main.humidity}%`);
    });
    forecastContainer.appendChild(div);
  });
}

/* ---------- Forecast Jam-an ---------- */
async function getHourlyForecast(lat, lon) {
  const unit = isCelsius ? "metric" : "imperial";
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${unit}&appid=${apiKey}&lang=id`
  );
  const data = await res.json();
  hourlyContainer.innerHTML = "";
  data.list.slice(0, 6).forEach(item => {
    const div = document.createElement("div");
    div.className = "hourly-item";
    div.innerHTML = `
      <p>${new Date(item.dt * 1000).getHours()}:00</p>
      <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png" />
      <p>${Math.round(item.main.temp)}°</p>
    `;
    hourlyContainer.appendChild(div);
  });
}

/* ---------- Data Tambahan ---------- */
async function getExtraData(lat, lon) {
  const airRes = await fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`);
  const airData = await airRes.json();
  console.log("Air Quality:", airData);
}

/* ---------- Notifikasi ---------- */
function checkForNotifications(temp) {
  if (Notification.permission === "granted") {
    if (temp > 35) new Notification("🔥 Panas banget!", { body: "Tetap hidrasi ya!" });
    if (temp < 15) new Notification("❄️ Dingin banget!", { body: "Jangan lupa jaket!" });
  }
}

/* ---------- Pencarian ---------- */
searchBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  if (!city) return alert("Masukkan nama kota!");
  searchCity(city);
});

async function searchCity(city) {
  try {
    const unit = isCelsius ? "metric" : "imperial";
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=${unit}&appid=${apiKey}&lang=id`
    );
    if (!res.ok) throw new Error("Kota tidak ditemukan");
    const data = await res.json();
    displayCurrentWeather(data);
    getForecast(data.coord.lat, data.coord.lon);
    getHourlyForecast(data.coord.lat, data.coord.lon);
    addRecentSearch(city);
  } catch (err) {
    alert(err.message);
  }
}

/* ---------- Autocomplete Suggestions ---------- */
cityInput.addEventListener("input", async () => {
  const query = cityInput.value.trim();
  if (query.length < 3) {
    suggestionsEl.innerHTML = "";
    suggestionsEl.style.display = "none";
    return;
  }
  const res = await fetch(`https://api.openweathermap.org/data/2.5/find?q=${query}&appid=${apiKey}&lang=id`);
  const data = await res.json();
  suggestionsEl.innerHTML = "";
  data.list.slice(0, 5).forEach(city => {
    const btn = document.createElement("button");
    btn.textContent = `${city.name}, ${city.sys.country}`;
    btn.onclick = () => {
      searchCity(city.name);
      suggestionsEl.innerHTML = "";
      suggestionsEl.style.display = "none";
    };
    suggestionsEl.appendChild(btn);
  });
  suggestionsEl.style.display = "block";
});

/* ---------- Recent Search ---------- */
function addRecentSearch(city) {
  if (!recentSearches.includes(city)) {
    recentSearches.unshift(city);
    if (recentSearches.length > 5) recentSearches.pop();
    localStorage.setItem("recentSearches", JSON.stringify(recentSearches));
    displayRecentSearches();
  }
}

function displayRecentSearches() {
  recentSearchesEl.innerHTML = "";
  recentSearches.forEach(city => {
    const btn = document.createElement("button");
    btn.textContent = city;
    btn.onclick = () => searchCity(city);
    recentSearchesEl.appendChild(btn);
  });
}

/* ---------- Favorit ---------- */

function displayFavorites() {
  favoritesEl.innerHTML = "";
  favorites.forEach(city => {
    const wrapper = document.createElement("div");
    wrapper.className = "favorite-item";
    const btn = document.createElement("button");
    btn.textContent = city;
    btn.onclick = () => searchCity(city);

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "❌";
    removeBtn.title = "Hapus dari favorit";
    removeBtn.style.marginLeft = "8px";
    removeBtn.onclick = () => removeFavorite(city);

    wrapper.appendChild(btn);
    wrapper.appendChild(removeBtn);
    favoritesEl.appendChild(wrapper);
  });
}

/* ---------- Compare ---------- */
compareBtn.addEventListener("click", async () => {
  const city = compareInput.value.trim();
  if (!city) return alert("Masukkan kota lain!");
  try {
    const unit = isCelsius ? "metric" : "imperial";
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=${unit}&appid=${apiKey}&lang=id`
    );
    if (!res.ok) throw new Error("Kota tidak ditemukan");
    const data = await res.json();
    const div = document.createElement("div");
    div.className = "compare-item";
    div.innerHTML = `
      <h4>${data.name}</h4>
      <p>${Math.round(data.main.temp)}°</p>
      <p>${data.weather[0].description}</p>
    `;
    compareResult.appendChild(div);
  } catch (err) {
    alert(err.message);
  }
});

/* ---------- Share ---------- */
shareBtn.addEventListener("click", async () => {
  const text = `Cuaca di ${locationName.textContent}: ${temperature.textContent}, ${condition.textContent}`;
  if (navigator.share) {
    await navigator.share({ title: "Info Cuaca", text });
  } else {
    navigator.clipboard.writeText(text);
    alert("Cuaca disalin ke clipboard ✅");
  }
});

/* ---------- UI Toggle ---------- */
toggleThemeBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("theme", document.body.classList.contains("dark"));
});

toggleUnitBtn.addEventListener("click", () => {
  isCelsius = !isCelsius;
  localStorage.setItem("isCelsius", isCelsius);
  navigator.geolocation.getCurrentPosition(
    pos => getWeather(pos.coords.latitude, pos.coords.longitude),
    () => searchCity(defaultCity)
  );
});

/* ---------- Loading ---------- */
function showLoading() { loadingEl.classList.remove("hidden"); }
function hideLoading() { loadingEl.classList.add("hidden"); }

/* ---------- INIT ---------- */
function initWeather() {
  const darkMode = localStorage.getItem("theme") === "true";
  if (darkMode) document.body.classList.add("dark");

  displayFavorites();
  displayRecentSearches();

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => getWeather(pos.coords.latitude, pos.coords.longitude),
      () => searchCity(defaultCity)
    );
  } else {
    searchCity(defaultCity);
  }

  if (Notification.permission !== "granted") {
    Notification.requestPermission();
  }
}



initWeather();
