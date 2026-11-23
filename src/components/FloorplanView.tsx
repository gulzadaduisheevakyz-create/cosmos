import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Map,
  Move,
  Eye,
  Plus,
  RotateCw,
  Trash2,
  Copy,
  Printer,
  Download,
  RotateCcw,
  Grid3X3,
  Ruler,
  ZoomIn,
  ZoomOut,
  CheckCircle2,
  Clock,
  Wrench,
  Sparkles,
  UserCheck,
  Building2,
  Loader2,
  Magnet,
  X,
} from 'lucide-react';
import {
  Employee,
  FloorplanItem,
  FloorplanStationStatus,
  FloorplanStationType,
  FloorplanZone,
  SalonFloorplan,
  SystemSettings,
} from '../types';
import { db } from '../services/db';
import { exportElementToPdf } from '../services/pdfService';
import { ConfirmModal } from './ConfirmModal';

interface FloorplanViewProps {
  employees: Employee[];
  settings: SystemSettings;
  onOpenEmployee?: (empId: string) => void;
  onRefresh?: () => void;
}

const PIXELS_PER_METER = 60; // Base scale: 1m = 60px in SVG coordinate space

const STATION_PALETTE: {
  type: FloorplanStationType;
  label: string;
  defaultCode: string;
  width: number;
  height: number;
  defaultStatus: FloorplanStationStatus;
}[] = [
  { type: 'hair-chair', label: 'Hair Styling Chair', defaultCode: 'H-NEW', width: 1.35, height: 1.4, defaultStatus: 'Available' },
  { type: 'shampoo-bowl', label: 'Backwash Shampoo', defaultCode: 'W-NEW', width: 1.5, height: 1.4, defaultStatus: 'Available' },
  { type: 'manicure-table', label: 'Manicure Table', defaultCode: 'N-NEW', width: 1.75, height: 1.25, defaultStatus: 'Available' },
  { type: 'pedicure-spa', label: 'Pedicure Spa Chair', defaultCode: 'P-NEW', width: 1.55, height: 1.65, defaultStatus: 'Available' },
  { type: 'treatment-bed', label: 'Lash / Facial Bed', defaultCode: 'L-NEW', width: 1.35, height: 2.1, defaultStatus: 'Available' },
  { type: 'spray-tan-booth', label: 'Spray Tan Booth', defaultCode: 'T-NEW', width: 1.55, height: 1.65, defaultStatus: 'Available' },
  { type: 'reception-desk', label: 'Reception Desk', defaultCode: 'REC', width: 2.4, height: 1.0, defaultStatus: 'Facility' },
  { type: 'waiting-sofa', label: 'Waiting Sofa', defaultCode: 'LNG', width: 2.1, height: 1.1, defaultStatus: 'Facility' },
  { type: 'retail-display', label: 'Retail Display', defaultCode: 'RTL', width: 0.75, height: 2.0, defaultStatus: 'Facility' },
  { type: 'color-bar', label: 'Color Mixing Bar', defaultCode: 'CLR', width: 2.2, height: 1.0, defaultStatus: 'Facility' },
  { type: 'office-desk', label: 'Office Desk', defaultCode: 'OFF', width: 1.8, height: 1.2, defaultStatus: 'Facility' },
  { type: 'restroom', label: 'Restroom Suite', defaultCode: 'WC', width: 2.6, height: 1.8, defaultStatus: 'Facility' },
  { type: 'door', label: 'Door Opening', defaultCode: 'DR', width: 1.2, height: 0.4, defaultStatus: 'Facility' },
  { type: 'partition', label: 'Partition Wall', defaultCode: 'WL', width: 2.0, height: 0.25, defaultStatus: 'Facility' },
];

const STATUS_META: Record<
  FloorplanStationStatus,
  { stroke: string; fill: string; text: string; badgeBg: string; label: string }
> = {
  Available: {
    stroke: '#16A34A',
    fill: '#F0FDF4',
    text: 'text-emerald-700',
    badgeBg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    label: 'Available',
  },
  'In Service': {
    stroke: '#D97706',
    fill: '#FFFBEB',
    text: 'text-amber-700',
    badgeBg: 'bg-amber-50 border-amber-200 text-amber-800',
    label: 'In Service',
  },
  Reserved: {
    stroke: '#2563EB',
    fill: '#EFF6FF',
    text: 'text-blue-700',
    badgeBg: 'bg-blue-50 border-blue-200 text-blue-700',
    label: 'Reserved',
  },
  Maintenance: {
    stroke: '#DC2626',
    fill: '#FEF2F2',
    text: 'text-rose-700',
    badgeBg: 'bg-rose-50 border-rose-200 text-rose-700',
    label: 'Maintenance',
  },
  Facility: {
    stroke: '#64748B',
    fill: '#F8FAFC',
    text: 'text-slate-600',
    badgeBg: 'bg-slate-100 border-slate-200 text-slate-600',
    label: 'Facility',
  },
};

const FLOOR_FINISH_FILL: Record<FloorplanZone['floorFinish'], string> = {
  marble: '#FAF9F6',
  oak: '#F8F5EE',
  terrazzo: '#F5F7FA',
  slate: '#F1F5F9',
  tile: '#F4F4F5',
};

/**
 * Renders top-down architectural CAD symbols inside the item's local coordinate box (0..w, 0..h).
 */
const StationArchitecturalSymbol: React.FC<{
  item: FloorplanItem;
  w: number;
  h: number;
  stroke: string;
}> = ({ item, w, h, stroke }) => {
  const pad = 6;
  const innerW = Math.max(w - pad * 2, 12);
  const innerH = Math.max(h - pad * 2, 12);
  const cx = w / 2;
  const cy = h / 2;

  switch (item.type) {
    case 'hair-chair':
      return (
        <g stroke={stroke} strokeWidth={1.4} fill="none">
          {/* Vanity mirror counter along top */}
          <rect x={pad} y={pad} width={innerW} height={10} rx={2} fill="#FFFFFF" />
          <line x1={pad + 8} y1={pad + 3} x2={w - pad - 8} y2={pad + 3} strokeWidth={2} />
          {/* Swivel styling chair */}
          <circle cx={cx} cy={cy + 8} r={Math.min(innerW, innerH) * 0.28} fill="#FFFFFF" />
          {/* Armrests & backrest */}
          <path
            d={`M ${cx - 18} ${cy + 2} L ${cx - 18} ${cy + 16} Q ${cx} ${cy + 24} ${cx + 18} ${cy + 16} L ${cx + 18} ${cy + 2}`}
            strokeWidth={2}
          />
          {/* Footrest ring */}
          <line x1={cx - 10} y1={cy - 10} x2={cx + 10} y2={cy - 10} strokeWidth={1.2} />
        </g>
      );

    case 'shampoo-bowl':
      return (
        <g stroke={stroke} strokeWidth={1.4} fill="none">
          {/* Ceramic washbasin */}
          <ellipse cx={cx} cy={pad + 14} rx={Math.min(innerW * 0.34, 20)} ry={12} fill="#FFFFFF" />
          <circle cx={cx} cy={pad + 13} r={3} fill={stroke} />
          {/* Reclining lounge seat */}
          <rect
            x={cx - innerW * 0.32}
            y={pad + 28}
            width={innerW * 0.64}
            height={Math.max(innerH - 32, 20)}
            rx={6}
            fill="#FFFFFF"
          />
          <line
            x1={cx - innerW * 0.25}
            y1={pad + 42}
            x2={cx + innerW * 0.25}
            y2={pad + 42}
            strokeDasharray="3 2"
          />
        </g>
      );

    case 'manicure-table':
      return (
        <g stroke={stroke} strokeWidth={1.4} fill="none">
          {/* Client chair top */}
          <circle cx={cx} cy={pad + 10} r={8} fill="#FFFFFF" />
          {/* Manicure desk */}
          <rect x={pad + 4} y={cy - 12} width={innerW - 8} height={24} rx={4} fill="#FFFFFF" />
          {/* UV Lamp box on desk */}
          <rect x={pad + 12} y={cy - 6} width={16} height={12} rx={2} />
          {/* Technician stool bottom */}
          <circle cx={cx} cy={h - pad - 10} r={8} fill="#FFFFFF" />
        </g>
      );

    case 'pedicure-spa':
      return (
        <g stroke={stroke} strokeWidth={1.4} fill="none">
          {/* Spa foot basin */}
          <rect x={cx - innerW * 0.3} y={pad + 2} width={innerW * 0.6} height={22} rx={6} fill="#FFFFFF" />
          <ellipse cx={cx} cy={pad + 13} rx={innerW * 0.22} ry={7} />
          {/* Plush pedicure throne */}
          <rect
            x={cx - innerW * 0.36}
            y={pad + 27}
            width={innerW * 0.72}
            height={Math.max(innerH - 30, 24)}
            rx={6}
            fill="#FFFFFF"
          />
          <line x1={cx - innerW * 0.36} y1={pad + 40} x2={cx + innerW * 0.36} y2={pad + 40} />
        </g>
      );

    case 'treatment-bed':
      return (
        <g stroke={stroke} strokeWidth={1.4} fill="none">
          {/* Bed frame */}
          <rect x={pad + 2} y={pad + 2} width={innerW - 4} height={innerH - 4} rx={6} fill="#FFFFFF" />
          {/* Headrest pillow */}
          <rect x={pad + 10} y={pad + 8} width={innerW - 20} height={16} rx={4} />
          {/* Folded drape line */}
          <line x1={pad + 4} y1={pad + 34} x2={w - pad - 4} y2={pad + 34} strokeDasharray="4 3" />
          {/* Lash/Facial tech stool at head */}
          <circle cx={cx} cy={pad - 1} r={5} fill="#FFFFFF" />
        </g>
      );

    case 'spray-tan-booth':
      return (
        <g stroke={stroke} strokeWidth={1.4} fill="none">
          <rect x={pad + 2} y={pad + 2} width={innerW - 4} height={innerH - 4} rx={12} fill="#FFFFFF" />
          <circle cx={cx} cy={cy} r={Math.min(innerW, innerH) * 0.28} strokeDasharray="4 3" />
          <path d={`M ${cx - 8} ${h - pad - 2} A 8 8 0 0 1 ${cx + 8} ${h - pad - 2}`} />
        </g>
      );

    case 'reception-desk':
      return (
        <g stroke={stroke} strokeWidth={1.5} fill="none">
          <path
            d={`M ${pad} ${pad + 4} L ${w - pad} ${pad + 4} L ${w - pad} ${h - pad} L ${pad} ${h - pad} Z`}
            fill="#FFFFFF"
          />
          <rect x={pad + 14} y={pad + 10} width={28} height={14} rx={2} />
          <rect x={w - pad - 42} y={pad + 10} width={28} height={14} rx={2} />
          <line x1={pad + 6} y1={h - pad - 5} x2={w - pad - 6} y2={h - pad - 5} strokeDasharray="3 2" />
        </g>
      );

    case 'waiting-sofa':
      return (
        <g stroke={stroke} strokeWidth={1.4} fill="none">
          <rect x={pad} y={pad} width={innerW} height={innerH} rx={6} fill="#FFFFFF" />
          {/* Back cushion & armrests */}
          <rect x={pad + 3} y={pad + 3} width={innerW - 6} height={12} rx={3} />
          <line x1={cx - innerW * 0.16} y1={pad + 16} x2={cx - innerW * 0.16} y2={h - pad - 3} />
          <line x1={cx + innerW * 0.16} y1={pad + 16} x2={cx + innerW * 0.16} y2={h - pad - 3} />
        </g>
      );

    case 'retail-display':
      return (
        <g stroke={stroke} strokeWidth={1.3} fill="none">
          <rect x={pad} y={pad} width={innerW} height={innerH} rx={2} fill="#FFFFFF" />
          <line x1={pad} y1={h * 0.33} x2={w - pad} y2={h * 0.33} />
          <line x1={pad} y1={h * 0.66} x2={w - pad} y2={h * 0.66} />
        </g>
      );

    case 'color-bar':
      return (
        <g stroke={stroke} strokeWidth={1.4} fill="none">
          <rect x={pad} y={pad} width={innerW} height={innerH} rx={3} fill="#FFFFFF" />
          {/* Lab sink */}
          <rect x={pad + 10} y={pad + 8} width={28} height={Math.max(innerH - 16, 12)} rx={3} />
          <circle cx={pad + 24} cy={cy} r={2.5} fill={stroke} />
          {/* Bottle grid */}
          <line x1={pad + 48} y1={cy} x2={w - pad - 10} y2={cy} strokeDasharray="4 3" />
        </g>
      );

    case 'office-desk':
      return (
        <g stroke={stroke} strokeWidth={1.4} fill="none">
          <rect x={pad} y={pad + 4} width={innerW} height={Math.max(innerH - 14, 20)} rx={3} fill="#FFFFFF" />
          <rect x={cx - 18} y={pad + 10} width={36} height={10} rx={1.5} />
          <circle cx={cx} cy={h - pad - 4} r={7} fill="#FFFFFF" />
        </g>
      );

    case 'restroom':
      return (
        <g stroke={stroke} strokeWidth={1.4} fill="none">
          <rect x={pad} y={pad} width={innerW} height={innerH} rx={4} fill="#FFFFFF" />
          {/* Toilet symbol */}
          <rect x={pad + 12} y={pad + 8} width={22} height={10} rx={2} />
          <ellipse cx={pad + 23} cy={pad + 28} rx={9} ry={11} />
          {/* Vanity sink */}
          <rect x={w - pad - 44} y={pad + 8} width={34} height={22} rx={3} />
          <ellipse cx={w - pad - 27} cy={pad + 19} rx={10} ry={6} />
        </g>
      );

    case 'door':
      return (
        <g stroke={stroke} strokeWidth={1.6} fill="none">
          {/* Double or single door swing arc */}
          <line x1={0} y1={4} x2={w / 2} y2={4 + w * 0.35} strokeWidth={2} />
          <line x1={w} y1={4} x2={w / 2} y2={4 + w * 0.35} strokeWidth={2} />
          <path d={`M 0 4 A ${w / 2} ${w / 2} 0 0 0 ${w / 2} ${4 + w / 2}`} strokeDasharray="3 3" strokeWidth={1.1} />
          <path d={`M ${w} 4 A ${w / 2} ${w / 2} 0 0 1 ${w / 2} ${4 + w / 2}`} strokeDasharray="3 3" strokeWidth={1.1} />
        </g>
      );

    case 'partition':
      return (
        <g stroke={stroke} strokeWidth={1.5} fill="#334155">
          <rect x={0} y={2} width={w} height={Math.max(h - 4, 6)} rx={1} />
        </g>
      );

    default:
      return <rect x={pad} y={pad} width={innerW} height={innerH} rx={4} stroke={stroke} fill="#FFFFFF" />;
  }
};

export const FloorplanView: React.FC<FloorplanViewProps> = ({
  employees,
  settings,
  onOpenEmployee,
  onRefresh,
}) => {
  const [floorplan, setFloorplan] = useState<SalonFloorplan>(() => db.getFloorplan());
  const [mode, setMode] = useState<'operations' | 'editor'>('operations');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<string>('ALL');
  const [showGrid, setShowGrid] = useState(true);
  const [showDimensions, setShowDimensions] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [showPaletteModal, setShowPaletteModal] = useState(false);

  // Dragging state for Layout Editor
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [dragState, setDragState] = useState<{
    itemId: string;
    startClientX: number;
    startClientY: number;
    origX: number;
    origY: number;
  } | null>(null);

  const activeEmployees = useMemo(
    () => employees.filter((e) => e.status !== 'Unemployed'),
    [employees]
  );

  const employeeMap = useMemo(() => {
    const map: Record<string, Employee> = {};
    employees.forEach((e) => {
      map[e.employeeId] = e;
    });
    return map;
  }, [employees]);

  const selectedItem = useMemo(
    () => floorplan.items.find((it) => it.id === selectedItemId) || null,
    [floorplan.items, selectedItemId]
  );

  const persistFloorplan = async (next: SalonFloorplan) => {
    setFloorplan(next);
    await db.saveFloorplan(next);
    if (onRefresh) onRefresh();
  };

  // Pointer drag handlers for Editor mode
  useEffect(() => {
    if (!dragState) return;

    const handlePointerMove = (ev: PointerEvent) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const totalSvgWidth = floorplan.widthMeters * PIXELS_PER_METER;
      const scaleX = rect.width / totalSvgWidth;

      const dxMeters = (ev.clientX - dragState.startClientX) / (PIXELS_PER_METER * scaleX);
      const dyMeters = (ev.clientY - dragState.startClientY) / (PIXELS_PER_METER * scaleX);

      setFloorplan((prev) => {
        const target = prev.items.find((i) => i.id === dragState.itemId);
        if (!target) return prev;

        let nextX = dragState.origX + dxMeters;
        let nextY = dragState.origY + dyMeters;

        if (snapToGrid) {
          nextX = Math.round(nextX * 4) / 4;
          nextY = Math.round(nextY * 4) / 4;
        } else {
          nextX = Math.round(nextX * 20) / 20;
          nextY = Math.round(nextY * 20) / 20;
        }

        // Clamp inside salon bounds
        nextX = Math.max(0, Math.min(prev.widthMeters - target.width, nextX));
        nextY = Math.max(0, Math.min(prev.heightMeters - target.height, nextY));

        // Detect enclosing zone
        const centerX = nextX + target.width / 2;
        const centerY = nextY + target.height / 2;
        const matchingZone = prev.zones.find(
          (z) =>
            centerX >= z.x &&
            centerX <= z.x + z.width &&
            centerY >= z.y &&
            centerY <= z.y + z.height
        );

        return {
          ...prev,
          items: prev.items.map((item) =>
            item.id === dragState.itemId
              ? {
                  ...item,
                  x: Number(nextX.toFixed(2)),
                  y: Number(nextY.toFixed(2)),
                  zoneId: matchingZone ? matchingZone.id : item.zoneId,
                }
              : item
          ),
        };
      });
    };

    const handlePointerUp = () => {
      setDragState(null);
      setFloorplan((latest) => {
        db.saveFloorplan(latest);
        return latest;
      });
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragState, floorplan.widthMeters, snapToGrid]);

  // Metrics
  const stats = useMemo(() => {
    const serviceStations = floorplan.items.filter((i) => i.status !== 'Facility');
    const available = serviceStations.filter((i) => i.status === 'Available').length;
    const occupied = serviceStations.filter(
      (i) => i.status === 'In Service' || i.status === 'Reserved'
    ).length;
    const assignedStaffCount = new Set(
      floorplan.items.map((i) => i.assignedEmployeeId).filter(Boolean)
    ).size;
    const totalArea = floorplan.widthMeters * floorplan.heightMeters;
    return {
      totalStations: serviceStations.length,
      available,
      occupied,
      assignedStaffCount,
      totalArea,
    };
  }, [floorplan]);

  const filteredItems = useMemo(() => {
    if (selectedZoneFilter === 'ALL') return floorplan.items;
    return floorplan.items.filter((i) => i.zoneId === selectedZoneFilter);
  }, [floorplan.items, selectedZoneFilter]);

  const handleUpdateSelectedItem = (patch: Partial<FloorplanItem>) => {
    if (!selectedItemId) return;
    const updated: SalonFloorplan = {
      ...floorplan,
      items: floorplan.items.map((it) => (it.id === selectedItemId ? { ...it, ...patch } : it)),
    };
    persistFloorplan(updated);
  };

  const handleRotateSelected = () => {
    if (!selectedItem) return;
    const nextRot = (((selectedItem.rotation || 0) + 90) % 360) as 0 | 90 | 180 | 270;
    handleUpdateSelectedItem({ rotation: nextRot });
  };

  const handleDuplicateSelected = () => {
    if (!selectedItem) return;
    const clone: FloorplanItem = {
      ...selectedItem,
      id: `ST-${Date.now()}`,
      code: `${selectedItem.code}-2`,
      label: `${selectedItem.label} Copy`,
      x: Math.min(floorplan.widthMeters - selectedItem.width, Number((selectedItem.x + 0.5).toFixed(2))),
      y: Math.min(floorplan.heightMeters - selectedItem.height, Number((selectedItem.y + 0.5).toFixed(2))),
    };
    persistFloorplan({
      ...floorplan,
      items: [...floorplan.items, clone],
    });
    setSelectedItemId(clone.id);
  };

  const handleDeleteSelected = () => {
    if (!selectedItemId) return;
    persistFloorplan({
      ...floorplan,
      items: floorplan.items.filter((it) => it.id !== selectedItemId),
    });
    setSelectedItemId(null);
  };

  const handleAddStation = (preset: (typeof STATION_PALETTE)[number]) => {
    const targetZone =
      selectedZoneFilter !== 'ALL'
        ? floorplan.zones.find((z) => z.id === selectedZoneFilter)
        : floorplan.zones[1] || floorplan.zones[0];

    const startX = targetZone ? Number((targetZone.x + 0.5).toFixed(2)) : 1.0;
    const startY = targetZone ? Number((targetZone.y + 0.5).toFixed(2)) : 1.0;
    const count = floorplan.items.filter((i) => i.type === preset.type).length + 1;

    const newItem: FloorplanItem = {
      id: `ST-${Date.now()}`,
      code: `${preset.defaultCode.replace('-NEW', '')}-${count}`,
      label: `${preset.label} ${count}`,
      type: preset.type,
      zoneId: targetZone?.id || 'zone-hair',
      x: startX,
      y: startY,
      width: preset.width,
      height: preset.height,
      rotation: 0,
      status: preset.defaultStatus,
    };

    persistFloorplan({
      ...floorplan,
      items: [...floorplan.items, newItem],
    });
    setSelectedItemId(newItem.id);
    setMode('editor');
    setShowPaletteModal(false);
  };

  const handleSavePdf = async () => {
    setIsDownloadingPdf(true);
    try {
      await exportElementToPdf('printable-floorplan', {
        filename: `COSMOS_Salon_Floorplan_${new Date().toISOString().slice(0, 10)}.pdf`,
        orientation: 'l',
        format: 'a4',
      });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handlePrintFloorplan = () => {
    window.printDocument(
      'printable-floorplan',
      `COSMOS_Salon_Floorplan_${new Date().toISOString().slice(0, 10)}`
    );
  };

  const handleResetConfirm = async () => {
    const fresh = await db.resetFloorplan();
    setFloorplan(fresh);
    setSelectedItemId(null);
    setIsResetConfirmOpen(false);
    if (onRefresh) onRefresh();
  };

  const svgWidth = floorplan.widthMeters * PIXELS_PER_METER;
  const svgHeight = floorplan.heightMeters * PIXELS_PER_METER;

  const renderBlueprintSvg = (isPrintVersion = false) => {
    const padOffset = 36; // space for metric architectural rulers
    const totalW = svgWidth + padOffset * 2;
    const totalH = svgHeight + padOffset * 2;

    return (
      <svg
        ref={isPrintVersion ? undefined : svgRef}
        viewBox={`0 0 ${totalW} ${totalH}`}
        className="w-full h-auto select-none block"
        style={{ background: '#FFFFFF' }}
      >
        <defs>
          <pattern id={isPrintVersion ? 'grid-print' : 'grid-screen'} width={PIXELS_PER_METER * 0.5} height={PIXELS_PER_METER * 0.5} patternUnits="userSpaceOnUse">
            <path
              d={`M ${PIXELS_PER_METER * 0.5} 0 L 0 0 0 ${PIXELS_PER_METER * 0.5}`}
              fill="none"
              stroke="#E2E8F0"
              strokeWidth="0.6"
            />
          </pattern>
          <pattern id={isPrintVersion ? 'grid-major-print' : 'grid-major-screen'} width={PIXELS_PER_METER} height={PIXELS_PER_METER} patternUnits="userSpaceOnUse">
            <path
              d={`M ${PIXELS_PER_METER} 0 L 0 0 0 ${PIXELS_PER_METER}`}
              fill="none"
              stroke="#CBD5E1"
              strokeWidth="0.9"
            />
          </pattern>
        </defs>

        {/* Architectural Metric Rulers */}
        {showDimensions && (
          <g className="font-mono" fontSize="9" fill="#64748B">
            {/* Top ruler (X meters) */}
            <line x1={padOffset} y1={18} x2={padOffset + svgWidth} y2={18} stroke="#94A3B8" strokeWidth="1" />
            {Array.from({ length: Math.floor(floorplan.widthMeters) + 1 }).map((_, m) => {
              const rx = padOffset + m * PIXELS_PER_METER;
              return (
                <g key={`rx-${m}`}>
                  <line x1={rx} y1={14} x2={rx} y2={22} stroke="#64748B" strokeWidth="1" />
                  <text x={rx} y={11} textAnchor="middle">
                    {m}m
                  </text>
                </g>
              );
            })}

            {/* Left ruler (Y meters) */}
            <line x1={18} y1={padOffset} x2={18} y2={padOffset + svgHeight} stroke="#94A3B8" strokeWidth="1" />
            {Array.from({ length: Math.floor(floorplan.heightMeters) + 1 }).map((_, m) => {
              const ry = padOffset + m * PIXELS_PER_METER;
              return (
                <g key={`ry-${m}`}>
                  <line x1={14} y1={ry} x2={22} y2={ry} stroke="#64748B" strokeWidth="1" />
                  <text x={11} y={ry + 3} textAnchor="end">
                    {m}m
                  </text>
                </g>
              );
            })}

            {/* Bottom overall dimension line */}
            <line
              x1={padOffset}
              y1={padOffset + svgHeight + 18}
              x2={padOffset + svgWidth}
              y2={padOffset + svgHeight + 18}
              stroke="#334155"
              strokeWidth="1"
            />
            <rect
              x={padOffset + svgWidth / 2 - 42}
              y={padOffset + svgHeight + 10}
              width="84"
              height="16"
              fill="#FFFFFF"
            />
            <text
              x={padOffset + svgWidth / 2}
              y={padOffset + svgHeight + 21}
              textAnchor="middle"
              fill="#0F172A"
              fontWeight="600"
            >
              {floorplan.widthMeters.toFixed(1)} m ({(floorplan.widthMeters * floorplan.heightMeters).toFixed(0)} m²)
            </text>
          </g>
        )}

        {/* Main Architectural Floor Footprint */}
        <g transform={`translate(${padOffset}, ${padOffset})`}>
          {/* Base Zones */}
          {floorplan.zones.map((zone) => {
            const zx = zone.x * PIXELS_PER_METER;
            const zy = zone.y * PIXELS_PER_METER;
            const zw = zone.width * PIXELS_PER_METER;
            const zh = zone.height * PIXELS_PER_METER;
            const isDimmed = selectedZoneFilter !== 'ALL' && selectedZoneFilter !== zone.id;
            const zoneArea = (zone.width * zone.height).toFixed(1);

            return (
              <g key={zone.id} opacity={isDimmed ? 0.35 : 1}>
                <rect
                  x={zx}
                  y={zy}
                  width={zw}
                  height={zh}
                  fill={FLOOR_FINISH_FILL[zone.floorFinish]}
                  stroke="#94A3B8"
                  strokeWidth="1.5"
                />
                {/* Zone Header Label */}
                <text
                  x={zx + 10}
                  y={zy + 18}
                  fontSize="11"
                  fontWeight="700"
                  fill="#334155"
                  style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                >
                  {zone.name}
                </text>
                {showDimensions && (
                  <text
                    x={zx + zw - 10}
                    y={zy + 18}
                    textAnchor="end"
                    fontSize="9.5"
                    fill="#64748B"
                    className="font-mono"
                  >
                    {zone.width.toFixed(1)}m × {zone.height.toFixed(1)}m · {zoneArea} m²
                  </text>
                )}
              </g>
            );
          })}

          {/* Architectural Grid Overlay */}
          {showGrid && (
            <g pointerEvents="none">
              <rect
                x={0}
                y={0}
                width={svgWidth}
                height={svgHeight}
                fill={`url(#${isPrintVersion ? 'grid-print' : 'grid-screen'})`}
                opacity={0.7}
              />
              <rect
                x={0}
                y={0}
                width={svgWidth}
                height={svgHeight}
                fill={`url(#${isPrintVersion ? 'grid-major-print' : 'grid-major-screen'})`}
                opacity={0.7}
              />
            </g>
          )}

          {/* Exterior Structural Walls */}
          <rect
            x={0}
            y={0}
            width={svgWidth}
            height={svgHeight}
            fill="none"
            stroke="#0F172A"
            strokeWidth="5"
          />

          {/* Storefront Glazed Windows along top facade */}
          <line x1={20} y1={0} x2={75} y2={0} stroke="#38BDF8" strokeWidth="4" />
          <line x1={285} y1={0} x2={690} y2={0} stroke="#38BDF8" strokeWidth="4" />
          <line x1={740} y1={0} x2={svgWidth - 20} y2={0} stroke="#38BDF8" strokeWidth="4" />

          {/* Interior Zone Door Openings (Walkways) */}
          <g stroke="#FAF9F6" strokeWidth="5">
            <line x1={4.5 * PIXELS_PER_METER} y1={2.4 * PIXELS_PER_METER} x2={4.5 * PIXELS_PER_METER} y2={3.8 * PIXELS_PER_METER} />
            <line x1={12.0 * PIXELS_PER_METER} y1={2.4 * PIXELS_PER_METER} x2={12.0 * PIXELS_PER_METER} y2={3.7 * PIXELS_PER_METER} />
            <line x1={2.2 * PIXELS_PER_METER} y1={5.5 * PIXELS_PER_METER} x2={3.6 * PIXELS_PER_METER} y2={5.5 * PIXELS_PER_METER} />
            <line x1={7.5 * PIXELS_PER_METER} y1={7.4 * PIXELS_PER_METER} x2={7.5 * PIXELS_PER_METER} y2={8.7 * PIXELS_PER_METER} />
            <line x1={12.0 * PIXELS_PER_METER} y1={6.6 * PIXELS_PER_METER} x2={12.0 * PIXELS_PER_METER} y2={7.7 * PIXELS_PER_METER} />
          </g>

          {/* Stations & Architectural Furniture Items */}
          {floorplan.items.map((item) => {
            const ix = item.x * PIXELS_PER_METER;
            const iy = item.y * PIXELS_PER_METER;
            const iw = item.width * PIXELS_PER_METER;
            const ih = item.height * PIXELS_PER_METER;
            const isSelected = !isPrintVersion && selectedItemId === item.id;
            const isZoneDimmed =
              selectedZoneFilter !== 'ALL' && selectedZoneFilter !== item.zoneId;
            const meta = STATUS_META[item.status] || STATUS_META.Available;
            const assignedStaff = item.assignedEmployeeId
              ? employeeMap[item.assignedEmployeeId]
              : undefined;

            return (
              <g
                key={item.id}
                transform={`translate(${ix}, ${iy})`}
                opacity={isZoneDimmed ? 0.3 : 1}
                style={{ cursor: isPrintVersion ? 'default' : mode === 'editor' ? 'grab' : 'pointer' }}
                onPointerDown={(e) => {
                  if (isPrintVersion) return;
                  e.stopPropagation();
                  setSelectedItemId(item.id);
                  if (mode === 'editor') {
                    setDragState({
                      itemId: item.id,
                      startClientX: e.clientX,
                      startClientY: e.clientY,
                      origX: item.x,
                      origY: item.y,
                    });
                  }
                }}
              >
                {/* Selection Halo */}
                {isSelected && (
                  <rect
                    x={-4}
                    y={-4}
                    width={iw + 8}
                    height={ih + 8}
                    rx={6}
                    fill="none"
                    stroke="#0F172A"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                  />
                )}

                {/* Station Footprint Card */}
                <rect
                  x={0}
                  y={0}
                  width={iw}
                  height={ih}
                  rx={4}
                  fill={meta.fill}
                  stroke={isSelected ? '#0F172A' : meta.stroke}
                  strokeWidth={isSelected ? 2 : 1.4}
                />

                {/* Top-down CAD symbol rotated around item center */}
                <g transform={`rotate(${item.rotation || 0}, ${iw / 2}, ${ih / 2})`}>
                  <StationArchitecturalSymbol item={item} w={iw} h={ih} stroke={meta.stroke} />
                </g>

                {/* Code Badge in Corner */}
                {item.type !== 'door' && item.type !== 'partition' && (
                  <g>
                    <rect
                      x={3}
                      y={3}
                      width={Math.min(Math.max(item.code.length * 6.2 + 8, 28), iw - 6)}
                      height={14}
                      rx={2}
                      fill="#0F172A"
                    />
                    <text
                      x={7}
                      y={13}
                      fontSize="8.5"
                      fontWeight="700"
                      fill="#FFFFFF"
                      className="font-mono"
                    >
                      {item.code}
                    </text>
                  </g>
                )}

                {/* Assigned Staff or Label Footer */}
                {item.type !== 'partition' && (
                  <text
                    x={iw / 2}
                    y={ih + 11}
                    textAnchor="middle"
                    fontSize="8.5"
                    fontWeight="600"
                    fill="#1E293B"
                    style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                  >
                    {assignedStaff
                      ? `${item.label.split(' ')[0]} · ${assignedStaff.employeeName.split(' ')[0]}`
                      : item.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* North Compass Rose in bottom-right */}
          <g transform={`translate(${svgWidth - 28}, ${svgHeight - 28})`}>
            <circle cx={0} cy={0} r={14} fill="#FFFFFF" stroke="#64748B" strokeWidth="1" />
            <polygon points="0,-10 3.5,2 0,-1 -3.5,2" fill="#0F172A" />
            <text x={0} y={10} textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#475569">
              N
            </text>
          </g>
        </g>
      </svg>
    );
  };

  return (
    <div className="space-y-5">
      {/* Top KPI & Control Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5">
              <Map className="w-5 h-5 text-slate-900" />
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                {floorplan.title}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
              <span className="font-mono tabular-nums">
                {floorplan.widthMeters.toFixed(1)}m × {floorplan.heightMeters.toFixed(1)}m
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{stats.totalArea.toFixed(0)} m² Total Area</span>
              <span aria-hidden="true">·</span>
              <span>{floorplan.zones.length} Zones</span>
              <span aria-hidden="true">·</span>
              <span>Updated {new Date(floorplan.updatedAt).toLocaleDateString()}</span>
            </p>
          </div>

          {/* Primary Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Segmented Mode Switch */}
            <div className="flex items-center p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setMode('operations')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                  mode === 'operations'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Live Operations</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('editor')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                  mode === 'editor'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Move className="w-3.5 h-3.5" />
                <span>Layout Editor</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowPaletteModal(true)}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Station</span>
            </button>

            <button
              type="button"
              onClick={() => setIsResetConfirmOpen(true)}
              className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              title="Restore default architectural salon layout"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            <button
              type="button"
              onClick={handleSavePdf}
              disabled={isDownloadingPdf}
              className="px-3.5 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-60 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              title="Download Floorplan as A4 Landscape PDF"
            >
              {isDownloadingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{isDownloadingPdf ? 'Generating...' : 'Save as PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrintFloorplan}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              title="Print Floorplan (A4 Landscape)"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print A4</span>
            </button>
          </div>
        </div>

        {/* 4-Column Flat KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 pt-4">
          <div className="pr-4 py-1">
            <span className="text-xs text-slate-500 block">Active Service Stations</span>
            <span className="text-xl font-bold text-slate-900 font-mono tabular-nums">
              {stats.totalStations}
            </span>
          </div>
          <div className="lg:px-5 py-1">
            <span className="text-xs text-slate-500 block">Available Now</span>
            <span className="text-xl font-bold text-emerald-700 font-mono tabular-nums flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>{stats.available}</span>
            </span>
          </div>
          <div className="lg:px-5 py-1">
            <span className="text-xs text-slate-500 block">In Service / Reserved</span>
            <span className="text-xl font-bold text-amber-700 font-mono tabular-nums flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>{stats.occupied}</span>
            </span>
          </div>
          <div className="lg:pl-5 py-1">
            <span className="text-xs text-slate-500 block">Staff Assigned to Stations</span>
            <span className="text-xl font-bold text-slate-900 font-mono tabular-nums flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-blue-600" />
              <span>{stats.assignedStaffCount}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Zone Filter & Canvas View Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-white border border-slate-200 rounded-lg">
          <button
            type="button"
            onClick={() => setSelectedZoneFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              selectedZoneFilter === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            All Zones
          </button>
          {floorplan.zones.map((z) => (
            <button
              key={z.id}
              type="button"
              onClick={() => setSelectedZoneFilter(z.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedZoneFilter === z.id
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {z.name.split(' & ')[0]}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-1 self-start">
          <button
            type="button"
            onClick={() => setShowGrid((v) => !v)}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-md flex items-center gap-1 transition-colors cursor-pointer ${
              showGrid ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            <span>Grid</span>
          </button>
          <button
            type="button"
            onClick={() => setShowDimensions((v) => !v)}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-md flex items-center gap-1 transition-colors cursor-pointer ${
              showDimensions ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Ruler className="w-3.5 h-3.5" />
            <span>Metrics</span>
          </button>
          {mode === 'editor' && (
            <button
              type="button"
              onClick={() => setSnapToGrid((v) => !v)}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md flex items-center gap-1 transition-colors cursor-pointer ${
                snapToGrid ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Magnet className="w-3.5 h-3.5" />
              <span>Snap 0.25m</span>
            </button>
          )}
          <div className="h-4 w-px bg-slate-200 mx-0.5" />
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.75, Number((z - 0.15).toFixed(2))))}
            className="p-1.5 text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-100 cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-mono tabular-nums text-slate-700 px-1">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(1.6, Number((z + 0.15).toFixed(2))))}
            className="p-1.5 text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-100 cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Split Workspace: Architectural Blueprint Canvas + Right Inspector/Roster */}
      <div className="flex flex-col xl:flex-row gap-5 items-stretch">
        {/* Left: Interactive Architectural Floorplan Canvas */}
        <div className="flex-1 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col min-w-0">
          <div className="px-4 py-2.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
            <span className="font-medium text-slate-700">
              {mode === 'editor'
                ? 'Layout Editor Active — Drag stations to reposition, or select to resize & rotate'
                : 'Live Floor Operations — Click any station to assign staff or update occupancy'}
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1.5 text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Available</span>
              </span>
              <span className="flex items-center gap-1.5 text-amber-700">
                <Clock className="w-3.5 h-3.5" />
                <span>In Service</span>
              </span>
              <span className="flex items-center gap-1.5 text-blue-700">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Reserved</span>
              </span>
              <span className="flex items-center gap-1.5 text-rose-700">
                <Wrench className="w-3.5 h-3.5" />
                <span>Maintenance</span>
              </span>
            </div>
          </div>

          <div
            className="flex-1 overflow-auto p-4 bg-slate-50/60 custom-scrollbar"
            onClick={() => setSelectedItemId(null)}
          >
            <div
              className="mx-auto bg-white border border-slate-200 rounded-lg p-2 transition-transform origin-top-left"
              style={{ width: `${Math.round(zoom * 100)}%`, minWidth: '720px' }}
            >
              {renderBlueprintSvg(false)}
            </div>
          </div>
        </div>

        {/* Right: Contextual Station Inspector OR Station & Zone Directory */}
        <div className="w-full xl:w-96 bg-white border border-slate-200 rounded-xl flex flex-col shrink-0 overflow-hidden">
          {selectedItem ? (
            <>
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-mono text-slate-500">{selectedItem.code}</span>
                  <h3 className="text-sm font-bold text-slate-900">{selectedItem.label}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedItemId(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
                  title="Close station inspector"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-4 text-xs overflow-y-auto flex-1 custom-scrollbar">
                {/* Status Selection */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    Station Status
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(['Available', 'In Service', 'Reserved', 'Maintenance', 'Facility'] as FloorplanStationStatus[]).map(
                      (st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => handleUpdateSelectedItem({ status: st })}
                          className={`px-2.5 py-2 rounded-lg border text-left font-medium transition-colors cursor-pointer ${
                            selectedItem.status === st
                              ? `${STATUS_META[st].badgeBg} font-semibold`
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {st}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Assign Active Staff Member */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Assigned Stylist / Staff
                  </label>
                  <select
                    value={selectedItem.assignedEmployeeId || ''}
                    onChange={(e) =>
                      handleUpdateSelectedItem({
                        assignedEmployeeId: e.target.value || undefined,
                      })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-medium"
                  >
                    <option value="">Unassigned</option>
                    {activeEmployees.map((emp) => (
                      <option key={emp.employeeId} value={emp.employeeId}>
                        {emp.employeeName} · {emp.position}
                      </option>
                    ))}
                  </select>
                  {selectedItem.assignedEmployeeId &&
                    employeeMap[selectedItem.assignedEmployeeId] &&
                    onOpenEmployee && (
                      <button
                        type="button"
                        onClick={() => onOpenEmployee(selectedItem.assignedEmployeeId!)}
                        className="mt-1.5 text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                      >
                        View Staff Profile ({employeeMap[selectedItem.assignedEmployeeId].employeeId})
                      </button>
                    )}
                </div>

                {/* Current Client & Notes */}
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Current / Next Client
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Fatima Al-Thani"
                      value={selectedItem.currentClientName || ''}
                      onChange={(e) =>
                        handleUpdateSelectedItem({ currentClientName: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Station Code &amp; Label
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={selectedItem.code}
                        onChange={(e) => handleUpdateSelectedItem({ code: e.target.value })}
                        className="px-2.5 py-2 bg-white border border-slate-200 rounded-lg font-mono font-semibold text-slate-900"
                        placeholder="Code"
                      />
                      <input
                        type="text"
                        value={selectedItem.label}
                        onChange={(e) => handleUpdateSelectedItem({ label: e.target.value })}
                        className="col-span-2 px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-slate-900"
                        placeholder="Station Name"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Zone</label>
                    <select
                      value={selectedItem.zoneId}
                      onChange={(e) => handleUpdateSelectedItem({ zoneId: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900"
                    >
                      {floorplan.zones.map((z) => (
                        <option key={z.id} value={z.id}>
                          {z.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Geometry Controls (X, Y, W, H, Rotation) */}
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">Architectural Dimensions (m)</span>
                    <span className="font-mono tabular-nums text-slate-500">
                      {(selectedItem.width * selectedItem.height).toFixed(2)} m²
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 font-mono tabular-nums">
                    <div>
                      <span className="text-[10px] text-slate-500 block mb-0.5">X (m)</span>
                      <input
                        type="number"
                        step="0.25"
                        min={0}
                        max={floorplan.widthMeters}
                        value={selectedItem.x}
                        onChange={(e) =>
                          handleUpdateSelectedItem({
                            x: Math.max(0, parseFloat(e.target.value) || 0),
                          })
                        }
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-slate-900"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block mb-0.5">Y (m)</span>
                      <input
                        type="number"
                        step="0.25"
                        min={0}
                        max={floorplan.heightMeters}
                        value={selectedItem.y}
                        onChange={(e) =>
                          handleUpdateSelectedItem({
                            y: Math.max(0, parseFloat(e.target.value) || 0),
                          })
                        }
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-slate-900"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block mb-0.5">W (m)</span>
                      <input
                        type="number"
                        step="0.1"
                        min={0.3}
                        max={8}
                        value={selectedItem.width}
                        onChange={(e) =>
                          handleUpdateSelectedItem({
                            width: Math.max(0.3, parseFloat(e.target.value) || 1),
                          })
                        }
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-slate-900"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block mb-0.5">H (m)</span>
                      <input
                        type="number"
                        step="0.1"
                        min={0.25}
                        max={8}
                        value={selectedItem.height}
                        onChange={(e) =>
                          handleUpdateSelectedItem({
                            height: Math.max(0.25, parseFloat(e.target.value) || 1),
                          })
                        }
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Notes</label>
                    <textarea
                      rows={2}
                      value={selectedItem.notes || ''}
                      onChange={(e) => handleUpdateSelectedItem({ notes: e.target.value })}
                      placeholder="Equipment notes, electrical outlet, plumbing details..."
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900"
                    />
                  </div>

                  {/* Quick Geometry Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleRotateSelected}
                      className="flex-1 px-3 py-2 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>Rotate 90° ({selectedItem.rotation}°)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDuplicateSelected}
                      className="px-3 py-2 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg flex items-center gap-1 cursor-pointer"
                      title="Duplicate station"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteSelected}
                      className="px-3 py-2 text-xs font-medium bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg flex items-center gap-1 cursor-pointer"
                      title="Remove station"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Station &amp; Zone Roster</h3>
                  <p className="text-[11px] text-slate-500">
                    Click any row to inspect or assign staff
                  </p>
                </div>
                <span className="text-xs font-mono tabular-nums text-slate-500">
                  {filteredItems.length} items
                </span>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[580px] custom-scrollbar divide-y divide-slate-100">
                {filteredItems.map((item) => {
                  const staff = item.assignedEmployeeId
                    ? employeeMap[item.assignedEmployeeId]
                    : undefined;
                  const meta = STATUS_META[item.status] || STATUS_META.Available;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedItemId(item.id)}
                      className="w-full px-4 py-2.5 text-left hover:bg-slate-50 transition-colors flex items-center justify-between gap-2 cursor-pointer"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-mono font-bold text-slate-900">{item.code}</span>
                          <span className="font-medium text-slate-800 truncate">{item.label}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {staff ? staff.employeeName : 'Unassigned'}
                          {item.currentClientName ? ` · Client: ${item.currentClientName}` : ''}
                        </p>
                      </div>
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded border shrink-0 ${meta.badgeBg}`}
                      >
                        {item.status}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Zone Areas Summary Footer */}
              <div className="p-3 border-t border-slate-100 bg-slate-50/70 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Architectural Zones Breakdown</span>
                  </span>
                  <span className="font-mono tabular-nums">{stats.totalArea.toFixed(0)} m²</span>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-slate-600">
                  {floorplan.zones.map((z) => (
                    <div key={z.id} className="flex items-center justify-between gap-1 truncate">
                      <span className="truncate">{z.name.split(' & ')[0]}</span>
                      <span className="font-mono tabular-nums text-slate-800">
                        {(z.width * z.height).toFixed(0)}m²
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add Station Palette Modal */}
      {showPaletteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Add Station or Architectural Fixture</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select an element to place onto your salon floorplan
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPaletteModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[65vh] overflow-y-auto custom-scrollbar">
              {STATION_PALETTE.map((preset) => (
                <button
                  key={preset.type}
                  type="button"
                  onClick={() => handleAddStation(preset)}
                  className="p-3 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 text-left transition-colors cursor-pointer"
                >
                  <div className="text-xs font-bold text-slate-900">{preset.label}</div>
                  <div className="text-[11px] text-slate-500 font-mono tabular-nums mt-1">
                    {preset.width.toFixed(2)}m × {preset.height.toFixed(2)}m · {preset.defaultStatus}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reset Floorplan Confirmation */}
      {isResetConfirmOpen && (
        <ConfirmModal
          isOpen={isResetConfirmOpen}
          title="Reset Salon Floorplan?"
          message="Restore the default COSMOS Beauty Salon architectural layout (16.0m × 10.5m, 6 zones, 24 stations)? Any custom station moves will be replaced."
          confirmLabel="Reset Layout"
          cancelLabel="Cancel"
          isDestructive={true}
          onConfirm={handleResetConfirm}
          onCancel={() => setIsResetConfirmOpen(false)}
        />
      )}

      {/* Dedicated Printable A4 Landscape Blueprint Container */}
      <div
        id="printable-floorplan"
        className="hidden print-landscape font-sans text-slate-950 bg-white p-6"
      >
        {/* Architectural Title Block */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            borderBottom: '2px solid #0F172A',
            paddingBottom: '10px',
            marginBottom: '14px',
          }}
        >
          <div>
            <div style={{ fontSize: '16pt', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {settings.companyName || 'COSMOS BEAUTY SALON'} — ARCHITECTURAL FLOORPLAN
            </div>
            <div style={{ fontSize: '9pt', color: '#475569', marginTop: '2px' }}>
              {settings.companyAddress || 'Doha, State of Qatar'} · Tel: {settings.companyPhone || '+974 7045 0040'}
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '8.5pt', fontFamily: 'monospace' }}>
            <div>
              <strong>DIMENSIONS:</strong> {floorplan.widthMeters.toFixed(1)}m × {floorplan.heightMeters.toFixed(1)}m ({stats.totalArea.toFixed(0)} m²)
            </div>
            <div>
              <strong>STATIONS:</strong> {stats.totalStations} Service · {stats.available} Available · {stats.occupied} Active
            </div>
            <div>
              <strong>DATE:</strong> {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Crisp Vector Floorplan */}
        <div style={{ border: '1px solid #CBD5E1', padding: '6px', marginBottom: '14px' }}>
          {renderBlueprintSvg(true)}
        </div>

        {/* Station & Staff Allocation Summary Table */}
        <div style={{ fontSize: '9pt', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase' }}>
          Zone &amp; Station Allocation Schedule
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8pt' }}>
          <thead>
            <tr style={{ background: '#F1F5F9', borderBottom: '1.5px solid #0F172A', textAlign: 'left' }}>
              <th style={{ border: '1px solid #CBD5E1', padding: '4px 6px' }}>Code</th>
              <th style={{ border: '1px solid #CBD5E1', padding: '4px 6px' }}>Station / Room</th>
              <th style={{ border: '1px solid #CBD5E1', padding: '4px 6px' }}>Zone</th>
              <th style={{ border: '1px solid #CBD5E1', padding: '4px 6px' }}>Size (m)</th>
              <th style={{ border: '1px solid #CBD5E1', padding: '4px 6px' }}>Assigned Staff</th>
              <th style={{ border: '1px solid #CBD5E1', padding: '4px 6px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {floorplan.items
              .filter((i) => i.type !== 'door' && i.type !== 'partition')
              .map((item) => {
                const zone = floorplan.zones.find((z) => z.id === item.zoneId);
                const staff = item.assignedEmployeeId
                  ? employeeMap[item.assignedEmployeeId]
                  : undefined;
                return (
                  <tr key={item.id}>
                    <td style={{ border: '1px solid #CBD5E1', padding: '3px 6px', fontFamily: 'monospace', fontWeight: 700 }}>
                      {item.code}
                    </td>
                    <td style={{ border: '1px solid #CBD5E1', padding: '3px 6px' }}>{item.label}</td>
                    <td style={{ border: '1px solid #CBD5E1', padding: '3px 6px' }}>{zone?.name || '-'}</td>
                    <td style={{ border: '1px solid #CBD5E1', padding: '3px 6px', fontFamily: 'monospace' }}>
                      {item.width.toFixed(1)}×{item.height.toFixed(1)}
                    </td>
                    <td style={{ border: '1px solid #CBD5E1', padding: '3px 6px' }}>
                      {staff ? `${staff.employeeName} (${staff.position})` : 'Unassigned'}
                    </td>
                    <td style={{ border: '1px solid #CBD5E1', padding: '3px 6px', fontWeight: 600 }}>
                      {item.status}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
