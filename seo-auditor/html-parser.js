import { DOMParser } from 'xmldom';

export function parseHTML(html) {
  const parser = new DOMParser({
    errorHandler: {
      warning: () => {},
      error: () => {}
    }
  });
  
  const doc = parser.parseFromString(html, 'text/html');
  
  return {
    querySelector: function(selector) {
      try {
        return doc.querySelector(selector);
      } catch (e) {
        return null;
      }
    },
    querySelectorAll: function(selector) {
      try {
        const elements = doc.querySelectorAll(selector);
        return Array.from(elements || []);
      } catch (e) {
        return [];
      }
    },
    documentElement: doc.documentElement || doc.body,
    get title() {
      try {
        return doc.querySelector('title')?.textContent || '';
      } catch (e) {
        return '';
      }
    },
    get body() {
      try {
        return doc.body;
      } catch (e) {
        return null;
      }
    }
  };
}