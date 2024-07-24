chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'switchAccount') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length === 0) {
                console.error("No active tab identified.");
                return;
            }
            let tab = tabs[0];
            console.log(`Active tab identified: ${tab.id}`);

            // Clear existing cookies for the site
            chrome.cookies.getAll({ url: "https://chatgpt.com" }, (cookies) => {
                cookies.forEach(cookie => {
                    chrome.cookies.remove({ url: `https://chatgpt.com${cookie.path}`, name: cookie.name }, () => {
                        console.log(`Removed cookie: ${cookie.name}`);
                    });
                });

                // Retrieve and set new cookies from local storage
                chrome.storage.local.get("storedCookies", (result) => {
                    const storedCookies = result.storedCookies || [];
                    storedCookies.forEach(storedCookie => {
                        // Ensure correct domain and URL format for setting cookies
                        chrome.cookies.set({
                            url: `https://chatgpt.com${storedCookie.path || '/'}`,
                            name: storedCookie.name,
                            value: storedCookie.value,
                            domain: storedCookie.domain,
                        }, () => {
                            console.log(`Set cookie: ${storedCookie.name}`);
                        });
                    });

                    // Reload the page to apply new cookies
                    chrome.tabs.reload(tab.id);
                });
            });
        });
    }
});

// Function to get cookies from the current tab
function getSessionCookies(callback) {
    // Get the current tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length === 0) {
            console.error("No active tab identified.");
            return;
        }
        var currentTab = tabs[0];
        console.log(`Current tab identified for cookie retrieval: ${currentTab.id}`);

        // Get all cookies for the current tab's domain
        chrome.cookies.getAll({ url: currentTab.url }, (cookies) => {
            // Filter or process cookies as needed, here we simply pass all cookies
            callback(cookies);
        });
    });
}

// Example usage
getSessionCookies((cookies) => {
    // Store cookies locally
    chrome.storage.local.set({ "storedCookies": cookies }, () => {
        console.log("Cookies stored locally.");
    });
});
