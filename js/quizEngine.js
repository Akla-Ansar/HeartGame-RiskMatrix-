/**
 * quizEngine.js
 * ─────────────────────────────────────────────────────────────
 * Manages the cybersecurity question bank, round selection,
 * and answer validation.
 *
 * High cohesion: ONLY handles quiz logic.
 * Low coupling: returns data only — no direct DOM access.
 * ─────────────────────────────────────────────────────────────
 */

const QuizEngine = (() => {

  const QUESTIONS = [
    {
      text: "Which type of attack intercepts communication between two parties without their knowledge?",
      options: ["Phishing", "Man-in-the-Middle (MitM)", "SQL Injection", "Brute Force"],
      correctIndex: 1,
      hint: "HINT → The correct answer involves an attacker secretly relaying messages between two parties who believe they are communicating directly with each other."
    },
    {
      text: "What does SSL/TLS primarily protect against in web communications?",
      options: ["Denial of Service attacks", "Eavesdropping and data tampering in transit", "SQL injection attacks", "Weak password storage"],
      correctIndex: 1,
      hint: "HINT → SSL/TLS encrypts data in transit — the threat it prevents involves someone reading or modifying data as it travels across the network."
    },
    {
      text: "What is a 'zero-day vulnerability'?",
      options: ["A bug that crashes a system on first deployment", "A flaw with no patch available, unknown to the vendor", "A vulnerability that expires after 24 hours", "A DoS attack launched at midnight"],
      correctIndex: 1,
      hint: "HINT → 'Zero-day' means zero days of protection — the vendor has had zero days to fix it because they don't know it exists yet."
    },
    {
      text: "Which hashing algorithm is considered INSECURE for password storage?",
      options: ["bcrypt", "Argon2", "MD5", "SHA-256 with salt"],
      correctIndex: 2,
      hint: "HINT → The insecure answer is a legacy algorithm — it is extremely fast to compute, which makes it easy to brute-force with modern hardware."
    },
    {
      text: "What is the purpose of a 'salt' when hashing passwords?",
      options: ["To encrypt the password with a secret key", "To add random data before hashing, preventing rainbow table attacks", "To compress the password for faster storage", "To convert the password to binary format"],
      correctIndex: 1,
      hint: "HINT → Salt makes each hash unique even if two users share the same password — this defeats precomputed hash lookup tables."
    },
    {
      text: "What type of attack overwhelms a server with traffic to make it unavailable?",
      options: ["Phishing", "Ransomware", "Distributed Denial of Service (DDoS)", "Cross-Site Scripting"],
      correctIndex: 2,
      hint: "HINT → This attack floods a target with requests from thousands of compromised machines, exhausting its resources."
    },
    {
      text: "What does 'Cross-Site Scripting (XSS)' allow an attacker to do?",
      options: ["Gain physical access to a server", "Inject malicious scripts into web pages viewed by other users", "Crack encrypted passwords offline", "Redirect DNS traffic to a fake server"],
      correctIndex: 1,
      hint: "HINT → XSS exploits trust between a website and its users — the attacker injects code that silently runs in victims' browsers."
    },
    {
      text: "What is the principle of 'least privilege' in cybersecurity?",
      options: ["Users should have maximum permissions for productivity", "Only administrators should use the system", "Users and processes should have only the minimum access they need", "Systems should share all data by default"],
      correctIndex: 2,
      hint: "HINT → Least privilege limits access rights to reduce attack surface — if an account is compromised, damage is contained."
    },
    {
      text: "What does a firewall primarily do?",
      options: ["Encrypts all stored files", "Monitors and controls network traffic based on security rules", "Scans files for viruses after download", "Creates backups of system files"],
      correctIndex: 1,
      hint: "HINT → A firewall acts as a gatekeeper between networks — it filters incoming and outgoing traffic using defined rules."
    },
    {
      text: "What is 'phishing' in the context of cybersecurity?",
      options: ["A method of encrypting sensitive data", "A network scanning technique", "Fraudulently obtaining sensitive information by disguising as a trustworthy entity", "A type of firewall bypass technique"],
      correctIndex: 2,
      hint: "HINT → Phishing exploits human psychology rather than technical flaws — the attacker impersonates a trusted source to steal credentials."
    },
    {
      text: "What is multi-factor authentication (MFA)?",
      options: ["Using multiple passwords for the same account", "Verifying identity using two or more independent authentication factors", "Encrypting data at multiple layers", "Logging in from multiple devices simultaneously"],
      correctIndex: 1,
      hint: "HINT → MFA combines something you KNOW, something you HAVE, or something you ARE — requiring at least two of these factors."
    },
    {
      text: "Which attack injects malicious commands into a database query via an input field?",
      options: ["Buffer Overflow", "SQL Injection", "ARP Spoofing", "Keylogging"],
      correctIndex: 1,
      hint: "HINT → This attack exploits unsanitised input fields to manipulate database queries — always validate and parameterise your queries."
    }
  ];

  let selectedQuestions = [];

  function initRound() {
    const shuffled = [...QUESTIONS].sort(() => Math.random() - 0.5);
    selectedQuestions = shuffled.slice(0, 5);
  }

  function getQuestion(roundIndex) {
    return selectedQuestions[roundIndex] || null;
  }

  function checkAnswer(roundIndex, chosenIndex) {
    const q = selectedQuestions[roundIndex];
    if (!q) return { correct: false, correctIndex: -1 };
    return { correct: chosenIndex === q.correctIndex, correctIndex: q.correctIndex };
  }

  function getHint(roundIndex) {
    const q = selectedQuestions[roundIndex];
    return q ? q.hint : '';
  }

  return { initRound, getQuestion, checkAnswer, getHint };

})();