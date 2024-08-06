document.addEventListener('DOMContentLoaded', function() {
    const accountsList = document.getElementById('accounts-list');
    const storeCookieBtn = document.getElementById('storeCookieBtn');
    const siteMessage = document.getElementById('site-message');

    // Function to fetch and display accounts
    function displayAccounts() {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            var currentTab = tabs[0];
            if (!currentTab) {
                console.error("No active tab identified.");
                return;
            }
            let url = new URL(currentTab.url);
            let baseUrl = `${url.protocol}//${url.host}`;

            chrome.storage.local.get('storedAccounts', function(data) {
                const accounts = data.storedAccounts || [];
                accountsList.innerHTML = ''; // Clear existing list
                const siteAccounts = accounts.filter(account => {
                    return account.cookies.some(cookie => cookie.domain.includes(url.host));
                });

                if (siteAccounts.length > 0) {

                    const heading = document.createElement('h2');
                    heading.textContent = `Accounts for ${url.hostname}`;
                    accountsList.appendChild(heading);
                    siteAccounts.forEach((account, index) => {
                        const li = document.createElement('li');
                        li.className = 'account-item';

                        const accountNameSpan = document.createElement('span');
                        accountNameSpan.textContent = `Account ${index + 1}: ${account.name}`;
                        accountNameSpan.className = 'account-name';

                        const deleteBtn = document.createElement('button');
                        deleteBtn.textContent = 'Delete';
                        deleteBtn.className = 'delete-btn';
                        deleteBtn.onclick = function() {
                            accounts.splice(accounts.indexOf(account), 1);
                            chrome.storage.local.set({'storedAccounts': accounts}, function() {
                                console.log(`Deleted account: ${account.name}`);
                                displayAccounts(); // Refresh the accounts list
                            });
                        };

                        const renameBtn = document.createElement('button');
                        renameBtn.innerHTML = '✏️'; // Pencil icon for rename
                        renameBtn.className = 'rename-btn';
                        renameBtn.style.fontSize = '10px'; // Set font size to make the icon smaller
                        renameBtn.style.transform = 'translateX(70px)'; // Move the button to the right using transform

                        renameBtn.onclick = function(event) {
                            event.stopPropagation(); // Prevent triggering the account switch
                            const newName = prompt("Enter new account name:", account.name);
                            if (newName) {
                                account.name = newName;
                                chrome.storage.local.set({'storedAccounts': accounts}, function() {
                                    console.log(`Renamed account to: ${newName}`);
                                    displayAccounts(); // Refresh the accounts list
                                });
                            }
                        };

                        li.appendChild(accountNameSpan);
                        li.appendChild(renameBtn);
                        li.appendChild(deleteBtn);
                        li.onclick = function() {
                            // Logic to switch to this account
                            console.log(`Switching to account: ${account.name}`);
                            // Send a message to background.js to switch account
                            chrome.runtime.sendMessage({action: 'switchAccount', accountDetails: account});
                        };
                        accountsList.appendChild(li);
                    });
                } else {
                    siteMessage.textContent = `No accounts available for ${url.host}`;
                }
            });
        });
    }

    // Call displayAccounts to populate the list at startup
    displayAccounts();

    // Logic to add a new account
    storeCookieBtn.addEventListener('click', function() {
        const accountName = prompt("Enter account name:");
        if (accountName) {
            getSessionCookies(function(cookies) {
                chrome.storage.local.get('storedAccounts', function(data) {
                    const accounts = data.storedAccounts || [];
                    
                    // Check for duplicate cookies
                    const duplicateAccount = accounts.find(account => {
                        return account.cookies.length === cookies.length && 
                               account.cookies.every((cookie, index) => 
                                   cookie.name === cookies[index].name && 
                                   cookie.value === cookies[index].value && 
                                   cookie.domain === cookies[index].domain && 
                                   cookie.path === cookies[index].path);
                    });

                    if (duplicateAccount) {
                        alert('An account with the same cookies already exists.');
                        return;
                    }

                    // Add the new account if no duplicates are found
                    accounts.push({name: accountName, cookies: cookies});
                    chrome.storage.local.set({'storedAccounts': accounts}, function() {
                        console.log('Account added with cookies');
                        displayAccounts(); // Refresh the accounts list
                        // Additional logging
                        chrome.storage.local.get('storedAccounts', function(data) {
                            console.log('Stored accounts:', data.storedAccounts);
                        });
                    });
                });
            });
        }
    });
});

// Function to get cookies from the current tab
function getSessionCookies(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        var currentTab = tabs[0];
        if (!currentTab) {
            console.error("No active tab identified.");
            return;
        }
        chrome.cookies.getAll({ url: currentTab.url }, function(cookies) {
            callback(cookies);
        });
    });
}
