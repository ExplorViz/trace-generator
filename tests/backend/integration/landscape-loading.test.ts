import { readFileSync } from 'fs';
import { join } from 'path';
import { beforeEach, describe, expect, it } from 'vitest';
import { getClassFqn } from '../../../src/backend/generation';
import { sharedLandscapeStore } from '../../../src/backend/shared/landscape-store';
import { FakeApp } from '../../../src/backend/shared/types';
import { reconstructParentReferences } from '../../../src/backend/utils/landscape.utils';

describe('Landscape Loading Integration', () => {
  let petClinicData: any;
  let petClinicLandscape: FakeApp[];

  beforeEach(() => {
    const testDataPath = join(__dirname, '../test-data/petclinic-tracegen.json');
    const rawData = readFileSync(testDataPath, 'utf-8');
    petClinicData = JSON.parse(rawData);
    petClinicLandscape = reconstructParentReferences(petClinicData);
  });

  describe('Basic Loading', () => {
    it('should load petclinic JSON data', () => {
      expect(petClinicData.length).toBe(1);
    });

    it('should parse as array with single app', () => {
      expect(Array.isArray(petClinicData)).toBe(true);
      expect(petClinicData.length).toBe(1);
    });

    it('should have app name', () => {
      const app = petClinicLandscape[0];
      expect(app.name).toBe('petclinic-demo');
    });

    it('should have root package', () => {
      const app = petClinicLandscape[0];
      expect(app.rootPackage).toBeDefined();
      expect(app.rootPackage.name).toBe('org');
    });

    it('should have nested subpackages', () => {
      const app = petClinicLandscape[0];
      expect(app.rootPackage.subpackages.length).toBe(1);
      expect(app.rootPackage.subpackages[0].name).toBe('springframework');
    });

    it('should have correct number of classes', () => {
      const app = petClinicLandscape[0];
      expect(app.classes.length).toBe(18);
    });

    it('should have entry point', () => {
      const app = petClinicLandscape[0];
      expect(app.entryPoint).toBeDefined();
      expect(app.entryPoint.identifier).toBe('WelcomeController');
    });

    it('should have entry point', () => {
      const app = petClinicLandscape[0];
      expect(app.entryPoint).toBeDefined();
      expect(app.entryPoint.identifier).toBe('WelcomeController');

      // Verify FQN can be generated
      const fqn = getClassFqn(app.entryPoint);
      expect(fqn).toBe('org.springframework.samples.petclinic.system.WelcomeController');
    });
  });

  describe('Parent References', () => {
    it('should reconstruct parent references for all classes', () => {
      const app = petClinicLandscape[0];

      app.classes.forEach((cls) => {
        expect(cls.parent).toBeDefined();
      });
    });

    it('should reconstruct parent references for nested packages', () => {
      const app = petClinicLandscape[0];

      function checkPackageParents(pkg: any, parent?: any) {
        if (parent) {
          expect(pkg.parent).toBe(parent);
        }
        pkg.subpackages.forEach((subPkg: any) => {
          checkPackageParents(subPkg, pkg);
        });
      }

      checkPackageParents(app.rootPackage);
    });

    it('should generate correct FQN for WelcomeController', () => {
      const app = petClinicLandscape[0];
      const welcomeController = app.classes.find((cls) => cls.identifier === 'WelcomeController');

      expect(welcomeController).toBeDefined();
      expect(getClassFqn(welcomeController!)).toBe('org.springframework.samples.petclinic.system.WelcomeController');
    });

    it('should generate correct FQN for Owner', () => {
      const app = petClinicLandscape[0];
      const owner = app.classes.find((cls) => cls.identifier === 'Owner');

      expect(owner).toBeDefined();
      expect(getClassFqn(owner!)).toBe('org.springframework.samples.petclinic.owner.Owner');
    });
  });

  describe('LandscapeStore Integration', () => {
    it('should store and retrieve landscape', () => {
      sharedLandscapeStore.setLandscape(petClinicLandscape);

      const retrieved = sharedLandscapeStore.getLandscape();
      expect(retrieved).toBeDefined();
      expect(retrieved!.length).toBe(1);
      expect(retrieved![0].name).toBe('petclinic-demo');
    });

    it('should find class by FQN for entry point', () => {
      const app = petClinicLandscape[0];
      const fqn = 'org.springframework.samples.petclinic.system.WelcomeController';

      // Find class by checking FQN for each class
      const found = app.classes.find((cls) => getClassFqn(cls) === fqn);
      expect(found).toBeDefined();
      expect(found!.identifier).toBe('WelcomeController');
    });
  });

  describe('Data Structure Validation', () => {
    it('should have exactly 18 classes', () => {
      const app = petClinicLandscape[0];
      expect(app.classes.length).toBe(18);
    });

    it('should have correct class identifiers', () => {
      const app = petClinicLandscape[0];
      const expectedClasses = [
        'WelcomeController',
        'CrashController',
        'OwnerController',
        'Owner',
        'Pet',
        'Visit',
        'VisitController',
        'PetController',
        'PetType',
        'PetTypeFormatter',
        'Vet',
        'VetController',
        'Vets',
        'Specialty',
        'NamedEntity',
        'BaseEntity',
        'Person',
        'OncePerRequestFilter',
      ];

      const actualIdentifiers = app.classes.map((cls) => cls.identifier).sort();
      expect(actualIdentifiers).toEqual(expectedClasses.sort());
    });

    it('should have correct total method count', () => {
      const app = petClinicLandscape[0];
      expect(app.methods.length).toBe(74);
    });

    it('should have all classes with non-empty identifiers', () => {
      const app = petClinicLandscape[0];

      app.classes.forEach((cls) => {
        expect(cls.identifier).toBeDefined();
        expect(cls.identifier.length).toBe(cls.identifier.trim().length);
        expect(cls.identifier).not.toBe('');
      });
    });

    it('should have all methods with non-empty identifiers', () => {
      const app = petClinicLandscape[0];

      app.classes.forEach((cls) => {
        cls.methods.forEach((method) => {
          expect(method.identifier).toBeDefined();
          expect(method.identifier.length).toBe(method.identifier.trim().length);
          expect(method.identifier).not.toBe('');
        });
      });
    });
  });

  describe('Specific Classes Validation', () => {
    it('should load OwnerController with correct methods', () => {
      const app = petClinicLandscape[0];
      const ownerController = app.classes.find((cls) => cls.identifier === 'OwnerController');

      expect(ownerController).toBeDefined();
      expect(ownerController!.methods.length).toBe(11);
    });

    it('should have Owner class with correct method count', () => {
      const app = petClinicLandscape[0];
      const owner = app.classes.find((cls) => cls.identifier === 'Owner');

      expect(owner).toBeDefined();
      expect(owner!.methods.length).toBe(11);
    });

    it('should have Pet class with visits method', () => {
      const app = petClinicLandscape[0];
      const pet = app.classes.find((cls) => cls.identifier === 'Pet');

      expect(pet).toBeDefined();
      const hasGetVisits = pet!.methods.some((m) => m.identifier === 'getVisits');
      expect(hasGetVisits).toBe(true);
    });
  });

  describe('Statistics Calculation', () => {
    it('should calculate correct class count', () => {
      const app = petClinicLandscape[0];
      expect(app.classes.length).toBe(18);
    });

    it('should calculate correct method count', () => {
      const app = petClinicLandscape[0];
      expect(app.methods.length).toBe(74);
    });

    it('should calculate correct package count', () => {
      const app = petClinicLandscape[0];
      expect(app.packages.length).toBe(10);
    });

    it('should calculate correct max package depth', () => {
      const app = petClinicLandscape[0];

      function getMaxDepth(pkg: any, currentDepth = 1): number {
        if (pkg.subpackages.length === 0) return currentDepth;
        return Math.max(...pkg.subpackages.map((subPkg: any) => getMaxDepth(subPkg, currentDepth + 1)));
      }

      const maxDepth = getMaxDepth(app.rootPackage);
      expect(maxDepth).toBe(5);
    });
  });
});
