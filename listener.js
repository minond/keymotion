"use strict"

const STEP_LEN = 50
const JUMP_LEN = STEP_LEN * 10

const KEYPRESS_TIME_WINDOW = 1000 / 5

const MODIFIER_ALT = {}
const MODIFIER_CTRL = {}
const MODIFIER_META = {}
const MODIFIER_SHIFT = {}

const KEY_D = 68
const KEY_G = 71
const KEY_H = 72
const KEY_J = 74
const KEY_K = 75
const KEY_L = 76
const KEY_U = 85

/**
 * Track next key combo index and when it triggered. Incremented on successful
 * match, set to zero on failed match and when combo is completed.
 */
let nextKeyCombo = 0
let lastPressTime

/**
 * Returns true when a given node is "editable".
 *
 * @param {Node} el
 * @return {bool}
 */
const isInput = (el) =>
  el.type === 'text' ||
    el.type === 'textarea' ||
    el.contentEditable === 'true'

/**
 * Compares two unordered sets for equality.
 *
 * @param {[]*} a
 * @param {[]*} b
 * @return {bool}
 */
const setEq = (a, b) => {
  if (!a || !b || a.length !== b.length) {
    return false
  }

  for (let i = 0, len = a.length; i < len; i++) {
    if (a.indexOf(b[i]) === -1) {
      return false
    }
  }

  return true
}

/**
 * Moves a page's scroll position by the given offsets. It also hijacks the
 * event and prevents further actions.
 *
 * @param {Event} ev
 * @param {Number} offsetX
 * @param {Number} offsetY
 * @return {bool} false
 */
const scroll = (ev, offsetX, offsetY) => {
  scrollTo(pageXOffset + offsetX, pageYOffset + offsetY)
  ev.preventDefault()
  ev.stopPropagation()
  return false
}

/**
 * Create a KeyComboArray using a key pressed event's data.
 *
 * @type KeyComboArray [MODIFIER_KEY{0, 3}, Number]
 * @param {Event} ev
 * @return {KeyComboArray}
 */
const getKeyCombo = (ev) =>
  [
    ev.altKey && MODIFIER_ALT,
    ev.ctrlKey && MODIFIER_CTRL,
    ev.metaKey && MODIFIER_META,
    ev.shiftKey && MODIFIER_SHIFT,
    ev.keyCode,
  ].filter(x => !!x)

/**
 * Returns true when a given combination of keys are pressed.
 *
 * @param {Event} ev
 * @param {Number...} keys
 */
const pressed = (ev, ...wantedKeyCombos) => {
  if (Date.now() - lastPressTime > KEYPRESS_TIME_WINDOW) {
    nextKeyCombo = 0
  }

  lastPressTime = Date.now()

  let pressedKeyCombo = getKeyCombo(ev)
  let currentKeyCombo = wantedKeyCombos[nextKeyCombo]

  if (!setEq(currentKeyCombo, pressedKeyCombo)) {
    return false
  }

  // Move on to the next combo. Return true only when we have reached the end
  // of a key combo.
  nextKeyCombo++
  if (nextKeyCombo === wantedKeyCombos.length) {
    nextKeyCombo = 0
    return true
  }

  return false
}

document.addEventListener('keydown', (ev) => {
  let input = ev.path.reduce((prev, el) => prev || isInput(el), false)
  if (input) {
    return
  }

  switch (true) {
    case pressed(ev, [KEY_H]): return scroll(ev, -STEP_LEN, 0)
    case pressed(ev, [KEY_J]): return scroll(ev, 0, STEP_LEN)
    case pressed(ev, [KEY_K]): return scroll(ev, 0, -STEP_LEN)
    case pressed(ev, [KEY_L]): return scroll(ev, STEP_LEN, 0)

    case pressed(ev, [KEY_G], [KEY_G]): return scroll(ev, 0, -Number.MAX_SAFE_INTEGER)
    case pressed(ev, [MODIFIER_SHIFT, KEY_G]): return scroll(ev, 0, Number.MAX_SAFE_INTEGER)

    case pressed(ev, [MODIFIER_CTRL, KEY_U]): return scroll(ev, 0, -JUMP_LEN)
    case pressed(ev, [MODIFIER_CTRL, KEY_D]): return scroll(ev, 0, JUMP_LEN)
  }
})
