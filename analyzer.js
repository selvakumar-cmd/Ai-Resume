/**
 * ResumeAI — Offline Rule-Based ATS Analyzer Engine
 * Provides multi-dimensional scoring, skills detection, keyword optimization,
 * action verb upgrading, formatting checks, and dynamic cover letter generation.
 */

const SKILLS_DB = {
  programming: [
    'javascript', 'typescript', 'python', 'java', 'c\\++', 'c#', 'golang', 'rust',
    'ruby', 'php', 'swift', 'kotlin', 'bash', 'shell', 'powershell', 'sql', 'html', 'css'
  ],
  frameworks: [
    'react', 'angular', 'vue', 'next\\.js', 'nuxt\\.js', 'svelte', 'node\\.js', 'express',
    'django', 'flask', 'fastapi', 'spring boot', 'asp\\.net', 'ruby on rails', 'laravel',
    'tailwind', 'bootstrap', 'jquery', 'redux', 'graphql'
  ],
  cloud: [
    'aws', 'azure', 'gcp', 'google cloud', 'kubernetes', 'docker', 'terraform', 'ansible',
    'jenkins', 'ci/cd', 'github actions', 'gitlab ci', 'serverless', 'cloudflare', 'nginx'
  ],
  databases: [
    'mysql', 'postgresql', 'mongodb', 'redis', 'sqlite', 'oracle', 'sql server',
    'cassandra', 'dynamodb', 'firebase', 'elasticsearch', 'mariadb'
  ],
  tools: [
    'git', 'github', 'gitlab', 'vs code', 'jira', 'confluence', 'trello', 'figma',
    'postman', 'webpack', 'vite', 'npm', 'yarn', 'pnpm'
  ],
  data: [
    'machine learning', 'deep learning', 'artificial intelligence', 'nlp', 'computer vision',
    'pandas', 'numpy', 'scikit-learn', 'tensorflow', 'pytorch', 'r programming', 'tableau',
    'power bi', 'spark', 'hadoop', 'data analytics', 'data science'
  ],
  soft: [
    'communication', 'leadership', 'teamwork', 'problem solving', 'time management',
    'critical thinking', 'adaptability', 'collaboration', 'agile', 'scrum',
    'project management', 'negotiation', 'mentoring', 'decision making'
  ],
  certifications: [
    'aws certified', 'certified scrum master', 'csm', 'pmp', 'cissp', 'ccna',
    'azure certified', 'gcp certified', 'comptia', 'itil'
  ]
};

const ACTION_VERBS = [
  'designed', 'implemented', 'engineered', 'developed', 'led', 'managed', 'optimized',
  'automated', 'built', 'created', 'launched', 'directed', 'oversaw', 'coordinated',
  'streamlined', 'reduced', 'increased', 'improved', 'delivered', 'generated', 'solved',
  'transformed', 'spearheaded', 'collaborated', 'analyzed', 'facilitated', 'executed'
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
  'used': 'leveraged'
};

const ATSAnalyzer = {
  analyze(resumeText, jobDescription = '') {
    if (!resumeText) return null;
    const cleanText = resumeText.toLowerCase();

    // 1. EXTRACT SKILLS
    const detectedSkills = {};
    let totalSkillsCount = 0;
    for (const [category, list] of Object.entries(SKILLS_DB)) {
      detectedSkills[category] = [];
      list.forEach(skill => {
        const regex = new RegExp('\\b' + skill + '\\b', 'i');
        if (regex.test(resumeText)) {
          // Normalize display name
          let displayName = skill.replace('\\+', '+').replace('\\.', '.');
          displayName = displayName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          // Keep common abbreviations uppercase
          if (['Aws', 'Gcp', 'Sql', 'Nlp', 'Cs', 'C#', 'C++', 'Ci/cd', 'Itil', 'Ccna', 'Pmp', 'Csm', 'Vs Code'].includes(displayName)) {
            displayName = displayName.toUpperCase().replace('C#', 'C#').replace('C++', 'C++');
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
    if (!detectedSections.contact) formatWarnings.push('Missing explicit "Contact Info" section.');

    // Contact info presence check
    const hasEmail = /[\w.-]+@[\w.-]+\.\w+/.test(resumeText);
    const hasPhone = /(\+?\d{1,4}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(resumeText);
    const hasLinkedIn = /linkedin\.com\/in\/[\w-]+/i.test(resumeText);
    const hasGitHub = /github\.com\/[\w-]+/i.test(resumeText);

    if (!hasEmail) formatWarnings.push('Email address not detected. High priority to add to contact details.');
    if (!hasPhone) formatWarnings.push('Phone number not detected.');
    if (!hasLinkedIn) formatWarnings.push('LinkedIn profile link missing.');
    if (!hasGitHub) formatWarnings.push('GitHub profile link missing (highly recommended for developers).');

    // ATS Red flags
    const hasSpecialChars = /[►■♦✓❖●•]/.test(resumeText);
    const hasTablesIndicators = /\b(table|cell|grid|column|row)\b/i.test(resumeText) && resumeText.includes('|');
    if (hasTablesIndicators) formatWarnings.push('Possible tables or multi-column grids detected. ATS parsers prefer simple linear layouts.');
    if (hasSpecialChars) formatWarnings.push('Avoid non-standard bullet characters (like ►, ❖, or ✦). Stick to standard circles (•).');

    // Word count & Page count
    const words = resumeText.trim().split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    let formatScore = 100;
    if (formatWarnings.length > 0) formatScore -= formatWarnings.length * 8;
    if (wordCount < 300) {
      formatWarnings.push('Resume is too short (under 300 words). Expand details on achievements.');
      formatScore -= 15;
    } else if (wordCount > 1500) {
      formatWarnings.push('Resume is quite long (over 1500 words). Try to limit to 1-2 pages.');
      formatScore -= 10;
    }
    formatScore = Math.max(30, Math.min(100, formatScore));

    // 3. IMPACT ANALYSIS
    let bulletPoints = resumeText.split(/\n+/).map(l => l.trim()).filter(l => l.startsWith('•') || l.startsWith('-') || l.startsWith('*') || l.length > 40);
    const totalBullets = bulletPoints.length;
    let quantifiedBulletsCount = 0;
    let actionVerbsUsed = 0;

    // Check action verbs and numbers in bullets
    const numberRegex = /\b(\d+%?|\d+\s*million|\d+\s*k|\d+\s*years|\d+\s*x|thousands)\b/i;
    bulletPoints.forEach(bullet => {
      if (numberRegex.test(bullet)) quantifiedBulletsCount++;
      
      const wordsInBullet = bullet.toLowerCase().split(/\W+/);
      const hasVerb = wordsInBullet.some(w => ACTION_VERBS.includes(w));
      if (hasVerb) actionVerbsUsed++;
    });

    const quantRatio = totalBullets > 0 ? (quantifiedBulletsCount / totalBullets) * 100 : 0;
    const verbRatio = totalBullets > 0 ? (actionVerbsUsed / totalBullets) * 100 : 0;

    let impactScore = 40;
    if (totalBullets > 0) {
      impactScore = Math.round((quantRatio * 0.6) + (Math.min(100, verbRatio) * 0.4));
    }
    impactScore = Math.max(35, Math.min(100, impactScore));

    // 4. SKILLS SCORE
    let skillsScore = Math.min(100, Math.round((totalSkillsCount / 18) * 100));
    skillsScore = Math.max(40, skillsScore);

    // 5. JOB MATCHING & KEYWORDS
    let jobMatch = null;
    let keywordsScore = 50;
    let presentKeywords = [];
    let missingKeywords = [];
    
    // Extract keywords from resume (nouns and potential skills)
    const resumeWords = new Set(words.map(w => w.toLowerCase().replace(/[^a-z0-9+#.-]/g, '')));

    if (jobDescription && jobDescription.trim().length > 10) {
      const jdWordsRaw = jobDescription.toLowerCase().split(/[\s,./()]+/).filter(w => w.length > 2);
      // Remove common stop words
      const stopWords = new Set(['the', 'and', 'for', 'you', 'with', 'that', 'this', 'our', 'are', 'will', 'your', 'about', 'from', 'their', 'have', 'with', 'work', 'experience', 'team', 'skills', 'ability', 'must', 'role', 'job', 'description', 'requirements', 'candidate']);
      const jdKeywords = [...new Set(jdWordsRaw.filter(w => !stopWords.has(w)))];
      
      jdKeywords.forEach(kw => {
        if (resumeWords.has(kw)) {
          presentKeywords.push(kw);
        } else {
          // Check if it exists in our Skills DB to classify as missing skill
          missingKeywords.push(kw);
        }
      });

      // Filter and limit keyword displays
      presentKeywords = [...new Set(presentKeywords)].slice(0, 15);
      missingKeywords = [...new Set(missingKeywords)].filter(w => {
        // Only include interesting keywords (e.g. skills or tools)
        return Object.values(SKILLS_DB).flat().includes(w) || w.length > 4;
      }).slice(0, 12);

      const totalMatched = presentKeywords.length;
      const totalRequested = presentKeywords.length + missingKeywords.length;
      const matchScore = totalRequested > 0 ? Math.round((totalMatched / totalRequested) * 100) : 70;

      jobMatch = {
        score: matchScore,
        matchSummary: matchScore >= 75 
          ? 'Strong job description alignment! Your experience and skills closely match this job profile.'
          : matchScore >= 55 
            ? 'Moderate alignment. Consider customizing your resume to include some of the missing keywords listed below.'
            : 'Low job match alignment. Your resume is missing key skills and experience terms mentioned in the job description.',
        missingSkills: missingKeywords,
        keyRequirements: missingKeywords.slice(0, 5),
        matchedSkills: presentKeywords
      };
      keywordsScore = matchScore;
    } else {
      // Default placeholder keyword analysis when no JD provided
      presentKeywords = Object.values(detectedSkills).flat().slice(0, 10).map(s => s.toLowerCase());
      missingKeywords = ['(Add job description for full keyword gap analysis)'];
      keywordsScore = skillsScore;
    }

    // 6. OVERALL ATS SCORE
    const weights = jobMatch ? { skills: 0.25, format: 0.25, impact: 0.25, keywords: 0.25 } : { skills: 0.35, format: 0.35, impact: 0.30, keywords: 0.0 };
    let atsScore = 0;
    if (jobMatch) {
      atsScore = Math.round(
        (skillsScore * weights.skills) + 
        (formatScore * weights.format) + 
        (impactScore * weights.impact) + 
        (keywordsScore * weights.keywords)
      );
    } else {
      atsScore = Math.round(
        (skillsScore * weights.skills) + 
        (formatScore * weights.format) + 
        (impactScore * weights.impact)
      );
    }
    atsScore = Math.max(30, Math.min(99, atsScore)); // Keep it real, 100 is impossible for bots

    // Get grade
    let grade = 'NEEDS WORK';
    if (atsScore >= 85) grade = 'EXCELLENT';
    else if (atsScore >= 70) grade = 'GOOD';
    else if (atsScore >= 55) grade = 'FAIR';

    // 7. RECOMMENDATIONS
    const recommendations = [];
    if (!detectedSections.experience || !detectedSections.skills) {
      recommendations.push({
        type: 'critical',
        icon: '🚨',
        title: 'Core Sections Missing',
        desc: 'Ensure your resume explicitly contains sections titled "Work Experience" and "Skills" for ATS visibility.'
      });
    }

    if (quantRatio < 20) {
      recommendations.push({
        type: 'critical',
        icon: '📊',
        title: 'Low Quantification Rate',
        desc: `Only ${Math.round(quantRatio)}% of your bullet points contain numbers or percentages. Quantify your accomplishments (e.g. "Increased sales by 15%", "Managed a team of 4").`
      });
    } else {
      recommendations.push({
        type: 'success',
        icon: '✅',
        title: 'Strong Accomplishments',
        desc: `${Math.round(quantRatio)}% of your bullet points contain measurable metrics, providing recruiters with scale.`
      });
    }

    if (verbRatio < 40) {
      recommendations.push({
        type: 'warning',
        icon: '⚡',
        title: 'Weak Action Verbs',
        desc: 'Upgrade phrases like "responsible for" or "helped with" to strong action verbs like "spearheaded", "engineered", or "orchestrated".'
      });
    }

    if (!hasEmail || !hasPhone) {
      recommendations.push({
        type: 'critical',
        icon: '✉️',
        title: 'Contact Information Missing',
        desc: 'Crucial contact details like your email and phone number are missing. Recruiters won\'t be able to contact you.'
      });
    }

    // Default suggestions
    recommendations.push({
      type: 'success',
      icon: '📁',
      title: 'ATS-Friendly File Check',
      desc: 'Use simple vertical layouts, standard fonts (Arial, Calibri), and save as a clean text-based PDF.'
    });

    const highPriorityImprovements = [];
    if (quantRatio < 20) highPriorityImprovements.push('Add percentage improvements, scale metrics ($), or timelines to at least 4 bullet points.');
    if (!hasEmail || !hasPhone) highPriorityImprovements.push('Insert clear contact info (Email, Phone, LinkedIn) at the absolute top of the document.');
    if (formatWarnings.length > 2) highPriorityImprovements.push('Fix section headers and remove non-standard bullet characters.');

    const strengths = [];
    if (skillsScore > 75) strengths.push('Excellent breadth of industry-relevant skills detected.');
    if (quantRatio >= 25) strengths.push('Good usage of data, percentages, and metrics to back up statements.');
    if (formatScore >= 80) strengths.push('Clean layout structure with standard headers detected.');

    // Executive summary text
    let summaryText = `Your resume scored ${atsScore}% (${grade}). `;
    if (atsScore >= 85) {
      summaryText += `It exhibits excellent keyword alignment, robust metrics quantification, and structured parsing capability. Minor styling polishing will prepare it for top-tier applications.`;
    } else if (atsScore >= 70) {
      summaryText += `It is solid but has room for improvement. Focus on converting passive statements to active achievements and ensuring all contact links are explicitly clickable.`;
    } else {
      summaryText += `It requires layout and content modifications. Reorganize section headings, inject strong power verbs, and ensure every experience block demonstrates tangible metrics.`;
    }

    return {
      atsScore,
      skillsScore,
      formatScore,
      impactScore,
      keywordsScore,
      overallGrade: grade,
      summary: summaryText,
      skills: detectedSkills,
      recommendations: recommendations,
      improvements: {
        highPriority: highPriorityImprovements,
        strengths: strengths
      },
      keywords: {
        present: presentKeywords,
        missing: missingKeywords,
        powerWords: ['optimized', 'engineered', 'spearheaded', 'implemented', 'scaled', 'architected', 'accelerated']
      },
      jobMatch,
      atsWarnings: formatWarnings,
      _source: 'fallback'
    };
  },

  enhanceResume(resumeText, type) {
    if (!resumeText) return '';
    let enhanced = resumeText;

    if (type === 'verbs') {
      // Walk through weak verbs dictionary and replace
      for (const [weak, strong] of Object.entries(WEAK_TO_STRONG_VERBS)) {
        // Match word boundaries case insensitively
        const regex = new RegExp('\\b' + weak + '\\b', 'gi');
        enhanced = enhanced.replace(regex, (match) => {
          // Preserve capitalization
          if (match.charAt(0) === match.charAt(0).toUpperCase()) {
            return strong.charAt(0).toUpperCase() + strong.slice(1);
          }
          return strong;
        });
      }
    } else if (type === 'metrics') {
      // Append metric suggestions to bullet points that don't have numbers
      const lines = enhanced.split('\n');
      const enhancedLines = lines.map(line => {
        const trimmed = line.trim();
        // Check if it looks like a bullet point
        if ((trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) && !/\b\d+\b/.test(trimmed)) {
          return line + ' [resulting in X% growth and saving Y hours weekly]';
        }
        return line;
      });
      enhanced = enhancedLines.join('\n');
    } else if (type === 'format') {
      // Clean up headers and standardize spacings/bullets
      const lines = enhanced.split('\n');
      const enhancedLines = lines.map(line => {
        let trimmed = line.trim();
        // Standardize headers
        if (/^(experience|employment|work history)$/i.test(trimmed)) {
          return '\nPROFESSIONAL EXPERIENCE\n' + '='.repeat(23);
        }
        if (/^(education)$/i.test(trimmed)) {
          return '\nEDUCATION\n' + '='.repeat(9);
        }
        if (/^(skills)$/i.test(trimmed)) {
          return '\nTECHNICAL SKILLS\n' + '='.repeat(16);
        }
        // Standardize bullet indicators to dots
        if (trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.startsWith('►') || trimmed.startsWith('❖')) {
          return '• ' + trimmed.substring(1).trim();
        }
        return line;
      });
      enhanced = enhancedLines.join('\n');
    }

    return enhanced;
  },

  generateCoverLetter(resumeText, jobDescription = '', tone = 'professional') {
    // 1. EXTRACT DATA FROM RESUME
    const nameMatch = resumeText.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})/);
    const candidateName = nameMatch ? nameMatch[1] : 'Jane Doe';

    const emailMatch = resumeText.match(/[\w.-]+@[\w.-]+\.\w+/);
    const email = emailMatch ? emailMatch[0] : 'jane.doe@email.com';

    const phoneMatch = resumeText.match(/(\+?\d{1,4}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    const phone = phoneMatch ? phoneMatch[0] : '(555) 019-2834';

    // Extract Top Skills
    const topSkills = [];
    for (const [category, list] of Object.entries(SKILLS_DB)) {
      list.forEach(skill => {
        const regex = new RegExp('\\b' + skill + '\\b', 'i');
        if (regex.test(resumeText)) {
          let name = skill.replace('\\+', '+').replace('\\.', '.');
          name = name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          topSkills.push(name);
        }
      });
    }
    const skillsString = topSkills.slice(0, 4).join(', ');

    // 2. EXTRACT DATA FROM JOB DESCRIPTION
    let jobTitle = 'Software Engineer';
    let companyName = 'Your Target Company';

    if (jobDescription) {
      const titleMatch = jobDescription.match(/(?:title|role|position):\s*([^\n]+)/i) || 
                         jobDescription.match(/(?:looking for a|seeking a|hiring for)\s+([A-Z][a-z\s]+(Developer|Engineer|Manager|Analyst|Consultant|Designer))/);
      if (titleMatch) {
        jobTitle = titleMatch[1].trim();
      } else {
        // Try searching for prominent nouns
        const firstLine = jobDescription.split('\n')[0];
        if (firstLine && firstLine.length < 80) jobTitle = firstLine.trim();
      }

      const compMatch = jobDescription.match(/(?:company|employer|at|join):\s*([^\n]+)/i) ||
                        jobDescription.match(/(?:join|at|with)\s+([A-Z][A-Za-z0-9\s]+(?:Inc\.|LLC|Corp\.|Solutions|Technologies)?)/);
      if (compMatch) {
        companyName = compMatch[1].trim();
      }
    }

    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // 3. TONE-BASED TEMPLATES
    let letterBody = '';

    if (tone === 'tech') {
      letterBody = `Dear Hiring Team at ${companyName},

I am writing to express my strong interest in the ${jobTitle} position. With my technical expertise in technologies like ${skillsString || 'software development systems'}, I am eager to apply my problem-solving capabilities to your engineering goals.

Throughout my experience, I have focused on building scalable systems, optimizing efficiency, and writing clean, maintainable code. I enjoy tackling complex architectural problems and collaborating with cross-functional teams to deploy robust solutions. Your team's work on modern tech stacks aligns perfectly with my engineering principles.

I am particularly excited about the prospect of bringing my expertise in ${topSkills[0] || 'core engineering'} and ${topSkills[1] || 'systems design'} to ${companyName}. I am confident that my hands-on background and technical curiosity will enable me to make immediate contributions to your codebase and deployment workflows.

Thank you for your time and consideration. I welcome the opportunity to discuss how my skill set maps to your technical roadmap.

Sincerely,

${candidateName}
Email: ${email}
Phone: ${phone}`;
    } else if (tone === 'enthusiastic') {
      letterBody = `Dear Hiring Team at ${companyName},

I was absolutely thrilled to see the opening for the ${jobTitle} role at ${companyName}! I have been following your growth and innovations, and I would love nothing more than to bring my energy, dedication, and expertise in ${skillsString || 'professional deliverables'} to your mission-driven team.

I thrive in collaborative environments that push the boundaries of excellence. My background has taught me that the best products are built when technical competence is paired with genuine passion for user experience. I am always eager to learn new tools and share methodologies that elevate team performance.

${companyName}'s culture of creative execution and impact resonates deeply with me. Bringing my experience with ${topSkills[0] || 'rapid delivery'} and ${topSkills[1] || 'problem-solving'} to this role feels like the perfect next step in my career journey.

I would love to connect and chat about how my enthusiasm and capabilities can support your upcoming projects. Thank you so much for reviewing my application!

Warm regards,

${candidateName}
Email: ${email}
Phone: ${phone}`;
    } else if (tone === 'creative') {
      letterBody = `Dear Hiring Team at ${companyName},

Every great product has a story, and as a ${jobTitle}, my passion lies in crafting those narratives through robust, scalable, and intuitive execution. I am writing to apply for this opportunity at ${companyName}, a team renowned for turning ambitious visions into realities.

My professional journey has been defined by a desire to look beyond standard templates to build elegant, high-impact workflows. By leveraging my skills in ${skillsString || 'complex problem-solving'}, I have consistently bridged the gap between engineering needs and business outcomes.

I am drawn to ${companyName} because you value innovation, design, and distinct product quality. I am excited to contribute my skills in ${topSkills[0] || 'system architecture'} and ${topSkills[1] || 'user-centric development'} to co-create the next chapter of your growth.

Thank you for your time and for creating space for creative engineering. I look forward to discussing how we can build something incredible together.

Best regards,

${candidateName}
Email: ${email}
Phone: ${phone}`;
    } else {
      // professional (default)
      letterBody = `Dear Hiring Manager,

I am writing to formally submit my application for the ${jobTitle} position at ${companyName}. With a solid foundation in ${skillsString || 'industry standards'} and a proven track record of successful project execution, I am confident in my ability to deliver substantial value to your organization.

In my previous roles, I have consistently demonstrated a commitment to operational efficiency, team collaboration, and analytical problem-solving. My core competencies in ${topSkills[0] || 'technical design'} and ${topSkills[1] || 'strategic optimization'} have prepared me to seamlessly integrate into your current processes and contribute to your team's objectives.

I am impressed by ${companyName}'s market presence and commitment to quality. I am eager to apply my experience and skills to help you achieve your goals for this quarter and beyond.

Thank you for your time, consideration, and review of my qualifications. I look forward to the possibility of discussing this opportunity further.

Sincerely,

${candidateName}
Email: ${email}
Phone: ${phone}`;
    }

    const header = `${candidateName}
${phone} | ${email}
${today}

`;

    return header + letterBody;
  }
};

// Export to window object for global availability
window.GeminiAnalyzer = ATSAnalyzer;