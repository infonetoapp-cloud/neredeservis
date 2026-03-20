"use client";

import type { CompanyActiveTripSummary } from "@/features/company/company-types";

export function coordToMapPosition(lat: number | null, lng: number | null) {
  if (lat == null || lng == null) {
    return { left: "48%", top: "50%" };
  }
  const normalizedX = ((lng + 180) / 360) * 100;
  const normalizedY = (1 - (lat + 90) / 180) * 100;
  const clampedX = Math.min(84, Math.max(12, normalizedX));
  const clampedY = Math.min(78, Math.max(14, normalizedY));
  return { left: `${clampedX}%`, top: `${clampedY}%` };
}

type LiveOpsMapTripMarkerProps = {
  trip: CompanyActiveTripSummary;
  selectedTripId: string | null;
  hoveredTripId: string | null;
  onSelectTripId: (tripId: string) => void;
};

function LiveOpsMapTripMarker({
  trip,
  selectedTripId,
  hoveredTripId,
  onSelectTripId,
}: LiveOpsMapTripMarkerProps) {
  if (trip.tripId === selectedTripId) {
    return null;
  }

  const position = coordToMapPosition(trip.live.lat, trip.live.lng);
  const isHovered = hoveredTripId === trip.tripId;
  const isDimmed = Boolean(hoveredTripId) && !isHovered;
  const liveClass =
    trip.liveState === "online"
      ? "bg-blue-600 shadow-[0_0_0_6px_rgba(37,99,235,0.14)]"
      : "border-2 border-slate-400 bg-white";

  return (
    <button
      type="button"
      onClick={() => onSelectTripId(trip.tripId)}
      className={`absolute h-2.5 w-2.5 rounded-full transition hover:scale-110 ${liveClass} ${
        isDimmed ? "opacity-35" : "opacity-100"
      } ${isHovered ? "scale-110 ring-2 ring-blue-200" : ""}`}
      style={position}
      title={`${trip.driverName} - ${trip.routeName}`}
      aria-label={`${trip.driverName} seferini sec`}
    />
  );
}

type LiveOpsMapMarkersLayerProps = {
  trips: CompanyActiveTripSummary[];
  selectedTripId: string | null;
  hoveredTripId: string | null;
  onSelectTripId: (tripId: string) => void;
  streamEnabled: boolean;
};

export function LiveOpsMapMarkersLayer({
  trips,
  selectedTripId,
  hoveredTripId,
  onSelectTripId,
  streamEnabled: _streamEnabled,
}: LiveOpsMapMarkersLayerProps) {
  return (
    <>
      {trips.slice(0, 12).map((trip) => (
        <LiveOpsMapTripMarker
          key={trip.tripId}
          trip={trip}
          selectedTripId={selectedTripId}
          hoveredTripId={hoveredTripId}
          onSelectTripId={onSelectTripId}
        />
      ))}
    </>
  );
}
