if (typeof global.FormData === 'undefined') {
  class FormDataPolyfill {
    append() {}
  }
  global.FormData = FormDataPolyfill;
}
