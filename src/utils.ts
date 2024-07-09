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