import ora from "ora";

// Reusable UI utilities for any CLI command

export interface SpinnerController {
  stop: () => void;
  updateText: (text: string) => void;
}

export const createSpinner = (
  initialText: string = "Loading...",
  phrases?: string[],
): SpinnerController => {
  const spinner = process.stdout.isTTY
    ? ora({ text: initialText }).start()
    : null;

  let spinnerInterval: NodeJS.Timeout | null = null;
  let currentPhraseIndex = 0;

  if (spinner && phrases && phrases.length > 1) {
    const pickNextIndex = (prev: number, size: number): number => {
      if (size <= 1) return prev;
      let n = Math.floor(Math.random() * size);
      if (n === prev) n = (n + 1) % size;
      return n;
    };

    currentPhraseIndex = Math.floor(Math.random() * phrases.length);
    spinner.text = `${phrases[currentPhraseIndex]}...`;

    spinnerInterval = setInterval(() => {
      currentPhraseIndex = pickNextIndex(currentPhraseIndex, phrases.length);
      spinner.text = `${phrases[currentPhraseIndex]}...`;
    }, 4000);
  }

  const stop = () => {
    try {
      if (spinnerInterval) {
        clearInterval(spinnerInterval);
        spinnerInterval = null;
      }
      spinner?.stop();
    } catch (_) {
      // Ignore spinner stop errors
    }
  };

  const updateText = (text: string) => {
    if (spinner) {
      spinner.text = text;
    }
  };

  return { stop, updateText };
};
