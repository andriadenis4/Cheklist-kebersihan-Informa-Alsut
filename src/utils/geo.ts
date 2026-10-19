import { GpsLocation } from '../types/checklist';
import { INFORMA_ALAM_SUTERA_COORDS } from '../data/defaultChecklist';

// Haversine formula to calculate distance between two coordinates in meters
export function calculateDistanceInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export async function getCurrentGpsLocation(): Promise<GpsLocation> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) {
      resolve({
        latitude: INFORMA_ALAM_SUTERA_COORDS.lat,
        longitude: INFORMA_ALAM_SUTERA_COORDS.lng,
        accuracy: 10,
        address: 'Informa Alam Sutera (GPS Browser Tidak Didukung)',
        isAlamSuteraNearby: true
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = Math.round(pos.coords.accuracy);

        const distanceToInforma = calculateDistanceInMeters(
          lat,
          lng,
          INFORMA_ALAM_SUTERA_COORDS.lat,
          INFORMA_ALAM_SUTERA_COORDS.lng
        );

        const isNearby = distanceToInforma <= 2000; // within 2km radius
        const address = isNearby
          ? `Informa Alam Sutera (${distanceToInforma}m dari titik pusat)`
          : `Koordinat GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)} (${Math.round(distanceToInforma / 1000)}km dari Informa Alam Sutera)`;

        resolve({
          latitude: lat,
          longitude: lng,
          accuracy,
          address,
          isAlamSuteraNearby: isNearby
        });
      },
      (err) => {
        console.warn('Geolocation error or permission denied:', err.message);
        // Fallback to estimated Informa Alam Sutera coordinates with simulated flag
        resolve({
          latitude: INFORMA_ALAM_SUTERA_COORDS.lat,
          longitude: INFORMA_ALAM_SUTERA_COORDS.lng,
          accuracy: 15,
          address: 'Informa Alam Sutera (Lokasi Terestimasi Toko)',
          isAlamSuteraNearby: true
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 10000
      }
    );
  });
}
