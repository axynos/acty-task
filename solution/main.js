const baseUrl = 'https://api.shrtco.de/v2/shorten';
const storageKey = 'shortly-urls';
const storage = window.localStorage;
const resultListId = 'shorten-results';
let shortenedUrls = [];
let timeouts = {};

const handleSubmit = (event) => {
  event.preventDefault();
  const formElement = document.getElementById('form-shorten');
  const formData = new FormData(formElement);
  const url = formData.get('url');


  shortenLink(url).then(data => {
    shortenedUrls = shortenedUrls.concat({
      timestamp: new Date(),
      longUrl: url,
      shortUrl: data.result.full_short_link,
    })

    updateResultList()
  });
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

const clearShortenedUrls = () => {
  shortenedUrls = []
}

const clearResultList = () => {
  document.getElementById(resultListId).innerHTML = '';
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

const updateResultList = () => {
  sortShortenedUrls()
  clearResultList();
  shortenedUrls.forEach((result) => {
    addResultListing(result);
  });
}

const addCopiedStatus = (id) => {
  document.getElementById(id).classList.add('copied');
}

const removeCopiedStatus = (id) => {
  document.getElementById(id).classList.remove('copied');
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

  addCopiedStatus(id)

  timeouts[id] = setTimeout(() => {
    removeCopiedStatus(id)

    // Remove reference to timeout as we finish.
    delete timeouts[id];
    
  }, 1500);

  navigator?.clipboard?.writeText(e.target.href);
}

const addResultListing = (result) => {
  const resultsSection = document.getElementById(resultListId);
  const resultElement = document.createElement('article');
  const longUrlElem = `<a class="link" href=${result.longUrl}>${result.longUrl}</a>`;
  const shortUrlElem = `<a class="link" href=${result.shortUrl}>${result.shortUrl}</a>`;
  const copyButton = `<a id="copy-${result.timestamp}" href="${result.shortUrl}" class="button filled square"></a>`;
  resultElement.innerHTML = `${longUrlElem}${shortUrlElem}${copyButton}`;
  resultsSection.appendChild(resultElement);

  const copyButtonElem = document.getElementById(`copy-${result.timestamp}`);
  copyButtonElem.addEventListener('click', handleCopyClick);
}

const saveShortenedUrls = () => {
  storage.setItem(storageKey, JSON.stringify(shortenedUrls));
}

const loadShortenedUrls = async () => {
  const data = storage.getItem(storageKey);
  shortenedUrls = JSON.parse(data);
}

window.onload = () => {
  loadShortenedUrls();
  updateResultList();
  const formElement = document.getElementById('form-shorten');
  formElement.addEventListener('submit', handleSubmit);
}

window.onbeforeunload = () => {
  saveShortenedUrls()
}
