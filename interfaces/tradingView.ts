import {
  type ChartingLibraryWidgetOptions,
  type DatafeedConfiguration,
  type ResolutionString,
  type SearchSymbolResultItem,
  type LibrarySymbolInfo,
} from "../public/charting_library";

export interface SymbolInfo extends LibrarySymbolInfo {
  full_name: string;
  base: string;
  quote: string;
}
export interface SearchSymbolResultItemInfo extends SearchSymbolResultItem {
  base: string;
  quote: string;
}
