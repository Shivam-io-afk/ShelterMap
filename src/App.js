import React, { useState, useEffect } from 'react';
import Map from './Map';
import IntegrateAI from './AI';
import EmergencyAlerts from './components/EmergencyAlerts';
import ResourceAvailability from './components/ResourceAvailability';
import './App.css';

function App() {
  const [searchedLocation, setSearchedLocation] = useState(null);
  const [isResourceVisible, setIsResourceVisible] = useState(false);
  const [appLoading, setAppLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  // Track when all main data is loaded
  useEffect(() => {
    let interval;
    if (appLoading) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setAppLoading(false), 400);
            return 100;
          }
          return prev + 2 + Math.random() * 2; // Smooth, slightly random
        });
      }, 30);
    } else {
      setProgress(100); // Ensure 100% is shown until loader is gone
    }
    return () => clearInterval(interval);
  }, [appLoading]);

  // Function to handle location search from Map component
  const handleLocationSearch = (location) => {
    setSearchedLocation(location);
    setIsResourceVisible(true);
  };

  // Function to clear location search
  const clearLocationSearch = () => {
    setSearchedLocation(null);
    setIsResourceVisible(false);
  };

  return (
    <div className="App">
      {appLoading && (
        <div className={`fullscreen-loader${appLoading ? '' : ' slide-out'}`}>
          <div className="loader-content" style={{position:'relative'}}>
            <div className="loader-cube">
              <div className="loader-cube-face front"></div>
              <div className="loader-cube-face back"></div>
              <div className="loader-cube-face right"></div>
              <div className="loader-cube-face left"></div>
              <div className="loader-cube-face top"></div>
              <div className="loader-cube-face bottom"></div>
            </div>
            <div className="loader-particles">
              <span className="loader-particle p1"></span>
              <span className="loader-particle p2"></span>
              <span className="loader-particle p3"></span>
              <span className="loader-particle p4"></span>
              <span className="loader-particle p5"></span>
            </div>
            <div className="loader-percent-hyper">{Math.floor(progress)}%</div>
          </div>
        </div>
      )}
      <Map onLocationSearch={handleLocationSearch} onClearSearch={clearLocationSearch}/>
      <IntegrateAI/>
      <EmergencyAlerts/>
      <ResourceAvailability 
        searchedLocation={searchedLocation} 
        isVisible={isResourceVisible}
      />
    </div>
  );
}

export default App;
