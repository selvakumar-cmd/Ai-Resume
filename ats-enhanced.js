/**
 * ResumeAI — Advanced ATS Analyzer Module
 * Enterprise-grade features for MNC Applicant Tracking Systems
 * 
 * Includes:
 * - Enhanced keyword matching with industry standard databases
 * - Structured resume parsing with schema.org markup generation
 * - ATS-specific formatting validation
 * - Real job description alignment
 * - Competitive analysis against industry benchmarks
 * - Export functionality for ATS-friendly formats
 */

const EnhancedATSAnalyzer = {
  // Extended industry-standard skill database
  EXTENDED_SKILLS_DB: {
    programming: {
      keywords: ['javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'golang', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'bash', 'shell', 'powershell', 'sql', 'html', 'css', 'scala', 'haskell', 'perl', 'groovy', 'elixir', 'clojure'],
      weight: 1.2
    },
    frameworks: {
      keywords: ['react', 'angular', 'vue', 'next.js', 'nuxt.js', 'svelte', 'node.js', 'express', 'django', 'flask', 'fastapi', 'spring boot', 'asp.net', 'ruby on rails', 'laravel', 'tailwind', 'bootstrap', 'jquery', 'redux', 'graphql', 'nest.js', 'fastify', 'quasar', 'blazor', 'ember', 'backbone'],
      weight: 1.1
    },
    cloud: {
      keywords: ['aws', 'azure', 'gcp', 'google cloud', 'kubernetes', 'docker', 'terraform', 'ansible', 'jenkins', 'ci/cd', 'github actions', 'gitlab ci', 'serverless', 'cloudflare', 'nginx', 'apache', 'heroku', 'digital ocean', 'linode', 'openshift', 'ecs', 'lambda', 'cloud run'],
      weight: 1.3
    },
    databases: {
      keywords: ['mysql', 'postgresql', 'mongodb', 'redis', 'sqlite', 'oracle', 'sql server', 'cassandra', 'dynamodb', 'firebase', 'elasticsearch', 'mariadb', 'couchdb', 'neo4j', 'influxdb', 'cockroachdb', 'bigquery', 'snowflake', 'redshift'],
      weight: 1.2
    },
    tools: {
      keywords: ['git', 'github', 'gitlab', 'vs code', 'jira', 'confluence', 'trello', 'figma', 'postman', 'webpack', 'vite', 'npm', 'yarn', 'pnpm', 'maven', 'gradle', 'datadog', 'newrelic', 'splunk', 'kibana'],
      weight: 0.9
    },
    data_ai: {
      keywords: ['machine learning', 'deep learning', 'artificial intelligence', 'nlp', 'computer vision', 'pandas', 'numpy', 'scikit-learn', 'tensorflow', 'pytorch', 'r programming', 'tableau', 'power bi', 'spark', 'hadoop', 'data analytics', 'data science', 'jupyter', 'mlflow', 'dbt', 'airflow'],
      weight: 1.3
    },
    soft_skills: {
      keywords: ['communication', 'leadership', 'teamwork', 'problem solving', 'time management', 'critical thinking', 'adaptability', 'collaboration', 'agile', 'scrum', 'project management', 'negotiation', 'mentoring', 'decision making', 'strategic thinking', 'innovation'],
      weight: 0.8
    },
    certifications: {
      keywords: ['aws certified', 'certified scrum master', 'csm', 'pmp', 'cissp', 'ccna', 'azure certified', 'gcp certified', 'comptia', 'itil', 'oracle certified', 'salesforce certified', 'kubernetes certified', 'cka', 'ckad'],
      weight: 1.1
    }
  },

  // MNC-focused power words & action verbs
  POWER_VERBS: {
    leadership: ['spearheaded', 'orchestrated', 'architected', 'stewarded', 'championed', 'directed'],
    technical: ['engineered', 'optimized', 'automated', 'deployed', 'configured', 'implemented'],
    achievement: ['achieved', 'exceeded', 'accelerated', 'amplified', 'magnified', 'maximized'],
    analysis: ['analyzed', 'investigated', 'evaluated', 'assessed', 'diagnosed', 'determined'],
    creation: ['pioneered', 'established', 'initiated', 'formulated', 'conceived', 'devised'],
    collaboration: ['collaborated', 'partnered', 'coordinated', 'facilitated', 'aligned', 'unified']
  },

  // ATS Red Flags
  ATS_RED_FLAGS: {
    formatting: [
      /\b(table|cell|grid|column|row)\b/i,
      /[►■♦✓❖●✦⚡🚀]/,
      /image|logo|header|footer/i,
      /\bcolor\b|\bstyle\b|\bfont\b/i
    ],
    structure: [
      /^\s*\d+\s*$/, // only numbers on line
      /^[!@#$%^&*()]+$/, // only special chars
      /^\s{20,}/ // excessive indentation
    ]
  },

  // Industry benchmark scores
  BENCHMARK_SCORES: {
    tech: { atsScore: 80, skillsScore: 85, keywordsScore: 78 },
    finance: { atsScore: 75, skillsScore: 70, keywordsScore: 82 },
    healthcare: { atsScore: 78, skillsScore: 72, keywordsScore: 75 },
    consulting: { atsScore: 82, skillsScore: 75, keywordsScore: 85 },
    default: { atsScore: 75, skillsScore: 75, keywordsScore: 75 }
  },

  /**
   * Main enhanced analysis function
   */
  analyze(resumeText, jobDescription = '', industry = 'tech') {
    if (!resumeText || resumeText.trim().length < 50) {
      return { error: 'Resume text too short' };
    }

    const analysis = {
      // Core scores
      atsScore: 0,
      skillsScore: 0,
      formatScore: 0,
      impactScore: 0,
      keywordsScore: 0,
      
      // Detected elements
      skills: {},
      sections: {},
      atsWarnings: [],
      improvements: { highPriority: [], medium: [], low: [] },
      recommendations: [],
      keywords: [],
      jobMatch: null,
      
      // Structured data
      structuredData: null,
      exportData: {}
    };

    // Run analysis modules
    const sections = this.analyzeSections(resumeText);
    analysis.sections = sections;

    const skills = this.extractSkills(resumeText);
    analysis.skills = skills;

    const formatting = this.checkFormatting(resumeText, sections);
    analysis.formatScore = formatting.score;
    analysis.atsWarnings.push(...formatting.warnings);

    const impact = this.analyzeImpact(resumeText);
    analysis.impactScore = impact.score;
    analysis.improvements.highPriority.push(...impact.highPriority);
    analysis.improvements.medium.push(...impact.medium);

    // Job matching if JD provided
    if (jobDescription && jobDescription.trim().length > 10) {
      const jobMatch = this.analyzeJobMatch(resumeText, jobDescription, skills);
      analysis.jobMatch = jobMatch;
      analysis.keywordsScore = jobMatch.matchScore;
      analysis.keywords = jobMatch.matchedKeywords;
    }

    // Skills scoring
    const totalSkills = Object.values(skills).reduce((sum, cat) => sum + (Array.isArray(cat) ? cat.length : 0), 0);
    analysis.skillsScore = Math.min(100, Math.max(40, Math.round((totalSkills / 25) * 100)));

    // Keywords scoring (default if no JD)
    if (!analysis.keywordsScore) {
      analysis.keywordsScore = analysis.skillsScore;
      analysis.keywords = Object.values(skills).flat().slice(0, 10);
    }

    // Generate recommendations
    analysis.recommendations = this.generateRecommendations(analysis, sections, impact, formatting);

    // Calculate overall ATS score
    const weights = analysis.jobMatch 
      ? { skills: 0.25, format: 0.25, impact: 0.25, keywords: 0.25 }
      : { skills: 0.35, format: 0.35, impact: 0.30, keywords: 0.0 };

    analysis.atsScore = Math.round(
      (analysis.skillsScore * weights.skills) +
      (analysis.formatScore * weights.format) +
      (analysis.impactScore * weights.impact) +
      (analysis.keywordsScore * weights.keywords)
    );
    analysis.atsScore = Math.max(30, Math.min(99, analysis.atsScore));

    // Generate structured data for export
    analysis.structuredData = this.generateStructuredData(resumeText, analysis);
    analysis.exportData = this.prepareExportFormats(resumeText, analysis);

    return analysis;
  },

  /**
   * Analyze resume sections
   */
  analyzeSections(text) {
    const sections = {
      contact: /\b(contact|email|phone|address|linkedin|github|website)\b/i.test(text),
      summary: /\b(summary|objective|profile|about me|professional summary)\b/i.test(text),
      experience: /\b(experience|employment|work history|career|professional history)\b/i.test(text),
      education: /\b(education|academic|university|degree|college|school)\b/i.test(text),
      skills: /\b(skills|technologies|expertise|proficiencies|tools|technical skills)\b/i.test(text),
      projects: /\b(projects|portfolio|contributions|open source|achievements)\b/i.test(text),
      certifications: /\b(certifications|licenses|awards|credentials)\b/i.test(text)
    };

    // Contact validation
    sections.email = /[\w.-]+@[\w.-]+\.\w+/.test(text);
    sections.phone = /(\+?\d{1,4}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(text);
    sections.linkedin = /linkedin\.com\/in\/[\w-]+/i.test(text);
    sections.github = /github\.com\/[\w-]+/i.test(text);

    return sections;
  },

  /**
   * Extract skills with categorization and weighting
   */
  extractSkills(text) {
    const detected = {};
    const lowerText = text.toLowerCase();

    for (const [category, data] of Object.entries(this.EXTENDED_SKILLS_DB)) {
      detected[category] = [];
      
      data.keywords.forEach(skill => {
        const regex = new RegExp('\\b' + skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
        if (regex.test(text)) {
          let display = skill
            .split(/[\s.]/)
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ')
            .replace(/\s+/g, ' ');
          
          // Fix abbreviations
          if (['Aws', 'Gcp', 'Sql', 'Nlp', 'Ecs', 'Ci/cd'].includes(display)) {
            display = display.toUpperCase().replace(/\./g, '');
          }
          
          if (!detected[category].includes(display)) {
            detected[category].push(display);
          }
        }
      });

      // Keep only top skills per category
      detected[category] = detected[category].slice(0, 12);
    }

    return detected;
  },

  /**
   * Comprehensive formatting check
   */
  checkFormatting(text, sections) {
    const warnings = [];
    let score = 100;

    // Critical missing sections
    if (!sections.contact) {
      warnings.push('❌ Contact information section missing');
      score -= 15;
    }
    if (!sections.experience) {
      warnings.push('❌ Work Experience section not found');
      score -= 20;
    }
    if (!sections.education) {
      warnings.push('❌ Education section not found');
      score -= 15;
    }
    if (!sections.skills) {
      warnings.push('❌ Skills section not found');
      score -= 18;
    }

    // Contact details
    if (!sections.email) {
      warnings.push('⚠️ Email address not detected');
      score -= 12;
    }
    if (!sections.phone) {
      warnings.push('⚠️ Phone number not detected');
      score -= 8;
    }
    if (!sections.linkedin) {
      warnings.push('⚠️ LinkedIn profile URL missing');
      score -= 5;
    }
    if (!sections.github && text.includes('software') || text.includes('developer') || text.includes('engineer')) {
      warnings.push('⚠️ GitHub profile missing (recommended for technical roles)');
      score -= 5;
    }

    // Red flag checks
    const lines = text.split('\n');
    lines.forEach((line, i) => {
      // Check for special characters
      if (/[►■♦✓❖●✦⚡🚀🎯💼]/g.test(line)) {
        warnings.push('⚠️ Non-standard bullet points detected in line ' + (i + 1) + '. Use standard • or -');
        score -= 3;
      }
    });

    // Word count analysis
    const words = text.trim().split(/\s+/).length;
    if (words < 250) {
      warnings.push('⚠️ Resume is too short (' + words + ' words). Aim for 300-600 words');
      score -= 15;
    } else if (words > 1800) {
      warnings.push('⚠️ Resume is too long (' + words + ' words). Trim to 1 page for ATS optimization');
      score -= 10;
    }

    // Formatting issues
    if (/^\s{20,}/m.test(text)) {
      warnings.push('⚠️ Excessive indentation detected. ATS systems may not parse this correctly');
      score -= 8;
    }

    // ATS compatibility score
    score = Math.max(25, Math.min(100, score));

    return { score, warnings };
  },

  /**
   * Analyze impact statements and metrics
   */
  analyzeImpact(text) {
    const bulletPoints = text.split('\n')
      .filter(line => /^[•\-\*]\s+/.test(line.trim()))
      .map(line => line.trim());

    const result = {
      score: 50,
      totalBullets: bulletPoints.length,
      quantifiedBullets: 0,
      strongVerbCount: 0,
      highPriority: [],
      medium: []
    };

    if (bulletPoints.length === 0) {
      result.highPriority.push('Add bullet points with metrics and impact (use • or - prefix)');
      return result;
    }

    const numberRegex = /(\d+%?|\d+\s*(million|k|thousand|x|yr|year|month|hour|day)|[$€£¥][\d,]+)/gi;
    const strongVerbRegex = new RegExp(
      '\\b(' + 
      Object.values(this.POWER_VERBS).flat().join('|') + 
      ')\\b', 'i'
    );

    bulletPoints.forEach(bullet => {
      if (numberRegex.test(bullet)) result.quantifiedBullets++;
      if (strongVerbRegex.test(bullet)) result.strongVerbCount++;
    });

    const quantRatio = Math.round((result.quantifiedBullets / bulletPoints.length) * 100);
    const verbRatio = Math.round((result.strongVerbCount / bulletPoints.length) * 100);

    // Score calculation
    result.score = Math.round((quantRatio * 0.6) + (Math.min(verbRatio, 100) * 0.4));
    result.score = Math.max(35, Math.min(100, result.score));

    // Recommendations
    if (quantRatio < 30) {
      result.highPriority.push('Only ' + quantRatio + '% of bullets have metrics. Add numbers (%, /, $, years, etc) to quantify impact');
    }
    if (verbRatio < 50) {
      result.medium.push('Weak action verbs found. Replace with: ' + this.POWER_VERBS.achievement.slice(0, 3).join(', '));
    }

    return result;
  },

  /**
   * Job description matching with keyword analysis
   */
  analyzeJobMatch(resumeText, jobDescription, extractedSkills) {
    const result = {
      matchScore: 0,
      matchedKeywords: [],
      missingKeywords: [],
      matchedSkills: [],
      missingSkills: [],
      matchSummary: ''
    };

    const jdWords = jobDescription.toLowerCase().split(/[\s,.\-()\/|]/);
    const resumeWords = new Set(resumeText.toLowerCase().split(/[\s,.\-()\/|]/));

    const stopWords = new Set([
      'the', 'and', 'for', 'you', 'with', 'that', 'this', 'our', 'are', 'will', 'your',
      'about', 'from', 'their', 'have', 'work', 'experience', 'team', 'skills', 'ability',
      'must', 'role', 'job', 'description', 'requirements', 'candidate', 'or', 'as', 'on',
      'is', 'be', 'to', 'in', 'of', 'at', 'by', 'an', 'a', 'not', 'we', 'can', 'also'
    ]);

    // Extract potential keywords
    const potentialKeywords = [...new Set(
      jdWords.filter(w => w.length > 3 && !stopWords.has(w))
    )].slice(0, 50);

    potentialKeywords.forEach(keyword => {
      if (resumeWords.has(keyword)) {
        result.matchedKeywords.push(keyword);
      } else {
        result.missingKeywords.push(keyword);
      }
    });

    // Match extracted skills against JD
    Object.entries(extractedSkills).forEach(([category, skills]) => {
      skills.forEach(skill => {
        const skillLower = skill.toLowerCase();
        if (jobDescription.toLowerCase().includes(skillLower)) {
          result.matchedSkills.push(skill);
        }
      });
    });

    // Check for missing skills mentioned in JD
    Object.values(this.EXTENDED_SKILLS_DB).forEach(category => {
      category.keywords.forEach(skill => {
        if (jobDescription.toLowerCase().includes(skill) && !result.matchedSkills.includes(skill)) {
          result.missingSkills.push(skill);
        }
      });
    });

    // Calculate match score
    const totalCritical = result.matchedKeywords.length + result.missingKeywords.length;
    result.matchScore = totalCritical > 0 
      ? Math.round((result.matchedKeywords.length / totalCritical) * 100)
      : 70;

    // Generate match summary
    if (result.matchScore >= 80) {
      result.matchSummary = '✅ Excellent alignment. Your background closely matches this position.';
    } else if (result.matchScore >= 60) {
      result.matchSummary = '⚠️ Good alignment. Consider highlighting the missing skills below in your cover letter.';
    } else {
      result.matchSummary = '❌ Needs work. This role requires different background. Consider targeted positioning.';
    }

    return result;
  },

  /**
   * Generate actionable recommendations
   */
  generateRecommendations(analysis, sections, impact, formatting) {
    const recs = [];

    // Critical issues first
    if (!sections.contact || !sections.email) {
      recs.push({
        type: 'critical',
        icon: '🚨',
        title: 'Missing Contact Information',
        desc: 'Add a clear Contact section with email and phone. ATS cannot contact you without this.'
      });
    }

    if (!sections.experience) {
      recs.push({
        type: 'critical',
        icon: '🚨',
        title: 'Missing Experience Section',
        desc: 'Create a "Professional Experience" or "Work Experience" section header.'
      });
    }

    // Impact-based recommendations
    if (impact.score < 50) {
      recs.push({
        type: 'critical',
        icon: '📊',
        title: 'Weak Impact Statements',
        desc: 'Only ' + Math.round((impact.quantifiedBullets / impact.totalBullets) * 100) + '% of bullets quantify results. Add metrics: percentages, dollar amounts, or team sizes.'
      });
    }

    // Keyword matching
    if (analysis.jobMatch && analysis.jobMatch.matchScore < 60) {
      const missing = analysis.jobMatch.missingSkills.slice(0, 3).join(', ');
      if (missing) {
        recs.push({
          type: 'warning',
          icon: '🎯',
          title: 'Keywords Gap',
          desc: 'Consider adding these JD keywords: ' + missing
        });
      }
    }

    // Formatting recommendations
    if (formatting.warnings.length > 2) {
      recs.push({
        type: 'warning',
        icon: '📝',
        title: 'Formatting Issues',
        desc: 'Fix ' + formatting.warnings.length + ' formatting issues for better ATS parsing.'
      });
    }

    return recs.slice(0, 8); // Limit to 8 recommendations
  },

  /**
   * Generate schema.org structured data for resume
   */
  generateStructuredData(text, analysis) {
    return {
      '@context': 'https://schema.org',
      '@type': 'Person',
      'skills': Object.values(analysis.skills).flat(),
      'jobTitle': this.extractJobTitle(text),
      'contactPoint': {
        '@type': 'ContactPoint',
        'email': this.extractEmail(text),
        'telephone': this.extractPhone(text)
      },
      'sameAs': [
        this.extractLinkedIn(text),
        this.extractGitHub(text)
      ].filter(x => x),
      'areaOfExpertise': Object.keys(analysis.skills).filter(k => analysis.skills[k].length > 0)
    };
  },

  /**
   * Prepare data for various export formats
   */
  prepareExportFormats(text, analysis) {
    return {
      plainText: this.generatePlainText(text, analysis),
      atsOptimized: this.generateATSOptimized(text, analysis),
      keywords: this.generateKeywordList(analysis)
    };
  },

  generatePlainText(text, analysis) {
    // Remove fancy formatting, keep content clean
    return text
      .replace(/[►■♦✓❖●✦⚡🚀🎯💼]/g, '•')
      .replace(/\s{2,}/g, ' ')
      .trim();
  },

  generateATSOptimized(text, analysis) {
    // Generate clean, ATS-friendly version
    const optimized = text
      .replace(/[►■♦✓❖●✦⚡🚀🎯💼]/g, '•')
      .replace(/\s{2,}/g, ' ')
      .replace(/\n{3,}/g, '\n\n');
    
    // Add keywords if missing
    const keywords = Object.values(analysis.skills).flat().join(', ');
    return optimized + '\n\nKEYWORDS: ' + keywords;
  },

  generateKeywordList(analysis) {
    const allKeywords = new Set();
    Object.values(analysis.skills).forEach(skill => {
      if (Array.isArray(skill)) skill.forEach(s => allKeywords.add(s));
    });
    return Array.from(allKeywords).sort();
  },

  // Helper functions
  extractJobTitle(text) {
    const titleRegex = /^([^,\n]+)\s*[|•-]\s*(.+?)(?:\n|$)/m;
    const match = text.match(titleRegex);
    return match ? match[2].trim() : 'Not found';
  },

  extractEmail(text) {
    const match = text.match(/[\w.-]+@[\w.-]+\.\w+/);
    return match ? match[0] : null;
  },

  extractPhone(text) {
    const match = text.match(/(\+?\d{1,4}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    return match ? match[0] : null;
  },

  extractLinkedIn(text) {
    const match = text.match(/linkedin\.com\/in\/([\w-]+)/i);
    return match ? 'https://linkedin.com/in/' + match[1] : null;
  },

  extractGitHub(text) {
    const match = text.match(/github\.com\/([\w-]+)/i);
    return match ? 'https://github.com/' + match[1] : null;
  }
};

// Export for use with other modules
if (typeof window !== 'undefined') window.EnhancedATSAnalyzer = EnhancedATSAnalyzer;
if (typeof module !== 'undefined') module.exports = EnhancedATSAnalyzer;
