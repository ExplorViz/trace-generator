# trace-generator

`trace-generator` is a development utility for generating artificial
[OpenTelemetry traces](https://opentelemetry.io/docs/concepts/signals/traces/). It is designed to be
used with the [ExplorViz](https://explorviz.uni-kiel.de/) software visualization tool.

The goal is to easily generate synthetic telemetry data for software systems of various sizes. This
is achieved by first generating fake class-based application structures and then generating traces
upon those structures in a randomized manner.

For development instructions, continue reading below. If you just want to run the tool locally, we
recommend using the [pre-built Docker image](https://hub.docker.com/r/explorviz/trace-generator).

## Development Instructions

### Prerequisites

- [Node.js](https://nodejs.org/) (version ≥ 18)
- [pnpm](https://pnpm.io/) (version ≥ 9)

### Install packages

Before you can run the tool, make sure to install the required dependencies via `pnpm`:

```shell
pnpm install
```

### Configuration

Ports for the frontend and backend can be configured via environment variables in the `.env` file.

The `.env` file supports the following variables:

| Environment variable | Description                                                     | Default               |
| -------------------- | --------------------------------------------------------------- | --------------------- |
| `BACKEND_PORT`       | Port for the backend server that also serves the built frontend | 8079                  |
| `VITE_FRONTEND_PORT` | Port for the frontend development server                        | 3000                  |
| `VITE_BACKEND_URL`   | Backend URL for the frontend proxy                              | http://localhost:8079 |

### Running locally

Start both frontend and backend:

```shell
pnpm run dev
```

Or start them separately:

```shell
# Backend only
pnpm run dev:backend

# Frontend only
pnpm run dev:frontend
```

Open URL in browser. By default, the frontend runs on http://localhost:3000 and the backend on
http://localhost:8079 (configurable via `.env`). Modify parameters as desired, then click
`Send Trace`.

### Running in Docker

#### Build and run

```shell
# Build image
docker build -t trace-generator .

# Run container
docker run -p 8079:8079 trace-generator
```

#### Environment variables

The following environment variables can be configured when running the Docker container:

| Environment variable      | Description                      | Default        |
| ------------------------- | -------------------------------- | -------------- |
| `BACKEND_PORT`            | Port for the backend server      | 8079           |
| `OTEL_COLLECTOR_HOSTNAME` | OpenTelemetry Collector hostname | otel-collector |
| `OTEL_COLLECTOR_PORT`     | OpenTelemetry Collector port     | 55678          |

Example with custom configuration:

```shell
docker run -p 8079:8079 \
  -e BACKEND_PORT=8079 \
  -e OTEL_COLLECTOR_HOSTNAME=my-collector \
  -e OTEL_COLLECTOR_PORT=4317 \
  trace-generator
```

> [!note]
>
> The OpenTelemetry Collector URL can also be configured per-request via the frontend form, which
> will override the default environment variable values for that specific trace generation request.

### Testing

The backend includes unit tests using Vitest:

```shell
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with UI
pnpm test:ui

# Run tests with coverage
pnpm test:coverage
```

### Code style

For code formatting, we use [Prettier](). You can format your code as follows:

```shell
npx prettier . --write
```

If you use Visual Studio Code, we recommend installing the official
[Prettier extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) and
configuring it as your formatter.
