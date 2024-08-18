import { faker } from "@faker-js/faker";
import fs from "node:fs";
import { capitalizeString, sanitizeJavaIdentifier } from "./utils";

const PATH_CLASS_NAMES = "src/resources/class-names.txt";
const PATH_PACKAGE_NAMES = "src/resources/package-names.txt";
const PATH_METHOD_NAMES = "src/resources/method-names.txt";
const PATH_APP_NAMES = "src/resources/app-names.txt";

export class NameGenerator {
  private readonly classNames: Array<string>;
  private readonly packageNames: Array<string>;
  private readonly methodNames: Array<string>;
  private readonly appNames: Array<string>;

  constructor() {
    this.classNames = fs
      .readFileSync(PATH_CLASS_NAMES, { encoding: "utf-8" })
      .split("\n");
    this.packageNames = fs
      .readFileSync(PATH_PACKAGE_NAMES, { encoding: "utf-8" })
      .split("\n");
    this.methodNames = fs
      .readFileSync(PATH_METHOD_NAMES, { encoding: "utf-8" })
      .split("\n");
    this.appNames = fs
      .readFileSync(PATH_APP_NAMES, { encoding: "utf-8" })
      .split("\n");
  }

  getRandomClassName(): string {
    if (this.classNames.length === 0) {
      return this.getRandomClassNameFallback();
    }
    const randomIdx = faker.number.int(this.classNames.length - 1);
    const randomClassName = this.classNames[randomIdx];
    this.classNames.splice(randomIdx, 1);
    return randomClassName;
  }

  getRandomPackageName(): string {
    if (this.packageNames.length === 0) {
      return this.getRandomPackageNameFallback();
    }
    const randomIdx = faker.number.int(this.packageNames.length - 1);
    const randomPackageName = this.packageNames[randomIdx];
    this.packageNames.splice(randomIdx, 1);
    return randomPackageName;
  }

  getRandomMethodName(): string {
    if (this.methodNames.length === 0) {
      return this.getRandomMethodNameFallback();
    }
    const randomIdx = faker.number.int(this.methodNames.length - 1);
    const randomMethodName = this.methodNames[randomIdx];
    this.methodNames.splice(randomIdx, 1);
    return randomMethodName;
  }

  getRandomAppName(): string {
    if (this.appNames.length === 0) {
      return this.getRandomAppNameFallback();
    }
    const randomIdx = faker.number.int(this.appNames.length - 1);
    const randomAppName = this.appNames[randomIdx];
    this.appNames.splice(randomIdx, 1);
    return randomAppName;
  }

  private getRandomClassNameFallback(): string {
    return sanitizeJavaIdentifier(
      faker.hacker.noun() + capitalizeString(faker.hacker.noun()),
    );
  }

  private getRandomPackageNameFallback(): string {
    return sanitizeJavaIdentifier(
      faker.hacker.noun() +
        capitalizeString(faker.hacker.noun()) +
        capitalizeString(faker.hacker.noun()),
    );
  }

  private getRandomMethodNameFallback(): string {
    return sanitizeJavaIdentifier(
      faker.hacker.verb() + capitalizeString(faker.hacker.noun()),
    );
  }

  private getRandomAppNameFallback(): string {
    return sanitizeJavaIdentifier(
      faker.hacker.noun() + faker.hacker.noun() + faker.hacker.noun(),
    );
  }
}
