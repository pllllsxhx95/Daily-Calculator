const STORAGE_KEY = "budget_protein_user_data_v2";

const userSelect = document.getElementById("userSelect");
const refreshUsersBtn = document.getElementById("refreshUsersBtn");

const monthlyBudgetInput = document.getElementById("monthlyBudget");
const paydayInput = document.getElementById("payday");
const proteinTargetInput = document.getElementById("proteinTarget");

const budgetLogAmountInput = document.getElementById("budgetLogAmount");
const budgetLogDateInput = document.getElementById("budgetLogDate");

const proteinLogAmountInput = document.getElementById("proteinLogAmount");
const proteinLogDateInput = document.getElementById("proteinLogDate");

const selectedUserNameEl = document.getElementById("selectedUserName");
const heroRemainingBudgetEl = document.getElementById("heroRemainingBudget");
const heroProteinRateEl = document.getElementById("heroProteinRate");

const budgetPeriodEl = document.getElementById("budgetPeriod");
const remainingDaysEl = document.getElementById("remainingDays");
const budgetUsedTotalEl = document.getElementById("budgetUsedTotal");
const dailyBudgetEl = document.getElementById("dailyBudget");

const monthlyBudgetViewEl = document.getElementById("monthlyBudgetView");
const remainingBudgetEl = document.getElementById("remainingBudget");
const budgetLogCountEl = document.getElementById("budgetLogCount");

const proteinTargetViewEl = document.getElementById("proteinTargetView");
const proteinConsumedViewEl = document.getElementById("proteinConsumedView");
const proteinRemainingEl = document.getElementById("proteinRemaining");
const proteinRateEl = document.getElementById("proteinRate");
const proteinProgressEl = document.getElementById("proteinProgress");

const todayChipEl = document.getElementById("todayChip");

const saveBudgetSettingsBtn = document.getElementById("saveBudgetSettingsBtn");
const addBudgetLogBtn = document.getElementById("addBudgetLogBtn");
const clearBudgetCycleBtn = document.getElementById("clearBudgetCycleBtn");

const saveProteinSettingsBtn = document.getElementById("saveProteinSettingsBtn");
const addProteinLogBtn = document.getElementById("addProteinLogBtn");
const clearProteinTodayBtn = document.getElementById("clearProteinTodayBtn");

const budgetSettingsForm = document.getElementById("budgetSettingsForm");
const budgetEditWrap = document.getElementById("budgetEditWrap");
const editBudgetSettingsBtn = document.getElementById("editBudgetSettingsBtn");
const budgetSetupSummaryEl = document.getElementById("budgetSetupSummary");
const paydaySummaryEl = document.getElementById("paydaySummary");

const proteinSettingsForm = document.getElementById("proteinSettingsForm");
const proteinEditWrap = document.getElementById("proteinEditWrap");
const editProteinSettingsBtn = document.getElementById("editProteinSettingsBtn");
const proteinTargetSummaryEl = document.getElementById("proteinTargetSummary");

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

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseLocalDate(dateString) {
  const [y, m, d] = dateString.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDateKorean(date) {
  return date
    .toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    })
    .replace(/\.\s/g, ".")
    .replace(/\.$/, "");
}

function clampPayday(year, monthZeroBased, payday) {
  const lastDay = new Date(year, monthZeroBased + 1, 0).getDate();
  return Math.min(payday, lastDay);
}

function getCycleRange(payday, baseDate = new Date()) {
  const safePayday = Math.max(1, Math.min(31, Number(payday || 1)));

  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const date = baseDate.getDate();

  const currentMonthPayday = clampPayday(year, month, safePayday);

  let start;
  let end;

  if (date >= currentMonthPayday) {
    start = new Date(year, month, currentMonthPayday);

    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    const nextMonthPayday = clampPayday(nextYear, nextMonth, safePayday);
    end = new Date(nextYear, nextMonth, nextMonthPayday - 1);
  } else {
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const prevMonthPayday = clampPayday(prevYear, prevMonth, safePayday);
    start = new Date(prevYear, prevMonth, prevMonthPayday);
    end = new Date(year, month, currentMonthPayday - 1);
  }

  return { start, end };
}

function daysBetweenInclusive(start, end) {
  const startCopy = new Date(start);
  const endCopy = new Date(end);
  startCopy.setHours(0, 0, 0, 0);
  endCopy.setHours(0, 0, 0, 0);
  const ms = endCopy - startCopy;
  return Math.floor(ms / (1000 * 60 * 60 * 24)) + 1;
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

function getEmptyUserData() {
  return {
    monthlyBudget: "",
    payday: "",
    proteinTarget: "",
    budgetLogs: [],
    proteinLogs: []
  };
}

function getSelectedUserData() {
  const store = loadStore();
  return store[selectedUserId] || getEmptyUserData();
}

function setSelectedUserData(data) {
  const store = loadStore();
  store[selectedUserId] = data;
  saveStore(store);
}

function setTodayChip() {
  const now = new Date();
  if (!todayChipEl) return;

  todayChipEl.textContent = now.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short"
  });
}

function setDefaultDates() {
  const t = todayStr();
  if (budgetLogDateInput) budgetLogDateInput.value = t;
  if (proteinLogDateInput) proteinLogDateInput.value = t;
}

function updateSettingsVisibility() {
  const data = getSelectedUserData();

  const hasBudgetSettings =
    Number(data.monthlyBudget || 0) > 0 && Number(data.payday || 0) > 0;
  const hasProteinSettings = Number(data.proteinTarget || 0) > 0;

  if (budgetSetupSummaryEl) {
    budgetSetupSummaryEl.textContent = hasBudgetSettings
      ? formatCurrency(data.monthlyBudget)
      : "-";
  }

  if (paydaySummaryEl) {
    paydaySummaryEl.textContent = hasBudgetSettings ? `${data.payday}일` : "-";
  }

  if (proteinTargetSummaryEl) {
    proteinTargetSummaryEl.textContent = hasProteinSettings
      ? formatGram(data.proteinTarget)
      : "-";
  }

  // 중요:
  // 접기/펼치기는 HTML <details>가 담당하도록 하고
  // JS에서는 form / editWrap display를 건드리지 않음
}

function openBudgetSettingsForm() {
  if (budgetSettingsForm) budgetSettingsForm.style.display = "block";
  if (budgetEditWrap) budgetEditWrap.style.display = "none";
}

function openProteinSettingsForm() {
  if (proteinSettingsForm) proteinSettingsForm.style.display = "block";
  if (proteinEditWrap) proteinEditWrap.style.display = "none";
}

function populateUsers() {
  if (!userSelect) return;

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

  if (selectedUserNameEl) {
    selectedUserNameEl.textContent = currentUser ? currentUser.name : "-";
  }

  if (monthlyBudgetInput) monthlyBudgetInput.value = saved.monthlyBudget ?? "";
  if (paydayInput) paydayInput.value = saved.payday ?? "";
  if (proteinTargetInput) proteinTargetInput.value = saved.proteinTarget ?? "";

  updateSettingsVisibility();
  calculateAll();
}

function calculateBudget() {
  const data = getSelectedUserData();
  const monthlyBudget = Number(data.monthlyBudget || 0);
  const payday = Number(data.payday || 1);

  if (monthlyBudgetViewEl) {
    monthlyBudgetViewEl.textContent = formatCurrency(monthlyBudget);
  }

  if (!monthlyBudget || !payday) {
    if (budgetPeriodEl) budgetPeriodEl.textContent = "-";
    if (remainingDaysEl) remainingDaysEl.textContent = "-";
    if (budgetUsedTotalEl) budgetUsedTotalEl.textContent = "-";
    if (dailyBudgetEl) dailyBudgetEl.textContent = "-";
    if (remainingBudgetEl) remainingBudgetEl.textContent = "-";
    if (heroRemainingBudgetEl) heroRemainingBudgetEl.textContent = "-";
    if (budgetLogCountEl) budgetLogCountEl.textContent = "0건";
    return;
  }

  const cycle = getCycleRange(payday, new Date());
  const cycleStartStr = `${cycle.start.getFullYear()}-${String(
    cycle.start.getMonth() + 1
  ).padStart(2, "0")}-${String(cycle.start.getDate()).padStart(2, "0")}`;
  const cycleEndStr = `${cycle.end.getFullYear()}-${String(
    cycle.end.getMonth() + 1
  ).padStart(2, "0")}-${String(cycle.end.getDate()).padStart(2, "0")}`;

  const cycleLogs = (data.budgetLogs || []).filter(
    (log) => log.date >= cycleStartStr && log.date <= cycleEndStr
  );

  const usedTotal = cycleLogs.reduce(
    (sum, log) => sum + Number(log.amount || 0),
    0
  );

  const remainingBudget = Math.max(monthlyBudget - usedTotal, 0);

  const today = parseLocalDate(todayStr());
  const remainingDays = Math.max(daysBetweenInclusive(today, new Date(cycle.end)), 1);
  const dailyBudget = Math.floor(remainingBudget / remainingDays);

  if (budgetPeriodEl) {
    budgetPeriodEl.textContent = `${formatDateKorean(cycle.start)} ~ ${formatDateKorean(
      cycle.end
    )}`;
  }
  if (remainingDaysEl) remainingDaysEl.textContent = `${remainingDays}일`;
  if (budgetUsedTotalEl) budgetUsedTotalEl.textContent = formatCurrency(usedTotal);
  if (remainingBudgetEl) remainingBudgetEl.textContent = formatCurrency(remainingBudget);
  if (dailyBudgetEl) dailyBudgetEl.textContent = formatCurrency(dailyBudget);
  if (heroRemainingBudgetEl) heroRemainingBudgetEl.textContent = formatCurrency(remainingBudget);
  if (budgetLogCountEl) budgetLogCountEl.textContent = `${cycleLogs.length}건`;
}

function calculateProtein() {
  const data = getSelectedUserData();
  const proteinTarget = Number(data.proteinTarget || 0);
  const selectedDate = proteinLogDateInput?.value || todayStr();

  const todayProteinLogs = (data.proteinLogs || []).filter(
    (log) => log.date === selectedDate
  );

  const proteinConsumed = todayProteinLogs.reduce(
    (sum, log) => sum + Number(log.amount || 0),
    0
  );

  const proteinRemaining = Math.max(proteinTarget - proteinConsumed, 0);
  const proteinRate = proteinTarget > 0
    ? Math.min((proteinConsumed / proteinTarget) * 100, 999)
    : 0;
  const progressWidth = Math.min(proteinRate, 100);

  if (proteinTargetViewEl) proteinTargetViewEl.textContent = formatGram(proteinTarget);
  if (proteinConsumedViewEl) proteinConsumedViewEl.textContent = formatGram(proteinConsumed);
  if (proteinRemainingEl) proteinRemainingEl.textContent = formatGram(proteinRemaining);
  if (proteinRateEl) proteinRateEl.textContent = formatPercent(proteinRate);
  if (heroProteinRateEl) heroProteinRateEl.textContent = formatPercent(proteinRate);
  if (proteinProgressEl) proteinProgressEl.style.width = `${progressWidth}%`;
}

function calculateAll() {
  calculateBudget();
  calculateProtein();
}

function saveBudgetSettings() {
  if (!selectedUserId) return;

  const current = getSelectedUserData();
  const monthlyBudget = monthlyBudgetInput?.value;
  const payday = paydayInput?.value;

  if (!monthlyBudget || Number(monthlyBudget) <= 0) {
    alert("월 예산을 입력해주세요.");
    return;
  }

  if (!payday || Number(payday) < 1 || Number(payday) > 31) {
    alert("기준일은 1~31 사이로 입력해주세요.");
    return;
  }

  setSelectedUserData({
    ...current,
    monthlyBudget,
    payday
  });

  updateSettingsVisibility();
  calculateAll();
  alert("예산 설정이 저장되었습니다.");
}

function addBudgetLog() {
  if (!selectedUserId) return;

  const amount = Number(budgetLogAmountInput?.value || 0);
  const date = budgetLogDateInput?.value || todayStr();

  if (amount <= 0) {
    alert("사용 금액을 입력해주세요.");
    return;
  }

  const current = getSelectedUserData();
  const budgetLogs = current.budgetLogs || [];

  budgetLogs.push({ date, amount });

  setSelectedUserData({
    ...current,
    budgetLogs
  });

  if (budgetLogAmountInput) budgetLogAmountInput.value = "";
  calculateAll();
  alert("지출이 추가되었습니다.");
}

function clearBudgetCycle() {
  if (!selectedUserId) return;

  const current = getSelectedUserData();
  const payday = Number(current.payday || 1);

  if (!payday) {
    alert("먼저 기준일을 설정해주세요.");
    return;
  }

  const cycle = getCycleRange(payday, new Date());
  const cycleStartStr = `${cycle.start.getFullYear()}-${String(
    cycle.start.getMonth() + 1
  ).padStart(2, "0")}-${String(cycle.start.getDate()).padStart(2, "0")}`;
  const cycleEndStr = `${cycle.end.getFullYear()}-${String(
    cycle.end.getMonth() + 1
  ).padStart(2, "0")}-${String(cycle.end.getDate()).padStart(2, "0")}`;

  const remainLogs = (current.budgetLogs || []).filter(
    (log) => !(log.date >= cycleStartStr && log.date <= cycleEndStr)
  );

  setSelectedUserData({
    ...current,
    budgetLogs: remainLogs
  });

  calculateAll();
  alert("이번 예산 주기 지출 기록이 초기화되었습니다.");
}

function saveProteinSettings() {
  if (!selectedUserId) return;

  const current = getSelectedUserData();
  const proteinTarget = proteinTargetInput?.value;

  if (!proteinTarget || Number(proteinTarget) <= 0) {
    alert("단백질 목표량을 입력해주세요.");
    return;
  }

  setSelectedUserData({
    ...current,
    proteinTarget
  });

  updateSettingsVisibility();
  calculateAll();
  alert("단백질 목표가 저장되었습니다.");
}

function addProteinLog() {
  if (!selectedUserId) return;

  const amount = Number(proteinLogAmountInput?.value || 0);
  const date = proteinLogDateInput?.value || todayStr();

  if (amount <= 0) {
    alert("섭취량을 입력해주세요.");
    return;
  }

  const current = getSelectedUserData();
  const proteinLogs = current.proteinLogs || [];

  proteinLogs.push({ date, amount });

  setSelectedUserData({
    ...current,
    proteinLogs
  });

  if (proteinLogAmountInput) proteinLogAmountInput.value = "";
  calculateAll();
  alert("단백질 섭취량이 추가되었습니다.");
}

function clearProteinForSelectedDate() {
  if (!selectedUserId) return;

  const selectedDate = proteinLogDateInput?.value || todayStr();
  const current = getSelectedUserData();

  setSelectedUserData({
    ...current,
    proteinLogs: (current.proteinLogs || []).filter((log) => log.date !== selectedDate)
  });

  calculateAll();
  alert("선택 날짜 단백질 기록이 초기화되었습니다.");
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
    if (selectedUserNameEl) {
      selectedUserNameEl.textContent = "불러오기 실패";
    }
  }
}

if (userSelect) {
  userSelect.addEventListener("change", () => {
    selectedUserId = userSelect.value;
    updateInputsFromSelectedUser();
  });
}

if (refreshUsersBtn) refreshUsersBtn.addEventListener("click", loadUsers);

if (saveBudgetSettingsBtn) {
  saveBudgetSettingsBtn.addEventListener("click", saveBudgetSettings);
}
if (addBudgetLogBtn) {
  addBudgetLogBtn.addEventListener("click", addBudgetLog);
}
if (clearBudgetCycleBtn) {
  clearBudgetCycleBtn.addEventListener("click", clearBudgetCycle);
}

if (saveProteinSettingsBtn) {
  saveProteinSettingsBtn.addEventListener("click", saveProteinSettings);
}
if (addProteinLogBtn) {
  addProteinLogBtn.addEventListener("click", addProteinLog);
}
if (clearProteinTodayBtn) {
  clearProteinTodayBtn.addEventListener("click", clearProteinForSelectedDate);
}

if (editBudgetSettingsBtn) {
  editBudgetSettingsBtn.addEventListener("click", openBudgetSettingsForm);
}

if (editProteinSettingsBtn) {
  editProteinSettingsBtn.addEventListener("click", openProteinSettingsForm);
}

if (proteinLogDateInput) {
  proteinLogDateInput.addEventListener("change", calculateProtein);
}

setTodayChip();
setDefaultDates();
loadUsers();
