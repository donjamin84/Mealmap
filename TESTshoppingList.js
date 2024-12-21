// Load shopping list from LocalStorage on window load
window.onload = () => {
    const shoppingList = getShoppingList();
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
    const container = document.getElementById("shopping-list-container");

    // Clear previous content
    container.innerHTML = "";

    if (shoppingList.length === 0) {
        container.innerHTML = "<p>No items found.</p>";
        return;
    }

    // Group items by location
    const groupedByLocation = shoppingList.reduce((groups, item) => {
        const location = item.location || "No Location Set";
        if (!groups[location]) groups[location] = [];
        groups[location].push(item);
        return groups;
    }, {});

    // Render each location group
    Object.keys(groupedByLocation).forEach(location => {
        const group = document.createElement("div");
        group.className = "location-group";

        const header = document.createElement("h2");
        header.className = "location-header";
        header.textContent = location;
        group.appendChild(header);

        const itemList = document.createElement("ul");
        itemList.className = "location-items";

        groupedByLocation[location].forEach(item => {
            const listItem = document.createElement("li");
            listItem.className = "shopping-list-item";

            listItem.innerHTML = `
                <div class="value-header">Ingredient</div>
                <div class="value-box ingredient-name">${item.ingredient}</div>

                <div class="value-header">Amount</div>
                <div class="value-box ingredient-amount">${item.amount} ${item.unit}</div>

                <div class="value-header">Location</div>
                <div class="value-box ingredient-location">${item.location || "No Location Set"}</div>

                <div class="button-container">
                    <button class="edit-btn" onclick="enableEdit(this)"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn" onclick="deleteItem(this)"><i class="fas fa-trash-alt"></i></button>
                </div>
            `;
            itemList.appendChild(listItem);
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

document.addEventListener("DOMContentLoaded", function () {
    const categories = document.querySelectorAll('.category'); // Assuming each category has a class 'category'

    categories.forEach(category => {
        const valueBoxes = category.querySelectorAll('.value-box');
        let maxWidth = 0;

        // Calculate the maximum width of all value boxes in this category
        valueBoxes.forEach(box => {
            const boxWidth = box.scrollWidth;
            if (boxWidth > maxWidth) {
                maxWidth = boxWidth;
            }
        });

        // Set the width of all value boxes in this category to the maximum width
        valueBoxes.forEach(box => {
            box.style.width = `${maxWidth}px`;
        });
    });
});














