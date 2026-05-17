import React from "react";
import { faker } from "@faker-js/faker";
import { useCallback, useState } from "react";

const generatedWords = (
  count,
  includePunctuation = false,
  includeNumbers = false,
) => {
  let words = faker.word.words(count).toLowerCase();

  if (includePunctuation) {
    const punctuation = [",", ".", "!", "?", ";", ":"];
    const wordsArray = words.split(" ");
    const wordsWithPunctuation = wordsArray.map((word, index) => {
      if (index > 0 && index % 3 === 0 && Math.random() > 0.5) {
        const randomPunct =
          punctuation[Math.floor(Math.random() * punctuation.length)];
        return word + randomPunct;
      }
      return word;
    });
    words = wordsWithPunctuation.join(" ");
  }

  if (includeNumbers) {
    const wordsArray = words.split(" ");
    const wordsWithNumbers = wordsArray.map((word, index) => {
      if (index > 0 && index % 4 === 0 && Math.random() > 0.6) {
        return Math.floor(Math.random() * 1000).toString();
      }
      return word;
    });
    words = wordsWithNumbers.join(" ");
  }

  return words;
};

const UseWords = (
  count,
  includePunctuation = false,
  includeNumbers = false,
) => {
  const [words, setWords] = useState(() =>
    generatedWords(count, includePunctuation, includeNumbers),
  );

  const updateWords = useCallback(() => {
    setWords(generatedWords(count, includePunctuation, includeNumbers));
  }, [count, includePunctuation, includeNumbers]);

  // NEW: Append more words to the end instead of replacing
  const appendWords = useCallback(() => {
    setWords(
      (prev) =>
        prev + " " + generatedWords(count, includePunctuation, includeNumbers),
    );
  }, [count, includePunctuation, includeNumbers]);

  React.useEffect(() => {
    setWords(generatedWords(count, includePunctuation, includeNumbers));
  }, [includePunctuation, includeNumbers, count]);

  return { words, updateWords, appendWords };
};

export default UseWords;
