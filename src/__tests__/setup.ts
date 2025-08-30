// Jest setup file
import 'jest-dom/extend-expect';

// Mock Web Crypto API
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      encrypt: jest.fn(),
      decrypt: jest.fn(),
      generateKey: jest.fn(),
      importKey: jest.fn(),
      exportKey: jest.fn(),
      digest: jest.fn(),
      sign: jest.fn(),
      verify: jest.fn(),
    },
    getRandomValues: jest.fn(arr => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
  },
});

// Mock DOM APIs
Object.defineProperty(global, 'document', {
  value: {
    body: {
      classList: {
        contains: jest.fn(() => false),
      },
    },
    createElement: jest.fn(() => ({
      classList: {
        add: jest.fn(),
        remove: jest.fn(),
        contains: jest.fn(),
      },
      style: {},
      setAttribute: jest.fn(),
      getAttribute: jest.fn(),
      removeAttribute: jest.fn(),
      textContent: '',
      innerHTML: '',
    })),
    createTreeWalker: jest.fn(),
  },
});

Object.defineProperty(global, 'window', {
  value: {
    innerWidth: 1024,
    innerHeight: 768,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
});
