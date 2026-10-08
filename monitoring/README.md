# TRIT 성능 측정 및 모니터링 가이드

## 실행 방법

```bash
docker compose -f monitoring/docker-compose.monitoring.yml up -d
```

## 서비스 접속 주소
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000 (ID: admin / PW: admin)

## Grafana 추천 공식 대시보드
Grafana 접속 후 `Dashboards` -> `New` -> `Import` 메뉴에서 아래 ID를 입력하여 가져옵니다:
- JVM 및 Spring Boot 모니터링: `4701` (JVM (Micrometer))
- HikariCP 커넥션 풀 모니터링: `6083` (HikariCP)
