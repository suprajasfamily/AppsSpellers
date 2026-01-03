const kidFriendlyWords = [
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could", "should",
  "may", "might", "must", "can", "and", "but", "or", "if", "then", "so",
  "because", "when", "where", "what", "who", "how", "why", "which", "that", "this",
  "I", "you", "he", "she", "it", "we", "they", "my", "your", "his",
  "her", "its", "our", "their", "me", "him", "us", "them",
  "apple", "ball", "cat", "dog", "elephant", "fish", "goat", "horse", "ice", "jelly",
  "kite", "lion", "monkey", "nest", "orange", "pig", "queen", "rabbit", "sun", "tiger",
  "umbrella", "van", "water", "box", "yellow", "zebra",
  "happy", "sad", "big", "small", "tall", "short", "fast", "slow", "hot", "cold",
  "good", "bad", "new", "old", "young", "nice", "kind", "funny", "smart", "brave",
  "run", "jump", "play", "eat", "drink", "sleep", "walk", "talk", "read", "write",
  "draw", "sing", "dance", "swim", "fly", "climb", "throw", "catch", "kick", "hit",
  "love", "like", "want", "need", "help", "give", "take", "make", "see", "look",
  "mom", "dad", "sister", "brother", "friend", "teacher", "baby", "family", "grandma", "grandpa",
  "house", "home", "school", "park", "store", "room", "bed", "table", "chair", "door",
  "book", "pen", "paper", "toy", "game", "ball", "doll", "car", "bike", "phone",
  "tree", "flower", "grass", "sky", "cloud", "rain", "snow", "wind", "star", "moon",
  "red", "blue", "green", "yellow", "orange", "purple", "pink", "black", "white", "brown",
  "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "first", "second", "third", "last", "next", "more", "less", "many", "few", "some",
  "today", "tomorrow", "yesterday", "morning", "night", "day", "week", "month", "year", "time",
  "now", "later", "soon", "always", "never", "sometimes", "often", "again", "here", "there",
  "up", "down", "in", "out", "on", "off", "over", "under", "before", "after",
  "please", "thank", "sorry", "hello", "goodbye", "yes", "no", "okay", "sure", "great",
  "birthday", "party", "present", "cake", "candy", "cookie", "pizza", "food", "lunch", "dinner",
  "animal", "bird", "butterfly", "bug", "snake", "frog", "bear", "wolf", "deer", "owl",
  "beach", "mountain", "river", "lake", "ocean", "forest", "garden", "farm", "city", "country",
  "story", "song", "movie", "picture", "color", "shape", "number", "letter", "word", "name"
];

const commonBigrams: Record<string, string[]> = {
  "the": ["cat", "dog", "ball", "sun", "moon", "bird", "tree", "book", "car", "house"],
  "a": ["big", "small", "red", "blue", "happy", "nice", "good", "new", "little", "funny"],
  "i": ["am", "like", "love", "want", "need", "can", "will", "see", "have", "go"],
  "is": ["a", "the", "my", "your", "so", "very", "not", "too", "here", "there"],
  "my": ["mom", "dad", "friend", "dog", "cat", "toy", "book", "name", "family", "house"],
  "you": ["are", "can", "will", "have", "want", "like", "need", "see", "know", "go"],
  "we": ["are", "can", "will", "have", "want", "like", "need", "go", "play", "see"],
  "to": ["the", "a", "go", "be", "play", "eat", "read", "see", "do", "make"],
  "and": ["the", "a", "I", "my", "then", "so", "he", "she", "we", "they"],
};

export function getSuggestions(text: string, maxSuggestions: number = 5): string[] {
  const words = text.trim().toLowerCase().split(/\s+/);
  const lastWord = words[words.length - 1] || "";
  const previousWord = words.length > 1 ? words[words.length - 2] : "";

  if (!lastWord) {
    if (previousWord && commonBigrams[previousWord]) {
      return commonBigrams[previousWord].slice(0, maxSuggestions);
    }
    return ["I", "The", "My", "A", "We"].slice(0, maxSuggestions);
  }

  const prefix = lastWord.toLowerCase();
  
  let matches = kidFriendlyWords.filter(word => 
    word.toLowerCase().startsWith(prefix) && word.toLowerCase() !== prefix
  );

  if (previousWord && commonBigrams[previousWord]) {
    const bigramMatches = commonBigrams[previousWord].filter(word =>
      word.toLowerCase().startsWith(prefix)
    );
    matches = [...new Set([...bigramMatches, ...matches])];
  }

  matches.sort((a, b) => {
    const aLen = a.length;
    const bLen = b.length;
    if (aLen !== bLen) return aLen - bLen;
    return a.localeCompare(b);
  });

  return matches.slice(0, maxSuggestions).map(word => {
    const isStartOfSentence = text.trim() === "" || /[.!?]\s*$/.test(text.slice(0, -lastWord.length));
    if (isStartOfSentence) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }
    return word;
  });
}
