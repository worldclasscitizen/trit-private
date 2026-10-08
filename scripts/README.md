# TRIT 벤치마크 데이터 생성 가이드

## 개요
피드 조회 벤치마크(DB Pull vs Redis Push)를 실제 대규모 SNS 트래픽 상황과 유사하게 재현하기 위해 대량의 더미 데이터셋을 생성하는 Node.js 스크립트입니다. 별도의 외부 패키지 설치 없이 Node.js 런타임만으로 즉시 구동됩니다.

## 데이터 특성
- 파레토 법칙(80:20) 적용: 상위 2% 인플루언서 사용자는 500명 이상의 친구를 보유하며, 일반 사용자는 10~30명의 친구 관계를 형성합니다.
- `friendship` 테이블의 `user_id_a < user_id_b` 무결성 제약조건을 엄격히 준수하여 생성됩니다.
- 각 게시물은 최근 14일 이내의 분산된 타임스탬프를 가집니다.

## 사용법

### 1. SQL 파일 생성 (기본: 사용자 5,000명, 게시물 50,000건)
```bash
node scripts/generate_benchmark_data.js 5000 50000 scripts/benchmark_data.sql
```

### 2. MySQL 데이터베이스에 적재
```bash
mysql -u root -p trit_dev < scripts/benchmark_data.sql
```
또는 Docker 컨테이너 내부로 적재:
```bash
docker exec -i trit-mysql mysql -u trit -p trit_dev < scripts/benchmark_data.sql
```
