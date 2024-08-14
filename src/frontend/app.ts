import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import { validationResult } from "express-validator";
import { TraceGenerator, FakeTrace } from "../tracing";
import {
  generateFakeApps,
  generateFakeTrace,
  FakeApp,
  AppGenerationParameters,
  TraceGenerationParameters,
  InternalCommunicationStyle,
} from "../generation";
import { appTreeToString, isValidInteger } from "../utils";
import { getValidationChains } from "./form-validation";

console.log(String.raw`\n
 _______                  _____
|__   __|                / ____|
   | |_ __ __ _  ___ ___| |  __  ___ _ __
   | |  __/ _  |/ __/ _ \ | |_ |/ _ \  _ \
   | | | | (_| | (_|  __/ |__| |  __/ | | |
   |_|_|  \__,_|\___\___|\_____|\___|_| |_|
`);

const DEFAULT_TARGET_HOSTNAME = "localhost";
const DEFAULT_TARGET_PORT = 55678;
const FRONTEND_PORT = 8079;

const traceGenerator: TraceGenerator = new TraceGenerator(
  DEFAULT_TARGET_HOSTNAME,
  DEFAULT_TARGET_PORT,
);

interface OtelCollectorConfig {
  targetHostname: string;
  targetPort: number;
}

const app = express();
app.use(express.static("src/frontend/res", { index: "index.html" }));
app.use(bodyParser.urlencoded({ extended: true }));

function parseRequestBody(
  reqBody: any,
): [OtelCollectorConfig, AppGenerationParameters, TraceGenerationParameters] {
  const commStyleLookup = new Map();
  commStyleLookup.set("true_random", InternalCommunicationStyle.TRUE_RANDOM);
  commStyleLookup.set("cohesive", InternalCommunicationStyle.COHESIVE);
  commStyleLookup.set("random_exit", InternalCommunicationStyle.RANDOM_EXIT);

  return [
    {
      targetHostname: reqBody.targetHostname,
      targetPort: reqBody.targetPort,
    },

    {
      appCount: parseInt(reqBody.appCount),
      packageDepth: parseInt(reqBody.packageDepth),
      minClassCount: parseInt(reqBody.minClassCount),
      maxClassCount: parseInt(reqBody.maxClassCount),
      minMethodCount: parseInt(reqBody.minMethodCount),
      maxMethodCount: parseInt(reqBody.maxMethodCount),
      balance: parseFloat(reqBody.balance),
      seed:
        "appSeed" in reqBody && isValidInteger(reqBody.appSeed)
          ? parseInt(reqBody.appSeed)
          : undefined,
    },

    {
      duration: parseInt(reqBody.duration),
      callCount: parseInt(reqBody.callCount),
      maxConnectionDepth: parseInt(reqBody.maxCallDepth),
      internalCommunicationStyle: commStyleLookup.get(
        reqBody.internalCommunicationStyle,
      ),
      allowCyclicCalls: "allowCyclicCalls" in reqBody,
      seed:
        "traceSeed" in reqBody && isValidInteger(reqBody.traceSeed)
          ? parseInt(reqBody.traceSeed)
          : undefined,
    },
  ];
}

app.post("/", getValidationChains(), (req: Request, res: Response) => {
  console.log(req.body);
  const result = validationResult(req);
  if (!result.isEmpty()) {
    console.log(result.array());
    return res.status(400).json(result.array()); // "Bad Request" response
  }

  const [otelParams, appParams, traceParams] = parseRequestBody(req.body);
  console.log(appParams);
  console.log(traceParams);
  traceGenerator.setUrl(otelParams.targetHostname, otelParams.targetPort);
  const apps: Array<FakeApp> = generateFakeApps(appParams);
  const trace: FakeTrace = generateFakeTrace(apps, traceParams);

  console.log("Trace generated successfully");
  console.log("Generated apps:");
  apps.forEach((app, idx) => {
    console.log(`App #${idx + 1}:`);
    console.log(`${appTreeToString(app)}\n`);
  });

  traceGenerator.writeTrace(trace);

  return res.status(204).send(); // "No Content" response
});

app.listen(FRONTEND_PORT, () => {
  console.log(`Serving webpage on port ${FRONTEND_PORT}`);
});

// Allow exiting via Ctrl+C
["SIGINT", "SIGTERM", "SIGQUIT"].forEach((signal) =>
  process.on(signal, () => {
    console.log("Shutting down...");
    Promise.all(traceGenerator.shutdown()).finally(() => {
      process.exit();
    });
  }),
);
