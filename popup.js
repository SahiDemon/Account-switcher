document.addEventListener('DOMContentLoaded', function() {
    const accountsList = document.getElementById('accounts-list');
    const storeCookieBtn = document.getElementById('storeCookieBtn');

    // Function to fetch and display accounts
    function displayAccounts() {
        chrome.storage.local.get('storedAccounts', function(data) {
            const accounts = data.storedAccounts || [];
            accountsList.innerHTML = ''; // Clear existing list
            accounts.forEach((account, index) => {
                const li = document.createElement('li');
                li.textContent = `Account ${index + 1}: ${account.name}`; // Customize display as needed
                li.onclick = function() {
                    // Logic to switch to this account
                    console.log(`Switching to account: ${account.name}`);
                    // Example: Send a message to background.js to switch account
                    chrome.runtime.sendMessage({action: 'switchAccount', accountDetails: account});
                };
                accountsList.appendChild(li);
            });
        });
    }

    // Call displayAccounts to populate the list at startup
    displayAccounts();

    // Logic to add a new account
    storeCookieBtn.addEventListener('click', function() {
        const accountName = prompt("Enter account name:");
        if (accountName) {
            chrome.storage.local.get('storedAccounts', function(data) {
                const accounts = data.storedAccounts || [];
                accounts.push({name: accountName}); // Simplified, add more details as needed
                chrome.storage.local.set({'storedAccounts': accounts}, function() {
                    console.log('Account added');
                    displayAccounts(); // Refresh the accounts list
                });
            });
        }
    });
});
