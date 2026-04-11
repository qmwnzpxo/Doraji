/////////////////////////////////////////////////
/// 로그인, 로그아웃, 저장 관련
////////////////////////////////////////////////
import { db, auth, provider } from "./firebase.js";


import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";
import { signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";

// 로그인 상태 감지 (페이지 열면 자동으로 로그인 유지)
onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log("user:", user); // 로그인 정보 확인
        currentUser = user;
        document.getElementById("user-info").innerText = " " + user.displayName;
        document.getElementById("login-section").querySelector("button").style.display = "none";
        document.getElementById("game-section").style.display = "block";
        myCollection = await loadData();
        renderCollection();
        document.getElementById("logout-btn").style.display = "inline";
    } else {
    currentUser = null;
    document.getElementById("user-info").innerText = "";
    document.getElementById("login-section").querySelector("button").style.display = "block";
    document.getElementById("game-section").style.display = "none";
    document.getElementById("logout-btn").style.display = "none";
    }
});
// 구글 로그인
window.Login = async function() {
    await signInWithPopup(auth, provider);
}
// 구글 로그아웃
window.Logout = async function() {
    await signOut(auth);
    location.reload();
}
// 저장 (내 uid로)
async function saveData(data) {
    await setDoc(doc(db, "users", currentUser.uid), {
        collection: data
    });
}
// 불러오기 (내 uid로)
async function loadData() {
    const docRef = doc(db, "users", currentUser.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data().collection;
    } else {
        return [];
    }
}

/////////////////////////////////////////////////
/// 게임로직
////////////////////////////////////////////////
import { dorajiList, gradeRates } from "./data.js";


let count = 0;
let maxCount = 10;
let myCollection = [];
let currentUser = null;
let isRolling = false;

// 버튼 함수
window.ButtonClick = function() {
    if (isRolling) return;
    if (!currentUser) {
        alert("로그인 먼저 해주세요!");
        return;
    }
    if (count < maxCount) {
        count++;
        document.getElementById("counter").innerText = count + " / " + maxCount;
        document.getElementById("bar").style.width = (count / maxCount) * 100 + "%";
        if (count == maxCount) {
            (async () => {
                isRolling = true;

                try {
                    count = 0;
                    document.getElementById("counter").innerText = "0 / " + maxCount;
                    document.getElementById("bar").style.width = "0%";

                    const newDoraji = getRandomDoraji();
                    if(newDoraji){
                        myCollection.push(newDoraji);
                        await saveData(myCollection);
                        await showPopup(newDoraji);
                        renderCollection();
                    }
                } catch (e) {
                    console.error("롤링 중 에러:", e);
                } finally {
                    isRolling = false;
                }
            })();
        }
    }
}

function renderCollection() {
    const container = document.getElementById("collection");
    if (!container) return;

    container.innerHTML = "";

    const grades = ["common", "epic", "rare", "superRare"];
    const grouped = {};

    myCollection.forEach(savedItem => {
        const latestData = dorajiList.find(d => d.id === savedItem.id);

        const finalItem = latestData ? latestData : savedItem;
        const key = finalItem.id;

        if (!grouped[key]) {
            grouped[key] = {
                ...finalItem,
                count: 1
            };
        } else {
            grouped[key].count++;
        }
    });

    grades.forEach(gradeName => {
        const section = document.createElement("div");
        section.className = "grade-section";

        const title = document.createElement("h2");
        title.innerText = gradeName;
        section.appendChild(title);

        const grid = document.createElement("div");
        grid.className = "grade-grid";

        const items = Object.values(grouped).filter(item => item.grade === gradeName);

        if (items.length === 0) {
            const empty = document.createElement("div");
            empty.className = "empty-text";
            empty.innerText = "아직 없음";
            grid.appendChild(empty);
        } else {
            items.forEach(item => {
                const card = document.createElement("div");
                card.className = "doraji-card";
                card.classList.add(item.grade);

                const grade = document.createElement("div");
                grade.className = "doraji-grade";
                grade.innerText = item.grade;

                const img = document.createElement("img");
                img.src = item.img;
                img.width = 80;

                const name = document.createElement("div");
                name.className = "doraji-name";
                name.innerText = item.name;

                const count = document.createElement("div");
                count.className = "doraji-count";
                count.innerText = `x${item.count}`;

                card.appendChild(grade);
                card.appendChild(img);
                card.appendChild(name);
                card.appendChild(count);

                grid.appendChild(card);
            });
        }

        section.appendChild(grid);
        container.appendChild(section);
    });
}

function getRandomGrade(){
    const rand = Math.random() * 100;
    let cumulative = 0; // 등급별로 구간을 만들어주기 위해 선언된 누계값 변수.
    for (const rate of gradeRates){
        cumulative += rate.chance;
        if (rand < cumulative) {
            return rate.grade;
        }
    }
    return gradeRates[gradeRates.length - 1].grade; // (안전장치)위에서 못 걸렸으면 그냥 마지막 등급 줘라.
}

function getRandomDoraji() {
    const selectedGrade = getRandomGrade();
    const candidates = dorajiList.filter(d => d.grade === selectedGrade);

    if (candidates.length === 0) {
        console.error("해당 등급 도라지가 없음:", selectedGrade);
        return null;
    }

    const randomIndex = Math.floor(Math.random() * candidates.length);
    return candidates[randomIndex];
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function showPopup(doraji) {
    const popup = document.getElementById("popup");
    const img = document.getElementById("popup-img");
    const text = document.getElementById("popup-text");

    img.src = doraji.img;

    let color = "black";
    if (doraji.grade === "rare") color = "blue";
    if (doraji.grade === "epic") color = "purple";
    if (doraji.grade === "superRare") color = "gold";

    text.innerHTML = `<span style="color:${color}">
        ${doraji.grade} 등급 ${doraji.name}
    </span>`;

    popup.style.display = "block";
    await delay(2000);
    popup.style.display = "none";
}