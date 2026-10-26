# 🌐 SuleimanBioinformaticsAnalysis.github.io

[![GitHub Pages](https://img.shields.io/badge/Deployment-GitHub_Pages-2ea44f?style=flat-square&logo=github)](https://suleimanbioinformaticsanalysis.github.io)
[![Organization](https://img.shields.io/badge/Organization-SuleimanBioinformaticsAnalysis-00f2fe?style=flat-square&logo=github)](https://github.com/SuleimanBioinformaticsAnalysis)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

Interactive scientific portal and visual analytics dashboard for the **SuleimanBioinformaticsAnalysis** organization.

🔗 **Live Portal:** [https://suleimanbioinformaticsanalysis.github.io](https://suleimanbioinformaticsanalysis.github.io)

---

## 🏛️ Ecosystem Architecture

| Repository | Scope | Access | Purpose |
|---|---|---|---|
| **[SuleimanBioinformaticsAnalysis.github.io](https://github.com/SuleimanBioinformaticsAnalysis/SuleimanBioinformaticsAnalysis.github.io)** | Frontend Web Portal | Public | Interactive data visualizer, DEG explorer, single-cell UMAP viewer, 3D structural metrics, ClinVar catalog, and publication figures. |
| **[SuleimanBioinformaticsAnalysis](https://github.com/SuleimanBioinformaticsAnalysis/SuleimanBioinformaticsAnalysis)** | Core Backend & Data Vault | Secure / Private | Snakemake pipelines, raw sequencing FASTQs, clinical genomics databases, WGCNA scripts, and machine learning models. |

---

## 🔬 Core Interactive Capabilities

- **Interactive Bulk RNA-Seq DEGs:** Real-time search and regulation filtering across 1,847 significant genes (DESeq2, FDR < 0.05).
- **Single-Cell Transcriptomics:** Cluster marker tables (clusters 0-8) and high-resolution PBMC UMAP visualizations (Seurat).
- **Machine Learning & WGCNA:** Nested 5-fold cross-validated Random Forest oncology classifier (AUC-ROC = 0.91) and scale-free co-expression network analysis.
- **Structural Biology & Molecular Docking:** AlphaFold2 human AKT1 model metrics (mean pLDDT 92.4) and AutoDock Vina binding evaluations for allosteric (MK-2206, -9.4 kcal/mol) vs. ATP-competitive inhibitors.
- **Clinical Variant Interpretation:** High-confidence NIH ClinVar variant curation from 609K personal SNP arrays (pharmacogenomics, protective, and disease susceptibility alleles).
- **PLOS ONE Manuscript Highlight:** Comprehensive abstract, figures, and methodology summaries.

---

## 💻 Tech Stack

- **HTML5 & Vanilla JavaScript:** Lightning-fast, zero-dependency client application.
- **Modern CSS Design System:** Glassmorphism, CSS custom properties, container queries, sticky headers, and accessible semantic markup.
- **Dark & Light Mode:** Seamless theme toggle with persistent state.

---

## 📜 License & Attribution

Distributed under the MIT License. Developed and maintained by **Suleiman Hajizadeh**.
