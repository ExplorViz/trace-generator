/**
 * Shared types between frontend and backend
 */

export interface FakeMethod {
  identifier: string;
}

export interface FakeClass {
  identifier: string;
  methods: Array<FakeMethod>;
  parent?: FakePackage;
  parentAppName: string;
  linkedClass?: FakeClass;
}

export interface FakePackage {
  name: string;
  subpackages: Array<FakePackage>;
  classes: Array<FakeClass>;
  parent?: FakePackage;
}

export interface FakeApp {
  name: string;
  rootPackage: FakePackage;
  entryPoint: FakeClass;
  classes: Array<FakeClass>;
  packages: Array<FakePackage>;
  methods: Array<FakeMethod>;
}

/**
 * Parameters for generating application landscapes
 */
export interface AppGenerationParameters {
  appCount: number;
  packageDepth: number;
  minClassCount: number;
  maxClassCount: number;
  minMethodCount: number;
  maxMethodCount: number;
  balance: number;
  seed?: number;
}

/**
 * Parameters for generating traces
 */
export interface TraceGenerationParameters {
  duration: number;
  callCount: number;
  maxConnectionDepth: number;
  communicationStyle: string;
  allowCyclicCalls: boolean;
  visitAllMethods?: boolean;
  fixedAttributes: Record<string, string>;
  seed?: number;
}

/**
 * OpenTelemetry Collector connection parameters
 */
export interface OtelCollectorParameters {
  targetHostname: string;
  targetPort: number;
}

/**
 * Custom span attribute
 */
export interface CustomAttribute {
  key: string;
  value: string;
}

/**
 * Request body for landscape generation
 */
export interface LandscapeGenerationRequest {
  appCount: number;
  packageDepth: number;
  minClassCount: number;
  maxClassCount: number;
  minMethodCount: number;
  maxMethodCount: number;
  balance: number;
  landscapeSeed?: number;
}

/**
 * Request body for trace generation
 */
export interface TraceGenerationRequest {
  targetHostname: string;
  targetPort: number;
  duration: number;
  callCount: number;
  maxCallDepth: number;
  communicationStyle: string;
  allowCyclicCalls: boolean;
  visitAllMethods?: boolean;
  traceSeed?: number;
  customAttributes: Record<string, string>;
}

/**
 * Cleaned landscape for serialization (without circular references)
 */
export interface CleanedLandscape {
  name: string;
  rootPackages: CleanedPackage[];
  entryPointFqn: string;
  classes: CleanedClass[];
  packages: CleanedPackage[];
  methods: FakeMethod[];
}

export interface CleanedPackage {
  name: string;
  classes: CleanedClass[];
  subpackages: CleanedPackage[];
}

export interface CleanedClass {
  identifier: string;
  methods: FakeMethod[];
  parentAppName: string;
}
