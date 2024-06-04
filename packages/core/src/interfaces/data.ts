export interface GanttDataBlock {
  key: string;
  startTime: string;
  endTime: string;
  text: string;
  index: number;
  parentKey?: string;
  startConstraint?: boolean;
  endConstraint?: boolean;
  groupKey?: string;
}

export type GanttViewMode = 'year' | 'month' | 'week' | 'day';
export type GanttSortMode = 'list' | 'group';
export type GanttTheme = 'light' | 'dark';

export interface GanttViewConfig {
  mode: GanttViewMode;
  lineHeight: number;
  timeCellWidthMap: Record<GanttViewConfig['mode'], number>;
  tableWidth: number;
  sortMode: GanttSortMode;
  theme: GanttTheme;
}

export interface GanttData {
  blocks: GanttDataBlock[];
  viewConfig: GanttViewConfig;
  startTime: number;
  endTime: number;
  scrollX: number;
  scrollY: number;
  width: number;
  height: number;
}
