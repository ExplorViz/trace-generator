import {TraceGenerator, FakeSpan} from './tracing'
import {faker} from '@faker-js/faker'
import {capitalizeString, sanitizeJavaIdentifier} from './utils'
import {
  SEMATTRS_CODE_NAMESPACE,
  SEMATTRS_CODE_FUNCTION
} from '@opentelemetry/semantic-conventions'

// Allow exiting via Ctrl+C
['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach(signal => process.on(signal, () => {
  process.exit();
}));

const TARGET_HOSTNAME = "localhost";
const TARGET_PORT = 55678;

const traceGenerator: TraceGenerator = new TraceGenerator(TARGET_HOSTNAME, TARGET_PORT);

console.log("Initializing TraceGenerator");

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
        "java.fqn": `org.tracegen.${randPackageName}.${randClassName}.${randMethodName}`,
        SEMATTRS_CODE_NAMESPACE: `${randPackageName}.${randClassName}`,
        SEMATTRS_CODE_FUNCTION: `${randMethodName}`
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