import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import { validationResult } from "express-validator";
import { FakeTraceExporter, FakeTrace } from "../tracing";
import {
  generateFakeApps,
  generateFakeTrace,
  FakeApp,
  AppGenerationParameters,
  TraceGenerationParameters,
  CommunicationStyle,
} from "../generation";
import {
  appTreeToString,
  getHostIP,
  getHostname,
  isValidInteger,
  traceToString,
} from "../utils";
import { getValidationChains } from "./form-validation";
import { constants } from "../constants";

console.log(String.raw`
  _                                                            _
 | |                                                          | |
 | |_ _ __ __ _  ___ ___ ______ __ _  ___ _ __   ___ _ __ __ _| |_ ___  _ __
 | __|  __/ _  |/ __/ _ \______/ _  |/ _ \  _ \ / _ \  __/ _  | __/ _ \|  __|
 | |_| | | (_| | (_|  __/     | (_| |  __/ | | |  __/ | | (_| | || (_) | |
  \__|_|  \__,_|\___\___|      \__, |\___|_| |_|\___|_|  \__,_|\__\___/|_|
                                __/ |
                               |___/
`);

const DEFAULT_TARGET_HOSTNAME = "localhost";
const DEFAULT_TARGET_PORT = 55678;
const FRONTEND_PORT = 8079;

const traceExporter: FakeTraceExporter = new FakeTraceExporter(
  DEFAULT_TARGET_HOSTNAME,
  DEFAULT_TARGET_PORT,
);

interface OtelCollectorParameters {
  targetHostname: string;
  targetPort: number;
}

const app = express();
app.use(express.static("src/frontend/public", { index: "index.html" }));
app.use(bodyParser.urlencoded({ extended: true }));

function parseRequestBody(
  reqBody: any,
): [
  OtelCollectorParameters,
  AppGenerationParameters,
  TraceGenerationParameters,
] {
  if (!(reqBody.communicationStyle in constants.COMMUNICATION_STYLE_NAMES)) {
    throw new Error(
      `Unknown communication style ${reqBody.communicationStyle}`,
    );
  }

  const commStyle =
    constants.COMMUNICATION_STYLE_NAMES[reqBody.communicationStyle];

  interface customAttributes {
    [key: string]: string;
  }

  let customAttrs: customAttributes = {};
  let customAttrCounter = 1;
  while (
    `key_customAttribute${customAttrCounter}` in reqBody &&
    `value_customAttribute${customAttrCounter}` in reqBody
  ) {
    let key = reqBody[`key_customAttribute${customAttrCounter}`];
    let val = reqBody[`value_customAttribute${customAttrCounter}`];
    if (typeof key !== "string" || typeof val !== "string") {
      console.error("Ignoring invalid custom attribute in request body");
      break;
    }
    customAttrs[key] = val;
    customAttrCounter++;
  }

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
      communicationStyle: commStyle,
      allowCyclicCalls: "allowCyclicCalls" in reqBody,
      fixedAttributes: {
        ...customAttrs,
        "telemetry.sdk.language": "java",
        "service.instance.id": "0",
        host: getHostname(),
        host_address: getHostIP(),
      },
      seed:
        "traceSeed" in reqBody && isValidInteger(reqBody.traceSeed)
          ? parseInt(reqBody.traceSeed)
          : undefined,
    },
  ];
}

app.post("/", getValidationChains(), (req: Request, res: Response) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    console.log(result.array());
    return res.status(400).json(result.array()); // "Bad Request" response
  }

  let otelParams: OtelCollectorParameters;
  let appParams: AppGenerationParameters;
  let traceParams: TraceGenerationParameters;

  try {
    [otelParams, appParams, traceParams] = parseRequestBody(req.body);
  } catch (err) {
    console.log(err);
    return res.status(400).json(result.array()); // "Bad Request" response
  }

  traceExporter.setUrl(otelParams.targetHostname, otelParams.targetPort);
  const apps: Array<FakeApp> = generateFakeApps(appParams);
  const trace: FakeTrace = generateFakeTrace(apps, traceParams);

  console.log("Trace generated successfully");
  console.log("Generated apps:");
  apps.forEach((app, idx) => {
    console.log(`App #${idx + 1}:`);
    console.log(`${appTreeToString(app)}\n`);
  });

  console.log("Generated Trace:");
  console.log(traceToString(trace));

  traceExporter.writeTrace(trace, false);

  return res.status(204).send(); // "No Content" response
});

const server = app.listen(FRONTEND_PORT, () => {
  console.log(`Serving webpage on port ${FRONTEND_PORT}`);
});

// Allow exiting via Ctrl+C
["SIGINT", "SIGTERM", "SIGQUIT"].forEach((signal) =>
  process.on(signal, () => {
    console.log("Shutting down...");
    traceExporter.shutdown().finally(() => {
      server.close(() => {
        process.exit();
      });
    });
  }),
);
