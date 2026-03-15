import React, { useMemo } from "react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import { Card, CardContent, CardHeader, CardTitle } from "../src/components/ui/card";
import { useLanguage } from "../src/contexts/LanguageContext";
import { translateCityName } from "../src/lib/utils";

// Ukraine TopoJSON URL
const GEO_URL = "https://raw.githubusercontent.com/deldersveld/topojson/master/countries/ukraine/ukraine-comprehensive.json";

// City coordinates (approximate lat/lon)
const CITY_COORDINATES: Record<string, [number, number]> = {
  "Kyiv": [30.5234, 50.4501],
  "Kharkiv": [36.2304, 49.9935],
  "Odesa": [30.7233, 46.4825],
  "Dnipro": [35.0462, 48.4647],
  "Lviv": [24.0316, 49.8429],
  "Zaporizhzhia": [35.1396, 47.8388],
  "Kryvyi Rih": [33.4512, 47.9105],
  "Mykolaiv": [31.9946, 46.9750],
  "Vinnytsia": [28.4682, 49.2331],
  "Chernihiv": [31.2893, 51.4982],
  "Poltava": [34.5407, 49.5883],
  "Cherkasy": [32.0672, 49.4444],
  "Khmelnytskyi": [26.9871, 49.4230],
  "Zhytomyr": [28.6687, 50.2547],
  "Sumy": [34.7981, 50.9077],
  "Rivne": [26.2516, 50.6199],
  "Ivano-Frankivsk": [24.7097, 48.9226],
  "Kamianets-Podilskyi": [26.5879, 48.6788],
  "Kropyvnytskyi": [32.2623, 48.5079],
  "Ternopil": [25.5948, 49.5535],
  "Lutsk": [25.3254, 50.7472],
  "Simferopol": [34.1024, 44.9521], // Crimea
  "Sevastopol": [33.5224, 44.6166],
  "Kherson": [32.6169, 46.6354],
  "Donetsk": [37.8028, 48.0159],
  "Luhansk": [39.3078, 48.5740],
  "Uzhhorod": [22.2879, 48.6208],
  "Chernivtsi": [25.9352, 48.2921],
  "Bila Tserkva": [30.1196, 49.7957],
  "Bucha": [30.2133, 50.5524],
  "Irpin": [30.2513, 50.5186],
  "Borodyanka": [29.9329, 50.6456],
  "Hostomel": [30.2647, 50.5692],
  "Izium": [37.2755, 49.2120],
  "Mariupol": [37.5444, 47.0971],
  "Melitopol": [35.3693, 46.8550],
  "Berdiansk": [36.7869, 46.7567],
  "Nikopol": [34.3646, 47.5769],
  "Sloviansk": [37.6117, 48.8526],
  "Kramatorsk": [37.5772, 48.7390],
  "Severodonetsk": [38.4906, 48.9482],
  "Lysychansk": [38.4326, 48.9200],
  "Bakhmut": [38.0025, 48.5987],
};


interface MapProps {
  data: any[];
}

export default function UkraineMap({ data }: MapProps) {
  const { t, language } = useLanguage();

  // Aggregate data by city (using English names for coordinates lookup)
  const cityData = useMemo(() => {
    const agg: Record<string, number> = {};
    data.forEach(item => {
      // We assume item.City is in Ukrainian in the JSON usually? 
      // Or is it mixed? The JSON shows Ukrainian names mostly e.g. "Біла Церква"
      // We need to map Ukrainian names to our coordinate keys (English usually)
      // Actually, translateCityName handles UA -> EN mapping if language is EN.
      // Let's force translate to EN to find coordinates.
      
      // But wait, translateCityName takes (city, lang).
      // If we pass 'en', we get English name.
      // Let's try to map the JSON city name to our coordinate keys.
      
      const cityEn = translateCityName(item.City, 'en');
      const amount = item["Paid EUR"];
      
      if (CITY_COORDINATES[cityEn]) {
         agg[cityEn] = (agg[cityEn] || 0) + amount;
      } else {
         // Try direct match or fallback
         if (CITY_COORDINATES[item.City]) {
            agg[item.City] = (agg[item.City] || 0) + amount;
         }
      }
    });

    // Convert to array
    return Object.entries(agg).map(([city, amount]) => ({
       city,
       amount,
       coords: CITY_COORDINATES[city]
    })).sort((a, b) => b.amount - a.amount);
  }, [data]);

  const maxAmount = Math.max(...cityData.map(d => d.amount), 1);
  const sizeScale = scaleLinear().domain([0, maxAmount]).range([4, 15]);

  return (
    <Card className="col-span-1 lg:col-span-2">
       <CardHeader>
        <CardTitle>{t('charts.aidDistributionMap') || "Aid Distribution Map"}</CardTitle>
      </CardHeader>
      <CardContent className="h-[400px] w-full bg-blue-50/30 rounded-lg overflow-hidden relative">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            center: [31.1656, 49.0], // Center of Ukraine approx
            scale: 2400 
          }}
          className="w-full h-full"
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#E0E7FF" // Light blue fill
                  stroke="#3B82F6" // Blue stroke
                  strokeWidth={0.5}
                  style={{
                    default: { outline: "none" },
                    hover: { fill: "#BFDBFE", outline: "none" },
                    pressed: { outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>

          {cityData.map(({ city, amount, coords }) => (
            <Marker key={city} coordinates={coords as [number, number]}>
               <g
                 className="cursor-pointer group"
                 onMouseEnter={() => {}} // Tooltip logic could go here
               >
                 {/* Pin Icon - Hand with Heart */}
                 <image 
                   href="/src/img/hand-w-heart.svg" 
                   x={-sizeScale(amount)} 
                   y={-sizeScale(amount) * 2} 
                   height={sizeScale(amount) * 3} 
                   width={sizeScale(amount) * 3} 
                 />
                 <title>{`${translateCityName(city, language)}: €${Math.round(amount)}`}</title>
               </g>
            </Marker>
          ))}
        </ComposableMap>
        
        {/* Legend / Overlay */}
        <div className="absolute bottom-4 right-4 bg-white/90 p-2 rounded shadow text-xs">
           <div className="flex items-center gap-2">
             <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
             <span>Higher Aid</span>
           </div>
        </div>
      </CardContent>
    </Card>
  );
}
