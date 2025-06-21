// API Configuration
const API_CONFIG = {
  MAPBOX: {
    ACCESS_TOKEN: process.env.REACT_APP_MAPBOX_ACCESS_TOKEN || "pk.eyJ1IjoibG9oYTk1OTkiLCJhIjoiY203a2xjb3R3MDFpdDJqcXh2MWxrZGJkcyJ9.NIxghDBNthqZrFDY3ktFBQ",
    GEOCODING_URL: "https://api.mapbox.com/geocoding/v5/mapbox.places",
    DIRECTIONS_URL: "https://api.mapbox.com/directions/v5/mapbox/walking"
  },
  RAPIDAPI: {
    KEY: process.env.REACT_APP_RAPIDAPI_KEY || "e96d6b75f7mshd8f69e27b03c9b7p1d4ab2jsn670509866fc4",
    HOST: process.env.REACT_APP_RAPIDAPI_HOST || "free-chatgpt-api.p.rapidapi.com",
    CHAT_URL: "https://free-chatgpt-api.p.rapidapi.com/chat-completion-one"
  },
  OPENAI: {
    API_KEY: process.env.REACT_APP_OPENAI_API_KEY
  },
  // Indian Emergency Alert APIs
  EMERGENCY_ALERTS: {
    // India Meteorological Department (IMD) - Weather warnings
    IMD: {
      BASE_URL: "https://mausam.imd.gov.in/restapi/",
      WEATHER_WARNINGS: "https://mausam.imd.gov.in/restapi/weather/warning",
      CYCLONE_ALERTS: "https://mausam.imd.gov.in/restapi/weather/cyclone",
      FLOOD_ALERTS: "https://mausam.imd.gov.in/restapi/weather/flood"
    },
    // National Disaster Management Authority (NDMA)
    NDMA: {
      BASE_URL: "https://ndma.gov.in/api/",
      DISASTER_ALERTS: "https://ndma.gov.in/api/alerts",
      PREPAREDNESS: "https://ndma.gov.in/api/preparedness"
    },
    // Indian National Centre for Ocean Information Services (INCOIS)
    INCOIS: {
      BASE_URL: "https://incois.gov.in/api/",
      TSUNAMI_ALERTS: "https://incois.gov.in/api/tsunami",
      STORM_SURGE: "https://incois.gov.in/api/storm-surge"
    },
    // Central Water Commission (CWC) - Flood alerts
    CWC: {
      BASE_URL: "https://cwc.gov.in/api/",
      FLOOD_FORECAST: "https://cwc.gov.in/api/flood-forecast",
      WATER_LEVELS: "https://cwc.gov.in/api/water-levels"
    },
    // Geological Survey of India (GSI) - Earthquake alerts
    GSI: {
      BASE_URL: "https://gsi.gov.in/api/",
      EARTHQUAKE_ALERTS: "https://gsi.gov.in/api/earthquakes"
    },
    // Alternative: RapidAPI weather and disaster services
    RAPIDAPI_WEATHER: {
      KEY: process.env.REACT_APP_RAPIDAPI_KEY,
      WEATHER_ALERTS: "https://weatherapi-com.p.rapidapi.com/v1/alerts.json",
      HOST: "weatherapi-com.p.rapidapi.com"
    },
    // News API for disaster news
    NEWS_API: {
      KEY: process.env.REACT_APP_NEWS_API_KEY,
      BASE_URL: "https://newsapi.org/v2/",
      DISASTER_NEWS: "https://newsapi.org/v2/everything"
    }
  }
};

export default API_CONFIG; 