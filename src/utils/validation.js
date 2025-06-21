// Validation utilities
export const validateCoordinates = (lng, lat) => {
  if (typeof lng !== 'number' || typeof lat !== 'number') {
    return { isValid: false, error: 'Coordinates must be numbers' };
  }
  
  if (lng < -180 || lng > 180) {
    return { isValid: false, error: 'Longitude must be between -180 and 180' };
  }
  
  if (lat < -90 || lat > 90) {
    return { isValid: false, error: 'Latitude must be between -90 and 90' };
  }
  
  return { isValid: true };
};

export const validateLocationInput = (input) => {
  if (!input || typeof input !== 'string') {
    return { isValid: false, error: 'Location input must be a non-empty string' };
  }
  
  const trimmedInput = input.trim();
  if (trimmedInput.length === 0) {
    return { isValid: false, error: 'Location input cannot be empty' };
  }
  
  // Check if input is coordinates (longitude,latitude format)
  if (trimmedInput.includes(',')) {
    const parts = trimmedInput.split(',').map(part => part.trim());
    if (parts.length !== 2) {
      return { isValid: false, error: 'Coordinates must be in format: longitude,latitude' };
    }
    
    const lng = parseFloat(parts[0]);
    const lat = parseFloat(parts[1]);
    
    if (isNaN(lng) || isNaN(lat)) {
      return { isValid: false, error: 'Invalid coordinate values' };
    }
    
    return validateCoordinates(lng, lat);
  }
  
  // Check if input is a valid location name
  if (trimmedInput.length < 2) {
    return { isValid: false, error: 'Location name must be at least 2 characters long' };
  }
  
  return { isValid: true };
};

export const validateSafeZoneData = (safeZone) => {
  const requiredFields = ['name', 'lng', 'lat', 'capacity'];
  
  for (const field of requiredFields) {
    if (!(field in safeZone)) {
      return { isValid: false, error: `Missing required field: ${field}` };
    }
  }
  
  const coordValidation = validateCoordinates(safeZone.lng, safeZone.lat);
  if (!coordValidation.isValid) {
    return coordValidation;
  }
  
  if (typeof safeZone.capacity !== 'number' || safeZone.capacity < 0) {
    return { isValid: false, error: 'Capacity must be a positive number' };
  }
  
  if (typeof safeZone.name !== 'string' || safeZone.name.trim().length === 0) {
    return { isValid: false, error: 'Safe zone name must be a non-empty string' };
  }
  
  return { isValid: true };
};

export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  return input.trim().replace(/[<>]/g, ''); // Basic XSS prevention
}; 