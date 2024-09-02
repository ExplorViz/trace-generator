# TraceGen

TraceGen is a development utility for testing and debugging OpenTelemetry-based applications. It was developed to be used with the [ExplorViz](https://explorviz.dev/) software visualization tool.

The goal is to easily create telemetry data for applications of various sizes and shapes. This is achieved by first generating fake class-based application structures and then generating traces upon those structures in a randomized manner.

## Installation

Clone this repository:

```
git clone gitlab@git.se.informatik.uni-kiel.de:ExplorViz/code/trace-gen.git
```

Navigate into the repository folder:

```
cd trace-gen
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

Open URL in browser, by default [http://localhost:8079](http://localhost:8079). To send your trace, simply click `Send Trace` at the bottom of the page.
