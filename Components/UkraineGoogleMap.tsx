import React, { useEffect, useMemo, useState } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from '@react-google-maps/api';
import { Card, CardContent, CardHeader, CardTitle } from "../src/components/ui/card";
import { useLanguage } from "../src/contexts/LanguageContext";
import { translateCityName, formatCurrency } from "../src/lib/utils";

// City coordinates (approximate lat/lon) - reusing from previous map
const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "Kyiv": { lat: 50.4501, lng: 30.5234 },
  "Kharkiv": { lat: 49.9935, lng: 36.2304 },
  "Odesa": { lat: 46.4825, lng: 30.7233 },
  "Dnipro": { lat: 48.4647, lng: 35.0462 },
  "Lviv": { lat: 49.8429, lng: 24.0316 },
  "Zaporizhzhia": { lat: 47.8388, lng: 35.1396 },
  "Kryvyi Rih": { lat: 47.9105, lng: 33.4512 },
  "Mykolaiv": { lat: 46.9750, lng: 31.9946 },
  "Vinnytsia": { lat: 49.2331, lng: 28.4682 },
  "Chernihiv": { lat: 51.4982, lng: 31.2893 },
  "Poltava": { lat: 49.5883, lng: 34.5407 },
  "Cherkasy": { lat: 49.4444, lng: 32.0672 },
  "Khmelnytskyi": { lat: 49.4230, lng: 26.9871 },
  "Zhytomyr": { lat: 50.2547, lng: 28.6687 },
  "Sumy": { lat: 50.9077, lng: 34.7981 },
  "Rivne": { lat: 50.6199, lng: 26.2516 },
  "Ivano-Frankivsk": { lat: 48.9226, lng: 24.7097 },
  "Kamianets-Podilskyi": { lat: 48.6788, lng: 26.5879 },
  "Kropyvnytskyi": { lat: 48.5079, lng: 32.2623 },
  "Ternopil": { lat: 49.5535, lng: 25.5948 },
  "Lutsk": { lat: 50.7472, lng: 25.3254 },
  "Simferopol": { lat: 44.9521, lng: 34.1024 },
  "Sevastopol": { lat: 44.6166, lng: 33.5224 },
  "Kherson": { lat: 46.6354, lng: 32.6169 },
  "Donetsk": { lat: 48.0159, lng: 37.8028 },
  "Luhansk": { lat: 48.5740, lng: 39.3078 },
  "Uzhhorod": { lat: 48.6208, lng: 22.2879 },
  "Chernivtsi": { lat: 48.2921, lng: 25.9352 },
  "Bila Tserkva": { lat: 49.7957, lng: 30.1196 },
  "Bucha": { lat: 50.5524, lng: 30.2133 },
  "Irpin": { lat: 50.5186, lng: 30.2513 },
  "Borodyanka": { lat: 50.6456, lng: 29.9329 },
  "Hostomel": { lat: 50.5692, lng: 30.2647 },
  "Izium": { lat: 49.2120, lng: 37.2755 },
  "Mariupol": { lat: 47.0971, lng: 37.5444 },
  "Melitopol": { lat: 46.8550, lng: 35.3693 },
  "Berdiansk": { lat: 46.7567, lng: 36.7869 },
  "Nikopol": { lat: 47.5769, lng: 34.3646 },
  "Sloviansk": { lat: 48.8526, lng: 37.6117 },
  "Kramatorsk": { lat: 48.7390, lng: 37.5772 },
  "Severodonetsk": { lat: 48.9482, lng: 38.4906 },
  "Lysychansk": { lat: 48.9200, lng: 38.4326 },
  "Bakhmut": { lat: 48.5987, lng: 38.0025 },
};

import handHeartIcon from '../src/img/hand-w-heart.svg';

// ... (imports)

// ... (City Coordinates) ...

const desktopContainerStyle = {
  width: '100%',
  height: '500px',
  borderRadius: '0.5rem'
};

const center = {
  lat: 49.0,
  lng: 31.0
};

// Custom map styles including bold 1991 borders
const defaultOptions = {
    disableDefaultUI: true,
    zoomControl: true,
    scrollwheel: false,
    styles: [
        {
          "featureType": "administrative.country",
          "elementType": "geometry.stroke",
          "stylers": [
            { "visibility": "on" },
            { "color": "#1f2937" }, // Dark gray/black for boldness
            { "weight": 3 } // Bold weight
          ]
        },
        {
            "featureType": "administrative.province", // Show oblast borders too for context
            "elementType": "geometry.stroke",
            "stylers": [
              { "visibility": "on" },
              { "color": "#9ca3af" },
              { "weight": 1 } 
            ]
        },
        {
          "featureType": "road",
          "stylers": [{ "visibility": "off" }]
        },
        {
          "featureType": "poi",
          "stylers": [{ "visibility": "off" }]
        },
        // Keep water blue-ish for context
        {
            "featureType": "water",
            "elementType": "geometry",
            "stylers": [
                { "color": "#e0f2fe" }
            ]
        }
      ]
};

interface MapProps {
  data: any[];
}

export default function UkraineGoogleMap({ data }: MapProps) {
  const { t, language } = useLanguage();
  const [selectedCity, setSelectedCity] = useState<any | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const mapOptions = useMemo(() => {
    return {
      ...defaultOptions,
      gestureHandling: isMobile ? 'cooperative' : 'auto'
    } as any;
  }, [isMobile]);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 640);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""
  });

  const cityData = useMemo(() => {
    const agg: Record<string, number> = {};
    data.forEach(item => {
      const cityEn = translateCityName(item.City, 'en');
      const amount = item["Paid EUR"];
      
      if (CITY_COORDINATES[cityEn]) {
         agg[cityEn] = (agg[cityEn] || 0) + amount;
      } else {
         if (CITY_COORDINATES[item.City]) {
            agg[item.City] = (agg[item.City] || 0) + amount;
         }
      }
    });

    return Object.entries(agg).map(([city, amount]) => ({
       city,
       amount,
       position: CITY_COORDINATES[city]
    })).sort((a, b) => b.amount - a.amount);
  }, [data]);

  const [map, setMap] = React.useState(null);

  const onLoad = React.useCallback(function callback(map: any) {
    setMap(map);
  }, []);

  const onUnmount = React.useCallback(function callback(map: any) {
    setMap(null);
  }, []);

  if (!isLoaded) return <div className="h-[500px] w-full bg-gray-100 animate-pulse rounded-lg">Checking Map API...</div>;

  if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
      return (
        <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
               <CardTitle>{t('charts.aidDistributionMap')}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[500px] w-full bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                    <div>
                        <p className="mb-2">Google Maps API Key Missing</p>
                        <p className="text-sm">Please set VITE_GOOGLE_MAPS_API_KEY in your .env file</p>
                    </div>
                </div>
            </CardContent>
        </Card>
      )
  }

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>{t('charts.aidDistributionMap')}</CardTitle>
      </CardHeader>
      <CardContent className="p-0 rounded-b-lg overflow-hidden">
        <GoogleMap
          mapContainerStyle={
            isMobile
              ? { ...desktopContainerStyle, height: '333px' }
              : desktopContainerStyle
          }
          center={center}
          zoom={isMobile ? 5 : 6}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={mapOptions}
        >
          {cityData.map((item) => (
            <MarkerF
              key={item.city}
              position={item.position}
              onClick={() => setSelectedCity(item)}
              icon={{
                url: handHeartIcon, 
                scaledSize: new (window as any).google.maps.Size(isMobile ? 34 : 50, isMobile ? 34 : 50),
                anchor: new (window as any).google.maps.Point(isMobile ? 17 : 25, isMobile ? 17 : 25)
              }}
            />
          ))}

          {selectedCity && (
            <InfoWindowF
              position={selectedCity.position}
              onCloseClick={() => setSelectedCity(null)}
            >
              <div className="p-2 min-w-[150px]">
                <h3 className="font-bold text-gray-900 mb-1">{translateCityName(selectedCity.city, language)}</h3>
                <p className="text-sm text-gray-600">{t('summary.totalAid')}:</p> 
                <p className="text-base font-bold text-green-600">{formatCurrency(selectedCity.amount)}</p>
              </div>
            </InfoWindowF>
          )}
        </GoogleMap>
      </CardContent>
    </Card>
  );
}
