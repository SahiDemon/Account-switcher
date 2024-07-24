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

                // Retrieve the account details
                chrome.storage.local.get('storedAccounts', (result) => {
                    const account = result.storedAccounts.find(acc => acc.name === request.accountDetails.name);
                    if (!account || !account.cookies) {
                        console.error("No cookies found for this account.");
                        return;
                    }

                    const storedCookies = account.cookies;
                    storedCookies.forEach(storedCookie => {
                        // Ensure correct domain and URL format for setting cookies
                        const cookieDetails = {
                            url: `https://chatgpt.com${storedCookie.path || '/'}`,
                            name: storedCookie.name,
                            value: storedCookie.value,
                            domain: storedCookie.domain,
                            secure: true, // Ensure the cookie is set over HTTPS
                            httpOnly: storedCookie.httpOnly || false, // Set HttpOnly attribute if present
                            sameSite: storedCookie.sameSite || 'Lax' // Set SameSite attribute if present
                        };

                        chrome.cookies.set(cookieDetails, (cookie) => {
                            if (chrome.runtime.lastError) {
                                console.error(`Failed to set cookie: ${storedCookie.name}`, chrome.runtime.lastError);
                            } else {
                                console.log(`Set cookie: ${storedCookie.name}`);
                            }
                        });
                    });

                    // Reload the page to apply new cookies
                    chrome.tabs.reload(tab.id);
                });
            });
        });
    }
});
