class TemplateEngine {
  compile(templateString, context = {}) {
    if (!templateString || typeof templateString !== 'string') {
      return '';
    }

    return templateString.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (match, key) => {
      const keys = key.split('.');
      let val = context;
      for (const k of keys) {
        if (val && Object.prototype.hasOwnProperty.call(val, k)) {
          val = val[k];
        } else {
          val = null;
          break;
        }
      }
      return val !== null && val !== undefined ? String(val) : '';
    });
  }
}

module.exports = new TemplateEngine();
