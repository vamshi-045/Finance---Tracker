
const localStorageKey = 'financeTrackerTransactions';

// Simulate fetching all transactions from the "database"
const mockGetTransactions = () => {
    const storedData = localStorage.getItem(localStorageKey);
    let transactionsData = [];
    if (storedData) {
        try {
            transactionsData = JSON.parse(storedData);
        } catch (e) {
            console.error("Failed to parse stored data from localStorage.", e);
        }
    }
    return transactionsData.sort((a, b) => new Date(b.date) - new Date(a.date));
};

// Save transactions to localStorage
const saveTransactions = (data) => {
    localStorage.setItem(localStorageKey, JSON.stringify(data));
};

// Simulate adding a transaction to the "database"
const mockAddTransaction = (transaction) => {
    const transactionsData = mockGetTransactions();
    const newTransaction = { ...transaction, id: Date.now() };
    transactionsData.push(newTransaction);
    saveTransactions(transactionsData);
    return newTransaction;
};

// Simulate deleting a transaction from the "database"
const mockDeleteTransaction = (id) => {
    const transactionsData = mockGetTransactions();
    const initialLength = transactionsData.length;
    const updatedData = transactionsData.filter(t => t.id !== id);
    saveTransactions(updatedData);
    return updatedData.length < initialLength;
};

// --- FRONTEND APPLICATION LOGIC ---
const transactionDescriptionInput = document.getElementById('transaction-description');
const transactionAmountInput = document.getElementById('transaction-amount');
const transactionCategoryInput = document.getElementById('transaction-category');
const transactionDateInput = document.getElementById('transaction-date');
const historyList = document.getElementById('history-list');
const monthlyBalanceDisplay = document.getElementById('monthly-balance');
const messageBox = document.getElementById('message-box');
const monthSelect = document.getElementById('month-select');
const noTransactionsMessage = document.getElementById('no-transactions-message');

let allTransactions = [];
let currentTransactions = [];
let selectedMonth = '';

// Function to show a message to the user
const showMessage = (message, isError = false) => {
    messageBox.textContent = message;
    messageBox.style.display = 'block';
    messageBox.style.backgroundColor = isError ? '#fee2e2' : '#dbeafe';
    messageBox.style.color = isError ? '#991b1b' : '#1e40af';
    setTimeout(() => {
        messageBox.style.display = 'none';
    }, 3000);
};

// Render the list of transactions to the DOM
const renderTransactions = (transactionsToRender) => {
    historyList.innerHTML = '';
    if (transactionsToRender.length === 0) {
        noTransactionsMessage.style.display = 'block';
    } else {
        noTransactionsMessage.style.display = 'none';
        transactionsToRender.forEach(transaction => {
            const listItem = document.createElement('li');
            listItem.classList.add('history-item', transaction.type);

            const formattedAmount = `Rs-${parseFloat(transaction.amount).toFixed(2)}`;
            const formattedDate = new Date(transaction.date).toLocaleDateString();

            listItem.innerHTML = `
            <div class="item-content">
              <p class="item-description">${transaction.description}</p>
              <p class="item-category">Category: ${transaction.category}</p>
              <p class="item-date">${formattedDate}</p>
            </div>
            <div class="item-amount-container">
              <span class="item-amount ${transaction.type === 'debit' ? 'item-amount-debit' : 'item-amount-credit'}">
                ${formattedAmount}
              </span>
              <button
                onclick="handleDeleteTransaction(${transaction.id})"
                class="delete-button"
                title="Delete transaction"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="delete-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 10-2 0v6a1 1 0 102 0V8z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
          `;
            historyList.appendChild(listItem);
        });
    }
};

// Calculate and update the monthly balance
const updateMonthlyBalance = (transactionsToCalculate) => {
    const total = transactionsToCalculate.reduce((sum, transaction) => {
        const amount = parseFloat(transaction.amount);
        return transaction.type === 'credit' ? sum + amount : sum - amount;
    }, 0);
    monthlyBalanceDisplay.textContent = `Rs-${total.toFixed(2)}`;
    monthlyBalanceDisplay.className = `balance-amount ${total >= 0 ? 'balance-positive' : 'balance-negative'}`;
};

// Populate the month selector dropdown
const updateMonthSelector = () => {
    const allMonths = new Set();
    allTransactions.forEach(t => {
        const date = new Date(t.date);
        allMonths.add(`${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`);
    });

    monthSelect.innerHTML = '<option value="">All Transactions</option>';
    Array.from(allMonths).sort().reverse().forEach(month => {
        const option = document.createElement('option');
        option.value = month;
        option.textContent = new Date(month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' });
        monthSelect.appendChild(option);
    });
};

// Fetch and re-render all data
const fetchData = () => {
    allTransactions = mockGetTransactions();
    updateMonthSelector();
    filterTransactions(selectedMonth);
};

// Filter transactions based on selected month
const filterTransactions = (month) => {
    selectedMonth = month;
    if (month) {
        const [year, monthIndex] = month.split('-');
        currentTransactions = allTransactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate.getFullYear() == year && (tDate.getMonth() + 1).toString().padStart(2, '0') == monthIndex;
        });
    } else {
        currentTransactions = allTransactions;
    }
    updateMonthlyBalance(currentTransactions);
    renderTransactions(currentTransactions);
};

// Add a new transaction
const handleAddTransaction = (type) => {
    const description = transactionDescriptionInput.value.trim();
    const amount = parseFloat(transactionAmountInput.value);
    const category = transactionCategoryInput.value.trim();
    const date = transactionDateInput.value;

    if (!description || isNaN(amount) || !category || !date) {
        showMessage('Please fill in all fields correctly.', true);
        return;
    }

    const newTransaction = { description, amount, category, date, type };
    mockAddTransaction(newTransaction);

    // Update data and UI
    fetchData();
    showMessage(`Successfully added a ${type} transaction.`);

    // Clear form
    transactionDescriptionInput.value = '';
    transactionAmountInput.value = '';
    transactionCategoryInput.value = '';
    transactionDateInput.value = '';
};

// Delete a transaction
const handleDeleteTransaction = (id) => {
    const success = mockDeleteTransaction(id);
    if (success) {
        fetchData();
        showMessage('Transaction deleted.');
    } else {
        showMessage('Failed to delete transaction.', true);
    }
};

// Listen for month selection changes
monthSelect.addEventListener('change', (e) => {
    filterTransactions(e.target.value);
});

// Initial data load on window load
window.onload = () => {
    fetchData();
};
