/* script.js
   Interactive behaviors for the assignment:
   - Custom form validation + image loader
   - Live text analyzer (word/char count + top words)
   - Favorites gallery persisted via localStorage (thumbnail click to open modal)
   - Theme toggle, click counter, filter for gallery
   Each section below is commented to explain purpose and behavior.
*/

/* ------------------------------
   Utilities & Constants
   ------------------------------ */

const qs = (sel) => document.querySelector(sel);
const qsa = (sel) => Array.from(document.querySelectorAll(sel));

const DEFAULT_STORAGE_KEY = "interactive_favorites_v1";
let fetchCounter = 0;

/* ------------------------------
   Theme Toggle
   Purpose: Toggle light/dark theme on page
   ------------------------------ */
(function setupThemeToggle() {
  const btn = qs("#themeToggle");
  // Load saved theme
  const saved = localStorage.getItem("theme");
  if (saved === "dark") document.body.classList.add("dark");

  btn.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    localStorage.setItem(
      "theme",
      document.body.classList.contains("dark") ? "dark" : "light"
    );
  });
})();

/* ------------------------------
   Image Fetcher Form
   Purpose: Accept image URL, validate it (custom), attempt to load image,
            show preview and allow saving to favorites.
   Key points:
   - Custom validation: 
       * Input not empty
       * Looks like a URL (basic regex)
       * Either ends with common image extension OR the image actually loads
   - Uses Image() object to detect load/error (no HTML5-only validation)
   ------------------------------ */
(function setupImageFetcher() {
  const form = qs("#imageForm");
  const urlInput = qs("#imageUrl");
  const errorEl = qs("#imageFormError");
  const preview = qs("#imagePreview");
  const saveBtn = qs("#saveFavorite");
  const status = qs("#imageStatus");
  const fetchCountEl = qs("#fetchCount");

  // Regex for naive URL validation
  const urlRegex = /^(https?:\/\/[^\s/$.?#].[^\s]*)$/i;
  const imageExtRegex = /\.(jpeg|jpg|gif|png|bmp|webp|svg)(\?.*)?$/i;

  // Helper: show image in preview (or error placeholder)
  function showPreview(imgUrl) {
    preview.innerHTML = `
      <small>Preview</small>
      <img src="${imgUrl}" alt="Fetched image preview" loading="lazy"/>
    `;
  }

  function clearPreview() {
    preview.innerHTML = `
      <small>Preview</small>
      <div class="placeholder">No image loaded</div>
    `;
  }

  // Save favorite to localStorage
  function saveFavorite(url) {
    const current = JSON.parse(
      localStorage.getItem(DEFAULT_STORAGE_KEY) || "[]"
    );
    // Avoid duplicates
    if (!current.includes(url)) {
      current.unshift(url); // newest first
      localStorage.setItem(DEFAULT_STORAGE_KEY, JSON.stringify(current));
      renderGallery();
    }
  }

  // Custom validation function - returns { valid: bool, message: string }
  function validateUrl(input) {
    const value = input.trim();
    if (!value) return { valid: false, message: "Please enter an image URL." };
    if (!urlRegex.test(value))
      return { valid: false, message: "That does not look like a valid URL." };

    // If extension is an image type, accept immediately (still try to load)
    if (imageExtRegex.test(value)) return { valid: true, message: "" };

    // Otherwise accept tentatively but note that we'll try to load the resource
    return { valid: true, message: "" };
  }

  // Attempt to load the image to verify it's valid (handles CORS gracefully via <img> load/error)
  function attemptLoadImage(url) {
    status.textContent = "⏳ Loading...";
    const testImg = new Image();
    // onload => success; onerror => failure
    testImg.onload = function () {
      fetchCounter += 1;
      fetchCountEl.textContent = `Fetched: ${fetchCounter}`;
      status.textContent = `✅ Loaded (${testImg.naturalWidth}×${testImg.naturalHeight})`;
      showPreview(url);
      saveBtn.disabled = false;
      // store last loaded url for save action
      saveBtn.dataset.lastUrl = url;
    };
    testImg.onerror = function () {
      status.textContent =
        "✗ Could not load image (CORS, broken link, or not an image).";
      clearPreview();
      saveBtn.disabled = true;
      delete saveBtn.dataset.lastUrl;
    };
    // small timeout fallback
    setTimeout(() => {
      testImg.src = url;
    }, 0);
  }

  // Form submit handler
  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    errorEl.textContent = "";
    const url = urlInput.value;
    const validation = validateUrl(url);

    if (!validation.valid) {
      errorEl.textContent = validation.message;
      return;
    }

    // If extension hints image, try immediate load; else still attempt load
    attemptLoadImage(url);
  });

  // Save favorite button
  saveBtn.addEventListener("click", () => {
    const url = saveBtn.dataset.lastUrl;
    if (url) {
      saveFavorite(url);
      saveBtn.disabled = true; // prevent immediate repeated saves
      status.textContent = "💾 Saved to favorites";
    }
  });

  // Clear error on input
  urlInput.addEventListener("input", () => {
    errorEl.textContent = "";
    saveBtn.disabled = true;
    delete saveBtn.dataset.lastUrl;
  });
})();

/* ------------------------------
   Live Text Analyzer
   Purpose: Real-time stats as user types:
    - Word count (split by whitespace)
    - Character count
    - Top 3 most frequent words (basic normalization)
   Also includes copy and clear buttons.
   ------------------------------ */
(function setupTextAnalyzer() {
  const ta = qs("#textInput");
  const wordCountEl = qs("#wordCount");
  const charCountEl = qs("#charCount");
  const topWordsEl = qs("#topWords");
  const clearBtn = qs("#clearText");
  const copyBtn = qs("#copyText");

  function analyze(text) {
    const trimmed = text.trim();
    const chars = text.length;
    // Split words by whitespace and punctuation, normalized to lowercase
    const words = trimmed
      ? trimmed.toLowerCase().match(/\b[\w']+\b/g) || []
      : [];
    const wordCount = words.length;

    // frequency map
    const freq = words.reduce((acc, w) => {
      acc[w] = (acc[w] || 0) + 1;
      return acc;
    }, {});
    const top = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([w, c]) => `${w} (${c})`);

    return { chars, wordCount, top };
  }

  function update() {
    const result = analyze(ta.value);
    wordCountEl.textContent = result.wordCount;
    charCountEl.textContent = result.chars;
    topWordsEl.textContent = result.top.length ? result.top.join(", ") : "—";
  }

  ta.addEventListener("input", update);
  clearBtn.addEventListener("click", () => {
    ta.value = "";
    update();
    ta.focus();
  });
  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(ta.value);
      copyBtn.textContent = "Copied!";
      setTimeout(() => (copyBtn.textContent = "Copy"), 1200);
    } catch (e) {
      copyBtn.textContent = "Failed";
      setTimeout(() => (copyBtn.textContent = "Copy"), 1200);
    }
  });

  // initialize
  update();
})();

/* ------------------------------
   Favorites Gallery + Modal
   Purpose: Render favorites saved in localStorage, allow filtering,
            show large view in modal, clear favorites.
   Key behavior:
   - Click thumbnail opens modal with large image and metadata
   - Filter field narrows displayed items by URL text
   ------------------------------ */
(function setupGallery() {
  const gallery = qs("#gallery");
  const modal = qs("#modal");
  const modalImg = qs("#modalImg");
  const modalInfo = qs("#modalInfo");
  const modalClose = qs("#modalClose");
  const filterInput = qs("#filterInput");
  const clearFavBtn = qs("#clearFavorites");

  // Render gallery items
  function renderGallery() {
    const items = JSON.parse(localStorage.getItem(DEFAULT_STORAGE_KEY) || "[]");
    gallery.innerHTML = "";
    if (!items.length) {
      gallery.classList.add("empty");
      gallery.innerHTML = `<div class="placeholder">No favorites yet — add images from the Image Fetcher.</div>`;
      return;
    }
    gallery.classList.remove("empty");
    items.forEach((url, idx) => {
      const card = document.createElement("figure");
      card.className = "thumb";
      card.innerHTML = `
        <img data-src="${url}" alt="Favorite ${idx + 1}" loading="lazy" />
        <figcaption>${url.split("/").slice(-1)[0] || "image"}</figcaption>
        <div class="thumbActions">
          <button class="removeBtn" data-url="${url}" title="Remove">Remove</button>
        </div>
      `;
      gallery.appendChild(card);
    });
    // Attach events
    qsa("#gallery .thumb img").forEach((img) => {
      // lazy-set src to avoid preloading everything
      img.src = img.dataset.src;
      img.addEventListener("click", () => openModal(img.src));
    });
    qsa(".removeBtn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const u = e.currentTarget.dataset.url;
        removeFavorite(u);
      });
    });
  }

  // Remove favorite
  function removeFavorite(url) {
    const items = JSON.parse(localStorage.getItem(DEFAULT_STORAGE_KEY) || "[]");
    const filtered = items.filter((u) => u !== url);
    localStorage.setItem(DEFAULT_STORAGE_KEY, JSON.stringify(filtered));
    renderGallery();
  }

  // Open modal with large preview
  function openModal(url) {
    modalImg.src = url;
    modalInfo.textContent = url;
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
  }

  modalClose.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    // close when clicking outside content
    if (e.target === modal) closeModal();
  });

  function closeModal() {
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
    modalImg.src = "";
  }

  // Clear favorites button (header)
  clearFavBtn.addEventListener("click", () => {
    localStorage.removeItem(DEFAULT_STORAGE_KEY);
    renderGallery();
  });

  // Filter favorites by text
  filterInput.addEventListener("input", () => {
    const q = filterInput.value.trim().toLowerCase();
    qsa("#gallery .thumb").forEach((figure) => {
      const caption = figure
        .querySelector("figcaption")
        .textContent.toLowerCase();
      const url = figure.querySelector("img").dataset.src.toLowerCase();
      if (!q || caption.includes(q) || url.includes(q)) {
        figure.style.display = "";
      } else {
        figure.style.display = "none";
      }
    });
  });

  // Initial render
  renderGallery();
})();

/* ------------------------------
   Click Counter (mini tool)
   Purpose: Simple interactive counter to demonstrate button event handling
   ------------------------------ */
(function setupClickCounter() {
  const btn = qs("#clickBtn");
  const disp = qs("#clickCount");
  let count = parseInt(localStorage.getItem("click_count") || "0", 10);
  disp.textContent = count;
  btn.addEventListener("click", () => {
    count += 1;
    disp.textContent = count;
    localStorage.setItem("click_count", String(count));
  });
})();

/* ------------------------------
   Accessibility / small enhancements
   - Close modal on ESC
   ------------------------------ */
document.addEventListener("keydown", (e) => {
  const modal = qs("#modal");
  if (e.key === "Escape" && modal && !modal.classList.contains("hidden")) {
    modal.querySelector("#modalClose").click();
  }
});
