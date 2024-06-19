import {TraceGenerator, FakeSpan} from './tracing'
import {faker} from '@faker-js/faker'

// Allow exiting via Ctrl+C
['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach(signal => process.on(signal, () => {
  process.exit();
}));

const TARGET_HOSTNAME = "localhost";
const TARGET_PORT = 55678;

const traceGenerator: TraceGenerator = new TraceGenerator(TARGET_HOSTNAME, TARGET_PORT);

console.log("Initializing TraceGenerator");

/**
 * Turn any given string into a valid Java identifier.
 * Removes invalid characters and trims numbers from start of string.
 * Any allowed non-ASCII characters are not accounted for and get removed.
 * @param identifier String to turn into a valid identifier
 * @returns Sanitized input string if it is a valid identifier, otherwise a fallback string
 */
function sanitizeJavaIdentifier(identifier: string) {
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
 * Takes any string and converts the first character to uppercase
 * @param text Any string of which the first character should be capitalized
 * @returns The input string, but the first character is capitalized (if applicable)
 */
function capitalizeString(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function getRandomSpan(children: Array<FakeSpan> = []): FakeSpan {
  const randClassName = sanitizeJavaIdentifier(capitalizeString(faker.hacker.noun()))
  const randMethodName = sanitizeJavaIdentifier(faker.hacker.verb() + capitalizeString(faker.hacker.noun()));
  const randPackageName = faker.helpers.arrayElement(["package1", "package2", "package3", "package4"]);
  const span: FakeSpan = {
    children: children,
    params: {
      name: `${randClassName}.${randMethodName}`,
      startTime: performance.now(),
      endTime: performance.now(),
      attributes: {
        "landscape_token": "mytokenvalue",
        "token_secret": "mytokensecret",
        "application_name": "trace-gen",
        "application_instance_id": "0",
        "application_language": "java",
        "java.fqn": `org.tracegen.${randPackageName}.${randClassName}.${randMethodName}`
      }
    }
  };
  return span;
}

setInterval(() => {
  console.log("Sending span");
  const span: FakeSpan = getRandomSpan();
  traceGenerator.writeSpan(span);
}, 10000);