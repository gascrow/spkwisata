"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Alternative } from "@/types";

interface TourismMapProps {
  alternatives: Alternative[];
  onSelectAlternative?: (alt: Alternative) => void;
}

export default function TourismMap({ alternatives, onSelectAlternative }: TourismMapProps) {
  // Center of Balikpapan
  const centerPosition: [number, number] = [-1.24, 116.86];

  useEffect(() => {
    // Fix Leaflet marker icon issue in NextJS
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    });
  }, []);

  // Create custom marker icons based on cluster color
  const createClusterIcon = (color: string) => {
    return L.divIcon({
      html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3); transition: transform 0.2s;" class="hover:scale-125"></div>`,
      className: "custom-div-icon",
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });
  };

  return (
    <div className="h-[600px] w-full relative rounded-xl overflow-hidden border border-slate-200/80 shadow-md">
      <MapContainer
        center={centerPosition}
        zoom={12}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {alternatives
          .filter((alt) => alt.latitude && alt.longitude)
          .map((alt) => {
            const clusterColor = alt.cluster?.color || "#3b82f6";
            const customIcon = createClusterIcon(clusterColor);

            return (
              <Marker
                key={alt.id}
                position={[Number(alt.latitude), Number(alt.longitude)]}
                icon={customIcon}
              >
                <Popup className="custom-popup">
                  <div className="p-2 min-w-[220px]">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                        {alt.code}
                      </span>
                      <span
                        className="text-[9px] font-bold px-2 py-0.5 rounded text-white"
                        style={{ backgroundColor: clusterColor }}
                      >
                        {alt.cluster?.name.split(",")[0] || "Wisata"}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 mb-1 leading-snug">
                      {alt.name}
                    </h3>
                    <p className="text-xs text-slate-500 mb-2 leading-relaxed italic">
                      {alt.address || "Tidak ada alamat"}
                    </p>

                    {/* Criteria list */}
                    {alt.scores && alt.scores.length > 0 && (
                      <div className="border-t border-slate-100 pt-2">
                        <span className="text-[10px] font-bold text-slate-400 block mb-1">
                          NILAI KRITERIA:
                        </span>
                        <div className="grid grid-cols-4 gap-1">
                          {alt.scores.map((sc) => (
                            <div
                              key={sc.id}
                              className="text-[10px] font-semibold bg-slate-55 flex flex-col items-center justify-center p-1 rounded border border-slate-100 font-mono"
                            >
                              <span className="text-slate-400 text-[8px]">
                                {sc.criteria?.code || "K"}
                              </span>
                              <span className="text-slate-700 font-bold">
                                {sc.score_value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {onSelectAlternative && (
                      <button
                        onClick={() => onSelectAlternative(alt)}
                        className="mt-3 w-full text-center text-[10px] font-bold py-1 bg-slate-900 hover:bg-slate-800 text-white rounded transition-all cursor-pointer"
                      >
                        Detail Objek Wisata
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>
    </div>
  );
}
