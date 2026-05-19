/**
 * 하나카드 모바일「나만의 카드 찾기」MKCDPD6000M — 카드명 수집 (DOM + AJAX 캡처 + Copy response 파서)
 * https://m.hanacard.co.kr/MKCDPD6000M.web
 *
 * ═════ [042용 hana_card_products.input.json 흐름] ═════
 * 1) 페이지 새로고침(F5) → Console 에 이 파일 전체 붙여넣기·실행
 * 2) __hanaInstallMkcd6010AjaxCapture()  ← 반드시 «검색/첫 목록 AJAX 이전»에 설치
 * 3) 조건 선택 후 검색 → 더보기·스크롤로 목록이 실제로 로드될 때까지 수동 진행
 * 4) const n = __hanaGetMkcd6010CapturedNames()
 *    · 0건이면 아래 [0건 점검]. Network Copy response 는 5) 사용
 * 5) Network → MKCDPD6010M.ajax → Response 우클릭 «Copy response»
 *    → __hanaParseMkcd6010CopyResponse(`…붙여넣기…`) 수행 (여러 페이지면 반복)
 *    → __hanaAppendMkcd6010CopyResponse(`…`) 로 이름 누적 후 __hanaGetMkcd6010AllNames()
 * 6) console.log(__hanaToHanaProductsInputJSON(__hanaGetMkcd6010AllNames()))
 *    → saveroute/scripts/data/hana_card_products.input.json 으로 저장 → npm run seed:hana-products
 *
 * [__hanaGetMkcd6010CapturedNames() 가 0건 — 원인]
 * • 훅이 늦게 설치됨: 이미 끝난 AJAX 는 재캡처 불가 → 새로고침 후 스크립트부터 다시
 * • URL 매칭: 훅은 XMLHttpRequest·fetch 모두 후킹. jQuery.ajax 는 보통 XHR.
 *   상대경로로 open 된 경우 load 시 responseURL 로도 매칭함.
 * • 응답이 순수 JSON 이 아님: HTML, BOM, for(;;); 등 → parseJsonSafe 가 일부 복구 시도.
 *   실패 시 Copy response + __hanaParseMkcd6010CopyResponse
 * • CD_NM / cardList 경로 변경: findCardRowArrays 가 객체 전역에서 «CD_NM 이 있는 객체 배열» 탐색.
 *   그래도 0이면 diagnostics.topKeys 와 Network Preview 로 실제 키 확인.
 *
 * 정책: 루프로 대량 재요청 금지. 사용자가 UI 로 로드한 공개 응답·직접 복사한 본문만.
 */
(function () {
  "use strict";

  const DEFAULT_NOISE_EXACT = new Set([
    "",
    "더보기",
    "검색",
    "비교하기",
    "확인",
    "닫기",
    "레이어 닫기",
    "카드 비교함",
    "검색된 결과가 없습니다.",
    "총 개",
    "초기화",
    "상세 설정 열기",
    "상세 설정 닫기",
  ]);

  /** 이미지 alt는 일부 카드 레이아웃에서 카드명과 동일 */
  const SELECTOR_GROUPS = [
    ["span.card-name", "카드 블록 제목(span.card-name)"],
    ["a.card-info .card-name", "카드 정보 링크 내 제목"],
    [".card-name", "fallback .card-name"],
    [".info-cards-title.type-multi-ellipsis.align-center", "카드 비교 등 멀티라인 타이틀"],
    [".info-cards-title", ".info-cards-title (넓게)"],
    ['[class*="card-name"]', 'class 포함 "card-name"'],
    [".layer-card-detail .card-name", "레이어 상세(열린 경우)"],
  ];

  function normalize(text) {
    return String(text || "")
      .replace(/\u00a0/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function isNoise(raw, noiseExact) {
    const t = normalize(raw);
    if (!t || t.length < 2) return true;
    if (noiseExact.has(t)) return true;
    if (/^[0-9\s%]+$/.test(t)) return true;
    return false;
  }

  const MKCD_AJAX_MARK = "MKCDPD6010M.ajax";

  /** @type {{ installed: boolean, events: object[], origXhrOpen: Function, origXhrSend: Function, origFetch: Function | null } | null} */
  let mkcdCapture = null;

  function looksLikeMkcd6010Url(url) {
    return String(url || "").includes(MKCD_AJAX_MARK);
  }

  function rowToCdNm(row) {
    if (!row || typeof row !== "object") return "";
    const nm = row.CD_NM ?? row.cd_nm ?? row.Cd_Nm;
    return normalize(String(nm || ""));
  }

  /** 카드 목록 행 후보 배열 후보 탐색 (키 이름이 cardList 가 아니어도 CD_NM 열 있으면 수집) */
  function findCardRowArrays(node, depth) {
    /** @type {object[][]} */
    const out = [];
    function walk(n, d) {
      if (d > 14 || n == null) return;
      if (Array.isArray(n)) {
        const first = n[0];
        if (first && typeof first === "object") {
          const hasNm =
            Object.prototype.hasOwnProperty.call(first, "CD_NM") ||
            Object.prototype.hasOwnProperty.call(first, "cd_nm") ||
            Object.prototype.hasOwnProperty.call(first, "Cd_Nm");
          if (hasNm && n.length > 0) out.push(n);
        }
        return;
      }
      if (typeof n !== "object") return;
      for (const k of Object.keys(n)) walk(n[k], d + 1);
    }
    walk(node, depth);
    return out;
  }

  function parseJsonSafe(text) {
    if (text == null || typeof text !== "string") return null;
    let t = String(text)
      .replace(/^\uFEFF/, "")
      .trim();
    if (!t) return null;
    const tryParse = (s) => {
      try {
        return JSON.parse(s);
      } catch {
        return null;
      }
    };
    /** 그대로 */
    let p = tryParse(t);
    if (p) return p;

    /** XSSI / JSONP 스타일 앞머리(for(;;); … 등) 다음 첫 `{` 또는 `[` */
    const brace = t.indexOf("{");
    const bracket = t.indexOf("[");
    const start =
      brace === -1
        ? bracket
        : bracket === -1
          ? brace
          : Math.min(brace, bracket);
    if (start !== -1) {
      let braceDepth = 0;
      let inStr = false;
      let esc = false;
      const openCh = t[start];
      const closeCh = openCh === "{" ? "}" : "]";
      for (let i = start; i < t.length; i++) {
        const c = t[i];
        if (inStr) {
          if (esc) esc = false;
          else if (c === "\\") esc = true;
          else if (c === '"') inStr = false;
          continue;
        }
        if (c === '"') {
          inStr = true;
          continue;
        }
        if (c === openCh) braceDepth++;
        if (c === closeCh) {
          braceDepth--;
          if (braceDepth === 0) {
            p = tryParse(t.slice(start, i + 1));
            if (p) return p;
            break;
          }
        }
      }
    }

    /** HTML 속 JSON (최후) */
    const m = /\{[\s\S]*"cardList"\s*:\s*\[[\s\S]*\]\s*[\s\S]*\}/.exec(t);
    if (m) {
      p = tryParse(m[0]);
      if (p) return p;
    }
    return null;
  }

  /** parsed JSON 에서 카드 행 객체 배열을 모두 찾아 CD_NM 기준 고유 이름 */
  function uniqueNamesFromParsed(parsed, noiseExact) {
    const ne = noiseExact || DEFAULT_NOISE_EXACT;
    const lists = findCardRowArrays(parsed, 0);
    /** @type {Map<string,string>} */
    const byKey = new Map();
    for (const arr of lists) {
      for (const row of arr) {
        const nm = rowToCdNm(row);
        if (!nm || isNoise(nm, ne)) continue;
        if (!byKey.has(nm)) byKey.set(nm, nm);
      }
    }
    const names = [...byKey.keys()].sort((a, b) => a.localeCompare(b, "ko"));
    return { names, lists };
  }

  function ingestMkcd6010ResponseBody(responseText, urlHint) {
    if (!mkcdCapture) return;
    const parsed = parseJsonSafe(responseText);
    if (!parsed) {
      const u = urlHint ? String(urlHint) : "";
      if (looksLikeMkcd6010Url(u)) {
        console.warn(
          "[hana] MKCDPD6010M 응답 본문을 JSON 으로 파싱하지 못했습니다(HTML 등). Copy response 후 __hanaParseMkcd6010CopyResponse 사용.",
          u.slice(-100),
        );
      }
      return;
    }

    const { names, lists } = uniqueNamesFromParsed(parsed, DEFAULT_NOISE_EXACT);

    const topKeys =
      typeof parsed === "object" && parsed != null && !Array.isArray(parsed)
        ? Object.keys(parsed).slice(0, 18)
        : [];

    mkcdCapture.events.push({
      at: new Date().toISOString(),
      urlHint: urlHint ? String(urlHint).slice(-120) : "",
      listChunks: lists.length,
      rowsInChunks: lists.reduce((s, a) => s + a.length, 0),
      uniqueNamesThisResponse: names.length,
      topKeys,
      foundArrays: lists.length > 0,
    });

    if (lists.length === 0) {
      console.warn(
        "[hana] MKCDPD6010 응답 JSON 은 파싱됐으나 CD_NM 속성을 가진 행 배열을 찾지 못했습니다.",
        "topKeys:",
        topKeys,
      );
      return;
    }

    if (!window.__hanaMkcd6010CardRows) window.__hanaMkcd6010CardRows = [];
    for (const arr of lists) {
      for (const row of arr) {
        const cardName = rowToCdNm(row);
        if (cardName && !isNoise(cardName, DEFAULT_NOISE_EXACT)) {
          window.__hanaMkcd6010CardRows.push(row);
        }
      }
    }
  }

  window.__hanaInstallMkcd6010AjaxCapture = function installMkcd6010AjaxCapture() {
    if (mkcdCapture && mkcdCapture.installed) {
      console.info("[hana] 이미 설치됨 → __hanaUninstallMkcd6010AjaxCapture() 후 재설치");
      return false;
    }
    mkcdCapture = {
      installed: true,
      events: [],
      origXhrOpen: XMLHttpRequest.prototype.open,
      origXhrSend: XMLHttpRequest.prototype.send,
      origFetch: typeof window.fetch === "function" ? window.fetch.bind(window) : null,
    };

    XMLHttpRequest.prototype.open = function patchedOpen(method, url, ...rest) {
      /** @type {any} */
      const self = this;
      self.__hanaMkcdUrl = url;
      return mkcdCapture.origXhrOpen.call(this, method, url, ...rest);
    };
    XMLHttpRequest.prototype.send = function patchedSend(...args) {
      /** @type {any} */
      const self = this;
      self.addEventListener("load", function () {
        const resolved =
          typeof self.responseURL === "string" && self.responseURL.length > 0
            ? self.responseURL
            : self.__hanaMkcdUrl || "";
        if (looksLikeMkcd6010Url(resolved) || looksLikeMkcd6010Url(self.__hanaMkcdUrl)) {
          ingestMkcd6010ResponseBody(self.responseText, resolved || self.__hanaMkcdUrl);
        }
      });
      return mkcdCapture.origXhrSend.apply(this, args);
    };

    if (mkcdCapture.origFetch) {
      window.fetch = function patchedFetch(input, init) {
        const reqUrl =
          typeof input === "string" ? input : input != null && typeof input.url === "string" ? input.url : "";
        return mkcdCapture.origFetch(input, init).then((res) => {
          const resolvedUrl = (res.url && res.url.length > 0 ? res.url : reqUrl) || "";
          if (!looksLikeMkcd6010Url(resolvedUrl)) return res;
          const clone = res.clone();
          clone
            .text()
            .then((t) => ingestMkcd6010ResponseBody(t, resolvedUrl))
            .catch(() => {});
          return res;
        });
      };
    }

    window.__hanaMkcd6010CardRows = [];
    console.info(
      `[hana] ${MKCD_AJAX_MARK} 응답 캡처 설치. 검색·더보기 진행 후 __hanaGetMkcd6010CapturedNames()`,
    );
    return true;
  };

  window.__hanaUninstallMkcd6010AjaxCapture = function uninstallMkcd6010AjaxCapture() {
    if (!mkcdCapture || !mkcdCapture.installed) {
      console.warn("[hana] 캡처 미설치");
      return false;
    }
    XMLHttpRequest.prototype.open = mkcdCapture.origXhrOpen;
    XMLHttpRequest.prototype.send = mkcdCapture.origXhrSend;
    if (mkcdCapture.origFetch) window.fetch = mkcdCapture.origFetch;
    mkcdCapture.installed = false;
    console.info("[hana] AJAX 캡처 제거됨");
    return true;
  };

  window.__hanaClearMkcd6010CaptureBuffer = function clearMkcd6010CaptureBuffer() {
    window.__hanaMkcd6010CardRows = [];
    if (mkcdCapture) mkcdCapture.events = [];
    console.info("[hana] 캡처 버퍼 비움");
  };

  window.__hanaGetMkcd6010CapturedNames = function getMkcd6010CapturedNames() {
    const rows = Array.isArray(window.__hanaMkcd6010CardRows) ? window.__hanaMkcd6010CardRows : [];
    /** @type {Map<string,string>} */
    const byKey = new Map();
    for (const row of rows) {
      const nm = rowToCdNm(row);
      if (!nm || isNoise(nm, DEFAULT_NOISE_EXACT)) continue;
      if (!byKey.has(nm)) byKey.set(nm, nm);
    }
    const names = [...byKey.keys()].sort((a, b) => a.localeCompare(b, "ko"));
    const ev = mkcdCapture ? mkcdCapture.events.length : 0;
    console.info(`[hana] 캡처 응답 ${ev}회 · 행 ${rows.length} · 고유 카드명 ${names.length}`);
    return names;
  };

  window.__hanaToHanaProductsInputJSON = function toHanaProductsInputJSON(names) {
    const doc = {
      providerCode: "hana_card",
      benefitCategoryCode: "card",
      defaultProductTypeWhenKindUnknown: "credit_card",
      items: (names || []).map((name) => ({ name, kind: "unknown" })),
    };
    return JSON.stringify(doc, null, 2);
  };

  /**
   * Network → 우클릭 Copy response 로 복사한 문자열에서 카드명만 추출.
   * @returns {{ ok: boolean, names: string[], diagnostics: object }}
   */
  window.__hanaParseMkcd6010CopyResponse = function parseMkcd6010CopyResponse(rawText) {
    const text = rawText == null ? "" : String(rawText);
    const parsed = parseJsonSafe(text);
    const diagnostics = {
      parseOk: !!parsed,
      inputLength: text.length,
      topKeys:
        parsed && typeof parsed === "object" && !Array.isArray(parsed)
          ? Object.keys(parsed).slice(0, 26)
          : [],
      arraysWithCdNmRows: 0,
      cdNmHits: 0,
      uniqueNamesCount: 0,
      hint: "",
    };

    if (!parsed) {
      diagnostics.hint =
        "JSON 파싱 실패. «Copy response» 전문인지, HTML·경고 문자열 포함 여부 확인.";
      console.warn("[hana] __hanaParseMkcd6010CopyResponse:", diagnostics.hint);
      return { ok: false, names: [], diagnostics };
    }

    const { names, lists } = uniqueNamesFromParsed(parsed, DEFAULT_NOISE_EXACT);
    diagnostics.arraysWithCdNmRows = lists.length;
    diagnostics.cdNmHits = lists.reduce((sum, arr) => sum + arr.length, 0);
    diagnostics.uniqueNamesCount = names.length;

    if (names.length === 0) {
      diagnostics.hint =
        "파싱은 됐으나 CD_NM 행 배열 미탐지(Response 구조·필드 명 변경 가능).";
      console.warn("[hana] topKeys", diagnostics.topKeys);
    }

    console.info("[hana] Copy response → 고유 카드명", names.length, "건");
    return { ok: names.length > 0, names, diagnostics };
  };

  /** 여러 페이지 Copy 결과를 이름 집합으로 누적 */
  window.__hanaAppendMkcd6010CopyResponse = function appendMkcd6010CopyResponse(rawText) {
    const r = window.__hanaParseMkcd6010CopyResponse(rawText);
    if (!window.__hanaMkcd6010PasteNameSet) window.__hanaMkcd6010PasteNameSet = new Set();
    if (r.ok) {
      r.names.forEach((n) => window.__hanaMkcd6010PasteNameSet.add(n));
    }
    const pasted = window.__hanaMkcd6010PasteNameSet.size;
    console.info("[hana] Copy-response 누적 고유(붙여넣기 원본만)", pasted, "건");
    return Object.assign({}, r, { pasteAccumulatedUnique: pasted });
  };

  window.__hanaClearMkcd6010PasteNames = function clearMkcd6010PasteNames() {
    window.__hanaMkcd6010PasteNameSet = new Set();
    console.info("[hana] Copy-response 누적 이름 초기화");
  };

  /** XHR 로 쌓인 행 + Copy 누적 한데 모아 고유 이름 */
  window.__hanaGetMkcd6010AllNames = function getMkcd6010AllNames() {
    const xhrRows = Array.isArray(window.__hanaMkcd6010CardRows) ? window.__hanaMkcd6010CardRows : [];
    /** @type {Map<string,string>} */
    const byKey = new Map();
    for (const row of xhrRows) {
      const nm = rowToCdNm(row);
      if (!nm || isNoise(nm, DEFAULT_NOISE_EXACT)) continue;
      if (!byKey.has(nm)) byKey.set(nm, nm);
    }
    const paste =
      window.__hanaMkcd6010PasteNameSet instanceof Set ? window.__hanaMkcd6010PasteNameSet : new Set();
    paste.forEach((n) => {
      const nm = normalize(String(n));
      if (!nm || isNoise(nm, DEFAULT_NOISE_EXACT)) return;
      if (!byKey.has(nm)) byKey.set(nm, nm);
    });
    const names = [...byKey.keys()].sort((a, b) => a.localeCompare(b, "ko"));
    console.info("[hana] AJAX + Copy 누적 합산 고유 카드명", names.length, "건");
    return names;
  };

  /** 캡처 0건일 때 상태 점검용 */
  window.__hanaGetMkcd6010CaptureDebug = function getMkcd6010CaptureDebug() {
    return {
      ajaxHookInstalled: !!(mkcdCapture && mkcdCapture.installed),
      events: mkcdCapture && mkcdCapture.events ? mkcdCapture.events.slice() : [],
      rowBufferRows: Array.isArray(window.__hanaMkcd6010CardRows)
        ? window.__hanaMkcd6010CardRows.length
        : 0,
      pasteAccumulatedUnique:
        window.__hanaMkcd6010PasteNameSet instanceof Set ? window.__hanaMkcd6010PasteNameSet.size : 0,
    };
  };

  function collectFromDom(noiseExact) {
    /** @type {Map<string,{name:string,sources:string[]}>} */
    const byKey = new Map();

    function addCandidate(raw, source) {
      const name = normalize(raw);
      if (isNoise(name, noiseExact)) return;
      const key = name;
      const cur = byKey.get(key);
      if (!cur) {
        byKey.set(key, { name, sources: [source] });
      } else if (!cur.sources.includes(source)) {
        cur.sources.push(source);
      }
    }

    for (const [sel, label] of SELECTOR_GROUPS) {
      let nodes;
      try {
        nodes = document.querySelectorAll(sel);
      } catch {
        continue;
      }
      nodes.forEach((el) => {
        const txt = normalize(el.innerText || el.textContent || "");
        if (txt.includes("\n")) {
          txt.split("\n").forEach((ln) => addCandidate(ln, `${label}<${sel}>`));
        } else {
          addCandidate(txt, `${label}<${sel}>`);
        }
      });
    }

    /** 카드 썸네일 alt 속성에 CD_NM이 들어간 경우 */
    document.querySelectorAll("img[alt]").forEach((img) => {
      const scope = img.closest(".card-unit, .card-list, li") ? "list-img-alt" : "img-alt";
      addCandidate(img.getAttribute("alt") || "", scope);
    });

    /** goDetailPage 같은 앵커 근처 텍스트 보조 — 마지막 수단 */
    document.querySelectorAll('a.card-info[role="button"]').forEach((a, i) => {
      addCandidate(normalize(a.innerText || ""), `a.card-info[role="button"]:eq(${i})`);
    });

    return Array.from(byKey.values()).sort((a, b) => a.name.localeCompare(b.name, "ko"));
  }

  function namesOnly(rows) {
    return rows.map((r) => r.name);
  }

  function toJSON(rows, pretty = true) {
    return JSON.stringify(rows, null, pretty ? 2 : undefined);
  }

  function toCSV(names) {
    const escapeCell = (s) => `"${String(s).replace(/"/g, '""')}"`;
    return ["name", ...names.map(escapeCell)].join("\n");
  }

  /** benefit_products INSERT용 템플릿 (code는 수동으로 유일하게 맞춰야 함) */
  function toSqlSeedTemplate(names, providerCode) {
    const lines = names.map(
      (n, i) =>
        `  -- ('${n.replace(/'/g, "''")}', 'REPLACE_UNIQUE_CODE_${String(i + 1).padStart(3, "0")}', 'credit_card', 'credit'),`,
    );
    return [
      `-- benefit_products 시드 줄 템플릿 (실제 마이그레이션에서는 benefit_category_id · provider 조회 포함)`,
      `-- providers.code = '${providerCode.replace(/'/g, "''")}'`,
      `-- 수동 검증 필요: 이름·카드종류(debit_credit)·UNIQUE(code) 중복 여부`,
      ...lines,
    ].join("\n");
  }

  window.__hanaExtractHanaCardNames = function extract(options) {
    const opts = options || {};
    const extraNoise =
      opts.extraNoise instanceof Set
        ? opts.extraNoise
        : new Set(Array.isArray(opts.extraNoise) ? opts.extraNoise : []);

    const noiseExact = new Set([...DEFAULT_NOISE_EXACT, ...extraNoise]);
    const rows = collectFromDom(noiseExact);
    const names = namesOnly(rows);

    const bundle = {
      url: window.location.href,
      collectedAt: new Date().toISOString(),
      count: names.length,
      names,
      rowsWithSources: rows,
      jsonPretty: toJSON(rows, true),
      jsonNamesOnly: toJSON(names, true),
      csv: toCSV(names),
      sqlTemplate: toSqlSeedTemplate(names, String(opts.providerCode || "hana_card")),
    };

    if (names.length === 0) {
      console.warn(
        "[hana] 카드명이 0건입니다. 페이지에서 검색 결과가 표시된 뒤 다시 실행하세요.\n선택자: span.card-name, .info-cards-title 등.",
      );
    } else {
      console.info(`[hana] 카드명 ${names.length}건 수집 (중복 제거 후)`);
    }

    console.log("—— JSON (이름만) ——\n", bundle.jsonNamesOnly);
    console.log("—— CSV ——\n", bundle.csv);
    console.log("—— SQL 템플릿(주석) ——\n", bundle.sqlTemplate);

    /** 클립보드 복사 (HTTPS·권한 허용 환경) */
    if (navigator.clipboard && opts.copy === "json") {
      navigator.clipboard.writeText(bundle.jsonNamesOnly).then(
        () => console.info("[hana] JSON이 클립보드에 복사되었습니다."),
        () => console.warn("[hana] 클립보드 복사 실패"),
      );
    }

    window.__hanaLastCardExtract = bundle;
    return bundle;
  };

  console.info(
    [
      "[hana] 흐름: install → 검색·더보기 → __hanaGetMkcd6010CapturedNames() 또는 __hanaParseMkcd6010CopyResponse(붙여넣기)",
      "[hana] 합본: __hanaGetMkcd6010AllNames() → __hanaToHanaProductsInputJSON( … )",
      "[hana] 점검: __hanaGetMkcd6010CaptureDebug()",
    ].join("\n"),
  );
})();
