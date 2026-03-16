import { stockRichAdapter } from '../../utils/stockRichAdapter';
import { withErrorHandling } from '../../utils/error';

interface HotKeyword {
  keyword: string;
  count: number;
  sources: string[];
}

interface SearchHotKeywordsInput {
  sources?: string[]; // ['twitter', 'weibo', 'youtube']
  topN?: number;
}

export async function searchHotKeywords(input: SearchHotKeywordsInput): Promise<HotKeyword[]> {
  return withErrorHandling(async () => {
    const { sources = ['twitter', 'weibo', 'youtube'], topN = 10 } = input;

    // 1. Collect data
    await stockRichAdapter.collectSocial(sources);

    // 2. Get posts
    const posts = await stockRichAdapter.getSocialPosts(undefined, sources);

    // 3. Extract keywords (Simple frequency count)
    const stopWords = new Set(['the', 'and', 'is', 'in', 'to', 'of', 'for', 'with', 'on', 'at', 'a', 'an', 'this', 'that', 'it', 'be', 'as', 'are', 'from', 'or', 'by', 'but', 'not', 'have', 'has', 'was', 'were', 'will', 'would', 'can', 'could', 'should', 'if', 'when', 'where', 'how', 'why', 'what', 'which', 'who', 'so', 'up', 'out', 'about', 'into', 'over', 'after', 'just', 'like', 'than', 'more', 'some', 'any', 'no', 'all', 'one', 'do', 'does', 'did', 'done', 'go', 'going', 'gone', 'get', 'getting', 'got', 'make', 'making', 'made', 'see', 'seeing', 'saw', 'seen', 'know', 'knowing', 'known', 'think', 'thinking', 'thought', 'take', 'taking', 'taken', 'say', 'saying', 'said', 'come', 'coming', 'came', 'give', 'giving', 'given', 'find', 'finding', 'found', 'use', 'using', 'used', 'look', 'looking', 'looked', 'want', 'wanting', 'wanted', 'need', 'needing', 'needed', 'feel', 'feeling', 'felt', 'ask', 'asking', 'asked', 'try', 'trying', 'tried', 'call', 'calling', 'called', 'keep', 'keeping', 'kept', 'help', 'helping', 'helped', 'show', 'showing', 'showed', 'shown', 'play', 'playing', 'played', 'run', 'running', 'ran', 'move', 'moving', 'moved', 'live', 'living', 'lived', 'believe', 'believing', 'believed', 'hold', 'holding', 'held', 'bring', 'bringing', 'brought', 'happen', 'happening', 'happened', 'write', 'writing', 'wrote', 'written', 'read', 'reading', 'read', 'sit', 'sitting', 'sat', 'stand', 'standing', 'stood', 'lose', 'losing', 'lost', 'pay', 'paying', 'paid', 'meet', 'meeting', 'met', 'include', 'including', 'included', 'continue', 'continuing', 'continued', 'set', 'setting', 'set', 'learn', 'learning', 'learned', 'change', 'changing', 'changed', 'lead', 'leading', 'led', 'understand', 'understanding', 'understood', 'watch', 'watching', 'watched', 'follow', 'following', 'followed', 'stop', 'stopping', 'stopped', 'create', 'creating', 'created', 'speak', 'speaking', 'spoke', 'spoken', 'read', 'reading', 'read', 'allow', 'allowing', 'allowed', 'add', 'adding', 'added', 'spend', 'spending', 'spent', 'grow', 'growing', 'grew', 'grown', 'open', 'opening', 'opened', 'walk', 'walking', 'walked', 'win', 'winning', 'won', 'offer', 'offering', 'offered', 'remember', 'remembering', 'remembered', 'love', 'loving', 'loved', 'consider', 'considering', 'considered', 'appear', 'appearing', 'appeared', 'buy', 'buying', 'bought', 'wait', 'waiting', 'waited', 'serve', 'serving', 'served', 'die', 'dying', 'died', 'send', 'sending', 'sent', 'expect', 'expecting', 'expected', 'build', 'building', 'built', 'stay', 'staying', 'stayed', 'fall', 'falling', 'fell', 'fallen', 'cut', 'cutting', 'cut', 'reach', 'reaching', 'reached', 'kill', 'killing', 'killed', 'remain', 'remaining', 'remained', 'suggest', 'suggesting', 'suggested', 'raise', 'raising', 'raised', 'pass', 'passing', 'passed', 'sell', 'selling', 'sold', 'require', 'requiring', 'required', 'report', 'reporting', 'reported', 'decide', 'deciding', 'decided', 'pull', 'pulling', 'pulled', 'https', 'http', 'com', 'www']);

    const wordCounts = new Map<string, { count: number; sources: Set<string> }>();

    posts.forEach(post => {
      const text = (post.text || post.title || '').toLowerCase();
      // Extract words (simple regex, allow $ for cashtags)
      const words = text.match(/[$a-z0-9]+/g) || [];
      
      words.forEach((word: string) => {
        if (word.length < 3 || stopWords.has(word)) return;
        
        if (!wordCounts.has(word)) {
          wordCounts.set(word, { count: 0, sources: new Set() });
        }
        const entry = wordCounts.get(word)!;
        entry.count++;
        entry.sources.add(post.platform);
      });
    });

    const sorted = Array.from(wordCounts.entries())
      .map(([keyword, data]) => ({
        keyword,
        count: data.count,
        sources: Array.from(data.sources),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, topN);

    return sorted;
  }, 'searchHotKeywords');
}
