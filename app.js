/**
 * ResumeAI — Main Application
 * Handles UI interactions, PDF parsing, offline ATS analyzer engine integration,
 * cover letter generation, resume enhancement, and local export.
 */

// ===== GLOBALS =====
let currentFile = null;
let currentText = '';
let isJDOpen = false;
let analysisResults = null;

// ===== PDF.js SETUP =====
if (typeof pdfjsLib !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

// ===== INIT =====
window.addEventListener('DOMContentLoaded', () => {
  setupIntersectionObserver();
});

// ===== NAVBAR SCROLL =====
window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  if (window.scrollY > 20) navbar.classList.add('scrolled');
  else navbar.classList.remove('scrolled');
});

function scrollToAnalyzer() {
  document.getElementById('analyzer').scrollIntoView({ behavior: 'smooth' });
}

// ===== DEMO MODE =====
function showDemo() {
  showToast('Loading demo resume...', 'info');
  const demoResume = `John Anderson
Senior Full-Stack Software Engineer
📧 john.anderson@email.com | 📱 +1 (555) 234-5678
🔗 linkedin.com/in/johnanderson | 💻 github.com/janderson

PROFESSIONAL SUMMARY
Results-driven Senior Software Engineer with 7+ years of experience building scalable web applications and distributed systems. Led cross-functional teams of 8-12 engineers, consistently delivering projects 20% ahead of schedule. Passionate about clean architecture, performance optimization, and mentoring junior developers.

WORK EXPERIENCE

Senior Software Engineer | TechCorp Inc. | Jan 2021 – Present
• Architected and deployed microservices platform handling 2M+ daily requests with 99.99% uptime
• Reduced API response time by 65% through Redis caching and database query optimization
• Led migration from monolith to microservices, cutting infrastructure costs by $120K annually
• Mentored 6 junior engineers, accelerating their onboarding time by 40%
• Implemented CI/CD pipelines using GitHub Actions, reducing deployment time from 2 hours to 12 minutes

Software Engineer | StartupXYZ | Jun 2018 – Dec 2020
• Built React-based dashboard serving 50,000+ active users with real-time data visualization
• Increased test coverage from 32% to 89% using Jest and Cypress, eliminating 95% of production bugs
• Optimized PostgreSQL queries and implemented connection pooling, improving throughput by 3x
• Collaborated with product and design teams using Agile/Scrum methodology across 2-week sprints

Junior Developer | WebAgency Co. | Aug 2016 – May 2018
• Developed 15+ client websites using HTML, CSS, JavaScript, and PHP
• Integrated third-party APIs (Stripe, Twilio, SendGrid) for payment and communication features

EDUCATION
B.S. Computer Science | State University | 2016 | GPA: 3.8/4.0

TECHNICAL SKILLS
Languages: JavaScript, TypeScript, Python, Go, SQL, HTML/CSS
Frameworks: React, Next.js, Node.js, Express, FastAPI, Django, Redux
Cloud & DevOps: AWS (EC2, S3, Lambda, RDS), Docker, Kubernetes, Terraform, GitHub Actions
Databases: PostgreSQL, MongoDB, Redis, Elasticsearch, DynamoDB
Tools: Git, Jira, Figma, Postman, Linux

CERTIFICATIONS
• AWS Certified Solutions Architect – Associate (2023)
• Google Cloud Professional Data Engineer (2022)

PROJECTS
• OpenMetrics: Open-source monitoring tool with 2K+ GitHub stars, 150+ contributors
• ResumeBuilder AI: SaaS platform generating 10K+ resumes/month using OpenAI API

ACHIEVEMENTS
• Speaker at NodeConf 2023: "Scaling Node.js Microservices in Production"
• Winner, Company Hackathon 2022: Built ML-powered customer churn predictor`;

  switchTab('paste');
  setTimeout(() => {
    const ta = document.getElementById('resumeText');
    ta.value = demoResume;
    ta.dispatchEvent(new Event('input'));
    currentText = demoResume;
    showToast('Demo resume loaded! Click Analyze below.', 'success');
  }, 100);
}

// ===== TAB CONTROLLER =====
function switchTab(type) {
  const tabUpload = document.getElementById('tabUpload');
  const tabPaste = document.getElementById('tabPaste');
  const uploadContent = document.getElementById('uploadContent');
  const pasteContent = document.getElementById('pasteContent');

  if (type === 'upload') {
    tabUpload.classList.add('active');
    tabPaste.classList.remove('active');
    uploadContent.style.display = 'block';
    pasteContent.style.display = 'none';
  } else {
    tabUpload.classList.remove('active');
    tabPaste.classList.add('active');
    uploadContent.style.display = 'none';
    pasteContent.style.display = 'block';
  }
}

// ===== TOGGLE JOB DESCRIPTION =====
function toggleJD() {
  isJDOpen = !isJDOpen;
  const content = document.getElementById('jdContent');
  const chevron = document.getElementById('jdChevron');
  const text = document.getElementById('jdToggleText');
  content.style.display = isJDOpen ? 'block' : 'none';
  chevron.style.transform = isJDOpen ? 'rotate(180deg)' : 'rotate(0)';
  text.textContent = isJDOpen ? 'Remove Job Description' : 'Add Job Description';
  if (isJDOpen) {
    setTimeout(() => document.getElementById('jobDescription').focus(), 50);
  }
}

// ===== FILE DRAG & DROP / UPLOAD =====
function handleDragOver(e) {
  e.preventDefault();
  document.getElementById('dropZone').classList.add('dragover');
}

function handleDragLeave(e) {
  e.preventDefault();
  document.getElementById('dropZone').classList.remove('dragover');
}

function handleDrop(e) {
  e.preventDefault();
  const dz = document.getElementById('dropZone');
  dz.classList.remove('dragover');
  const files = e.dataTransfer.files;
  if (files.length > 0) processFile(files[0]);
}

function handleFileSelect(e) {
  const files = e.target.files;
  if (files.length > 0) processFile(files[0]);
}

function removeFile(e) {
  e.stopPropagation();
  currentFile = null;
  currentText = '';
  document.getElementById('dzFileInfo').style.display = 'none';
  document.getElementById('fileInput').value = '';
  showToast('File removed', 'info');
}

async function processFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (!['pdf', 'txt', 'doc', 'docx'].includes(ext)) {
    showToast('Please upload PDF, TXT, DOC, or DOCX', 'error');
    return;
  }
  currentFile = file;
  document.getElementById('dzFileName').textContent = file.name;
  document.getElementById('dzFileInfo').style.display = 'flex';
  showToast(`📄 File loaded: ${file.name}`, 'success');
  if (ext === 'pdf') {
    try {
      currentText = await extractTextFromPDF(file);
    } catch (err) {
      showToast('PDF parsing failed — try pasting text instead', 'error');
      currentText = '';
    }
  } else {
    currentText = await file.text().catch(() => '');
  }
}

async function extractTextFromPDF(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(e.target.result) }).promise;
        let text = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map(item => item.str).join(' ') + '\n';
        }
        resolve(text);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// ===== MAIN ANALYZE =====
async function analyzeResume() {
  let resumeText = currentText;
  const pasteText = document.getElementById('resumeText').value.trim();
  const pasteActive = document.getElementById('tabPaste').classList.contains('active');
  if (pasteActive && pasteText) resumeText = pasteText;

  if (!resumeText || resumeText.trim().length < 50) {
    showToast('Please upload a resume or paste at least 50 characters', 'error');
    return;
  }

  // Snapshot original resume text for comparison tool
  originalResumeSnapshot = resumeText;

  const jobDescription = document.getElementById('jobDescription').value.trim();
  const industry = document.getElementById('industrySelect')?.value || 'tech';

  setLoadingState(true);
  showThinkingPanel();

  try {
    await sleep(300);
    updateThinkingStep(0, 'active');

    // Use offline rule-based analyzer with industry context
    const result = window.GeminiAnalyzer.analyze(resumeText, jobDescription, industry);

    updateThinkingStep(0, 'done');
    updateThinkingStep(1, 'active');
    await sleep(300);
    updateThinkingStep(1, 'done');
    updateThinkingStep(2, 'active');
    await sleep(200);
    updateThinkingStep(2, 'done');
    await sleep(150);

    analysisResults = result;
    setLoadingState(false);
    hideThinkingPanel();
    showResults(result);

    showToast('✅ Analysis complete!', 'success');
  } catch (err) {
    setLoadingState(false);
    hideThinkingPanel();
    console.error('Analysis error:', err);
    showToast(`Error: ${err.message}`, 'error');
  }
}

// ===== THINKING PANEL =====
const THINKING_STEPS = [
  { label: 'Parsing resume structure and sections' },
  { label: 'Analyzing keywords, skills, and impact statements' },
  { label: 'Generating personalized recommendations' }
];

function showThinkingPanel() {
  let panel = document.getElementById('thinkingPanel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'thinkingPanel';
    panel.className = 'gemini-thinking';
    const btn = document.getElementById('analyzeBtn');
    btn.parentNode.insertBefore(panel, btn);
  }

  panel.innerHTML = `
    <div style="font-size:0.78rem;font-weight:600;color:#a5b4fc;margin-bottom:0.5rem;display:flex;align-items:center;gap:0.4rem;">
      ⚙️ Offline ATS Engine is scanning...
    </div>
    ${THINKING_STEPS.map((s, i) => `
      <div class="thinking-step" id="thinkStep${i}">
        <span class="thinking-check" id="thinkCheck${i}">○</span>
        <span>${s.label}</span>
      </div>
    `).join('')}
  `;
  panel.style.display = 'block';
}

function hideThinkingPanel() {
  const panel = document.getElementById('thinkingPanel');
  if (panel) {
    panel.style.display = 'none';
  }
}

function updateThinkingStep(index, state) {
  const step = document.getElementById(`thinkStep${index}`);
  const check = document.getElementById(`thinkCheck${index}`);
  if (!step) return;
  step.className = `thinking-step ${state}`;
  check.textContent = state === 'done' ? '✓' : state === 'active' ? '◉' : '○';
}

function setLoadingState(loading) {
  const btn = document.getElementById('analyzeBtn');
  const btnText = document.getElementById('analyzeBtnText');
  const analyzingText = document.getElementById('analyzingText');
  const analyzingLabel = document.getElementById('analyzingLabel');

  btn.disabled = loading;
  btnText.style.display = loading ? 'none' : 'flex';
  analyzingText.style.display = loading ? 'flex' : 'none';

  if (loading) {
    analyzingText.style.alignItems = 'center';
    analyzingLabel.textContent = 'Offline ATS scanning...';
  }
}

// ===== SHOW RESULTS =====
function showResults(results) {
  const resultsPanel = document.getElementById('resultsPanel');
  const wrapper = document.querySelector('.analyzer-wrapper');
  resultsPanel.style.display = 'block';
  wrapper.classList.add('has-results');

  // Populate editor text
  const resumeText = currentText || document.getElementById('resumeText').value.trim();
  document.getElementById('enhancerTextEditor').value = resumeText;

  // Reset cover letter tab view
  document.getElementById('coverLetterResultArea').style.display = 'none';
  document.getElementById('coverLetterTextEditor').value = '';

  // Set active result tab view
  switchResultTab('report');

  // Set AI badge with better styling
  const aiTag = document.getElementById('aiPoweredTag');
  if (aiTag) {
    aiTag.textContent = '🔒 Offline Engine';
    aiTag.style.cssText = `
      display: inline-block;
      padding: 0.35rem 0.8rem;
      background: rgba(16, 185, 129, 0.15);
      color: #10b981;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      border: 1px solid rgba(16, 185, 129, 0.3);
    `;
  }

  // Render sections with staggered animations
  renderScores(results);
  
  setTimeout(() => renderSummary(results), 100);
  setTimeout(() => renderSkills(results.skills), 200);
  setTimeout(() => renderRecommendations(results.recommendations, results.improvements), 300);
  setTimeout(() => renderKeywords(results.keywords, results.jobMatch), 400);
  
  if (results.jobMatch) {
    setTimeout(() => renderJobMatch(results.jobMatch), 500);
  }
  
  if (results.atsWarnings && results.atsWarnings.length > 0) {
    setTimeout(() => renderATSWarnings(results.atsWarnings), 600);
  } else {
    const warningEl = document.getElementById('atsWarningsSection');
    if (warningEl) warningEl.remove();
  }

  // ===== NEW: Render Deep Analysis sections =====
  setTimeout(() => {
    if (results.salary)         renderSalary(results.salary);
    if (results.lengthData)     renderLength(results.lengthData);
    if (results.grammar)        renderGrammar(results.grammar);
    if (results.readability)    renderReadability(results.readability);
    if (results.bulletAnalysis) renderBullets(results.bulletAnalysis);
    if (results.duplicates)     renderDuplicates(results.duplicates);
    if (results.roleMatches)    renderRoleMatches(results.roleMatches);
    if (results.linkedInGaps)   renderLinkedIn(results.linkedInGaps);
  }, 500);

  // ===== Save to score history =====
  saveScoreHistory(results);

  // Smooth scroll to results with delay
  setTimeout(() => resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
  showToast('✅ Analysis Complete! Check results below', 'success');
}


// ===== RENDER SCORES =====
function renderScores(results) {
  animateCounter('atsScoreNum', results.atsScore, 1500);
  setTimeout(() => {
    const fill = document.getElementById('atsRingFill');
    const circ = 2 * Math.PI * 50;
    fill.style.strokeDashoffset = circ - (results.atsScore / 100) * circ;
    injectSVGDefs();
  }, 100);

  const { grade, gradeClass } = getGrade(results.atsScore);
  const gradeEl = document.getElementById('atsGrade');
  gradeEl.textContent = results.overallGrade || grade;
  gradeEl.className = `score-grade ${gradeClass}`;

  setMiniScore('skills', results.skillsScore);
  setMiniScore('format', results.formatScore);
  setMiniScore('impact', results.impactScore);
  setMiniScore('keywords', results.keywordsScore);
}

function setMiniScore(id, score) {
  const scoreEl = document.getElementById(`${id}Score`);
  const fillEl = document.getElementById(`${id}Fill`);
  const cardEl = document.getElementById(`${id}Card`);
  
  // Animate score number
  scoreEl.textContent = `${score}%`;
  scoreEl.style.animation = 'none';
  setTimeout(() => {
    scoreEl.style.animation = 'popIn 0.4s ease';
  }, 10);
  
  // Add hover effect to card
  if (cardEl) {
    cardEl.style.transition = 'var(--transition)';
  }
  
  // Animate fill bar with delay
  setTimeout(() => {
    fillEl.style.width = `${score}%`;
    
    // Color based on score
    if (score >= 75) {
      fillEl.style.background = 'linear-gradient(90deg, #10b981, #06b6d4)';
      fillEl.style.boxShadow = '0 0 12px rgba(16, 185, 129, 0.4)';
    } else if (score >= 55) {
      fillEl.style.background = 'linear-gradient(90deg, #6366f1, #8b5cf6)';
      fillEl.style.boxShadow = '0 0 12px rgba(99, 102, 241, 0.4)';
    } else {
      fillEl.style.background = 'linear-gradient(90deg, #f59e0b, #ef4444)';
      fillEl.style.boxShadow = '0 0 12px rgba(239, 68, 68, 0.4)';
    }
  }, 200);
}

function getGrade(score) {
  if (score >= 85) return { grade: 'EXCELLENT', gradeClass: 'grade-excellent' };
  if (score >= 70) return { grade: 'GOOD', gradeClass: 'grade-good' };
  if (score >= 55) return { grade: 'FAIR', gradeClass: 'grade-fair' };
  return { grade: 'NEEDS WORK', gradeClass: 'grade-poor' };
}

function injectSVGDefs() {
  const svg = document.querySelector('#atsScoreRing svg');
  if (svg && !svg.querySelector('defs')) {
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `<linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366f1"/>
      <stop offset="50%" stop-color="#8b5cf6"/>
      <stop offset="100%" stop-color="#ec4899"/>
    </linearGradient>`;
    svg.appendChild(defs);
  }
}

// ===== RENDER SUMMARY =====
function renderSummary(results) {
  if (!results.summary) return;

  let summaryEl = document.getElementById('aiSummarySection');
  if (!summaryEl) {
    summaryEl = document.createElement('div');
    summaryEl.id = 'aiSummarySection';
    summaryEl.className = 'result-section';
    summaryEl.innerHTML = `
      <div class="rs-header">
        <h4>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
          ATS Core Assessment
        </h4>
      </div>
      <p id="aiSummaryText" style="font-size:0.875rem;color:var(--text-secondary);line-height:1.7;padding:0.75rem 1rem;background:rgba(99,102,241,0.06);border-radius:8px;border-left:3px solid var(--accent);"></p>
    `;
    const scoreCards = document.querySelector('.score-cards');
    scoreCards.parentNode.insertBefore(summaryEl, scoreCards.nextSibling);
  }
  document.getElementById('aiSummaryText').textContent = results.summary;
}

// ===== RENDER SKILLS =====
function renderSkills(skills) {
  const container = document.getElementById('skillsCategories');
  container.innerHTML = '';
  const labels = {
    programming: 'Programming Languages',
    frameworks: 'Frameworks & Libraries',
    cloud: 'Cloud & DevOps',
    databases: 'Databases',
    tools: 'Tools & Platforms',
    data: 'Data / AI / ML',
    soft: 'Soft Skills',
    certifications: 'Certifications'
  };
  let hasAny = false;
  for (const [cat, list] of Object.entries(skills)) {
    if (!Array.isArray(list) || list.length === 0) continue;
    hasAny = true;
    const div = document.createElement('div');
    div.className = 'skill-category';
    const label = document.createElement('div');
    label.className = 'skill-cat-label';
    label.textContent = labels[cat] || cat;
    const tags = document.createElement('div');
    tags.className = 'skill-tags';
    list.forEach((skill, i) => {
      const tag = document.createElement('span');
      tag.className = `skill-tag${i < 3 ? ' highlight' : ''}`;
      tag.textContent = skill;
      tags.appendChild(tag);
    });
    div.appendChild(label);
    div.appendChild(tags);
    container.appendChild(div);
  }
  if (!hasAny) {
    container.innerHTML = `<p style="color:var(--text-muted);font-size:0.875rem;">No skills detected. Add a dedicated Skills section to your resume.</p>`;
  }
}

// ===== RENDER RECOMMENDATIONS =====
function renderRecommendations(recommendations, improvements) {
  const container = document.getElementById('recommendations');
  container.innerHTML = '';

  if (improvements?.highPriority?.length > 0) {
    const hpDiv = document.createElement('div');
    hpDiv.style.cssText = 'margin-bottom:0.75rem;';
    hpDiv.innerHTML = `
      <div style="font-size:0.72rem;font-weight:700;color:var(--danger);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:0.5rem;">🔴 High Priority Improvements</div>
      ${improvements.highPriority.map(t => `
        <div class="rec-item rec-critical" style="margin-bottom:0.5rem;">
          <div class="rec-icon">⚡</div>
          <div class="rec-content"><div class="rec-desc">${t}</div></div>
        </div>`).join('')}
    `;
    container.appendChild(hpDiv);
  }

  recommendations.forEach(rec => {
    const item = document.createElement('div');
    item.className = `rec-item rec-${rec.type}`;
    item.innerHTML = `
      <div class="rec-icon">${rec.icon}</div>
      <div class="rec-content">
        <div class="rec-title">${rec.title}</div>
        <div class="rec-desc">${rec.desc}</div>
      </div>`;
    container.appendChild(item);
  });

  if (improvements?.strengths?.length > 0) {
    const strDiv = document.createElement('div');
    strDiv.style.cssText = 'margin-top:0.75rem;';
    strDiv.innerHTML = `
      <div style="font-size:0.72rem;font-weight:700;color:var(--success);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:0.5rem;">✅ Strengths & Green Flags</div>
      ${improvements.strengths.map(s => `
        <div class="rec-item rec-success" style="margin-bottom:0.5rem;">
          <div class="rec-icon">🌟</div>
          <div class="rec-content"><div class="rec-desc">${s}</div></div>
        </div>`).join('')}
    `;
    container.appendChild(strDiv);
  }
}

// ===== RENDER KEYWORDS =====
function renderKeywords(keywords, jobMatch) {
  const container = document.getElementById('keywordAnalysis');
  if (!keywords) return;
  const present = keywords.present || [];
  const missing = jobMatch?.missingSkills || keywords.missing || [];
  const power = keywords.powerWords || [];

  container.innerHTML = `
    <div class="keyword-grid">
      <div>
        <div class="kw-section-label present">✓ Present Keywords (${present.length})</div>
        <div class="kw-tags">${present.map(k => `<span class="kw-tag present">${k}</span>`).join('')}</div>
        ${power.length > 0 ? `<div class="kw-section-label present" style="margin-top:0.75rem;">⚡ Suggested Power Words</div>
        <div class="kw-tags">${power.slice(0, 6).map(k => `<span class="kw-tag present" style="border-color:rgba(99,102,241,0.4);color:#a5b4fc;background:rgba(99,102,241,0.12);">${k}</span>`).join('')}</div>` : ''}
      </div>
      <div>
        <div class="kw-section-label missing">✗ Missing Keywords (${missing.length})</div>
        <div class="kw-tags">${missing.map(k => `<span class="kw-tag missing">${k}</span>`).join('')}</div>
      </div>
    </div>`;
}

// ===== RENDER JOB MATCH =====
function renderJobMatch(jobMatch) {
  const section = document.getElementById('jobMatchSection');
  section.style.display = 'block';

  const badge = document.getElementById('matchBadge');
  badge.textContent = `${jobMatch.score}%`;
  const color = jobMatch.score >= 75 ? 'var(--success)' : jobMatch.score >= 55 ? 'var(--warning)' : 'var(--danger)';
  badge.style.cssText = `background:${color}22;color:${color};border:1px solid ${color}44;`;

  const details = document.getElementById('matchDetails');
  details.innerHTML = `
    ${jobMatch.matchSummary ? `<p style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:0.75rem;">${jobMatch.matchSummary}</p>` : ''}
    <div class="match-bar-wrap">
      <div class="match-bar-label"><span>Job Match Score</span><span>${jobMatch.score}%</span></div>
      <div class="match-bar"><div class="match-fill" style="width:0%" id="matchFillBar"></div></div>
    </div>
    ${jobMatch.keyRequirements?.length > 0 ? `
    <div style="margin-top:0.75rem;">
      <div class="kw-section-label missing" style="margin-bottom:0.4rem;">Top Missing Job Keywords</div>
      <div class="kw-tags">${jobMatch.keyRequirements.map(s => `<span class="kw-tag missing">${s}</span>`).join('')}</div>
    </div>` : ''}
    ${jobMatch.matchedSkills?.length > 0 ? `
    <div style="margin-top:0.75rem;">
      <div class="kw-section-label present" style="margin-bottom:0.4rem;">✓ Matched Requirements</div>
      <div class="kw-tags">${jobMatch.matchedSkills.slice(0, 8).map(s => `<span class="kw-tag present">${s}</span>`).join('')}</div>
    </div>` : ''}
  `;
  setTimeout(() => {
    const bar = document.getElementById('matchFillBar');
    if (bar) bar.style.width = `${jobMatch.score}%`;
  }, 300);
}

// ===== RENDER ATS WARNINGS =====
function renderATSWarnings(warnings) {
  let warningEl = document.getElementById('atsWarningsSection');
  if (!warningEl) {
    warningEl = document.createElement('div');
    warningEl.id = 'atsWarningsSection';
    warningEl.className = 'result-section';
    warningEl.innerHTML = `
      <div class="rs-header">
        <h4 style="color:var(--danger);">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          ATS Risk & Format Flags
        </h4>
      </div>
      <div id="atsWarningsList"></div>`;
    const recSection = document.querySelector('.result-section');
    if (recSection) recSection.parentNode.insertBefore(warningEl, recSection);
  }
  document.getElementById('atsWarningsList').innerHTML = warnings.map(w =>
    `<div class="rec-item rec-critical"><div class="rec-icon">⚠️</div><div class="rec-content"><div class="rec-desc">${w}</div></div></div>`
  ).join('');
}

function exportReport() {
  if (!analysisResults) {
    showToast('No results to export', 'error');
    return;
  }

  showToast('📥 Generating PDF report...', 'info');

  const r = analysisResults;
  const now = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const allSkills = Object.values(r.skills || {}).flat();

  // Access jsPDF from the html2pdf bundle
  const { jsPDF } = window.jspdf || {};
  if (!jsPDF) {
    showToast('PDF library not loaded. Please refresh and try again.', 'error');
    return;
  }

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentW = pageW - margin * 2;
  let y = 20;

  // Helper: check page overflow and add new page
  function checkPage(needed) {
    if (y + needed > pageH - 20) {
      doc.addPage();
      y = 20;
    }
  }

  // Helper: draw section heading
  function sectionHeading(text) {
    checkPage(14);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text(text, margin, y);
    y += 1;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageW - margin, y);
    y += 7;
  }

  // Helper: wrapped text block
  function wrappedText(text, fontSize, color, bold) {
    doc.setFontSize(fontSize || 10);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setTextColor(color?.[0] ?? 51, color?.[1] ?? 65, color?.[2] ?? 85);
    const lines = doc.splitTextToSize(text, contentW);
    lines.forEach(line => {
      checkPage(6);
      doc.text(line, margin, y);
      y += 5;
    });
  }

  // ===== TITLE =====
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(99, 102, 241);
  doc.text('ResumeAI Analysis Report', margin, y);
  y += 9;

  // Subtitle badge
  doc.setFillColor(99, 102, 241);
  doc.roundedRect(margin, y - 4, 68, 7, 2, 2, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('100% Offline ATS Audit Report', margin + 3, y);
  y += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Generated: ' + now, margin, y);
  y += 10;

  // ===== SUMMARY =====
  if (r.summary) {
    checkPage(20);
    doc.setFillColor(240, 240, 255);
    const summaryLines = doc.splitTextToSize(r.summary, contentW - 10);
    const boxH = summaryLines.length * 5 + 12;
    doc.roundedRect(margin, y - 4, contentW, boxH, 2, 2, 'F');
    doc.setDrawColor(99, 102, 241);
    doc.setLineWidth(1);
    doc.line(margin, y - 4, margin, y - 4 + boxH);
    y += 2;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text('ATS Audit Summary:', margin + 4, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    summaryLines.forEach(line => {
      checkPage(6);
      doc.text(line, margin + 4, y);
      y += 4.5;
    });
    y += 6;
  }

  // ===== SCORES =====
  sectionHeading('Scores Overview');

  const scores = [
    { label: 'ATS Score', value: r.atsScore, grade: r.overallGrade || '' },
    { label: 'Skills', value: r.skillsScore + '%' },
    { label: 'Format', value: r.formatScore + '%' },
    { label: 'Impact', value: r.impactScore + '%' },
    { label: 'Keywords', value: r.keywordsScore + '%' }
  ];

  checkPage(25);
  const boxW = (contentW - 8) / scores.length;
  scores.forEach((s, i) => {
    const x = margin + i * (boxW + 2);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, y, boxW, 22, 2, 2, 'FD');
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(99, 102, 241);
    doc.text(String(s.value), x + boxW / 2, y + 10, { align: 'center' });
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(s.label.toUpperCase(), x + boxW / 2, y + 16, { align: 'center' });
    if (s.grade) {
      doc.setFontSize(6);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(91, 33, 182);
      doc.text(s.grade, x + boxW / 2, y + 20, { align: 'center' });
    }
  });
  y += 30;

  // ===== JOB MATCH =====
  if (r.jobMatch) {
    sectionHeading('Job Match: ' + r.jobMatch.score + '%');

    if (r.jobMatch.matchSummary) {
      wrappedText(r.jobMatch.matchSummary, 9, [51, 65, 85], false);
      y += 3;
    }

    if (r.jobMatch.matchedSkills?.length > 0) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(6, 95, 70);
      checkPage(8);
      doc.text('Matched: ', margin, y);
      doc.setFont('helvetica', 'normal');
      const matchedStr = r.jobMatch.matchedSkills.join(', ');
      const matchedLines = doc.splitTextToSize(matchedStr, contentW - 20);
      doc.text(matchedLines, margin + 20, y);
      y += matchedLines.length * 4.5 + 3;
    }

    if (r.jobMatch.missingSkills?.length > 0) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(153, 27, 27);
      checkPage(8);
      doc.text('Missing: ', margin, y);
      doc.setFont('helvetica', 'normal');
      const missingStr = r.jobMatch.missingSkills.join(', ');
      const missingLines = doc.splitTextToSize(missingStr, contentW - 20);
      doc.text(missingLines, margin + 20, y);
      y += missingLines.length * 4.5 + 3;
    }
    y += 4;
  }

  // ===== SKILLS =====
  sectionHeading('Skills Detected (' + allSkills.length + ')');
  if (allSkills.length > 0) {
    const skillStr = allSkills.join('  |  ');
    wrappedText(skillStr, 9, [91, 33, 182], false);
    y += 4;
  }

  // ===== RECOMMENDATIONS =====
  sectionHeading('Actionable Recommendations');

  if (r.improvements?.highPriority?.length > 0) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38);
    checkPage(8);
    doc.text('HIGH PRIORITY:', margin, y);
    y += 5;
    r.improvements.highPriority.forEach(item => {
      checkPage(10);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      const lines = doc.splitTextToSize('>> ' + item, contentW - 5);
      lines.forEach(line => {
        checkPage(5);
        doc.text(line, margin + 3, y);
        y += 4.5;
      });
      y += 1;
    });
    y += 3;
  }

  (r.recommendations || []).forEach(rec => {
    checkPage(14);
    const typeColor = rec.type === 'critical' ? [239, 68, 68] : rec.type === 'warning' ? [245, 158, 11] : [16, 185, 129];
    doc.setDrawColor(...typeColor);
    doc.setLineWidth(1);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    const titleText = (rec.title || '');
    doc.text(titleText, margin + 3, y);
    y += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    const descLines = doc.splitTextToSize(rec.desc || '', contentW - 8);
    descLines.forEach(line => {
      checkPage(5);
      doc.text(line, margin + 3, y);
      y += 4;
    });
    doc.line(margin, y - descLines.length * 4 - 6, margin, y);
    y += 4;
  });

  // ===== KEYWORDS =====
  sectionHeading('Keywords Analysis');

  const presentKW = r.keywords?.present || [];
  const missingKW = r.keywords?.missing || [];

  if (presentKW.length > 0) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(6, 95, 70);
    checkPage(8);
    doc.text('Present (' + presentKW.length + '):', margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    const presStr = presentKW.join(', ');
    const presLines = doc.splitTextToSize(presStr, contentW);
    presLines.forEach(line => {
      checkPage(5);
      doc.text(line, margin, y);
      y += 4.5;
    });
    y += 3;
  }

  if (missingKW.length > 0) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(153, 27, 27);
    checkPage(8);
    doc.text('Missing (' + missingKW.length + '):', margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    const missStr = missingKW.join(', ');
    const missLines = doc.splitTextToSize(missStr, contentW);
    missLines.forEach(line => {
      checkPage(5);
      doc.text(line, margin, y);
      y += 4.5;
    });
    y += 3;
  }

  // ===== ATS WARNINGS =====
  if (r.atsWarnings?.length > 0) {
    sectionHeading('ATS Risk & Format Flags');
    r.atsWarnings.forEach(w => {
      checkPage(10);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(153, 27, 27);
      const wLines = doc.splitTextToSize('! ' + w, contentW - 5);
      wLines.forEach(line => {
        checkPage(5);
        doc.text(line, margin + 2, y);
        y += 4.5;
      });
      y += 1;
    });
    y += 3;
  }

  // ===== STRENGTHS =====
  if (r.improvements?.strengths?.length > 0) {
    sectionHeading('Strengths & Green Flags');
    r.improvements.strengths.forEach(s => {
      checkPage(8);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(6, 95, 70);
      const sLines = doc.splitTextToSize('+ ' + s, contentW - 5);
      sLines.forEach(line => {
        checkPage(5);
        doc.text(line, margin + 2, y);
        y += 4.5;
      });
      y += 1;
    });
  }

  // ===== FOOTER =====
  checkPage(15);
  y += 5;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageW - margin, y);
  y += 6;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('Generated by ResumeAI - Offline ATS Report Audit', pageW / 2, y, { align: 'center' });

  // Save
  doc.save('ResumeAI_Report_' + Date.now() + '.pdf');
  showToast('Report PDF downloaded!', 'success');
}

// ===== RESET =====
function resetAnalyzer() {
  document.getElementById('resultsPanel').style.display = 'none';
  document.querySelector('.analyzer-wrapper').classList.remove('has-results');
  currentFile = null;
  currentText = '';
  analysisResults = null;
  document.getElementById('fileInput').value = '';
  document.getElementById('dzFileInfo').style.display = 'none';
  document.getElementById('resumeText').value = '';
  document.getElementById('jobDescription').value = '';
  const summary = document.getElementById('aiSummarySection');
  if (summary) summary.remove();
  const warnings = document.getElementById('atsWarningsSection');
  if (warnings) warnings.remove();
  const thinking = document.getElementById('thinkingPanel');
  if (thinking) thinking.remove();
  scrollToAnalyzer();
  showToast('Ready for new analysis!', 'info');
}

// ===== TOAST =====
function showToast(msg, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `toast ${type} show`;
  
  // Add visual feedback based on type
  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️'
  };
  
  // Optional: Add icon prefix (already in msg, but can enhance)
  toast.style.cssText = `
    animation: slideInUp 0.3s ease;
    font-weight: 500;
    letter-spacing: 0.3px;
  `;
  
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.style.animation = 'slideInUp 0.3s ease reverse';
    setTimeout(() => toast.classList.remove('show'), 300);
  }, 3500);
}

// ===== UTILS =====
function animateCounter(id, target, duration) {
  const el = document.getElementById(id);
  let start = 0;
  const step = (ts) => {
    if (!start) start = ts;
    const progress = Math.min((ts - start) / duration, 1);
    el.textContent = Math.floor((1 - Math.pow(1 - progress, 3)) * target);
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ===== SCROLL ANIMATIONS =====
function setupIntersectionObserver() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.feature-card, .step').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });
}

// ===== TEXTAREA AUTO-RESIZE =====
document.addEventListener('DOMContentLoaded', () => {
  ['resumeText', 'jobDescription'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', function () {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 500) + 'px';
    });
  });
});

// ===== KEYBOARD SHORTCUT =====
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') analyzeResume();
});

// ===== RESULTS TAB CONTROLLER =====
function switchResultTab(tabName) {
  document.querySelectorAll('.result-tabs-wrap .tab, #resultsPanel .tabs .tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.result-tab-content').forEach(c => c.style.display = 'none');

  const tabMap = {
    'report':       ['tabReport',       'reportTabContent'],
    'deepAnalysis': ['tabDeepAnalysis', 'deepAnalysisTabContent'],
    'enhancer':     ['tabEnhancer',     'enhancerTabContent'],
    'coverLetter':  ['tabCoverLetter',  'coverLetterTabContent'],
    'tools':        ['tabTools',        'toolsTabContent'],
    'linkedin':     ['tabLinkedIn',     'linkedinTabContent'],
    'history':      ['tabHistory',      'historyTabContent']
  };

  const [tabId, contentId] = tabMap[tabName] || tabMap['report'];
  const tabEl = document.getElementById(tabId);
  const contentEl = document.getElementById(contentId);
  if (tabEl) tabEl.classList.add('active');
  if (contentEl) contentEl.style.display = 'block';

  if (tabName === 'enhancer') {
    const editor = document.getElementById('enhancerTextEditor');
    if (!editor.value) editor.value = currentText || document.getElementById('resumeText').value.trim();
  }
  if (tabName === 'history') renderScoreHistory();
}


// ===== AI ENHANCER ACTION =====
async function triggerEnhance(type) {
  const editor = document.getElementById('enhancerTextEditor');
  const originalText = editor.value.trim();
  if (!originalText) {
    showToast('Editor is empty!', 'error');
    return;
  }

  const card = event?.currentTarget;
  let originalHTML = '';
  if (card) {
    originalHTML = card.innerHTML;
    card.style.pointerEvents = 'none';
    card.innerHTML = `<div class="spinner" style="width:14px;height:14px;margin-right:0.5rem;border-width:2px;"></div> <span style="font-size:0.75rem;">Rewriting text...</span>`;
  }

  showToast('Optimizing resume copy...', 'info');

  try {
    await sleep(400);
    const enhanced = window.GeminiAnalyzer.enhanceResume(originalText, type);
    editor.value = enhanced;
    showToast('✨ Resume content enhanced successfully!', 'success');
  } catch (err) {
    console.error(err);
    showToast(`Enhancement failed: ${err.message}`, 'error');
  } finally {
    if (card) {
      card.style.pointerEvents = 'all';
      card.innerHTML = originalHTML;
    }
  }
}

function reAnalyzeFromEditor() {
  const editedText = document.getElementById('enhancerTextEditor').value.trim();
  if (!editedText) {
    showToast('Resume editor is empty!', 'error');
    return;
  }

  currentText = editedText;
  showToast('Re-analyzing updated resume...', 'info');
  switchResultTab('report');
  analyzeResume();
}

// ===== COV LETTER GENERATOR ACTION =====
async function generateCoverLetter() {
  const resumeText = document.getElementById('enhancerTextEditor').value.trim() || currentText || document.getElementById('resumeText').value.trim();
  if (!resumeText) {
    showToast('Resume data is missing. Please paste or upload resume text first.', 'error');
    return;
  }

  const jobDescription = document.getElementById('jobDescription').value.trim();
  const tone = document.getElementById('coverLetterTone').value;

  const btn = document.getElementById('generateLetterBtn');
  const loader = document.getElementById('coverLetterLoading');
  const resultArea = document.getElementById('coverLetterResultArea');

  btn.disabled = true;
  loader.style.display = 'block';
  resultArea.style.display = 'none';

  showToast('Tailoring cover letter...', 'info');

  try {
    await sleep(650);
    const letter = window.GeminiAnalyzer.generateCoverLetter(resumeText, jobDescription, tone);
    document.getElementById('coverLetterTextEditor').value = letter;

    loader.style.display = 'none';
    resultArea.style.display = 'block';
    showToast('✨ Cover letter generated!', 'success');
  } catch (err) {
    loader.style.display = 'none';
    console.error(err);
    showToast(`Generation failed: ${err.message}`, 'error');
  } finally {
    btn.disabled = false;
  }
}

function copyCoverLetter() {
  const text = document.getElementById('coverLetterTextEditor').value;
  if (!text) {
    showToast('No text generated to copy.', 'error');
    return;
  }
  navigator.clipboard.writeText(text)
    .then(() => showToast('📋 Cover letter copied to clipboard!', 'success'))
    .catch(() => showToast('Clipboard write permission blocked.', 'error'));
}

function downloadCoverLetter() {
  const text = document.getElementById('coverLetterTextEditor').value;
  if (!text) {
    showToast('No text generated to download.', 'error');
    return;
  }

  const element = document.createElement('div');
  element.style.padding = '40px';
  element.style.color = '#111111';
  element.style.fontFamily = 'Georgia, serif';
  element.style.backgroundColor = '#ffffff';
  element.style.fontSize = '12pt';
  element.style.lineHeight = '1.6';
  element.style.whiteSpace = 'pre-wrap';
  element.textContent = text;

  const wrapper = document.createElement('div');
  wrapper.style.position = 'fixed';
  wrapper.style.top = '0';
  wrapper.style.left = '0';
  wrapper.style.width = '100vw';
  wrapper.style.height = '100vh';
  wrapper.style.overflow = 'hidden';
  wrapper.style.zIndex = '-9999';
  wrapper.style.pointerEvents = 'none';

  element.style.width = '750px';
  element.style.backgroundColor = '#ffffff';
  element.style.position = 'relative';

  wrapper.appendChild(element);
  document.body.appendChild(wrapper);

  const opt = {
    margin:       15,
    filename:     `ResumeAI_Cover_Letter_${Date.now()}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  showToast('📥 Generating Cover Letter PDF locally...', 'info');
  html2pdf().from(element).set(opt).save()
    .then(() => {
      document.body.removeChild(wrapper);
      showToast('✅ Cover Letter PDF downloaded!', 'success');
    })
    .catch(err => {
      document.body.removeChild(wrapper);
      console.error(err);
      showToast('Failed to download PDF locally', 'error');
    });
}

// ===== EXPORT FUNCTIONS FOR MNC USE =====
/**
 * Export resume as clean plain text (ATS-friendly)
 */
function exportResumeAsText() {
  if (!analysisResults) {
    showToast('Run analysis first!', 'error');
    return;
  }

  const resumeText = currentText || document.getElementById('resumeText').value.trim();
  
  // Clean formatting
  const cleanText = resumeText
    .replace(/[►■♦✓❖●✦⚡🚀🎯💼]/g, '•')
    .replace(/\s{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Create and download
  const element = document.createElement('a');
  const file = new Blob([cleanText], { type: 'text/plain' });
  element.href = URL.createObjectURL(file);
  element.download = `Resume_ATS_Optimized_${new Date().toISOString().slice(0,10)}.txt`;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
  
  showToast('✅ Resume exported as plain text!', 'success');
}

/**
 * Export detected keywords for cover letter & job application
 */
function exportResumeAsKeywords() {
  if (!analysisResults) {
    showToast('Run analysis first!', 'error');
    return;
  }

  const { skills, keywords } = analysisResults;
  
  // Organize keywords by category
  let keywordReport = `RESUME ATS ANALYSIS - KEYWORDS & SKILLS REPORT\n`;
  keywordReport += `Generated: ${new Date().toLocaleDateString()}\n`;
  keywordReport += `${'='.repeat(60)}\n\n`;

  // Add detected skills by category
  keywordReport += `DETECTED SKILLS BY CATEGORY:\n`;
  keywordReport += `${'-'.repeat(60)}\n`;
  
  Object.entries(skills).forEach(([category, skillList]) => {
    if (Array.isArray(skillList) && skillList.length > 0) {
      const categoryName = category
        .replace(/_/g, ' ')
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      keywordReport += `\n${categoryName} (${skillList.length}):\n`;
      skillList.forEach(skill => {
        keywordReport += `  • ${skill}\n`;
      });
    }
  });

  // Add top keywords
  keywordReport += `\n${'-'.repeat(60)}\n`;
  keywordReport += `\nTOP KEYWORDS (for job matching):\n`;
  const topKeywords = (keywords || []).slice(0, 20);
  if (topKeywords.length > 0) {
    topKeywords.forEach(kw => {
      keywordReport += `  • ${kw}\n`;
    });
  } else {
    keywordReport += `  (No keywords detected - add job description to see matches)\n`;
  }

  // Recommendations for cover letter
  keywordReport += `\n${'-'.repeat(60)}\n`;
  keywordReport += `\nCOVER LETTER TIPS:\n`;
  keywordReport += `  1. Use keywords above that match the job description\n`;
  keywordReport += `  2. Emphasize your top 3-5 strongest skills\n`;
  keywordReport += `  3. Highlight quantified achievements\n`;
  keywordReport += `  4. Use power action verbs: engineered, architected, optimized\n`;
  keywordReport += `  5. Address specific requirements from the job post\n`;

  // Export as file
  const element = document.createElement('a');
  const file = new Blob([keywordReport], { type: 'text/plain' });
  element.href = URL.createObjectURL(file);
  element.download = `Resume_Keywords_Report_${new Date().toISOString().slice(0,10)}.txt`;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
  
  showToast('📋 Keywords report exported!', 'success');
}

// ============================================================
// ===== NEW FEATURE RENDER FUNCTIONS =====
// ============================================================

// ----- SALARY -----
function renderSalary(salary) {
  const rangeEl = document.getElementById('salaryRange');
  const metaEl = document.getElementById('salaryMeta');
  const tierEl = document.getElementById('salaryTier');
  if (rangeEl) rangeEl.textContent = salary.range;
  if (metaEl) metaEl.textContent = salary.tip;
  if (tierEl) tierEl.textContent = '🎯 ' + salary.tier;
}

// ----- RESUME LENGTH -----
function renderLength(lengthData) {
  const el = document.getElementById('lengthAnalysis');
  if (!el) return;
  el.innerHTML = `
    <div class="length-stat">
      <div class="length-stat-item">
        <div class="length-stat-num">${lengthData.words.toLocaleString()}</div>
        <div class="length-stat-label">Words</div>
      </div>
      <div class="length-stat-item">
        <div class="length-stat-num">~${lengthData.estimatedPages}</div>
        <div class="length-stat-label">Pages</div>
      </div>
      <div class="length-stat-item">
        <div class="length-stat-num">${lengthData.lengthScore}%</div>
        <div class="length-stat-label">Length Score</div>
      </div>
    </div>
    <div class="length-rec">${lengthData.recommendation}</div>
  `;
}

// ----- GRAMMAR -----
function renderGrammar(grammarData) {
  const el = document.getElementById('grammarIssues');
  const badge = document.getElementById('grammarScoreBadge');
  if (!el) return;

  const score = grammarData.grammarScore;
  if (badge) {
    badge.textContent = score + '%';
    badge.className = 'badge-score' + (score >= 80 ? '' : score >= 60 ? ' warn' : ' danger');
  }

  if (grammarData.issues.length === 0) {
    el.innerHTML = `<div style="color:var(--success);font-size:0.85rem;padding:0.5rem;">✅ No major grammar or style issues detected. Great job!</div>`;
    return;
  }

  el.innerHTML = grammarData.issues.slice(0, 12).map(issue => `
    <div class="grammar-issue ${issue.type}">
      <span class="gi-icon">${issue.type === 'error' ? '🔴' : issue.type === 'warning' ? '🟡' : 'ℹ️'}</span>
      <div>
        <div>${issue.text}</div>
        ${issue.example ? `<div class="grammar-example">Found: "${issue.example}"</div>` : ''}
      </div>
    </div>
  `).join('');
}

// ----- READABILITY -----
function renderReadability(readabilityData) {
  const el = document.getElementById('readabilityDetails');
  const badge = document.getElementById('readabilityBadge');
  if (!el) return;

  const score = readabilityData.readabilityScore;
  if (badge) {
    badge.textContent = readabilityData.readabilityLabel;
    badge.className = 'badge-score' + (score >= 70 ? '' : score >= 50 ? ' warn' : ' danger');
  }

  el.innerHTML = `
    <div class="readability-bar-wrap">
      <div class="readability-label-row">
        <span>Readability</span>
        <span>${readabilityData.readabilityLabel}</span>
      </div>
      <div class="readability-bar">
        <div class="readability-fill" style="width: 0%" id="readFill"></div>
      </div>
    </div>
    <p style="font-size:0.83rem;color:var(--text-secondary);line-height:1.6;">${readabilityData.readabilityTip}</p>
    <div class="readability-stats">
      <div class="readability-stat"><strong>${readabilityData.fleschScore}</strong><br>Flesch Score</div>
      <div class="readability-stat"><strong>${readabilityData.avgWordsPerSentence}</strong><br>Avg Words/Sentence</div>
      <div class="readability-stat"><strong>${readabilityData.avgSyllablesPerWord}</strong><br>Avg Syllables/Word</div>
    </div>
  `;
  setTimeout(() => {
    const fill = document.getElementById('readFill');
    if (fill) fill.style.width = score + '%';
  }, 200);
}

// ----- BULLET QUALITY -----
function renderBullets(bulletData) {
  const el = document.getElementById('bulletAnalysis');
  const badge = document.getElementById('bulletScoreBadge');
  if (!el) return;

  if (badge) {
    badge.textContent = bulletData.bulletScore + '% strong';
    badge.className = 'badge-score' + (bulletData.bulletScore >= 60 ? '' : bulletData.bulletScore >= 40 ? ' warn' : ' danger');
  }

  const summary = `<div style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:0.75rem;">
    Analyzed <strong>${bulletData.total}</strong> bullet points — 
    <span style="color:var(--success);">${bulletData.strongCount} strong ✅</span> · 
    <span style="color:var(--danger);">${bulletData.weakCount} need work ⚠️</span>
  </div>`;

  const bullets = bulletData.bullets.map(b => `
    <div class="bullet-item ${b.quality}">
      <span class="bullet-icon">${b.quality === 'strong' ? '💪' : b.quality === 'weak' ? '⚠️' : '📝'}</span>
      <div class="bullet-text">
        <div>${b.text}</div>
        <div class="bullet-tags">
          ${b.hasActionVerb ? '<span class="btag verb">✓ Action Verb</span>' : '<span class="btag tip">✗ Add action verb</span>'}
          ${b.hasMetric ? '<span class="btag metric">✓ Has Metric</span>' : '<span class="btag tip">✗ Add metric</span>'}
          ${b.tips.filter(t => t !== 'Start with an action verb' && t !== 'Add a metric or number').map(t => `<span class="btag tip">${t}</span>`).join('')}
        </div>
      </div>
    </div>
  `).join('');

  el.innerHTML = summary + bullets;
}

// ----- DUPLICATE WORDS -----
function renderDuplicates(duplicates) {
  const el = document.getElementById('duplicateWords');
  if (!el) return;

  if (!duplicates || duplicates.length === 0) {
    el.innerHTML = `<div style="color:var(--success);font-size:0.85rem;padding:0.5rem;">✅ No significantly overused words detected. Good vocabulary diversity!</div>`;
    return;
  }

  const maxCount = duplicates[0]?.count || 10;
  el.innerHTML = `
    <p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:0.75rem;">Words appearing 4+ times. Consider replacing some with synonyms for variety.</p>
    ${duplicates.map(d => `
      <div class="dup-word-row">
        <span class="dup-word">${d.word}</span>
        <div class="dup-bar-wrap">
          <div class="dup-bar"><div class="dup-fill" style="width:${Math.min(100, (d.count / maxCount) * 100)}%"></div></div>
        </div>
        <span class="dup-count">used ${d.count}x</span>
      </div>
    `).join('')}
  `;
}

// ----- JOB ROLE MATCHES -----
function renderRoleMatches(roleMatches) {
  const el = document.getElementById('roleMatches');
  if (!el) return;

  el.innerHTML = `
    <p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:0.75rem;">Based on your skills and experience, these roles best match your profile:</p>
    <div class="role-match-grid">
      ${roleMatches.slice(0, 5).map((role, i) => `
        <div class="role-match-item">
          <span style="font-size:1rem;">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🏷️'}</span>
          <span class="role-name">${role.title}</span>
          <div class="role-score-bar"><div class="role-score-fill" style="width:${role.score}%"></div></div>
          <span class="role-pct">${role.score}%</span>
        </div>
      `).join('')}
    </div>
  `;
}

// ----- LINKEDIN CHECKLIST -----
function renderLinkedIn(gaps) {
  const el = document.getElementById('linkedInChecklist');
  if (!el || !gaps) return;

  const detected = gaps.filter(g => g.detected).length;
  const total = gaps.length;

  el.innerHTML = `
    <div style="font-size:0.82rem;margin-bottom:0.75rem;">
      <span style="color:var(--success);font-weight:600;">${detected}</span> / ${total} profile elements found in your resume. 
      <span style="color:var(--text-muted);">Items marked ⚠️ should be added to your LinkedIn profile.</span>
    </div>
    ${gaps.map(item => `
      <div class="li-check-item ${item.detected ? 'detected' : 'missing'}">
        <span class="li-check-icon">${item.detected ? '✅' : '⚠️'}</span>
        <div>
          <div class="li-check-label">${item.label}</div>
          <div class="li-check-tip">${item.tip}</div>
        </div>
      </div>
    `).join('')}
  `;
}

// ----- SCORE HISTORY -----
const HISTORY_KEY = 'resumeai_score_history';

function saveScoreHistory(results) {
  try {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    history.unshift({
      score: results.atsScore,
      grade: results.overallGrade,
      skills: results.skillsScore,
      format: results.formatScore,
      impact: results.impactScore,
      date: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      industry: results.detectedIndustry || 'general'
    });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 10)));
  } catch (e) { /* localStorage unavailable */ }
}

function renderScoreHistory() {
  const el = document.getElementById('scoreHistory');
  if (!el) return;
  try {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    if (history.length === 0) {
      el.innerHTML = `<p style="color:var(--text-muted);font-size:0.85rem;">No history yet. Analyze a resume to start tracking your scores.</p>`;
      return;
    }
    el.innerHTML = history.map((h, i) => `
      <div class="history-item">
        <div class="history-score">${h.score}</div>
        <div class="history-info">
          <div style="font-size:0.85rem;font-weight:600;color:var(--text-primary);">Scan #${history.length - i}</div>
          <div class="history-date">${h.date} · ${h.industry}</div>
          <div class="history-grade" style="color:${h.score >= 85 ? 'var(--success)' : h.score >= 70 ? 'var(--accent)' : h.score >= 55 ? 'var(--warning)' : 'var(--danger)'};">${h.grade}</div>
        </div>
        <div>
          <div class="history-bar"><div class="history-bar-fill" style="width:${h.score}%"></div></div>
          <div style="font-size:0.7rem;color:var(--text-muted);margin-top:3px;text-align:right;">${h.score}%</div>
        </div>
      </div>
    `).join('');
  } catch (e) {
    el.innerHTML = `<p style="color:var(--text-muted);font-size:0.85rem;">History unavailable.</p>`;
  }
}

function clearHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY);
    renderScoreHistory();
    showToast('Score history cleared!', 'info');
  } catch (e) {}
}

// ----- INTERVIEW QUESTIONS -----
function generateInterviewQs() {
  if (!analysisResults) { showToast('Analyze a resume first!', 'error'); return; }
  const el = document.getElementById('interviewQuestions');
  if (!el) return;
  const questions = window.GeminiAnalyzer.generateInterviewQuestions(analysisResults.skills, analysisResults.detectedIndustry);
  el.innerHTML = questions.map(q => `
    <div class="iq-item">
      <div class="iq-type">${q.type}</div>
      <div class="iq-q">${q.q}</div>
    </div>
  `).join('');
  showToast('✅ Interview questions generated!', 'success');
}

// ----- EMAIL SUBJECT LINES -----
function generateEmailSubjects() {
  if (!analysisResults) { showToast('Analyze a resume first!', 'error'); return; }
  const el = document.getElementById('emailSubjects');
  if (!el) return;
  const resumeText = currentText || document.getElementById('resumeText').value.trim();
  const jd = document.getElementById('jobDescription').value.trim();
  const subjects = window.GeminiAnalyzer.generateEmailSubjects(resumeText, 'Software Engineer', 'the company');
  el.innerHTML = subjects.map(s => `
    <div class="email-subject-item" onclick="copyText('${s.replace(/'/g, "\\'")}')">
      <span>📧</span>
      <span style="flex:1;">${s}</span>
      <span class="copy-btn">Click to copy</span>
    </div>
  `).join('');
  showToast('✅ Email subjects generated! Click any to copy.', 'success');
}

function copyText(text) {
  navigator.clipboard.writeText(text)
    .then(() => showToast('📋 Copied to clipboard!', 'success'))
    .catch(() => showToast('Clipboard write failed.', 'error'));
}

// ----- ATS TEMPLATE DOWNLOAD -----
function downloadATSTemplate() {
  const { jsPDF } = window.jspdf || {};
  if (!jsPDF) { showToast('PDF library not loaded. Please refresh.', 'error'); return; }

  const doc = new jsPDF('p', 'mm', 'a4');
  const margin = 20;
  const pageW = doc.internal.pageSize.getWidth();
  let y = 25;

  doc.setFontSize(20); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 41, 59);
  doc.text('YOUR FULL NAME', margin, y); y += 8;

  doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 116, 139);
  doc.text('email@example.com | (555) 123-4567 | linkedin.com/in/yourname | github.com/yourname', margin, y); y += 12;

  doc.setDrawColor(99, 102, 241); doc.setLineWidth(0.8); doc.line(margin, y, pageW - margin, y); y += 8;

  const sections = [
    { title: 'PROFESSIONAL SUMMARY', body: 'Results-driven [Your Role] with X years of experience in [Industry/Domain]. Proven track record of [Key Achievement]. Passionate about [Your Value Proposition].' },
    { title: 'WORK EXPERIENCE', body: 'Job Title | Company Name | City, State | MM/YYYY – MM/YYYY\n• [Action verb] [task/project] resulting in [measurable outcome, e.g., 30% efficiency improvement]\n• [Action verb] [task/project] that [impact with metrics]\n• Led [initiative] serving [scale, e.g., 50K+ users] with [result]\n\nJob Title | Previous Company | City | MM/YYYY – MM/YYYY\n• [Action verb] [achievement with numbers]\n• [Action verb] [cross-functional collaboration example]' },
    { title: 'EDUCATION', body: 'Bachelor of Science, Computer Science | University Name | 2020\nGPA: X.X/4.0 | Relevant Coursework: Data Structures, Algorithms, Databases' },
    { title: 'TECHNICAL SKILLS', body: 'Languages: Python, JavaScript, TypeScript, SQL\nFrameworks: React, Node.js, Django, FastAPI\nCloud & DevOps: AWS, Docker, Kubernetes, GitHub Actions\nDatabases: PostgreSQL, MongoDB, Redis\nTools: Git, Jira, Figma, Postman' },
    { title: 'CERTIFICATIONS', body: 'AWS Certified Developer – Associate (2023)\nGoogle Cloud Professional Data Engineer (2022)' },
    { title: 'PROJECTS', body: 'Project Name | github.com/yourname/project\n• Built [what] using [technologies], achieving [result]\n• Open-source: [X] stars, [Y] contributors' }
  ];

  sections.forEach(s => {
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(51, 65, 85);
    doc.text(s.title, margin, y); y += 2;
    doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.3); doc.line(margin, y, pageW - margin, y); y += 5;

    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(71, 85, 105);
    const lines = doc.splitTextToSize(s.body, pageW - margin * 2);
    lines.forEach(line => {
      if (y > 275) { doc.addPage(); y = 20; }
      doc.text(line, margin, y); y += 4.5;
    });
    y += 5;
  });

  doc.save('ATS_Resume_Template.pdf');
  showToast('✅ ATS Template downloaded!', 'success');
}

// ----- BEFORE/AFTER COMPARISON -----
let originalResumeSnapshot = '';
function showComparison() {
  const el = document.getElementById('comparisonView');
  if (!el) return;
  const original = originalResumeSnapshot || currentText || document.getElementById('resumeText').value.trim();
  const enhanced = document.getElementById('enhancerTextEditor')?.value || '';
  if (!enhanced || enhanced === original) {
    showToast('Enhance your resume first in the Enhancer tab!', 'warning');
    return;
  }
  el.style.display = 'block';
  el.innerHTML = `
    <div class="comparison-grid">
      <div>
        <div class="comparison-label before">Before (Original)</div>
        <div class="comparison-pane before">${original}</div>
      </div>
      <div>
        <div class="comparison-label after">After (Enhanced)</div>
        <div class="comparison-pane after">${enhanced}</div>
      </div>
    </div>
  `;
  showToast('📊 Before/After comparison ready!', 'success');
}

// ----- DARK MODE TOGGLE -----
function toggleDarkMode() {
  document.body.classList.toggle('light-mode');
  const isDark = !document.body.classList.contains('light-mode');
  document.getElementById('darkIcon').style.display = isDark ? 'block' : 'none';
  document.getElementById('lightIcon').style.display = isDark ? 'none' : 'block';
  try { localStorage.setItem('resumeai_theme', isDark ? 'dark' : 'light'); } catch (e) {}
}

// Restore theme on page load
document.addEventListener('DOMContentLoaded', () => {
  try {
    const saved = localStorage.getItem('resumeai_theme');
    if (saved === 'light') {
      document.body.classList.add('light-mode');
      document.getElementById('darkIcon').style.display = 'none';
      document.getElementById('lightIcon').style.display = 'block';
    }
  } catch (e) {}
});

