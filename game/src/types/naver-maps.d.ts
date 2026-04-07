declare global {
  interface Window {
    naver?: {
      maps: {
        Map: new (
          element: HTMLElement,
          options: {
            center: unknown;
            zoom: number;
            zoomControl?: boolean;
            mapDataControl?: boolean;
            scaleControl?: boolean;
          }
        ) => unknown;
        LatLng: new (lat: number, lng: number) => unknown;
        Marker: new (options: {
          position: unknown;
          map: unknown;
          title?: string;
        }) => unknown;
      };
    };
  }
}

export {};
