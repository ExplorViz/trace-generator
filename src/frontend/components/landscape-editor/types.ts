import { CleanedClass, CleanedLandscape, CleanedPackage } from '../../../backend/shared/types';

export type NodeId = string;

export interface LandscapeEditorHandlers {
  onLandscapeUpdated: (landscape: CleanedLandscape[]) => void;
  onError: (error: string) => void;
  toggleNode: (nodeId: NodeId) => void;
  renameApp: (appIdx: number) => void;
  renamePackage: (appIdx: number, packageName: string) => void;
  renameClass: (appIdx: number, className: string) => void;
  renameMethod: (appIdx: number, className: string, methodName: string) => void;
  addRootPackage: (appIdx: number) => void;
  addPackage: (appIdx: number) => void;
  addSubPackage: (appIdx: number, parentPackageName: string) => void;
  addClass: (appIdx: number, packageName: string) => void;
  addMethod: (appIdx: number, className: string) => void;
  deleteApp: (appIdx: number) => void;
  deletePackage: (appIdx: number, packageName: string) => void;
  deleteClass: (appIdx: number, className: string) => void;
  deleteMethod: (appIdx: number, className: string, methodName: string) => void;
  movePackage: (
    sourceAppIdx: number,
    sourcePackageName: string,
    targetAppIdx: number,
    targetPackageName: string | null
  ) => void;
  moveClass: (sourceAppIdx: number, className: string, targetAppIdx: number, targetPackageName: string) => void;
  moveMethod: (
    sourceAppIdx: number,
    className: string,
    methodName: string,
    targetAppIdx: number,
    targetClassName: string
  ) => void;
}

export interface AppNodeProps {
  app: CleanedLandscape;
  appIdx: number;
  isExpanded: boolean;
  hasChildren: boolean;
  handlers: LandscapeEditorHandlers;
}

export interface PackageNodeProps {
  pkg: CleanedPackage;
  appIdx: number;
  depth: number;
  expandedNodes: Set<NodeId>;
  handlers: LandscapeEditorHandlers;
}

export interface ClassNodeProps {
  cls: CleanedClass;
  appIdx: number;
  expandedNodes: Set<NodeId>;
  handlers: LandscapeEditorHandlers;
}

export interface MethodNodeProps {
  method: string;
  appIdx: number;
  className: string;
  handlers: LandscapeEditorHandlers;
}

export interface LandscapeToolbarProps {
  onAddApp: () => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onSaveLandscape: () => void;
  onLoadLandscape: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onLoadPreset?: (presetName: string) => void;
  availablePresets?: Array<{ name: string; filename: string }>;
  isLoadingPresets?: boolean;
}
