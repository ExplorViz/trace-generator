import { FakeApp, FakePackage } from './generation';
import { FakeSpan, FakeTrace } from './tracing';
import { hostname, networkInterfaces } from 'os';

/**
 * Takes any string and converts the first character to uppercase
 * @param text Any string of which the first character should be capitalized
 * @returns The input string, but the first character is capitalized (if applicable)
 */
export function capitalizeString(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Check whether the passed string represents a number (and does not merely contain one)
 * @param numStr String for which to check whether it is of a number
 * @returns true if the string in its entirety represents a number, false otherwise
 */
export function isValidNumber(numStr: string): boolean {
  return !isNaN(Number(numStr)) && !isNaN(parseFloat(numStr));
}

/**
 * Check whether the passed string represents an integer (and does not merely contain one)
 * @param numStr String for which to check whether it is of an integer
 * @returns true if the string in its entirety represents an integer, false otherwise
 */
export function isValidInteger(numStr: string): boolean {
  return isValidNumber(numStr) && Number.isInteger(parseFloat(numStr));
}

/**
 * Turn any given string into a valid Java identifier.
 * Removes invalid characters and trims numbers from start of string.
 * Any allowed non-ASCII characters are not accounted for and get removed.
 * @param identifier String to turn into a valid identifier
 * @returns Sanitized input string if it is a valid identifier, otherwise a fallback string
 */
export function sanitizeJavaIdentifier(identifier: string) {
  const JAVA_RESERVED_TOKENS = [
    'abstract',
    'continue',
    'for',
    'new',
    'switch',
    'assert',
    'default',
    'if',
    'package',
    'synchronized',
    'boolean',
    'do',
    'goto',
    'private',
    'this',
    'break',
    'double',
    'implements',
    'protected',
    'throw',
    'byte',
    'else',
    'import',
    'public',
    'throws',
    'case',
    'enum',
    'instanceof',
    'return',
    'transient',
    'catch',
    'extends',
    'int',
    'short',
    'try',
    'char',
    'final',
    'interface',
    'static',
    'void',
    'class',
    'finally',
    'long',
    'strictfp',
    'volatile',
    'const',
    'float',
    'native',
    'super',
    'while',
    'true',
    'false',
    'null',
  ];
  const IDENTIFIER_FALLBACK = 'fallbackIdentifier';
  let cleanedIdentifier = identifier.replace(/[^0-9a-z_$]/gi, ''); // Remove non-alphanumeric characters
  cleanedIdentifier = cleanedIdentifier.replace(/^[0-9]+/, ''); // Trim any numbers at beginning of identifier
  const isValidIdentifier: boolean = !JAVA_RESERVED_TOKENS.includes(cleanedIdentifier) && cleanedIdentifier != '';
  return isValidIdentifier ? cleanedIdentifier : IDENTIFIER_FALLBACK;
}

/**
 * Return the hostname of the executing machine
 * @returns
 */
export function getHostname(): string {
  return hostname();
}

/**
 * Find the first non-internal IPv4 address of the host
 * @returns String representation of the found IP address
 */
export function getHostIP(): string {
  const fallbackIP = '0.0.0.0';
  const nets = networkInterfaces();
  for (const key of Object.keys(nets)) {
    const netInfo = nets[key];
    if (netInfo) {
      for (const net of netInfo) {
        if (net.family === 'IPv4' && !net.internal) {
          return net.address.toString();
        }
      }
    }
  }
  return fallbackIP;
}

/**
 * Turn application tree structure into a string representation.
 * @param app Application structure to stringify
 * @example
 *     // Output example
 *     org
 *     └─tracegenerator
 *       └─randomapp
 *         ├─monitor
 *         | ├─feed
 *         | | ├─port
 *         | | └─panel
 *         | ├─card
 *         | └─matrix
 *         ├─transmitter
 *         | └─array
 *         ├─protocol
 *         └─driver
 */
export function appTreeToString(app: FakeApp): string {
  function packageTreeToString(pkg: FakePackage): string {
    let result: string = pkg.name + '\n';

    // Recursively turn subpackages to string

    let subpackageStrs: Array<string> = pkg.subpackages.map(packageTreeToString);
    subpackageStrs = subpackageStrs.map((str, idx) => {
      // Include '|' if there are more subpackages to come after this one
      const strWithPipe = '├─' + str.replace(/\n/g, '\n| ');
      const strWithoutPipe = '├─' + str.replace(/\n/g, '\n  ');
      return idx !== subpackageStrs.length - 1 || pkg.classes.length > 0 ? strWithPipe : strWithoutPipe;
    });

    // Turn classes to string

    let classStrs: Array<string> = pkg.classes.map((clazz) => clazz.identifier);
    classStrs = classStrs.map((str) => '├─\x1b[33m' + str + '\x1b[0m');

    // Replace '├─' with '└─' for last package/class

    if (classStrs.length === 0) {
      if (subpackageStrs.length > 0) {
        const lastIdx = subpackageStrs.length - 1;
        const updatedSubpackageStr = subpackageStrs[lastIdx].replace(/├─/, '└─');
        subpackageStrs[lastIdx] = updatedSubpackageStr;
      }
    } else {
      classStrs[classStrs.length - 1] = classStrs[classStrs.length - 1].replace(/├─/g, '└─');
    }

    // Reduce to final string

    result += subpackageStrs.reduce((acc, str) => acc + str + '\n', '');
    result += classStrs.reduce((acc, str) => acc + str + '\n', '');
    return result.slice(0, -1); // Remove newline
  }

  return packageTreeToString(app.rootPackage);
}

/**
 * Turn trace tree structure into a string representation.
 * @param trace Trace structure to stringify
 * @example
 *     // Output example
 *     interface.inputCapacitor
 *     ├─matrix.hackCard
 *     | └─capacitor.bypassFeed
 *     |   ├─interface.indexFirewall
 *     |   | └─feed.bypassCircuit
 *     |   |   └─firewall.parseFeed
 *     |   ├─card.hackProtocol
 *     |   ├─pixel.copySensor
 *     |   └─circuit.connectPanel
 *     └─feed.navigateArray
 */
export function traceToString(trace: FakeTrace): string {
  function spanToString(span: FakeSpan): string {
    let result: string =
      span.name
        .split('.')
        .slice(-2)
        .reduce((acc, str) => acc + str + '.', '')
        .slice(0, -1) + '\n';

    // Recursively turn child spans to string

    let childStrs: Array<string> = span.children.map(spanToString);
    childStrs = childStrs.map((str, idx) => {
      // Include '|' if there are more child spans to come after this one
      const strWithPipe = '├─' + str.replace(/\n/g, '\n| ');
      const strWithoutPipe = '├─' + str.replace(/\n/g, '\n  ');
      return idx !== childStrs.length - 1 ? strWithPipe : strWithoutPipe;
    });

    // Replace '├─' with '└─' for last child span

    if (childStrs.length > 0) {
      const lastIdx = childStrs.length - 1;
      const updatedSubpackageStr = childStrs[lastIdx].replace(/├─/, '└─');
      childStrs[lastIdx] = updatedSubpackageStr;
    }

    // Reduce to final string

    result += childStrs.reduce((acc, str) => acc + str + '\n', '');
    return result.slice(0, -1); // Remove newline
  }

  const result: string = trace.map(spanToString).reduce((acc, str) => acc + str + '\n', '');

  return result;
}
