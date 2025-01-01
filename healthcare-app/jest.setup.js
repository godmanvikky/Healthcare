require('@testing-library/jest-dom');

// Mocking global fetch if needed
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
  })
);

// Mocking console errors to keep test output clean
beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});
