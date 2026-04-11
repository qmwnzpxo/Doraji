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

// 버튼 함수
window.ButtonClick = function() {
    if (!currentUser) {
        alert("로그인 먼저 해주세요!");
        return;
    }
    if (count < maxCount) {
        count++;
        document.getElementById("counter").innerText = count + " / " + maxCount;
        document.getElementById("bar").style.width = (count / maxCount) * 100 + "%";
        if (count == maxCount) {
            setTimeout(async () => {
                alert("도라지 출몰!");
                myCollection.push("도라지");
                await saveData(myCollection);
                count = 0;
                document.getElementById("counter").innerText = "0 / " + maxCount;
                document.getElementById("bar").style.width = "0%";
            }, 250);
        }
    }
}