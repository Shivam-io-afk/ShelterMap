import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import API_CONFIG from '../config/api';
import { handleApiError, logError } from '../utils/errorHandler';
import './EmergencyAlerts.css';

const EmergencyAlerts = () => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [userLocation, setUserLocation] = useState(null);
    const [isFetching, setIsFetching] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [position, setPosition] = useState({ x: 20, y: 150 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const containerRef = useRef(null);

    // Get user's location
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    console.log('Location access denied:', error);
                
                    setUserLocation({ lat: 28.7041, lng: 77.1025 });
                }
            );
        } else {
            
            setUserLocation({ lat: 28.7041, lng: 77.1025 });
        }
    }, []);

    // Dragging functionality
    const handleMouseDown = (e) => {
        if (e.target.closest('.alerts-controls')) return; // Don't drag when clicking controls
        
        setIsDragging(true);
        const rect = containerRef.current.getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;

        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;

        // Keep within viewport bounds
        const maxX = window.innerWidth - (isMinimized ? 200 : 350);
        const maxY = window.innerHeight - (isMinimized ? 60 : 500);

        setPosition({
            x: Math.max(0, Math.min(newX, maxX)),
            y: Math.max(0, Math.min(newY, maxY))
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Add global mouse event listeners
    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset]);

    // Get critical alerts count
    const getCriticalAlertsCount = () => {
        return alerts.filter(alert => alert.severity === 'Critical').length;
    };

    // Get total alerts count
    const getTotalAlertsCount = () => {
        return alerts.length;
    };

    // Mock data for fallback when APIs are unavailable
    const getMockAlerts = () => {
        console.log('🎭 Using mock data fallback...');
        return [
            {
                id: 'mock-weather-1',
                title: 'Heavy Rainfall Warning',
                description: 'Heavy to very heavy rainfall expected in Delhi and surrounding areas. Risk of waterlogging and traffic disruption.',
                severity: 'High',
                type: 'Weather',
                source: 'Mock Data',
                timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
                location: 'Delhi, India',
                icon: '🌧️'
            },
            {
                id: 'mock-flood-1',
                title: 'Flood Alert - Yamuna River',
                description: 'Water levels in Yamuna River are rising. Low-lying areas may be affected. Stay alert and follow evacuation orders.',
                severity: 'Critical',
                type: 'Flood',
                source: 'Mock Data',
                timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
                location: 'Delhi NCR',
                icon: '🌊'
            },
            {
                id: 'mock-earthquake-1',
                title: 'Earthquake Alert',
                description: 'Minor earthquake detected in Northern India. Magnitude 4.2. No immediate threat but stay prepared.',
                severity: 'Medium',
                type: 'Earthquake',
                source: 'Mock Data',
                timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
                location: 'Northern India',
                icon: '🌋'
            }
        ];
    };

    // Fetch alerts from multiple sources
    const fetchAlerts = async () => {
        // Prevent multiple simultaneous API calls
        if (isFetching) {
            console.log('🚫 API call already in progress, skipping...');
            return;
        }

        console.log('🚨 Starting to fetch emergency alerts...');
        setIsFetching(true);
        setLoading(true);
        setError(null);
        
        try {
            const allAlerts = [];
            
            // Try to fetch from Indian government sources first
            console.log('📍 Attempting to fetch from Indian government sources...');
            const indianAlerts = await fetchIndianAlerts();
            console.log('🇮🇳 Indian alerts fetched:', indianAlerts);
            allAlerts.push(...indianAlerts);
            
            // Fallback to RapidAPI weather alerts
            console.log('🌤️ Attempting to fetch weather alerts...');
            const weatherAlerts = await fetchWeatherAlerts();
            console.log('🌤️ Weather alerts fetched:', weatherAlerts);
            allAlerts.push(...weatherAlerts);
            
            // If no alerts from APIs, use mock data
            if (allAlerts.length === 0) {
                console.log('📭 No alerts from APIs, using mock data...');
                const mockAlerts = getMockAlerts();
                allAlerts.push(...mockAlerts);
            }
            
            // Sort alerts by severity and timestamp
            const sortedAlerts = allAlerts.sort((a, b) => {
                const severityOrder = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
                return severityOrder[a.severity] - severityOrder[b.severity];
            });
            
            console.log('📊 Total alerts after processing:', sortedAlerts);
            setAlerts(sortedAlerts);
            setLastUpdated(new Date());
            
        } catch (error) {
            console.error('❌ Error in fetchAlerts:', error);
            const appError = handleApiError(error, 'Emergency Alerts');
            logError(appError, 'fetchAlerts');
            
            // Use mock data as final fallback
            console.log('🆘 Using mock data as final fallback...');
            const mockAlerts = getMockAlerts();
            setAlerts(mockAlerts);
            setLastUpdated(new Date());
            setError('Using sample data - real alerts temporarily unavailable');
        } finally {
            setLoading(false);
            setIsFetching(false);
        }
    };

    // Fetch alerts from Indian government sources
    const fetchIndianAlerts = async () => {
        const indianAlerts = [];
        
        try {
            // Try IMD weather warnings
            try {
                console.log('🌩️ Attempting IMD API call...');
                console.log('🔗 IMD URL:', API_CONFIG.EMERGENCY_ALERTS.IMD.WEATHER_WARNINGS);
                
                const imdResponse = await axios.get(API_CONFIG.EMERGENCY_ALERTS.IMD.WEATHER_WARNINGS, {
                    timeout: 5000
                });
                
                console.log('✅ IMD API Response:', imdResponse);
                console.log('📄 IMD Response Data:', imdResponse.data);
                
                if (imdResponse.data && imdResponse.data.warnings) {
                    console.log('⚠️ IMD Warnings found:', imdResponse.data.warnings);
                    imdResponse.data.warnings.forEach(warning => {
                        const alert = {
                            id: `imd-${warning.id}`,
                            title: warning.title || 'Weather Warning',
                            description: warning.description,
                            severity: getSeverityLevel(warning.level),
                            type: 'Weather',
                            source: 'IMD',
                            timestamp: new Date(warning.timestamp),
                            location: warning.area,
                            icon: getAlertIcon('weather')
                        };
                        console.log('🔔 Processing IMD alert:', alert);
                        indianAlerts.push(alert);
                    });
                } else {
                    console.log('ℹ️ No IMD warnings found in response');
                }
            } catch (error) {
                console.log('❌ IMD API not accessible:', error.message);
                console.log('🔍 IMD Error details:', error);
            }

            // Note: Removed duplicate RapidAPI weather call from here
            // Weather alerts are now handled separately in fetchWeatherAlerts()

        } catch (error) {
            console.error('❌ Error fetching Indian alerts:', error);
        }
        
        console.log('🇮🇳 Final Indian alerts array:', indianAlerts);
        return indianAlerts;
    };

    // Fetch weather alerts from RapidAPI (ONLY ONE CALL)
    const fetchWeatherAlerts = async () => {
        const weatherAlerts = [];
        
        try {
            console.log('🌤️ Attempting weather alerts fetch (SINGLE CALL)...');
            console.log('🔗 Weather API URL:', API_CONFIG.EMERGENCY_ALERTS.RAPIDAPI_WEATHER.WEATHER_ALERTS);
            console.log('🔑 Using RapidAPI Key:', API_CONFIG.EMERGENCY_ALERTS.RAPIDAPI_WEATHER.KEY ? 'Present' : 'Missing');
            console.log('📍 User location:', userLocation);
            
            const response = await axios.get(API_CONFIG.EMERGENCY_ALERTS.RAPIDAPI_WEATHER.WEATHER_ALERTS, {
                params: {
                    q: userLocation ? `${userLocation.lat},${userLocation.lng}` : 'Delhi,India',
                    days: 3
                },
                headers: {
                    'X-RapidAPI-Key': API_CONFIG.EMERGENCY_ALERTS.RAPIDAPI_WEATHER.KEY,
                    'X-RapidAPI-Host': API_CONFIG.EMERGENCY_ALERTS.RAPIDAPI_WEATHER.HOST
                },
                timeout: 5000
            });

            console.log('✅ Weather API Response:', response);
            console.log('📄 Weather Response Data:', response.data);

            if (response.data && response.data.alerts && response.data.alerts.alert) {
                console.log('⚠️ Weather alerts found:', response.data.alerts.alert);
                response.data.alerts.alert.forEach(alert => {
                    const processedAlert = {
                        id: `weather-${Date.now()}-${Math.random()}`,
                        title: alert.headline || 'Weather Alert',
                        description: alert.msg || alert.desc,
                        severity: getSeverityLevel(alert.severity || 'moderate'),
                        type: 'Weather',
                        source: 'WeatherAPI',
                        timestamp: new Date(alert.effective),
                        location: alert.areas || 'India',
                        icon: getAlertIcon('weather')
                    };
                    console.log('🔔 Processing weather alert:', processedAlert);
                    weatherAlerts.push(processedAlert);
                });
            } else {
                console.log('ℹ️ No weather alerts found in response');
            }
        } catch (error) {
            console.log('❌ Weather alerts fetch failed:', error.message);
            console.log('🔍 Weather Error details:', error);
            
            // Handle specific error types
            if (error.response) {
                const status = error.response.status;
                console.log(`📊 HTTP Status Code: ${status}`);
                
                if (status === 429) {
                    console.log('⏰ Rate limit exceeded - too many requests');
                    console.log('💡 Consider upgrading your RapidAPI plan or waiting before retrying');
                    
                    // Add a fallback alert about rate limiting
                    weatherAlerts.push({
                        id: `rate-limit-${Date.now()}`,
                        title: 'API Rate Limit Reached',
                        description: 'Weather alerts temporarily unavailable due to API rate limits. Please try again later.',
                        severity: 'Medium',
                        type: 'System',
                        source: 'WeatherAPI',
                        timestamp: new Date(),
                        location: 'India',
                        icon: '⚠️'
                    });
                } else if (status === 401) {
                    console.log('🔐 Unauthorized - check your API key');
                } else if (status === 403) {
                    console.log('🚫 Forbidden - API access denied');
                } else if (status >= 500) {
                    console.log('🔧 Server error - try again later');
                }
            } else if (error.request) {
                console.log('🌐 Network error - no response received');
            } else {
                console.log('❓ Other error:', error.message);
            }
        }
        
        console.log('🌤️ Final weather alerts array:', weatherAlerts);
        return weatherAlerts;
    };

    // Helper function to get severity level
    const getSeverityLevel = (level) => {
        const levelMap = {
            'critical': 'Critical',
            'severe': 'Critical',
            'extreme': 'Critical',
            'high': 'High',
            'moderate': 'Medium',
            'low': 'Low',
            'minor': 'Low'
        };
        const mappedLevel = levelMap[level?.toLowerCase()] || 'Medium';
        console.log(`🏷️ Severity mapping: "${level}" -> "${mappedLevel}"`);
        return mappedLevel;
    };

    // Helper function to get alert icon
    const getAlertIcon = (type) => {
        const iconMap = {
            'weather': '🌩️',
            'earthquake': '🌋',
            'flood': '🌊',
            'tsunami': '🌊',
            'cyclone': '🌀',
            'fire': '🔥',
            'landslide': '⛰️',
            'general': '⚠️'
        };
        const icon = iconMap[type] || '⚠️';
        console.log(`🎯 Icon mapping: "${type}" -> "${icon}"`);
        return icon;
    };

    // Format timestamp
    const formatTimestamp = (timestamp) => {
        const now = new Date();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    // Get severity color
    const getSeverityColor = (severity) => {
        const colorMap = {
            'Critical': 'rgb(0, 122, 255)',
            'High': '#fd7e14',
            'Medium': '#ffc107',
            'Low': '#28a745'
        };
        return colorMap[severity] || '#6c757d';
    };

    // Auto-refresh alerts every 10 minutes
    useEffect(() => {
        fetchAlerts();
        
        // Increase interval to reduce API calls and avoid rate limits
        const interval = setInterval(fetchAlerts, 10 * 60 * 1000); // 10 minutes instead of 5
        
        return () => clearInterval(interval);
    }, [userLocation]);

    // Manual refresh with debounce
    const handleRefresh = () => {
        if (isFetching) {
            console.log('🚫 Refresh blocked - API call already in progress');
            return;
        }
        console.log('🔄 Manual refresh triggered');
        fetchAlerts();
    };

    // Toggle minimization
    const toggleMinimize = () => {
        setIsMinimized(!isMinimized);
    };

    if (loading && alerts.length === 0) {
        return (
            <div 
                className="emergency-alerts-container"
                ref={containerRef}
                style={{
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                    cursor: isDragging ? 'grabbing' : 'grab'
                }}
                onMouseDown={handleMouseDown}
            >
                <div className="alerts-header">
                    <h3>🚨 Emergency Alerts</h3>
                    <div className="alerts-controls">
                        <button onClick={handleRefresh} className="refresh-btn" disabled>
                            🔄 Loading...
                        </button>
                    </div>
                </div>
                <div className="alerts-loading">
                    <div className="loading-spinner"></div>
                    <p>Fetching emergency alerts...</p>
                </div>
            </div>
        );
    }

    return (
        <div 
            className={`emergency-alerts-container ${isMinimized ? 'minimized' : ''}`}
            ref={containerRef}
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                cursor: isDragging ? 'grabbing' : 'grab'
            }}
            onMouseDown={handleMouseDown}
        >
            <div className="alerts-header">
                <div className="alerts-title">
                    <h3>🚨 Emergency Alerts</h3>
                    {isMinimized && (
                        <div className="alert-counts">
                            <span className="critical-count" title="Critical Alerts">
                                {getCriticalAlertsCount()}
                            </span>
                            <span className="total-count" title="Total Alerts">
                                {getTotalAlertsCount()}
                            </span>
                        </div>
                    )}
                </div>
                <div className="alerts-controls">
                    {!isMinimized && lastUpdated && (
                        <span className="last-updated">
                            Updated: {formatTimestamp(lastUpdated)}
                        </span>
                    )}
                    <button onClick={handleRefresh} className="refresh-btn" disabled={isFetching}>
                        {isFetching ? '⏳' : '🔄'}
                    </button>
                    <button onClick={toggleMinimize} className="minimize-btn" title={isMinimized ? "Expand Alerts" : "Minimize Alerts"}>
                        {isMinimized ? '⬆️' : '⬇️'}
                    </button>
                </div>
            </div>

            {!isMinimized && (
                <>
                    {error && (
                        <div className="alert-error">
                            <p>{error}</p>
                            <button onClick={handleRefresh}>Try Again</button>
                        </div>
                    )}

                    <div className="alerts-content">
                        {alerts.length === 0 ? (
                            <div className="no-alerts">
                                <p>✅ No active emergency alerts</p>
                                <small>Your area appears to be safe at the moment</small>
                            </div>
                        ) : (
                            <div className="alerts-list">
                                {alerts.map((alert) => (
                                    <div 
                                        key={alert.id} 
                                        className={`alert-item severity-${alert.severity.toLowerCase()}`}
                                        style={{ borderLeftColor: getSeverityColor(alert.severity) }}
                                    >
                                        <div className="alert-header">
                                            <span className="alert-icon">{alert.icon}</span>
                                            <div className="alert-info">
                                                <h4>{alert.title}</h4>
                                                <div className="alert-meta">
                                                    <span className="alert-type">{alert.type}</span>
                                                    <span className="alert-severity" style={{ color: getSeverityColor(alert.severity) }}>
                                                        {alert.severity}
                                                    </span>
                                                    <span className="alert-time">{formatTimestamp(alert.timestamp)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="alert-description">{alert.description}</p>
                                        <div className="alert-footer">
                                            <span className="alert-location">📍 {alert.location}</span>
                                            <span className="alert-source">Source: {alert.source}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default EmergencyAlerts;