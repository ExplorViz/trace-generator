import { faker } from "@faker-js/faker";
import { FakeTrace, FakeSpan } from "./tracing";
import { hrTime } from "@opentelemetry/core";
import { strict as assert } from "assert";
import { Attributes } from "@opentelemetry/api";
import {
  SEMATTRS_CODE_FUNCTION,
  SEMATTRS_CODE_NAMESPACE,
} from "@opentelemetry/semantic-conventions";
import { NameGenerator } from "./naming";

interface FakeMethod {
  identifier: string;
}

interface FakeClass {
  identifier: string;
  methods: Array<FakeMethod>;
  parent?: FakePackage;
  parentAppName: string; // TODO very hacky solution
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

function isClass(codeUnit: FakeClass | FakePackage): codeUnit is FakeClass {
  return (codeUnit as FakeClass).methods !== undefined;
}

function isPackage(codeUnit: FakeClass | FakePackage): codeUnit is FakePackage {
  return (codeUnit as FakePackage).subpackages !== undefined;
}

function getClassFqn(fakeClass: FakeClass): string {
  let fqn: string = fakeClass.identifier;
  let obj: FakeClass | FakePackage = fakeClass;
  while (obj.parent !== undefined) {
    fqn = obj.parent.name + "." + fqn;
    obj = obj.parent;
  }
  return fqn;
}

function getAllChildClasses(fakePackage: FakePackage): Array<FakeClass> {
  let result = [...fakePackage.classes];
  fakePackage.subpackages.forEach((subpackage) => {
    result.concat(getAllChildClasses(subpackage));
  });
  return result;
}

export interface AppGenerationParameters {
  /**
   * How many apps should be generated. All generated apps will use the same generation parameters.
   */
  appCount: number;
  /**
   * How deep the package structure should reach, not including the root package.
   * A depth of 0 means that there are no sub-packages inside the root package, only classes
   */
  packageDepth: number;
  /**
   * How many classes each generated app should contain at the least.
   * Must be greater than 0
   */
  minClassCount: number;
  /**
   * The highest number of classes that each of the generated apps may contain
   */
  maxClassCount: number;
  /**
   * How many methods any given class must possess at the minimum
   */
  minMethodCount: number;
  /**
   * The max number of methods any class may possess
   */
  maxMethodCount: number;
  /**
   * Influences the balance of generated trees, where 1 is perfectly balanced and 0 is extremely unbalanced.
   * Low balance values mean that code units are more likely to be placed near the root package.
   * Note that this only influences the random generation, the resulting application tree can be very unbalanced
   * even for a balance value of 1.
   * May only be between 0 and 1
   */
  balance: number;
  /**
   * Can optionally be used to yield reproducable results. The seed is set once before generating all the apps.
   */
  seed?: number;
}

/**
 * Generate some fake applications, with all the apps using the same generation parameters.
 * @param params Specifies the generation behaviour, especially the size of the applications. See {@link AppGenerationParameters}
 * @returns A list of {@link FakeApp}s conforming to the specified parameters
 */
export function generateFakeApps(
  params: AppGenerationParameters,
): Array<FakeApp> {
  // Set seed, if one was provided (for reproducable results)

  if (params.seed !== undefined) {
    faker.seed(params.seed);
  } else {
    faker.seed(); // Use random seed
  }

  return Array.from(Array(params.appCount), (_) => generateFakeApp(params));
}

/**
 * Generate a fake application tree structure consisting of packages (internal nodes)
 * and classes (leaf nodes).
 * @param params Specifies the generation behaviour, especially the size of the application. See {{@link AppGenerationParameters}
 * @returns A {@link FakeApp} which conforms to the specifed parameters
 * @throws {RangeError}
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
    throw new RangeError("App requires at least 1 class");
  }

  if (params.minMethodCount < 1) {
    throw new RangeError("Each class requires at least 1 method");
  }

  if (params.packageDepth < 0) {
    throw new RangeError("Package depth may not be negative");
  }

  if (params.maxClassCount < params.minClassCount) {
    throw new RangeError("Class count min may not exceed max");
  }

  if (params.maxMethodCount < params.minMethodCount) {
    throw new RangeError("Method count min may not exceed max");
  }

  if (params.balance < 0 || params.balance > 1) {
    throw new RangeError("Balance value must be between 0 and 1");
  }

  const nameGenerator: NameGenerator = new NameGenerator();
  const appName = nameGenerator.getRandomAppName();

  // Convenience arrays

  let classes: Array<FakeClass> = [];
  let packages: Array<FakePackage> = [];
  let methods: Array<FakeMethod> = [];

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
      Math.floor(remainingClassCount * params.balance),
      minClassesInLayer,
    );
    const classesInLayer = faker.number.int({
      min: minClassesInLayer,
      max: maxClassesInLayer,
    });
    remainingClassCount -= classesInLayer;

    let newClasses: Array<FakeClass> = Array.from(
      Array(classesInLayer),
      (_) => {
        const numMethods = faker.number.int({
          min: params.minMethodCount,
          max: params.maxMethodCount,
        });
        const newMethods = Array.from(Array(numMethods), (_) => {
          const newMethod = {
            identifier: nameGenerator.getRandomMethodName(),
          };
          methods.push(newMethod);
          return newMethod;
        });
        const newClass = {
          identifier: nameGenerator.getRandomClassName(),
          methods: newMethods,
          parentAppName: appName,
        };
        classes.push(newClass);
        return newClass;
      },
    );

    // Shuffle generated classes inbetween (potential) existing packages from previous iterations.
    // This is to prevent the packages and classes from being grouped separately (more heterogeneous structure)

    newClasses.forEach((element) => {
      currentLayer.splice(faker.number.int(currentLayer.length), 0, element);
    });

    // Put the code units on this layer into packages

    let newPackages = [];
    let remainingComponents = currentLayer.length;

    while (remainingComponents > 0) {
      const numComponentsToPackage = faker.number.int({
        min: 1,
        max: remainingComponents,
      });
      const componentsToPackage = currentLayer.slice(0, numComponentsToPackage);
      let classesToPackage: Array<FakeClass> = [];
      let packagesToPackage: Array<FakePackage> = [];
      let newPackage = {
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

  // Create root package ("org.tracegen.[APP_NAME]")

  let rootPackage1: FakePackage;
  let rootPackage2: FakePackage;
  let rootPackage3: FakePackage;

  rootPackage1 = {
    name: "org",
    classes: [],
    subpackages: [],
  };

  rootPackage2 = {
    name: "tracegen",
    classes: [],
    subpackages: [],
    parent: rootPackage1,
  };

  rootPackage3 = {
    name: appName.replace(/-/g, ""),
    classes: [],
    subpackages: currentLayer as Array<FakePackage>, // Will only contain packages at this point
    parent: rootPackage2,
  };

  rootPackage1.subpackages.push(rootPackage2);
  rootPackage2.subpackages.push(rootPackage3);

  currentLayer.forEach((pkg) => (pkg.parent = rootPackage3));

  // Fill root layer with remaining classes, if any

  let remainingClasses = Array.from(Array(remainingClassCount), (_) => {
    const numMethods = faker.number.int({
      min: params.minMethodCount,
      max: params.maxMethodCount,
    });
    const newMethods = Array.from(Array(numMethods), (_) => {
      const newMethod = {
        identifier: nameGenerator.getRandomMethodName(),
      };
      methods.push(newMethod);
      return newMethod;
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
    rootPackage: rootPackage1,
    entryPoint: entryPoint,
    classes: classes,
    packages: packages,
    methods: methods,
  };

  return fakeApp;
}

export const enum CommunicationStyle {
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

type NextClassStrategy = (
  apps: Array<FakeApp>,
  classes: Array<FakeClass>,
  previousClass: FakeClass,
  visitedClasses: Set<FakeClass>,
  allowCyclicCalls: boolean,
) => FakeClass;

const strategyTrueRandom: NextClassStrategy = (
  apps,
  classes,
  previousClass,
  visitedClasses,
  allowCyclicCalls,
) => {
  if (allowCyclicCalls) {
    return faker.helpers.arrayElement(classes);
  }

  const remainingClasses = classes.filter((element) => {
    return !visitedClasses.has(element);
  });

  return faker.helpers.arrayElement(remainingClasses);
};

const strategyCohesive: NextClassStrategy = (
  apps,
  classes,
  previousClass,
  visitedClasses,
  allowCyclicCalls,
) => {
  if (previousClass.parent === undefined) {
    return strategyTrueRandom(
      apps,
      classes,
      previousClass,
      visitedClasses,
      allowCyclicCalls,
    );
  }

  if (previousClass.linkedClass !== undefined) {
    return previousClass.linkedClass;
  }

  const neighbourClasses = getAllChildClasses(previousClass.parent);
  if (allowCyclicCalls) {
    return faker.helpers.arrayElement(neighbourClasses);
  }

  return faker.helpers.arrayElement(
    neighbourClasses.filter((element) => {
      return !visitedClasses.has(element);
    }),
  );
};

const strategyRandomExit: NextClassStrategy = (
  apps,
  classes,
  previousClass,
  visitedClasses,
  allowCyclicCalls,
) => {
  const EXIT_CHANCE = 5; // Chance is one in EXIT_CHANCE

  if (previousClass.parent === undefined) {
    return strategyTrueRandom(
      apps,
      classes,
      previousClass,
      visitedClasses,
      allowCyclicCalls,
    );
  }

  let neighbourClasses = getAllChildClasses(previousClass.parent);

  if (faker.number.int({ min: 1, max: EXIT_CHANCE }) !== 1) {
    // Stay inside package case

    if (allowCyclicCalls) {
      return faker.helpers.arrayElement(neighbourClasses);
    }

    const unvisitedNeighbourClasses = neighbourClasses.filter(
      (clazz) => !visitedClasses.has(clazz),
    );

    // If there are unvisited neighbors left, choose one at random

    if (unvisitedNeighbourClasses.length !== 0) {
      return faker.helpers.arrayElement(unvisitedNeighbourClasses);
    }

    // ... otherwise, proceed to exit case anyways to avoid cyclic calls
  }

  // Exit package case

  if (allowCyclicCalls) {
    const outsiderClasses = classes.filter(
      (clazz) => !neighbourClasses.includes(clazz),
    );
    return faker.helpers.arrayElement(outsiderClasses);
  }
  const outsiderClasses = classes.filter(
    (clazz) => !neighbourClasses.includes(clazz) && !visitedClasses.has(clazz),
  );
  return faker.helpers.arrayElement(outsiderClasses);
};

const nextClassStrats: Record<CommunicationStyle, NextClassStrategy> = {
  [CommunicationStyle.TRUE_RANDOM]: strategyTrueRandom,
  [CommunicationStyle.COHESIVE]: strategyCohesive,
  [CommunicationStyle.RANDOM_EXIT]: strategyRandomExit,
};

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
   * Attributes of constant value to include in every span of the trace
   */
  fixedAttributes?: Attributes;
  /**
   * Can optionally be used to yield reproducable results. The seed is set once before generating all the apps.
   * This is separate from the app generation seed to allow generation of different traces using the same apps.
   */
  seed?: number;
}

function placeInterfaceClasses(apps: Array<FakeApp>) {
  const packages = apps
    .map((app) => app.packages)
    .reduce((acc, val) => acc.concat(val), [])
    .filter((pkg) => pkg.classes.length > 0);

  if (packages.length === 0) {
    console.debug("INFO: Apps contain no packages, cannot place interfaces");
    return;
  }

  for (let i = 0; i < packages.length; i++) {
    const selectedClass = faker.helpers.arrayElement(packages[i].classes);
    const linkedClass = faker.helpers.arrayElement(
      packages[(i + 1) % packages.length].classes,
    );
    selectedClass.linkedClass = linkedClass;
  }
}

export function generateFakeTrace(
  apps: Array<FakeApp>,
  params: TraceGenerationParameters,
): FakeTrace {
  // TODO check parameter validity

  if (apps.length < 1) {
    throw new RangeError("Must provide at least 1 app to generate a trace for");
  }

  if (params.maxConnectionDepth < 1) {
    throw new RangeError("Max Connection Depth may not be less than 1");
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
  const callInterval = params.duration / params.callCount;
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
  spanAttrs["service.name"] = startingApp.name;
  spanAttrs[SEMATTRS_CODE_NAMESPACE] = entryPointFqn;
  spanAttrs[SEMATTRS_CODE_FUNCTION] = entryMethod.identifier;

  let entrySpan: FakeSpan = {
    name: `${entryPointFqn}.${entryMethod.identifier}`,
    relativeStartTime: 0,
    relativeEndTime: params.duration,
    attributes: { ...spanAttrs },
    children: [],
  };

  let resultTrace: FakeTrace = [];
  let classStack: Array<[FakeClass, FakeSpan]> = [[entryPoint, entrySpan]];

  const classes: Array<FakeClass> = apps
    .map((app) => app.classes)
    .reduce((allClasses, appClasses) => {
      return allClasses.concat(appClasses);
    }, []);
  const visitedClasses: Set<FakeClass> = new Set([entryPoint]);
  let previousClass: FakeClass = entryPoint;
  let generatedSpanCount: number = 0;

  while (generatedSpanCount < params.callCount) {
    // Select next class for method call

    let nextClass: FakeClass;
    try {
      nextClass = nextClassStrats[params.communicationStyle](
        apps,
        classes,
        previousClass,
        visitedClasses,
        params.allowCyclicCalls,
      );
    } catch (err) {
      // Next class couldn't be determined, classStack is probably at max length
      if (classStack.length > 1) {
        const head = classStack.pop() as [FakeClass, FakeSpan];
        head[1].relativeEndTime = timePassed;
        visitedClasses.delete(head[0]);
        classStack[classStack.length - 1][1].children.push(head[1]);
        previousClass = classStack[classStack.length - 1][0];
      }
      continue;
    }
    const nextMethod = faker.helpers.arrayElement(nextClass.methods);
    const classFqn = getClassFqn(nextClass);
    spanAttrs["service.name"] = nextClass.parentAppName;
    spanAttrs[SEMATTRS_CODE_NAMESPACE] = classFqn;
    spanAttrs[SEMATTRS_CODE_FUNCTION] = nextMethod.identifier;
    let nextSpan: FakeSpan = {
      name: `${classFqn}.${nextMethod.identifier}`,
      relativeStartTime: timePassed,
      relativeEndTime: -1,
      attributes: { ...spanAttrs },
      children: [],
    };

    visitedClasses.add(nextClass);
    previousClass = nextClass;

    while (
      classStack.length > params.maxConnectionDepth ||
      (classStack.length > 1 && faker.number.int({ min: 0, max: 1 }) === 1)
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
