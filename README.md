# FAPI Architecture Hackathon

Welcome to the FAPI Architecture Hackathon! This repository contains everything you need to understand, analyze, and redesign the architecture of our fast API system for hair salon management.

## 🎯 What is FAPI?

FAPI (fast + api) is a backend system that powers hair salon management for #mitdenkt customers. Each salon gets its own FAPI instance that handles:

- Employee shift scheduling
- Available appointment calculations
- Appointment display and management

## 🏗️ Current Architecture Overview

### The Challenge

FAPI is replacing the legacy "Seres" system (.NET) but faces several performance and architectural issues:

- **Response Time Goal**: < 10ms (currently not consistently achieved)
- **Memory Usage**: Several GB per instance held permanently in RAM
- **Data Sync Delays**: 10+ seconds for changes to propagate
- **High Server Costs**: €1-2 per instance monthly due to constant caching

### Current Tech Stack

- **Runtime**: JavaScript (not TypeScript) with Fastify framework
- **Data Storage**: Microsoft Table Storage (single source of truth)
- **Caching**: In-memory HashMaps with Avro file persistence
- **Messaging**: RabbitMQ for change notifications
- **Initialization**: ~1 minute startup time per instance

### Data Flow

1. **Seres** (legacy system) writes to Table Storage
2. Changes published to **RabbitMQ**
3. **FAPI instances** sync via RabbitMQ messages
4. **Avro files** persist cache snapshots every 5 minutes

## 📁 Repository Structure

```
├── apps/
│   ├── prototype/          # Architecture prototype implementation
│   ├── data/              # Test data generation tools
│   └── load-test/         # Performance testing tools
└── documentation/         # Detailed specs and context

```

## 🚀 Quick Start

### Prerequisites

- Bun runtime. [Installieren](https://bun.com/docs/installation)
- TypeScript

### Generating Test Data

```bash
cd apps/data
bun install
bun run all  # Generates JSON, SQL, and CSV test data
```

### Running the Prototype

```bash
cd apps/prototype
bun install
bun run dev
```

### Load Testing

```bash
cd apps/load-test
bun install
bun run test
```

## 🎯 Hackathon Tasks

Your mission is to solve FAPI's architectural challenges:

### 1. Design New Architecture

Create an architecture that meets performance requirements:

- Sub-10ms response times (server-side)
- Efficient memory usage
- Fast data synchronization
- Cost-effective scaling

### 2. Document Key Decisions

Explain your architectural choices:

- Why did you choose specific technologies?
- How does your design solve current problems?
- What trade-offs did you make?

### 3. Build a Prototype

Implement a working proof-of-concept that demonstrates:

- Core API functionality (load bookings)
- Improved performance characteristics
- Better data handling

### 4. Migration Strategy

Plan how to transition from the legacy system:

- Minimize data synchronization complexity
- Reduce downtime during migration
- Handle multi-tenant deployment challenges

## 🔍 Current Problems to Solve

### Performance Issues

- **Slow writes**: 10+ second delay for changes to appear
- **Memory bloat**: GB of data cached per instance
- **Blocking operations**: Concurrent API calls may block each other

### Data Consistency

- **Schema mismatches**: Different data sources use different schemas
- **Sync complexity**: Multiple data sources (Avro, RabbitMQ, Table Storage)
- **Stale data**: Long propagation delays

### Operational Costs

- **High memory usage**: Expensive server instances required
- **Inefficient caching**: Full dataset cached for small queries
- **Scaling challenges**: Per-tenant instances are costly

## 📊 Test Data

The repository includes realistic test data for three salon applications:

- `appa_*` - Small salon data
- `appb_*` - Medium salon data
- `appc_*` - Large salon data

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
