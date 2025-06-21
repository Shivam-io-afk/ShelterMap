import React, { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import axios from "axios";
import "mapbox-gl/dist/mapbox-gl.css";
import GenRes from './GenRes';
import API_CONFIG from './config/api';
import { handleApiError, showErrorAlert, logError } from './utils/errorHandler';
import { validateLocationInput, validateSafeZoneData, sanitizeInput } from './utils/validation';
import LoadingSpinner from './components/LoadingSpinner';
import Notification from './components/Notification';

// Set Mapbox access token from config
mapboxgl.accessToken = API_CONFIG.MAPBOX.ACCESS_TOKEN;

const generateRandomSafeZones = (baseLng, baseLat) => {
  const minSafeZones = 3;
  const maxSafeZones = 8;
  const safeZonesCount = Math.floor(Math.random() * (maxSafeZones - minSafeZones + 1)) + minSafeZones;

  const safeZones = [];
  const minDistance = 0.05;

  for (let i = 0; i < safeZonesCount; i++) {
    let newLng, newLat;
    let isFarEnough = false;
    let attempts = 0;
    const maxAttempts = 50;

    while (!isFarEnough && attempts < maxAttempts) {
      newLng = baseLng + (Math.random() - 0.5) * 0.2;
      newLat = baseLat + (Math.random() - 0.5) * 0.2;
      isFarEnough = safeZones.every(zone =>
        Math.sqrt((zone.lng - newLng) ** 2 + (zone.lat - newLat) ** 2) > minDistance
      );
      attempts++;
    }

    if (isFarEnough) {
      const safeZone = {
        name: `Safe Zone ${i + 1}`,
        lng: newLng,
        lat: newLat,
        capacity: Math.floor(Math.random() * 50) + 10
      };
      // Validate safe zone data
      const validation = validateSafeZoneData(safeZone);
      if (validation.isValid) {
        safeZones.push(safeZone);
      } else {
        logError(new Error(validation.error), 'Safe zone generation');
      }
    }
  }
  return safeZones;
};

const Map = ({ onLocationSearch, onClearSearch }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [input, setInput] = useState("");
  const [safeZones, setSafeZones] = useState([]);
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [lastLocation, setLastLocation] = useState(null);

  useEffect(() => {
    if (map.current) return;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/navigation-day-v1",
        projection: "globe",
        center: [78.9629, 22.5937],
        zoom: 2.2,
        pitch: 0,
        bearing: 0
      });

      map.current.on("style.load", () => {
        map.current.setFog({
          range: [0.2, 2],
          color: "#d6e3f8",
          "horizon-blend": 0.01,
        });
      });

      map.current.addControl(new mapboxgl.NavigationControl());
    } catch (error) {
      logError(error, 'Map initialization');
      setNotification({
        message: 'Failed to initialize map. Please refresh the page.',
        type: 'error'
      });
    }
  }, []);

  const showNotification = (message, type = 'info', duration = 5000) => {
    setNotification({ message, type, duration });
  };

  const clearNotification = () => {
    setNotification(null);
  };

  const fetchCoordinates = async (locationName) => {
    try {
      const sanitizedLocation = sanitizeInput(locationName);
      const res = await axios.get(`${API_CONFIG.MAPBOX.GEOCODING_URL}/${encodeURIComponent(sanitizedLocation)}.json`, {
        params: {
          access_token: API_CONFIG.MAPBOX.ACCESS_TOKEN,
          limit: 1
        }
      });

      if (res.data.features && res.data.features.length > 0) {
        const [lng, lat] = res.data.features[0].center;
        return { lng, lat };
      } else {
        throw new Error('Location not found');
      }
    } catch (error) {
      const appError = handleApiError(error, 'Geocoding');
      logError(appError, 'fetchCoordinates');
      throw appError;
    }
  };

  const handleCenter = () => {
    if (lastLocation) {
      map.current.jumpTo({
        center: [lastLocation.lng, lastLocation.lat],
        zoom: 11
      });
      showNotification('Map centered on your location', 'info', 2000);
    } else {
      showNotification('No location selected yet!', 'warning');
    }
  };

  const handleLocationSubmit = async () => {
    // Validate input
    const validation = validateLocationInput(input);
    if (!validation.isValid) {
      showNotification(validation.error, 'error');
      return;
    }

    let lng, lat;
    let locationName = input;

    try {
      if (input.includes(",")) {
        const [lngStr, latStr] = input.split(",").map(val => val.trim());
        lng = parseFloat(lngStr);
        lat = parseFloat(latStr);
      } else {
        const locationData = await fetchCoordinates(input);
        lng = locationData.lng;
        lat = locationData.lat;
      }

      if (!isNaN(lng) && !isNaN(lat)) {
        setLoading(true);
        showNotification("Finding nearby safe zones...", "info");

        // Generate new Safe Zones
        const newSafeZones = generateRandomSafeZones(lng, lat);
        setSafeZones(newSafeZones);

        // lastLocation for recentering
        setLastLocation({ lng, lat });

        // Trigger location search callback for ResourceAvailability
        if (onLocationSearch) {
          onLocationSearch({
            name: locationName,
            lat: lat,
            lng: lng
          });
        }

        showNotification(`${newSafeZones.length} Safe Zones Available!`, "success");

        // markers for Safe Zones
        const newMarkers = newSafeZones.map((zone) => {
          const el = document.createElement("div");
          el.style.fontSize = "2em";
          el.style.width = "40px";
          el.style.height = "40px";
          el.style.display = "flex";
          el.style.alignItems = "center";
          el.style.justifyContent = "center";
          el.style.background = "rgba(255,255,255,0.85)";
          el.style.borderRadius = "50%";
          el.style.border = "2px solid #666";
          el.innerText = "🏠";
          return new mapboxgl.Marker({ element: el, anchor: 'center' })
            .setLngLat([zone.lng, zone.lat])
            .setPopup(new mapboxgl.Popup().setHTML(`<h3>${zone.name}</h3><p>Capacity: ${zone.capacity} people</p>`))
            .addTo(map.current);
        });

        // Add a blue marker for the searched location
        const searchedMarker = new mapboxgl.Marker({ color: "rgb(0, 122, 255)" })
          .setLngLat([lng, lat])
          .setPopup(new mapboxgl.Popup().setHTML(`<h3>Searched Location: ${locationName}</h3>`))
          .addTo(map.current);

        setMarkers([...newMarkers, searchedMarker]);

        // Move map instantly
        map.current.jumpTo({
          center: [lng, lat],
          zoom: 11
        });
      } else {
        showNotification("Invalid coordinates!", "error");
      }
    } catch (error) {
      setLoading(false);
      showNotification(error.message, "error");
    }
  };

  const showRouteToNearestShelter = async () => {
    if (!lastLocation || safeZones.length === 0) {
      showNotification("No location or safe zones available!", "warning");
      return;
    }

    const { lng, lat } = lastLocation;

    // Sort safe zones by distance from user
    const sortedZones = safeZones.slice().sort((a, b) => {
      const distA = Math.hypot(a.lng - lng, a.lat - lat);
      const distB = Math.hypot(b.lng - lng, b.lat - lat);
      return distA - distB;
    });

    let foundRoute = false;
    setLoading(true);
    showNotification("Finding best route to shelter...", "info");

    for (let i = 0; i < sortedZones.length; i++) {
      const zone = sortedZones[i];
      const dist = Math.hypot(zone.lng - lng, zone.lat - lat);
      if (dist < 0.0002) continue; // ~20 meters in degrees (approx)
      try {
        const res = await axios.get(`${API_CONFIG.MAPBOX.DIRECTIONS_URL}/${lng},${lat};${zone.lng},${zone.lat}`, {
          params: {
            access_token: API_CONFIG.MAPBOX.ACCESS_TOKEN,
            geometries: "geojson"
          }
        });
        const route = res.data.routes[0];
        if (route && route.geometry && route.geometry.coordinates.length > 1) {
          if (map.current.getLayer("route")) {
            map.current.removeLayer("route");
            map.current.removeSource("route");
          }
          map.current.addSource("route", {
            type: "geojson",
            data: route.geometry
          });
          map.current.addLayer({
            id: "route",
            type: "line",
            source: "route",
            layout: {
              "line-join": "round",
              "line-cap": "round"
            },
            paint: {
              "line-color": "#007AFF",
              "line-width": 4
            }
          });
          const distance = (route.distance / 1000).toFixed(2);
          const duration = Math.ceil(route.duration / 60);
          setLoading(false);
          showNotification(`Route to ${zone.name}, Distance: ${distance} km - Estimated Time: ${duration} min`, "success", 8000);
          foundRoute = true;
          break;
        }
      } catch (error) {
        // Try next zone
      }
    }
    if (!foundRoute) {
      setLoading(false);
      showNotification("No accessible route to any shelter found! Try another location.", "error");
    }
  };

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      showNotification("Geolocation is not supported by your browser.", "error");
      return;
    }

    setLoading(true);
    showNotification("Getting your location...", "info");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLastLocation({ lng: longitude, lat: latitude });

        markers.forEach(marker => marker.remove());
        setMarkers([]);

        const newSafeZones = generateRandomSafeZones(longitude, latitude);
        setSafeZones(newSafeZones);

        const userMarker = new mapboxgl.Marker({ color: "rgb(0, 122, 255)" })
          .setLngLat([longitude, latitude])
          .setPopup(new mapboxgl.Popup().setHTML("<h3>Your Location</h3>"))
          .addTo(map.current);

        const newMarkers = newSafeZones.map((zone) => {
          const el = document.createElement("div");
          el.style.fontSize = "2em";
          el.style.width = "40px";
          el.style.height = "40px";
          el.style.display = "flex";
          el.style.alignItems = "center";
          el.style.justifyContent = "center";
          el.style.background = "rgba(255,255,255,0.85)";
          el.style.borderRadius = "50%";
          el.style.border = "2px solid #666";
          el.innerText = "🏠";
          return new mapboxgl.Marker({ element: el, anchor: 'center' })
            .setLngLat([zone.lng, zone.lat])
            .setPopup(new mapboxgl.Popup().setHTML(`<h3>${zone.name}</h3><p>Capacity: ${zone.capacity} people</p>`))
            .addTo(map.current);
        });

        // Add a blue marker for the user's location
        const searchedMarker = new mapboxgl.Marker({ color: "rgb(0, 122, 255)" })
          .setLngLat([longitude, latitude])
          .setPopup(new mapboxgl.Popup().setHTML("<h3>Your Location</h3>"))
          .addTo(map.current);

        setMarkers([...newMarkers, userMarker, searchedMarker]);

        map.current.jumpTo({
          center: [longitude, latitude],
          zoom: 11
        });

        // Trigger location search callback for ResourceAvailability
        if (onLocationSearch) {
          onLocationSearch({
            name: "My Location",
            lat: latitude,
            lng: longitude
          });
        }

        setLoading(false);
        showNotification(`${newSafeZones.length} Safe Zones Found Near You!`, "success", 5000);

      },
      (error) => {
        setLoading(false);
        logError(error, 'getUserLocation');
        showNotification("Failed to get location. Please allow location access.", "error");
      }
    );
  };

  const showLocationOnly = async (locationName) => {
    if (typeof locationName !== "string") {
      showNotification("Invalid input! Please enter a location name or coordinates.", "error");
      return;
    }

    // Validate input
    const validation = validateLocationInput(locationName);
    if (!validation.isValid) {
      showNotification(validation.error, "error");
      return;
    }

    let lng, lat;

    try {
      if (locationName.includes(",")) {
        const [lngStr, latStr] = locationName.split(",").map(val => val.trim());
        lng = parseFloat(lngStr);
        lat = parseFloat(latStr);
      } else {
        const locationData = await fetchCoordinates(locationName);
        lng = locationData.lng;
        lat = locationData.lat;
      }

      if (!isNaN(lng) && !isNaN(lat)) {
        markers.forEach(marker => marker.remove());
        setMarkers([]);

        const locationMarker = new mapboxgl.Marker({ color: "rgb(0, 122, 255)" })
          .setLngLat([lng, lat])
          .setPopup(new mapboxgl.Popup().setHTML(`<h3>Location: ${locationName}</h3>`))
          .addTo(map.current);

        setMarkers([locationMarker]);

        map.current.jumpTo({
          center: [lng, lat],
          zoom: 12
        });

        showNotification(`Location found: ${locationName}`, "success", 3000);
      } else {
        showNotification("Invalid coordinates!", "error");
      }
    } catch (error) {
      showNotification(error.message, "error");
    }
  };

  const clearSearch = () => {
    // Clear input
    setInput("");
    
    // Clear markers
    markers.forEach(marker => marker.remove());
    setMarkers([]);
    
    // Clear safe zones
    setSafeZones([]);
    
    // Clear last location
    setLastLocation(null);
    
    // Reset map to default view
    map.current.jumpTo({
      center: [78.9629, 22.5937],
      zoom: 2.2
    });
    
    // Trigger clear search callback
    if (onClearSearch) {
      onClearSearch();
    }
    
    showNotification("Search cleared", "info", 2000);
  };

  return (
    <div>
      <div ref={mapContainer} style={{ width: "100%", height: "100vh" }} />

      {loading && (
        <div style={loadingPopupStyle}>
          <LoadingSpinner message="Processing..." size="small" />
        </div>
      )}

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          duration={notification.duration}
          onClose={clearNotification}
        />
      )}

      <div style={inputContainerStyle}>
        <input
          type="text"
          placeholder="Enter location name or 'longitude,latitude'"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={inputStyle}
          onKeyPress={(e) => e.key === 'Enter' && handleLocationSubmit()}
        />
        <button onClick={() => showLocationOnly(input)} style={buttonStyle}>Show Location</button>
        <button onClick={getUserLocation} style={buttonStyle}>Use My Location & Find Safe Zones</button>
        <button onClick={handleLocationSubmit} style={buttonStyle}>Show Safe Zones</button>
        <button onClick={handleCenter} style={buttonStyle}>Center</button>
        <button onClick={showRouteToNearestShelter} style={buttonStyle}>Show Route to Nearby Shelter</button>
        <button onClick={clearSearch} style={clearButtonStyle}>Clear Search</button>
      </div>
      <GenRes />

      <div style={{
        position: 'absolute',
        top: 30,
        left: 30,
        background: 'rgba(30,30,30,0.85)',
        color: '#fff',
        borderRadius: 8,
        padding: '12px 18px',
        fontSize: 13,
        zIndex: 10,
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
      }}>
        <div style={{display:'flex',alignItems:'center',gap:8}}><span style={{display:'inline-block',width:18,height:18,background:"rgb(0,122,255)",borderRadius:'50%',marginRight:6}}></span> You</div>
        <div style={{display:'flex',alignItems:'center',gap:8,marginTop:4}}><span style={{display:'inline-block',width:18,height:18,background:"rgba(23,219,23,0.7)",borderRadius:'50%',marginRight:6,border:'2px solid #666'}}><span style={{fontSize:'1em',marginLeft:2}}>🏠</span></span> Shelter</div>
        <div style={{display:'flex',alignItems:'center',gap:8,marginTop:4}}><span style={{display:'inline-block',width:30,height:0,borderTop:'4px solid #007AFF',marginRight:6}}></span> Evacuation Route</div>
      </div>
    </div>
  );
};

// Styles
const loadingPopupStyle = {
  position: "absolute",
  top: "5%",
  left: "50%",
  transform: "translate(-50%, 0%)",
  zIndex: 1000,
};

const inputContainerStyle = {
  position: "absolute",
  top: "10px",
  right: "50px",
  zIndex: 1,
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  width: "210px"
};

const inputStyle = {
  padding: "10px",
  borderRadius: "5px",
  border: "1px solid #ccc",
  width: "190px",
  fontSize: "12px"
};

const buttonStyle = {
  padding: "10px 0",
  background: "#007AFF",
  color: "#fff",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
  transition: "background-color 0.2s",
};

const clearButtonStyle = {
  padding: "10px 0",
  background: "#ff0000",
  color: "#fff",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
  transition: "background-color 0.2s",
};

export default Map;
