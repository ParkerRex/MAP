import * as React from 'react';

// @see https://usehooks.com/useLockBodyScroll.
export function useLockBody() {
  React.useLayoutEffect(() => {
    // Get the original overflow style of the body to restore it later.
    const originalStyle: string = window.getComputedStyle(
      document.body,
    ).overflow;

    // Immediately hide the overflow (scrolling) of the body.
    document.body.style.overflow = 'hidden';

    // Define the cleanup function that will restore the original overflow style.
    function restoreOriginalStyle() {
      document.body.style.overflow = originalStyle;
    }

    // Return the cleanup function to be called on component unmount or before the effect runs again.
    return restoreOriginalStyle;
  }, []); // The empty dependency array means this effect runs only once on mount and cleanup on unmount.
}
