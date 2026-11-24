import React, { useEffect, useMemo, useRef, useState } from 'react';
import { resolveSupportMediaUrl } from '../lib/supportService';

export interface LiveRiderMapMarker {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  user_type?: string;
  is_online?: boolean;
  is_on_delivery?: boolean;
  is_activated?: boolean;
  is_suspended?: boolean;
  vehicle_type?: string;
  vehicle_plate?: string;
  current_latitude?: number;
  current_longitude?: number;
  heading?: number;
  speed?: number;
  last_location_at?: string;
}

export interface LiveRiderMapProps {
  riders: LiveRiderMapMarker[];
  selectedRiderId?: string | null;
  wsConnected?: boolean;
  onSelectRider: (rider: LiveRiderMapMarker) => void;
}

const DEFAULT_MAP_CENTER = { lat: 4.8156, lng: 7.0498 }; // Port Harcourt default center
const FALLBACK_GOOGLE_MAPS_KEY = 'AIzaSyA93AXAvSL-Ir0DGLxMSGiXgprzmG-jJLQ';

function getMapsApiKey(): string {
  const fromEnv = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').trim();
  return fromEnv || FALLBACK_GOOGLE_MAPS_KEY;
}

function isValidCoord(lat?: number | null, lng?: number | null): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    !(lat === 0 && lng === 0) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  );
}

function getRiderDisplayName(rider: LiveRiderMapMarker): string {
  const full = `${rider.first_name || ''} ${rider.last_name || ''}`.trim();
  return full || rider.email || 'Deliva Rider';
}

function getRiderInitials(rider: LiveRiderMapMarker): string {
  const f = (rider.first_name || '').trim().charAt(0).toUpperCase();
  const l = (rider.last_name || '').trim().charAt(0).toUpperCase();
  if (f && l) return `${f}${l}`;
  if (f) return f;
  if (rider.email) return rider.email.trim().charAt(0).toUpperCase();
  return 'R';
}

function getRiderStatusMeta(rider: LiveRiderMapMarker): {
  ringClass: string;
  label: string;
  dotColor: string;
  tooltipColor: string;
} {
  if (rider.is_suspended) {
    return {
      ringClass: 'dlv-map-pin-suspended',
      label: 'Suspended',
      dotColor: '#DC2626',
      tooltipColor: '#FCA5A5',
    };
  }
  if (rider.is_on_delivery) {
    return {
      ringClass: 'dlv-map-pin-delivery',
      label: 'On Delivery',
      dotColor: '#F97316',
      tooltipColor: '#FDBA74',
    };
  }
  if (rider.is_online) {
    return {
      ringClass: 'dlv-map-pin-online',
      label: 'Available',
      dotColor: '#16A34A',
      tooltipColor: '#86EFAC',
    };
  }
  return {
    ringClass: 'dlv-map-pin-offline',
    label: 'Offline',
    dotColor: '#94A3B8',
    tooltipColor: '#CBD5E1',
  };
}

interface OverlayHandle {
  setData: (rider: LiveRiderMapMarker, selected: boolean) => void;
  setMap: (map: any) => void;
}

function createRiderOverlay(
  googleMaps: any,
  map: any,
  initialRider: LiveRiderMapMarker,
  initialSelected: boolean,
  onClick: (rider: LiveRiderMapMarker) => void
): OverlayHandle {
  let currentRider = initialRider;
  let isSelected = initialSelected;
  let containerEl: HTMLDivElement | null = null;
  let avatarWrapEl: HTMLDivElement | null = null;
  let imgEl: HTMLImageElement | null = null;
  let initialsEl: HTMLSpanElement | null = null;
  let tooltipEl: HTMLDivElement | null = null;
  let nameSpanEl: HTMLSpanElement | null = null;
  let statusTagEl: HTMLSpanElement | null = null;
  let statusDotEl: HTMLSpanElement | null = null;
  let pulseDotEl: HTMLSpanElement | null = null;
  let lastAvatarSrc = '';

  const syncDom = () => {
    if (!containerEl || !avatarWrapEl || !tooltipEl || !nameSpanEl || !statusDotEl || !statusTagEl) {
      return;
    }

    const status = getRiderStatusMeta(currentRider);
    avatarWrapEl.className = `dlv-map-pin-avatar ${status.ringClass}${
      isSelected ? ' dlv-map-pin-selected' : ''
    }`;
    containerEl.className = `dlv-map-pin-wrap${isSelected ? ' dlv-map-pin-wrap-selected' : ''}`;
    containerEl.style.setProperty('--dlv-pin-color', status.dotColor);

    const fullName = getRiderDisplayName(currentRider);
    nameSpanEl.textContent = fullName;
    statusTagEl.textContent = status.label;
    statusTagEl.style.color = status.tooltipColor;
    statusDotEl.style.background = status.dotColor;
    tooltipEl.setAttribute('aria-label', `${fullName} — ${status.label}`);

    if (pulseDotEl) {
      pulseDotEl.style.background = status.dotColor;
      pulseDotEl.style.display = currentRider.is_online || currentRider.is_on_delivery ? 'block' : 'none';
    }

    const avatarSrc = resolveSupportMediaUrl(currentRider.avatar_url);
    if (imgEl && initialsEl) {
      initialsEl.textContent = getRiderInitials(currentRider);
      if (avatarSrc) {
        if (lastAvatarSrc !== avatarSrc) {
          lastAvatarSrc = avatarSrc;
          imgEl.src = avatarSrc;
          imgEl.style.display = 'block';
          initialsEl.style.display = 'none';
        }
      } else {
        lastAvatarSrc = '';
        imgEl.removeAttribute('src');
        imgEl.style.display = 'none';
        initialsEl.style.display = 'flex';
      }
    }
  };

  class RiderAvatarOverlay extends googleMaps.OverlayView {
    onAdd() {
      const root = document.createElement('div');
      root.className = 'dlv-map-pin-wrap';

      const tooltip = document.createElement('div');
      tooltip.className = 'dlv-map-pin-tooltip';

      const dot = document.createElement('span');
      dot.className = 'dlv-map-tooltip-dot';

      const nameSpan = document.createElement('span');
      nameSpan.className = 'dlv-map-tooltip-name';

      const statusTag = document.createElement('span');
      statusTag.className = 'dlv-map-tooltip-status';

      tooltip.appendChild(dot);
      tooltip.appendChild(nameSpan);
      tooltip.appendChild(statusTag);

      const avatarWrap = document.createElement('div');
      avatarWrap.className = 'dlv-map-pin-avatar';

      const img = document.createElement('img');
      img.alt = '';
      img.className = 'dlv-map-pin-img';
      img.draggable = false;

      const initials = document.createElement('span');
      initials.className = 'dlv-map-pin-initials';

      img.onerror = () => {
        img.style.display = 'none';
        initials.style.display = 'flex';
      };

      const pulseDot = document.createElement('span');
      pulseDot.className = 'dlv-map-pin-dot';

      avatarWrap.appendChild(img);
      avatarWrap.appendChild(initials);

      const pointer = document.createElement('div');
      pointer.className = 'dlv-map-pin-pointer';

      root.appendChild(tooltip);
      root.appendChild(avatarWrap);
      root.appendChild(pulseDot);
      root.appendChild(pointer);

      const stopBubble = (e: Event) => e.stopPropagation();
      root.addEventListener('mousedown', stopBubble);
      root.addEventListener('pointerdown', stopBubble);
      root.addEventListener('touchstart', stopBubble, { passive: true });
      root.addEventListener('click', (e: Event) => {
        e.stopPropagation();
        onClick(currentRider);
      });

      containerEl = root;
      avatarWrapEl = avatarWrap;
      imgEl = img;
      initialsEl = initials;
      tooltipEl = tooltip;
      nameSpanEl = nameSpan;
      statusTagEl = statusTag;
      statusDotEl = dot;
      pulseDotEl = pulseDot;

      syncDom();

      const panes = this.getPanes();
      panes?.overlayMouseTarget?.appendChild(root);
    }

    draw() {
      if (!containerEl) return;
      const projection = this.getProjection();
      if (!projection) return;
      const lat = Number(currentRider.current_latitude);
      const lng = Number(currentRider.current_longitude);
      if (!isValidCoord(lat, lng)) return;

      const point = projection.fromLatLngToDivPixel(new googleMaps.LatLng(lat, lng));
      if (!point) return;

      containerEl.style.left = `${point.x}px`;
      containerEl.style.top = `${point.y}px`;
    }

    onRemove() {
      if (containerEl?.parentNode) {
        containerEl.parentNode.removeChild(containerEl);
      }
      containerEl = null;
      avatarWrapEl = null;
      imgEl = null;
      initialsEl = null;
      tooltipEl = null;
      nameSpanEl = null;
      statusDotEl = null;
      pulseDotEl = null;
    }
  }

  const overlay = new RiderAvatarOverlay();
  overlay.setMap(map);

  return {
    setData(nextRider: LiveRiderMapMarker, nextSelected: boolean) {
      currentRider = nextRider;
      isSelected = nextSelected;
      syncDom();
      overlay.draw();
    },
    setMap(targetMap: any) {
      overlay.setMap(targetMap);
    },
  };
}

export const LiveRiderMap: React.FC<LiveRiderMapProps> = ({
  riders,
  selectedRiderId = null,
  wsConnected = false,
  onSelectRider,
}) => {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const overlaysRef = useRef<Map<string, OverlayHandle>>(new Map());
  const onSelectRef = useRef(onSelectRider);
  onSelectRef.current = onSelectRider;

  const hasAutoFittedRef = useRef(false);
  const [mapReady, setMapReady] = useState(false);

  const trackedRiders = useMemo(
    () =>
      riders.filter((r) =>
        isValidCoord(r.current_latitude, r.current_longitude)
      ),
    [riders]
  );

  // Load Google Maps JavaScript SDK cleanly once
  useEffect(() => {
    const initMap = () => {
      const googleMaps = (window as any).google?.maps;
      if (!mapDivRef.current || !googleMaps || mapRef.current) return;

      mapRef.current = new googleMaps.Map(mapDivRef.current, {
        center: DEFAULT_MAP_CENTER,
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        clickableIcons: false,
        gestureHandling: 'greedy',
      });
      setMapReady(true);
    };

    if ((window as any).google?.maps) {
      initMap();
      return () => {
        overlaysRef.current.forEach((o) => o.setMap(null));
        overlaysRef.current.clear();
      };
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-deliva-gmaps="true"]'
    );
    if (existingScript) {
      existingScript.addEventListener('load', initMap);
      return () => {
        existingScript.removeEventListener('load', initMap);
        overlaysRef.current.forEach((o) => o.setMap(null));
        overlaysRef.current.clear();
      };
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      getMapsApiKey()
    )}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    script.setAttribute('data-deliva-gmaps', 'true');
    script.addEventListener('load', initMap);
    document.head.appendChild(script);

    return () => {
      script.removeEventListener('load', initMap);
      overlaysRef.current.forEach((o) => o.setMap(null));
      overlaysRef.current.clear();
    };
  }, []);

  const fitAllTrackedRiders = () => {
    const googleMaps = (window as any).google?.maps;
    const map = mapRef.current;
    if (!googleMaps || !map || trackedRiders.length === 0) return;

    if (trackedRiders.length === 1) {
      const only = trackedRiders[0];
      map.panTo({
        lat: Number(only.current_latitude),
        lng: Number(only.current_longitude),
      });
      map.setZoom(15);
      return;
    }

    const bounds = new googleMaps.LatLngBounds();
    trackedRiders.forEach((r) => {
      bounds.extend({
        lat: Number(r.current_latitude),
        lng: Number(r.current_longitude),
      });
    });
    map.fitBounds(bounds, { top: 72, right: 72, bottom: 72, left: 72 });
  };

  // Sync live rider avatar markers onto the map smoothly without recreating existing pins
  useEffect(() => {
    const googleMaps = (window as any).google?.maps;
    const map = mapRef.current;
    if (!mapReady || !googleMaps || !map) return;

    const activeIds = new Set<string>();
    for (const rider of trackedRiders) {
      activeIds.add(rider.id);
      const isSelected = rider.id === selectedRiderId;
      const existing = overlaysRef.current.get(rider.id);
      if (existing) {
        existing.setData(rider, isSelected);
      } else {
        const handle = createRiderOverlay(
          googleMaps,
          map,
          rider,
          isSelected,
          (clickedRider) => onSelectRef.current(clickedRider)
        );
        overlaysRef.current.set(rider.id, handle);
      }
    }

    overlaysRef.current.forEach((handle, id) => {
      if (!activeIds.has(id)) {
        handle.setMap(null);
        overlaysRef.current.delete(id);
      }
    });

    if (!hasAutoFittedRef.current && trackedRiders.length > 0) {
      hasAutoFittedRef.current = true;
      fitAllTrackedRiders();
    }
  }, [mapReady, trackedRiders, selectedRiderId]);

  const onDeliveryCount = trackedRiders.filter((r) => !r.is_suspended && r.is_on_delivery).length;
  const availableCount = trackedRiders.filter(
    (r) => !r.is_suspended && !r.is_on_delivery && r.is_online
  ).length;
  const offlineCount = trackedRiders.filter(
    (r) => !r.is_suspended && !r.is_on_delivery && !r.is_online
  ).length;

  return (
    <div className="da-map-canvas-shell">
      <div ref={mapDivRef} style={{ width: '100%', height: '100%' }} />

      <div className="dlv-map-hud">
        <span
          className="dlv-map-hud-dot"
          style={{ background: wsConnected ? '#16A34A' : '#F59E0B' }}
        />
        <span className="dlv-map-hud-text">
          {wsConnected ? 'Live' : 'Connecting'} &bull; {trackedRiders.length} rider
          {trackedRiders.length === 1 ? '' : 's'}
        </span>

        <span className="dlv-map-hud-sep" aria-hidden="true" />

        <div className="dlv-map-hud-legend" aria-label="Rider delivery status ring legend">
          <span className="dlv-map-legend-item">
            <span className="dlv-map-legend-ring dlv-map-legend-delivery" />
            <span>On Delivery ({onDeliveryCount})</span>
          </span>
          <span className="dlv-map-legend-item">
            <span className="dlv-map-legend-ring dlv-map-legend-online" />
            <span>Not on Delivery ({availableCount})</span>
          </span>
          <span className="dlv-map-legend-item">
            <span className="dlv-map-legend-ring dlv-map-legend-offline" />
            <span>Offline ({offlineCount})</span>
          </span>
        </div>

        {trackedRiders.length > 0 && (
          <button
            type="button"
            className="dlv-map-hud-btn"
            onClick={fitAllTrackedRiders}
          >
            Fit All
          </button>
        )}
      </div>
    </div>
  );
};
