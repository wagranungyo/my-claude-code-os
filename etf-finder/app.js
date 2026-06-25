/**
 * 최적 ETF 탐색 로직
 * ---------------------------------------------------------------
 * 사용자는 두 가지를 중시한다: (1) 수익률(높을수록 좋음), (2) 비용=보수율(낮을수록 좋음).
 *
 * 점수 계산:
 *   1) 선택한 기간(1Y/3Y/5Y)의 수익률을 데이터셋 안에서 min-max 정규화 → 0~1 (높을수록 좋음)
 *   2) 보수율을 min-max 정규화한 뒤 1에서 빼서 반전 → 0~1 (낮을수록 좋음)
 *   3) 사용자가 정한 가중치(wReturn, wCost)로 가중 평균
 *   4) 0~100 점으로 환산해 내림차순 정렬, 1위가 "최적 ETF"
 *
 * 정규화를 쓰는 이유: 수익률(예: -8~31%)과 보수율(0.03~0.75%)은 단위·범위가
 * 완전히 다르므로, 같은 0~1 척도로 맞춰야 가중 합산이 공정하다.
 */

const state = {
  horizon: "ret1y", // ret1y | ret3y | ret5y
  wReturn: 50,
  wCost: 50,
  sortKey: "score",
  sortDir: "desc",
  category: "전체",
  comboSize: 4,
  diversify: true,
  scored: [],
};

const HORIZON_LABEL = { ret1y: "1년", ret3y: "3년(연환산)", ret5y: "5년(연환산)" };

// --- 정규화 헬퍼: 값 배열을 0~1로. 모든 값이 같으면 0.5로 처리 ---
function normalize(values) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min;
  return (v) => (span === 0 ? 0.5 : (v - min) / span);
}

/** 핵심: 현재 state 기준으로 모든 ETF에 점수를 매겨 반환 */
function scoreETFs() {
  const horizon = state.horizon;

  // 선택 기간 수익률이 있는 ETF만 채점 대상 (없으면 N/A로 따로 표시)
  const eligible = window.ETF_DATA.filter((e) => e[horizon] !== null && e[horizon] !== undefined);
  const naList = window.ETF_DATA.filter((e) => e[horizon] === null || e[horizon] === undefined);

  const retNorm = normalize(eligible.map((e) => e[horizon]));
  const expNorm = normalize(eligible.map((e) => e.expense));

  const wSum = state.wReturn + state.wCost || 1;
  const wR = state.wReturn / wSum;
  const wC = state.wCost / wSum;

  const scored = eligible.map((e) => {
    const rScore = retNorm(e[horizon]);        // 수익률 점수 (높을수록 1)
    const cScore = 1 - expNorm(e.expense);     // 비용 점수 (보수율 낮을수록 1)
    const score = (wR * rScore + wC * cScore) * 100;
    return { ...e, rScore, cScore, score };
  });

  // N/A 항목은 점수 null
  const naScored = naList.map((e) => ({ ...e, rScore: null, cScore: null, score: null }));

  return { scored, naScored };
}

// --- 렌더링 ---
const $ = (sel) => document.querySelector(sel);

function fmtPct(v) {
  return v === null || v === undefined ? "—" : `${v.toFixed(2)}%`;
}

function render() {
  const { scored, naScored } = scoreETFs();
  state.scored = scored;

  // 카테고리 필터
  const cat = state.category;
  let rows = cat === "전체" ? scored.slice() : scored.filter((e) => e.category === cat);

  // 정렬
  rows.sort((a, b) => {
    const k = state.sortKey;
    const av = a[k], bv = b[k];
    const cmp = (av === bv) ? 0 : (av > bv ? 1 : -1);
    return state.sortDir === "asc" ? cmp : -cmp;
  });

  renderBest(rows[0]);
  renderPortfolio(buildPortfolio(scored));
  renderTable(rows, naScored, cat);
  renderWeights();
}

/**
 * 최적 ETF 조합(포트폴리오) 구성
 * ---------------------------------------------------------------
 * 1) 점수가 높은 ETF부터 후보로 본다.
 * 2) "분류 분산"이 켜져 있으면 같은 분류는 가장 점수 높은 1개만 남겨,
 *    S&P500 복제펀드 여러 개로 채워지는 것을 막는다(분산 효과).
 * 3) 상위 N종목을 고르고, 각 종목의 점수에 비례해 비중을 배분(합 100%).
 * 4) 비중 가중으로 조합의 기대 수익률·평균 보수율·배당을 합성한다.
 */
function buildPortfolio(scored) {
  if (!scored.length) return null;

  let pool = scored.slice().sort((a, b) => b.score - a.score);

  if (state.diversify) {
    const seen = new Set();
    pool = pool.filter((e) => {
      if (seen.has(e.category)) return false;
      seen.add(e.category);
      return true;
    });
  }

  const picks = pool.slice(0, state.comboSize);
  if (!picks.length) return null;

  // 점수 비례 비중 (음수 방지를 위해 최소 0으로 클램프)
  const scoreSum = picks.reduce((s, e) => s + Math.max(e.score, 0), 0) || 1;
  const items = picks.map((e) => ({
    ...e,
    weight: (Math.max(e.score, 0) / scoreSum) * 100,
  }));

  // 합성 지표 (비중 가중 평균)
  const wsum = items.reduce((s, e) => s + e.weight, 0) || 1;
  const blendRet = items.reduce((s, e) => s + e.weight * e[state.horizon], 0) / wsum;
  const blendExp = items.reduce((s, e) => s + e.weight * e.expense, 0) / wsum;
  const blendYld = items.reduce((s, e) => s + e.weight * e.yield, 0) / wsum;
  const blendScore = items.reduce((s, e) => s + e.weight * e.score, 0) / wsum;

  return { items, blendRet, blendExp, blendYld, blendScore };
}

function renderPortfolio(pf) {
  const el = $("#portfolio");
  if (!pf) {
    el.innerHTML = `<p class="muted">조합을 만들 수 없습니다.</p>`;
    return;
  }

  const rows = pf.items.map((e) => `
    <div class="alloc-row">
      <div class="alloc-head">
        <span class="ticker">${e.ticker}</span>
        <span class="muted">${e.name}</span>
        <span class="alloc-pct">${e.weight.toFixed(1)}%</span>
      </div>
      <div class="alloc-bar"><span style="width:${e.weight}%"></span></div>
      <div class="alloc-meta muted small">
        ${e.category} · 수익률 ${fmtPct(e[state.horizon])} · 보수율 ${fmtPct(e.expense)} · 점수 ${e.score.toFixed(1)}
      </div>
    </div>`).join("");

  el.innerHTML = `
    <div class="pf-summary">
      <div><span class="muted small">기대 수익률</span><b>${fmtPct(pf.blendRet)}</b></div>
      <div><span class="muted small">평균 보수율</span><b>${fmtPct(pf.blendExp)}</b></div>
      <div><span class="muted small">평균 배당</span><b>${fmtPct(pf.blendYld)}</b></div>
      <div><span class="muted small">조합 점수</span><b>${pf.blendScore.toFixed(1)}</b></div>
    </div>
    ${rows}
    <p class="muted small">비중은 각 종목의 점수에 비례해 배분됩니다.</p>`;
}

function renderBest(best) {
  const el = $("#best");
  if (!best) {
    el.innerHTML = `<p class="muted">조건에 맞는 ETF가 없습니다.</p>`;
    return;
  }
  el.innerHTML = `
    <div class="best-badge">🏆 최적 ETF</div>
    <div class="best-ticker">${best.ticker}</div>
    <div class="best-name">${best.name} · <span class="muted">${best.category}</span></div>
    <div class="best-score">${best.score.toFixed(1)}<span class="muted"> / 100점</span></div>
    <div class="best-metrics">
      <span>${HORIZON_LABEL[state.horizon]} 수익률 <b>${fmtPct(best[state.horizon])}</b></span>
      <span>보수율 <b>${fmtPct(best.expense)}</b></span>
      <span>배당 <b>${fmtPct(best.yield)}</b></span>
    </div>
    <p class="best-why muted">
      수익률 점수 ${(best.rScore * 100).toFixed(0)} · 비용 점수 ${(best.cScore * 100).toFixed(0)}
      (가중치 수익률 ${state.wReturn}% / 비용 ${state.wCost}%)
    </p>`;
}

function sortArrow(key) {
  if (state.sortKey !== key) return "";
  return state.sortDir === "asc" ? " ▲" : " ▼";
}

function renderTable(rows, naScored, cat) {
  const head = `
    <tr>
      <th>순위</th>
      <th data-sort="ticker">티커${sortArrow("ticker")}</th>
      <th>이름</th>
      <th data-sort="category">분류${sortArrow("category")}</th>
      <th data-sort="${state.horizon}">${HORIZON_LABEL[state.horizon]} 수익률${sortArrow(state.horizon)}</th>
      <th data-sort="expense">보수율${sortArrow("expense")}</th>
      <th data-sort="yield">배당${sortArrow("yield")}</th>
      <th data-sort="score">점수${sortArrow("score")}</th>
    </tr>`;

  const body = rows.map((e, i) => `
    <tr class="${i === 0 && state.sortKey === 'score' && state.sortDir === 'desc' ? 'top' : ''}">
      <td class="rank">${i + 1}</td>
      <td class="ticker">${e.ticker}</td>
      <td class="name">${e.name}</td>
      <td>${e.category}</td>
      <td class="num">${fmtPct(e[state.horizon])}</td>
      <td class="num">${fmtPct(e.expense)}</td>
      <td class="num">${fmtPct(e.yield)}</td>
      <td class="num score-cell">
        <span class="score-bar" style="--w:${e.score}%"></span>
        <span class="score-val">${e.score.toFixed(1)}</span>
      </td>
    </tr>`).join("");

  // 선택 기간 수익률이 없는 ETF 안내
  const showNa = cat === "전체" && naScored.length > 0;
  const naBody = showNa ? naScored.map((e) => `
    <tr class="na">
      <td class="rank">–</td>
      <td class="ticker">${e.ticker}</td>
      <td class="name">${e.name}</td>
      <td>${e.category}</td>
      <td class="num muted">N/A</td>
      <td class="num">${fmtPct(e.expense)}</td>
      <td class="num">${fmtPct(e.yield)}</td>
      <td class="num muted">제외</td>
    </tr>`).join("") : "";

  $("#table").innerHTML = `<thead>${head}</thead><tbody>${body}${naBody}</tbody>`;

  // 헤더 클릭 정렬
  $("#table").querySelectorAll("th[data-sort]").forEach((th) => {
    th.addEventListener("click", () => {
      const key = th.getAttribute("data-sort");
      if (state.sortKey === key) {
        state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
      } else {
        state.sortKey = key;
        // 수익률/점수/배당은 큰 값이 위, 보수율은 작은 값이 위가 직관적
        state.sortDir = key === "expense" ? "asc" : "desc";
      }
      render();
    });
  });
}

function renderWeights() {
  $("#wReturnVal").textContent = `${state.wReturn}%`;
  $("#wCostVal").textContent = `${state.wCost}%`;
  $("#horizonLabel").textContent = HORIZON_LABEL[state.horizon];
}

// --- 컨트롤 바인딩 ---
function bindControls() {
  // 가중치 슬라이더 (합 100% 유지)
  const wr = $("#wReturn");
  wr.addEventListener("input", () => {
    state.wReturn = Number(wr.value);
    state.wCost = 100 - state.wReturn;
    render();
  });

  $("#horizon").addEventListener("change", (ev) => {
    state.horizon = ev.target.value;
    if (state.sortKey !== "score" && state.sortKey.startsWith("ret")) state.sortKey = state.horizon;
    render();
  });

  // 카테고리 필터 채우기
  const cats = ["전체", ...Array.from(new Set(window.ETF_DATA.map((e) => e.category)))];
  const sel = $("#category");
  sel.innerHTML = cats.map((c) => `<option value="${c}">${c}</option>`).join("");
  sel.addEventListener("change", (ev) => {
    state.category = ev.target.value;
    render();
  });

  // 포트폴리오 종목 수
  $("#comboSize").addEventListener("change", (ev) => {
    state.comboSize = Number(ev.target.value);
    render();
  });

  // 분류 분산 토글
  $("#diversify").addEventListener("change", (ev) => {
    state.diversify = ev.target.checked;
    render();
  });
}

// --- 시작 ---
document.addEventListener("DOMContentLoaded", () => {
  bindControls();
  render();
});
