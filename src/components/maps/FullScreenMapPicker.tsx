"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { GeoSearchControl, OpenStreetMapProvider } from "leaflet-geosearch";

// Fix default icon assets for Leaflet in Next.js / Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface FullScreenMapPickerProps {
  latitude?: number;
  longitude?: number;
  onSelect: (info: {
    latitude: number;
    longitude: number;
    address: string;
  }) => void;
  onClose: () => void;
}

/* ── helper: reverse-geocode via Nominatim ── */
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
    );
    const data = await res.json();
    return data.display_name ?? "";
  } catch {
    return "";
  }
}

/* ── sub-component: attach geocoder search bar ── */
function SearchControl({
  onResult,
}: {
  onResult: (lat: number, lng: number, label: string) => void;
}) {
  const map = useMap();

  useEffect(() => {
    const provider = new OpenStreetMapProvider();
    const control = new (GeoSearchControl as any)({
      provider,
      style: "bar",
      autoComplete: true,
      autoCompleteDelay: 300,
      retainZoomLevel: false,
      animateZoom: true,
      searchLabel: "Cari alamat atau nama tempat...",
      keepResult: true,
    });

    map.addControl(control);

    const handler = (e: any) => {
      const { x, y, label } = e.location; // x = lng, y = lat
      onResult(y, x, label);
    };
    map.on("geosearch/showlocation", handler);

    return () => {
      map.removeControl(control);
      map.off("geosearch/showlocation", handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  return null;
}

/* ── sub-component: click-to-place marker ── */
function MapClickHandler({
  onClick,
}: {
  onClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/* ════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════ */
export default function FullScreenMapPicker({
  latitude = -1.244,
  longitude = 116.861,
  onSelect,
  onClose,
}: FullScreenMapPickerProps) {
  const [position, setPosition] = useState<[number, number]>([
    latitude,
    longitude,
  ]);
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const markerRef = useRef<L.Marker | null>(null);

  /* Update address whenever the marker moves */
  const updateAddress = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    const addr = await reverseGeocode(lat, lng);
    setAddress(addr);
    setLoading(false);
  }, []);

  /* marker drag end */
  const handleDragEnd = useCallback(() => {
    const marker = markerRef.current;
    if (!marker) return;
    const { lat, lng } = marker.getLatLng();
    setPosition([lat, lng]);
    updateAddress(lat, lng);
  }, [updateAddress]);

  /* map click */
  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      setPosition([lat, lng]);
      updateAddress(lat, lng);
    },
    [updateAddress]
  );

  /* search result */
  const handleSearchResult = useCallback(
    (lat: number, lng: number, label: string) => {
      setPosition([lat, lng]);
      setAddress(label);
    },
    []
  );

  /* confirm selection */
  const handleConfirm = () => {
    onSelect({
      latitude: position[0],
      longitude: position[1],
      address,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-slate-900/70 backdrop-blur-sm">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b-2 border-black shadow-md z-10">
        <div className="flex items-center gap-3">
          <span className="text-lg">📍</span>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Pilih Lokasi</h2>
            <p className="text-[11px] text-slate-500 max-w-md truncate">
              {loading
                ? "Mencari alamat..."
                : address || "Klik peta atau cari alamat di atas"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-lg border-2 border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="h-9 px-5 rounded-lg bg-primary text-white font-bold text-xs shadow-md hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            ✓ Konfirmasi Lokasi
          </button>
        </div>
      </div>

      {/* ── Coordinate badge ── */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 bg-white border-2 border-black rounded-lg px-4 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3">
        <span className="text-xs font-mono font-bold text-slate-700">
          {position[0].toFixed(5)}, {position[1].toFixed(5)}
        </span>
        <span className="text-[10px] text-slate-400">lat, lng</span>
      </div>

      {/* ── Map ── */}
      <div className="flex-1 relative">
        <MapContainer
          center={position}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker
            position={position}
            draggable
            ref={markerRef}
            eventHandlers={{ dragend: handleDragEnd }}
          >
            <Popup>Tarik marker atau klik peta</Popup>
          </Marker>
          <SearchControl onResult={handleSearchResult} />
          <MapClickHandler onClick={handleMapClick} />
          <RecenterMap position={position} />
        </MapContainer>
      </div>
    </div>
  );
}

/* ── sub-component: recenter map when position state changes ── */
function RecenterMap({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(position, map.getZoom(), { duration: 0.8 });
  }, [map, position]);
  return null;
}
