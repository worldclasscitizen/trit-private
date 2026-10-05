export interface Place {
    id: number
    name: string
    location: string
    description: string
    rating: number
    tags: string[]
    views: number
    imageUrl: string
}

export const allPlaces: Place[] = [
    {
        id: 1,
        name: '포이렛(Pilet)',
        location: '서울 성동구',
        description: '대림창고부터 그리노 성수까지, 트렌디한 카페를 돌아보는 오후 산책',
        rating: 4.8,
        tags: ['카페', '사진', '성수동'],
        views: 45320,
        imageUrl:
            'https://images.unsplash.com/photo-1735491428084-853fb91c09e7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
    },
    {
        id: 2,
        name: '대림창고',
        location: '서울 성동구 성수동',
        description: '오래된 창고를 개조한 복합문화공간. 전시, 카페, 편집샵이 모여있는 핫플레이스',
        rating: 4.7,
        tags: ['카페', '전시', '성수동'],
        views: 32100,
        imageUrl:
            'https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
    },
    {
        id: 3,
        name: '연트럴파크',
        location: '서울 마포구',
        description: '히든트랙과 작은 갤러리를 구경하며 여유롭게 걷는 코스',
        rating: 4.9,
        tags: ['산책', '힐링', '연남동'],
        views: 38750,
        imageUrl:
            'https://images.unsplash.com/photo-1594020183965-09716116c5aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
    },
    {
        id: 4,
        name: '망원 한강공원',
        location: '서울 마포구 망원동',
        description: '자전거 라이딩과 피크닉을 즐기기 좋은 한강공원. 석양이 아름다운 곳',
        rating: 4.6,
        tags: ['한강', '자전거', '피크닉'],
        views: 52180,
        imageUrl:
            'https://images.unsplash.com/photo-1710634320271-69ca1beddd2f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
    },
    {
        id: 5,
        name: '익선동 한옥 카페',
        location: '서울 종로구',
        description: '좁은 골목 사이 숨은 한옥 카페에서 여유를 즐기는 시간',
        rating: 4.6,
        tags: ['카페', '전통', '익선동'],
        views: 29430,
        imageUrl:
            'https://images.unsplash.com/photo-1714947294881-0258899c5158?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
    },
    {
        id: 6,
        name: '만선호프',
        location: '서울 중구',
        description: '인쇄골목과 레스토랑 소공을 거쳐 옛 서울의 정취를 느끼는 코스',
        rating: 4.5,
        tags: ['레트로', '맛집', '을지로'],
        views: 41200,
        imageUrl:
            'https://images.unsplash.com/photo-1691071097372-133c238ac6aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
    },
    {
        id: 7,
        name: '북촌한옥마을',
        location: '서울 종로구',
        description: '한옥 골목길과 뷰 포인트를 천천히 걸으며 사진 찍기 좋은 코스',
        rating: 4.9,
        tags: ['산책', '사진', '북촌', '전통'],
        views: 33210,
        imageUrl:
            'https://images.unsplash.com/photo-1650476524542-c5cc53306700?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
    },
    {
        id: 8,
        name: '도산공원',
        location: '서울 강남구',
        description: '청담동 에르메스부터 압구정 감성 카페까지 럭셔리 거리 투어',
        rating: 4.8,
        tags: ['카페', '쇼핑', '강남'],
        views: 48670,
        imageUrl:
            'https://images.unsplash.com/photo-1726649819338-a3258bf46fe2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
    },
]

export const dailyMissions = [
    "동네의 새로운 카페 발견하기 ☕️",
    "퇴근길에 하늘 사진 찍기 📸",
    "안 가본 골목길로 산책하기 🚶",
    "주말 당일치기 여행 계획 짜기 🗺️",
    "편의점에서 이국적인 간식 사먹기 🍪",
    "버스 타고 창밖 풍경 멍하니 보기 🚌",
    "나만의 숨겨진 명소 찾기 🤫",
    "여행지에서 들을 플레이리스트 만들기 🎵",
]
