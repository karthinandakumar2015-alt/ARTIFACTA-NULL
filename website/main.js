document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const searchResults = document.getElementById('search-results');
    const searchEngine = document.getElementById('search-engine');
    const mainSite = document.getElementById('main-site');
    const visitBtn = document.getElementById('visit-site-btn');
    const backToSearch = document.getElementById('back-to-search');

    // Search Logic
    const archeoKeywords = [
        'archaeology', 'archeology', 'archaeologist', 'artifact', 'ancient', 'excavation', 'ruins',
        'prehistoric', 'tomb', 'relic', 'civilization', 'dynasty', 'historical', 'museum', 'mummy',
        'pharaoh', 'dig site', 'antiquity', 'statue', 'manuscript', 'fragment', 'remains', 'burial',
        'pottery', 'jewelry', 'inscription', 'monument', 'discovery', 'temple', 'unearth'
    ];

    const searchWikipedia = async (query) => {
        try {
            // Step 1: Search for the best matching page title
            const searchRes = await fetch(`https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=1&namespace=0&format=json&origin=*`);
            const searchData = await searchRes.json();

            if (searchData && searchData[1].length > 0) {
                const bestTitle = searchData[1][0];

                // Step 2: Fetch the summary for that title
                const summaryRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(bestTitle)}`);
                if (summaryRes.ok) {
                    const data = await summaryRes.json();

                    // Step 3: Verify archaeology relevance
                    const extractText = data.extract.toLowerCase();
                    const titleText = data.title.toLowerCase();
                    const isRelevant = archeoKeywords.some(kw => extractText.includes(kw) || titleText.includes(kw));

                    if (isRelevant) return data;
                }
            }
        } catch (error) {
            console.error('Error in intelligent search:', error);
        }
        return null;
    };

    const handleSearch = async () => {
        const query = searchInput.value.trim();
        if (!query) return;

        // Visual feedback for searching
        searchBtn.innerHTML = '<span class="loader"></span>';

        const data = await searchWikipedia(query);

        if (data && data.extract) {
            // Update Featured Snippet
            document.querySelector('.snippet-text h2').textContent = data.title;
            document.querySelector('.snippet-text p').textContent = data.extract;

            // If Wikipedia has an image, use it, otherwise keep defaults
            if (data.thumbnail) {
                document.querySelector('.snippet-images img').src = data.thumbnail.source;
            }

            searchResults.classList.remove('hidden');
            searchEngine.style.paddingTop = '50px';
        } else {
            // Fallback for non-archaeology/not found
            searchResults.classList.add('hidden');
            alert('No significant archaeological or artifact-related history found for this query on Archaeology Prime.');
        }

        // Restore search icon
        searchBtn.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>';
    };

    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    // Navigation
    visitBtn.addEventListener('click', (e) => {
        e.preventDefault();
        searchEngine.classList.add('hidden');
        mainSite.classList.remove('hidden');
        window.scrollTo(0, 0);
        // Handle 3D Globe resize when container becomes visible
        if (window.archMap) {
            setTimeout(() => {
                const width = mapContainer.offsetWidth;
                const height = mapContainer.offsetHeight;
                window.archMap.width(width).height(height);
            }, 300);
        }
    });

    backToSearch.addEventListener('click', (e) => {
        e.preventDefault();
        mainSite.classList.add('hidden');
        searchEngine.classList.remove('hidden');
        window.scrollTo(0, 0);
    });

    // --- NEW: 3D Globe Logic ---
    const mapContainer = document.getElementById('interactive-map');
    const mapSearchInput = document.getElementById('map-site-search');
    const mapSearchBtn = document.getElementById('map-search-btn');
    const homeInput = document.getElementById('home-location-input');
    const setHomeBtn = document.getElementById('set-home-btn');
    const infoPanel = document.getElementById('globe-info-panel');
    const closeInfoBtn = document.getElementById('close-info-panel');
    const infoTitle = document.getElementById('info-title');
    const infoDescription = document.getElementById('info-description');
    const navigateBtn = document.getElementById('navigate-btn');
    const navError = document.getElementById('nav-error');

    let homeLocation = null; // { lat, lng, name }
    let currentDestination = null; // { lat, lng, name }

    const sites = [
        { name: 'Valley of the Kings', lat: 25.7402, lng: 32.6014, era: 'Ancient Egypt', desc: 'Home to the artifacts of Tutankhamun and many pharaohs.' },
        { name: 'Angkor Wat', lat: 13.4125, lng: 103.8670, era: 'Khmer Empire', desc: 'Temple complex containing thousands of relief carvings and statues.' },
        { name: 'Machu Picchu', lat: -13.1631, lng: -72.5450, era: 'Inca Empire', desc: 'The Lost City, source of many gold and ceramic Inca artifacts.' },
        { name: 'Pompeii', lat: 40.7512, lng: 14.4869, era: 'Roman Empire', desc: 'A city frozen in time, filled with daily-life Roman artifacts.' },
        { name: 'Stonehenge', lat: 51.1789, lng: -1.8262, era: 'Neolithic', desc: 'Prehistoric monument; surrounding burials yielded gold and bronze artifacts.' },
        { name: 'Great Pyramid of Giza', lat: 29.9792, lng: 31.1342, era: 'Old Kingdom', desc: 'Monumental tomb that originally contained vast funerary treasures.' },
        { name: 'Chichen Itza', lat: 20.6843, lng: -88.5678, era: 'Mayan', desc: 'Sacred cenote yielded thousands of ritual artifact offerings.' },
        { name: 'Petra', lat: 30.3285, lng: 35.4444, era: 'Nabataean', desc: 'Carved stone architecture and Hellenistic-style artifacts.' },
        { name: 'Colosseum', lat: 41.8902, lng: 12.4922, era: 'Roman', desc: 'Center of Roman life; yielding gladiatorial weapons and coins.' },
        { name: 'Terracotta Army', lat: 34.3841, lng: 109.2785, era: 'Qin Dynasty', desc: '8,000 unique life-sized clay soldier artifacts.' }
    ];

    const globe = Globe()
        (mapContainer)
        .width(window.innerWidth)
        .height(window.innerHeight)
        .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
        .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
        .backgroundImageUrl('https://unpkg.com/three-globe/example/img/night-sky.png')
        .backgroundColor('rgba(0,0,0,0)') // Transparent background to show space image
        .atmosphereColor('lightskyblue')
        .atmosphereAltitude(0.15)
        .showAtmosphere(true)
        .pointsData(sites)
        .pointLat('lat')
        .pointLng('lng')
        .pointColor(() => '#c9a66b')
        .pointAltitude(0.1)
        .pointRadius(0.5)
        .pointsMerge(true)
        .arcColor(() => 'rgba(40, 167, 69, 0.6)')
        .arcDashLength(0.4)
        .arcDashGap(4)
        .arcDashInitialGap(() => Math.random() * 5)
        .arcDashAnimateTime(1000)
        .onPointClick(point => {
            currentDestination = { lat: point.lat, lng: point.lng, name: point.name };
            showInfo(point.name, point.desc, true);
            globe.pointOfView({ lat: point.lat, lng: point.lng, altitude: 1.5 }, 1000);
        });

    // Auto-rotate
    globe.controls().autoRotate = true;
    globe.controls().autoRotateSpeed = 0.5;

    window.archMap = globe; // For global access

    // Handle Window Resize
    window.addEventListener('resize', () => {
        const width = mapContainer.offsetWidth;
        const height = mapContainer.offsetHeight;
        globe.width(width).height(height);
    });

    const showInfo = (title, description, toggleNav = false) => {
        infoTitle.textContent = title;
        infoDescription.textContent = description;
        infoPanel.classList.remove('hidden');
        if (toggleNav) {
            navigateBtn.classList.remove('hidden');
            navError.classList.add('hidden');
        } else {
            navigateBtn.classList.add('hidden');
        }
    };

    closeInfoBtn.addEventListener('click', () => {
        infoPanel.classList.add('hidden');
    });

    const geocode = async (query) => {
        // Use a more robust Nominatim search with forced result limit
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&accept-language=en`;
        const res = await fetch(url, {
            headers: { 'User-Agent': 'ArtifactaNull_App_v1' }
        });
        const data = await res.json();
        return data.length > 0 ? data[0] : null;
    };

    const handleSetHome = async () => {
        const query = homeInput.value.trim();
        if (!query) return;

        setHomeBtn.textContent = 'Locating...';
        const location = await geocode(query);

        if (location) {
            const lat = parseFloat(location.lat);
            const lng = parseFloat(location.lon);
            const name = location.display_name.split(',')[0];

            homeLocation = { lat, lng, name };
            setHomeBtn.textContent = 'Home Set!';
            setHomeBtn.style.background = '#28a745';

            // Highlight home location
            globe.customLayerData([{ lat, lng, name }]);
            globe.customLayerElement(d => {
                const el = document.createElement('div');
                el.innerHTML = `<div style="color: white; background: #c9a66b; padding: 5px 10px; border-radius: 20px; font-size: 10px; border: 2px solid white;">YOU: ${d.name}</div>`;
                return el;
            });

            globe.pointOfView({ lat, lng, altitude: 1.5 }, 2000);
            globe.controls().autoRotate = false;
        } else {
            setHomeBtn.textContent = 'Not Found';
            setTimeout(() => {
                setHomeBtn.textContent = 'Set Home';
                setHomeBtn.style.background = '';
            }, 2000);
        }
    };

    const mapUniversalSearch = async (query) => {
        if (!query) return;

        try {
            const location = await geocode(query);

            if (location) {
                const lat = parseFloat(location.lat);
                const lng = parseFloat(location.lon);
                const displayName = location.display_name.split(',')[0];

                currentDestination = { lat, lng, name: displayName };
                globe.pointOfView({ lat, lng, altitude: 1.0 }, 2000);
                globe.controls().autoRotate = false;

                const wikiData = await searchWikipedia(query);
                if (wikiData) {
                    showInfo(wikiData.title, wikiData.extract, true);
                } else {
                    showInfo(displayName, `General location found. Explore the globe to find archaeological sites!`, true);
                }
            } else {
                alert('Location not found. Try searching for a specific city or landmark.');
            }
        } catch (error) {
            console.error('Map search error:', error);
        }
    };

    const startNavigation = () => {
        if (!homeLocation) {
            navError.classList.remove('hidden');
            return;
        }
        if (!currentDestination) return;

        // Draw Arc
        const arc = {
            startLat: homeLocation.lat,
            startLng: homeLocation.lng,
            endLat: currentDestination.lat,
            endLng: currentDestination.lng,
            name: `Route to ${currentDestination.name}`
        };

        globe.arcsData([arc]);

        // Fly camera to a midpoint altitude to show the transit
        globe.pointOfView({
            lat: (homeLocation.lat + currentDestination.lat) / 2,
            lng: (homeLocation.lng + currentDestination.lng) / 2,
            altitude: 2.0
        }, 3000);
    };

    mapSearchBtn.addEventListener('click', () => mapUniversalSearch(mapSearchInput.value));
    mapSearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') mapUniversalSearch(mapSearchInput.value);
    });

    setHomeBtn.addEventListener('click', handleSetHome);
    homeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSetHome();
    });

    navigateBtn.addEventListener('click', startNavigation);

    // Timeline Logic
    const timelineSlider = document.getElementById('timeline-slider');
    const eventYear = document.getElementById('event-year');
    const eventDesc = document.getElementById('event-desc');

    const timelineData = [
        { year: '2.5 Million BCE', desc: 'Early humans begin crafting stone tools in East Africa.' },
        { year: '10,000 BCE', desc: 'The Agricultural Revolution begins in the Fertile Crescent.' },
        { year: '3,100 BCE', desc: 'Hieroglyphic writing is developed in Ancient Egypt.' },
        { year: '450 BCE', desc: 'The Golden Age of Athens and the construction of the Parthenon.' },
        { year: '79 CE', desc: 'Mount Vesuvius erupts, preserving the city of Pompeii.' },
        { year: '1200 CE', desc: 'The rise of the Inca Empire in the South American Andes.' },
        { year: '1922 CE', desc: 'Howard Carter discovers the tomb of Tutankhamun.' },
        { year: '2026 CE', desc: 'Archaeology Prime launches the global discovery hub.' }
    ];

    timelineSlider.addEventListener('input', (e) => {
        const index = Math.floor((e.target.value / 100) * (timelineData.length - 1));
        eventYear.textContent = timelineData[index].year;
        eventDesc.textContent = timelineData[index].desc;
    });

    // --- NEW: Budget Simulator Logic ---
    const wasteCounter = document.getElementById('waste-counter');
    const optSlider = document.getElementById('optimization-slider');
    const optValue = document.getElementById('opt-value');
    const savingsAmount = document.getElementById('savings-amount');
    const savingsFill = document.getElementById('savings-fill');

    let currentWaste = 2450000000; // Starting point for global annual waste
    const wastePerSecond = 317; // Roughly $10B / year / 365 / 24 / 3600

    const updateSimulator = () => {
        currentWaste += wastePerSecond / 10; // Update every 100ms
        wasteCounter.textContent = `$${Math.floor(currentWaste).toLocaleString()}`;

        const optPercent = optSlider.value;
        const potentialSavings = currentWaste * (optPercent / 100);

        optValue.textContent = optPercent;
        savingsAmount.textContent = `$${Math.floor(potentialSavings).toLocaleString()}`;
        savingsFill.style.width = `${optPercent}%`;
    };

    if (wasteCounter) {
        setInterval(updateSimulator, 100);
        optSlider.addEventListener('input', updateSimulator);
    }
});
