// Initialize the map centered on Thailand
const map = L.map("map").setView([13.736717, 100.523186], 6);

// Define your custom Mapbox style layer
L.tileLayer(
  "https://api.mapbox.com/styles/v1/visarut/clxlhlcjd00fo01pf3ibwdkaj/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoidmlzYXJ1dCIsImEiOiJjbHdkNHF4YnoxNDg0MmtwbHgzeXBseGdsIn0.TEjiK_8FMW2n_TyfgEEYLA",
  {
    attribution:
      "Map data &copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors, Imagery © <a href='https://www.mapbox.com/'>Mapbox</a>",
    maxZoom: 18,
    tileSize: 512,
    zoomOffset: -1,
  }
).addTo(map);

// Define maximum bubble radius
const maxRadius = 2600; // Adjust as necessary

let currentLanguage = "th";
let markers = [];
let allData = []; // Store all data for filtering

// Function to add circle markers to the map from CSV data
const addBubbles = (data) => {
  // Clear existing markers
  markers.forEach((markerObj) => markerObj.marker.remove());
  markers = [];

  // Add new markers based on filtered data
  data.forEach((row) => {
    const {
      latitude,
      longitude,
      province_th,
      province_en,
      tambon_th,
      tambon_en,
      st_no,
      men,
      women,
    } = row;

    // Calculate radius based on st_no
    const radius = Math.min(maxRadius, Math.sqrt(parseInt(st_no, 5)) * 1); // Adjust multiplier for appropriate scaling

    // Use a constant color for all bubbles
    const color = "#4b7686ff"; // Set to green for all bubbles

    // Create popup content in both languages
    const popupContentTh = `
      <strong>จังหวัด:</strong> ${province_th || "N/A"}<br>
      <strong>ตำบล:</strong> ${tambon_th || "N/A"}<br>
      <strong>จำนวนไร้สัญชาติ:</strong> ${st_no || "N/A"}<br>
      <strong>ชาย:</strong> ${men || "N/A"}<br>
      <strong>หญิง:</strong> ${women || "N/A"}<br>
    `;

    const popupContentEn = `
      <strong>Province:</strong> ${province_en || "N/A"}<br>
      <strong>Subdistrict:</strong> ${tambon_en || "N/A"}<br>
      <strong>Stateless Number:</strong> ${st_no || "N/A"}<br>
      <strong>Men:</strong> ${men || "N/A"}<br>
      <strong>Women:</strong> ${women || "N/A"}<br>
    `;

    const circleMarker = L.circleMarker(
      [parseFloat(latitude), parseFloat(longitude)],
      {
        radius: radius,
        color: color,
        fillColor: color,
        fillOpacity: 0.7,
      }
    ).bindPopup(currentLanguage === "th" ? popupContentTh : popupContentEn);

    circleMarker.addTo(map);
    markers.push({
      marker: circleMarker,
      contentTh: popupContentTh,
      contentEn: popupContentEn,
    });
  });
};

// Load CSV data and parse it
const loadCSVData = (url) => {
  Papa.parse(url, {
    download: true,
    header: true,
    complete: (results) => {
      allData = results.data; // Store all data
      populateProvinceFilter(allData); // Populate province filter dropdown
      addBubbles(allData); // Add all data initially
    },
    error: (err) => console.error("Error loading CSV data:", err),
  });
};

// Load and add markers from the CSV
loadCSVData("stateless-people-tambon-thai.csv");

const toggleLanguage = () => {
  const button = document.getElementById("toggle-button");

  if (currentLanguage === "th") {
    // Switch to English
    currentLanguage = "en";
    button.textContent = "ไทย";
  } else {
    // Switch to Thai
    currentLanguage = "th";
    button.textContent = "ENG";
  }

  // Update popups
  markers.forEach((markerObj) => {
    markerObj.marker.setPopupContent(
      currentLanguage === "th" ? markerObj.contentTh : markerObj.contentEn
    );
  });

  // Update province filter options
  populateProvinceFilter(allData);
};

// Attach event listener to the button
document
  .getElementById("toggle-button")
  .addEventListener("click", toggleLanguage);

// Populate province filter dropdown
const populateProvinceFilter = (data) => {
  const provinceFilter = document.getElementById("province-filter");
  provinceFilter.innerHTML = ""; // Clear previous options
  const provinces = new Set(
    data.map((row) =>
      currentLanguage === "th" ? row.province_th : row.province_en
    )
  );

  const defaultOption = document.createElement("option");
  defaultOption.value = "all";
  defaultOption.textContent =
    currentLanguage === "th" ? "ทุกจังหวัด" : "All Provinces";
  provinceFilter.appendChild(defaultOption);

  provinces.forEach((province) => {
    const option = document.createElement("option");
    option.value = province;
    option.textContent = province;
    provinceFilter.appendChild(option);
  });
};

// Filter data based on selected province
const filterDataByProvince = (province) => {
  if (province === "all") {
    addBubbles(allData);
  } else {
    const filteredData = allData.filter((row) => {
      return currentLanguage === "th"
        ? row.province_th === province
        : row.province_en === province;
    });
    addBubbles(filteredData);
  }
};

// Attach event listener to the province filter
document
  .getElementById("province-filter")
  .addEventListener("change", (event) => {
    const selectedProvince = event.target.value;
    filterDataByProvince(selectedProvince);
  });
