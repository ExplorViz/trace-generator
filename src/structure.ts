import { faker } from '@faker-js/faker'
import {capitalizeString} from './utils'
import {
  SEMRESATTRS_SERVICE_VERSION,
  SEMRESATTRS_TELEMETRY_SDK_LANGUAGE
} from '@opentelemetry/semantic-conventions';

interface FakeMethod {
  identifier: string
  parent?: FakeClass
}

interface FakeClass {
  identifier: string,
  methods: Array<FakeMethod>,
  parent?: FakePackage
}

interface FakePackage {
  name: string,
  children: Array<FakePackage | FakeClass>,
  parent?: FakePackage
}

interface FakeApp {
  rootPackage: FakePackage,
  entryPoint: FakeMethod
}

export interface AppGenerationParameters {
  /**
   * How deep the package structure should reach, not including the root package.
   * A depth of 0 means that there are no sub-packages inside the root package, only classes
   */
  packageDepth: number,
  /**
   * How many classes the app should contain at the least.
   * This should be at least 1
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
   * Note that this only influences the random generation, the resulting application tree can be very unbalanced
   * even for a balance value of 1.
   * May only be between 0 and 1
   */
  balance: number
}

/**
 * Generate a fake application tree structure consisting of packages (internal nodes)
 * and classes (leaf nodes). 
 * @param params 
 */
export function generateFakeApp(params: AppGenerationParameters): FakeApp {

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
  let methods: Array<FakeMethod> = [];

  const classCount: number = faker.number.int({min: params.minClassCount, max: params.maxClassCount});
  let remainingClassCount: number = classCount;
  let currentLayer: Array<FakePackage | FakeClass> = [];

  // Create application tree

  for (let layer = params.packageDepth - 1; layer > 0; layer--) {

    // Generate random classes for this layer

    const minClassesInLayer = layer == params.packageDepth ? 1 : 0; // Deepest layer requires at least 1 class
    const maxClassesInLayer = Math.floor(remainingClassCount * params.balance);
    const classesInLayer = faker.number.int({min: minClassesInLayer, max: maxClassesInLayer});

    let newClasses: Array<FakeClass> = Array.from(Array(classesInLayer), _ => {
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
    
    // Shuffle generated classes inbetween (potential) existing packages from previous iterations.
    // This is to prevent the packages and classes from being grouped separately (more heterogeneous structure)

    newClasses.forEach((element) => {
      currentLayer.splice(faker.number.int(currentLayer.length), 0, element);
    });

    // Put the code units on this layer into packages
    
    let newPackages = [];
    let remainingComponents = currentLayer.length;

    while (remainingComponents > 0) {
      const componentsToPackage = faker.number.int({min: 1, max: remainingComponents});
      newPackages.push({name: faker.hacker.noun(), children: currentLayer.slice(componentsToPackage)});
      currentLayer.splice(0, componentsToPackage);
      remainingComponents -= componentsToPackage;
    }

    currentLayer = newPackages;
  }

  // Fill top layer with remaining classes, if any

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

  currentLayer.concat(remainingClasses);

  const rootPackage: FakePackage = {
    name: 'org',
    children: [{
      name: 'tracegen',
      children: [{
        name: 'randomapp',
        children: currentLayer
      }]
    }]
  };

  const entryPoint = methods[faker.number.int(methods.length-1)];
  const fakeApp = {
    rootPackage: rootPackage,
    entryPoint: entryPoint
  };
  return fakeApp;
}

export interface TraceGenerationParameters {
  /**
   * How many different applications should be involved in the trace
   */
  appCount: number,
  /**
   * Duration of the trace in seconds. The method calls will be distributed equally within this timeframe
   */
  duration: number,
  connectionDepth: number,
  /**
   * Whether there should exist self-referential methods in the trace
   */
  includeRecursion: boolean,
  /**
   * Whether classes from the standard library should be involved in the trace (i.e. java.lang)
   */
  includeUtilityClasses: boolean
}

/*
Todo java.lang, java.net, java.io, java.security, java.util, java.sql, java.time
*/

// export function generateFakeTrace(apps: Array<FakeApp>): FakeTrace {} 