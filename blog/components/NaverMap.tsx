'use client';

import { useEffect, useRef } from 'react';

const NAVER_MAPS_CLIENT_ID = 'k1qdvycmmu';
const STORE_LOCATION = { lat: 37.5621326, lng: 126.9237369 };

declare global {
  interface Window {
    naver: {
      maps: {
        LatLng: new (lat: number, lng: number) => unknown;
        Map: new (el: HTMLElement, opts: unknown) => unknown;
        Marker: new (opts: unknown) => unknown;
      };
    };
  }
}

let scriptLoaded = false;
let scriptLoading = false;
const callbacks: (() => void)[] = [];

function loadScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (scriptLoaded && window.naver?.maps) {
      resolve();
      return;
    }
    callbacks.push(resolve);
    if (scriptLoading) return;
    scriptLoading = true;

    const script = document.createElement('script');
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${NAVER_MAPS_CLIENT_ID}`;
    script.async = true;
    script.onload = () => {
      scriptLoaded = true;
      scriptLoading = false;
      callbacks.forEach((cb) => cb());
      callbacks.length = 0;
    };
    script.onerror = () => {
      scriptLoading = false;
      reject(new Error('Failed to load Naver Maps'));
    };
    document.head.appendChild(script);
  });
}

export default function NaverMap() {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    loadScript().then(() => {
      if (!mounted || !mapRef.current || !window.naver?.maps) return;
      const location = new window.naver.maps.LatLng(STORE_LOCATION.lat, STORE_LOCATION.lng);
      const map = new window.naver.maps.Map(mapRef.current, {
        center: location,
        zoom: 17,
        zoomControl: false,
        mapDataControl: false,
        scaleControl: false,
      });
      new window.naver.maps.Marker({ position: location, map, title: 'salt, 0' });
    });
    return () => { mounted = false; };
  }, []);

  return <div ref={mapRef} style={{ width: '100%', height: 200, borderRadius: 12, overflow: 'hidden', background: '#f5f5f5' }} />;
}

export function openNaverMapPlace() {
  window.open('https://map.naver.com/p/entry/place/2082452936', '_blank');
}
