# TRIT - Travel SNS Performance & Scalability Lab (trit-private)

이 레포지토리는 TRIT 프로젝트의 백엔드와 프론트엔드를 통합하고,
성능 병목 지점 개선, 4대 피드 아키텍처 비교 실험(단방향 DB Pull vs 양방향 DB Pull vs 순수 Redis Push vs 인플루언서 하이브리드), 부하 테스트, 관측성(Prometheus, Grafana, Sentry, k8s) 구축을 위한 연구용 저장소입니다.

## Structure
- /backend: Spring Boot 기반 API 서버 (MySQL, Redis, Elasticsearch)
- /frontend: Vue 3 + TypeScript + Vite SPA
