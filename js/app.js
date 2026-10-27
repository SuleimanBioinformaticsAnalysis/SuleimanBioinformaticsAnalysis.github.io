/**
 * SuleimanBioinformaticsAnalysis - Client Application
 * Dynamic Data Visualizer & Scientific Exploration
 */

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initTabs();
  initModal();
  loadDEGs();
  loadSingleCellMarkers();
  loadClinVarVariants();
});

/* ==========================================================================
   1. Theme Management (Dark / Light)
   ========================================================================== */
function initTheme() {
  const themeToggle = document.getElementById("theme-toggle");
  const storedTheme = localStorage.getItem("sba_theme") || "dark";
  document.documentElement.setAttribute("data-theme", storedTheme);
  updateThemeIcon(storedTheme);

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const currentTheme = document.documentElement.getAttribute("data-theme");
      const nextTheme = currentTheme === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", nextTheme);
      localStorage.setItem("sba_theme", nextTheme);
      updateThemeIcon(nextTheme);
    });
  }
}

function updateThemeIcon(theme) {
  const themeIcon = document.getElementById("theme-icon");
  if (themeIcon) {
    themeIcon.textContent = theme === "dark" ? "☀️" : "🌙";
  }
}

/* ==========================================================================
   2. Tab Switching
   ========================================================================== */
function initTabs() {
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabPanels = document.querySelectorAll(".tab-panel");

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-tab");

      tabButtons.forEach((b) => b.classList.remove("active"));
      tabPanels.forEach((p) => p.classList.remove("active"));

      btn.classList.add("active");
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) {
        targetPanel.classList.add("active");
      }
    });
  });
}

/* ==========================================================================
   3. Image Modal Zoom
   ========================================================================== */
function initModal() {
  const modal = document.getElementById("figure-modal");
  const modalImg = document.getElementById("modal-img");
  const modalCaption = document.getElementById("modal-caption");
  const modalClose = document.getElementById("modal-close");

  const figureCards = document.querySelectorAll(".figure-card");
  figureCards.forEach((card) => {
    card.addEventListener("click", () => {
      const img = card.querySelector("img");
      const title = card.querySelector(".figure-title");
      if (img && modal && modalImg) {
        modalImg.src = img.src;
        modalCaption.textContent = title ? title.textContent : "";
        modal.classList.add("active");
        modal.setAttribute("aria-hidden", "false");
      }
    });
  });

  if (modalClose) {
    modalClose.addEventListener("click", () => {
      closeModal();
    });
  }

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal && modal.classList.contains("active")) {
      closeModal();
    }
  });

  function closeModal() {
    if (modal) {
      modal.classList.remove("active");
      modal.setAttribute("aria-hidden", "true");
    }
  }
}

/* ==========================================================================
   4. Bulk RNA-Seq DEGs Dynamic Table
   ========================================================================== */
let allDEGs = [];

async function loadDEGs() {
  const tbody = document.getElementById("degs-tbody");
  const countEl = document.getElementById("deg-count");
  const searchInput = document.getElementById("deg-search");
  const filterSelect = document.getElementById("deg-filter");

  if (!tbody) return;

  try {
    const res = await fetch("data/degs.json");
    if (!res.ok) throw new Error("Failed to load degs.json");
    allDEGs = await res.json();
    renderDEGs(allDEGs);
    initVolcanoPlot(allDEGs);

    if (searchInput) {
      searchInput.addEventListener("input", filterDEGs);
    }
    if (filterSelect) {
      filterSelect.addEventListener("change", filterDEGs);
    }
  } catch (err) {
    console.error("Error loading DEGs:", err);
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--accent-pink);">Failed to load DEG data.</td></tr>`;
  }
}

function filterDEGs() {
  const searchInput = document.getElementById("deg-search");
  const filterSelect = document.getElementById("deg-filter");
  const query = (searchInput?.value || "").trim().toUpperCase();
  const dir = filterSelect?.value || "all";

  const filtered = allDEGs.filter((item) => {
    const matchesQuery = item.gene.toUpperCase().includes(query);
    const matchesDir =
      dir === "all" ||
      (dir === "up" && item.direction.toLowerCase().includes("up")) ||
      (dir === "down" && item.direction.toLowerCase().includes("down"));
    return matchesQuery && matchesDir;
  });

  renderDEGs(filtered);
}

function renderDEGs(data) {
  const tbody = document.getElementById("degs-tbody");
  const countEl = document.getElementById("deg-count");
  if (!tbody) return;

  if (countEl) {
    countEl.textContent = `Showing ${data.length} candidate genes`;
  }

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--text-muted);">No matching genes found.</td></tr>`;
    return;
  }

  tbody.innerHTML = data
    .map((item) => {
      const isUp = item.direction.toLowerCase().includes("up");
      const badgeClass = isUp ? "badge-deg-up" : "badge-deg-down";
      const sign = item.log2FC > 0 ? "+" : "";

      return `
      <tr>
        <th scope="row">${item.gene}</th>
        <td data-label="log2 Fold Change" style="font-family:var(--font-mono);font-weight:600;color:${
          isUp ? "var(--accent-pink)" : "var(--accent-cyan)"
        };">${sign}${item.log2FC}</td>
        <td data-label="Adjusted P-val (FDR)" style="font-family:var(--font-mono);">${item.padj}</td>
        <td data-label="Base Mean" style="font-family:var(--font-mono);">${item.baseMean}</td>
        <td data-label="Regulation"><span class="${badgeClass}">${item.direction}</span></td>
      </tr>
    `;
    })
    .join("");
}

/* ==========================================================================
   5. Single-Cell Cluster Markers
   ========================================================================== */
let allSCMarkers = [];

async function loadSingleCellMarkers() {
  const tbody = document.getElementById("sc-tbody");
  const clusterSelect = document.getElementById("sc-cluster-select");

  if (!tbody) return;

  try {
    const res = await fetch("data/single_cell_markers.json");
    if (!res.ok) throw new Error("Failed to load single_cell_markers.json");
    allSCMarkers = await res.json();

    // Populate cluster select options dynamically if needed
    const clusters = [...new Set(allSCMarkers.map((m) => m.cluster))].sort(
      (a, b) => Number(a) - Number(b)
    );
    if (clusterSelect && clusterSelect.options.length <= 1) {
      clusterSelect.innerHTML = `<option value="all">All Clusters (0-8)</option>`;
      clusters.forEach((c) => {
        clusterSelect.innerHTML += `<option value="${c}">Cluster ${c}</option>`;
      });
      clusterSelect.addEventListener("change", filterSCMarkers);
    }

    renderSCMarkers(allSCMarkers);
  } catch (err) {
    console.error("Error loading single cell markers:", err);
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--accent-pink);">Failed to load single-cell data.</td></tr>`;
  }
}

function filterSCMarkers() {
  const clusterSelect = document.getElementById("sc-cluster-select");
  const selected = clusterSelect?.value || "all";

  const filtered =
    selected === "all"
      ? allSCMarkers
      : allSCMarkers.filter((m) => String(m.cluster) === String(selected));

  renderSCMarkers(filtered);
}

function renderSCMarkers(data) {
  const tbody = document.getElementById("sc-tbody");
  if (!tbody) return;

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;">No markers found.</td></tr>`;
    return;
  }

  tbody.innerHTML = data
    .map(
      (m) => `
    <tr>
      <th scope="row">${m.gene}</th>
      <td data-label="Cluster"><span class="badge">Cluster ${m.cluster}</span></td>
      <td data-label="Avg log2FC" style="font-family:var(--font-mono);font-weight:600;color:var(--accent-cyan);">${m.avg_log2FC}</td>
      <td data-label="Pct.1 (In Cluster)" style="font-family:var(--font-mono);">${m.pct1}</td>
      <td data-label="Pct.2 (Background)" style="font-family:var(--font-mono);">${m.pct2}</td>
      <td data-label="Adj P-value" style="font-family:var(--font-mono);">${m.p_val_adj}</td>
    </tr>
  `
    )
    .join("");
}

/* ==========================================================================
   6. ClinVar Pharmacogenomics & Risk Variants
   ========================================================================== */
let allClinVar = [];

async function loadClinVarVariants() {
  const tbody = document.getElementById("clinvar-tbody");
  const searchInput = document.getElementById("clinvar-search");
  const typeSelect = document.getElementById("clinvar-filter");

  if (!tbody) return;

  try {
    const res = await fetch("data/clinvar_summary.json");
    if (!res.ok) throw new Error("Failed to load clinvar_summary.json");
    allClinVar = await res.json();

    renderClinVar(allClinVar);

    if (searchInput) {
      searchInput.addEventListener("input", filterClinVar);
    }
    if (typeSelect) {
      typeSelect.addEventListener("change", filterClinVar);
    }
  } catch (err) {
    console.error("Error loading ClinVar data:", err);
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--accent-pink);">Failed to load ClinVar data.</td></tr>`;
  }
}

function filterClinVar() {
  const searchInput = document.getElementById("clinvar-search");
  const typeSelect = document.getElementById("clinvar-filter");
  const query = (searchInput?.value || "").trim().toUpperCase();
  const selectedType = typeSelect?.value || "all";

  const filtered = allClinVar.filter((v) => {
    const matchesQuery =
      v.gene.toUpperCase().includes(query) ||
      v.rsid.toUpperCase().includes(query) ||
      v.phenotype.toUpperCase().includes(query);
    const matchesType = selectedType === "all" || v.type === selectedType;
    return matchesQuery && matchesType;
  });

  renderClinVar(filtered);
}

function renderClinVar(data) {
  const tbody = document.getElementById("clinvar-tbody");
  if (!tbody) return;

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;">No matching clinical variants found.</td></tr>`;
    return;
  }

  tbody.innerHTML = data
    .map((v) => {
      let badgeClass = "badge";
      if (v.type === "Pharmacogenomics") badgeClass = "badge badge-purple";
      if (v.type === "Protective") badgeClass = "badge badge-emerald";
      if (v.type === "Risk Factor") badgeClass = "badge-deg-up";

      return `
      <tr>
        <th scope="row">${v.gene}</th>
        <td data-label="RSID"><a href="https://www.ncbi.nlm.nih.gov/snp/${v.rsid}" target="_blank" rel="noopener noreferrer" style="color:var(--accent-cyan);text-decoration:none;font-family:var(--font-mono);">${v.rsid} ↗</a></td>
        <td data-label="Genotype" style="font-family:var(--font-mono);font-weight:700;">${v.genotype}</td>
        <td data-label="Category"><span class="${badgeClass}">${v.type}</span></td>
        <td data-label="Clinical Significance">${v.significance}</td>
        <td data-label="Phenotype / Clinical Actionability" style="font-size:0.85rem;color:var(--text-secondary);">${v.phenotype}</td>
      </tr>
    `;
    })
    .join("");
}

/* ==========================================================================
   7. Interactive Transcriptomic Volcano Plot
   ========================================================================== */
function initVolcanoPlot(degsData) {
  const svg = document.getElementById("volcano-svg");
  const tooltip = document.getElementById("volcano-tooltip");
  const fcSlider = document.getElementById("fc-thresh");
  const pSlider = document.getElementById("p-thresh");
  const fcVal = document.getElementById("fc-thresh-val");
  const pVal = document.getElementById("p-thresh-val");
  const resetBtn = document.getElementById("reset-volcano");
  const upPill = document.getElementById("volcano-up-pill");
  const downPill = document.getElementById("volcano-down-pill");
  const nsPill = document.getElementById("volcano-ns-pill");

  if (!svg || !degsData || degsData.length === 0) return;

  const points = degsData.map((d) => {
    const padj = parseFloat(d.padj) || 1e-15;
    const negLogP = -Math.log10(Math.max(padj, 1e-15));
    return {
      gene: d.gene,
      log2FC: d.log2FC,
      padj: d.padj,
      negLogP: negLogP,
      baseMean: d.baseMean,
      originalDirection: d.direction
    };
  });

  const xMin = -8.0;
  const xMax = 6.5;
  const yMin = 0.0;
  const yMax = 7.5;

  const width = 800;
  const height = 440;
  const margin = { top: 30, right: 40, bottom: 50, left: 60 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  function xScale(val) {
    return margin.left + ((val - xMin) / (xMax - xMin)) * innerW;
  }

  function yScale(val) {
    return margin.top + innerH - ((val - yMin) / (yMax - yMin)) * innerH;
  }

  function render() {
    const fcThresh = parseFloat(fcSlider?.value || 1.5);
    const pThresh = parseFloat(pSlider?.value || 1.3);

    if (fcVal) fcVal.textContent = fcThresh.toFixed(1);
    if (pVal) pVal.textContent = pThresh.toFixed(1);

    let upCount = 0;
    let downCount = 0;
    let nsCount = 0;

    points.forEach((p) => {
      if (p.negLogP >= pThresh && p.log2FC >= fcThresh) {
        p.status = "up";
        upCount++;
      } else if (p.negLogP >= pThresh && p.log2FC <= -fcThresh) {
        p.status = "down";
        downCount++;
      } else {
        p.status = "ns";
        nsCount++;
      }
    });

    if (upPill) upPill.textContent = `Up: ${upCount}`;
    if (downPill) downPill.textContent = `Down: ${downCount}`;
    if (nsPill) nsPill.textContent = `Non-sig: ${nsCount}`;

    let svgContent = `
      <!-- Grid lines -->
      <g class="volcano-grid" stroke="rgba(255,255,255,0.06)" stroke-width="1">
    `;

    for (let y = 1; y <= 7; y++) {
      const yPos = yScale(y);
      svgContent += `<line x1="${margin.left}" y1="${yPos}" x2="${width - margin.right}" y2="${yPos}" />`;
      svgContent += `<text x="${margin.left - 10}" y="${yPos + 4}" fill="var(--text-muted)" font-size="11" text-anchor="end" font-family="var(--font-mono)">${y}</text>`;
    }

    for (let x = -8; x <= 6; x += 2) {
      const xPos = xScale(x);
      svgContent += `<line x1="${xPos}" y1="${margin.top}" x2="${xPos}" y2="${height - margin.bottom}" />`;
      svgContent += `<text x="${xPos}" y="${height - margin.bottom + 18}" fill="var(--text-muted)" font-size="11" text-anchor="middle" font-family="var(--font-mono)">${x > 0 ? "+" + x : x}</text>`;
    }

    const zeroX = xScale(0);
    svgContent += `<line x1="${zeroX}" y1="${margin.top}" x2="${zeroX}" y2="${height - margin.bottom}" stroke="rgba(255,255,255,0.2)" stroke-dasharray="3,3" stroke-width="1" />`;

    const yCut = yScale(pThresh);
    const xCutPos = xScale(fcThresh);
    const xCutNeg = xScale(-fcThresh);

    svgContent += `
      <!-- Threshold lines -->
      <line x1="${margin.left}" y1="${yCut}" x2="${width - margin.right}" y2="${yCut}" stroke="var(--accent-orange)" stroke-dasharray="4,4" stroke-width="1.5" opacity="0.8" />
      <line x1="${xCutPos}" y1="${margin.top}" x2="${xCutPos}" y2="${height - margin.bottom}" stroke="var(--accent-pink)" stroke-dasharray="4,4" stroke-width="1.5" opacity="0.7" />
      <line x1="${xCutNeg}" y1="${margin.top}" x2="${xCutNeg}" y2="${height - margin.bottom}" stroke="var(--accent-cyan)" stroke-dasharray="4,4" stroke-width="1.5" opacity="0.7" />
      </g>

      <!-- Axis Labels -->
      <text x="${width / 2}" y="${height - 12}" fill="var(--text-secondary)" font-size="12" font-weight="600" text-anchor="middle">log₂ Fold Change (TNBC vs. Normal)</text>
      <text x="18" y="${height / 2}" fill="var(--text-secondary)" font-size="12" font-weight="600" text-anchor="middle" transform="rotate(-90, 18, ${height / 2})">-log₁₀ Adjusted P-value (FDR)</text>
      <g id="volcano-dots">
    `;

    points.forEach((p, idx) => {
      const cx = xScale(p.log2FC);
      const cy = yScale(p.negLogP);
      let fill = "var(--text-muted)";
      let r = 4.5;
      let opacity = 0.5;

      if (p.status === "up") {
        fill = "var(--accent-pink)";
        r = 5.5;
        opacity = 0.85;
      } else if (p.status === "down") {
        fill = "var(--accent-cyan)";
        r = 5.5;
        opacity = 0.85;
      }

      svgContent += `
        <circle class="volcano-dot" data-index="${idx}" data-gene="${p.gene}" cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" opacity="${opacity}" stroke="rgba(0,0,0,0.4)" stroke-width="0.8" style="cursor:pointer;transition:all 0.15s ease;" />
      `;

      const landmarks = ["AKT1", "ALB", "MDGA2", "DSCAM-AS1", "PGAM4P2", "GFAP"];
      if (landmarks.includes(p.gene)) {
        svgContent += `
          <text x="${cx + 8}" y="${cy - 4}" fill="${fill}" font-size="11" font-weight="700" font-family="var(--font-mono)" pointer-events="none">${p.gene}</text>
        `;
      }
    });

    svgContent += `</g>`;
    svg.innerHTML = svgContent;

    const dots = svg.querySelectorAll(".volcano-dot");
    dots.forEach((dot) => {
      dot.addEventListener("mouseenter", (e) => {
        const idx = dot.getAttribute("data-index");
        const p = points[idx];
        dot.setAttribute("r", "8");
        dot.setAttribute("stroke", "#ffffff");
        dot.setAttribute("stroke-width", "2");

        if (tooltip) {
          const rect = svg.getBoundingClientRect();
          const clientX = e.clientX - rect.left;
          const clientY = e.clientY - rect.top;

          tooltip.innerHTML = `
            <div class="tooltip-title">${p.gene}</div>
            <div class="tooltip-row"><span>log₂FC:</span> <strong style="color:${p.log2FC > 0 ? 'var(--accent-pink)' : 'var(--accent-cyan)'}">${p.log2FC > 0 ? '+' : ''}${p.log2FC}</strong></div>
            <div class="tooltip-row"><span>FDR (padj):</span> <strong>${p.padj}</strong></div>
            <div class="tooltip-row"><span>-log₁₀(p):</span> <strong>${p.negLogP.toFixed(2)}</strong></div>
            <div class="tooltip-row"><span>Base Mean:</span> <strong>${p.baseMean}</strong></div>
            <div class="tooltip-row" style="margin-top:4px;font-size:0.75rem;color:var(--accent-orange);">👉 Click to locate in table</div>
          `;
          tooltip.style.left = `${Math.min(clientX + 15, width - 180)}px`;
          tooltip.style.top = `${Math.max(clientY - 70, 10)}px`;
          tooltip.style.display = "block";
        }
      });

      dot.addEventListener("mouseleave", () => {
        const idx = dot.getAttribute("data-index");
        const p = points[idx];
        dot.setAttribute("r", p.status === "ns" ? "4.5" : "5.5");
        dot.setAttribute("stroke", "rgba(0,0,0,0.4)");
        dot.setAttribute("stroke-width", "0.8");
        if (tooltip) tooltip.style.display = "none";
      });

      dot.addEventListener("click", () => {
        const gene = dot.getAttribute("data-gene");
        highlightTableRow(gene);
      });
    });
  }

  function highlightTableRow(gene) {
    const searchInput = document.getElementById("deg-search");
    if (searchInput) {
      searchInput.value = gene;
      filterDEGs();
    }
    const tbody = document.getElementById("degs-tbody");
    if (tbody) {
      const rows = tbody.querySelectorAll("tr");
      rows.forEach((r) => {
        const th = r.querySelector("th");
        if (th && th.textContent.trim().toUpperCase() === gene.toUpperCase()) {
          r.scrollIntoView({ behavior: "smooth", block: "center" });
          r.style.backgroundColor = "rgba(249, 115, 22, 0.25)";
          setTimeout(() => {
            r.style.backgroundColor = "";
          }, 3000);
        }
      });
    }
  }

  fcSlider?.addEventListener("input", render);
  pSlider?.addEventListener("input", render);
  resetBtn?.addEventListener("click", () => {
    if (fcSlider) fcSlider.value = "1.5";
    if (pSlider) pSlider.value = "1.3";
    render();
  });

  render();
}
