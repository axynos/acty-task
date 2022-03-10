const baseUrl = 'https://api.shrtco.de/v2/shorten';

const storageKey = 'shortly-urls';
const storage = window.localStorage;

const formId = 'shorten-form';
const resultListId = 'shorten-results';
const errorElemId = 'error-message';

let shortenedUrls = [];
let timeouts = {};

const elemById = (id) => {return document.getElementById(id)};

const handleSubmit = (event) => {
  event.preventDefault();

  const formElement = elemById(formId);
  const formData = new FormData(formElement);
  const url = formData.get('url');

  shortenLink(url).then(data => {
    if (data.ok) {
      shortenedUrls = shortenedUrls.concat({
        timestamp: new Date(),
        longUrl: url,
        shortUrl: data.result.full_short_link,
      })

      updateResultList()
    } else {
      const errorElement = elemById(errorElemId);

      if (data.error) {
        // Dangerously (XSS) set innerHTML.
        errorElement.innerHTML = `<p>${data.error}</p>`;
      }
    }
  });
}

const bindFormSubmit = () => {
  const formElement = elemById(formId);
  formElement.addEventListener('submit', handleSubmit);
}


const shortenLink = async (url) => {
  const response = await fetch(`${baseUrl}?${new URLSearchParams({ url })}`, {
    method: 'POST',
    cache: 'no-cache',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    redirect: 'follow',
    referrerPolicy: 'no-referrer'
  });


  return await response.json();
}

const sortShortenedUrls = () => {
  let sorted = shortenedUrls
  sorted.sort((a,b) => {
    parsedA = Date.parse(a.timestamp);
    parsedB = Date.parse(b.timestamp);

    return parsedB - parsedA;

  })

  shortenedUrls = sorted
}

const clearShortenedUrls = () => {
  shortenedUrls = []
}

const addResultListing = (result) => {
  const resultsSection = elemById(resultListId);
  const resultElement = document.createElement('article');

  const longUrlElem = `<a class="link" href=${result.longUrl}>${result.longUrl}</a>`;
  const shortUrlElem = `<a class="link" href=${result.shortUrl}>${result.shortUrl}</a>`;
  const copyButton = `<a id="copy-${result.timestamp}" href="${result.shortUrl}" class="button filled square"></a>`;

  // Dangerously set innerHTML.
  resultElement.innerHTML = `${longUrlElem}${shortUrlElem}${copyButton}`;
  resultsSection.appendChild(resultElement);

  const copyButtonElem = elemById(`copy-${result.timestamp}`);
  copyButtonElem.addEventListener('click', handleCopyClick);
}

const updateResultList = () => {
  sortShortenedUrls()
  clearResultList();
  shortenedUrls.forEach((result) => {
    addResultListing(result);
  });
}

const clearResultList = () => {
  elemById(resultListId).innerHTML = '';
}

const addCopiedClass = (id) => {
  elemById(id).classList.add('copied');
}

const removeCopiedClass = (id) => {
  elemById(id).classList.remove('copied');
}

const handleCopyClick = (e) => {
  e.preventDefault();
  const id = e.target.id;

  if (timeouts[id]) {
    // Avoid a previous timeout
    // overwriting the current state.
    clearTimeout(timeouts[id]);
    delete timeouts[id];
  }

  addCopiedClass(id)

  timeouts[id] = setTimeout(() => {
    removeCopiedClass(id)

    // Remove reference to timeout as we finish.
    delete timeouts[id];
    
  }, 1500);

  navigator?.clipboard?.writeText(e.target.href);
}

const saveShortenedUrls = () => {
  storage.setItem(storageKey, JSON.stringify(shortenedUrls));
}

const loadShortenedUrls = async () => {
  const data = storage.getItem(storageKey);
  shortenedUrls = JSON.parse(data) ?? [];
}

window.onload = () => {
  loadShortenedUrls();
  updateResultList();
  bindFormSubmit();
}

window.onbeforeunload = () => {
  saveShortenedUrls()
}
