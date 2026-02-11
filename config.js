// ============================================================
// SITE CONFIGURATION
// Edit these values to match your target website.
// ============================================================

module.exports = {
  // Login page URL
  loginUrl: 'https://example.com/login',

  // Login credentials
  credentials: {
    username: 'your_username',
    password: 'your_password',
  },

  // CSS selectors for the login form
  loginSelectors: {
    usernameInput: '#username',       // selector for the username/email field
    passwordInput: '#password',       // selector for the password field
    submitButton: 'button[type="submit"]', // selector for the login button
  },

  // Pages to visit after login. Each entry defines:
  //   url            - the page URL to navigate to
  //   waitFor        - CSS selector to wait for before extracting (ensures page loaded)
  //   dataSelectors  - what data to extract. Each key becomes a CSV column.
  //                    The value is a CSS selector; its text content is extracted.
  //                    Prefix with "attr:href:" (or attr:src: etc.) to grab an attribute instead.
  //   rowSelector    - (optional) if the page has repeating rows (e.g. a table),
  //                    set this to the row container selector. dataSelectors are then
  //                    evaluated relative to each row.
  pagesToVisit: [
    {
      url: 'https://example.com/dashboard',
      waitFor: '.dashboard-table',
      rowSelector: '.dashboard-table tbody tr',
      dataSelectors: {
        name: 'td:nth-child(1)',
        email: 'td:nth-child(2)',
        status: 'td:nth-child(3)',
      },
    },
    // Add more pages here:
    // {
    //   url: 'https://example.com/another-page',
    //   waitFor: '.content',
    //   dataSelectors: {
    //     title: 'h1',
    //     description: '.description',
    //     link: 'attr:href:a.main-link',
    //   },
    // },
  ],

  // Output CSV filename (saved to ./output/)
  outputFile: 'scraped_data.csv',
};
