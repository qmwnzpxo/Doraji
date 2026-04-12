/* ========================= js
    1. 변수 선언
    js의 변수는 티입을 지정하지 않고 바로 대입. 동적 타입 언어.
    let , const
    let count = 0;         // 나중에 바꿀 수 있는 변수
    const MAX = 10;       // 절대 안 바뀌는 값

    let a = 10;     // number
    a = "hello";    // string으로 바뀜
    이런식으로 형변환도 가능.

    1-2. 변수에 담을 수 있는 값들
    let name = "도라지";         // 문자열 (String)
    let count = 10;             // 숫자 (Number)
    let isRolling = false;      // 참/거짓 (Boolean)
    let myCollection = [];      // 배열 (Array)
    let user = null;            // 아무것도 없음 (null)


    2. 객체 - 관련 정보로 묶기
    C#의 class와 유사. 
    C# struct는 call by value, class는 call by reference. js도 객체 참조 형식.
    C# class는 
    // 설계도 먼저 정의
    class User {
        public string uid;
        public string displayName;
    }
    // 그 다음 인스턴스 생성
    User a = new User();
    이런식으로 설계도를 먼저 정의해야 하지만 js는
    const a = { uid: "abc", displayName: "지우" };
    이런식으로 설계도 없이 즉석에서 생성 가능.

    중괄호 {}로 묶고, 키: 값 형태.
    const dorajiList = [
    { id: 1, name: "검사 도라지", grade: "common" },
    { id: 2, name: "검은 도라지", grade: "common" },
    // ...
    ];
    // 꺼내 쓰는 법
    console.log(doraji.name);   // "검사 도라지"
    console.log(doraji.grade);   // "common"


    3. 배열
    let fruits = ["사과", "바나나", "포도"];

    fruits[0]           // "사과" (0부터 시작)
    fruits.length       // 3 (개수)
    fruits.push("딸기") // 맨 뒤에 추가 → ["사과", "바나나", "포도", "딸기"]
    fruits.pop()        // 맨 뒤 제거

    
    4. 함수
    함수 선언
    function print(str){
        console.log(str + " 출력");
    }
    실행
    print("Hello World");   // "Hello World 출력" 출력.

    // 람다 표현식으로도 가능.
    const print = (str) => {
        console.log(str + "출력");
    }

    4-1. window 함수
    브라우저에서 JS가 실행될 때 window는 전역 객체. 브라우저 창 자체를 나타내고, 모든 전역 변수/함수의 집.
    window.alert("안녕");  // 우리가 그냥 쓰는 alert()
    window.console.log();  // 그냥 쓰는 console.log()

    내 코드에서 window.함수명()으로 만든 이유.
    내 main.js는 <script type="module">. 기능 별로 나눠서 모듈로 불러옴.
    type="module"을 쓰면 파일 안의 변수/함수가 그 파일 안에서만 유효하고 외부에서 접근이 안됨.
    그런데 내 스크립트에서는 <button onclick="ButtonClick()">물 주기</button> 처럼 html에서 이렇게 직접 함수를 호출하고 있음.
    onclick="ButtonClick()" 은 전역에서 ButtonClick을 찾고 있는데 module 안에 갇혀있으니까 못 찾아서 오류가 난다.
    그래서 window에 직접 달아줘서 전역으로 꺼냄.
    // 이렇게만 하면 module 안에 갇혀서 HTML에서 못 씀
    function ButtonClick() { ... }
    // window에 달면 전역으로 꺼내짐 → HTML onclick에서 찾을 수 있음
    window.ButtonClick = function() { ... }
    즉, HTML OnClick등 html에서 꺼내써야 하는 함수만 window. 으로 만들고 main.js 내부에서 쓸 함수들은 그냥 function()으로 선언.


    5. 조건문 - 다른 언어와동일
    if (count >= maxCount) {
        tryRoll();          // count가 다 찼을 때
    } else {
        count++;            // 아직 덜 찼을 때
    }
    
    1번에도 나와있듯이 js는 동적 타입 언어임.
    그래서 조건문을 비교할 때 == 보다는 ===을 사용함.
    ==는 값만 비교하고, ===는 값과 타입까지 비교.

    "" == 0        // true
    false == 0     // true
    null == undefined // true
    js에서 == 만 쓰면 이런 것도 가능하기 때문에 보통은 === 사용.

    이와 달리 C, C++, C#은 정적 타입 언어임.
    int a = 10;
    이런식으로 이미 타입이 고정이기 때문에 타입 변환 비교 개념이 없음.

    
    6. 반복문
    기본 for문
    for (let i = 0; i < 3; i++) {
        console.log(i);  // 0, 1, 2
    }

    foreach문
    myCollection.forEach(item => {
        console.log(item.name);  // 도라지 이름 하나씩 출력
    });

    // 이렇게도 가능. gradeRates에 있는 값을 하나씩 꺼내 rate에 대입하겠다. foreach문과 유사.
    for (const rate of gradeRates){
            cumulative += rate.chance;
    }


    7. 배열 메서드
    배열명.find() - 조건에 맞는 첫 번째 요소 하나 찾기
    const doraji = dorajiList.find(d => d.id === 5);    // id가 5인 도라지 객체 하나 반환

    배열명.filter() - 조건에 맞는 것만 골라서 새 배열 만들기
    const commons = dorajiList.filter(d => d.grade === "common");   // common 등급만 담긴 배열 반환

    배열명.map() - 배열 각 요소를 변환해서 새 배열 만들기
    const names = dorajiList.map(d => d.name);     // ["검사 도라지", "검은 도라지", ...] 이름만 담긴 배열

    배열명.some() - 하나라도 조건에 맞으면 true
    const hasRare = myCollection.some(d => d.grade === "rare");    // rare 도라지가 하나라도 있으면 true


    8. async / await — 기다려야 하는 작업
    ex) FireBase에서 데이터를 로드하거나 저장할 때 시간이 걸리는데 기다리지 않으면 데이터가 오지 않은 상태에서 다음 코드가 실행되어버림.
    async function loadData() {
        const result = await getDoc(docRef);  // 올 때까지 기다림
        return result;                         // 다 온 다음에 반환
    }
    그래서 이런식으로 await 사용. await는 async에서만 사용 가능.

    9. DOM 조작 — JS로 화면 바꾸기
    HTML 요소를 JS에서 건드리는 방법.

    // 요소 찾기
    const el = document.getElementById("gold-text");

    // 내용 바꾸기
    el.innerText = "500";          // 텍스트만
    el.innerHTML = "<b>500</b>";  // HTML 태그 포함

    // 스타일 바꾸기
    el.style.display = "none";    // 숨기기
    el.style.display = "flex";    // 보이기
    el.style.width = "50%";       // 너비 변경

    // 요소 새로 만들어서 붙이기
    const card = document.createElement("div");
    card.className = "doraji-card";
    card.innerText = "검사 도라지";
    container.appendChild(card);   // container 안에 추가


    10. setTimeout / setInterval — 시간 기반 실행

    setTimeout: 일정 시간 "뒤에 한 번만 실행"
    setInterval: 일정 시간마다 "반복 실행"

    10-1. setTimeout (한 번 실행)
    setTimeout(() => {
        console.log("3초 뒤 실행");
    }, 3000);  // 3000ms = 3초

    // 함수 따로 만들어도 가능
    function hello() {
        console.log("안녕");
    }
    setTimeout(hello, 2000);  // 2초 뒤 hello 실행


    10-2. setInterval (반복 실행)
    const timer = setInterval(() => {
        console.log("1초마다 실행");
    }, 1000);

    // 멈추기 (중요)
    clearInterval(timer);


    10-3. 타이머 취소
    const timeout = setTimeout(() => {
        console.log("이건 실행 안됨");
    }, 5000);

    clearTimeout(timeout);  // 실행 전에 취소 가능


    10-4. 주의할 점 (실무 중요)
    - 시간 단위는 ms (밀리초)
        1000 = 1초

    - setInterval은 계속 돌기 때문에
        필요 없으면 반드시 clearInterval 해줘야 함

    - 게임에서는 setInterval보다
        requestAnimationFrame이나
        직접 타이머(deltaTime) 관리하는 경우가 많음


    11. 현재 날짜, 시간 받아오기
    const now = new Date();

    now.getFullYear();   // 년 (2026)
    now.getMonth();      // 월 (0~11) +1 해야 실제 월
    now.getDate();       // 일

    now.getHours();      // 시
    now.getMinutes();    // 분
    now.getSeconds();    // 초
========================= */


/* ========================= html
    1. html
    HTML은 화면의 구조를 만드는 언어.
    
    보통 html의 기본 구조.
    <!DOCTYPE html>     // 이 문서는 HTML5 문서다 라는 선언.
    <html>              // 이 문서 전체를 감싸는 제일 바깥 태그. 내 스크립트에서는 <html lang="ko"> 이렇게 씀. 이 문서의 기본 언어가 한국어라는 뜻.
        <head>          // 화면에 직접 보이는 내용이 아니라 문서 설정을 넣는 부분. 문자 인코딩 설정, 탭 제목, CSS 연결 등
        </head>
        <body>          // 실제로 화면에 보이는 것들. 버튼, 창, 텍스트 등 모든 것.
        </body>
    </html>


    2. 태그
    HTML은 태그(tag)로 이루어져 있다.
    <태그명>내용</태그명>
    예) <div>안녕</div>
    <div>는 시작 태그, </div>는 닫는 태그, 안녕은 안에 들어가있는 내용.


    3. <div>, <span>
    3-1. <div>
    화면을 나누는 박스.
    <div>내용</div>
    그냥 네모 영역 하나 만든다고 보면 됨
    기본적으로 block 요소라서 한 줄 전체를 차지함.
    구조 만들 때 씀 (좌/우, 위/아래 나누기)

    3-2. <span>
    텍스트 일부만 잡는 “조각”
    <span>내용</span>
    문장 안에서 일부만 따로 잡을 때 씀.
    기본적으로 inline 요소라 줄바꿈이 없음.
    구조용이 아니라 부분 제어용

    div = Panel / Empty 오브젝트 (레이아웃), 블록 (줄 바꿈됨)
    span = Text 일부 강조, 인라인 (줄 안에서 움직임)


    4. 이외에 자주 쓰는 태그들
    4-1. button
    버튼은 누를 수 있는 UI고, 대부분 onclick이 같이 붙는다.
    <button onclick="ButtonClick()">물 주기</button>

    4-2. input
    입력칸.
    <input type="text" id="friend-code-input" placeholder="친구코드 입력">

    type="text" → 글자 입력칸
    id="friend-code-input" → JS에서 이 칸 찾기 위한 이름
    placeholder="친구코드 입력" → 비어 있을 때 흐리게 보이는 안내문

    4-3. img
    팝업 안에 이미지를 띄우기 위한 태그.
    <img id="popup-img" width="150">
    보통 JS로 src를 바꿔서 다른 이미지를 보여주게 함.
    width="150"은 너비 지정.

    4-4. h1 ~ h6
    제목 태그. 숫자가 작을수록 더 큰 제목.

    <h3>친구</h3>
    <h4>받은 친구 요청</h4>
    <h3>판매 등록</h3>
    즉, 섹션 제목 용도

    4-5. p
    문단 태그.
    <p>이건 문단입니다.</p>

    설명글, 안내문 같은 거 넣을 때 많이 씀.

    4-6. select / option
    드롭다운 선택창. 장터 코드에서 사용중.
    <select id="market-sort">
        <option value="latest">최신순</option>
        <option value="low">가격 낮은순</option>
        <option value="high">가격 높은순</option>
    </select>

    select = 선택 박스 전체
    option = 선택 가능한 항목 하나
    필터, 정렬 같은 곳에서 자주 씀.

    4-7. label
    입력 요소 설명용 태그.
    <label>
        <input type="checkbox" id="market-my-items-only">
        내가 올린 글만
    </label>

    이렇게 쓰면 텍스트를 눌러도 체크박스가 같이 눌리는 경우가 많아서 편함.

    4-8. script
    JS 파일 연결. 모듈화 안시키고 이 안에다 적어도 되긴 하는데 코드가 길어지면 가독성이 떨어짐.
    보통은 모듈화를 안시키고 html파일에 같이 적는다고 하면 ㄴHTML 맨 아래에 넣어서 DOM이 다 로드된 뒤 실행되게 한다.
    <script type="module" src="main.js"></script>

    src="main.js" → 이 JS 파일 불러와라
    type="module" → 이 JS는 모듈 방식으로 실행

    4-9. link
    CSS 연결용.
    <link rel="stylesheet" href="style.css">

    rel="stylesheet" → 스타일시트다
    href="style.css" → style.css 파일을 연결

    4-10. meta
    문서 설정 태그.
    <meta charset="UTF-8">

    한글 안깨지게 만드는.


    5. id와 클래스
    5-1. id
    한 요소를 딱 하나 집어서 구분하는 이름.

    예)
    <div id="collection"></div>
    <span id="gold-text">0</span>

    보통 js에서
    document.getElementById("gold-text")
    이렇게 찾음. js 9번 DOM 조작 부분이랑 이어지는 내용.

    id는 보통 JS에서 특정 요소 찾기, CSS에서 특정 요소 꾸미기 할 때 사용.

    5-2. class
    비슷한 스타일끼리 묶는 이름.
    <button id="login-btn" class="big-btn" onclick="Login()">구글 로그인</button>
    <div class="trade-panel">

    이건 여러 요소가 공유 가능함.

    즉,
    id = 주민등록번호 느낌, 같은 id는 문서 내에서 하나만 써야 한다.
    class = 같은 팀 이름 느낌, 여러 개 가능


    6. style 속성
    태그 안에 직접 CSS를 적는 방식.
    <div id="user-menu" style="display:none;">
        <div id="popup" style="
            display:none;
            position:fixed;
            top:50%;
            left:50%;
            transform:translate(-50%, -50%);
            ...
    ">

    “이 태그만 바로 이렇게 꾸며라”는 뜻.
    보통 css파일로 빼지만 간단한건 inline style로 종종 씀.

    6-1. display:none;
    처음엔 안 보이게 숨겨두고, 로그인되거나 버튼 눌렀을 때 등 특정 조건이 충족됐을 때 JS로 보여주려는 것.
    CSS로 숨겼다가 JS로 display를 바꿔서 보여준다.


    7. onclick
    <button onclick="Login()">구글 로그인</button>
    <button onclick="Logout()">로그아웃</button>
    <button onclick="ButtonClick()">물 주기</button>
    <button onclick="OpenMarketModal()">장터</button>

    이 요소를 클릭하면 괄호 안 함수 실행


    8. 부모-자식 구조
    HTML은 박스 안에 박스가 계속 들어가는 트리 구조.
    <div id="main-layout">
        <div id="friend-section">...</div>
        <div id="game-section">...</div>
    </div>

    여기서 
    main-layout = 부모
    friend-section, game-section = 자식
    그리고 그 안에 또 자식이 들어가고, 그 안에 또 자식이 들어감.


    9. DOM이라는 개념
    HTML이 브라우저에 읽히면 브라우저는 이 HTML을 DOM 트리라는 형태로 바꿔서 관리.

    쉽게 말해서
    HTML은 원본 문서
    DOM은 브라우저가 이해하기 쉽게 바꿔놓은 객체 구조

    document.getElementById("gold-text") 하면
    HTML 속 <span id="gold-text">0</span>를 찾아오는 것.


    10. 주석
    HTML 주석은 이렇게 씀.
    <!-- 주석 -->


    11. 빈 태그를 미리 만들어두는 이유
    <div id="friend-request-list"></div>
    <div id="friend-list"></div>
    <div id="trade-request-list"></div>
    <div id="collection"></div>
    <div id="market-list"></div>
    <div id="shop-item-list"></div>

    JS가 나중에 데이터를 가져와서 여기에 채워 넣기 때문에 비워둠.
    즉 HTML은 그릇만 만들어두고, JS가 내용물을 넣는 구조.
========================= */