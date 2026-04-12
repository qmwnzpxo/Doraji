/////////////////////////////////////////////////
/// 로그인, 로그아웃, 저장 관련
////////////////////////////////////////////////
import { db, auth, provider } from "./firebase.js";


import {
    doc, getDoc, setDoc, updateDoc,
    collection, addDoc, getDocs, query, where,
    arrayUnion, arrayRemove, serverTimestamp, writeBatch, onSnapshot
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

/////////////////////////////// 로그인, 친구 관련 변수 공간 ///////////////////////////////
let unsubscribeFriendRequests = null;   // 친구요청
let unsubscribeFriends = null;  // 친구
let currentUser = null;
let unsubscribeTradeRequests = null;    // 교환요청
let unsubscribeActiveTrades = null;
let currentTradeId = null;
let unsubscribeMarket = null;
let unsubscribeGold = null;
let myGold = 0;
let marketCurrentPage = 1;
const MARKET_ITEMS_PER_PAGE = 20;
///////////////////////////////////////////////////////////////////////////////////////

// 로그인 상태 감지 (페이지 열면 자동으로 로그인 유지)
onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log("user:", user); // 로그인 정보 확인
        currentUser = user;
        document.getElementById("user-info").innerText = " " + user.displayName;
        await ensureUserProfile(user);
        listenMyGold();
        document.getElementById("login-btn").style.display = "none";
        document.getElementById("user-menu").style.display = "inline-flex";
        document.getElementById("game-section").style.display = "flex";
        document.getElementById("friend-section").style.display = "block";
        myCollection = await loadData();
        updateMaxCountByTime();
        renderCollection();
        startAutoGrow();
        listenFriendRequests();
        listenFriends();
        listenTradeRequests();
        listenActiveTrades();
        document.getElementById("logout-btn").style.display = "inline";
    } else {
    currentUser = null;

    if (unsubscribeFriendRequests) {
        unsubscribeFriendRequests();
        unsubscribeFriendRequests = null;
    }

    if (unsubscribeFriends) {
        unsubscribeFriends();
        unsubscribeFriends = null;
    }

    if (unsubscribeTradeRequests) {
    unsubscribeTradeRequests();
    unsubscribeTradeRequests = null;
    }
    document.getElementById("trade-request-list").innerHTML = "";

    if (unsubscribeActiveTrades) {
        unsubscribeActiveTrades();
        unsubscribeActiveTrades = null;
    }
    document.getElementById("active-trade-list").innerHTML = "";

    if (unsubscribeGold) {
        unsubscribeGold();
        unsubscribeGold = null;
    }
    document.getElementById("gold-text").innerText = "0";

    document.getElementById("user-info").innerText = "";
    document.getElementById("user-menu").style.display = "none";
    document.getElementById("login-btn").style.display = "inline-block";
    document.getElementById("game-section").style.display = "none";
    document.getElementById("logout-btn").style.display = "none";
    document.getElementById("friend-section").style.display = "none";
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
    }, { merge: true });
}
// 불러오기 (내 uid로)
async function loadData() {
    const docRef = doc(db, "users", currentUser.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data().collection || [];  // ← || [] 추가
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
let isRolling = false;

// 버튼 함수
window.ButtonClick = async function() {
    if (isRolling) return;
    if (!currentUser) {
        alert("로그인 먼저 해주세요!");
        return;
    }
    if (count < maxCount) {
        count++;
        document.getElementById("counter").innerText = count + " / " + maxCount;
        document.getElementById("bar").style.width = (count / maxCount) * 100 + "%";
        if (count == maxCount)
            await tryRoll();
    }
}

// ui 업데이트 함수
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

// 도라지 뽑았을 때 팝업 띄우는 함수
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

let autoInterval = null;

// 1초에 카운트가 1씩 자동으로 올라가는 방치형 용 함수
function startAutoGrow() {
    if (autoInterval) return;

    autoInterval = setInterval(async () => {
        if (!currentUser) return;

        updateMaxCountByTime();

        if (isRolling) return;

        if (count < maxCount) {
            count++;
            document.getElementById("counter").innerText = count + " / " + maxCount;
            document.getElementById("bar").style.width = (count / maxCount) * 100 + "%";
        }

        if (count == maxCount) {
            await tryRoll();
        }
    }, 1000);
}

// count가 다 찬 뒤 도라지가 뽑히는 함수
async function tryRoll() {
    if (isRolling) return;
    if (!currentUser) return;
    if (count < maxCount) return;

    isRolling = true;

    try {
        count = 0;
        document.getElementById("counter").innerText = "0 / " + maxCount;
        document.getElementById("bar").style.width = "0%";

        const newDoraji = getRandomDoraji();
        if (newDoraji) {
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
}

// 현재 시각에 따라 낮과 밤이 바뀌어 maxCount가 바뀌는 함수
function updateMaxCountByTime() {
    const now = new Date();
    const hour = now.getHours();

    let newMax;

    if (hour >= 6 && hour < 18) {
        newMax = 10;
    } else {
        newMax = 100;
    }

    // maxCount가 바뀌었을 때만 처리
    if (maxCount !== newMax) {
        maxCount = newMax;

        // count가 max보다 크면 맞춰주기
        if (count > maxCount) {
            count = maxCount;
        }
    }
}

// 유저 개인 프로필 저장 함수
async function ensureUserProfile(user) {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        await setDoc(userRef, {
            displayName: user.displayName || "이름없음",
            friendCode: user.uid.slice(0, 8),
            friends: [],
            gold: 0
        });
    } else {
        const userData = userSnap.data();
        const updateData = {};

        if (!userData.displayName) {
            updateData.displayName = user.displayName || "이름없음";
        }
        if (!userData.friendCode) {
            updateData.friendCode = user.uid.slice(0, 8);
        }
        if (!userData.friends) {
            updateData.friends = [];
        }
        if (userData.gold === undefined) {
            updateData.gold = 0;
        }

        if (Object.keys(updateData).length > 0) {
            await setDoc(userRef, updateData, { merge: true });
        }
    }

    const updatedSnap = await getDoc(userRef);
    const updatedData = updatedSnap.data();

    document.getElementById("my-friend-code").innerText = updatedData.friendCode;
    document.getElementById("gold-text").innerText = updatedData.gold;
    myGold = updatedData.gold || 0;
}

// 친구 요청 보내기 함수
window.SendFriendRequest = async function() {
    if (!currentUser) return;

    const friendCode = document.getElementById("friend-code-input").value.trim();
    if (!friendCode) {
        alert("친구코드를 입력하세요.");
        return;
    }

    const usersRef = collection(db, "users");
    const q = query(usersRef, where("friendCode", "==", friendCode));
    const snap = await getDocs(q);

    if (snap.empty) {
        alert("해당 친구코드를 가진 유저가 없습니다.");
        return;
    }

    const targetDoc = snap.docs[0];
    const targetUid = targetDoc.id;
    const targetData = targetDoc.data();

    if (targetUid === currentUser.uid) {
        alert("자기 자신에게는 요청할 수 없습니다.");
        return;
    }

    const myDoc = await getDoc(doc(db, "users", currentUser.uid));
    const myData = myDoc.data();

    if ((myData.friends || []).includes(targetUid)) {
        alert("이미 친구입니다.");
        return;
    }

    const requestRef = collection(db, "friendRequests");

    // 1) 내가 상대에게 이미 보낸 pending 요청 있는지
    const sentQuery = query(
        requestRef,
        where("fromUid", "==", currentUser.uid),
        where("toUid", "==", targetUid),
        where("status", "==", "pending")
    );
    const sentSnap = await getDocs(sentQuery);

    if (!sentSnap.empty) {
        alert("이미 친구 요청을 보냈습니다.");
        return;
    }

    // 2) 상대가 이미 나에게 pending 요청 보낸 상태인지
    const receivedQuery = query(
        requestRef,
        where("fromUid", "==", targetUid),
        where("toUid", "==", currentUser.uid),
        where("status", "==", "pending")
    );
    const receivedSnap = await getDocs(receivedQuery);

    if (!receivedSnap.empty) {
        alert("상대가 이미 친구 요청을 보냈습니다. 받은 요청에서 수락하세요.");
        return;
    }

    await addDoc(collection(db, "friendRequests"), {
        fromUid: currentUser.uid,
        fromName: currentUser.displayName || "이름없음",
        toUid: targetUid,
        toName: targetData.displayName || "이름없음",
        status: "pending",
        createdAt: serverTimestamp()
    });

    alert("친구 요청을 보냈습니다.");
    document.getElementById("friend-code-input").value = "";
}

// 받은 요청 불러오기
function listenFriendRequests() {
    if (!currentUser) return;

    const container = document.getElementById("friend-request-list");
    if (!container) return;

    if (unsubscribeFriendRequests) {
        unsubscribeFriendRequests();
    }

    const q = query(
        collection(db, "friendRequests"),
        where("toUid", "==", currentUser.uid),
        where("status", "==", "pending")
    );

    unsubscribeFriendRequests = onSnapshot(q, (snap) => {
        container.innerHTML = "";

        if (snap.empty) {
            container.innerText = "받은 요청 없음";
            return;
        }

        snap.forEach(docSnap => {
            const data = docSnap.data();

            const row = document.createElement("div");
            row.innerHTML = `
                <span>${data.fromName}</span>
                <button onclick="AcceptFriendRequest('${docSnap.id}', '${data.fromUid}')">수락</button>
                <button onclick="RejectFriendRequest('${docSnap.id}')">거절</button>
            `;

            container.appendChild(row);
        });
    });
}

// 친구 요청 수락 함수
window.AcceptFriendRequest = async function(requestId, fromUid) {
    if (!currentUser) return;

    const requestRef = doc(db, "friendRequests", requestId);
    const myRef = doc(db, "users", currentUser.uid);
    const otherRef = doc(db, "users", fromUid);

    const batch = writeBatch(db);

    batch.update(myRef, {
        friends: arrayUnion(fromUid)
    });

    batch.update(otherRef, {
        friends: arrayUnion(currentUser.uid)
    });

    batch.update(requestRef, {
        status: "accepted"
    });

    await batch.commit();

    alert("친구 요청을 수락했습니다.");
}

// 친구 신청 거절 함수
window.RejectFriendRequest = async function(requestId) {
    if (!currentUser) return;

    const requestRef = doc(db, "friendRequests", requestId);

    await updateDoc(requestRef, {
        status: "rejected"
    });

    alert("친구 요청을 거절했습니다.");
}

// 친구 목록 불러오기
function listenFriends() {
    if (!currentUser) return;

    const container = document.getElementById("friend-list");
    if (!container) return;

    if (unsubscribeFriends) {
        unsubscribeFriends();
    }

    const myRef = doc(db, "users", currentUser.uid);

    unsubscribeFriends = onSnapshot(myRef, async (mySnap) => {
        container.innerHTML = "";

        if (!mySnap.exists()) {
            container.innerText = "친구 없음";
            return;
        }

        const myData = mySnap.data();
        const friends = myData.friends || [];

        if (friends.length === 0) {
            container.innerText = "친구 없음";
            return;
        }

        for (const friendUid of friends) {
            const friendSnap = await getDoc(doc(db, "users", friendUid));
            if (!friendSnap.exists()) continue;

            const friendData = friendSnap.data();

            const row = document.createElement("div");
            row.innerHTML = `
                <span>${friendData.displayName} (${friendData.friendCode})</span>
                <button onclick="RequestTradeSession('${friendUid}', '${friendData.displayName}')">교환</button>
                <button onclick="RemoveFriend('${friendUid}')">삭제</button>
            `;
            container.appendChild(row);
        }
    });
}

// 친구 삭제 함수
window.RemoveFriend = async function(friendUid) {
    if (!currentUser) return;

    const myRef = doc(db, "users", currentUser.uid);
    const otherRef = doc(db, "users", friendUid);

    const batch = writeBatch(db);

    batch.update(myRef, {
        friends: arrayRemove(friendUid)
    });

    batch.update(otherRef, {
        friends: arrayRemove(currentUser.uid)
    });

    await batch.commit();

    alert("친구를 삭제했습니다.");
}

// 콜렉션 묶는 함수
function getGroupedCollection(collectionData) {
    const grouped = {};

    collectionData.forEach(savedItem => {
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

    return Object.values(grouped);
}

// 내가 정말 그 도라지를 갖고있는가에 대한 함수
function hasDoraji(collectionData, dorajiId, amount = 1) {
    let count = 0;

    for (const item of collectionData) {
        if (item.id === dorajiId) {
            count++;
        }
    }

    return count >= amount;
}

// 교환요청 보내기 함수
window.RequestTradeSession = async function(friendUid, friendName) {
    if (!currentUser) return;

    const allTradesSnap = await getDocs(collection(db, "trades"));

    const alreadyExists = allTradesSnap.docs.some(docSnap => {
        const data = docSnap.data();

        if (data.type !== "friend") return false;
        if (data.status !== "pending" && data.status !== "active") return false;

        return (
            (data.requesterUid === currentUser.uid && data.targetUid === friendUid) ||
            (data.requesterUid === friendUid && data.targetUid === currentUser.uid)
        );
    });

    if (alreadyExists) {
        alert("이미 진행 중이거나 대기 중인 교환이 있습니다.");
        return;
    }

    await addDoc(collection(db, "trades"), {
        type: "friend",
        status: "pending",
        requesterUid: currentUser.uid,
        requesterName: currentUser.displayName || "이름없음",
        targetUid: friendUid,
        targetName: friendName,
        requesterOffer: [],
        targetOffer: [],
        requesterLocked: false,
        targetLocked: false,
        createdAt: serverTimestamp()
    });

    alert("교환 요청을 보냈습니다.");
}

// 받은 교환요청 실시간 표시
function listenTradeRequests() {
    if (!currentUser) return;

    const container = document.getElementById("trade-request-list");
    if (!container) return;

    if (unsubscribeTradeRequests) {
        unsubscribeTradeRequests();
    }

    const q = query(
        collection(db, "trades"),
        where("targetUid", "==", currentUser.uid),
        where("status", "==", "pending"),
        where("type", "==", "friend")
    );

    unsubscribeTradeRequests = onSnapshot(q, (snap) => {
        container.innerHTML = "";

        if (snap.empty) {
            container.innerText = "받은 교환 요청 없음";
            return;
        }

        snap.forEach(docSnap => {
            const data = docSnap.data();

            const row = document.createElement("div");
            row.innerHTML = `
                <span>${data.requesterName} 님의 교환 요청</span>
                <button onclick="AcceptTradeRequest('${docSnap.id}')">수락</button>
                <button onclick="RejectTradeRequest('${docSnap.id}')">거절</button>
            `;

            container.appendChild(row);
        });
    });
}

// 교환요청 수락 함수
window.AcceptTradeRequest = async function(tradeId) {
    if (!currentUser) return;

    const tradeRef = doc(db, "trades", tradeId);

    await updateDoc(tradeRef, {
        status: "active"
    });

    alert("교환이 시작되었습니다.");
}

// 교환요청 거절 함수
window.RejectTradeRequest = async function(tradeId) {
    if (!currentUser) return;

    const tradeRef = doc(db, "trades", tradeId);

    await updateDoc(tradeRef, {
        status: "rejected"
    });

    alert("교환 요청을 거절했습니다.");
}

// 메이플식 실시간 거래 함수
function listenActiveTrades() {
    if (!currentUser) return;

    const container = document.getElementById("active-trade-list");
    if (!container) return;

    if (unsubscribeActiveTrades) {
        unsubscribeActiveTrades();
    }

    unsubscribeActiveTrades = onSnapshot(collection(db, "trades"), (snap) => {
        container.innerHTML = "";

        const activeTrades = snap.docs.filter(docSnap => {
            const data = docSnap.data();

            if (data.type !== "friend") return false;
            if (data.status !== "active") return false;

            return data.requesterUid === currentUser.uid || data.targetUid === currentUser.uid;
        });

        if (activeTrades.length === 0) {
            container.innerText = "진행 중인 교환 없음";
            CloseTradeModal();
            return;
        }

        activeTrades.forEach(docSnap => {
            const data = docSnap.data();

            const isRequester = data.requesterUid === currentUser.uid;
            const otherName = isRequester ? data.targetName : data.requesterName;

            const row = document.createElement("div");
            row.innerHTML = `
                <span>${otherName} 님과 진행 중인 교환</span>
                <button onclick="openTradeModal('${docSnap.id}')">열기</button>
            `;
            container.appendChild(row);

            if (currentTradeId === docSnap.id) {
                renderTradeModal(docSnap.id, data);

                getDoc(doc(db, "users", currentUser.uid)).then(mySnap => {
                    const myData = mySnap.data();
                    const myCollectionData = myData.collection || [];
                    renderTradeSelectList(docSnap.id, data, myCollectionData);
                });
            }
        });
    });
}

// id별로 묶는 함수
function getGroupedOffer(offer) {
    const grouped = {};

    for (const id of offer) {
        if (!grouped[id]) {
            grouped[id] = 1;
        } else {
            grouped[id]++;
        }
    }

    return grouped;
}

// 친구랑 교환할 때 내가 가진 교환할 수 있는 도라지 목록을 띄우는 함수
function renderTradeSelectList(tradeId, tradeData, myCollectionData) {
    const container = document.getElementById("trade-my-item-list");
    if (!container) return;

    container.innerHTML = "";

    const grouped = getGroupedCollection(myCollectionData);

    if (grouped.length === 0) {
        container.innerText = "보유한 도라지가 없습니다.";
        return;
    }

    const isRequester = tradeData.requesterUid === currentUser.uid;
    const currentOffer = isRequester ? (tradeData.requesterOffer || []) : (tradeData.targetOffer || []);

    grouped.forEach(item => {
        const alreadyCount = currentOffer.filter(id => id === item.id).length;
        const remainCount = item.count - alreadyCount;

        const card = document.createElement("div");
        card.className = "trade-select-item";

        card.innerHTML = `
            <img src="${item.img}" width="60">
            <div>${item.name}</div>
            <div>남은 수량: x${remainCount}</div>
        `;

        if (remainCount <= 0) {
            card.classList.add("disabled");
        } else {
            card.onclick = () => AddDorajiToTradeById(tradeId, item.id);
        }

        container.appendChild(card);
    });
}

// 거래 창에 도라지 올리기 함수
window.AddDorajiToTrade = async function(tradeId) {
    if (!currentUser) return;

    const tradeRef = doc(db, "trades", tradeId);
    const tradeSnap = await getDoc(tradeRef);
    if (!tradeSnap.exists()) return;

    const tradeData = tradeSnap.data();

    if (tradeData.requesterLocked || tradeData.targetLocked) {
        alert("이미 확인 단계입니다. 수정할 수 없습니다.");
        return;
    }

    const myDoc = await getDoc(doc(db, "users", currentUser.uid));
    const myData = myDoc.data();
    const myCollectionData = myData.collection || [];

    renderTradeSelectList(tradeId, tradeData, myCollectionData);
}

// 실제로 도라지 id를 받아와 올리는 함수
async function AddDorajiToTradeById(tradeId, dorajiId) {
    if (!currentUser) return;

    const tradeRef = doc(db, "trades", tradeId);
    const tradeSnap = await getDoc(tradeRef);
    if (!tradeSnap.exists()) return;

    const tradeData = tradeSnap.data();
    const isRequester = tradeData.requesterUid === currentUser.uid;

    if (tradeData.requesterLocked || tradeData.targetLocked) {
        alert("이미 확인 단계입니다. 수정할 수 없습니다.");
        return;
    }

    const myDoc = await getDoc(doc(db, "users", currentUser.uid));
    const myData = myDoc.data();
    const myCollectionData = myData.collection || [];

    const currentOffer = isRequester ? (tradeData.requesterOffer || []) : (tradeData.targetOffer || []);
    const alreadyCount = currentOffer.filter(id => id === dorajiId).length;

    if (!hasDoraji(myCollectionData, dorajiId, alreadyCount + 1)) {
        alert("해당 도라지를 더 이상 올릴 수 없습니다.");
        return;
    }

    const newOffer = [...currentOffer, dorajiId];

    if (isRequester) {
        await updateDoc(tradeRef, {
            requesterOffer: newOffer,
            requesterLocked: false,
            targetLocked: false
        });
    } else {
        await updateDoc(tradeRef, {
            targetOffer: newOffer,
            requesterLocked: false,
            targetLocked: false
        });
    }

    // 다시 목록 갱신
    const updatedTradeSnap = await getDoc(tradeRef);
    const updatedTradeData = updatedTradeSnap.data();
    renderTradeSelectList(tradeId, updatedTradeData, myCollectionData);
}

// 확인 버튼. 둘 다 확인하면 교환 실행.
window.LockTrade = async function(tradeId) {
    if (!currentUser) return;

    const tradeRef = doc(db, "trades", tradeId);
    const tradeSnap = await getDoc(tradeRef);

    if (!tradeSnap.exists()) return;

    const tradeData = tradeSnap.data();
    const isRequester = tradeData.requesterUid === currentUser.uid;

    if (isRequester) {
        await updateDoc(tradeRef, {
            requesterLocked: true
        });
    } else {
        await updateDoc(tradeRef, {
            targetLocked: true
        });
    }

    const updatedSnap = await getDoc(tradeRef);
    const updatedData = updatedSnap.data();

    if (updatedData.requesterLocked && updatedData.targetLocked) {
        await completeTrade(tradeId);
    }
}

// 거래 완료 처리
async function completeTrade(tradeId) {
    const tradeRef = doc(db, "trades", tradeId);
    const tradeSnap = await getDoc(tradeRef);

    if (!tradeSnap.exists()) return;

    const tradeData = tradeSnap.data();

    const requesterRef = doc(db, "users", tradeData.requesterUid);
    const targetRef = doc(db, "users", tradeData.targetUid);

    const requesterSnap = await getDoc(requesterRef);
    const targetSnap = await getDoc(targetRef);

    if (!requesterSnap.exists() || !targetSnap.exists()) {
        alert("유저 정보를 찾을 수 없습니다.");
        return;
    }

    const requesterData = requesterSnap.data();
    const targetData = targetSnap.data();

    let requesterCollection = requesterData.collection || [];
    let targetCollection = targetData.collection || [];

    for (const dorajiId of tradeData.requesterOffer) {
        if (!hasDoraji(requesterCollection, dorajiId, 1)) {
            alert("요청자가 교환 도중 도라지를 잃었습니다.");
            await updateDoc(tradeRef, { status: "cancelled" });
            return;
        }
        requesterCollection = removeOneDoraji(requesterCollection, dorajiId);
        targetCollection.push(dorajiList.find(d => d.id === dorajiId));
    }

    for (const dorajiId of tradeData.targetOffer) {
        if (!hasDoraji(targetCollection, dorajiId, 1)) {
            alert("상대가 교환 도중 도라지를 잃었습니다.");
            await updateDoc(tradeRef, { status: "cancelled" });
            return;
        }
        targetCollection = removeOneDoraji(targetCollection, dorajiId);
        requesterCollection.push(dorajiList.find(d => d.id === dorajiId));
    }

    const batch = writeBatch(db);

    batch.set(requesterRef, { collection: requesterCollection }, { merge: true });
    batch.set(targetRef, { collection: targetCollection }, { merge: true });
    batch.update(tradeRef, { status: "completed" });

    await batch.commit();

    if (currentUser.uid === tradeData.requesterUid) {
        myCollection = requesterCollection;
    } else if (currentUser.uid === tradeData.targetUid) {
        myCollection = targetCollection;
    }

    renderCollection();
    CloseTradeModal();
    alert("교환이 완료되었습니다.");
}

// 거래 취소
window.CancelTrade = async function(tradeId) {
    if (!currentUser) return;

    const tradeRef = doc(db, "trades", tradeId);

    await updateDoc(tradeRef, {
        status: "cancelled"
    });

    if (currentTradeId === tradeId) {
        CloseTradeModal();
    }

    alert("교환을 취소했습니다.");
}

// 배열에서 특정 도라지 빼기
function removeOneDoraji(collectionData, dorajiId) {
    const newCollection = [...collectionData];
    const index = newCollection.findIndex(item => item.id === dorajiId);

    if (index !== -1) {
        newCollection.splice(index, 1);
    }

    return newCollection;
}

// 거래창에서 도라지 하나 빼는 함수
async function removeOneDorajiFromTrade(tradeId, dorajiId) {
    if (!currentUser) return;

    const tradeRef = doc(db, "trades", tradeId);
    const tradeSnap = await getDoc(tradeRef);
    if (!tradeSnap.exists()) return;

    const tradeData = tradeSnap.data();
    const isRequester = tradeData.requesterUid === currentUser.uid;

    if (tradeData.requesterLocked || tradeData.targetLocked) {
        alert("이미 확인 단계입니다. 수정할 수 없습니다.");
        return;
    }

    const currentOffer = isRequester
        ? (tradeData.requesterOffer || [])
        : (tradeData.targetOffer || []);

    const newOffer = [...currentOffer];
    const index = newOffer.indexOf(dorajiId);

    if (index === -1) return;

    newOffer.splice(index, 1);

    if (isRequester) {
        await updateDoc(tradeRef, {
            requesterOffer: newOffer,
            requesterLocked: false,
            targetLocked: false
        });
    } else {
        await updateDoc(tradeRef, {
            targetOffer: newOffer,
            requesterLocked: false,
            targetLocked: false
        });
    }
}

// 거래창 열기
window.openTradeModal = async function(tradeId) {
    currentTradeId = tradeId;
    document.getElementById("trade-modal").style.display = "flex";

    const tradeRef = doc(db, "trades", tradeId);
    const tradeSnap = await getDoc(tradeRef);
    if (!tradeSnap.exists()) return;

    const tradeData = tradeSnap.data();

    const myDoc = await getDoc(doc(db, "users", currentUser.uid));
    const myData = myDoc.data();
    const myCollectionData = myData.collection || [];

    renderTradeModal(tradeId, tradeData);
    renderTradeSelectList(tradeId, tradeData, myCollectionData);
}

// 거래창 닫기
window.CloseTradeModal = function() {
    currentTradeId = null;
    document.getElementById("trade-modal").style.display = "none";
}

// 거래창 내용 업데이트 함수
function renderTradeModal(tradeId, tradeData) {
    const isRequester = tradeData.requesterUid === currentUser.uid;

    const myOffer = isRequester ? tradeData.requesterOffer : tradeData.targetOffer;
    const otherOffer = isRequester ? tradeData.targetOffer : tradeData.requesterOffer;

    const myLocked = isRequester ? tradeData.requesterLocked : tradeData.targetLocked;
    const otherLocked = isRequester ? tradeData.targetLocked : tradeData.requesterLocked;

    const otherName = isRequester ? tradeData.targetName : tradeData.requesterName;

    document.getElementById("trade-modal-title").innerText = `${otherName} 님과의 교환`;

    const mySlots = document.getElementById("my-trade-slots");
    const otherSlots = document.getElementById("other-trade-slots");

    mySlots.innerHTML = "";
    otherSlots.innerHTML = "";

    const groupedMyOffer = getGroupedOffer(myOffer);
    const groupedOtherOffer = getGroupedOffer(otherOffer);

    Object.entries(groupedMyOffer).forEach(([id, count]) => {
        const doraji = dorajiList.find(d => d.id === Number(id));
        if (!doraji) return;

        const slot = document.createElement("div");
        slot.className = "trade-slot";
        slot.innerHTML = `
            <img src="${doraji.img}">
            <div>${doraji.name}</div>
            <div>x${count}</div>
        `;

        slot.oncontextmenu = async function(e) {
            e.preventDefault();
            await removeOneDorajiFromTrade(tradeId, Number(id));
        };

        mySlots.appendChild(slot);
    });

    Object.entries(groupedOtherOffer).forEach(([id, count]) => {
        const doraji = dorajiList.find(d => d.id === Number(id));
        if (!doraji) return;

        const slot = document.createElement("div");
        slot.className = "trade-slot";
        slot.innerHTML = `
            <img src="${doraji.img}">
            <div>${doraji.name}</div>
            <div>x${count}</div>
        `;
        otherSlots.appendChild(slot);
    });
    document.getElementById("my-trade-lock-state").innerText = myLocked ? "확인 완료" : "대기 중";
    document.getElementById("other-trade-lock-state").innerText = otherLocked ? "확인 완료" : "대기 중";
}

// 현재 열려있는 거래에 맞춰 버튼 연결
window.AddDorajiToCurrentTrade = async function() {
    if (!currentTradeId) return;
    await AddDorajiToTrade(currentTradeId);
}
window.LockCurrentTrade = async function() {
    if (!currentTradeId) return;
    await LockTrade(currentTradeId);
}
window.CancelCurrentTrade = async function() {
    if (!currentTradeId) return;
    await CancelTrade(currentTradeId);
    CloseTradeModal();
}

// 장터 열기
window.OpenMarketModal = function() {
    document.getElementById("market-modal").style.display = "flex";
    marketCurrentPage = 1;
    renderMarketMyItems();
    listenMarketItems();
}
// 장터 닫기
window.CloseMarketModal = function() {
    document.getElementById("market-modal").style.display = "none";
}

// 장터 판매 등록 함수
async function registerSelectedDorajiForMarket(dorajiId) {
    if (!currentUser) return;

    if (!hasDoraji(myCollection, dorajiId, 1)) {
        alert("해당 도라지를 가지고 있지 않습니다.");
        return;
    }

    const doraji = dorajiList.find(d => d.id === dorajiId);
    if (!doraji) {
        alert("도라지 정보를 찾을 수 없습니다.");
        return;
    }

    const priceInput = prompt(`${doraji.name}의 판매 가격을 입력하세요.`);
    if (!priceInput) return;

    const price = Number(priceInput);
    if (Number.isNaN(price) || price <= 0) {
        alert("올바른 가격을 입력하세요.");
        return;
    }

    const newCollection = removeOneDoraji(myCollection, dorajiId);

    const userRef = doc(db, "users", currentUser.uid);
    const batch = writeBatch(db);

    batch.set(userRef, { collection: newCollection }, { merge: true });
    batch.set(doc(collection(db, "marketTrades")), {
        sellerUid: currentUser.uid,
        sellerName: currentUser.displayName || "이름없음",
        dorajiId,
        dorajiData: doraji,
        price,
        status: "listed",
        createdAt: serverTimestamp()
    });

    await batch.commit();

    myCollection = newCollection;
    renderCollection();
    renderMarketMyItems();

    alert("장터에 등록했습니다.");
}

// 장터 실시간 목록 표시 함수
function listenMarketItems() {
    const container = document.getElementById("market-list");
    const searchInput = document.getElementById("market-search");
    const sortSelect = document.getElementById("market-sort");
    const gradeFilter = document.getElementById("market-grade-filter");
    const myItemsOnly = document.getElementById("market-my-items-only");
    const affordableOnly = document.getElementById("market-affordable-only");

    const prevBtn = document.getElementById("market-prev-page");
    const nextBtn = document.getElementById("market-next-page");
    const pageInfo = document.getElementById("market-page-info");

    if (!container) return;

    if (unsubscribeMarket) {
        unsubscribeMarket();
    }

    const q = query(
        collection(db, "marketTrades"),
        where("status", "==", "listed")
    );

    unsubscribeMarket = onSnapshot(q, (snap) => {
        container.innerHTML = "";

        if (snap.empty) {
            container.innerText = "등록된 판매글 없음";

            if (pageInfo) pageInfo.innerText = "0 / 0";
            if (prevBtn) prevBtn.disabled = true;
            if (nextBtn) nextBtn.disabled = true;
            return;
        }

        let items = snap.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data()
        }));

        // 검색
        const searchText = searchInput ? searchInput.value.trim().toLowerCase() : "";
        if (searchText) {
            items = items.filter(item => {
                const doraji = dorajiList.find(d => d.id === item.dorajiId);
                if (!doraji) return false;
                return doraji.name.toLowerCase().includes(searchText);
            });
        }

        // 등급 필터
        const selectedGrade = gradeFilter ? gradeFilter.value : "all";
        if (selectedGrade !== "all") {
            items = items.filter(item => {
                const doraji = dorajiList.find(d => d.id === item.dorajiId);
                if (!doraji) return false;
                return doraji.grade === selectedGrade;
            });
        }

        // 내가 올린 글만
        if (myItemsOnly && myItemsOnly.checked) {
            items = items.filter(item => item.sellerUid === currentUser.uid);
        }

        // 내가 살 수 있는 가격만
        if (affordableOnly && affordableOnly.checked) {
            items = items.filter(item =>
                item.sellerUid !== currentUser.uid && item.price <= myGold
            );
        }

        // 정렬
        const sortType = sortSelect ? sortSelect.value : "latest";

        if (sortType === "low") {
            items.sort((a, b) => a.price - b.price);
        } else if (sortType === "high") {
            items.sort((a, b) => b.price - a.price);
        } else {
            items.sort((a, b) => {
                const aTime = a.createdAt?.seconds ?? 0;
                const bTime = b.createdAt?.seconds ?? 0;
                return bTime - aTime;
            });
        }

        if (items.length === 0) {
            container.innerText = "조건에 맞는 판매글 없음";

            if (pageInfo) pageInfo.innerText = "0 / 0";
            if (prevBtn) prevBtn.disabled = true;
            if (nextBtn) nextBtn.disabled = true;
            return;
        }

        // 페이지 계산
        const totalPages = Math.ceil(items.length / MARKET_ITEMS_PER_PAGE);

        if (marketCurrentPage > totalPages) {
            marketCurrentPage = totalPages;
        }
        if (marketCurrentPage < 1) {
            marketCurrentPage = 1;
        }

        const startIndex = (marketCurrentPage - 1) * MARKET_ITEMS_PER_PAGE;
        const endIndex = startIndex + MARKET_ITEMS_PER_PAGE;
        const pagedItems = items.slice(startIndex, endIndex);

        // 현재 페이지 목록만 렌더링
        pagedItems.forEach(item => {
            const doraji = dorajiList.find(d => d.id === item.dorajiId);

            const row = document.createElement("div");
            row.className = "market-item";

            row.innerHTML = `
                <div><strong>판매자:</strong> ${item.sellerName}</div>
                <div><strong>도라지:</strong> ${doraji ? doraji.name : item.dorajiId}</div>
                <div><strong>등급:</strong> ${doraji ? doraji.grade : "-"}</div>
                <div><strong>가격:</strong> ${item.price} G</div>
                ${
                    item.sellerUid === currentUser.uid
                    ? `<button onclick="CancelMarketItem('${item.id}')">등록 취소</button>`
                    : `<button onclick="BuyMarketItem('${item.id}')">구매</button>`
                }
            `;

            container.appendChild(row);
        });

        // 페이지 UI 갱신
        if (pageInfo) {
            pageInfo.innerText = `${marketCurrentPage} / ${totalPages}`;
        }

        if (prevBtn) {
            prevBtn.disabled = marketCurrentPage <= 1;
        }

        if (nextBtn) {
            nextBtn.disabled = marketCurrentPage >= totalPages;
        }
    });
}

// 검색창/정렬 등이 바뀔 때마다 listenMarketItems 다시 실행시키는 코드
document.getElementById("market-search")?.addEventListener("input", () => {
    marketCurrentPage = 1;
    listenMarketItems();
});
document.getElementById("market-sort")?.addEventListener("change", () => {
    marketCurrentPage = 1;
    listenMarketItems();
});
document.getElementById("market-grade-filter")?.addEventListener("change", () => {
    marketCurrentPage = 1;
    listenMarketItems();
});
document.getElementById("market-my-items-only")?.addEventListener("change", () => {
    marketCurrentPage = 1;
    listenMarketItems();
});
document.getElementById("market-affordable-only")?.addEventListener("change", () => {
    marketCurrentPage = 1;
    listenMarketItems();
});

// 페이지
document.getElementById("market-prev-page")?.addEventListener("click", () => {
    if (marketCurrentPage > 1) {
        marketCurrentPage--;
        listenMarketItems();
    }
});
document.getElementById("market-next-page")?.addEventListener("click", () => {
    marketCurrentPage++;
    listenMarketItems();
});

// 등록 취소 함수
window.CancelMarketItem = async function(marketId) {
    if (!currentUser) return;

    const marketRef = doc(db, "marketTrades", marketId);
    const marketSnap = await getDoc(marketRef);

    if (!marketSnap.exists()) return;

    const marketData = marketSnap.data();

    if (marketData.sellerUid !== currentUser.uid) {
        alert("본인 판매글만 취소할 수 있습니다.");
        return;
    }

    if (marketData.status !== "listed") {
        alert("이미 처리된 판매글입니다.");
        return;
    }

    const userRef = doc(db, "users", currentUser.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;

    const userData = userSnap.data();
    const currentCollection = userData.collection || [];
    const doraji = marketData.dorajiData || dorajiList.find(d => d.id === marketData.dorajiId);

    const newCollection = [...currentCollection];
    if (doraji) {
        newCollection.push(doraji);
    }

    const batch = writeBatch(db);
    batch.set(userRef, { collection: newCollection }, { merge: true });
    batch.update(marketRef, { status: "cancelled" });

    await batch.commit();

    myCollection = newCollection;
    renderCollection();
    renderMarketMyItems();

    alert("판매글을 취소했습니다.");
}

// 장터에서 아이템 구매 함수
window.BuyMarketItem = async function(marketId) {
    if (!currentUser) return;

    const marketRef = doc(db, "marketTrades", marketId);
    const marketSnap = await getDoc(marketRef);

    if (!marketSnap.exists()) {
        alert("판매글을 찾을 수 없습니다.");
        return;
    }

    const marketData = marketSnap.data();

    if (marketData.status !== "listed") {
        alert("이미 판매 완료되었거나 취소된 글입니다.");
        return;
    }

    if (marketData.sellerUid === currentUser.uid) {
        alert("자기 판매글은 구매할 수 없습니다.");
        return;
    }

    const sellerRef = doc(db, "users", marketData.sellerUid);
    const buyerRef = doc(db, "users", currentUser.uid);

    const sellerSnap = await getDoc(sellerRef);
    const buyerSnap = await getDoc(buyerRef);

    if (!sellerSnap.exists() || !buyerSnap.exists()) {
        alert("유저 정보를 찾을 수 없습니다.");
        return;
    }

    const sellerData = sellerSnap.data();
    const buyerData = buyerSnap.data();

    let buyerCollection = buyerData.collection || [];
    let sellerGold = sellerData.gold ?? 0;
    let buyerGold = buyerData.gold ?? 0;

    if (buyerGold < marketData.price) {
        alert("골드가 부족합니다.");
        return;
    }

    const doraji = marketData.dorajiData || dorajiList.find(d => d.id === marketData.dorajiId);
    if (!doraji) {
        alert("도라지 정보를 찾을 수 없습니다.");
        return;
    }

    buyerCollection = [...buyerCollection, doraji];
    sellerGold += marketData.price;
    buyerGold -= marketData.price;

    const batch = writeBatch(db);

    batch.set(sellerRef, { gold: sellerGold }, { merge: true });
    batch.set(buyerRef, {
        collection: buyerCollection,
        gold: buyerGold
    }, { merge: true });

    batch.update(marketRef, { status: "sold" });

    await batch.commit();

    myCollection = buyerCollection;
    renderCollection();
    renderMarketMyItems();

    alert("구매가 완료되었습니다.");
}



// 장터 팝업 닫을 때 리스너 끊기
window.CloseMarketModal = function() {
    document.getElementById("market-modal").style.display = "none";

    if (unsubscribeMarket) {
        unsubscribeMarket();
        unsubscribeMarket = null;
    }
}

// 골드 불러오기 함수
async function refreshGold() {
    if (!currentUser) return;

    const userSnap = await getDoc(doc(db, "users", currentUser.uid));
    if (!userSnap.exists()) return;

    const userData = userSnap.data();
    document.getElementById("gold-text").innerText = userData.gold ?? 0;
}

// 골드 추가
async function addGold(amount) {
    if (!currentUser) return;

    const userRef = doc(db, "users", currentUser.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;

    const userData = userSnap.data();
    const currentGold = userData.gold ?? 0;

    await setDoc(userRef, {
        gold: currentGold + amount
    }, { merge: true });

    await refreshGold();
}

// 내 유저 문서를 실시간으로 듣는 함수
function listenMyGold() {
    if (!currentUser) return;

    if (unsubscribeGold) {
        unsubscribeGold();
    }

    const userRef = doc(db, "users", currentUser.uid);

    unsubscribeGold = onSnapshot(userRef, (snap) => {
        if (!snap.exists()) return;

        const userData = snap.data();
        myGold = userData.gold ?? 0;
        document.getElementById("gold-text").innerText = myGold;
    });
}

// 판매 가능한 도라지 렌더링하는 함수
function renderMarketMyItems() {
    const container = document.getElementById("market-my-items");
    if (!container) return;

    container.innerHTML = "";

    const grouped = getGroupedCollection(myCollection);

    if (grouped.length === 0) {
        container.innerText = "판매할 도라지가 없습니다.";
        return;
    }

    grouped.forEach(item => {
        const card = document.createElement("div");
        card.className = "market-my-item";
        card.innerHTML = `
            <img src="${item.img}">
            <div>${item.name}</div>
            <div>x${item.count}</div>
        `;

        card.onclick = () => registerSelectedDorajiForMarket(item.id);

        container.appendChild(card);
    });
}


/////////////////////////////////////////////////
/// 시스템 상점 (도라지 → 골드 판매)
////////////////////////////////////////////////

const SHOP_SELL_PRICES = {
    common: 10,
    epic: 50,
    rare: 200,
    superRare: 500,
};

// 상점 모달 열기
window.OpenShopModal = function() {
    if (!currentUser) {
        alert("로그인 먼저 해주세요!");
        return;
    }
    document.getElementById("shop-modal").style.display = "flex";
    renderShopItems();
}

// 상점 모달 닫기
window.CloseShopModal = function() {
    document.getElementById("shop-modal").style.display = "none";
}

// 상점 아이템 목록 렌더링
function renderShopItems() {
    const container = document.getElementById("shop-item-list");
    if (!container) return;

    container.innerHTML = "";

    const grouped = getGroupedCollection(myCollection);

    if (grouped.length === 0) {
        const empty = document.createElement("div");
        empty.className = "shop-empty";
        empty.innerText = "판매할 도라지가 없습니다.";
        container.appendChild(empty);
        return;
    }

    grouped.forEach(item => {
        const price = SHOP_SELL_PRICES[item.grade] ?? 0;
        const inputId = `shop-qty-${item.id}`;

        const card = document.createElement("div");
        card.className = "shop-item-card";
        card.innerHTML = `
            <img src="${item.img}" alt="${item.name}">
            <div class="shop-item-name">${item.name}</div>
            <div class="shop-item-count">보유: x${item.count}</div>
            <div class="shop-item-price">${price} G / 개</div>
            <div class="shop-qty-row">
                <button class="shop-qty-btn" onclick="ShopQtyAdjust(${item.id}, -1)">−</button>
                <input id="${inputId}" class="shop-qty-input" type="number" value="1" min="1" max="${item.count}">
                <button class="shop-qty-btn" onclick="ShopQtyAdjust(${item.id}, 1)">+</button>
                <button class="shop-qty-btn shop-qty-max" onclick="ShopQtyMax(${item.id}, ${item.count})">MAX</button>
            </div>
            <div class="shop-total-price" id="shop-total-${item.id}">${price} G</div>
            <button class="shop-sell-btn" onclick="SellDorajiToShop(${item.id})">판매</button>
        `;

        // 수량 변경 시 합계 금액 실시간 갱신
        card.querySelector(`#${inputId}`).addEventListener("input", () => {
            updateShopTotal(item.id, price, item.count);
        });

        container.appendChild(card);
    });
}

// 수량 ± 버튼
window.ShopQtyAdjust = function(dorajiId, delta) {
    const input = document.getElementById(`shop-qty-${dorajiId}`);
    if (!input) return;
    const max = parseInt(input.max);
    let val = parseInt(input.value) + delta;
    val = Math.max(1, Math.min(max, val));
    input.value = val;

    const doraji = dorajiList.find(d => d.id === dorajiId);
    if (doraji) updateShopTotal(dorajiId, SHOP_SELL_PRICES[doraji.grade] ?? 0, max);
}

// MAX 버튼
window.ShopQtyMax = function(dorajiId, maxCount) {
    const input = document.getElementById(`shop-qty-${dorajiId}`);
    if (!input) return;
    input.value = maxCount;

    const doraji = dorajiList.find(d => d.id === dorajiId);
    if (doraji) updateShopTotal(dorajiId, SHOP_SELL_PRICES[doraji.grade] ?? 0, maxCount);
}

// 합계 금액 갱신
function updateShopTotal(dorajiId, pricePerItem, maxCount) {
    const input = document.getElementById(`shop-qty-${dorajiId}`);
    const totalEl = document.getElementById(`shop-total-${dorajiId}`);
    if (!input || !totalEl) return;

    let qty = parseInt(input.value);
    if (isNaN(qty) || qty < 1) qty = 1;
    if (qty > maxCount) qty = maxCount;
    input.value = qty;

    totalEl.innerText = `${pricePerItem * qty} G`;
}

// 도라지 판매 (수량 선택)
window.SellDorajiToShop = async function(dorajiId) {
    if (!currentUser) return;

    const doraji = dorajiList.find(d => d.id === dorajiId);
    if (!doraji) return;

    const pricePerItem = SHOP_SELL_PRICES[doraji.grade] ?? 0;

    const input = document.getElementById(`shop-qty-${dorajiId}`);
    const qty = input ? Math.max(1, parseInt(input.value) || 1) : 1;
    const totalPrice = pricePerItem * qty;

    if (!confirm(`${doraji.name} ${qty}개를 ${totalPrice}G에 판매하시겠습니까?`)) return;

    // 컬렉션에서 qty개 제거
    const newCollection = [...myCollection];
    let removed = 0;
    for (let i = newCollection.length - 1; i >= 0 && removed < qty; i--) {
        if (newCollection[i].id === dorajiId) {
            newCollection.splice(i, 1);
            removed++;
        }
    }

    if (removed < qty) {
        alert("보유 수량이 부족합니다.");
        return;
    }

    const userRef = doc(db, "users", currentUser.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;

    const userData = userSnap.data();
    const newGold = (userData.gold ?? 0) + totalPrice;

    const batch = writeBatch(db);
    batch.set(userRef, {
        collection: newCollection,
        gold: newGold
    }, { merge: true });

    await batch.commit();

    myCollection = newCollection;
    renderCollection();
    renderShopItems();

    alert(`${doraji.name} ${qty}개를 ${totalPrice}G에 판매했습니다!`);
}