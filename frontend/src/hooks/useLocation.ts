import { useState, useCallback } from 'react';

interface LocationResult {
  latitude: number;
  longitude: number;
  locationName: string;
}

export function useLocation() {
  const [isLocating, setIsLocating] = useState(false);

  const getCoordinates = useCallback((): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocationがブラウザでサポートされていません'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        (error) => {
          let msg = '位置情報の取得に失敗しました';
          if (error.code === error.PERMISSION_DENIED) {
            msg = '位置情報の利用が許可されていません';
          }
          reject(new Error(msg));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  }, []);

  const getReverseGeocode = useCallback(async (lat: number, lon: number): Promise<string> => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Insta-Imme/1.0.0 (https://github.com/kmmz532/Insta-Imme)',
        },
      });

      if (!res.ok) return '';

      const data = await res.json();
      const addr = data.address || {};
      
      // 日本語の地名として分かりやすい単位を組み立てる (市区町村名 + 地区名)
      const state = addr.province || addr.state || '';
      const city = addr.city || addr.town || addr.city_district || addr.ward || '';
      const suburb = addr.suburb || addr.neighbourhood || '';
      
      const parts = [state, city, suburb].filter(Boolean);
      return parts.join(' ') || '現在地';
    } catch {
      return '現在地';
    }
  }, []);

  const fetchLocation = useCallback(async (): Promise<LocationResult | null> => {
    setIsLocating(true);
    try {
      const pos = await getCoordinates();
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      const name = await getReverseGeocode(lat, lon);
      return {
        latitude: lat,
        longitude: lon,
        locationName: name,
      };
    } catch (err) {
      console.error(err);
      return null;
    } finally {
      setIsLocating(false);
    }
  }, [getCoordinates, getReverseGeocode]);

  return {
    fetchLocation,
    isLocating,
  };
}
