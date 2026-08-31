# Schedulane

Schedulane is a railway operations and maintenance intelligence platform designed to streamline train scheduling, staff coordination, QR-based access control, live operational monitoring, and data-driven maintenance planning for metro systems.

## Overview

This project combines:
- a React-based operations dashboard
- QR code generation and validation flows
- live train operational analytics
- AI-assisted monitoring and automation features
- backend services for scheduling, maintenance, and decision support
- Python-based ML and data processing modules

It is built to support operational teams such as:
- administrators
- technical staff
- yard operations
- branding officers
- cleaning crews
- station operations staff

## Tech Stack

- Frontend: React + Vite + Tailwind CSS
- Backend services: Node.js / Netlify Functions
- Python processing: ML, data pipelines, and automation scripts
- Data handling: CSV, JSON, and model-based analytics
- QR access workflows: generated credentials and operator authentication

## Project Structure

- `src/` — frontend application
- `netlify/functions/` — serverless API functions
- `whatsapp/` — messaging and workflow bridge services
- `cert_rag/` — certification/document retrieval automation
- `depot/` — depot operations and event tracking
- `ml/` — machine learning, optimization, and analytics models
- `docs/` — product and operational planning docs

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Python 3.10+

### Install frontend dependencies

```bash
npm install
```

### Run the app locally

```bash
npm run dev
```

### Build for production

```bash
npm run build
```

### Run Netlify functions locally

```bash
npm run netlify:dev
```

## Environment Notes

Some modules may depend on local environment variables, generated data files, or service-specific configuration. Review the project files in `netlify/`, `whatsapp/`, and `ml/` before running every backend or AI feature.

## Features

- operational dashboards and analytics
- train and staff status monitoring
- QR code workflows for access and credentialing
- maintenance planning and trigger detection
- AI-enabled recommendations and decision support
- data ingestion and operational reporting

## License

This project is currently intended for internal operational use and is not yet published under an explicit public license.

