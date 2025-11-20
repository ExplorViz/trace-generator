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
pnpm install
```

## Configuration

Ports for the frontend and backend can be configured via environment variables in the `.env` file.

The `.env` file supports the following variables:

- `BACKEND_PORT` - Port for the backend server (default: 8079)
- `VITE_FRONTEND_PORT` - Port for the frontend development server (default: 3000)
- `VITE_BACKEND_URL` - Backend URL for the frontend proxy (default: http://localhost:8079)

## Usage

### Using the frontend

Start both frontend and backend:

```
pnpm run dev
```

Or start them separately:

```bash
# Backend only
pnpm run dev:backend

# Frontend only
pnpm run dev:frontend
```

Open URL in browser. By default, the frontend runs on `http://localhost:3000` and the backend on `http://localhost:8079` (configurable via `.env`). Modify parameters as desired, then click `Send Trace`.
