// Load shopping list from LocalStorage on window load
window.onload = () => {
    const shoppingList = getShoppingList();
    console.log("Loaded Shopping List:", shoppingList); // Debug log
    renderShoppingList(shoppingList);
};

// Retrieve Shopping List from LocalStorage
function getShoppingList() {
    return JSON.parse(localStorage.getItem("shoppingList")) || [];
}

// Save Shopping List to LocalStorage
function saveShoppingList(list) {
    localStorage.setItem("shoppingList", JSON.stringify(list));
    console.log("Saved Shopping List:", list); // Debug log
}

// Render the Shopping List
function renderShoppingList(shoppingList) {
    console.log("Rendering Shopping List"); // Debug log
    const container = document.getElementById("shopping-list-container");

    // Clear previous content
    container.innerHTML = "";

    if (shoppingList.length === 0) {
        container.innerHTML = "<p>No items found.</p>";
        return;
    }

    // Group items by Location
    const groupedByLocation = shoppingList.reduce((groups, item) => {
        const location = item.location || "No Location Set";
        if (!groups[location]) groups[location] = [];
        groups[location].push(item);
        return groups;
    }, {});

    // Function to compare locations, treating numeric values correctly
    const compareLocations = (a, b) => {
        const aIsNumeric = !isNaN(a);
        const bIsNumeric = !isNaN(b);

        if (aIsNumeric && bIsNumeric) {
            return Number(a) - Number(b);
        } else if (aIsNumeric) {
            return -1;
        } else if (bIsNumeric) {
            return 1;
        } else {
            return a.localeCompare(b);
        }
    };

    // Sort locations
    const sortedLocations = Object.keys(groupedByLocation).sort(compareLocations);

    // Render each location group
    sortedLocations.forEach(location => {
        const group = document.createElement("div");
        group.className = "location-group";

        const header = document.createElement("h2");
        header.className = "location-header";
        header.textContent = `Location: ${location}`;
        group.appendChild(header);

        const itemList = document.createElement("ul");
        itemList.className = "location-items";

        // Display only one ingredient per Group ID
        const uniqueGroupIds = new Set();
        groupedByLocation[location].forEach(item => {
            if (!uniqueGroupIds.has(item.groupId)) {
                uniqueGroupIds.add(item.groupId);

                const listItem = document.createElement("li");
                listItem.className = "shopping-list-item";

                listItem.innerHTML = `
                    <div class="value-header">Ingredient</div>
                    <div class="value-box ingredient-name">${item.ingredient}</div>

                    <div class="value-header">Amount</div>
                    <div class="value-box ingredient-amount">${item.amount} ${item.unit}</div>

                    <div class="value-header">Location</div>
                    <div class="value-box ingredient-location">${location}</div>

                    <div class="button-container">
                        <button class="edit-btn" onclick="enableEdit(this)">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="delete-btn" onclick="deleteItem(this)">
                            <i class="fas fa-trash-alt"></i> Delete
                        </button>
                    </div>
                `;
                console.log('Appending list item:', listItem); // Debug log
                itemList.appendChild(listItem);
            }
        });

        group.appendChild(itemList);
        container.appendChild(group);
    });
}

// Enable Editing
window.enableEdit = function (button) {
    const listItem = button.closest(".shopping-list-item");

    const ingredientName = listItem.querySelector(".ingredient-name").textContent.trim();
    const amount = listItem.querySelector(".ingredient-amount").textContent.trim().split(' ')[0];
    const unit = listItem.querySelector(".ingredient-amount").textContent.trim().split(' ')[1];
    const currentLocation = listItem.querySelector(".ingredient-location").textContent.trim();

    listItem.innerHTML = `
    <div class="edit-form-wrapper">
        <form class="edit-form">
            <h2 class="edit-form-header">Ingredient</h2> <!-- Ingredient header with class -->
            <label>Ingredient:</label>
            <span class="value-box">${ingredientName}</span>

            <label>Amount:</label>
            <input type="number" class="amount-input" value="${amount}" placeholder="Enter amount" step="any" min="0" required>

            <label>Unit:</label>
            <input type="text" class="unit-input" value="${unit}" placeholder="Enter unit" required>

            <label>Location:</label>
            <input type="text" class="location-input" value="${currentLocation}" placeholder="Enter location" required>

            <div class="form-buttons">
                <button type="submit" class="save-btn">Save</button>
                <button type="button" class="cancel-btn">Cancel</button>
            </div>
        </form>
    </div>
    `;

    // Clear placeholder on focus
    const locationInput = listItem.querySelector(".location-input");
    locationInput.addEventListener("focus", () => {
        if (locationInput.value === "No Location Set") {
            locationInput.value = "";
        }
    });

    // Handle form submission
    listItem.querySelector(".edit-form").onsubmit = (e) => {
        e.preventDefault();
        const newAmount = listItem.querySelector(".amount-input").value.trim();
        const newUnit = listItem.querySelector(".unit-input").value.trim();
        const newLocation = locationInput.value.trim() || "No Location Set";

        saveIngredient(ingredientName, newAmount, newUnit, newLocation);
        renderShoppingList(getShoppingList());
    };

    // Cancel editing
    listItem.querySelector(".cancel-btn").onclick = () => {
        renderShoppingList(getShoppingList());
    };
};

// Save edited ingredient
function saveIngredient(ingredientName, newAmount, newUnit, newLocation) {
    let shoppingList = getShoppingList();
    shoppingList = shoppingList.map(item => {
        if (item.ingredient === ingredientName) {
            return { ...item, amount: newAmount, unit: newUnit, location: newLocation };
        }
        return item;
    });
    saveShoppingList(shoppingList);
}

// Delete Shopping List Item
window.deleteItem = function (button) {
    const listItem = button.closest(".shopping-list-item");
    const ingredientName = listItem.querySelector(".ingredient-name").textContent.trim();

    let shoppingList = getShoppingList();
    shoppingList = shoppingList.filter(item => item.ingredient !== ingredientName);

    saveShoppingList(shoppingList);
    renderShoppingList(shoppingList);
};

// Handle new item form submission
document.getElementById("new-item-form").onsubmit = (e) => {
    e.preventDefault();

    const ingredient = document.getElementById("ingredient").value.trim();
    const amount = document.getElementById("amount").value.trim();
    const unit = document.getElementById("unit").value.trim();
    const location = document.getElementById("location").value.trim() || "No Location Set";

    if (!ingredient || !amount || !unit || !location) {
        console.error("All fields are required.");
        return;
    }

    const newItem = {
        ingredient,
        amount,
        unit,
        location
    };

    const shoppingList = getShoppingList();
    shoppingList.push(newItem);
    saveShoppingList(shoppingList);
    renderShoppingList(shoppingList);

    // Clear the form
    document.getElementById("new-item-form").reset();
};

document.addEventListener('DOMContentLoaded', () => {
    const shoppingListContainer = document.getElementById('shopping-list-container');
    const shoppingList = JSON.parse(localStorage.getItem('shoppingList')) || [];

    if (shoppingList.length === 0) {
        shoppingListContainer.innerHTML = '<p>No items found.</p>';
        return;
    }

    // Function to compare locations, treating numeric values correctly
    const compareLocations = (a, b) => {
        const aLocation = a.location;
        const bLocation = b.location;

        const aIsNumeric = !isNaN(aLocation);
        const bIsNumeric = !isNaN(bLocation);

        if (aIsNumeric && bIsNumeric) {
            return Number(aLocation) - Number(bLocation);
        } else if (aIsNumeric) {
            return -1;
        } else if (bIsNumeric) {
            return 1;
        } else {
            return aLocation.localeCompare(bLocation);
        }
    };

    // Sort the shopping list by location
    shoppingList.sort(compareLocations);

    const list = document.createElement('ul');
    shoppingList.forEach(item => {
        const listItem = document.createElement('li');
        listItem.textContent = `${item.ingredient}: ${item.amount} ${item.unit} (${item.location})`;
        list.appendChild(listItem);
    });

    shoppingListContainer.appendChild(list);
});














