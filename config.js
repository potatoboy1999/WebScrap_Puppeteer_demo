// ============================================================
// SITE CONFIGURATION
// Edit these values to match your target website.
// ============================================================

// Custom extraction logic for an IMDB movie page
const imdbExtractor = async (page) => {
  return page.evaluate(() => {
    const getText = (sel) => {
      const el = document.querySelector(sel);
      return el ? el.textContent.trim() : '';
    };

    const title = getText('[data-testid="hero__pageTitle"]');

    const metaItems = [...document.querySelectorAll(
      '[data-testid="hero__pageTitle"] + ul > li'
    )].map(li => li.textContent.trim());
    const releaseDate = metaItems[0] || '';
    const runtime = metaItems[2] || '';

    const summary = getText('[data-testid="plot-l"]') ||
                    getText('[data-testid="plot-xl"]') ||
                    getText('[data-testid="plot-xs_to_m"]');

    const creditSections = [...document.querySelectorAll(
      '[data-testid="title-pc-principal-credit"]'
    )];
    let directors = '';
    let stars = '';
    for (const section of creditSections) {
      const label = section.querySelector('.ipc-metadata-list-item__label');
      if (!label) continue;
      const labelText = label.textContent.trim().toLowerCase();
      const names = [...section.querySelectorAll('a')]
        .map(a => a.textContent.trim())
        .filter(t => t && t !== 'Stars' && t !== 'Director' && t !== 'Directors');
      if (labelText.includes('director')) {
        directors = names.join(', ');
      } else if (labelText.includes('star')) {
        stars = names.join(', ');
      }
    }

    const ratingEl = document.querySelector(
      '[data-testid="hero-rating-bar__aggregate-rating__score"] span:first-child'
    );
    const rating = ratingEl ? ratingEl.textContent.trim() : '';
    const popularity = getText('[data-testid="hero-rating-bar__popularity__score"]');

    return [{
      title,
      releaseDate,
      runtime,
      summary,
      directors,
      stars,
      imdbRating: rating,
      popularity,
    }];
  });
};

module.exports = {
  skipLogin: true,

  loginUrl: 'https://example.com/login',
  credentials: { username: 'your_username', password: 'your_password' },
  loginSelectors: {
    usernameInput: '#username',
    passwordInput: '#password',
    submitButton: 'button[type="submit"]',
  },

  // Path to the .xlsx file containing movie IDs
  movieListFile: 'movie_list.xlsx',

  // Template for building the URL from each movie ID
  urlTemplate: 'https://www.imdb.com/title/{movieId}/',

  // Selector to wait for before extracting
  waitFor: '[data-testid="hero__pageTitle"]',

  // Custom extraction function
  extractor: imdbExtractor,

  // Output CSV filename (saved to ./output/)
  outputFile: 'imdb_movies.csv',
};
