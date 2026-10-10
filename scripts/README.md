# TRIT 벤치마크 데이터 생성 가이드

## 개요
피드 조회 벤치마크(DB Pull vs Redis Push)를 실제 대규모 SNS 트래픽 상황과 유사하게 재현하기 위해 대량의 더미 데이터셋을 생성하는 Node.js 스크립트입니다. 별도의 외부 패키지 설치 없이 Node.js 런타임만으로 즉시 구동됩니다.

## 데이터 특성
- 현실적 SNS 소셜 토폴로지: 메가 인플루언서(100만 명), 매크로 인플루언서(10만~30만 명), 마이크로 인플루언서(5,000~30,000명), 일반 사용자(0~2,000명, 평균 250~750명) 계층 구조를 반영합니다.
- 친구 관계는 양방향 레코드(A->B, B->A)로 저장되어 양방향 무결성을 보장합니다.
- 실제 존재하는 사용자 간 상호작용: 알고리즘 기반 바이럴 게시물 및 일반 게시물에 대한 실존 유저의 좋아요/댓글이 생성됩니다.
- 각 게시물은 최근 14일 이내의 분산된 타임스탬프를 가집니다.

## 사용법

### 1. SQL 파일 생성 (기본: 사용자 1,500,000명)
```bash
node scripts/generate_benchmark_data.js 1500000 scripts/benchmark_data.sql
```

### 2. MySQL 데이터베이스에 적재
```bash
mysql -u root -p trit_dev < scripts/benchmark_data.sql
```
또는 Docker 컨테이너 내부로 적재:
```bash
docker exec -i trit-mysql mysql -u trit -p trit_dev < scripts/benchmark_data.sql
```
