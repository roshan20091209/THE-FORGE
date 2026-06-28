export function formatForWhatsApp(answer, options = {}) {
  const maxLength = 1600;
  const { pageReferences, source, textbookTitle } = options;

  let formatted = '';

  if (source === 'not_in_syllabus') {
    formatted = `❌ Not in your syllabus textbook.\n\nThis topic is not covered in your current textbook${textbookTitle ? ` (${textbookTitle})` : ''}.`;
    return formatted;
  }

  formatted = answer.substring(0, maxLength);

  if (pageReferences && pageReferences.length > 0) {
    const pages = [...new Set(pageReferences.map(r => r.page).filter(Boolean))];
    if (pages.length > 0) {
      formatted += `\n\n📖 Textbook reference: Page ${pages.join(', ')}`;
    }
  }

  formatted += `\n\n💡 Reply with another question, or send "explain <your question>" for a simpler explanation.`;

  return formatted;
}

export function formatPricingMessage() {
  return `📚 *Forge Pro Plans*\n\n` +
    `🔹 *Free* - Rs. 0\n   5 questions/day, 1 textbook\n\n` +
    `🔹 *Pro Monthly* - Rs. 29/mo\n   Unlimited Q&A, OSM format, WhatsApp access\n\n` +
    `🔹 *Pro Yearly* - Rs. 249/yr\n   Save 29%! All Pro features\n\n` +
    `🔹 *Group (5 friends)* - Rs. 99/mo\n   Share with friends!\n\n` +
    `🔹 *Tuition Center* - Rs. 2,999/mo\n   Up to 200 students, white-label\n\n` +
    `Pay via UPI: forge@upi\nOr visit: https://forge.ai/subscribe`;
}

export function formatHelpMessage() {
  return `🤖 *Forge Study Assistant - Help*\n\n` +
    `📝 *Ask a question* - Send any textbook question\n` +
    `🔍 *Explain mode* - Send "explain <your question>"\n` +
    `📚 *Textbooks* - Upload on web app first\n` +
    `💰 *Pricing* - Send "plans" to see plans\n` +
    `🌐 *Web App* - https://forge.ai\n\n` +
    `Need more help? Visit our website!`;
}

export function formatErrorMessage() {
  return `😕 Sorry, I couldn't process your question. Please try:\n` +
    `• Rephrasing your question\n` +
    `• Making sure your textbook is uploaded on the web app\n` +
    `• Sending a shorter question\n\n` +
    `If the problem persists, visit https://forge.ai for support.`;
}

export default { formatForWhatsApp, formatPricingMessage, formatHelpMessage, formatErrorMessage };
