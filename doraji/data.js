// 도라지 리스트
// <id> common = 1~ / epic = 100~ / rare = 200~ / superRare = 300
export const dorajiList = [
    { id: 1, name: "검사 도라지", img: "img/common/검사도라지.png", grade: "common" },
    { id: 2, name: "검은 도라지", img: "img/common/검은 도라지.png", grade: "common" },
    { id: 3, name: "날라차기 도라지", img: "img/common/날라차기도라지.png", grade: "common" },
    { id: 4, name: "담금주", img: "img/common/담금주.png", grade: "common" },
    { id: 5, name: "도라지검", img: "img/common/도라지검.png", grade: "common" },
    { id: 6, name: "딸피 도라지", img: "img/common/딸피도라지.png", grade: "common" },
    { id: 7, name: "뚱뚱 도라지", img: "img/common/뚱뚱도라지.png", grade: "common" },
    { id: 8, name: "랜덤박스 도라지", img: "img/common/랜덤박스도라지.png", grade: "common" },
    { id: 9, name: "하얀 도라지", img: "img/common/하얀 도라지.png", grade: "common" },
    { id: 10, name: "형광 도라지", img: "img/common/형광도라지.png", grade: "common" },

    { id: 101, name: "레인보우 도라지", img: "img/epic/레인보우도라지.png", grade: "epic" },
    { id: 102, name: "쌍권총 도라지", img: "img/epic/쌍권총도라지.png", grade: "epic" },
    { id: 103, name: "썬글라스 도라지", img: "img/epic/썬글라스도라지.png", grade: "epic" },
    { id: 104, name: "아기 도라지", img: "img/epic/아기도라지.png", grade: "epic" },
    { id: 105, name: "천사 도라지", img: "img/epic/천사도라지.png", grade: "epic" },
    { id: 106, name: "해적 도라지", img: "img/epic/해적도라지.png", grade: "epic" },
    { id: 107, name: "헬창 도라지", img: "img/epic/헬창도라지.png", grade: "epic" },

    { id: 201, name: "로보트 도라지", img: "img/rare/로보트도라지.png", grade: "rare" },
    { id: 202, name: "리본 도라지", img: "img/rare/리본도라지.png", grade: "rare" },
    { id: 203, name: "붉은 도라지", img: "img/rare/붉은 도라지.png", grade: "rare" },
    { id: 204, name: "서핑 도라지", img: "img/rare/서핑도라지.png", grade: "rare" },
    { id: 205, name: "선생님 도라지", img: "img/rare/선생님도라지.png", grade: "rare" },

    { id: 301, name: "양아치 도라지", img: "img/superRare/양아치도라지.png", grade: "superRare" },
    { id: 302, name: "요리사 도라지", img: "img/superRare/요리사도라지.png", grade: "superRare" },
    { id: 303, name: "위자드 도라지", img: "img/superRare/위자드도라지.png", grade: "superRare" },
];

// 도라지 등급
export const gradeRates = [
    { grade: "common", chance: 70 },
    { grade: "epic", chance: 24 },
    { grade: "rare", chance: 5 },
    { grade: "superRare", chance: 1 },
];