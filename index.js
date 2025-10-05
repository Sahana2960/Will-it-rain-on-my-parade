 
const map = L.map('map').setView([20, 0], 2);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let marker = null;


async function reverseGeocode(lat, lon) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`);
    const data = await res.json();
    return data.address?.city || data.address?.town || data.address?.village || data.display_name;
  } catch (err) {
    console.error("Reverse geocode error:", err);
    return "";
  }
}


map.on('click', async (e) => {
  const { lat, lng } = e.latlng;

  
  if (marker) map.removeLayer(marker);

  
  marker = L.marker([lat, lng]).addTo(map);

  
  const cityName = await reverseGeocode(lat, lng);
  document.getElementById('cityInput').value = cityName;
});


document.getElementById('nextBtn').addEventListener('click', () => {
  const cityInput = document.getElementById('cityInput').value.trim();
  if (!cityInput) return alert("Please select or type a city.");

  localStorage.setItem('selectedCity', cityInput);
  window.location.href = 'forecast.html';
});


function adjustMapHeight() {
  const mapEl = document.getElementById('map');
  if (window.innerWidth < 600) {
    mapEl.style.height = "250px";
  } else {
    mapEl.style.height = "300px";
  }
}


window.addEventListener('load', adjustMapHeight);
window.addEventListener('resize', adjustMapHeight);
