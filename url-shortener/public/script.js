document.addEventListener('DOMContentLoaded', () => {
    const urlForm = document.getElementById('urlForm');
    const resultDiv = document.getElementById('result');
    const errorDiv = document.getElementById('error');
    const shortUrlInput = document.getElementById('shortUrl');
    const copyButton = document.getElementById('copyButton');
    const expirySpan = document.getElementById('expiry');
    const logIdSpan = document.getElementById('logId');
    const statsDiv = document.getElementById('stats');
    const totalClicksSpan = document.getElementById('totalClicks');
    const clicksList = document.getElementById('clicksList');

    urlForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError();
        hideResult();
        hideStats();

        const formData = {
            url: urlForm.url.value,
            validity: parseInt(urlForm.validity.value) || 30
        };

        if (urlForm.shortcode.value) {
            formData.shortcode = urlForm.shortcode.value;
        }

        try {
            const response = await fetch('/shorturls', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create short URL');
            }

            showResult(data);
            if (data.shortLink) {
                const shortcode = data.shortLink.split('/').pop();
                fetchStats(shortcode);
            }
        } catch (error) {
            showError(error.message);
        }
    });

    copyButton.addEventListener('click', () => {
        shortUrlInput.select();
        document.execCommand('copy');
        copyButton.textContent = 'Copied!';
        setTimeout(() => {
            copyButton.textContent = 'Copy';
        }, 2000);
    });

    async function fetchStats(shortcode) {
        try {
            const response = await fetch(`/shorturls/${shortcode}/stats`);
            const data = await response.json();

            if (response.ok) {
                showStats(data);
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    }

    function showResult(data) {
        shortUrlInput.value = data.shortLink;
        expirySpan.textContent = new Date(data.expiry).toLocaleString();
        logIdSpan.textContent = data.logID;
        resultDiv.classList.remove('hidden');
    }

    function showStats(data) {
        totalClicksSpan.textContent = data.totalClicks;
        clicksList.innerHTML = data.clicksData?.map(click => `
            <div class="click-item">
                <div>Time: ${new Date(click.clickTimestamp).toLocaleString()}</div>
                <div>Source: ${click.sourceReferrer}</div>
                <div>Location: ${click.geoLocation}</div>
            </div>
        `).join('') || '';
        statsDiv.classList.remove('hidden');
    }

    function showError(message) {
        errorDiv.querySelector('.error-message').textContent = message;
        errorDiv.classList.remove('hidden');
    }

    function hideError() {
        errorDiv.classList.add('hidden');
    }

    function hideResult() {
        resultDiv.classList.add('hidden');
    }

    function hideStats() {
        statsDiv.classList.add('hidden');
    }
});
