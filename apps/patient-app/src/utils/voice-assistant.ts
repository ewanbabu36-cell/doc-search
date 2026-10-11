export function speakAdvice(text: string, language: 'hi' | 'en' = 'hi') {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    alert(text);
    return;
  }

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.9; // natural, deliberate pace for elderly and rural listeners
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech synthesis error:', err);
  }
}
