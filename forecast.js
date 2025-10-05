const API_KEY = "11ed807691254928bf555018250410";
let rainChartInstance = null;
let forecastData = null;


const city = localStorage.getItem('selectedCity');
if (!city) {
  alert("No city selected.");
  window.location.href = "index.html";
}

document.getElementById('cityName').textContent = `City: ${city}`;


async function fetchForecast() {
  try {
    const res = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${encodeURIComponent(city)}&days=7&aqi=yes&alerts=no`);
    forecastData = await res.json();

    if (!forecastData || !forecastData.forecast) {
      document.getElementById('forecast').innerHTML = "⚠️ No forecast data available.";
      return;
    }

    const daily = forecastData.forecast.forecastday;


    document.getElementById('forecast').innerHTML = daily.map(d => `
      <div class="card">
        <h3>${d.date}</h3>
        <img src="${d.day.condition.icon}" alt="${d.day.condition.text}">
        <p>${d.day.condition.text}</p>
        <p>🌡️ ${d.day.avgtemp_c}°C</p>
        <p>💧 ${d.day.daily_chance_of_rain}%</p>
      </div>
    `).join("");

    
    const avgRain = daily.reduce((s, d) => s + d.day.daily_chance_of_rain, 0) / daily.length;
    let advice = "";
    if (avgRain > 70) advice = "☔ High chance of rain! Carry an umbrella.";
    else if (avgRain > 40) advice = "🌦️ Moderate chance of rain. Keep an eye on weather.";
    else advice = "☀️ Low chance of rain. Parade looks good!";
    document.getElementById('recommendations').innerHTML = `<p>${advice}</p>`;

    
    const labels = daily.map(d => d.date);
    const rainData = daily.map(d => d.day.daily_chance_of_rain);
    const ctx = document.getElementById('rainChart').getContext('2d');
    if (rainChartInstance) rainChartInstance.destroy();
    rainChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Chance of Rain (%)',
          data: rainData,
          borderColor: '#0277bd',
          backgroundColor: 'rgba(2,119,189,0.2)',
          fill: true,
          tension: 0.3
        }]
      },
      options: { responsive: true, scales: { y: { beginAtZero: true, max: 100 } } }
    });

    
    document.getElementById('downloadJSON').onclick = () => {
      const blob = new Blob([JSON.stringify(forecastData)], { type: "application/json" });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${city}_forecast.json`; a.click();
    };

    document.getElementById('downloadCSV').onclick = () => {
      let csv = "Date,Condition,AvgTemp_C,ChanceOfRain\n";
      daily.forEach(d => csv += `${d.date},"${d.day.condition.text}",${d.day.avgtemp_c},${d.day.daily_chance_of_rain}\n`);
      const blob = new Blob([csv], { type: "text/csv" });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${city}_forecast.csv`; a.click();
    };

  } catch (err) {
    console.error(err);
    document.getElementById('forecast').innerHTML = "⚠️ Error fetching data.";
  }
}

fetchForecast();


const chatWindow = document.getElementById("chatbotWindow");
const chatInput = document.getElementById("chatInput");
const chatSend = document.getElementById("chatSend");
const chatToggle = document.getElementById("chatToggle");
let chatOpen = true;


chatToggle.addEventListener("click", () => {
  chatOpen = !chatOpen;
  document.getElementById("chatbotWidget").classList.toggle("minimized", !chatOpen);
});


if (window.innerWidth < 600) {
  chatOpen = false;
  document.getElementById("chatbotWidget").classList.add("minimized");
}


function addChatMessage(sender, text) {
  const msg = document.createElement("div");
  msg.className = sender === "user" ? "user-msg" : "bot-msg";
  msg.textContent = text;
  chatWindow.appendChild(msg);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}


const weekdays = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];

function getDayFromQuery(query) {
  query = query.toLowerCase();
  for (let day of weekdays) if (query.includes(day)) return day;
  return null;
}

function findForecastDay(dayName) {
  const forecastDays = forecastData.forecast.forecastday;
  for (let d of forecastDays) {
    const dateObj = new Date(d.date);
    if (dateObj.getDay() === weekdays.indexOf(dayName)) return d.day;
  }
  return forecastDays[0].day; 
}

function getSmartReply(query) {
  if (!forecastData) return "⏳ Please wait, fetching forecast...";

  const dayName = getDayFromQuery(query);
  const today = dayName ? findForecastDay(dayName) : forecastData.forecast.forecastday[0].day;
  const condition = today.condition.text.toLowerCase();
  const chanceRain = today.daily_chance_of_rain;
  const avgTemp = today.avgtemp_c;

  query = query.toLowerCase();

  
  if (/(hi|hello|hey)/.test(query)) return "👋 Hey there! I’m your weather buddy ☀️ How are you doing?";
  if (query.includes("how are you")) return "😊 I’m feeling great — just a bit cloudy with a chance of kindness! How about you?";
  if (query.includes("your name")) return "🤖 I’m WeatherBot — your friendly assistant for forecasts and fun weather tips!";
  if (query.includes("who made you")) return "🧠 I was built by a passionate developer to help people plan better with smart weather insights!";
  if (query.includes("love")) return "💙 Aww, I love chatting about sunshine and rainbows!";
  if (query.includes("thank")) return "😊 You’re very welcome! Stay awesome and weather-ready!";

  // 
  if (/(umbrella|rain|will it rain|carry.*umbrella|wet|storm)/.test(query)) {
    if (chanceRain > 70) return `☔ Yes! High chance of rain (${chanceRain}%) — carry an umbrella.`;
    if (chanceRain > 40) return `🌦️ Moderate chance of rain (${chanceRain}%) — maybe take an umbrella.`;
    return `🌤️ Low chance of rain (${chanceRain}%) — probably no umbrella needed.`;
  }

  
  if (/(sun|sunny|clear)/.test(query)) {
    if (condition.includes("sunny")) return "🌞 Yes, it will be sunny!";
    if (condition.includes("cloud")) return "🌥️ It will be cloudy.";
    if (condition.includes("rain")) return "☔ Rainy weather expected.";
    return `🌡️ Weather: ${today.condition.text}`;
  }

  
  if (/(temperature|hot|cold|weather|degrees)/.test(query)) {
    return `🌡️ Average temperature: ${avgTemp}°C, condition: ${today.condition.text}`;
  }

  
  if (/(uv|sunscreen|sun)/.test(query)) {
    return today.uv > 7 ? "⚠️ High UV today! Wear sunscreen and sunglasses." : "🌞 UV levels are safe today.";
  }

  
  if (/(activity|do today|plans|fun)/.test(query)) {
    if (chanceRain > 70) return "☔ Rainy vibes — maybe enjoy a cozy movie indoors!";
    if (condition.includes("sunny")) return "🌞 Perfect weather! Great day for a picnic or a walk.";
    if (condition.includes("cloud")) return "🌥️ Cloudy but calm — maybe read or grab a coffee outside.";
    if (avgTemp > 32) return "🥵 Too hot! Stay hydrated and avoid long outdoor activities.";
    if (avgTemp < 15) return "🧣 It’s chilly! Perfect for a warm café visit or light reading indoors.";
    return "😄 Weather looks nice — maybe hang out with friends or go cycling!";
  }

  return "🤖 Hmm, I didn’t get that! You can ask about rain, UV, temperature, or fun activities!";
}

chatSend.addEventListener("click", () => {
  const msg = chatInput.value.trim();
  if (!msg) return;
  addChatMessage("user", msg);
  setTimeout(() => addChatMessage("bot", getSmartReply(msg)), 400);
  chatInput.value = "";
});

chatInput.addEventListener("keypress", e => {
  if (e.key === "Enter") chatSend.click();
});
