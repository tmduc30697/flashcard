// Phiên âm IPA: tách phần phiên âm ở cuối câu ra riêng.

// ---------- Tách phiên âm ----------
// "These sales are lame af. 'ðiz 'seɪlz ɚ 'leɪm" → ["These sales are lame af.", "'ðiz 'seɪlz ɚ 'leɪm"]
// "obesity /əʊˈbiːsəti/" → ["obesity", "/əʊˈbiːsəti/"]
const IPA_CHAR = /[ˈˌːəɚɝɪʊɛæʌɔɑɒɜðθʃʒŋɹɾʔɡ]/;
const isIpaToken = (t) => IPA_CHAR.test(t) || /^['ˈˌ]/.test(t);
export function splitIPA(text) {
  const s = String(text || '').trim();
  const slash = s.match(/^(.+?)\s*([/[][^/[\]]+[/\]])$/s);
  if (slash && IPA_CHAR.test(slash[2])) return [slash[1], slash[2]];
  // Phần sau dấu kết câu cuối cùng toàn là phiên âm
  const end = s.match(/^(.*[.!?…])\s+(\S.*)$/s);
  if (end && IPA_CHAR.test(end[2]) && !/[.!?…]$/.test(end[2]) && end[2].split(/\s+/).filter(isIpaToken).length * 2 >= end[2].split(/\s+/).length) {
    return [end[1], end[2]];
  }
  // Không có dấu câu: lấy dãy token phiên âm ở cuối
  const tokens = s.split(/\s+/);
  let i = tokens.length;
  while (i > 1 && isIpaToken(tokens[i - 1])) i--;
  if (i < tokens.length && tokens.slice(i).some((t) => IPA_CHAR.test(t))) {
    return [tokens.slice(0, i).join(' '), tokens.slice(i).join(' ')];
  }
  return [s, ''];
}
