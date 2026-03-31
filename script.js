const STORAGE_KEY = "budget_protein_user_data_v1";

const userSelect = document.getElementById("userSelect");
const refreshUsersBtn = document.getElementById("refreshUsersBtn");

const monthlyBudgetInput = document.getElementById("monthlyBudget");
const usedAmountInput = document.getElementById("usedAmount");
const proteinTargetInput = document.getElementById("proteinTarget");
const proteinConsumedInput = document.getElementById("proteinConsumed");

const selectedUserNameEl = document.getElementById("selectedUserName");
const heroRemainingBudgetEl = document.getElementById("heroRemainingBudget");
const heroProteinRateEl = document.getElementById("heroProteinRate");

const daysInMonthEl = document.getElementById("daysInMonth");
const remainingDaysEl = document.getElementById("remainingDays");
const remainingBudgetEl = document.getElementById("remainingBudget");
const dailyBudgetEl = document.getElementById("dailyBudget");

const proteinTargetViewEl = document.getElementById("proteinTargetView");
const proteinConsumedViewEl = document.getElementById("proteinConsumedView");
const proteinRemainingEl = document.getElementById("proteinRemaining");
const proteinRateEl = document.getElementById("proteinRate");
const proteinProgressEl = document.getElementById("proteinProgress");

const todayChipEl = document.getElementById("todayChip");
const saveBtn = document.getElementById("saveBtn");
const resetBtn = document.getElementById("resetBtn");

let users = [];
let selectedUserId = "";

function formatCurrency(value) {
  return `${Math.round(Number(value || 0)).toLocaleString("ko-KR")}원`;
}

function formatGram(value) {
  return `${Number(value || 0).toLocaleString("ko-KR")}g`;
}

function formatPercent(value) {
  return `${Math.round(Number(value || 0))}%`;
}

function getTodayInfo() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const date = today.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const remainingDays = daysInMonth - date + 1;

  return { today, year, month, date, daysInMonth, remainingDays };
}

function setTodayChip() {
  const now = new Date();
  const text = now.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short"
  });
  todayChipEl.textContent = text;
}

function loadStore() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveStore(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getSelectedUserData() {
  const store = loadStore();
  return store[selectedUserId] || {
    monthlyBudget: "",
    usedAmount: "",
    proteinTarget: "",
    proteinConsumed: ""
  };
}

function setSelectedUserData(data) {
  const store = loadStore();
  store[selectedUserId] = data;
  saveStore(store);
}

function populateUsers() {
  userSelect.innerHTML = "";

  if (!users.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "사용자 없음";
    userSelect.appendChild(option);
    return;
  }

  users.forEach((user) => {
    const option = document.createElement("option");
    option.value = user.id;
    option.textContent = user.name;
    userSelect.appendChild(option);
  });

  if (!selectedUserId || !users.some((u) => u.id === selectedUserId)) {
    selectedUserId = users[0].id;
  }

  userSelect.value = selectedUserId;
}

function updateInputsFromSelectedUser() {
  const currentUser = users.find((u) => u.id === selectedUserId);
  const saved = getSelectedUserData();

  selectedUserNameEl.textContent = currentUser ? currentUser.name : "-";

  monthlyBudgetInput.value = saved.monthlyBudget ?? "";
  usedAmountInput.value = saved.usedAmount ?? "";
  proteinTargetInput.value = saved.proteinTarget ?? "";
  proteinConsumedInput.value = saved.proteinConsumed ?? "";

  calculateAll();
}

function calculateBudget() {
  const { daysInMonth, remainingDays } = getTodayInfo();

  const monthlyBudget = Number(monthlyBudgetInput.value || 0);
  const usedAmount = Number(usedAmountInput.value || 0);

  const remainingBudget = Math.max(monthlyBudget - usedAmount, 0);
  const dailyBudget = remainingDays > 0 ? Math.floor(remainingBudget / remainingDays) : 0;

  daysInMonthEl.textContent = `${daysInMonth}일`;
  remainingDaysEl.textContent = `${remainingDays}일`;
  remainingBudgetEl.textContent = formatCurrency(remainingBudget);
  dailyBudgetEl.textContent = formatCurrency(dailyBudget);
  heroRemainingBudgetEl.textContent = formatCurrency(remainingBudget);

  return {
    monthlyBudget,
    usedAmount,
    remainingBudget,
    dailyBudget
  };
}

function calculateProtein() {
  const proteinTarget = Number(proteinTargetInput.value || 0);
  const proteinConsumed = Number(proteinConsumedInput.value || 0);

  const proteinRemaining = Math.max(proteinTarget - proteinConsumed, 0);
  const proteinRate = proteinTarget > 0 ? Math.min((proteinConsumed / proteinTarget) * 100, 999) : 0;
  const progressWidth = Math.min(proteinRate, 100);

  proteinTargetViewEl.textContent = formatGram(proteinTarget);
  proteinConsumedViewEl.textContent = formatGram(proteinConsumed);
  proteinRemainingEl.textContent = formatGram(proteinRemaining);
  proteinRateEl.textContent = formatPercent(proteinRate);
  heroProteinRateEl.textContent = formatPercent(proteinRate);
  proteinProgressEl.style.width = `${progressWidth}%`;

  return {
    proteinTarget,
    proteinConsumed,
    proteinRemaining,
    proteinRate
  };
}

function calculateAll() {
  calculateBudget();
  calculateProtein();
}

function saveCurrentUserData() {
  if (!selectedUserId) return;

  setSelectedUserData({
    monthlyBudget: monthlyBudgetInput.value,
    usedAmount: usedAmountInput.value,
    proteinTarget: proteinTargetInput.value,
    proteinConsumed: proteinConsumedInput.value
  });

  calculateAll();
  alert("저장되었습니다.");
}

function resetCurrentUserData() {
  if (!selectedUserId) return;

  setSelectedUserData({
    monthlyBudget: "",
    usedAmount: "",
    proteinTarget: "",
    proteinConsumed: ""
  });

  updateInputsFromSelectedUser();
}

async function loadUsers() {
  try {
    const response = await fetch("./users.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("users.json 파일을 불러오지 못했습니다.");
    }

    users = await response.json();
    populateUsers();
    updateInputsFromSelectedUser();
  } catch (error) {
    console.error(error);
    users = [];
    populateUsers();
    selectedUserNameEl.textContent = "불러오기 실패";
  }
}

userSelect.addEventListener("change", () => {
  selectedUserId = userSelect.value;
  updateInputsFromSelectedUser();
});

[monthlyBudgetInput, usedAmountInput, proteinTargetInput, proteinConsumedInput].forEach((input) => {
  input.addEventListener("input", calculateAll);
});

saveBtn.addEventListener("click", saveCurrentUserData);
resetBtn.addEventListener("click", resetCurrentUserData);
refreshUsersBtn.addEventListener("click", loadUsers);

setTodayChip();
loadUsers();
