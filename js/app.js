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
