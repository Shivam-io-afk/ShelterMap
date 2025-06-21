import React, { useState, useEffect, useRef } from 'react';
import './ResourceAvailability.css';

const ResourceAvailability = ({ searchedLocation, isVisible }) => {
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedZone, setSelectedZone] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [isMinimized, setIsMinimized] = useState(false);
    const [position, setPosition] = useState({ x: window.innerWidth - 540, y: 30 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const containerRef = useRef(null);

    // Dragging functionality
    const handleMouseDown = (e) => {
        if (e.target.closest('.resource-controls')) return;
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
        const maxX = window.innerWidth - (isMinimized ? 200 : 380);
        const maxY = window.innerHeight - (isMinimized ? 60 : 600);
        setPosition({
            x: Math.max(0, Math.min(newX, maxX)),
            y: Math.max(0, Math.min(newY, maxY))
        });
    };
    const handleMouseUp = () => {
        setIsDragging(false);
    };
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

    // Fetch nearby shelters when location is searched
    useEffect(() => {
        if (searchedLocation) {
            fetchNearbyShelters(searchedLocation);
        }
    }, [searchedLocation]);

    // Generate nearby shelters based on location
    const generateNearbyShelters = (location) => {
        const locationName = location.name || location;
        const baseLat = location.lat || 28.7041;
        const baseLng = location.lng || 77.1025;
        const governmentShelters = [
            {
                id: 'gov-1',
                zoneName: `${locationName} Government Emergency Center`,
                location: `${locationName} Central Area`,
                coordinates: { lat: baseLat + 0.01, lng: baseLng + 0.01 },
                type: 'Government',
                resources: {
                    food: { available: true, quantity: "Sufficient for 800 people", lastUpdated: "1 hour ago" },
                    water: { available: true, quantity: "15,000 liters", lastUpdated: "30 minutes ago" },
                    medical: { available: true, staff: "8 doctors, 15 nurses", lastUpdated: "15 minutes ago" },
                    shelter: { available: true, capacity: "300 beds", lastUpdated: "1 hour ago" },
                    power: { available: true, status: "Full backup power", lastUpdated: "2 hours ago" },
                    communication: { available: true, status: "Satellite + mobile", lastUpdated: "1 hour ago" }
                },
                status: "Operational",
                contact: "+91-11-23456789",
                lastUpdated: new Date(Date.now() - 1 * 60 * 60 * 1000),
                distance: "0.5 km"
            },
            {
                id: 'gov-2',
                zoneName: `${locationName} District Relief Center`,
                location: `${locationName} North Sector`,
                coordinates: { lat: baseLat - 0.008, lng: baseLng + 0.005 },
                type: 'Government',
                resources: {
                    food: { available: true, quantity: "Sufficient for 500 people", lastUpdated: "2 hours ago" },
                    water: { available: true, quantity: "10,000 liters", lastUpdated: "1 hour ago" },
                    medical: { available: true, staff: "5 doctors, 10 nurses", lastUpdated: "45 minutes ago" },
                    shelter: { available: true, capacity: "200 beds", lastUpdated: "2 hours ago" },
                    power: { available: true, status: "Solar backup", lastUpdated: "3 hours ago" },
                    communication: { available: true, status: "Emergency radio", lastUpdated: "1 hour ago" }
                },
                status: "Operational",
                contact: "+91-11-23456790",
                lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000),
                distance: "1.2 km"
            }
        ];
        const localShelters = [
            {
                id: 'local-1',
                zoneName: `${locationName} Community Center`,
                location: `${locationName} Residential Area`,
                coordinates: { lat: baseLat + 0.005, lng: baseLng - 0.003 },
                type: 'Local',
                resources: {
                    food: { available: true, quantity: "Sufficient for 300 people", lastUpdated: "3 hours ago" },
                    water: { available: true, quantity: "8,000 liters", lastUpdated: "2 hours ago" },
                    medical: { available: false, staff: "No medical staff", lastUpdated: "6 hours ago" },
                    shelter: { available: true, capacity: "150 beds", lastUpdated: "3 hours ago" },
                    power: { available: true, status: "Limited power", lastUpdated: "4 hours ago" },
                    communication: { available: true, status: "Mobile network", lastUpdated: "2 hours ago" }
                },
                status: "Limited Resources",
                contact: "+91-11-23456791",
                lastUpdated: new Date(Date.now() - 3 * 60 * 60 * 1000),
                distance: "0.8 km"
            },
            {
                id: 'local-2',
                zoneName: `${locationName} School Emergency Shelter`,
                location: `${locationName} Education District`,
                coordinates: { lat: baseLat - 0.012, lng: baseLng - 0.008 },
                type: 'Local',
                resources: {
                    food: { available: false, quantity: "Depleted", lastUpdated: "8 hours ago" },
                    water: { available: true, quantity: "5,000 liters", lastUpdated: "5 hours ago" },
                    medical: { available: true, staff: "2 doctors, 5 nurses", lastUpdated: "2 hours ago" },
                    shelter: { available: true, capacity: "100 beds", lastUpdated: "4 hours ago" },
                    power: { available: false, status: "No power", lastUpdated: "8 hours ago" },
                    communication: { available: true, status: "Landline", lastUpdated: "3 hours ago" }
                },
                status: "Critical",
                contact: "+91-11-23456792",
                lastUpdated: new Date(Date.now() - 5 * 60 * 60 * 1000),
                distance: "1.5 km"
            },
            {
                id: 'local-3',
                zoneName: `${locationName} Religious Center`,
                location: `${locationName} Cultural Area`,
                coordinates: { lat: baseLat + 0.015, lng: baseLng + 0.012 },
                type: 'Local',
                resources: {
                    food: { available: true, quantity: "Sufficient for 400 people", lastUpdated: "1 hour ago" },
                    water: { available: true, quantity: "12,000 liters", lastUpdated: "1 hour ago" },
                    medical: { available: true, staff: "3 doctors, 8 nurses", lastUpdated: "30 minutes ago" },
                    shelter: { available: true, capacity: "250 beds", lastUpdated: "2 hours ago" },
                    power: { available: true, status: "Generator backup", lastUpdated: "3 hours ago" },
                    communication: { available: true, status: "WiFi + mobile", lastUpdated: "1 hour ago" }
                },
                status: "Operational",
                contact: "+91-11-23456793",
                lastUpdated: new Date(Date.now() - 1 * 60 * 60 * 1000),
                distance: "1.8 km"
            }
        ];
        return [...governmentShelters, ...localShelters];
    };

    const fetchNearbyShelters = async (location) => {
        setLoading(true);
        setResources([]);
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            const nearbyShelters = generateNearbyShelters(location);
            setResources(nearbyShelters);
        } catch (error) {
            setResources([]);
        } finally {
            setLoading(false);
        }
    };

    const getTotalResourcesCount = () => resources.length;
    const getAvailableResourcesCount = () => resources.filter(resource => Object.values(resource.resources).some(res => res.available)).length;
    const getStatusColor = (status) => {
        switch (status) {
            case 'Operational': return '#28a745';
            case 'Medical Priority': return '#ffc107';
            case 'Limited Resources': return '#fd7e14';
            case 'Critical': return 'rgb(0, 122, 255)';
            default: return '#6c757d';
        }
    };
    const getResourceIcon = (type) => {
        switch (type) {
            case 'food': return '🍽️';
            case 'water': return '💧';
            case 'medical': return '🏥';
            case 'shelter': return '🏠';
            case 'power': return '⚡';
            case 'communication': return '📞';
            default: return '📦';
        }
    };
    const getResourceStatus = (resource) => resource.available ? 'Available' : 'Unavailable';
    const getResourceStatusColor = (available) => available ? '#28a745' : 'rgb(0, 122, 255)';
    const formatTimeAgo = (date) => {
        const now = new Date();
        const diff = now - date;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        if (hours > 0) {
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else if (minutes > 0) {
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        } else {
            return 'Just now';
        }
    };
    const filteredResources = resources.filter(resource => {
        if (selectedZone !== 'all' && resource.zoneName !== selectedZone && resource.type !== selectedZone) return false;
        if (filterType !== 'all') {
            const resourceData = resource.resources[filterType];
            return resourceData && resourceData.available;
        }
        return true;
    });
    const zones = [...new Set(resources.map(r => r.zoneName))];

    // Only render UI if visible (after all hooks and logic)
    if (!isVisible) return null;

    if (loading) {
        return (
            <div 
                className="resource-availability-container"
                style={{
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                    cursor: isDragging ? 'grabbing' : 'grab'
                }}
                ref={containerRef}
            >
                <div className="resource-loading">
                    <div className="loading-spinner"></div>
                    <p>Searching nearby shelters...</p>
                </div>
            </div>
        );
    }

    return (
        <div 
            className={`resource-availability-container ${isMinimized ? 'minimized' : ''}`}
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                cursor: isDragging ? 'grabbing' : 'grab'
            }}
            ref={containerRef}
            onMouseDown={handleMouseDown}
        >
            <div className="resource-header">
                <div className="resource-title">
                    <span className="resource-icon">📦</span>
                    <h3>Nearby Shelters - {searchedLocation?.name || searchedLocation}</h3>
                    {isMinimized && (
                        <div className="resource-counts">
                            <span className="available-count">
                                {getAvailableResourcesCount()}
                            </span>
                            <span className="total-count">
                                {getTotalResourcesCount()}
                            </span>
                        </div>
                    )}
                </div>
                <div className="resource-controls">
                    {!isMinimized && (
                        <>
                            <select 
                                value={selectedZone} 
                                onChange={(e) => setSelectedZone(e.target.value)}
                                className="resource-filter"
                            >
                                <option value="all">All Shelters</option>
                                <option value="Government">Government</option>
                                <option value="Local">Local</option>
                                {zones.map(zone => (
                                    <option key={zone} value={zone}>{zone}</option>
                                ))}
                            </select>
                            <select 
                                value={filterType} 
                                onChange={(e) => setFilterType(e.target.value)}
                                className="resource-filter"
                            >
                                <option value="all">All Resources</option>
                                <option value="food">Food</option>
                                <option value="water">Water</option>
                                <option value="medical">Medical</option>
                                <option value="shelter">Shelter</option>
                                <option value="power">Power</option>
                                <option value="communication">Communication</option>
                            </select>
                        </>
                    )}
                    <button
                        onClick={() => setIsMinimized(!isMinimized)}
                        className="minimize-btn"
                        title={isMinimized ? "Expand Resources" : "Minimize Resources"}
                    >
                        {isMinimized ? "📦" : "🗕"}
                    </button>
                </div>
            </div>
            {!isMinimized && (
                <div className="resource-content">
                    {filteredResources.length === 0 ? (
                        <div className="no-resources">
                            <p>No shelters found near this location</p>
                            <small>Try searching for a different area</small>
                        </div>
                    ) : (
                        <div className="resource-list">
                            {filteredResources.map(resource => (
                                <div key={resource.id} className="resource-item">
                                    <div className="resource-item-header">
                                        <div className="resource-zone-info">
                                            <h4>{resource.zoneName}</h4>
                                            <p className="resource-location">📍 {resource.location}</p>
                                            <p className="resource-contact">📞 {resource.contact}</p>
                                            <p className="resource-distance">🛣️ {resource.distance} away</p>
                                            <span className={`shelter-type ${resource.type.toLowerCase()}`}>
                                                {resource.type === 'Government' ? '🏛️ Government' : '🏘️ Local Community'}
                                            </span>
                                        </div>
                                        <div className="resource-status">
                                            <span 
                                                className="status-badge"
                                                style={{ backgroundColor: getStatusColor(resource.status) }}
                                            >
                                                {resource.status}
                                            </span>
                                            <p className="last-updated">
                                                Updated: {formatTimeAgo(resource.lastUpdated)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="resource-grid">
                                        {Object.entries(resource.resources).map(([type, data]) => (
                                            <div key={type} className="resource-card">
                                                <div className="resource-card-header">
                                                    <span className="resource-type-icon">
                                                        {getResourceIcon(type)}
                                                    </span>
                                                    <span className="resource-type-name">
                                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                                    </span>
                                                    <span 
                                                        className="resource-availability"
                                                        style={{ color: getResourceStatusColor(data.available) }}
                                                    >
                                                        {getResourceStatus(data)}
                                                    </span>
                                                </div>
                                                <div className="resource-details">
                                                    <p className="resource-quantity">
                                                        {data.quantity || data.staff || data.capacity || data.status}
                                                    </p>
                                                    <p className="resource-updated">
                                                        {data.lastUpdated}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ResourceAvailability; 