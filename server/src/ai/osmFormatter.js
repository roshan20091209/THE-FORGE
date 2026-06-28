const subjectFormatters = {
  physics: {
    2: (answer) => `Definition:\n${answer.trim()}`,
    5: (answer) => {
      const parts = answer.split('\n').filter(Boolean);
      return `• Statement/Formula: ${parts[0] || answer}
• Explanation: ${parts[1] || 'Refer to textbook'}
• Example/Application: ${parts[2] || 'See solved example'}
• Conclusion: ${parts[3] || 'As per textbook derivation'}`;
    },
    10: (answer) => {
      return `1. Introduction\n   ${answer.substring(0, 200)}
2. Derivation / Explanation\n   ${answer.length > 200 ? answer.substring(200, 500) : 'Refer to textbook derivation'}
3. Key Points\n   • SI Units & Dimensions
   • Important formulas
   • Sign conventions
4. Example with Solution\n   ${answer.length > 500 ? answer.substring(500, 800) : 'As solved in textbook'}
5. Conclusion\n   • Practical application
   • Relation to other chapters`;
    }
  },
  chemistry: {
    2: (answer) => `Direct answer:\n${answer.trim()}`,
    5: (answer) => {
      return `a) Definition / Concept:\n   ${answer.substring(0, 150)}
b) Chemical Equation / Reaction:\n   ${answer.length > 150 ? answer.substring(150, 350) : 'Refer to textbook reaction'}
c) Explanation:\n   ${answer.length > 350 ? answer.substring(350, 500) : 'As explained in textbook'}
d) Significance:\n   Industrial/biological importance`;
    },
    10: (answer) => {
      return `1. Introduction\n   ${answer.substring(0, 200)}
2. Principle / Theory\n   ${answer.length > 200 ? answer.substring(200, 450) : 'As per textbook'}
3. Procedure / Mechanism\n   • Step-wise explanation
   • Key conditions (temperature, catalyst, pressure)
4. Observations / Results\n   • What is observed
   • Chemical changes
5. Chemical Equations\n   • Balanced equation
   • Mechanism (if applicable)
6. Applications & Conclusion\n   • Uses in daily life/industry
   • Summary of key points`;
    }
  },
  mathematics: {
    2: (answer) => `Answer:\n${answer.trim()}`,
    5: (answer) => {
      return `Given: [Problem statement]
To Find: [What's asked]
Formula: [Relevant formula/theorem]
Solution:
   ${answer.substring(0, 300)}
Result: [Final answer with units]`;
    },
    10: (answer) => {
      return `1. Given Data\n   • Known values
   • Assumptions
2. Formula / Theorem Used\n   • Statement
   • Conditions for applicability
3. Step-wise Solution\n   ${answer.substring(0, 400)}
4. Final Answer\n   • Boxed result with units
5. Verification\n   • Check conditions
   • Cross-verify with example`;
    }
  },
  biology: {
    2: (answer) => `Answer:\n${answer.trim()}`,
    5: (answer) => {
      return `• Definition:\n   ${answer.substring(0, 150)}
• Structure / Process:\n   ${answer.length > 150 ? answer.substring(150, 350) : 'As described in textbook'}
• Function / Significance:\n   ${answer.length > 350 ? answer.substring(350, 500) : 'Biological importance'}
• Diagram Reference:\n   See Fig. [page number] in textbook`;
    },
    10: (answer) => {
      return `1. Introduction\n   ${answer.substring(0, 200)}
2. Classification / Types\n   • Category 1: description
   • Category 2: description
3. Detailed Structure / Process\n   ${answer.length > 200 ? answer.substring(200, 500) : 'Refer to textbook'}
4. Diagram / Flowchart\n   • Key labeled parts
   • Process sequence
5. Functions / Importance\n   • Role in the organism/system
   • Adaptive significance
6. Summary\n   • Key points to remember
   • Common exam questions`;
    }
  }
};

const defaultFormatters = {
  2: (answer) => `Answer:\n${answer.trim()}\n(Reference: Textbook page)`,
  5: (answer) => {
    const lines = answer.split('\n').filter(Boolean);
    return `1. Definition / Key Concept\n   ${lines[0] || answer.substring(0, 150)}
2. Explanation\n   ${lines[1] || answer.substring(0, 300)}
3. Example / Illustration\n   ${lines[2] || 'Refer to textbook example'}
4. Conclusion / Significance\n   ${lines[3] || 'As per syllabus'}`;
  },
  10: (answer) => {
    return `1. Introduction\n   ${answer.substring(0, 200)}
2. Main Body\n   ${answer.length > 200 ? answer.substring(200, 500) : 'Detailed explanation from textbook'}
3. Key Points\n   • Point 1
   • Point 2
   • Point 3
4. Analysis / Explanation\n   ${answer.length > 500 ? answer.substring(500, 800) : 'Further analysis as per textbook'}
5. Conclusion\n   • Summary
   • Practical applications`;
  },
  15: (answer) => `1. Introduction\n   ${answer.substring(0, 200)}
2. Main Concepts\n   ${answer.length > 200 ? answer.substring(200, 600) : 'Detailed concepts from textbook'}
3. Analysis\n   ${answer.length > 600 ? answer.substring(600, 1000) : 'Analysis as per marking scheme'}
4. Examples & Applications\n   Relevant examples from textbook
5. Conclusion\n   Summary and key takeaways`,
  20: (answer) => `1. Introduction & Context\n   ${answer.substring(0, 250)}
2. Detailed Explanation\n   ${answer.length > 250 ? answer.substring(250, 700) : 'Step-by-step textbook explanation'}
3. Analysis with Examples\n   ${answer.length > 700 ? answer.substring(700, 1200) : 'Multiple examples'}
4. Critical Evaluation\n   • Strengths and limitations
   • Different perspectives
5. Conclusion\n   • Summary of arguments
   • Final verdict based on textbook`
};

function detectSubject(textbookSubject) {
  if (!textbookSubject) return null;
  const sub = textbookSubject.toLowerCase();
  if (sub.includes('phys') || sub.includes('mechanic')) return 'physics';
  if (sub.includes('chem')) return 'chemistry';
  if (sub.includes('math') || sub.includes('algebra') || sub.includes('geomet')) return 'mathematics';
  if (sub.includes('bio') || sub.includes('zool') || sub.includes('botan')) return 'biology';
  return null;
}

export function formatAnswer(rawAnswer, marks, subject) {
  if (!rawAnswer) return '';
  const subjectKey = detectSubject(subject);
  const formatter = subjectFormatters[subjectKey] || defaultFormatters;
  const marksFormatter = formatter[marks] || defaultFormatters[Object.keys(defaultFormatters).reduce((closest, m) => {
    const diff = Math.abs(m - marks);
    const closestDiff = Math.abs(closest - marks);
    return diff < closestDiff ? parseInt(m) : closest;
  }, 5)] || defaultFormatters[5];

  return marksFormatter(rawAnswer);
}

export function getSubjectFormatGuide(subject, marks) {
  const subjectKey = detectSubject(subject);
  const formatters = subjectFormatters[subjectKey] || defaultFormatters;
  const formatter = formatters[marks];
  if (formatter) return formatter.toString();
  return defaultFormatters[marks]?.toString() || '';
}

export default { formatAnswer, getSubjectFormatGuide };
