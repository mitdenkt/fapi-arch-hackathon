# FAPI Architecture Hackathon

Welcome to the FAPI Architecture Hackathon! This repository contains everything you need to understand, analyze, and redesign the architecture of our fast API system for hair salon management.

## 🎯 What is FAPI?

FAPI (fast + api) is a backend system that powers hair salon management for #mitdenkt customers. Each salon gets its own FAPI instance that handles:

- Employee shift scheduling
- Available appointment calculations
- Appointment display and management
- ...and a lot more

## 🏗️ Current Architecture Overview

### The Challenge

FAPI is replacing the legacy "Seres" system (.NET) but faces several performance and architectural issues:

- **Response Time Goal**: < 10ms (currently not consistently achieved)
- **Memory Usage**: Several GB per instance held permanently in RAM with poor persistence
- **Data Sync Delays**: 10+ seconds for changes to propagate
- **High Complexity**: Data redundancy (in seres and fapi) needs great effort to achieve consitency
- **JS-Single-Threading**: Requests with intensive calculations cause high latency for other requests due to blocked threads

### Current Tech Stack

- **Runtime**: JavaScript (not TypeScript) with Fastify framework
- **Data Storage**: Microsoft Table Storage (single source of truth)
- **Caching**: In-memory HashMaps with Avro file persistence
- **Messaging**: RabbitMQ for data change notification
- **Initialization**: ~1 minute startup time per instance

### Data Flow

1. **Seres** (legacy system) writes to Table Storage
2. Seres publishes changes to **RabbitMQ**
3. **Avro files** persist cache snapshots every 5 minutes

## 📁 Repository Structure

```
├── apps/
│   ├── prototype/         # Architecture prototype implementation
│   ├── data/              # Test data generation tools
│   └── load-test/         # Performance testing tools
└── documentation/         # Detailed specs and context

```

## 🚀 Quick Start

### Prerequisites

- Bun runtime. [Installieren](https://bun.com/docs/installation)

### Generating Test Data

At least generate json to make sure the prototype works.

```bash
bun install --cwd apps/data
bun run --cwd apps/data generate [csv|json|sql...]
```

### Running the Prototype

```bash
bun install --cwd apps/prototype
bun run --cwd apps/prototype dev
```

### Load Testing

```bash
bun install --cwd apps/load-test
bun run --cwd apps/load-test test
```

## 🎯 Hackathon Tasks

Your mission is to solve FAPI's architectural challenges:

### 1. Design New Architecture

Create an architecture that meets performance requirements:

- Sub-10ms response times (server-side)
- Less complex architecture for better developer experience
- Prevent long-running computations from blocking other requests

### 2. Document Key Decisions

Explain your architectural choices:

- Why did you choose specific technologies?
- How does your design solve current problems?
- What trade-offs did you make?

### 3. Build a Prototype

Implement a working proof-of-concept that demonstrates:

- Core API functionality (load bookings that match a specific period)
- Improved performance characteristics
- Better data handling

### 4. Migration Strategy

Plan how to transition from the legacy system:

- Minimize data synchronization complexity
- Handle multi-tenant deployment challenges

## 📊 Test Data

The repository includes realistic test data for three salon applications in the directory `/apps/data/output`:

- `APPA` - Small salon data
- `APPB` - Medium salon data
- `ABBC` - Large salon data

Each includes customer and booking datasets in multiple formats (CSV, JSON, SQL).

## 🛠️ Available Tools

- **Load Tester**: Measures API performance under load
- **Prototype Framework**: Fastify-based starting point. Just update the implementation of `BookingHandler.ts`

## 📚 Documentation Deep Dive

For detailed context, check the `documentation/` folder:

- `context.md` - System overview and current architecture
- `problems.md` - Detailed problem analysis
- `requirements.md` - Performance and functional requirements
- `tasks.md` - Specific hackathon objectives

## 🏆 Success Criteria

Your solution should demonstrate:

- **Performance**: Consistent sub-10ms response times
- **Scalability**: Efficient resource usage across multiple tenants
- **Reliability**: Robust data synchronization
- **Maintainability**: Clean, documented architecture
- **Migration Path**: Realistic transition strategy

## 🤝 Getting Help

- Review the documentation folder for detailed context
- Examine the current prototype implementation
- Use the load testing tools to validate performance
- Generate test data to simulate realistic workloads

Good luck, and happy hacking! 🚀

---

_This hackathon challenges you to rethink how we build fast, scalable APIs for multi-tenant SaaS applications. Your innovations could directly impact real hair salons and their customers._
