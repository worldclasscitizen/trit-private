export const initialDiaries = [
  {
    id: 1,
    author: '김민준',
    authorAvatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    location: '서울시 성동구 성수동',
    date: '2024.11.20',
    title: '성수동 카페 투어 일기 ☕️',
    content:
      '오늘은 성수동에서 카페 투어를 했어요!\n\n대림창고에서 시작해서 그리노 성수, 어반비즈서울까지 돌아봤는데 각자의 개성이 뚜렷해서 너무 좋았습니다. 대림창고는 정말 넓고 천장이 높아서 시원한 느낌이 들었고, 그리노 성수는 초록 식물이 가득해서 힐링되는 분위기였어요.\n\n커피 한 잔 마시면서 책 읽기 딱 좋더라고요. 어반비즈서울은 루프탑이 있어서 성수동 전경을 한눈에 볼 수 있었습니다.\n\n날씨가 좋아서 사진도 예쁘게 나왔어요! 다음엔 성수동 베이커리 투어도 해보고 싶네요. 추천할 만한 곳 있으면 알려주세요~',
    images: [
      'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80',
      'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
    ],
    likes: 234,
    comments: 45,
    course: [
      { number: 1, name: '대림창고' },
      { number: 2, name: '그리노 성수' },
      { number: 3, name: '어반비즈서울' },
    ],
  },
  {
    id: 2,
    author: '이서연',
    authorAvatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    location: '부산 해운대구',
    date: '2024.11.18',
    title: '부산 바다 보며 힐링 여행 🌊',
    content:
      '갑자기 바다가 보고 싶어서 떠난 부산 여행.\n해운대 블루라인파크 열차를 타고 바다를 보니 가슴이 뻥 뚫리는 기분이었어요. \n\n저녁에는 더베이101에서 야경을 보며 맥주 한 잔 했는데, 분위기가 정말 깡패더라고요. 부산은 언제 와도 좋은 것 같아요. 맛있는 돼지국밥도 먹고 씨앗호떡도 먹고 완벽한 식도락 여행이었습니다.',
    images: [
      'https://images.unsplash.com/photo-1569926673473-b3eb27770146?w=800&q=80',
      'https://images.unsplash.com/photo-1548115184-bc6544d06a58?w=800&q=80',
    ],
    likes: 512,
    comments: 89,
    course: [
      { number: 1, name: '해운대' },
      { number: 2, name: '블루라인파크' },
      { number: 3, name: '더베이101' },
    ],
  },
  {
    id: 3,
    author: '박지훈',
    authorAvatar:
      'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop',
    location: '제주도 서귀포시',
    date: '2024.11.15',
    title: '제주도 숨은 명소 찾기 🍊',
    content:
      '이번 제주 여행은 관광지보다는 조용한 곳 위주로 다녀왔습니다. \n특히 사려니숲길은 아침 일찍 가니 안개가 살짝 껴서 신비로운 분위기였어요.\n\n근처 작은 카페에서 귤차 한 잔 마시는데 이게 행복이구나 싶더라고요. 저녁에는 올레시장에서 회 포장해서 숙소에서 먹었습니다. 다음에는 한라산 등반에도 도전해보고 싶네요!',
    images: ['https://images.unsplash.com/photo-1542662565-7792455873ac?w=800&q=80'],
    likes: 120,
    comments: 12,
    course: [
      { number: 1, name: '사려니숲길' },
      { number: 2, name: '서귀포 올레시장' },
    ],
  },
  {
    id: 4,
    author: '최유진',
    authorAvatar:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    location: '강원도 강릉시',
    date: '2024.11.10',
    title: '강릉 커피거리와 캠핑 ⛺️',
    content:
      '주말을 맞아 친구들과 강릉으로 캠핑을 다녀왔습니다.\n안목해변 커피거리에서 바다를 보며 커피 한 잔 하고, 솔밭 캠핑장에 텐트를 쳤어요.\n\n밤에는 불멍 하면서 마시멜로도 구워 먹고 별도 보고... 도심을 떠나 자연 속에 있으니 스트레스가 다 날아가는 것 같았어요. 캠핑 장비가 없어서 글램핑으로 갔는데 시설도 깨끗하고 좋았습니다. 강릉 가시는 분들 솔밭 캠핑장 강추해요!',
    images: [
      'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=800&q=80',
      'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=800&q=80',
      'https://images.unsplash.com/photo-1496080174650-637e3f22fa03?w=800&q=80',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
    ],
    likes: 345,
    comments: 56,
    course: [
      { number: 1, name: '안목해변' },
      { number: 2, name: '강릉 솔밭캠핑장' },
      { number: 3, name: '초당순두부마을' },
    ],
  },
  {
    id: 5,
    author: '정우성',
    authorAvatar:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    location: '서울시 종로구',
    date: '2024.11.05',
    title: '가을의 고궁 산책 🍂',
    content:
      '단풍이 절정이라 경복궁과 창덕궁을 다녀왔습니다. 한복 입고 가면 무료 입장이라 오랜만에 한복도 대여해서 입어봤어요.\n\n은행나무 아래서 사진 찍으니 인생샷이 절로 나오더라고요. 고즈넉한 분위기 속에서 산책하니 마음이 차분해지는 느낌이었습니다. 외국인 관광객들도 많아서 활기찬 분위기였어요.',
    images: [
      'https://images.unsplash.com/photo-1548115184-bc6544d06a58?w=800&q=80',
      'https://images.unsplash.com/photo-1695642738734-72922bdc6c74?w=800&q=80',
    ],
    likes: 89,
    comments: 8,
    course: [],
  },
]

export const initialFollowers = [
  {
    id: 1,
    name: '김서준',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop',
    isFollowing: true,
  },
  {
    id: 2,
    name: '이하은',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop',
    isFollowing: false,
  },
  {
    id: 3,
    name: 'Park_SJ',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
    isFollowing: true,
  },
  {
    id: 4,
    name: 'Traveler_Kim',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop',
    isFollowing: false,
  },
  {
    id: 5,
    name: 'HappyCamper',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop',
    isFollowing: false,
  },
  {
    id: 6,
    name: 'Photo_Lee',
    avatar: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=100&h=100&fit=crop',
    isFollowing: true,
  },
]
