import { FakeApp, FakePackage } from "./structure";

/**
 * Takes any string and converts the first character to uppercase
 * @param text Any string of which the first character should be capitalized
 * @returns The input string, but the first character is capitalized (if applicable)
 */
export function capitalizeString(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
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
    "abstract", "continue", "for",        "new",       "switch",
    "assert",   "default",  "if",         "package",   "synchronized",
    "boolean",  "do",       "goto",       "private",   "this",
    "break",    "double",   "implements", "protected", "throw",
    "byte",     "else",     "import",     "public",    "throws",
    "case",     "enum",     "instanceof", "return",    "transient",
    "catch",    "extends",  "int",        "short",     "try",
    "char",     "final",    "interface",  "static",    "void",
    "class",    "finally",  "long",       "strictfp",  "volatile",
    "const",    "float",    "native",     "super",     "while",
    "true",     "false",    "null", 
  ];
  const IDENTIFIER_FALLBACK = "fallbackIdentifier";
  identifier = identifier.replace(/[^0-9a-z_$]/gi, ''); // Remove non-alphanumeric characters 
  identifier = identifier.replace(/^[0-9]+/, ''); // Trim any numbers at beginning of identifier
  const isValidIdentifier: boolean = !JAVA_RESERVED_TOKENS.includes(identifier) && identifier != '';
  return isValidIdentifier ? identifier : IDENTIFIER_FALLBACK;
}

/**
 * Turn application tree structure into a string representation.
 * @param app Application structure to stringify
 * @example
 *     // Output example
 *     org
 *     └─tracegen
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
      return (idx !== subpackageStrs.length - 1 || pkg.classes.length > 0) ? strWithPipe : strWithoutPipe;
    });

    // Turn classes to string

    let classStrs: Array<string> = pkg.classes.map(clazz => clazz.identifier);
    classStrs = classStrs.map(str => '├─\x1b[33m' + str + '\x1b[0m');

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

    result += subpackageStrs.reduce((acc, str) => acc += str + '\n', '');
    result += classStrs.reduce((acc, str) => acc += str + '\n', '');
    return result.slice(0, -1); // Remove newline
  }

  return packageTreeToString(app.rootPackage);
}