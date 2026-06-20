/**
 * ResumeAI — Offline Rule-Based ATS Analyzer Engine v2.0
 * NEW: Grammar check, Readability score, Bullet analyzer, Industry scoring,
 *      Salary estimator, Job role matcher, Duplicate detector, Score history
 */

// ============================================================
// SKILLS DATABASE
// ============================================================
const SKILLS_DB = {
  programming: [
    'javascript', 'typescript', 'python', 'java', 'c\\+\\+', 'c#', 'golang', 'rust',
    'ruby', 'php', 'swift', 'kotlin', 'bash', 'shell', 'powershell', 'sql', 'html', 'css',
    'scala', 'r programming', 'matlab', 'perl', 'objective-c', 'dart', 'elixir', 'haskell'
  ],
  frameworks: [
    'react', 'angular', 'vue', 'next\\.js', 'nuxt\\.js', 'svelte', 'node\\.js', 'express',
    'django', 'flask', 'fastapi', 'spring boot', 'asp\\.net', 'ruby on rails', 'laravel',
    'tailwind', 'bootstrap', 'jquery', 'redux', 'graphql', 'nest\\.js', 'gatsby', 'remix',
    'flutter', 'react native', 'electron', 'three\\.js', 'd3\\.js'
  ],
  cloud: [
    'aws', 'azure', 'gcp', 'google cloud', 'kubernetes', 'docker', 'terraform', 'ansible',
    'jenkins', 'ci/cd', 'github actions', 'gitlab ci', 'serverless', 'cloudflare', 'nginx',
    'linux', 'devops', 'helm', 'prometheus', 'grafana', 'istio', 'vault', 'consul'
  ],
  databases: [
    'mysql', 'postgresql', 'mongodb', 'redis', 'sqlite', 'oracle', 'sql server',
    'cassandra', 'dynamodb', 'firebase', 'elasticsearch', 'mariadb', 'couchdb',
    'neo4j', 'influxdb', 'supabase', 'planetscale', 'cockroachdb'
  ],
  tools: [
    'git', 'github', 'gitlab', 'vs code', 'jira', 'confluence', 'trello', 'figma',
    'postman', 'webpack', 'vite', 'npm', 'yarn', 'pnpm', 'bitbucket', 'notion',
    'slack', 'linear', 'datadog', 'sentry', 'new relic', 'splunk', 'sonarqube'
  ],
  data: [
    'machine learning', 'deep learning', 'artificial intelligence', 'nlp', 'computer vision',
    'pandas', 'numpy', 'scikit-learn', 'tensorflow', 'pytorch', 'r programming', 'tableau',
    'power bi', 'spark', 'hadoop', 'data analytics', 'data science', 'llm', 'langchain',
    'airflow', 'dbt', 'snowflake', 'databricks', 'mlops', 'feature engineering', 'xgboost'
  ],
  soft: [
    'communication', 'leadership', 'teamwork', 'problem solving', 'time management',
    'critical thinking', 'adaptability', 'collaboration', 'agile', 'scrum',
    'project management', 'negotiation', 'mentoring', 'decision making',
    'strategic planning', 'stakeholder management', 'presentation', 'cross-functional'
  ],
  certifications: [
    'aws certified', 'certified scrum master', 'csm', 'pmp', 'cissp', 'ccna',
    'azure certified', 'gcp certified', 'comptia', 'itil', 'cka', 'ckad',
    'google analytics', 'salesforce certified', 'coursera', 'udacity', 'harvard'
  ]
};

// ============================================================
// ACTION VERBS
// ============================================================
const ACTION_VERBS = [
  'designed', 'implemented', 'engineered', 'developed', 'led', 'managed', 'optimized',
  'automated', 'built', 'created', 'launched', 'directed', 'oversaw', 'coordinated',
  'streamlined', 'reduced', 'increased', 'improved', 'delivered', 'generated', 'solved',
  'transformed', 'spearheaded', 'collaborated', 'analyzed', 'facilitated', 'executed',
  'architected', 'deployed', 'migrated', 'integrated', 'scaled', 'pioneered', 'accelerated',
  'mentored', 'negotiated', 'established', 'revamped', 'revitalized', 'consolidated',
  'championed', 'orchestrated', 'formulated', 'leveraged', 'maximized', 'minimized'
];

const WEAK_TO_STRONG_VERBS = {
  'worked on': 'engineered',
  'was responsible for': 'spearheaded',
  'helped with': 'collaborated on',
  'did': 'executed',
  'made': 'formulated',
  'assisted': 'facilitated',
  'managed': 'orchestrated',
  'led': 'spearheaded',
  'changed': 'transformed',
  'fixed': 'debugged',
  'improved': 'optimized',
  'created': 'pioneered',
  'set up': 'established',
  'showed': 'demonstrated',
  'started': 'initiated',
  'used': 'leveraged',
  'helped': 'supported',
  'worked with': 'collaborated with',
  'in charge of': 'directed',
  'responsible for': 'oversaw',
  'part of': 'contributed to'
};

// ============================================================
// COMMON GRAMMAR ERRORS (offline pattern-based)
// ============================================================
const GRAMMAR_PATTERNS = [
  { pattern: /\bi am\b/gi, msg: 'Avoid "I am" in resumes. Use third-person or omit the subject.' },
  { pattern: /\bmy \w+/gi, msg: 'Avoid possessive "my" — it sounds informal in resumes.' },
  { pattern: /\b(teh|hte|adn|nad|thatn|taht)\b/gi, msg: 'Possible spelling error detected.' },
  { pattern: /\bvery\s+(good|nice|bad|big|small)\b/gi, msg: 'Replace vague intensifiers with specific metrics or stronger adjectives.' },
  { pattern: /\b(etc\.?)\b/gi, msg: 'Avoid "etc." — be specific about what you mean.' },
  { pattern: /\b(stuff|things|lots)\b/gi, msg: 'Informal words detected ("stuff", "things", "lots"). Use professional terminology.' },
  { pattern: /responsible for/gi, msg: 'Weak phrase "responsible for" — replace with a direct action verb.' },
  { pattern: /in charge of/gi, msg: 'Weak phrase "in charge of" — replace with "directed", "managed", or "oversaw".' },
  { pattern: /worked on/gi, msg: 'Vague phrase "worked on" — use a specific action verb instead.' },
  { pattern: /\b(hardworking|team player|go-getter|self-starter|passionate about)\b/gi, msg: 'Cliché phrase detected. Demonstrate these traits with examples instead.' }
];

// ============================================================
// INDUSTRY KEYWORD SETS
// ============================================================
const INDUSTRY_PROFILES = {
  tech: {
    label: 'Technology & Engineering',
    keywords: ['software', 'api', 'backend', 'frontend', 'microservices', 'devops', 'cloud', 'database', 'algorithm', 'code', 'deploy', 'architecture'],
    bonusSkills: ['react', 'node.js', 'aws', 'docker', 'kubernetes', 'python', 'typescript'],
    salaryBase: 90000
  },
  finance: {
    label: 'Finance & Banking',
    keywords: ['financial', 'revenue', 'budget', 'roi', 'p&l', 'audit', 'compliance', 'risk', 'portfolio', 'equity', 'trading', 'accounting', 'forecast'],
    bonusSkills: ['excel', 'bloomberg', 'sql', 'tableau', 'power bi', 'python', 'r programming'],
    salaryBase: 85000
  },
  marketing: {
    label: 'Marketing & Growth',
    keywords: ['campaign', 'brand', 'seo', 'sem', 'social media', 'conversion', 'funnel', 'ctr', 'cpc', 'roi', 'content', 'engagement', 'analytics'],
    bonusSkills: ['google analytics', 'hubspot', 'salesforce', 'facebook ads', 'adobe', 'figma'],
    salaryBase: 70000
  },
  healthcare: {
    label: 'Healthcare & Medical',
    keywords: ['patient', 'clinical', 'medical', 'diagnosis', 'treatment', 'hospital', 'ehr', 'hipaa', 'fda', 'research', 'pharmaceutical', 'nursing'],
    bonusSkills: ['epic', 'meditech', 'cerner', 'python', 'r programming', 'sql'],
    salaryBase: 80000
  },
  general: {
    label: 'General / Other',
    keywords: ['management', 'operations', 'strategy', 'stakeholder', 'process', 'improvement', 'leadership', 'cross-functional', 'metrics'],
    bonusSkills: ['excel', 'powerpoint', 'project management', 'agile', 'scrum'],
    salaryBase: 65000
  }
};

// ============================================================
// JOB ROLE TEMPLATES
// ============================================================
const JOB_ROLES = [
  { title: 'Frontend Developer', keywords: ['react', 'angular', 'vue', 'css', 'html', 'javascript', 'typescript', 'ui', 'ux'] },
  { title: 'Backend Developer', keywords: ['node.js', 'express', 'django', 'flask', 'api', 'rest', 'database', 'server', 'microservices'] },
  { title: 'Full Stack Developer', keywords: ['react', 'node.js', 'database', 'api', 'frontend', 'backend', 'javascript', 'typescript'] },
  { title: 'DevOps Engineer', keywords: ['docker', 'kubernetes', 'ci/cd', 'jenkins', 'aws', 'terraform', 'ansible', 'linux', 'monitoring'] },
  { title: 'Data Scientist', keywords: ['python', 'machine learning', 'data', 'pandas', 'numpy', 'sklearn', 'tensorflow', 'statistics', 'jupyter'] },
  { title: 'Data Engineer', keywords: ['spark', 'hadoop', 'airflow', 'sql', 'etl', 'pipeline', 'databricks', 'kafka', 'snowflake'] },
  { title: 'ML Engineer', keywords: ['machine learning', 'deep learning', 'pytorch', 'tensorflow', 'mlops', 'model', 'training', 'deployment'] },
  { title: 'Cloud Architect', keywords: ['aws', 'azure', 'gcp', 'cloud', 'architecture', 'security', 'networking', 'cost', 'terraform'] },
  { title: 'Product Manager', keywords: ['product', 'roadmap', 'user story', 'stakeholder', 'agile', 'launch', 'metrics', 'customer', 'strategy'] },
  { title: 'UX/UI Designer', keywords: ['figma', 'design', 'user research', 'wireframe', 'prototype', 'accessibility', 'usability', 'sketch'] },
  { title: 'Cybersecurity Analyst', keywords: ['security', 'penetration', 'vulnerability', 'firewall', 'cissp', 'siem', 'compliance', 'risk', 'encryption'] },
  { title: 'Project Manager', keywords: ['project', 'pmp', 'stakeholder', 'budget', 'timeline', 'agile', 'scrum', 'delivery', 'risk management'] },
  { title: 'Marketing Manager', keywords: ['campaign', 'brand', 'seo', 'social media', 'analytics', 'conversion', 'content', 'email marketing'] },
  { title: 'Financial Analyst', keywords: ['financial', 'modeling', 'excel', 'forecast', 'valuation', 'p&l', 'budget', 'reporting', 'roi'] },
  { title: 'Software Engineer', keywords: ['code', 'software', 'develop', 'engineering', 'algorithm', 'system', 'programming', 'debug', 'testing'] }
];

// ============================================================
// INTERVIEW QUESTION TEMPLATES
// ============================================================
const INTERVIEW_TEMPLATES = {
  technical: [
    'Walk me through your experience with {skill}.',
    'How have you used {skill} in a production environment?',
    'Describe the most complex {skill} problem you have solved.',
    'What is your approach to debugging issues in {skill}?'
  ],
  behavioral: [
    'Tell me about a time you led a team through a difficult challenge.',
    'Describe a situation where you had to meet a tight deadline.',
    'How do you handle conflicts within a team?',
    'Tell me about your most significant accomplishment in your last role.',
    'How do you prioritize tasks when you have multiple deadlines?',
    'Describe a time you had to learn a new technology quickly.',
    'Tell me about a project that failed and what you learned from it.',
    'How do you handle negative feedback from a manager or peer?'
  ],
  roleSpecific: [
    'Where do you see this role heading in 3-5 years?',
    'How would you approach your first 90 days in this position?',
    'What metrics would you use to measure your success in this role?'
  ]
};

// ============================================================
// LINKEDIN GAP CHECKLIST
// ============================================================
const LINKEDIN_CHECKLIST = [
  { id: 'photo', label: 'Professional Profile Photo', tip: 'Add a professional headshot — profiles with photos get 21x more views.' },
  { id: 'headline', label: 'Compelling Headline', tip: 'Use "Title | Skill | Value" format e.g. "Senior Engineer | React & Node | Building Scalable APIs".' },
  { id: 'about', label: 'About Section (200+ words)', tip: 'Tell your story — skills, achievements, and what you are looking for.' },
  { id: 'experience', label: 'All Jobs Listed with Bullets', tip: 'Every role should have 3-5 bullet points with quantified achievements.' },
  { id: 'skills', label: '5+ Skills with Endorsements', tip: 'Get at least 5 endorsements per top skill for credibility.' },
  { id: 'education', label: 'Education Fully Filled', tip: 'Include GPA, activities, awards if relevant.' },
  { id: 'certifications', label: 'Certifications Listed', tip: 'LinkedIn badges make your certifications visible to recruiters.' },
  { id: 'featured', label: 'Featured Section (Projects/Links)', tip: 'Pin GitHub repos, case studies, or portfolio links to the top.' },
  { id: 'recommendations', label: '2+ Recommendations', tip: 'Ask managers or peers for written recommendations.' },
  { id: 'vanity_url', label: 'Custom LinkedIn URL', tip: 'Set linkedin.com/in/yourname for a professional appearance.' },
  { id: 'opentowork', label: '#OpenToWork Frame / Status', tip: 'Enable "Open To Work" if job hunting — recruiters filter by this.' },
  { id: 'activity', label: 'Recent Activity / Posts', tip: 'Post 1-2x per week in your domain to boost visibility.' }
];

// ============================================================
// MAIN ANALYZER
// ============================================================
const ATSAnalyzer = {

  // ---------------------------------------------------------
  // GRAMMAR CHECK
  // ---------------------------------------------------------
  checkGrammar(resumeText) {
    const issues = [];
    GRAMMAR_PATTERNS.forEach(({ pattern, msg }) => {
      const matches = resumeText.match(pattern);
      if (matches) {
        issues.push({ type: 'warning', text: msg, example: matches[0] });
      }
    });

    // Check sentence length (very long sentences are hard to parse)
    const sentences = resumeText.split(/[.!?]+/).filter(s => s.trim().length > 10);
    sentences.forEach(s => {
      const wordCount = s.trim().split(/\s+/).length;
      if (wordCount > 40) {
        issues.push({ type: 'info', text: 'Very long sentence detected — split it into two for clarity and ATS parsing.', example: s.trim().slice(0, 60) + '...' });
      }
    });

    // Spelling check (common misspellings)
    const misspellings = {
      'expereince': 'experience', 'managment': 'management', 'developement': 'development',
      'recieve': 'receive', 'seperate': 'separate', 'occured': 'occurred',
      'untill': 'until', 'sucessful': 'successful', 'definately': 'definitely',
      'adress': 'address', 'recomend': 'recommend', 'begining': 'beginning',
      'existance': 'existence', 'occurance': 'occurrence', 'prefered': 'preferred',
      'refered': 'referred', 'truely': 'truly', 'collegue': 'colleague'
    };
    for (const [wrong, correct] of Object.entries(misspellings)) {
      if (new RegExp('\\b' + wrong + '\\b', 'i').test(resumeText)) {
        issues.push({ type: 'error', text: `Spelling error: "${wrong}" should be "${correct}".`, example: wrong });
      }
    }

    const grammarScore = Math.max(40, 100 - issues.length * 10);
    return { issues, grammarScore, issueCount: issues.length };
  },

  // ---------------------------------------------------------
  // READABILITY SCORE (Flesch-Kincaid)
  // ---------------------------------------------------------
  calcReadability(resumeText) {
    const sentences = resumeText.split(/[.!?]+/).filter(s => s.trim().length > 5);
    const words = resumeText.trim().split(/\s+/).filter(w => w.length > 0);
    const syllableCount = words.reduce((sum, word) => {
      // Count syllables heuristically
      word = word.toLowerCase().replace(/[^a-z]/g, '');
      if (word.length <= 3) return sum + 1;
      word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
      word = word.replace(/^y/, '');
      const syls = word.match(/[aeiouy]{1,2}/g);
      return sum + (syls ? syls.length : 1);
    }, 0);

    const numSentences = Math.max(1, sentences.length);
    const numWords = Math.max(1, words.length);

    // Flesch Reading Ease
    const fleschScore = 206.835 - 1.015 * (numWords / numSentences) - 84.6 * (syllableCount / numWords);
    const clampedFlesch = Math.max(0, Math.min(100, Math.round(fleschScore)));

    let readabilityLabel = '';
    let readabilityTip = '';
    let readabilityScore = 0;

    if (clampedFlesch >= 70) {
      readabilityLabel = 'Excellent — Easy to read';
      readabilityScore = 90;
      readabilityTip = 'Your resume is clear and readable. Recruiters can quickly scan and understand your experience.';
    } else if (clampedFlesch >= 55) {
      readabilityLabel = 'Good — Standard readability';
      readabilityScore = 72;
      readabilityTip = 'Readability is good. Use shorter sentences and simple words where possible.';
    } else if (clampedFlesch >= 35) {
      readabilityLabel = 'Fair — Somewhat complex';
      readabilityScore = 55;
      readabilityTip = 'Some sentences are long or complex. Break them up and avoid jargon-heavy phrases.';
    } else {
      readabilityLabel = 'Poor — Too complex';
      readabilityScore = 38;
      readabilityTip = 'Resume is hard to read. Simplify sentence structure and use active voice throughout.';
    }

    return {
      fleschScore: clampedFlesch,
      readabilityLabel,
      readabilityScore,
      readabilityTip,
      avgWordsPerSentence: Math.round(numWords / numSentences),
      avgSyllablesPerWord: (syllableCount / numWords).toFixed(1)
    };
  },

  // ---------------------------------------------------------
  // BULLET QUALITY ANALYZER
  // ---------------------------------------------------------
  analyzeBullets(resumeText) {
    const lines = resumeText.split(/\n+/).map(l => l.trim());
    const bullets = lines.filter(l => l.startsWith('•') || l.startsWith('-') || l.startsWith('*') || (l.length > 30 && l.length < 300));

    const numberRegex = /\b(\d+%?|\d+\s*million|\d+\s*k|\d+\s*x|\$[\d,]+|\d+\s*years?|\d+\s*months?|thousands?|millions?)\b/i;

    const analyzed = bullets.slice(0, 20).map(bullet => {
      const text = bullet.replace(/^[•\-\*]\s*/, '');
      const wordsInBullet = text.toLowerCase().split(/\W+/);
      const hasActionVerb = wordsInBullet.slice(0, 3).some(w => ACTION_VERBS.includes(w));
      const hasMetric = numberRegex.test(text);
      const wordCount = wordsInBullet.filter(w => w.length > 0).length;
      const tooShort = wordCount < 6;
      const tooLong = wordCount > 35;

      let quality = 'good';
      let tips = [];
      if (!hasActionVerb) { quality = 'weak'; tips.push('Start with an action verb'); }
      if (!hasMetric) { tips.push('Add a metric or number'); }
      if (tooShort) { quality = 'weak'; tips.push('Too short — expand the bullet'); }
      if (tooLong) { tips.push('Consider splitting into 2 bullets'); }
      if (hasActionVerb && hasMetric && !tooShort && !tooLong) quality = 'strong';

      return { text: text.slice(0, 120), hasActionVerb, hasMetric, wordCount, quality, tips };
    });

    const strongCount = analyzed.filter(b => b.quality === 'strong').length;
    const weakCount = analyzed.filter(b => b.quality === 'weak').length;
    const bulletScore = analyzed.length > 0 ? Math.round((strongCount / analyzed.length) * 100) : 50;

    return { bullets: analyzed, strongCount, weakCount, bulletScore, total: analyzed.length };
  },

  // ---------------------------------------------------------
  // DUPLICATE WORD DETECTOR
  // ---------------------------------------------------------
  detectDuplicates(resumeText) {
    const stopWords = new Set(['the', 'and', 'for', 'with', 'that', 'this', 'our', 'are', 'will', 'your', 'about', 'from', 'their', 'have', 'been', 'was', 'were', 'a', 'an', 'in', 'on', 'of', 'to', 'at', 'by', 'or', 'not', 'but', 'as', 'if', 'my', 'we', 'it', 'is', 'be', 'do', 'so', 'he', 'she', 'they', 'i', 'you']);
    const words = resumeText.toLowerCase().split(/\W+/).filter(w => w.length > 3 && !stopWords.has(w));
    const freq = {};
    words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
    const duplicates = Object.entries(freq)
      .filter(([, count]) => count >= 4)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));
    return duplicates;
  },

  // ---------------------------------------------------------
  // SALARY ESTIMATOR
  // ---------------------------------------------------------
  estimateSalary(skills, industry = 'general', resumeText = '') {
    const base = INDUSTRY_PROFILES[industry]?.salaryBase || 65000;
    const allSkills = Object.values(skills).flat().map(s => s.toLowerCase());

    // Experience years extraction
    const yearsMatch = resumeText.match(/(\d+)\+?\s*years?\s*(of\s+)?(experience|exp)/i);
    const years = yearsMatch ? parseInt(yearsMatch[1]) : 2;

    // Skill premium
    const premiumSkills = { 'aws': 12000, 'kubernetes': 10000, 'react': 8000, 'machine learning': 15000, 'deep learning': 18000, 'pytorch': 15000, 'tensorflow': 14000, 'python': 10000, 'golang': 12000, 'rust': 14000, 'scala': 11000, 'spark': 13000, 'snowflake': 12000 };
    let skillBonus = 0;
    allSkills.forEach(skill => {
      if (premiumSkills[skill]) skillBonus += premiumSkills[skill];
    });
    skillBonus = Math.min(skillBonus, 40000); // cap at 40k bonus

    // Cert premium
    const hasCerts = /certified|certification|aws certified|pmp|cissp|gcp certified/i.test(resumeText);
    const certBonus = hasCerts ? 8000 : 0;

    // Experience premium
    let expBonus = 0;
    if (years >= 8) expBonus = 35000;
    else if (years >= 5) expBonus = 22000;
    else if (years >= 3) expBonus = 12000;
    else if (years >= 1) expBonus = 5000;

    const low = Math.round((base + expBonus) / 1000) * 1000;
    const high = Math.round((base + expBonus + skillBonus + certBonus) / 1000) * 1000;
    const formatted = (n) => '$' + n.toLocaleString();

    return {
      range: `${formatted(low)} – ${formatted(high)}`,
      low, high,
      years,
      tier: years >= 7 ? 'Senior / Principal' : years >= 4 ? 'Mid-Level' : years >= 2 ? 'Junior / Mid' : 'Entry Level',
      tip: `Based on ${years} years experience, ${allSkills.length} detected skills, industry: ${INDUSTRY_PROFILES[industry]?.label || 'General'}.`
    };
  },

  // ---------------------------------------------------------
  // JOB ROLE MATCHER
  // ---------------------------------------------------------
  matchJobRole(resumeText) {
    const text = resumeText.toLowerCase();
    const scores = JOB_ROLES.map(role => {
      const matches = role.keywords.filter(kw => text.includes(kw)).length;
      return { title: role.title, score: Math.round((matches / role.keywords.length) * 100), matches };
    });
    scores.sort((a, b) => b.score - a.score);
    return scores.slice(0, 5);
  },

  // ---------------------------------------------------------
  // INTERVIEW QUESTION GENERATOR
  // ---------------------------------------------------------
  generateInterviewQuestions(skills, jobTitle = '') {
    const allSkills = Object.values(skills).flat().slice(0, 6);
    const questions = [];

    // Technical questions based on skills
    allSkills.slice(0, 3).forEach(skill => {
      const template = INTERVIEW_TEMPLATES.technical[Math.floor(Math.random() * INTERVIEW_TEMPLATES.technical.length)];
      questions.push({ type: 'Technical', q: template.replace('{skill}', skill) });
    });

    // Behavioral questions
    const shuffled = [...INTERVIEW_TEMPLATES.behavioral].sort(() => Math.random() - 0.5);
    shuffled.slice(0, 5).forEach(q => {
      questions.push({ type: 'Behavioral', q });
    });

    // Role specific
    INTERVIEW_TEMPLATES.roleSpecific.forEach(q => {
      questions.push({ type: 'Role-Specific', q });
    });

    return questions.slice(0, 12);
  },

  // ---------------------------------------------------------
  // EMAIL SUBJECT LINE GENERATOR
  // ---------------------------------------------------------
  generateEmailSubjects(resumeText, jobTitle = 'Software Engineer', companyName = 'the company') {
    const nameMatch = resumeText.match(/^([A-Z][a-z]+ [A-Z][a-z]+)/m);
    const name = nameMatch ? nameMatch[1] : 'Applicant';
    const yearsMatch = resumeText.match(/(\d+)\+?\s*years?/i);
    const years = yearsMatch ? yearsMatch[1] : '';

    return [
      `Application: ${jobTitle} — ${name}`,
      `${jobTitle} Application | ${years ? years + '+ Years Experience | ' : ''}${name}`,
      `Experienced ${jobTitle} Seeking Role at ${companyName} — ${name}`,
      `[Application] ${jobTitle} | ${name} | Passionate & Proven`,
      `${name} — ${jobTitle} Candidate | Resume Attached`
    ];
  },

  // ---------------------------------------------------------
  // LINKEDIN GAP ANALYSIS
  // ---------------------------------------------------------
  analyzeLinkedInGaps(resumeText) {
    const text = resumeText.toLowerCase();
    const results = LINKEDIN_CHECKLIST.map(item => {
      let detected = false;
      if (item.id === 'experience') detected = /experience|employment|work/i.test(text);
      else if (item.id === 'education') detected = /education|university|degree|college/i.test(text);
      else if (item.id === 'certifications') detected = /certif|certified/i.test(text);
      else if (item.id === 'activity') detected = false; // Can't detect from resume
      else if (item.id === 'photo') detected = false; // Can't detect from resume
      else if (item.id === 'vanity_url') detected = /linkedin\.com\/in\/[a-z0-9-]+/i.test(text);
      return { ...item, detected };
    });
    return results;
  },

  // ---------------------------------------------------------
  // INDUSTRY SCORER
  // ---------------------------------------------------------
  detectIndustry(resumeText) {
    const text = resumeText.toLowerCase();
    let best = { industry: 'general', score: 0 };
    for (const [key, profile] of Object.entries(INDUSTRY_PROFILES)) {
      const score = profile.keywords.filter(kw => text.includes(kw)).length;
      if (score > best.score) best = { industry: key, score };
    }
    return best.industry;
  },

  // ---------------------------------------------------------
  // RESUME LENGTH CHECKER
  // ---------------------------------------------------------
  checkLength(resumeText) {
    const words = resumeText.trim().split(/\s+/).filter(w => w.length > 0).length;
    const estimatedPages = Math.ceil(words / 400);
    let recommendation = '';
    let lengthScore = 80;

    if (words < 200) {
      recommendation = 'Your resume is too short. Add more details about your experience and achievements.';
      lengthScore = 40;
    } else if (words < 400) {
      recommendation = 'Resume is on the shorter side. Consider adding more bullet points and details.';
      lengthScore = 60;
    } else if (words <= 900) {
      recommendation = '1-page resume — ideal for candidates with under 10 years experience.';
      lengthScore = 95;
    } else if (words <= 1400) {
      recommendation = '2-page resume — appropriate for senior professionals with extensive experience.';
      lengthScore = 90;
    } else {
      recommendation = 'Resume may be too long (3+ pages). Trim non-essential information. Recruiters spend an average of 7 seconds per resume.';
      lengthScore = 55;
    }

    return { words, estimatedPages, recommendation, lengthScore };
  },

  // ---------------------------------------------------------
  // MAIN ANALYZE FUNCTION
  // ---------------------------------------------------------
  analyze(resumeText, jobDescription = '', industry = 'auto') {
    if (!resumeText) return null;
    const cleanText = resumeText.toLowerCase();

    // Auto-detect industry if not specified
    const detectedIndustry = industry === 'auto' ? this.detectIndustry(resumeText) : industry;

    // 1. EXTRACT SKILLS
    const detectedSkills = {};
    let totalSkillsCount = 0;
    for (const [category, list] of Object.entries(SKILLS_DB)) {
      detectedSkills[category] = [];
      list.forEach(skill => {
        const regex = new RegExp('\\b' + skill + '\\b', 'i');
        if (regex.test(resumeText)) {
          let displayName = skill.replace('\\+', '+').replace('\\.', '.');
          displayName = displayName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          if (['Aws', 'Gcp', 'Sql', 'Nlp', 'C#', 'C++', 'Ci/cd', 'Itil', 'Ccna', 'Pmp', 'Csm'].includes(displayName)) {
            displayName = displayName.toUpperCase();
          }
          detectedSkills[category].push(displayName);
          totalSkillsCount++;
        }
      });
    }

    // 2. FORMAT ANALYSIS
    const formatWarnings = [];
    const detectedSections = {
      experience: /\b(experience|employment|work history|career|history|background)\b/i.test(resumeText),
      education: /\b(education|academic|university|degree|college)\b/i.test(resumeText),
      skills: /\b(skills|technologies|expertise|proficiencies|tools)\b/i.test(resumeText),
      contact: /\b(contact|email|phone|address|linkedin|github)\b/i.test(resumeText),
      summary: /\b(summary|objective|profile|about me)\b/i.test(resumeText)
    };

    if (!detectedSections.experience) formatWarnings.push('Missing "Professional Experience" section header.');
    if (!detectedSections.education) formatWarnings.push('Missing "Education" section header.');
    if (!detectedSections.skills) formatWarnings.push('Missing dedicated "Skills" section header.');

    const hasEmail = /[\w.-]+@[\w.-]+\.\w+/.test(resumeText);
    const hasPhone = /(\+?\d{1,4}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(resumeText);
    const hasLinkedIn = /linkedin\.com\/in\/[\w-]+/i.test(resumeText);
    const hasGitHub = /github\.com\/[\w-]+/i.test(resumeText);

    if (!hasEmail) formatWarnings.push('Email address not detected.');
    if (!hasPhone) formatWarnings.push('Phone number not detected.');
    if (!hasLinkedIn) formatWarnings.push('LinkedIn profile link missing.');
    if (!hasGitHub) formatWarnings.push('GitHub profile link missing (recommended for tech roles).');

    const hasSpecialChars = /[►■♦✓❖●]/.test(resumeText);
    if (hasSpecialChars) formatWarnings.push('Non-standard bullet characters detected. Use plain • bullets.');

    // 3. LENGTH CHECK
    const lengthData = this.checkLength(resumeText);
    let formatScore = 100;
    formatScore -= formatWarnings.length * 8;
    formatScore = Math.max(30, Math.min(100, formatScore));

    // 4. IMPACT ANALYSIS
    const bulletData = this.analyzeBullets(resumeText);
    const bullets = resumeText.split(/\n+/).map(l => l.trim()).filter(l => l.startsWith('•') || l.startsWith('-') || l.startsWith('*') || l.length > 40);
    const totalBullets = bullets.length;
    let quantifiedBulletsCount = 0;
    let actionVerbsUsed = 0;
    const numberRegex = /\b(\d+%?|\d+\s*million|\d+\s*k|\d+\s*x|thousands)\b/i;
    bullets.forEach(bullet => {
      if (numberRegex.test(bullet)) quantifiedBulletsCount++;
      const wordsInBullet = bullet.toLowerCase().split(/\W+/);
      if (wordsInBullet.some(w => ACTION_VERBS.includes(w))) actionVerbsUsed++;
    });
    const quantRatio = totalBullets > 0 ? (quantifiedBulletsCount / totalBullets) * 100 : 0;
    const verbRatio = totalBullets > 0 ? (actionVerbsUsed / totalBullets) * 100 : 0;
    let impactScore = 40;
    if (totalBullets > 0) {
      impactScore = Math.round((quantRatio * 0.6) + (Math.min(100, verbRatio) * 0.4));
    }
    impactScore = Math.max(35, Math.min(100, impactScore));

    // 5. SKILLS SCORE
    let skillsScore = Math.min(100, Math.round((totalSkillsCount / 18) * 100));
    skillsScore = Math.max(40, skillsScore);

    // 6. GRAMMAR & READABILITY
    const grammarData = this.checkGrammar(resumeText);
    const readabilityData = this.calcReadability(resumeText);

    // 7. DUPLICATE WORDS
    const duplicates = this.detectDuplicates(resumeText);

    // 8. JOB MATCHING
    let jobMatch = null;
    let keywordsScore = 50;
    let presentKeywords = [];
    let missingKeywords = [];
    const words = resumeText.trim().split(/\s+/).filter(w => w.length > 0);
    const resumeWords = new Set(words.map(w => w.toLowerCase().replace(/[^a-z0-9+#.-]/g, '')));

    if (jobDescription && jobDescription.trim().length > 10) {
      const jdWordsRaw = jobDescription.toLowerCase().split(/[\s,./()]+/).filter(w => w.length > 2);
      const stopWords = new Set(['the', 'and', 'for', 'you', 'with', 'that', 'this', 'our', 'are', 'will', 'your', 'about', 'from', 'their', 'have', 'work', 'experience', 'team', 'skills', 'ability', 'must', 'role', 'job', 'requirements', 'candidate']);
      const jdKeywords = [...new Set(jdWordsRaw.filter(w => !stopWords.has(w)))];
      jdKeywords.forEach(kw => {
        if (resumeWords.has(kw)) presentKeywords.push(kw);
        else missingKeywords.push(kw);
      });
      presentKeywords = [...new Set(presentKeywords)].slice(0, 15);
      missingKeywords = [...new Set(missingKeywords)].filter(w => Object.values(SKILLS_DB).flat().includes(w) || w.length > 4).slice(0, 12);
      const matchScore = (presentKeywords.length + missingKeywords.length) > 0
        ? Math.round((presentKeywords.length / (presentKeywords.length + missingKeywords.length)) * 100) : 70;
      jobMatch = {
        score: matchScore,
        matchSummary: matchScore >= 75 ? 'Strong job description alignment!' : matchScore >= 55 ? 'Moderate alignment. Add missing keywords.' : 'Low match. Customize your resume for this role.',
        missingSkills: missingKeywords,
        keyRequirements: missingKeywords.slice(0, 5),
        matchedSkills: presentKeywords
      };
      keywordsScore = matchScore;
    } else {
      presentKeywords = Object.values(detectedSkills).flat().slice(0, 10).map(s => s.toLowerCase());
      missingKeywords = ['(Add job description for full keyword gap analysis)'];
      keywordsScore = skillsScore;
    }

    // 9. SALARY ESTIMATE
    const salaryData = this.estimateSalary(detectedSkills, detectedIndustry, resumeText);

    // 10. JOB ROLE MATCH
    const roleMatches = this.matchJobRole(resumeText);

    // 11. OVERALL ATS SCORE
    const weights = jobMatch
      ? { skills: 0.25, format: 0.25, impact: 0.25, keywords: 0.25 }
      : { skills: 0.35, format: 0.35, impact: 0.30 };
    let atsScore = jobMatch
      ? Math.round((skillsScore * weights.skills) + (formatScore * weights.format) + (impactScore * weights.impact) + (keywordsScore * weights.keywords))
      : Math.round((skillsScore * weights.skills) + (formatScore * weights.format) + (impactScore * weights.impact));
    atsScore = Math.max(30, Math.min(99, atsScore));

    let grade = 'NEEDS WORK';
    if (atsScore >= 85) grade = 'EXCELLENT';
    else if (atsScore >= 70) grade = 'GOOD';
    else if (atsScore >= 55) grade = 'FAIR';

    // 12. RECOMMENDATIONS
    const recommendations = [];
    if (!detectedSections.experience || !detectedSections.skills) {
      recommendations.push({ type: 'critical', icon: '🚨', title: 'Core Sections Missing', desc: 'Add explicit "Work Experience" and "Skills" section headers for ATS visibility.' });
    }
    if (quantRatio < 20) {
      recommendations.push({ type: 'critical', icon: '📊', title: 'Low Quantification Rate', desc: `Only ${Math.round(quantRatio)}% of bullets have numbers. Add metrics: "Increased sales by 15%", "Led team of 4".` });
    } else {
      recommendations.push({ type: 'success', icon: '✅', title: 'Strong Quantification', desc: `${Math.round(quantRatio)}% of bullets contain measurable metrics — great for recruiters.` });
    }
    if (verbRatio < 40) {
      recommendations.push({ type: 'warning', icon: '⚡', title: 'Weak Action Verbs', desc: 'Upgrade phrases like "responsible for" to strong verbs: "spearheaded", "engineered", "orchestrated".' });
    }
    if (!hasEmail || !hasPhone) {
      recommendations.push({ type: 'critical', icon: '✉️', title: 'Contact Info Missing', desc: 'Email and phone are crucial. Recruiters cannot contact you without them.' });
    }
    if (grammarData.issueCount > 3) {
      recommendations.push({ type: 'warning', icon: '📝', title: 'Grammar Issues Detected', desc: `${grammarData.issueCount} grammar/style issues found. Use the Grammar Check tab for details.` });
    }
    if (duplicates.length > 3) {
      recommendations.push({ type: 'warning', icon: '🔁', title: 'Repetitive Words', desc: `Words like "${duplicates.slice(0, 2).map(d => d.word).join('", "')}" appear too frequently. Diversify your vocabulary.` });
    }
    recommendations.push({ type: 'success', icon: '📁', title: 'ATS File Format', desc: 'Use simple vertical layouts, Arial/Calibri fonts, and save as a clean text-based PDF.' });

    const highPriorityImprovements = [];
    if (quantRatio < 20) highPriorityImprovements.push('Add percentage improvements, scale metrics ($), or timelines to at least 4 bullet points.');
    if (!hasEmail || !hasPhone) highPriorityImprovements.push('Insert clear contact info (Email, Phone, LinkedIn) at the top of the document.');
    if (formatWarnings.length > 2) highPriorityImprovements.push('Fix section headers and remove non-standard bullet characters.');
    if (grammarData.issueCount > 2) highPriorityImprovements.push('Fix grammar issues — especially avoid "I am", "responsible for", and informal words.');

    const strengths = [];
    if (skillsScore > 75) strengths.push('Excellent breadth of industry-relevant skills detected.');
    if (quantRatio >= 25) strengths.push('Good usage of data, percentages, and metrics.');
    if (formatScore >= 80) strengths.push('Clean layout structure with standard headers detected.');
    if (readabilityData.readabilityScore >= 72) strengths.push('Resume is easy to read — great for busy recruiters.');
    if (hasLinkedIn && hasGitHub) strengths.push('LinkedIn and GitHub links present — great for credibility.');

    let summaryText = `Your resume scored ${atsScore}% (${grade}). `;
    if (atsScore >= 85) summaryText += 'Excellent keyword alignment, robust metrics, and ATS-ready structure. Minor polishing will make it top-tier.';
    else if (atsScore >= 70) summaryText += 'Solid but improvable. Focus on active achievements, contact links, and keyword density.';
    else summaryText += 'Needs layout and content work. Reorganize sections, inject strong action verbs, and add measurable metrics.';

    return {
      atsScore, skillsScore, formatScore, impactScore, keywordsScore,
      overallGrade: grade, summary: summaryText,
      skills: detectedSkills, recommendations,
      improvements: { highPriority: highPriorityImprovements, strengths },
      keywords: { present: presentKeywords, missing: missingKeywords, powerWords: ['optimized', 'engineered', 'spearheaded', 'implemented', 'scaled', 'architected', 'accelerated'] },
      jobMatch, atsWarnings: formatWarnings,
      // NEW FIELDS
      grammar: grammarData,
      readability: readabilityData,
      bulletAnalysis: bulletData,
      duplicates,
      salary: salaryData,
      roleMatches,
      lengthData,
      detectedIndustry,
      linkedInGaps: this.analyzeLinkedInGaps(resumeText),
      _source: 'offline_v2'
    };
  },

  // ---------------------------------------------------------
  // ENHANCE RESUME
  // ---------------------------------------------------------
  enhanceResume(resumeText, type) {
    if (!resumeText) return '';
    let enhanced = resumeText;

    if (type === 'verbs') {
      for (const [weak, strong] of Object.entries(WEAK_TO_STRONG_VERBS)) {
        const regex = new RegExp('\\b' + weak + '\\b', 'gi');
        enhanced = enhanced.replace(regex, (match) =>
          match.charAt(0) === match.charAt(0).toUpperCase() ? strong.charAt(0).toUpperCase() + strong.slice(1) : strong
        );
      }
    } else if (type === 'metrics') {
      const lines = enhanced.split('\n');
      enhanced = lines.map(line => {
        const trimmed = line.trim();
        if ((trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) && !/\b\d+\b/.test(trimmed)) {
          return line + ' [resulting in X% growth and saving Y hours weekly]';
        }
        return line;
      }).join('\n');
    } else if (type === 'format') {
      const lines = enhanced.split('\n');
      enhanced = lines.map(line => {
        let trimmed = line.trim();
        if (/^(experience|employment|work history)$/i.test(trimmed)) return '\nPROFESSIONAL EXPERIENCE\n' + '='.repeat(23);
        if (/^(education)$/i.test(trimmed)) return '\nEDUCATION\n' + '='.repeat(9);
        if (/^(skills)$/i.test(trimmed)) return '\nTECHNICAL SKILLS\n' + '='.repeat(16);
        if (trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.startsWith('►') || trimmed.startsWith('❖')) {
          return '• ' + trimmed.substring(1).trim();
        }
        return line;
      }).join('\n');
    }

    return enhanced;
  },

  // ---------------------------------------------------------
  // GENERATE COVER LETTER
  // ---------------------------------------------------------
  generateCoverLetter(resumeText, jobDescription = '', tone = 'professional') {
    const nameMatch = resumeText.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})/);
    const candidateName = nameMatch ? nameMatch[1] : 'Jane Doe';
    const emailMatch = resumeText.match(/[\w.-]+@[\w.-]+\.\w+/);
    const email = emailMatch ? emailMatch[0] : 'jane.doe@email.com';
    const phoneMatch = resumeText.match(/(\+?\d{1,4}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    const phone = phoneMatch ? phoneMatch[0] : '(555) 019-2834';

    const topSkills = [];
    for (const [, list] of Object.entries(SKILLS_DB)) {
      list.forEach(skill => {
        if (new RegExp('\\b' + skill + '\\b', 'i').test(resumeText)) {
          let name = skill.replace('\\+', '+').replace('\\.', '.');
          name = name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          topSkills.push(name);
        }
      });
    }
    const skillsString = topSkills.slice(0, 4).join(', ');

    let jobTitle = 'Software Engineer', companyName = 'Your Target Company';
    if (jobDescription) {
      const firstLine = jobDescription.split('\n')[0];
      if (firstLine && firstLine.length < 80) jobTitle = firstLine.trim();
      const compMatch = jobDescription.match(/(?:company|at|join)\s+([A-Z][A-Za-z0-9\s]+(?:Inc\.|LLC|Corp\.|Solutions|Technologies)?)/);
      if (compMatch) companyName = compMatch[1].trim();
    }

    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    let letterBody = '';

    if (tone === 'tech') {
      letterBody = `Dear Hiring Team at ${companyName},\n\nI am writing to express my strong interest in the ${jobTitle} position. With expertise in ${skillsString || 'software development'}, I am eager to apply my problem-solving capabilities to your engineering goals.\n\nI have focused on building scalable systems, optimizing efficiency, and writing clean, maintainable code. I particularly excel in ${topSkills[0] || 'core engineering'} and ${topSkills[1] || 'systems design'}, and I am confident these skills will make an immediate impact at ${companyName}.\n\nThank you for your time and consideration.\n\nSincerely,\n${candidateName}\n${email} | ${phone}`;
    } else if (tone === 'enthusiastic') {
      letterBody = `Dear Hiring Team at ${companyName},\n\nI was thrilled to see the opening for the ${jobTitle} role! I would love to bring my energy and expertise in ${skillsString || 'professional deliverables'} to your mission-driven team.\n\nI thrive in collaborative environments and am always eager to learn new tools. ${companyName}'s culture of creative execution resonates deeply with me, and I believe my experience in ${topSkills[0] || 'rapid delivery'} makes me the perfect fit.\n\nI would love to connect and discuss how I can support your upcoming projects!\n\nWarm regards,\n${candidateName}\n${email} | ${phone}`;
    } else if (tone === 'creative') {
      letterBody = `Dear Hiring Team at ${companyName},\n\nEvery great product has a story, and as a ${jobTitle}, my passion lies in crafting those narratives through robust, scalable execution. I am writing to apply for this role at ${companyName}, a team renowned for turning ambitious visions into realities.\n\nBy leveraging my skills in ${skillsString || 'complex problem-solving'}, I have consistently bridged the gap between engineering needs and business outcomes. I look forward to co-creating the next chapter of your growth.\n\nBest regards,\n${candidateName}\n${email} | ${phone}`;
    } else {
      letterBody = `Dear Hiring Manager,\n\nI am writing to formally apply for the ${jobTitle} position at ${companyName}. With a solid foundation in ${skillsString || 'industry standards'} and a proven track record of successful project execution, I am confident in my ability to deliver substantial value.\n\nMy core competencies in ${topSkills[0] || 'technical design'} and ${topSkills[1] || 'strategic optimization'} have prepared me to contribute to your team's objectives effectively. I am impressed by ${companyName}'s market presence and am eager to apply my experience to help achieve your goals.\n\nThank you for your time and consideration.\n\nSincerely,\n${candidateName}\n${email} | ${phone}`;
    }

    return `${candidateName}\n${phone} | ${email}\n${today}\n\n` + letterBody;
  }
};

window.GeminiAnalyzer = ATSAnalyzer;