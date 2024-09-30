# trace-generator

`trace-generator` is a development utility for testing and debugging OpenTelemetry-based applications. It was developed to be used with the [ExplorViz](https://explorviz.dev/) software visualization tool.

The goal is to easily create telemetry data for applications of various sizes and shapes. This is achieved by first generating fake class-based application structures and then generating traces upon those structures in a randomized manner.

## Installation

Clone this repository:

```
git clone [REPOSITORY_URL]
```

Navigate into the repository folder:

```
cd trace-generator
```

Install npm packages:

```
npm install
```

## Usage

### Using the frontend

Start the frontend:

```
npm start
```

Open URL in browser, by default `http://localhost:8079`. Modify parameters as desired, then click `Send Trace`.

### Using the library

Usage example (with sensible parameters):

```typescript
const traceExporter: FakeTraceExporter = new FakeTraceExporter(
  TARGET_HOSTNAME,
  TARGET_PORT,
);

appParams: AppGenerationParameters = {
  appCount: 1,
  packageDepth: 4,
  minClassCount: 5,
  maxClassCount: 20,
  minMethodCount: 1,
  maxMethodCount: 5,
  balance: 1,
};

traceParams: TraceGenerationParameters = {
  duration: 1000,
  callCount: 100,
  maxConnectionDepth: 10,
  communicationStyle: CommunicationStyle.COHESIVE,
  allowCyclicCalls: false,
};

const apps: Array<FakeApp> = generateFakeApps(appParams);
const trace: FakeTrace = generateFakeTrace(apps, traceParams);

traceGenerator.writeTrace(trace);
```
