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
  redraw: () => void;
}

const PIN_COLLISION_PX = 54;
const PIN_SIDE_STEP_PX = 58;

function computeDeclusterOffsets(
  riders: LiveRiderMapMarker[],
  projection: any,
  googleMaps: any
): Map<string, { dx: number; dy: number }> {
  const offsets = new Map<string, { dx: number; dy: number }>();
  if (!projection || !googleMaps || riders.length === 0) return offsets;

  const projected: Array<{ rider: LiveRiderMapMarker; x: number; y: number }> = [];
  for (const r of riders) {
    const lat = Number(r.current_latitude);
    const lng = Number(r.current_longitude);
    if (!isValidCoord(lat, lng)) continue;
    const pt = projection.fromLatLngToDivPixel(new googleMaps.LatLng(lat, lng));
    if (!pt) continue;
    projected.push({ rider: r, x: pt.x, y: pt.y });
  }

  // Stable order so riders keep deterministic side-by-side slots across location ticks
  projected.sort((a, b) => a.rider.id.localeCompare(b.rider.id));

  const visited = new Array<boolean>(projected.length).fill(false);
  for (let i = 0; i < projected.length; i++) {
    if (visited[i]) continue;
    const queue = [i];
    visited[i] = true;
    const cluster: typeof projected = [];

    while (queue.length > 0) {
      const currIdx = queue.shift()!;
      const curr = projected[currIdx];
      cluster.push(curr);
      for (let j = 0; j < projected.length; j++) {
        if (visited[j]) continue;
        const other = projected[j];
        if (Math.hypot(curr.x - other.x, curr.y - other.y) < PIN_COLLISION_PX) {
          visited[j] = true;
          queue.push(j);
        }
      }
    }

    if (cluster.length === 1) {
      offsets.set(cluster[0].rider.id, { dx: 0, dy: 0 });
      continue;
    }

    cluster.sort((a, b) => a.rider.id.localeCompare(b.rider.id));
    const count = cluster.length;
    const cols = count <= 3 ? count : Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);

    cluster.forEach((entry, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const itemsInRow = row === rows - 1 ? count - row * cols : cols;
      const dx = (col - (itemsInRow - 1) / 2) * PIN_SIDE_STEP_PX;
      const dy = (row - (rows - 1) / 2) * PIN_SIDE_STEP_PX;
      offsets.set(entry.rider.id, { dx, dy });
    });
  }

  return offsets;
}

function createRiderOverlay(
  googleMaps: any,
  map: any,
  initialRider: LiveRiderMapMarker,
  initialSelected: boolean,
  onClick: (rider: LiveRiderMapMarker) => void,
  getOffset: (riderId: string) => { dx: number; dy: number },
  onProjectionReady?: () => void
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
      img.referrerPolicy = 'no-referrer';
      img.decoding = 'async';

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
      onProjectionReady?.();
      const lat = Number(currentRider.current_latitude);
      const lng = Number(currentRider.current_longitude);
      if (!isValidCoord(lat, lng)) return;

      const point = projection.fromLatLngToDivPixel(new googleMaps.LatLng(lat, lng));
      if (!point) return;

      const offset = getOffset(currentRider.id);
      containerEl.style.left = `${point.x + offset.dx}px`;
      containerEl.style.top = `${point.y + offset.dy}px`;
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
    redraw() {
      overlay.draw();
    },
    // Expose internal helper only through OverlayHandle
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
  const overlaysRef = useRef<Map<string, OverlayHandle & { getProjection?: () => any }>>(new Map());
  const offsetsRef = useRef<Map<string, { dx: number; dy: number }>>(new Map());
  const trackedRidersRef = useRef<LiveRiderMapMarker[]>([]);
  const onSelectRef = useRef(onSelectRider);
  onSelectRef.current = onSelectRider;

  const fittedCountRef = useRef(0);
  const userInteractedRef = useRef(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const trackedRiders = useMemo(
    () =>
      riders.filter((r) =>
        isValidCoord(r.current_latitude, r.current_longitude)
      ),
    [riders]
  );
  trackedRidersRef.current = trackedRiders;

  // Keep a hidden dummy OverlayView just to read MapCanvasProjection reliably at any time
  const projectionProbeRef = useRef<any>(null);

  const recomputeDeclusteringAndRedraw = (forceRedrawOverlays = true) => {
    const googleMaps = (window as any).google?.maps;
    const projection = projectionProbeRef.current?.getProjection?.();
    if (!googleMaps || !projection) return;
    offsetsRef.current = computeDeclusterOffsets(trackedRidersRef.current, projection, googleMaps);
    if (forceRedrawOverlays) {
      overlaysRef.current.forEach((handle) => handle.redraw());
    }
  };

  // Load Google Maps JavaScript SDK cleanly once
  useEffect(() => {
    const win = window as any;
    const prevAuthFailure = win.gm_authFailure;
    win.gm_authFailure = () => {
      setMapError('Google Maps API key rejected for this domain.');
      if (typeof prevAuthFailure === 'function') prevAuthFailure();
    };

    const initMap = () => {
      const googleMaps = win.google?.maps;
      if (!mapDivRef.current || !googleMaps || mapRef.current) return;

      const mapInstance = new googleMaps.Map(mapDivRef.current, {
        center: DEFAULT_MAP_CENTER,
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        clickableIcons: false,
        gestureHandling: 'greedy',
      });
      mapRef.current = mapInstance;

      class ProjectionProbeOverlay extends googleMaps.OverlayView {
        onAdd() {}
        draw() {
          recomputeDeclusteringAndRedraw(true);
        }
        onRemove() {}
      }
      const probe = new ProjectionProbeOverlay();
      probe.setMap(mapInstance);
      projectionProbeRef.current = probe;

      mapInstance.addListener('dragstart', () => {
        userInteractedRef.current = true;
      });
      mapInstance.addListener('zoom_changed', () => {
        recomputeDeclusteringAndRedraw(true);
      });
      mapInstance.addListener('idle', () => {
        recomputeDeclusteringAndRedraw(true);
      });

      setMapError(null);
      setMapReady(true);
    };

    const onScriptError = () => {
      setMapError('Could not load Google Maps script.');
    };

    if (win.google?.maps) {
      initMap();
      return () => {
        win.gm_authFailure = prevAuthFailure;
        projectionProbeRef.current?.setMap?.(null);
        projectionProbeRef.current = null;
        overlaysRef.current.forEach((o) => o.setMap(null));
        overlaysRef.current.clear();
      };
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-deliva-gmaps="true"]'
    );
    if (existingScript) {
      existingScript.addEventListener('load', initMap);
      existingScript.addEventListener('error', onScriptError);
      return () => {
        win.gm_authFailure = prevAuthFailure;
        existingScript.removeEventListener('load', initMap);
        existingScript.removeEventListener('error', onScriptError);
        projectionProbeRef.current?.setMap?.(null);
        projectionProbeRef.current = null;
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
    script.addEventListener('error', onScriptError);
    document.head.appendChild(script);

    return () => {
      win.gm_authFailure = prevAuthFailure;
      script.removeEventListener('load', initMap);
      script.removeEventListener('error', onScriptError);
      projectionProbeRef.current?.setMap?.(null);
      projectionProbeRef.current = null;
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
    map.fitBounds(bounds, { top: 88, right: 88, bottom: 88, left: 88 });
    googleMaps.event.addListenerOnce(map, 'idle', () => {
      if ((map.getZoom() || 0) > 16) {
        map.setZoom(16);
      }
      recomputeDeclusteringAndRedraw(true);
    });
  };

  // Sync live rider avatar markers onto the map smoothly without recreating existing pins
  useEffect(() => {
    const googleMaps = (window as any).google?.maps;
    const map = mapRef.current;
    if (!mapReady || !googleMaps || !map) return;

    const projection = projectionProbeRef.current?.getProjection?.();
    if (projection) {
      offsetsRef.current = computeDeclusterOffsets(trackedRiders, projection, googleMaps);
    }

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
          (clickedRider) => onSelectRef.current(clickedRider),
          (id) => offsetsRef.current.get(id) || { dx: 0, dy: 0 },
          () => {
            const p = projectionProbeRef.current?.getProjection?.();
            if (p) {
              offsetsRef.current = computeDeclusterOffsets(trackedRidersRef.current, p, googleMaps);
            }
          }
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

    if (
      trackedRiders.length > 0 &&
      (fittedCountRef.current === 0 || (!userInteractedRef.current && trackedRiders.length !== fittedCountRef.current))
    ) {
      fittedCountRef.current = trackedRiders.length;
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
  const unlocatedOnlineCount = riders.filter(
    (r) =>
      !r.is_suspended &&
      (r.is_online || r.is_on_delivery) &&
      !isValidCoord(r.current_latitude, r.current_longitude)
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
          {wsConnected ? 'Live' : 'Connecting'} &bull; {trackedRiders.length} pinned
          {unlocatedOnlineCount > 0 ? ` (${unlocatedOnlineCount} online awaiting GPS)` : ''}
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

      {(mapError || trackedRiders.length === 0) && (
        <div className="dlv-map-empty-pill" role="status">
          {mapError
            ? mapError
            : unlocatedOnlineCount > 0
              ? `${unlocatedOnlineCount} online rider${unlocatedOnlineCount === 1 ? ' is' : 's are'} active — waiting for live GPS coordinates from the rider app.`
              : 'No rider GPS coordinates recorded yet. Profile pins appear live as soon as riders share location.'}
        </div>
      )}
    </div>
  );
};
