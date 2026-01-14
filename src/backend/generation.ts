import { faker } from '@faker-js/faker';
import { Attributes } from '@opentelemetry/api';
import {
  ATTR_CODE_FUNCTION_NAME,
  ATTR_SERVICE_NAME,
  SEMATTRS_CODE_NAMESPACE,
} from '@opentelemetry/semantic-conventions';
import { strict as assert } from 'assert';
import { NameGenerator } from './naming';
import { FakeSpan, FakeTrace } from './tracing';

import { AppGenerationParameters, FakeApp, FakeClass, FakePackage } from './shared/types';

// TraceGenerationParameters uses CommunicationStyle enum, so we keep a local version
export interface TraceGenerationParameters {
  duration: number;
  callCount: number;
  maxConnectionDepth: number;
  communicationStyle: CommunicationStyle;
  allowCyclicCalls: boolean;
  visitAllMethods?: boolean;
  fixedAttributes?: Attributes;
  seed?: number;
}

function isClass(codeUnit: FakeClass | FakePackage): codeUnit is FakeClass {
  return (codeUnit as FakeClass).methods !== undefined;
}

export function getClassFqn(fakeClass: FakeClass): string {
  let fqn: string = fakeClass.identifier;
  let obj: FakeClass | FakePackage | undefined = fakeClass;
  while (obj && obj.parent !== undefined) {
    const parent: FakePackage = obj.parent;
    fqn = parent.name + '.' + fqn;
    obj = parent;
  }
  return fqn;
}

function getAllChildClasses(fakePackage: FakePackage): Array<FakeClass> {
  const result = [...fakePackage.classes];
  fakePackage.subpackages.forEach((subpackage) => {
    result.push(...getAllChildClasses(subpackage));
  });
  return result;
}

/**
 * Generate some fake applications, with all the apps using the same generation parameters.
 * @param params Specifies the generation behavior, especially the size of the applications. See {@link AppGenerationParameters}
 * @returns A list of {@link FakeApp}s conforming to the specified parameters
 */
export function generateFakeApps(params: AppGenerationParameters): Array<FakeApp> {
  // Set seed, if one was provided (for reproducable results)

  if (params.seed !== undefined) {
    faker.seed(params.seed);
  } else {
    faker.seed(); // Use random seed
  }

  const nameGenerator: NameGenerator = new NameGenerator();

  return Array.from(Array(params.appCount), () => generateFakeApp(params, nameGenerator));
}

/**
 * Generate a fake application tree structure consisting of packages (internal nodes)
 * and classes (leaf nodes).
 * @param params Specifies the generation behaviour, especially the size of the application. See {{@link AppGenerationParameters}
 * @param nameGenerator Shared {@link NameGenerator} instance to use for all generated apps.
 * @returns A {@link FakeApp} which conforms to the specifed parameters
 * @throws {RangeError}
 */
function generateFakeApp(params: AppGenerationParameters, nameGenerator: NameGenerator): FakeApp {
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
    throw new RangeError('Balance value must be between 0 and 1');
  }

  const appName = nameGenerator.getRandomAppName();

  // Convenience arrays

  const classes: Array<FakeClass> = [];
  const packages: Array<FakePackage> = [];
  const methods: Array<string> = [];

  const classCount: number = faker.number.int({
    min: params.minClassCount,
    max: params.maxClassCount,
  });
  let remainingClassCount: number = classCount;
  let currentLayer: Array<FakePackage | FakeClass> = [];

  // Create application tree

  for (let layer = params.packageDepth; layer > 0; layer--) {
    // Generate random classes for this layer

    const minClassesInLayer = layer == params.packageDepth ? 1 : 0; // Deepest layer requires at least 1 class
    const maxClassesInLayer = Math.max(
      Math.floor(remainingClassCount * params.balance), // Lower balance limits number of classes in lower layers
      minClassesInLayer
    );
    const classesInLayer = faker.number.int({
      min: minClassesInLayer,
      max: maxClassesInLayer,
    });
    remainingClassCount -= classesInLayer;

    const newClasses: Array<FakeClass> = Array.from(Array(classesInLayer), () => {
      const numMethods = faker.number.int({
        min: params.minMethodCount,
        max: params.maxMethodCount,
      });
      const newMethods = Array.from(Array(numMethods), () => {
        const methodName = nameGenerator.getRandomMethodName();
        methods.push(methodName);
        return methodName;
      });
      const newClass = {
        identifier: nameGenerator.getRandomClassName(),
        methods: newMethods,
        parentAppName: appName,
      };
      classes.push(newClass);
      return newClass;
    });

    // Shuffle generated classes inbetween (potential) existing packages from previous iterations.
    // This is to prevent the packages and classes from being grouped separately (more heterogeneous structure)

    newClasses.forEach((element) => {
      currentLayer.splice(faker.number.int(currentLayer.length), 0, element);
    });

    // Put the code units on this layer into packages

    const newPackages = [];
    let remainingComponents = currentLayer.length;

    while (remainingComponents > 0) {
      const numComponentsToPackage = faker.number.int({
        min: 1,
        max: remainingComponents,
      });
      const componentsToPackage = currentLayer.slice(0, numComponentsToPackage);
      const classesToPackage: Array<FakeClass> = [];
      const packagesToPackage: Array<FakePackage> = [];
      const newPackage = {
        name: nameGenerator.getRandomPackageName(),
        classes: classesToPackage,
        subpackages: packagesToPackage,
      };

      componentsToPackage.forEach((component: FakePackage | FakeClass) => {
        component.parent = newPackage;
        if (isClass(component)) {
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

  // Create root package ("org.tracegenerator.[APP_NAME]")

  const rootPackage1: FakePackage = {
    name: 'org',
    classes: [],
    subpackages: [],
  };

  const rootPackage2: FakePackage = {
    name: 'tracegenerator',
    classes: [],
    subpackages: [],
    parent: rootPackage1,
  };

  const rootPackage3: FakePackage = {
    name: appName.replace(/-/g, ''),
    classes: [],
    subpackages: currentLayer as Array<FakePackage>, // Will only contain packages at this point
    parent: rootPackage2,
  };

  rootPackage1.subpackages.push(rootPackage2);
  rootPackage2.subpackages.push(rootPackage3);

  currentLayer.forEach((pkg) => (pkg.parent = rootPackage3));

  // Fill root layer with remaining classes, if any

  const remainingClasses = Array.from(Array(remainingClassCount), () => {
    const numMethods = faker.number.int({
      min: params.minMethodCount,
      max: params.maxMethodCount,
    });
    const newMethods = Array.from(Array(numMethods), () => {
      const methodName = nameGenerator.getRandomMethodName();
      methods.push(methodName);
      return methodName;
    });
    const newClass = {
      identifier: nameGenerator.getRandomClassName(),
      methods: newMethods,
      parent: rootPackage3,
      parentAppName: appName,
    };
    classes.push(newClass);
    return newClass;
  });

  rootPackage3.classes = remainingClasses;

  const entryPoint = faker.helpers.arrayElement(classes);

  const fakeApp: FakeApp = {
    name: appName,
    rootPackages: [rootPackage1],
    entryPoint: entryPoint,
    classes: classes,
    packages: packages,
    methods: methods,
  };

  return fakeApp;
}

/**
 * Defines the different strategies for class selection during trace generation.
 */
export enum CommunicationStyle {
  /**
   * With this style, the next class is chosen completely at random. It can be
   * from any app and any package, with uniform probability given to all classes.
   */
  TRUE_RANDOM,
  /**
   * With this style, communication should mostly happen within packages.
   * For each package, a single class is selected as an interface class which
   * is linked to a class from another package. When such an interface class
   * is chosen, the next chosen class will be the interface class. Otherwise,
   * we choose a random class from within the package we were in previously.
   */
  COHESIVE,
  /**
   * With this style, communication should mostly happen within packages.
   * By default, we stay within the package we were in previously (also including
   * any subpackages of that package). Every time we choose a new class, there is
   * a random chance that we leave our package to enter a different one.
   */
  RANDOM_EXIT,
}

/**
 * A function type for class selection strategies used during trace generation.
 */
type NextClassStrategy = (
  apps: Array<FakeApp>,
  classes: Array<FakeClass>,
  previousClass: FakeClass,
  visitedClasses: Set<FakeClass>,
  allowCyclicCalls: boolean
) => FakeClass;

const strategyTrueRandom: NextClassStrategy = (apps, classes, previousClass, visitedClasses, allowCyclicCalls) => {
  if (allowCyclicCalls) {
    return faker.helpers.arrayElement(classes);
  }

  const remainingClasses = classes.filter((element) => {
    return !visitedClasses.has(element);
  });

  return faker.helpers.arrayElement(remainingClasses);
};

const strategyCohesive: NextClassStrategy = (apps, classes, previousClass, visitedClasses, allowCyclicCalls) => {
  if (previousClass.parent === undefined) {
    return strategyTrueRandom(apps, classes, previousClass, visitedClasses, allowCyclicCalls);
  }

  if (previousClass.linkedClass !== undefined) {
    return previousClass.linkedClass;
  }

  const neighborClasses = getAllChildClasses(previousClass.parent);
  if (allowCyclicCalls) {
    return faker.helpers.arrayElement(neighborClasses);
  }

  return faker.helpers.arrayElement(
    neighborClasses.filter((element) => {
      return !visitedClasses.has(element);
    })
  );
};

const strategyRandomExit: NextClassStrategy = (apps, classes, previousClass, visitedClasses, allowCyclicCalls) => {
  const EXIT_CHANCE = 5;

  if (previousClass.parent === undefined) {
    return strategyTrueRandom(apps, classes, previousClass, visitedClasses, allowCyclicCalls);
  }

  const neighborClasses = getAllChildClasses(previousClass.parent);

  if (faker.number.int({ min: 1, max: EXIT_CHANCE }) !== 1) {
    // Stay inside package case

    if (allowCyclicCalls) {
      return faker.helpers.arrayElement(neighborClasses);
    }

    const unvisitedNeighborClasses = neighborClasses.filter((classModel) => !visitedClasses.has(classModel));

    // If there are unvisited neighbors left, choose one at random

    if (unvisitedNeighborClasses.length !== 0) {
      return faker.helpers.arrayElement(unvisitedNeighborClasses);
    }

    // ... otherwise, proceed to exit case anyways to avoid cyclic calls
  }

  // Exit package case

  if (allowCyclicCalls) {
    const outsiderClasses = classes.filter((classModel) => !neighborClasses.includes(classModel));
    return faker.helpers.arrayElement(outsiderClasses);
  }
  const outsiderClasses = classes.filter(
    (classModel) => !neighborClasses.includes(classModel) && !visitedClasses.has(classModel)
  );
  return faker.helpers.arrayElement(outsiderClasses);
};

const nextClassStrats: Record<CommunicationStyle, NextClassStrategy> = {
  [CommunicationStyle.TRUE_RANDOM]: strategyTrueRandom,
  [CommunicationStyle.COHESIVE]: strategyCohesive,
  [CommunicationStyle.RANDOM_EXIT]: strategyRandomExit,
};

/**
 * These parameters can be used to configure the second step of trace generation,
 * in which a trace is simulated upon a previously generated app structure.
 */
export interface TraceGenerationParameters {
  /**
   * Duration of the trace in milliseconds. The method calls will be distributed equally within this timeframe
   */
  duration: number;
  /**
   * How many method calls (between different classes) should occur within the duration of the trace
   */
  callCount: number;
  /**
   * This sets a limit to how high the method call stack can grow.
   * Must be greater than 0
   */
  maxConnectionDepth: number;
  /**
   * This specifies the way in which application-internal classes communicate with each other.
   * Styles differ in the way that classes for communication are selected.
   * For more information, see {@link CommunicationStyle}
   */
  communicationStyle: CommunicationStyle;
  /**
   * Whether there may exist cyclic method calls in the trace.
   * Setting this to true won't guarantee cyclic calls to be in the generated trace, it only allows them
   */
  allowCyclicCalls: boolean;
  /**
   * Whether to ensure all methods in the landscape are visited at least once.
   * When enabled, the trace will visit every method before continuing with normal generation.
   * The callCount parameter will be adjusted if necessary to accommodate all methods.
   */
  visitAllMethods?: boolean;
  /**
   * Attributes of constant value to include in every span of the trace
   */
  fixedAttributes?: Attributes;
  /**
   * Can optionally be used to yield reproducable results. The seed is set once before generating all the apps.
   * This is separate from the app generation seed to allow generation of different traces using the same apps.
   */
  seed?: number;
}

/**
 * Link one class from each package to a class from another package for use with the "cohesive" class strategy
 * @param apps The app structure for which to place interface classes
 */
function placeInterfaceClasses(apps: Array<FakeApp>) {
  const packages = apps
    .map((app) => app.packages)
    .reduce((acc, val) => acc.concat(val), [])
    .filter((pkg) => pkg.classes.length > 0);

  if (packages.length === 0) {
    console.debug('INFO: Apps contain no packages, cannot place interfaces');
    return;
  }

  for (let i = 0; i < packages.length; i++) {
    const selectedClass = faker.helpers.arrayElement(packages[i].classes);
    const linkedClass = faker.helpers.arrayElement(packages[(i + 1) % packages.length].classes);
    selectedClass.linkedClass = linkedClass;
  }
}

/**
 * Generate a {@link FakeTrace} upon a previously generated app structure
 * @param apps The app structure on which to simulate a trace
 * @param params
 * @returns A {@link FakeTrace} object based upon the passed app structure
 * @throws RangeError
 */
export function generateFakeTrace(apps: Array<FakeApp>, params: TraceGenerationParameters): FakeTrace {
  /**
   * This function generates spans by simulating a call stack. We perform as many iterations
   * as there are method calls specified in the parameters. In each iteration, we add a method
   * call to the call stack. We then remove calls from the stack at random. When removing calls
   * from the stack, we set the corresponding span to be a child span of the span below.
   * Once all iterations are complete, we remove all calls from the stack, leaving only the
   * root span behind which contains every generated span as a child.
   */

  // Check for parameter validity

  if (apps.length < 1) {
    throw new RangeError('Must provide at least 1 app to generate a trace for');
  }

  if (params.duration < 1) {
    throw new RangeError('Duration may not be less than 1');
  }

  if (params.callCount < 1) {
    throw new RangeError('Trace must have at least one method call');
  }

  if (params.maxConnectionDepth < 1) {
    throw new RangeError('Max Connection Depth may not be less than 1');
  }

  if (params.seed !== undefined) {
    faker.seed(params.seed);
  } else {
    faker.seed(); // Use random seed
  }

  if (params.communicationStyle === CommunicationStyle.COHESIVE) {
    placeInterfaceClasses(apps);
  }

  const startingApp = apps[0];
  let timePassed = 0;
  const entryPoint = startingApp.entryPoint;
  const entryMethod = faker.helpers.arrayElement(entryPoint.methods);
  const entryPointFqn = getClassFqn(entryPoint);

  let spanAttrs: Attributes = {};
  if (params.fixedAttributes !== undefined) {
    spanAttrs = {
      ...params.fixedAttributes,
    };
  }
  spanAttrs[ATTR_SERVICE_NAME] = startingApp.name;
  spanAttrs[SEMATTRS_CODE_NAMESPACE] = entryPointFqn;
  spanAttrs[ATTR_CODE_FUNCTION_NAME] = entryMethod;

  const entrySpan: FakeSpan = {
    name: `${entryPointFqn}.${entryMethod}`,
    relativeStartTime: 0,
    relativeEndTime: params.duration,
    attributes: { ...spanAttrs },
    children: [],
  };

  const resultTrace: FakeTrace = [];
  const classStack: Array<[FakeClass, FakeSpan]> = [[entryPoint, entrySpan]];

  const classes: Array<FakeClass> = apps
    .map((app) => app.classes)
    .reduce((allClasses, appClasses) => {
      return allClasses.concat(appClasses);
    }, []);
  const visitedClasses: Set<FakeClass> = new Set([entryPoint]);
  let previousClass: FakeClass = entryPoint;
  let generatedSpanCount: number = 0;

  // Collect all methods for visitAllMethods feature
  interface MethodReference {
    class: FakeClass;
    method: string;
  }
  const allMethods: Array<MethodReference> = [];
  classes.forEach((cls) => {
    cls.methods.forEach((method) => {
      allMethods.push({ class: cls, method: method });
    });
  });
  const visitedMethods: Set<MethodReference> = new Set();

  // Mark entry method as visited
  const entryMethodRef = allMethods.find((m) => m.class === entryPoint && m.method === entryMethod);
  if (entryMethodRef) {
    visitedMethods.add(entryMethodRef);
  }

  // Adjust callCount if visitAllMethods is enabled and we need more calls
  const effectiveCallCount = params.visitAllMethods ? Math.max(params.callCount, allMethods.length) : params.callCount;

  // Calculate call interval based on effective call count
  const callInterval = params.duration / effectiveCallCount;

  while (generatedSpanCount < effectiveCallCount) {
    // Select next class for method call

    let nextClass: FakeClass;
    let nextMethod: string;

    // If visitAllMethods is enabled and there are unvisited methods, prioritize them
    if (params.visitAllMethods && visitedMethods.size < allMethods.length) {
      const unvisitedMethods = allMethods.filter((m) => !visitedMethods.has(m));
      if (unvisitedMethods.length > 0) {
        // Select a random unvisited method
        const methodRef = faker.helpers.arrayElement(unvisitedMethods);
        nextClass = methodRef.class;
        nextMethod = methodRef.method;
        visitedMethods.add(methodRef);
        // Also mark the class as visited for communication style tracking
        visitedClasses.add(nextClass);
      } else {
        // All methods visited, continue with normal selection
        try {
          nextClass = nextClassStrats[params.communicationStyle](
            apps,
            classes,
            previousClass,
            visitedClasses,
            params.allowCyclicCalls
          );
          nextMethod = faker.helpers.arrayElement(nextClass.methods);
        } catch {
          // Next class couldn't be determined, meaning there are no unvisited classes left
          if (classStack.length > 1) {
            const head = classStack.pop() as [FakeClass, FakeSpan];
            head[1].relativeEndTime = timePassed;
            visitedClasses.delete(head[0]);
            classStack[classStack.length - 1][1].children.push(head[1]);
            previousClass = classStack[classStack.length - 1][0];
          } else {
            // Cannot reduce stack further, break out of the loop
            break;
          }
          continue;
        }
      }
    } else {
      // Normal selection mode
      try {
        nextClass = nextClassStrats[params.communicationStyle](
          apps,
          classes,
          previousClass,
          visitedClasses,
          params.allowCyclicCalls
        );
      } catch {
        // Next class couldn't be determined, meaning there are no unvisited classes left
        if (classStack.length > 1) {
          const head = classStack.pop() as [FakeClass, FakeSpan];
          head[1].relativeEndTime = timePassed;
          visitedClasses.delete(head[0]);
          classStack[classStack.length - 1][1].children.push(head[1]);
          previousClass = classStack[classStack.length - 1][0];
        } else {
          // Cannot reduce stack further, break out of the loop
          break;
        }
        continue;
      }
      nextMethod = faker.helpers.arrayElement(nextClass.methods);

      // Track visited method if visitAllMethods is enabled
      if (params.visitAllMethods) {
        const methodRef = allMethods.find((m) => m.class === nextClass && m.method === nextMethod);
        if (methodRef) {
          visitedMethods.add(methodRef);
        }
      }
    }
    const classFqn = getClassFqn(nextClass);
    spanAttrs[ATTR_SERVICE_NAME] = nextClass.parentAppName;
    spanAttrs[SEMATTRS_CODE_NAMESPACE] = classFqn;
    spanAttrs[ATTR_CODE_FUNCTION_NAME] = nextMethod;
    const nextSpan: FakeSpan = {
      name: `${classFqn}.${nextMethod}`,
      relativeStartTime: timePassed,
      relativeEndTime: -1,
      attributes: { ...spanAttrs },
      children: [],
    };

    visitedClasses.add(nextClass);
    previousClass = nextClass;

    // Randomly remove calls from the stack for more dynamic behavior
    // Ensure we maintain at least 1 item and respect maxConnectionDepth after the push
    while (
      classStack.length > 1 &&
      (classStack.length >= params.maxConnectionDepth || faker.number.int({ min: 0, max: 1 }) === 1)
    ) {
      const head = classStack.pop() as [FakeClass, FakeSpan];
      head[1].relativeEndTime = timePassed;
      visitedClasses.delete(head[0]);
      classStack[classStack.length - 1][1].children.push(head[1]);
      previousClass = classStack[classStack.length - 1][0];
    }
    classStack.push([nextClass, nextSpan]);

    timePassed += callInterval;
    generatedSpanCount++;
  }

  // Clear remaining stack

  while (classStack.length > 0) {
    const head = classStack.pop() as [FakeClass, FakeSpan];
    head[1].relativeEndTime = timePassed;
    if (classStack.length === 0) {
      resultTrace.push(head[1]);
      break;
    } else {
      classStack[classStack.length - 1][1].children.push(head[1]);
    }
  }

  return resultTrace;
}
