import { faker } from '@faker-js/faker'
import { FakeTrace, FakeSpan } from './tracing'
import { Attributes } from '@opentelemetry/api';
import { capitalizeString } from './utils'
import { strict as assert } from 'assert'
import {
  SEMATTRS_CODE_FUNCTION,
  SEMATTRS_CODE_NAMESPACE
} from '@opentelemetry/semantic-conventions';

interface FakeMethod {
  identifier: string
}

interface FakeClass {
  identifier: string,
  methods: Array<FakeMethod>,
  parent?: FakePackage
}

export interface FakePackage {
  name: string,
  subpackages: Array<FakePackage>,
  classes: Array<FakeClass>
}

export interface FakeApp {
  rootPackage: FakePackage,
  entryPoint: FakeClass,
  classes: Array<FakeClass>,
  packages: Array<FakePackage>
  methods: Array<FakeMethod>,
}

function isClass(codeUnit: FakeClass | FakePackage): codeUnit is FakeClass {
  return (codeUnit as FakeClass).methods !== undefined;
}

function isPackage(codeUnit: FakeClass | FakePackage): codeUnit is FakePackage {
  return (codeUnit as FakePackage).subpackages !== undefined;
}


export interface AppGenerationParameters {
  /**
   * How many apps should be generated. All generated apps will use the same generation parameters.
   */
  appCount: number,
  /**
   * How deep the package structure should reach, not including the root package.
   * A depth of 0 means that there are no sub-packages inside the root package, only classes
   */
  packageDepth: number,
  /**
   * How many classes the app should contain at the least.
   * Must be greater than 0
   */
  minClassCount: number,
  /**
   * The highest number of classes a package may contain, not including classes within subpackages
   */
  maxClassCount: number,
  /**
   * How many methods any given class must possess at the minimum
   */
  minMethodCount: number,
  /**
   * The max number of methods any class may possess
   */
  maxMethodCount: number,
  /**
   * Influences the balance of generated trees, where 1 is perfectly balanced and 0 is extremely unbalanced.
   * Low balance values mean that code units are more likely to be placed near the root package.
   * Note that this only influences the random generation, the resulting application tree can be very unbalanced
   * even for a balance value of 1.
   * May only be between 0 and 1
   */
  balance: number,
  /**
   * Can optionally be used to yield reproducable results. The seed is set once before generating all the apps.
   */
  seed?: number
}

/**
 * Generate some fake applications, with all the apps using the same generation parameters.
 * @param params Specifies the generation behaviour, especially the size of the applications. See {@link AppGenerationParameters}
 * @returns A list of {@link FakeApp}s conforming to the specified parameters
 */
export function generateFakeApps(params: AppGenerationParameters): Array<FakeApp> {
  // Set seed, if one was provided (for reproducable results)

  if (params.seed !== undefined) {
    faker.seed(params.seed);
  }

  return Array.from(Array(params.appCount), _ => generateFakeApp(params));
}

/**
 * Generate a fake application tree structure consisting of packages (internal nodes)
 * and classes (leaf nodes). 
 * @param params Specifies the generation behaviour, especially the size of the application. See {{@link AppGenerationParameters}
 * @returns A {@link FakeApp} which conforms to the specifed parameters
 */
function generateFakeApp(params: AppGenerationParameters): FakeApp {

  /**
   * This function creates an application tree from the bottom up (at the leaf nodes).
   * First, we randomly determine how many classes the app should contain in total.
   * Then, for each package depth layer (starting from the bottom), we take a random
   * portion of the total number of classes and assign it to this layer. The classes
   * are now randomly grouped into packages. For subsequent layers, we also include
   * packages created on the layer below in this grouping step alongside the classes.
   */

  // Check for parameter validity

  if (params.minClassCount < 1) {
    throw new RangeError('App requires at least 1 class');
  }

  if (params.minMethodCount < 1) {
    throw new RangeError('Each class requires at least 1 method');
  }

  if (params.packageDepth < 0) {
    throw new RangeError('Package depth may not be negative');
  }

  if (params.maxClassCount < params.minClassCount) {
    throw new RangeError('Class count min may not exceed max');
  }

  if (params.maxMethodCount < params.minMethodCount) {
    throw new RangeError('Method count min may not exceed max');
  }

  if (params.balance < 0 || params.balance > 1) {
    throw new RangeError('Balance value must be between 0 and 1')
  }

  // Convenience arrays

  let classes: Array<FakeClass> = [];
  let packages: Array<FakePackage> = [];
  let methods: Array<FakeMethod> = [];

  const classCount: number = faker.number.int({min: params.minClassCount, max: params.maxClassCount});
  let remainingClassCount: number = classCount;
  let currentLayer: Array<FakePackage | FakeClass> = [];

  // Create application tree

  for (let layer = params.packageDepth; layer > 0; layer--) {

    // Generate random classes for this layer

    const minClassesInLayer = layer == params.packageDepth ? 1 : 0; // Deepest layer requires at least 1 class
    const maxClassesInLayer = Math.max(Math.floor(remainingClassCount * params.balance), minClassesInLayer);
    const classesInLayer = faker.number.int({min: minClassesInLayer, max: maxClassesInLayer});
    remainingClassCount -= classesInLayer;

    let newClasses: Array<FakeClass> = Array.from(Array(classesInLayer), _ => {
      const numMethods = faker.number.int({min: params.minMethodCount, max: params.maxMethodCount});
      const newMethods = Array.from(Array(numMethods), _ => {
        const newMethod = {identifier: faker.hacker.verb() + capitalizeString(faker.hacker.noun())};
        methods.push(newMethod);
        return newMethod;
      });
      const newClass = {identifier: faker.hacker.noun(), methods: newMethods};
      classes.push(newClass);
      return newClass;
    });

    // Shuffle generated classes inbetween (potential) existing packages from previous iterations.
    // This is to prevent the packages and classes from being grouped separately (more heterogeneous structure)

    newClasses.forEach((element) => {
      currentLayer.splice(faker.number.int(currentLayer.length), 0, element);
    });

    // Put the code units on this layer into packages

    let newPackages = [];
    let remainingComponents = currentLayer.length;

    while (remainingComponents > 0) {
      const numComponentsToPackage = faker.number.int({min: 1, max: remainingComponents});
      const componentsToPackage = currentLayer.slice(0, numComponentsToPackage);
      let classesToPackage: Array<FakeClass> = [];
      let packagesToPackage: Array<FakePackage> = [];
      let newPackage = {name: faker.hacker.noun(), classes: classesToPackage, subpackages: packagesToPackage};

      componentsToPackage.forEach((component: FakePackage | FakeClass) => {
        if (isClass(component)) {
          component.parent = newPackage;
          classesToPackage.push(component);
        } else {
          packagesToPackage.push(component);
        }
      });
      newPackages.push(newPackage);
      packages.push(newPackage);
      currentLayer.splice(0, numComponentsToPackage);
      remainingComponents -= numComponentsToPackage;
    }

    currentLayer = newPackages;
  }

  assert(currentLayer.filter(isClass).length === 0);

  // Fill root layer with remaining classes, if any

  let remainingClasses: Array<FakeClass> = Array.from(Array(remainingClassCount), _ => {
    const numMethods = faker.number.int({min: params.minMethodCount, max: params.maxMethodCount});
    const newMethods = Array.from(Array(numMethods), _ => {
      const newMethod = {identifier: faker.hacker.verb() + capitalizeString(faker.hacker.noun())};
      methods.push(newMethod);
      return newMethod;
    })
    const newClass = {identifier: faker.hacker.noun(), methods: newMethods};
    classes.push(newClass);
    return newClass;
  });

  const rootPackage: FakePackage = {
    name: 'org',
    classes: [],
    subpackages: [{
      name: 'tracegen',
      classes: [],
      subpackages: [{
        name: 'randomapp',
        classes: remainingClasses,
        subpackages: currentLayer as Array<FakePackage>, // Will only contain packages at this point
      }]
    }]
  };

  const entryPoint = faker.helpers.arrayElement(classes);
  const fakeApp: FakeApp = {
    rootPackage: rootPackage,
    entryPoint: entryPoint,
    classes: classes,
    packages: packages,
    methods: methods
  };
  return fakeApp;
}

export const enum InternalCommunicationStyle {
  TRUE_RANDOM,
  /**
   * With this style, communication should mostly happen within packages.
   * Only select interfaces communicate with other packages
   */
  COHESIVE,
  RANDOM_EXIT
}

export interface TraceGenerationParameters {
  /**
   * Duration of the trace in milliseconds. The method calls will be distributed equally within this timeframe
   */
  duration: number,
  /**
   * How many method calls (between different classes) should occur within the duration of the trace
   */
  callCount: number,
  /**
   * This sets a limit to how high the method call stack can grow.
   * Must be greater than 0
   */
  maxConnectionDepth: number,
  /**
   * This specifies the way in which application-internal classes communicate with each other.
   * Styles differ in the way that classes for communication are selected.
   * For more information, see {@link InternalCommunicationStyle}
   */
  internalCommunicationStyle: InternalCommunicationStyle,
  /**
   * Whether there may exist cyclic method calls in the trace.
   * Setting this to true won't guarantee cyclic calls to be in the generated trace
   */
  allowCyclicCalls: boolean,
  /**
   * Whether classes from the standard library should be involved in the trace (i.e. java.lang)
   */
  includeUtilityClasses: boolean,
  /**
   * 
   */
  seed?: number
}

/*
Todo java.lang, java.net, java.io, java.security, java.util, java.sql, java.time
*/

export function generateFakeTrace(apps: Array<FakeApp>, params: TraceGenerationParameters): FakeTrace {
  // TODO check parameter validity

  if (apps.length < 1 ) {
    throw new RangeError("Must provide at least 1 app to generate a trace for");
  }

  if (params.seed !== undefined) {
    faker.seed(params.seed);
  }

  const startingApp = apps[0];
  const callInterval = params.duration / params.callCount;
  let timePassed = 0;
  const entryPoint = startingApp.entryPoint;
  const entryMethod = faker.helpers.arrayElement(entryPoint.methods);
  let currentCallDepth = 0;

  let entrySpan: FakeSpan = {
    name: `${entryPoint.identifier}.${entryMethod.identifier}`,
    startTime: 0,
    endTime: params.duration,
    attributes: {
      "explorviz.token.id": "0b87ef39-1c41-415e-98cf-38ce5986f278",
      "explorviz.token.secret": "GipJh2r0XboeAYMf",
      "host": "host123",
      "host_address": "192.168.178.1",
      "service.name": "trace-gen",
      "service.instance.id": "0",
      "telemetry.sdk.language": "java",
      [SEMATTRS_CODE_NAMESPACE]: `${entryPoint.parent?.name}`,
      [SEMATTRS_CODE_FUNCTION]: `${entryMethod.identifier}`
    },
    children: []
  };

  let resultTrace: FakeTrace = [entrySpan];
  let classStack: Array<[FakeClass, FakeSpan]> = [[entryPoint, entrySpan]];

  let trace: FakeTrace = [];
  const classes: FakeClass[][] = apps.map((app) => app.classes);
  while (timePassed < params.duration) {
    // Select next class for method call
    if (params.internalCommunicationStyle === InternalCommunicationStyle.TRUE_RANDOM) {
      //const nextApp = faker.number.int(classes.length - 1);
      const nextApp = 0;
      const nextClass = faker.helpers.arrayElement(classes[nextApp]);
      const nextMethod = faker.helpers.arrayElement(nextClass.methods);
      let nextSpan: FakeSpan = {
        name: `${entryPoint.identifier}.${entryMethod.identifier}`,
        startTime: 0,
        endTime: params.duration,
        attributes: {
          "explorviz.token.id": "0b87ef39-1c41-415e-98cf-38ce5986f278",
          "explorviz.token.secret": "GipJh2r0XboeAYMf",
          "host": "host123",
          "host_address": "192.168.178.1",
          "service.name": "trace-gen",
          "service.instance.id": "0",
          "telemetry.sdk.language": "java",
          [SEMATTRS_CODE_NAMESPACE]: `${nextClass.parent?.name}.${nextClass.identifier}`,
          [SEMATTRS_CODE_FUNCTION]: `${nextMethod.identifier}`
        },
        children: []
      }
      while (classStack.length >= params.maxConnectionDepth || faker.number.int(1) === 1) {
        const head = classStack.pop() as [FakeClass, FakeSpan];
        if (classStack.length === 0) {
          resultTrace.push(nextSpan);
          break;
        } else {
          classStack[classStack.length - 1][1].children.push(head[1]);
        }
      }
      classStack.push([nextClass, nextSpan]);
    }

    timePassed += callInterval;
  }

  return resultTrace;
}