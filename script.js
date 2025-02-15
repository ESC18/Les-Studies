/* script.js */

// ====================
// Fuzzy Matching Functions
// ====================

// Compute the Levenshtein distance between two strings.
function levenshtein(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

// Returns true if the text approximately matches the query.
function fuzzyMatch(query, text) {
  if (query === "") return true;
  query = query.toLowerCase();
  text = text.toLowerCase();
  if (text.indexOf(query) !== -1) return true;
  const distance = levenshtein(query, text);
  const threshold = Math.floor(query.length * 0.3);
  return distance <= threshold;
}

/**
 * Updates the Bible verses to show the selected translation.
 * It removes the 'active' class from all Bible quote elements and then adds it to those
 * that correspond to the new translation.
 *
 * @param {string} newTranslation - The new translation (e.g., "NIV").
 */
function updateBibleTranslation(newTranslation) {
  document.querySelectorAll('.study-note .full-study').forEach(function(fullStudy) {
    const quoteContainers = fullStudy.querySelectorAll('.quote');
    quoteContainers.forEach(function(container) {
      const versions = container.querySelectorAll('.bible-quote');
      versions.forEach(function(version) {
        version.classList.remove('active');
        if (version.classList.contains(newTranslation.toLowerCase())) {
          version.classList.add('active');
        }
      });
    });
  });
}

/**
 * Returns true if the text approximately matches the query,
 * using a custom threshold multiplier for the Levenshtein distance.
 *
 * @param {string} query - The search query.
 * @param {string} text - The text to compare.
 * @param {number} multiplier - The multiplier for the allowable edit distance.
 * @return {boolean} - True if the edit distance is less than or equal to floor(query.length * multiplier).
 */
function fuzzyMatchWithThreshold(query, text, multiplier) {
  if (query.trim() === "") return true;
  query = query.toLowerCase();
  text = text.toLowerCase();
  if (text.indexOf(query) !== -1) return true;
  const distance = levenshtein(query, text);
  const threshold = Math.floor(query.length * multiplier);
  return distance <= threshold;
}

// ====================
// Custom Markdown Parser Functions
// ====================
function processCustomMarkdown(text) {
  text = text.replace(/~1\[(.+?)\]/g, '<span style="text-decoration: underline; text-decoration-color: #6D9DC5;">$1</span>');
  text = text.replace(/~2\[(.+?)\]/g, '<span style="text-decoration: underline; text-decoration-color: #F2C078;">$1</span>');
  text = text.replace(/~3\[(.+?)\]/g, '<span style="text-decoration: underline; text-decoration-color: #C84C09;">$1</span>');
  return text;
}

function customMarkdownParser(text) {
  text = processCustomMarkdown(text);
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
  text = text.replace(/`(.+?)`/g, '<code>$1</code>');
  text = text.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
  let paragraphs = text.split(/\n\s*\n/).map(p => `<p>${p}</p>`);
  return paragraphs.join('');
}

function autoColorVerseNumbers(text) {
  return text.replace(/(\b\d{1,2}\b)([.,:;]?)/g, function(match, number, punctuation) {
    return `<span class="verse-number">${number}</span>${punctuation}`;
  });
}

function processVerseCubeText(text) {
  return text.replace(/:\[(.+?)\]:/g, '<em style="font-size: 0.8em;">$1</em>');
}

// ====================
// Helper: Collapse All Extended Studies
// ====================
function collapseAllStudies() {
  const extendedNotes = document.querySelectorAll('.study-note.extended');
  extendedNotes.forEach(note => note.classList.remove('extended'));
}

// ====================
// Favorites System for Studies
// ====================
function toggleFavoriteStudy(studyId, button) {
  let favorites = JSON.parse(localStorage.getItem('studyFavorites') || '[]');
  if (favorites.includes(studyId)) {
    favorites = favorites.filter(id => id !== studyId);
    button.innerHTML = '☆';
  } else {
    favorites.push(studyId);
    button.innerHTML = '★';
  }
  localStorage.setItem('studyFavorites', JSON.stringify(favorites));
  applyFavoritesFilter();
}

function applyFavoritesFilter() {
  const favFilterActive = document.getElementById('favorites-filter-toggle').checked;
  const studyNotes = document.querySelectorAll('#study-container .study-note');
  const favorites = JSON.parse(localStorage.getItem('studyFavorites') || '[]');
  studyNotes.forEach(note => {
    const studyId = note.getAttribute('data-study-number');
    if (favFilterActive && !favorites.includes(studyId)) {
      note.style.display = 'none';
    } else {
      note.style.display = '';
    }
  });
}

// ====================
// Dynamic Section Creation for the Editor
// ====================
document.addEventListener('DOMContentLoaded', function () {
  const addSectionBtn = document.getElementById('add-section-btn');
  if (addSectionBtn) {
    addSectionBtn.addEventListener('click', function () {
      const sectionElem = createSectionElement();
      const sectionsContainer = document.getElementById('sections-container');
      sectionsContainer.appendChild(sectionElem);
      updatePreview();
    });
  }

  function createSectionElement() {
    const sectionDiv = document.createElement('div');
    sectionDiv.classList.add('section');

    const headerDiv = document.createElement('div');
    headerDiv.classList.add('section-header');

    const typeSelect = document.createElement('select');
    typeSelect.classList.add('section-type');
    const types = [
      { value: "paragraph", text: "Paragraph" },
      { value: "quote", text: "Quote" },
      { value: "link", text: "Link" },
      { value: "subheading", text: "Subheading" }
    ];
    types.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.text;
      typeSelect.appendChild(option);
    });
    headerDiv.appendChild(typeSelect);

    const removeBtn = document.createElement('button');
    removeBtn.type = "button";
    removeBtn.textContent = "Remove Section";
    removeBtn.addEventListener('click', function () {
      sectionDiv.remove();
      updatePreview();
    });
    headerDiv.appendChild(removeBtn);

    sectionDiv.appendChild(headerDiv);

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('section-content');
    sectionDiv.appendChild(contentDiv);

    function renderInputs(type) {
      contentDiv.innerHTML = "";
      if (type === "paragraph") {
        const label = document.createElement('label');
        label.textContent = "Paragraph Content:";
        contentDiv.appendChild(label);
        const textarea = document.createElement('textarea');
        textarea.classList.add('section-content-input');
        contentDiv.appendChild(textarea);
      } else if (type === "quote") {
        const translations = ["niv", "esv", "nkjv", "kjv", "csb", "nasb", "ceb"];
        translations.forEach(trans => {
          const label = document.createElement('label');
          label.textContent = `Quote (${trans.toUpperCase()}):`;
          contentDiv.appendChild(label);
          const textarea = document.createElement('textarea');
          textarea.classList.add('quote-' + trans);
          contentDiv.appendChild(textarea);
        });
        const refLabel = document.createElement('label');
        refLabel.textContent = "Reference:";
        contentDiv.appendChild(refLabel);
        const refInput = document.createElement('input');
        refInput.type = "text";
        refInput.classList.add('quote-reference');
        contentDiv.appendChild(refInput);
        const chapLabel = document.createElement('label');
        chapLabel.textContent = "Chapter (optional):";
        contentDiv.appendChild(chapLabel);
        const chapInput = document.createElement('input');
        chapInput.type = "text";
        chapInput.classList.add('quote-chapter');
        contentDiv.appendChild(chapInput);
        const autoColorLabel = document.createElement('label');
        autoColorLabel.textContent = "Auto Color Verse Numbers:";
        contentDiv.appendChild(autoColorLabel);
        const autoColorCheckbox = document.createElement('input');
        autoColorCheckbox.type = "checkbox";
        autoColorCheckbox.classList.add('auto-color');
        contentDiv.appendChild(autoColorCheckbox);
      } else if (type === "link") {
        const textLabel = document.createElement('label');
        textLabel.textContent = "Link Text:";
        contentDiv.appendChild(textLabel);
        const textInput = document.createElement('input');
        textInput.type = "text";
        textInput.classList.add('link-text');
        contentDiv.appendChild(textInput);
        const urlLabel = document.createElement('label');
        urlLabel.textContent = "Link URL:";
        contentDiv.appendChild(urlLabel);
        const urlInput = document.createElement('input');
        urlInput.type = "text";
        urlInput.classList.add('link-url');
        contentDiv.appendChild(urlInput);
      } else if (type === "subheading") {
        const label = document.createElement('label');
        label.textContent = "Subheading Text:";
        contentDiv.appendChild(label);
        const input = document.createElement('input');
        input.type = "text";
        input.classList.add('subheading-text');
        contentDiv.appendChild(input);
      }
    }

    renderInputs(typeSelect.value);
    typeSelect.addEventListener('change', function () {
      renderInputs(this.value);
    });

    return sectionDiv;
  }

  function generateStudyJSON() {
    const study = {};
    study.studyNumber = document.getElementById('study-number').value;
    study.recommended = document.getElementById('study-recommended').checked;
    study.title = document.getElementById('study-title').value;
    study.description = document.getElementById('study-description').value;
    study.sections = [];
    const sectionElems = document.querySelectorAll('#sections-container .section');
    sectionElems.forEach(sectionElem => {
      const type = sectionElem.querySelector('.section-type').value;
      const sectionObj = { type: type };
      const contentDiv = sectionElem.querySelector('.section-content');
      if (type === "paragraph") {
        sectionObj.content = contentDiv.querySelector('textarea').value;
      } else if (type === "quote") {
        sectionObj.quotes = {};
        const translations = ["niv", "esv", "nkjv", "kjv", "csb", "nasb", "ceb"];
        translations.forEach(trans => {
          const textarea = contentDiv.querySelector('.quote-' + trans);
          sectionObj.quotes[trans] = textarea ? textarea.value : "";
        });
        sectionObj.reference = contentDiv.querySelector('.quote-reference').value;
        sectionObj.chapter = contentDiv.querySelector('.quote-chapter').value;
        sectionObj.autoColor = contentDiv.querySelector('.auto-color').checked;
      } else if (type === "link") {
        sectionObj.content = {};
        sectionObj.content.text = contentDiv.querySelector('.link-text').value;
        sectionObj.content.url = contentDiv.querySelector('.link-url').value;
      } else if (type === "subheading") {
        sectionObj.content = contentDiv.querySelector('.subheading-text').value;
      }
      study.sections.push(sectionObj);
    });
    return study;
  }

  function updatePreview() {
    const study = generateStudyJSON();
    const previewElement = createStudyNote(study);
    const previewPane = document.getElementById('preview-pane');
    previewPane.innerHTML = "";
    previewPane.appendChild(previewElement);
    const outputPre = document.getElementById('output');
    outputPre.textContent = JSON.stringify([study], null, 2);
  }

  document.getElementById('study-form').addEventListener('input', updatePreview);
  document.getElementById('generate-btn').addEventListener('click', updatePreview);
  document.getElementById('copy-btn').addEventListener('click', function () {
    const outputPre = document.getElementById('output');
    const jsonText = outputPre.textContent;
    navigator.clipboard.writeText(jsonText).then(function () {
      alert('JSON copied to clipboard!');
    }, function (err) {
      alert('Error copying JSON: ' + err);
    });
  });
});

// ====================
// Le's Studies Main Code
// ====================
document.addEventListener('DOMContentLoaded', function () {

  function createStudyNote(study) {
    if (!study.sections) study.sections = [];
    const noteDiv = document.createElement('div');
    noteDiv.classList.add('study-note');
    noteDiv.setAttribute('data-study-number', study.studyNumber);

    const titleElem = document.createElement('h2');
    titleElem.classList.add('study-title');
    titleElem.textContent = study.title;
    noteDiv.appendChild(titleElem);

    const descElem = document.createElement('p');
    descElem.classList.add('study-description');
    descElem.textContent = study.description;
    noteDiv.appendChild(descElem);

    const fullStudyDiv = document.createElement('div');
    fullStudyDiv.classList.add('full-study');

    study.sections.forEach(section => {
      let sectionElem;
      if (section.type === 'paragraph') {
        sectionElem = document.createElement('div');
        sectionElem.classList.add('paragraph');
        let contentHtml = customMarkdownParser(section.content);
        sectionElem.innerHTML = contentHtml;
      } else if (section.type === 'quote') {
        sectionElem = document.createElement('div');
        sectionElem.classList.add('quote');
        const translations = ["niv", "esv", "nkjv", "kjv", "csb", "nasb", "ceb"];
        translations.forEach(trans => {
          let quoteVersion = document.createElement('div');
          quoteVersion.classList.add('bible-quote', trans);
          if (trans === "niv") {
            quoteVersion.classList.add('active');
          }
          let quoteText = section.quotes[trans] || "";
          if (section.autoColor) {
            quoteText = autoColorVerseNumbers(quoteText);
          }
          let quoteHtml = `<q>${quoteText}</q>`;
          if (section.reference) {
            quoteHtml += ` <span class="quote-reference"><em><strong>${section.reference}</strong></em></span>`;
          }
          if (section.chapter) {
            quoteHtml = `<span>${section.chapter}</span><br>` + quoteHtml;
          }
          quoteVersion.innerHTML = quoteHtml;
          sectionElem.appendChild(quoteVersion);
        });
      } else if (section.type === 'link') {
        sectionElem = document.createElement('div');
        sectionElem.classList.add('link');
        sectionElem.innerHTML = `<a href="${section.content.url}" target="_blank" style="color: #ffbd2e9c; text-decoration: none;">${section.content.text}</a>`;
      } else if (section.type === 'subheading') {
        sectionElem = document.createElement('h3');
        sectionElem.classList.add('subheading');
        sectionElem.textContent = section.content;
      }
      if (sectionElem) {
        fullStudyDiv.appendChild(sectionElem);
      }
    });
    noteDiv.appendChild(fullStudyDiv);

    // --- Add Favorite Button ---
    const favButton = document.createElement('button');
    favButton.classList.add('favorite-btn');
    favButton.style.position = 'absolute';
    favButton.style.top = '5px';
    favButton.style.right = '5px';
    favButton.style.background = 'none';
    favButton.style.border = 'none';
    favButton.style.fontSize = '20px';
    favButton.style.cursor = 'pointer';
    let studyFavorites = JSON.parse(localStorage.getItem('studyFavorites') || '[]');
    if (studyFavorites.includes(study.studyNumber)) {
      favButton.innerHTML = '★';
    } else {
      favButton.innerHTML = '☆';
    }
    favButton.addEventListener('click', function(e) {
      e.stopPropagation();
      toggleFavoriteStudy(study.studyNumber, favButton);
    });
    noteDiv.appendChild(favButton);

    noteDiv.addEventListener('click', function () {
      this.classList.toggle('extended');
    });
    return noteDiv;
  }

  function loadStudies() {
    fetch('studies.json')
      .then(response => response.json())
      .then(data => {
        if (!Array.isArray(data)) {
          console.error('studies.json is not an array!');
          return;
        }
        data.sort((a, b) => Number(a.studyNumber) - Number(b.studyNumber));
        const recommendedContainer = document.getElementById('recommended-container');
        const studyContainer = document.getElementById('study-container');
        recommendedContainer.innerHTML = '';
        studyContainer.innerHTML = '';
        data.forEach(study => {
          if (study.recommended === "true") {
            study.recommended = true;
          }
          const noteElemAll = createStudyNote(study);
          studyContainer.appendChild(noteElemAll);
          if (study.recommended === true) {
            const noteElemRec = createStudyNote(study);
            recommendedContainer.appendChild(noteElemRec);
          }
        });
      })
      .catch(error => {
        console.error('Error loading studies JSON:', error);
      });
  }
  loadStudies();

  document.getElementById('search-bar').addEventListener('input', function () {
    collapseAllStudies();
    const query = this.value.toLowerCase();
    const notes = document.querySelectorAll('#study-container .study-note');
    const prayerSection = document.getElementById('prayer-section'); // Main prayer section
    const prayerContent = document.getElementById('prayer-content'); // Prayer text
    const prayerToggleBtn = document.getElementById('toggle-prayer'); // Show More button

    if (query === "") {
        document.getElementById('study-container').style.display = '';
        document.getElementById('all-studies-subheader').style.display = 'block';
        document.getElementById('recommended-container').style.display = '';
        document.getElementById('recommended-studies-subheader').style.display = 'block';
        document.getElementById('verse-cubes-subheader').style.display = 'block';
        document.getElementById('verse-cubes').style.display = 'grid';
        document.getElementById('daily-section').style.display = '';
        document.getElementById('daily-inspiration-subheader').style.display = 'block';
        document.getElementById('morning-video-section').style.display = '';
        document.getElementById('morning-video-subheader').style.display = 'block';
        document.getElementById('search-results-subheader').style.display = 'none';

        // Show the prayer section, text, and button again
        if (prayerSection) prayerSection.style.display = '';
        if (prayerContent) prayerContent.style.display = '';
        if (prayerToggleBtn) prayerToggleBtn.style.display = '';

    } else {
        document.getElementById('recommended-container').style.display = 'none';
        document.getElementById('recommended-studies-subheader').style.display = 'none';
        document.getElementById('verse-cubes-subheader').style.display = 'none';
        document.getElementById('verse-cubes').style.display = 'none';
        document.getElementById('daily-section').style.display = 'none';
        document.getElementById('daily-inspiration-subheader').style.display = 'none';
        document.getElementById('morning-video-section').style.display = 'none';
        document.getElementById('morning-video-subheader').style.display = 'none';
        document.getElementById('all-studies-subheader').style.display = 'none';
        document.getElementById('search-results-subheader').style.display = 'block';

        // Hide the prayer section, text, and button
        if (prayerSection) prayerSection.style.display = 'none';
        if (prayerContent) prayerContent.style.display = 'none';
        if (prayerToggleBtn) prayerToggleBtn.style.display = 'none';
    }

    let studyMatchCount = 0;
    notes.forEach(note => {
        let title = note.querySelector('.study-title').textContent.toLowerCase();
        let desc = note.querySelector('.study-description').textContent.toLowerCase();
        if (fuzzyMatch(query, title) || fuzzyMatch(query, desc) || query === "") {
            note.style.display = '';
            studyMatchCount++;
        } else {
            note.style.display = 'none';
        }
    });

    updateVideoSearchResults(query, function (videoMatchCount) {
        const totalMatches = studyMatchCount + videoMatchCount;
        const resultsHeader = document.getElementById('search-results-subheader').querySelector('h2');
        if (query !== "") {
            if (totalMatches === 0) {
                resultsHeader.textContent = "Uh oh we haven't studied " + query + " yet...";
            } else {
                resultsHeader.textContent = "Search results:";
            }
        }
    });
});



  document.querySelectorAll('.verse-cube').forEach(cube => {
    cube.addEventListener('click', function () {
        collapseAllStudies();
        const subject = this.getAttribute('data-subject');

        fetch(`data/${subject}.json`)
            .then(response => response.json())
            .then(data => {
                const randomIndex = Math.floor(Math.random() * data.quotes.length);
                let randomQuote = data.quotes[randomIndex];
                randomQuote = processVerseCubeText(randomQuote);
                
                // Update modal content
                const modal = document.getElementById('verse-modal');
                const modalQuote = document.getElementById('modal-quote');

                if (modal && modalQuote) {
                    modalQuote.innerHTML = randomQuote;
                    modal.classList.add('show');
                    modal.style.display = 'flex';
                }
            })
            .catch(error => {
                console.error('Error fetching JSON for subject:', subject, error);
            });
    });
});

// Ensure modal closes properly and resets
document.querySelector('.modal-close').addEventListener('click', function (e) {
    e.stopPropagation();
    const modal = document.getElementById('verse-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
});

// Close modal when clicking outside
window.addEventListener('click', function (event) {
    const modal = document.getElementById('verse-modal');
    if (event.target === modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
});


  (function () {
    const currentTranslationEl = document.getElementById('current-translation');
    const translationScrollbar = document.getElementById('translation-scrollbar');
    const translationOptions = document.querySelectorAll('.translation-option');
    const footer = document.getElementById('footer');
    const offlineIndicator = document.getElementById('offline-indicator');
    const settingsBtn = document.getElementById('settings-btn');

    currentTranslationEl.addEventListener('click', function (e) {
      e.stopPropagation();
      if (translationScrollbar.style.display === 'flex') {
        translationScrollbar.style.display = 'none';
        if (offlineIndicator) offlineIndicator.style.display = 'block';
        if (settingsBtn) settingsBtn.style.display = 'block';
      } else {
        translationScrollbar.style.display = 'flex';
        if (offlineIndicator) offlineIndicator.style.display = 'none';
        if (settingsBtn) settingsBtn.style.display = 'none';
      }
    });

    translationOptions.forEach(function (option) {
      option.addEventListener('click', function (e) {
        e.stopPropagation();
        const newTranslation = this.getAttribute('data-translation');
        currentTranslationEl.textContent = newTranslation;
        translationScrollbar.style.display = 'none';
        if (offlineIndicator) offlineIndicator.style.display = 'block';
        if (settingsBtn) settingsBtn.style.display = 'block';
        updateBibleTranslation(newTranslation);
        localStorage.setItem('selectedTranslation', newTranslation);
        initDailyInspiration();
      });
    });

    document.addEventListener('click', function (e) {
      if (footer && !footer.contains(e.target)) {
        translationScrollbar.style.display = 'none';
        if (offlineIndicator) offlineIndicator.style.display = 'block';
        if (settingsBtn) settingsBtn.style.display = 'block';
      }
    });

    const savedTranslation = localStorage.getItem('selectedTranslation');
    if (savedTranslation) {
      currentTranslationEl.textContent = savedTranslation;
      updateBibleTranslation(savedTranslation);
    }
  })();

  function updateBibleTranslation(newTranslation) {
    document.querySelectorAll('.study-note .full-study').forEach(function (fullStudy) {
      const quoteContainers = fullStudy.querySelectorAll('.quote');
      quoteContainers.forEach(function (container) {
        const versions = container.querySelectorAll('.bible-quote');
        versions.forEach(function (version) {
          version.classList.remove('active');
          if (version.classList.contains(newTranslation.toLowerCase())) {
            version.classList.add('active');
          }
        });
      });
    });
  }
});

// ====================
// Daily Inspiration Section
// ====================
document.addEventListener('DOMContentLoaded', function () {
  console.log("DOM fully loaded - initializing Daily Inspiration.");
  initDailyInspiration();
});

/**
 * Initializes the Daily Inspiration section.
 * It computes the current day of the year (0-indexed), then fetches quotes from wisdom.json, motivation.json, and psalms.json
 * and displays the quote corresponding to the current day for the selected translation.
 * Any occurrence of :[some text]: in the quote will be replaced with italicized text.
 */
function initDailyInspiration() {
  function getDayOfYear() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  }
  const dayIndex = getDayOfYear();
  const selectedTranslation = (localStorage.getItem('selectedTranslation') || "NIV").toLowerCase();
  function processDailyQuote(text) {
    return text.replace(/:\[(.+?)\]:/g, '<em>$1</em>');
  }
  function loadDailyQuote(jsonPath, selector) {
    fetch(jsonPath)
      .then(response => {
        if (!response.ok) {
          console.error("Error fetching", jsonPath, response.statusText);
        }
        return response.json();
      })
      .then(data => {
        if (data.quotes && data.quotes.length > 0) {
          const index = dayIndex % data.quotes.length;
          const quoteObj = data.quotes[index];
          let quoteText = "";
          if (jsonPath.indexOf("motivation.json") !== -1) {
            quoteText = quoteObj;
          } else {
            quoteText = quoteObj[selectedTranslation] || quoteObj["niv"] || "";
          }
          const elem = document.querySelector(selector);
          if (elem) {
            elem.innerHTML = processDailyQuote(quoteText);
          } else {
            console.error("Element not found for selector:", selector);
          }
        } else {
          console.error("No quotes array found in", jsonPath);
        }
      })
      .catch(error => {
        console.error("Error loading", jsonPath, ":", error);
      });
  }
  loadDailyQuote('data/wisdom.json', '#daily-wisdom .daily-text');
  loadDailyQuote('data/motivation.json', '#daily-motivation .daily-text');
  loadDailyQuote('data/psalms.json', '#daily-psalms .daily-text');
}

/**
 * Extracts the YouTube video ID from a YouTube URL.
 * @param {string} url - The YouTube URL.
 * @return {string|null} - The video ID, or null if not found.
 */
function extractYoutubeVideoId(url) {
  const regExp = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regExp);
  return (match && match[1]) ? match[1] : null;
}

/**
 * Initializes the Morning Video section.
 * It fetches the list of videos from data/videos.json,
 * selects a random video to update the main rectangle,
 * creates/updates an overlay, sets a click handler to open the video's URL,
 * and populates the modal with all recommended videos.
 */
function initMorningVideo() {
  console.log("initMorningVideo started.");
  fetch('data/videos.json')
    .then(response => response.json())
    .then(data => {
      if (data.videos && data.videos.length > 0) {
        const randomIndex = Math.floor(Math.random() * data.videos.length);
        const video = data.videos[randomIndex];
        console.log("Selected Morning Video:", video);
        const videoRect = document.getElementById('morning-video-rectangle');
        if (videoRect) {
          const titleElem = videoRect.querySelector('.video-title');
          const descElem = videoRect.querySelector('.video-description');
          if (titleElem) titleElem.textContent = video.title;
          if (descElem) descElem.textContent = video.description;
          const videoId = extractYoutubeVideoId(video.youtubeUrl);
          if (videoId) {
            videoRect.style.backgroundImage = `url('https://img.youtube.com/vi/${videoId}/hqdefault.jpg')`;
            videoRect.style.backgroundSize = 'cover';
            videoRect.style.backgroundPosition = 'center';
          } else {
            videoRect.style.backgroundImage = 'none';
          }
          let overlay = videoRect.querySelector('.video-overlay');
          if (!overlay) {
            overlay = document.createElement('div');
            overlay.classList.add('video-overlay');
            videoRect.insertBefore(overlay, videoRect.firstChild);
          }
          videoRect.onclick = function () {
            window.open(video.youtubeUrl, '_blank');
          };
        } else {
          console.error("Morning video rectangle element not found.");
        }
        const videoListContainer = document.getElementById('video-list');
        if (videoListContainer) {
          videoListContainer.innerHTML = "";
          data.videos.forEach(item => {
            const videoItem = document.createElement('div');
            videoItem.classList.add('video-list-item');
            const videoId = extractYoutubeVideoId(item.youtubeUrl);
            if (videoId) {
              videoItem.style.backgroundImage = `url('https://img.youtube.com/vi/${videoId}/hqdefault.jpg')`;
              videoItem.style.backgroundSize = 'cover';
              videoItem.style.backgroundPosition = 'center';
            } else {
              videoItem.style.background = '#000';
            }
            const textOverlay = document.createElement('div');
            textOverlay.classList.add('video-text-overlay');
            textOverlay.innerHTML = `<strong>${item.title}</strong><br><span>${item.description}</span>`;
            videoItem.appendChild(textOverlay);
            videoItem.addEventListener('click', function () {
              window.open(item.youtubeUrl, '_blank');
            });
            videoListContainer.appendChild(videoItem);
          });
        } else {
          console.error("Video list container not found.");
        }
      } else {
        console.error("No videos found in data/videos.json");
      }
    })
    .catch(error => {
      console.error("Error loading data/videos.json:", error);
    });

  const viewMoreBtn = document.getElementById('view-more-videos');
  if (viewMoreBtn) {
    viewMoreBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      const modal = document.getElementById('video-modal');
      if (modal) {
        modal.style.display = 'flex';
        setTimeout(function() {
          modal.classList.add('show');
        }, 10);
      } else {
        console.error("Video modal not found.");
      }
    });
  }
  
  const modalCloseBtn = document.querySelector('#video-modal .modal-close');
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      const modal = document.getElementById('video-modal');
      if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
      }
    });
  } else {
    console.warn("Modal close button not found.");
  }
  
  window.addEventListener('click', function (e) {
    const modal = document.getElementById('video-modal');
    if (e.target === modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
    }
  });
}

document.addEventListener('DOMContentLoaded', function () {
  initMorningVideo();
});

// ====================
// Video Search Results
// ====================
function updateVideoSearchResults(query, callback) {
  let container = document.getElementById('video-search-results');
  if (container) {
    container.remove();
  }
  if (query.trim() === "") {
    callback(0);
    return;
  }
  container = document.createElement('div');
  container.id = 'video-search-results';
  const studyContainer = document.getElementById('study-container');
  if (!studyContainer) {
    console.error("#study-container not found.");
    callback(0);
    return;
  }
  studyContainer.appendChild(container);
  let videoMatchesCount = 0;
  fetch('data/videos.json')
    .then(response => response.json())
    .then(data => {
      if (data.videos && data.videos.length > 0) {
        data.videos.forEach(video => {
          const videoText = (video.title + " " + video.description).toLowerCase();
          if (fuzzyMatchWithThreshold(query, videoText, 0.7)) {
            videoMatchesCount++;
            const videoItem = document.createElement('div');
            videoItem.classList.add('video-search-result');
            const videoId = extractYoutubeVideoId(video.youtubeUrl);
            if (videoId) {
              videoItem.style.backgroundImage = `url('https://img.youtube.com/vi/${videoId}/hqdefault.jpg')`;
              videoItem.style.backgroundSize = 'cover';
              videoItem.style.backgroundPosition = 'center';
            } else {
              videoItem.style.background = '#000';
            }
            const overlay = document.createElement('div');
            overlay.classList.add('video-text-overlay');
            overlay.innerHTML = `<strong>${video.title}</strong><br><span>${video.description}</span>`;
            videoItem.appendChild(overlay);
            videoItem.addEventListener('click', function() {
              window.open(video.youtubeUrl, '_blank');
            });
            container.appendChild(videoItem);
          }
        });
      } else {
        console.error("No videos found in data/videos.json");
      }
      callback(videoMatchesCount);
    })
    .catch(error => {
      console.error("Error fetching videos for search results:", error);
      callback(0);
    });
}

// ====================
// Scroll-Based Glow Effect for Morning Video
// ====================
window.addEventListener('scroll', function() {
  const videoRect = document.getElementById('morning-video-rectangle');
  if (videoRect) {
    const rect = videoRect.getBoundingClientRect();
    const viewportCenter = window.innerHeight / 2;
    if (rect.top < viewportCenter + 100 && rect.bottom + 200 > viewportCenter) {
      videoRect.classList.add('glow');
    } else {
      videoRect.classList.remove('glow');
    }
  }
});

// ====================
// Time-Based Video Heading
// ====================
document.addEventListener('DOMContentLoaded', function() {
  const videoSubheader = document.getElementById('morning-video-subheader');
  if (videoSubheader) {
    const hour = new Date().getHours();
    let titleText = "";
    if (hour >= 0 && hour < 1) {
      titleText = "Midnight Video";
    } else if (hour >= 1 && hour < 4) {
      titleText = "Why are you awake Video";
    } else if (hour >= 4 && hour < 7) {
      titleText = "Early Morning Video";
    } else if (hour >= 7 && hour < 12) {
      titleText = "Morning Video";
    } else if (hour >= 12 && hour < 15) {
      titleText = "Afternoon Video";
    } else if (hour >= 15 && hour < 18) {
      titleText = "Evening Video";
    } else if (hour >= 18 && hour < 21) {
      titleText = "Night Video";
    } else if (hour >= 21 && hour < 24) {
      titleText = "Late night Video";
    }
    const headerElem = videoSubheader.querySelector('h2');
    if (headerElem) {
      headerElem.textContent = titleText;
    }
  }
});

// ====================
// Offline Indicator & Translation Switcher in Footer
// ====================
document.addEventListener('DOMContentLoaded', function() {
  const footer = document.getElementById('footer');
  const currentTranslationEl = document.getElementById('current-translation');
  const translationScrollbar = document.getElementById('translation-scrollbar');
  const translationOptions = document.querySelectorAll('#translation-scrollbar .translation-option');
  const offlineIndicator = document.getElementById('offline-indicator');
  const settingsBtn = document.getElementById('settings-btn');

  currentTranslationEl.addEventListener('click', function(e) {
    e.stopPropagation();
    if (translationScrollbar.style.display === 'flex') {
      translationScrollbar.style.display = 'none';
      if (offlineIndicator) offlineIndicator.style.display = 'block';
      if (settingsBtn) settingsBtn.style.display = 'block';
    } else {
      translationScrollbar.style.display = 'flex';
      if (offlineIndicator) offlineIndicator.style.display = 'none';
      if (settingsBtn) settingsBtn.style.display = 'none';
    }
  });

  translationOptions.forEach(function(option) {
    option.addEventListener('click', function(e) {
      e.stopPropagation();
      const newTranslation = this.getAttribute('data-translation');
      currentTranslationEl.textContent = newTranslation;
      translationScrollbar.style.display = 'none';
      if (offlineIndicator) offlineIndicator.style.display = 'block';
      if (settingsBtn) settingsBtn.style.display = 'block';
      updateBibleTranslation(newTranslation);
      localStorage.setItem('selectedTranslation', newTranslation);
      initDailyInspiration();
    });
  });

  document.addEventListener('click', function(e) {
    if (footer && !footer.contains(e.target)) {
      translationScrollbar.style.display = 'none';
      if (offlineIndicator) offlineIndicator.style.display = 'block';
      if (settingsBtn) settingsBtn.style.display = 'block';
    }
  });

  const savedTranslation = localStorage.getItem('selectedTranslation');
  if (savedTranslation) {
    currentTranslationEl.textContent = savedTranslation;
    updateBibleTranslation(savedTranslation);
  }
});

// ====================
// Offline Indicator & Settings Modal
// ====================
document.addEventListener('DOMContentLoaded', function() {
  function updateOfflineIndicator() {
    const indicator = document.getElementById('offline-indicator');
    const indicatorText = document.getElementById('offline-indicator-text');
    if (navigator.onLine) {
      indicator.style.color = "#995";
      if (indicatorText) {
        indicatorText.textContent = "Online";
        indicatorText.style.color = "#0f0";
      }
    } else {
      indicator.style.color = "#ffbd2e9c";
      if (indicatorText) {
        indicatorText.textContent = "Offline";
        indicatorText.style.color = "#C84C09";
      }
    }
  }
  updateOfflineIndicator();
  window.addEventListener('online', updateOfflineIndicator);
  window.addEventListener('offline', updateOfflineIndicator);

  const settingsBtn = document.getElementById('settings-btn');
  const settingsModal = document.getElementById('settings-modal');
  const settingsClose = document.getElementById('settings-close');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      settingsModal.style.display = 'flex';
      setTimeout(() => settingsModal.classList.add('show'), 10);
    });
  }
  if (settingsClose) {
    settingsClose.addEventListener('click', function(e) {
      e.stopPropagation();
      settingsModal.classList.remove('show');
      setTimeout(() => settingsModal.style.display = 'none', 500);
    });
  }
  window.addEventListener('click', function(e) {
    if (e.target === settingsModal) {
      settingsModal.classList.remove('show');
      setTimeout(() => settingsModal.style.display = 'none', 500);
    }
  });

  const themeRadios = document.getElementsByName('theme');
  themeRadios.forEach(radio => {
    radio.addEventListener('change', function() {
      if (this.value === 'light') {
        document.body.classList.add('light-theme');
      } else {
        document.body.classList.remove('light-theme');
      }
      localStorage.setItem('selectedTheme', this.value);
    });
  });
  

  const fontSizeRadios = document.getElementsByName('font-size');
  fontSizeRadios.forEach(radio => {
    radio.addEventListener('change', function() {
      if (this.value === 'small') {
        document.documentElement.style.setProperty('--base-font-size', '14px');
      } else if (this.value === 'medium') {
        document.documentElement.style.setProperty('--base-font-size', '16px');
      } else if (this.value === 'large') {
        document.documentElement.style.setProperty('--base-font-size', '18px');
      }
    });
  });

  const favoritesToggle = document.getElementById('favorites-filter-toggle');
  if (favoritesToggle) {
    favoritesToggle.addEventListener('change', function() {
      localStorage.setItem('favoritesFilter', this.checked ? 'true' : 'false');
      applyFavoritesFilter();
    });
    if (localStorage.getItem('favoritesFilter') === 'true') {
      favoritesToggle.checked = true;
      applyFavoritesFilter();
    }
  }
});

// ====================
// Prayer Section
// ====================

/**
 * Initializes the Prayer Section.
 * It fetches prayers from data/prayers.json and randomly selects one to display.
 */
function initPrayers() {
  fetch('data/prayers.json')
    .then(response => {
      if (!response.ok) {
        console.error("Error fetching prayers.json", response.statusText);
      }
      return response.json();
    })
    .then(data => {
      if (data.prayers && data.prayers.length > 0) {
        const randomIndex = Math.floor(Math.random() * data.prayers.length);
        const prayer = data.prayers[randomIndex];
        const prayerElem = document.getElementById('prayer-text');
        if (prayerElem) {
          prayerElem.textContent = prayer;
        } else {
          console.error("Element with id 'prayer-text' not found.");
        }
      } else {
        console.error("No prayers found in prayers.json");
      }
    })
    .catch(error => {
      console.error("Error loading prayers.json", error);
    });
}

document.addEventListener('DOMContentLoaded', function() {
  initPrayers();
});

document.addEventListener('DOMContentLoaded', function() {
  const togglePrayerBtn = document.getElementById('toggle-prayer');
  const prayerContent = document.getElementById('prayer-content');

  togglePrayerBtn.addEventListener('click', function() {
    if (prayerContent.classList.contains('expanded')) {
      prayerContent.classList.remove('expanded');
      togglePrayerBtn.textContent = 'Show More';
    } else {
      prayerContent.classList.add('expanded');
      togglePrayerBtn.textContent = 'Show Less';
    }
  });
});

document.addEventListener('DOMContentLoaded', function() {
  const fontSizeSlider = document.getElementById('font-size-slider');
  const fontSizeValue = document.getElementById('font-size-value');

  if (fontSizeSlider && fontSizeValue) {
    // Initialize the slider's value display.
    fontSizeValue.textContent = fontSizeSlider.value + 'px';

    fontSizeSlider.addEventListener('input', function() {
      const newSize = this.value;
      // Update the CSS variable on the root element.
      document.documentElement.style.setProperty('--base-font-size', newSize + 'px');
      // Update the displayed value next to the slider.
      fontSizeValue.textContent = newSize + 'px';
    });
  }
});


document.addEventListener('DOMContentLoaded', function() {
  const resetBtn = document.getElementById('reset-settings');
  if (resetBtn) {
    resetBtn.addEventListener('click', function() {
      // Reset Font Size to default (16px)
      const defaultSize = "16";
      const fontSizeSlider = document.getElementById('font-size-slider');
      const fontSizeValue = document.getElementById('font-size-value');
      fontSizeSlider.value = defaultSize;
      document.documentElement.style.setProperty('--base-font-size', defaultSize + 'px');
      fontSizeValue.textContent = defaultSize + 'px';
      localStorage.setItem('baseFontSize', defaultSize);
      
      // Reset Theme to default dark
      const themeRadios = document.getElementsByName('theme');
      themeRadios.forEach(radio => {
        if (radio.value === 'dark') {
          radio.checked = true;
        } else {
          radio.checked = false;
        }
      });
      document.body.classList.remove('light-theme');
      localStorage.setItem('selectedTheme', 'dark');
      
      // Reset the favorites filter (if implemented)
      const favoritesToggle = document.getElementById('favorites-filter-toggle');
      if (favoritesToggle) {
        favoritesToggle.checked = false;
        localStorage.setItem('favoritesFilter', 'false');
        applyFavoritesFilter();
      }
      
      // No alert will be shown.
    });
  }
});

// document.addEventListener('DOMContentLoaded', function() {
//   console.log("Theme toggle code loaded.");
//   const themeRadios = document.getElementsByName('theme');
  
//   // Check if theme radios exist
//   if (themeRadios.length === 0) {
//     console.error("No theme radio buttons found.");
//   }
  
//   themeRadios.forEach(radio => {
//     radio.addEventListener('change', function() {
//       console.log("Theme radio changed. New value:", this.value);
//       if (this.value === 'light') {
//         document.body.classList.add('light-theme');
//         console.log("Light theme applied.");
//       } else {
//         document.body.classList.remove('light-theme');
//         console.log("Dark theme applied.");
//       }
//       localStorage.setItem('selectedTheme', this.value);
//     });
//   });
// });

document.addEventListener('DOMContentLoaded', function() {
  const footer = document.getElementById('footer');
  const currentTranslationEl = document.getElementById('current-translation');
  const translationScrollbar = document.getElementById('translation-scrollbar');
  const translationOptions = document.querySelectorAll('#translation-scrollbar .translation-option');
  const offlineIndicator = document.getElementById('offline-indicator');
  const settingsBtn = document.getElementById('settings-btn');

  // Toggle the translation switcher
  currentTranslationEl.addEventListener('click', function (e) {
    e.stopPropagation();
    // If the dropdown is currently visible, hide it and show the current translation text plus extras
    if (translationScrollbar.style.display === 'flex') {
      translationScrollbar.style.display = 'none';
      currentTranslationEl.style.display = 'block';
      if (offlineIndicator) offlineIndicator.style.display = 'block';
      if (settingsBtn) settingsBtn.style.display = 'block';
    } else {
      // Hide the current translation text and extras, then show the dropdown
      translationScrollbar.style.display = 'flex';
      currentTranslationEl.style.display = 'none';
      if (offlineIndicator) offlineIndicator.style.display = 'none';
      if (settingsBtn) settingsBtn.style.display = 'none';
    }
  });

  // When a translation option is clicked, update the translation, hide the dropdown, and restore extras
  translationOptions.forEach(function (option) {
    option.addEventListener('click', function (e) {
      e.stopPropagation();
      const newTranslation = this.getAttribute('data-translation');
      currentTranslationEl.textContent = newTranslation;
      translationScrollbar.style.display = 'none';
      // Restore current translation text and extras after selection
      currentTranslationEl.style.display = 'block';
      if (offlineIndicator) offlineIndicator.style.display = 'block';
      if (settingsBtn) settingsBtn.style.display = 'block';
      updateBibleTranslation(newTranslation);
      localStorage.setItem('selectedTranslation', newTranslation);
      initDailyInspiration();
    });
  });

  // Hide the translation dropdown if clicking outside the footer and restore extras
  document.addEventListener('click', function (e) {
    if (footer && !footer.contains(e.target)) {
      translationScrollbar.style.display = 'none';
      currentTranslationEl.style.display = 'block';
      if (offlineIndicator) offlineIndicator.style.display = 'block';
      if (settingsBtn) settingsBtn.style.display = 'block';
    }
  });

  // On page load, if a saved translation exists, update it.
  const savedTranslation = localStorage.getItem('selectedTranslation');
  if (savedTranslation) {
    currentTranslationEl.textContent = savedTranslation;
    updateBibleTranslation(savedTranslation);
  }
});

