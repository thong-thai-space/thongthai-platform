# Monitoring Stack

This folder provides a production-ready baseline:

- Prometheus: metrics collection
- Alertmanager: alert routing
- Grafana: dashboards
- Node Exporter + cAdvisor: host/container metrics
- Uptime Kuma: uptime checks and fast notification setup

## 1. Prepare env

```bash
cp deploy/monitoring/.env.monitoring.example deploy/monitoring/.env.monitoring
```

## 2. Start monitoring with production stack

Run with both compose files so monitoring shares the same network and can scrape backend/frontend services:

```bash
docker compose \
  -f docker-compose.prod.yml \
  -f deploy/monitoring/docker-compose.monitoring.yml \
  --env-file backend/.env.production \
  --env-file deploy/monitoring/.env.monitoring \
  up -d
```

## 3. Access services

- Prometheus: http://SERVER_IP:9090
- Alertmanager: http://SERVER_IP:9093
- Grafana: http://SERVER_IP:3001
- Uptime Kuma: http://SERVER_IP:3002

## 4. Uptime Kuma checks to add

Create HTTP checks for:

- https://YOUR_DOMAIN/
- https://YOUR_DOMAIN/api/health/live
- https://YOUR_DOMAIN/api/health/ready

Set notification channel (Telegram, Slack, email) and assign to all checks.

## 5. Suggested dashboards in Grafana

Import from Grafana Labs:

- Node Exporter Full (host metrics)
- cAdvisor / Docker Monitoring
- Prometheus 2.0 Stats
