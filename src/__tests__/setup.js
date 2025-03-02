global.fetch = jest.fn(() => 
  Promise.resolve({
    json: () => Promise.resolve({ enemies: [] })
  })
);

// Mock window.localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn()
};
global.localStorage = localStorageMock;
