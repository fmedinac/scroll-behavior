import { POP } from 'history/lib/Actions'

import createUseScroll from './utils/createUseScroll'

/**
 * `useSimpleScroll` scrolls to the top of the page on `PUSH` and `REPLACE`
 * transitions, while allowing the browser to manage scroll position for `POP`
 * transitions.
 *
 * This can give pretty good results with synchronous transitions on browsers
 * like Chrome that don't update the scroll position until after they've
 * notified `history` of the location change. It will not work as well when
 * using asynchronous transitions or with browsers like Firefox that update
 * the scroll position before emitting the location change.
 */
export default function useSimpleScroll(createHistory) {
  // Don't override the browser's scroll behavior here - we actively want the
  // the browser to take care of scrolling on `POP` transitions.

  function updateScroll({ action }) {
    if (action === POP) {
      return
    }

    this.animate(window, 0, 100);
  }
  function animate(element, to, duration) {
    if (duration <= 0) return;
    const self = this;
    const difference = to - element.scrollTop;
    const perTick = difference / duration * 10;

    setTimeout(function timeout() {
      element.scrollTop = element.scrollTop + perTick;
      if (element.scrollTop === to) return;
      self.scrollTop(element, to, duration / 4);
    }, 10);
  }

  return createUseScroll(updateScroll)(createHistory)
}
