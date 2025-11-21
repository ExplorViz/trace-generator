import { CleanedClass, CleanedLandscape, CleanedPackage } from '@shared/types';

export type NodeId = string;

export interface LandscapeEditorHandlers {
  onLandscapeUpdated: (landscape: CleanedLandscape[]) => void;
  onError: (error: string) => void;
  toggleNode: (nodeId: NodeId) => void;
  renameApp: (appIdx: number) => void;
  renamePackage: (appIdx: number, packageName: string) => void;
  renameClass: (appIdx: number, className: string) => void;
  renameMethod: (appIdx: number, className: string, methodName: string) => void;
  addPackage: (appIdx: number) => void;
  addSubPackage: (appIdx: number, parentPackageName: string) => void;
  addClass: (appIdx: number, packageName: string) => void;
  addMethod: (appIdx: number, className: string) => void;
  deleteApp: (appIdx: number) => void;
  deletePackage: (appIdx: number, packageName: string) => void;
  deleteClass: (appIdx: number, className: string) => void;
  deleteMethod: (appIdx: number, className: string, methodName: string) => void;
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
  method: { identifier: string };
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
}
