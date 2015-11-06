import on from 'dom-helpers/events/on'
import scrollLeft from 'dom-helpers/query/scrollLeft'
import scrollTop from 'dom-helpers/query/scrollTop'
import requestAnimationFrame from 'dom-helpers/util/requestAnimationFrame'
import { readState, saveState } from 'history/lib/DOMStateStorage'

import scrollTo from './utils/scrollTo'

/**
 * `useStandardScrollBehavior` attempts to imitate native browser scroll
 * behavior by recording updates to the window scroll position, then restoring
 * the previous scroll position upon a `POP` transition.
 */
export default function useStandardScrollBehavior(createHistory) {
  return options => {
    const history = createHistory(options)

    let currentKey
    let savePositionHandle = null

    // We have to listen to each scroll update rather than to just location
    // updates, because some browsers will update scroll position before
    // emitting the location change.
    on(window, 'scroll', () => {
      if (savePositionHandle !== null) {
        return
      }

      // It's possible that this scroll operation was triggered by what will be
      // a `POP` transition. Instead of updating the saved location
      // immediately, we have to enqueue the update, then potentially cancel it
      // if we observe a location update.
      savePositionHandle = requestAnimationFrame(() => {
        savePositionHandle = null

        if (!currentKey) {
          return
        }

        const state = readState(currentKey)
        const scrollPosition = [ scrollLeft(window), scrollTop(window) ]

        // We have to directly update `DOMStateStorage`, because actually
        // updating the location could cause e.g. React Router to re-render the
        // entire page, which would lead to observably bad scroll performance.
        saveState(currentKey, { ...state, scrollPosition })
      })
    })

    history.listenBefore(() => {
      if (savePositionHandle !== null) {
        requestAnimationFrame.cancel(savePositionHandle)
        savePositionHandle = null
      }
    })

    function getScrollPosition() {
      const state = readState(currentKey)
      if (!state) {
        return null
      }

      return state.scrollPosition
    }

    history.listen(({ key }) => {
      currentKey = key

      const scrollPosition = getScrollPosition() || [ 0, 0 ]
      scrollTo(...scrollPosition)
    })

    return history
  }
}