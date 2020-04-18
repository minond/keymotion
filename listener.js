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

const KEY_SINGLE_QUOTE = 222

/**
 * @param {[]*} xs
 * @param {*} x
 * @return {bool}
 */
const contains = (xs, x) =>
  xs.indexOf(x) !== -1

/**
 * Track next key combo index and when it triggered. Incremented on successful
 * match, set to zero on failed match and when combo is completed.
 */
let nextComboIndex = 0
let lastPressTime = Date.now()

/**
 * Used for mappings that send you back where you previously were.
 */
let lastOffset = { x: 0, y: 0 }

const save = (lastPressTime, x = pageXOffset, y = pageYOffset) => {
  if (Date.now() - lastPressTime < 500) {
    return
  }

  lastOffset = {x, y}
}

/**
 * Returns true when a given node is "editable".
 *
 * @param {Node} el
 * @return {bool}
 */
const isInput = (el) =>
  el.contentEditable === 'true' ||
    contains(['INPUT', 'TEXTAREA', 'SELECT'], el.nodeName)

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
    if (!contains(a, b[i])) {
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
 * Create a Combo using a key pressed event's data.
 *
 * @type Combo [MODIFIER_KEY{0, 3}, Number]
 * @param {Event} ev
 * @return {Combo}
 */
const combo = (ev) =>
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
 * @param {Combo} pressedCombo
 * @param {[]Combo} wantedCombos
 * @return {bool}
 */
const pressed = (pressedCombo, ...wantedCombos) => {
  if (Date.now() - lastPressTime > KEYPRESS_TIME_WINDOW) {
    nextComboIndex = 0
  }

  let currentCombo = wantedCombos[nextComboIndex]
  if (!setEq(currentCombo, pressedCombo)) {
    return false
  }

  // Make sure we on to the next combo and return true only when we have
  // reached the end of a key combo.
  lastPressTime = Date.now()
  nextComboIndex += 1

  if (nextComboIndex === wantedCombos.length) {
    nextComboIndex = 0
    return true
  }

  return false
}

document.addEventListener('keydown', (ev) => {
  let input = ev.path.reduce((prev, el) => prev || isInput(el), false)
  if (input) {
    return
  }

  // Boys and girls, this is why globals are bad.
  let _lastPressTime = lastPressTime
  let pressedCombo = combo(ev)
  switch (true) {
    case pressed(pressedCombo, [KEY_H]):
      save()
      scroll(ev, -STEP_LEN, 0)
      break

    case pressed(pressedCombo, [KEY_J]):
      save(_lastPressTime)
      scroll(ev, 0, STEP_LEN)
      break

    case pressed(pressedCombo, [KEY_K]):
      save(_lastPressTime)
      scroll(ev, 0, -STEP_LEN)
      break

    case pressed(pressedCombo, [KEY_L]):
      save(_lastPressTime)
      scroll(ev, STEP_LEN, 0)
      break

    case pressed(pressedCombo, [KEY_G], [KEY_G]):
      save(_lastPressTime)
      scroll(ev, 0, -Number.MAX_SAFE_INTEGER)
      break

    case pressed(pressedCombo, [MODIFIER_SHIFT, KEY_G]):
      save(_lastPressTime)
      scroll(ev, 0, Number.MAX_SAFE_INTEGER)
      break

    case pressed(pressedCombo, [MODIFIER_CTRL, KEY_U]):
      save(_lastPressTime)
      scroll(ev, 0, -JUMP_LEN)
      break

    case pressed(pressedCombo, [MODIFIER_CTRL, KEY_D]):
      save(_lastPressTime)
      scroll(ev, 0, JUMP_LEN)
      break

    case pressed(pressedCombo, [KEY_SINGLE_QUOTE], [KEY_SINGLE_QUOTE]):
      lastPressTime = Date.now()
      save(_lastPressTime)
      scrollTo(lastOffset.x, lastOffset.y)
      break
  }
})
