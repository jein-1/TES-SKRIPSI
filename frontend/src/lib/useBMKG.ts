import { useState, useEffect } from "react";

export interface GempaData {
  Tanggal: string;
  Jam: string;
  DateTime: string;
  Coordinates: string; // "Lat,Lng" e.g., "-0.9, 119.8"
  Lintang: string;
  Bujur: string;
  Magnitude: string;
  Kedalaman: string;
  Wilayah: string;
  Potensi: string;
  Dirasakan: string;
  Shakemap: string;
  lat: number;
  lng: number;
}

export function useBMKG() {
  const [gempa, setGempa] = useState<GempaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchBMKG() {
      try {
        setLoading(true);
        // Using corsproxy.io to avoid CORS issues if any, but BMKG often works directly.
        // We will try direct first, fallback if fails.
        const res = await fetch("https://data.bmkg.go.id/DataMKG/TEWS/autogempa.xml");
        const xmlText = await res.text();
        
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");
        
        const gempaNode = xmlDoc.querySelector("gempa");
        if (!gempaNode) throw new Error("No data found");

        const data: Partial<GempaData> = {};
        const fields = ["Tanggal", "Jam", "DateTime", "Coordinates", "Lintang", "Bujur", "Magnitude", "Kedalaman", "Wilayah", "Potensi", "Dirasakan", "Shakemap"];
        
        fields.forEach(field => {
          data[field as keyof GempaData] = gempaNode.querySelector(field)?.textContent || "";
        });

        if (data.Coordinates) {
          const [latStr, lngStr] = data.Coordinates.split(",");
          data.lat = parseFloat(latStr);
          data.lng = parseFloat(lngStr);
        }

        if (mounted) {
          setGempa(data as GempaData);
          setError(null);
        }
      } catch (err: any) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchBMKG();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchBMKG, 5 * 60 * 1000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return { gempa, loading, error };
}
