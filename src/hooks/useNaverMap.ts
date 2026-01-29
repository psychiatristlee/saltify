import { useEffect, useRef, useState, RefObject } from 'react';

const NAVER_MAPS_CLIENT_ID = 'k1qdvycmmu';
const SCRIPT_ID = 'naver-maps-script';

// 솔트빵 위치 좌표
const STORE_LOCATION = {
  lat: 37.5621326,
  lng: 126.9237369,
};

// Global state to track script loading
let isScriptLoading = false;
let isScriptLoaded = false;
let authError: string | null = null;
const loadCallbacks: (() => void)[] = [];

// 인증 실패 시 호출되는 전역 콜백
if (typeof window !== 'undefined') {
  (window as unknown as { navermap_authFailure: () => void }).navermap_authFailure = function () {
    authError = '네이버 지도 API 인증 실패: 클라이언트 ID 또는 웹 서비스 URL을 확인해주세요';
    console.error(authError);
    console.error('Client ID:', NAVER_MAPS_CLIENT_ID);
    console.error('Current URL:', window.location.origin);
  };
}

function loadNaverMapsScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Already loaded
    if (isScriptLoaded && window.naver?.maps) {
      resolve();
      return;
    }

    // Add callback for when script loads
    loadCallbacks.push(resolve);

    // Already loading - wait for it
    if (isScriptLoading) {
      return;
    }

    // Check if script element already exists
    const existingScript = document.getElementById(SCRIPT_ID);
    if (existingScript) {
      isScriptLoading = true;
      existingScript.addEventListener('load', () => {
        isScriptLoaded = true;
        isScriptLoading = false;
        loadCallbacks.forEach((cb) => cb());
        loadCallbacks.length = 0;
      });
      return;
    }

    // Load script
    isScriptLoading = true;
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${NAVER_MAPS_CLIENT_ID}`;
    script.async = true;

    script.onload = () => {
      isScriptLoaded = true;
      isScriptLoading = false;
      loadCallbacks.forEach((cb) => cb());
      loadCallbacks.length = 0;
    };

    script.onerror = () => {
      isScriptLoading = false;
      console.error('Failed to load Naver Maps script');
      reject(new Error('Failed to load Naver Maps script'));
    };

    document.head.appendChild(script);
  });
}

interface UseNaverMapOptions {
  zoom?: number;
  markerTitle?: string;
}

export function useNaverMap(
  mapRef: RefObject<HTMLDivElement | null>,
  options: UseNaverMapOptions = {}
) {
  const { zoom = 17, markerTitle = 'salt, 0' } = options;
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mapInstance = useRef<unknown>(null);

  useEffect(() => {
    let isMounted = true;

    const initMap = () => {
      if (!mapRef.current || !window.naver?.maps) {
        return;
      }

      try {
        const location = new window.naver.maps.LatLng(
          STORE_LOCATION.lat,
          STORE_LOCATION.lng
        );

        const map = new window.naver.maps.Map(mapRef.current, {
          center: location,
          zoom,
          zoomControl: false,
          mapDataControl: false,
          scaleControl: false,
        });

        new window.naver.maps.Marker({
          position: location,
          map: map,
          title: markerTitle,
        });

        mapInstance.current = map;

        if (isMounted) {
          setIsLoaded(true);
        }
      } catch (err) {
        console.error('Failed to initialize Naver Map:', err);
        if (isMounted) {
          setError('지도를 초기화하는데 실패했습니다');
        }
      }
    };

    loadNaverMapsScript()
      .then(() => {
        if (isMounted) {
          // 인증 오류 체크
          if (authError) {
            setError(authError);
            return;
          }
          initMap();
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [mapRef, zoom, markerTitle]);

  return { isLoaded, error, mapInstance: mapInstance.current };
}

export function openNaverMapPlace() {
  window.open('https://map.naver.com/p/entry/place/2082452936', '_blank');
}
