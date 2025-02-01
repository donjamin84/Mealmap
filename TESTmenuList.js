import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
    getFirestore,
    collection,
    getDocs,
    query,
    where,
    addDoc,
    updateDoc,
    doc,
    getDoc,
    setDoc,
    deleteDoc // <-- Add this here
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";


const firebaseConfig = {
    apiKey: "AIzaSyDcPkwXbdsaPAplUdZGmXhZGwEqiZmt-2A",
    authDomain: "mealplan-donja-2024.firebaseapp.com",
    projectId: "mealplan-donja-2024",
    storageBucket: "mealplan-donja-2024.firebasestorage.app",
    messagingSenderId: "1044176278835",
    appId: "1:1044176278835:web:648edf3829de455f365a46"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const cache = {
    menu: {},
    meals: {},
    ingredients: {},
    servings: {},
    recipes: {}
};

let currentWeek = 1;

async function loadMenuItems(week) {
    console.log(`Loading menu items for Week ${week}...`);
    if (cache.menu[week]) {
        console.log(`Using cached menu for Week ${week}`);
        renderMenuItems(cache.menu[week]);
        return;
    }

    try {
        const mealsRef = collection(db, 'meals');
        const q = query(mealsRef, where('week', '==', week));
        const mealsSnapshot = await getDocs(q);
        const meals = mealsSnapshot.docs.map(doc => ({ mealId: doc.id, ...doc.data() })); // Include mealId

        if (meals.length === 0) {
            throw new Error(`No menu items found for Week ${week}`);
        }

        console.log(`Fetched menu for Week ${week}:`, meals);
        const groupedMeals = groupMealsByWeek(meals);
        console.log(`Grouped meals for Week ${week}:`, groupedMeals);
        cache.menu[week] = groupedMeals[week];
        renderMenuItems(groupedMeals[week]);
    } catch (error) {
        console.error("Error fetching menu items:", error);
    }
}






function groupMealsByWeek(meals) {
    const grouped = {};

    meals.forEach(({ week, day, type, meal, mealId }) => {
        if (!grouped[week]) grouped[week] = {};
        if (!grouped[week][day]) grouped[week][day] = { 1: [], 2: [], 3: [], 4: [], 5: [] };
        grouped[week][day][type].push({ meal: String(meal), mealId: String(mealId) });
    });

    console.log("Grouped meals:", grouped);
    return grouped;
}






function renderMenuItems(weekMeals) {
    const container = document.getElementById("menu-list-container");
    container.innerHTML = "";  // Clear previous content

    if (!weekMeals) {
        container.innerHTML = "<p>No meals planned for this week.</p>";
        return;
    }

    console.log("Rendering menu items for the week:", weekMeals);

    // Check if the top bar container already exists
    let topBarContainer = document.querySelector(".top-bar-container");
    if (!topBarContainer) {
        // Create a top bar container for week slider
        topBarContainer = document.createElement("div");
        topBarContainer.className = "top-bar-container";

        // Week slider container
        const weekSliderContainer = document.createElement("div");
        weekSliderContainer.className = "week-slider-container";

        const prevWeekButton = document.createElement("button");
        prevWeekButton.id = "prevWeek";
        prevWeekButton.textContent = "Previous Week";
        weekSliderContainer.appendChild(prevWeekButton);

        const currentWeekLabel = document.createElement("span");
        currentWeekLabel.id = "currentWeek";
        currentWeekLabel.textContent = `Week ${currentWeek}`;
        weekSliderContainer.appendChild(currentWeekLabel);

        const nextWeekButton = document.createElement("button");
        nextWeekButton.id = "nextWeek";
        nextWeekButton.textContent = "Next Week";
        weekSliderContainer.appendChild(nextWeekButton);

        // Append week slider container to top bar container
        topBarContainer.appendChild(weekSliderContainer);

        // Attach the top bar container to the main content
        container.appendChild(topBarContainer);
    }

    // Create a container for the week
    const weekContainer = document.createElement("div");
    weekContainer.className = "week-container";

    // Create days row for the week
    const daysRow = document.createElement("div");
    daysRow.className = "days-row";

    // Loop through days and create day containers
    for (let day = 1; day <= 7; day++) {
        const dayContainer = document.createElement("div");
        dayContainer.className = "day-container";

        const dayHeader = document.createElement("h3");
        dayHeader.textContent = `Day ${day}`;
        dayContainer.appendChild(dayHeader);

        // Add meal containers inside each day
        const mealTypes = {
            1: "Breakfast",
            2: "Lunch",
            3: "Dinner",
            4: "Snack 1",
            5: "Snack 2"
        };

        Object.keys(mealTypes).forEach(type => {
            const mealContainer = document.createElement("div");
            mealContainer.className = "meal-container";

            const mealHeader = document.createElement("h4");
            mealHeader.className = "meal-type-header";
            mealHeader.textContent = mealTypes[type];
            mealContainer.appendChild(mealHeader);

            const meals = weekMeals[day] ? weekMeals[day][type] : [];
            console.log(`Meals for Day ${day}, Type ${type}:`, meals);

            if (meals.length > 0) {
                const mealList = document.createElement("ul");
                mealList.className = "meal-list";

                meals.forEach(meal => {
                    const mealItem = document.createElement("li");
                    mealItem.className = "meal-item";
                    mealItem.textContent = meal.meal; // Access the meal name property

                    // Add click event to show options
                    mealItem.addEventListener('click', async () => {
                        if (meal.mealId) { // Ensure correct field name
                            const ingredients = await fetchIngredients(meal.mealId);
                            const servings = await fetchServings(meal.mealId);
                            console.log(`Clicked meal: ${meal.meal}, Meal ID: ${meal.mealId}, Ingredients:`, ingredients);
                            showOptionsPopup(meal.mealId, meal.meal, ingredients, servings); // Pass meal name and servings
                        } else {
                            console.error("Meal ID is undefined for meal:", meal);
                        }
                    });

                    mealList.appendChild(mealItem);
                });

                mealContainer.appendChild(mealList);
            } else {
                const noMealText = document.createElement("p");
                noMealText.className = "no-meals-text";
                noMealText.textContent = "No meals planned.";
                mealContainer.appendChild(noMealText);
            }

            dayContainer.appendChild(mealContainer);
        });

        daysRow.appendChild(dayContainer);
    }

    // Attach days row to week container
    weekContainer.appendChild(daysRow);

    // Attach week container to main content
    container.appendChild(weekContainer);
}







async function fetchIngredients(mealId) {
    if (!mealId) {
        throw new Error("Meal ID is undefined");
    }

    console.log(`Fetching ingredients for Meal ID: ${mealId}`);

    try {
        const ingredientsRef = collection(db, '541');
        const q = query(ingredientsRef, where('mealId', '==', String(mealId)));
        const ingredientsSnapshot = await getDocs(q);

        if (ingredientsSnapshot.empty) {
            console.warn(`No ingredients found for Meal ID: ${mealId}`);
            return [];
        }

        const ingredients = ingredientsSnapshot.docs.map(doc => {
            console.log(`Ingredient document data:`, doc.data());
            return doc.data();
        });

        console.log(`Fetched ingredients for Meal ID ${mealId}:`, ingredients);
        return ingredients;
    } catch (error) {
        console.error("Error fetching ingredients:", error);
        return [];
    }
}






async function showIngredientsPopup(mealId, meal, ingredients = [], currentServings = 1) {
    const popup = document.createElement("div");
    popup.className = "ingredients-popup";

    const popupContent = document.createElement("div");
    popupContent.className = "ingredients-popup-content";

    const title = document.createElement("h3");
    title.textContent = `Ingredients for ${meal}`;
    popupContent.appendChild(title);

    const servingsLabel = document.createElement("label");
    servingsLabel.textContent = "Servings: ";
    popupContent.appendChild(servingsLabel);

    const servingsInput = document.createElement("input");
    servingsInput.type = "number";
    servingsInput.value = currentServings;
    servingsInput.min = 1;
    popupContent.appendChild(servingsInput);

    const ingredientsTable = document.createElement("table");
    ingredientsTable.className = "ingredients-table";

    // Create header row
    const headerRow = document.createElement("tr");
    headerRow.innerHTML = `
        <th>Ingredient</th>
        <th>Amount</th>
        <th>Unit</th>
    `;
    ingredientsTable.appendChild(headerRow);

    // Function to render ingredient rows based on servings
    const renderIngredientRows = (servings) => {
        // Clear existing rows
        ingredientsTable.querySelectorAll("tr:not(:first-child)").forEach(row => row.remove());

        // Populate rows with adjusted ingredients
        ingredients.forEach(ingredient => {
            const row = document.createElement("tr");
            const adjustedAmount = (ingredient.amount / currentServings) * servings;
            row.innerHTML = `
                <td>${ingredient.ingredient}</td>
                <td>${adjustedAmount.toFixed(2)}</td>
                <td>${ingredient.unit}</td>
            `;
            ingredientsTable.appendChild(row);
        });
    };

    // Initial render
    renderIngredientRows(currentServings);

    // Update ingredient amounts when servings change
    servingsInput.addEventListener("input", () => {
        const newServings = parseInt(servingsInput.value, 10);
        if (!isNaN(newServings) && newServings > 0) {
            renderIngredientRows(newServings);
        }
    });

    popupContent.appendChild(ingredientsTable);

    const closeButton = document.createElement("button");
    closeButton.textContent = "Close";
    closeButton.addEventListener("click", () => document.body.removeChild(popup));
    popupContent.appendChild(closeButton);

    popup.appendChild(popupContent);
    document.body.appendChild(popup);
}

function addIngredientInputRow(table, mealId, meal) {
    const row = document.createElement("tr");

    row.innerHTML = `
        <td>${meal}</td>
        <td>${mealId}</td>
        <td><input type="text" placeholder="Ingredient"></td>
        <td><input type="number" placeholder="Amount"></td>
        <td><input type="text" placeholder="Unit"></td>
        <td><button class="save-servings-btn">Save</button></td>
    `;

    table.appendChild(row);

    const saveButton = row.querySelector(".save-servings-btn");
    saveButton.addEventListener("click", async () => {
        const newServingsInput = row.querySelector("input[type='number']");
        const newServings = parseInt(newServingsInput.value.trim(), 10);

        if (!isNaN(newServings) && newServings > 0) {
            try {
                await saveServings(mealId, newServings);
                console.log("Servings updated successfully:", { meal, mealId, servings: newServings });
                document.body.removeChild(row.closest(".ingredients-popup"));
            } catch (error) {
                console.error("Error updating servings:", error);
            }
        } else {
            alert("Please enter a valid number of servings.");
        }
    });
}











// Function to render a saved ingredient row
// Function to render a saved ingredient row

function renderSavedIngredientRow(table, mealId, meal, ingredient) {
    const row = document.createElement("tr");

    row.innerHTML = `
        <td>${meal}</td>
        <td>${mealId}</td>
        <td>${ingredient.ingredient}</td>
        <td>${ingredient.amount}</td>
        <td>${ingredient.unit}</td>
        <td>
            <button class="edit-row-btn">Edit</button>
            <button class="delete-row-btn">Delete</button>
        </td>
    `;

    const editButton = row.querySelector(".edit-row-btn");
    editButton.addEventListener("click", () => {
        addIngredientEditRow(table, mealId, meal, ingredient);
        table.removeChild(row);
    });

    const deleteButton = row.querySelector(".delete-row-btn");
    deleteButton.addEventListener("click", async () => {
        try {
            const docID = `${mealId}_${ingredient.ingredient}`;
            const ingredientRef = doc(db, '541', docID);
            await deleteDoc(ingredientRef);

            console.log("Ingredient deleted successfully:", ingredient);
            table.removeChild(row);
        } catch (error) {
            console.error("Error deleting ingredient:", error);
        }
    });

    table.appendChild(row);
}





// Function to add an editable row for an existing ingredient
function addIngredientEditRow(table, mealId, meal, ingredient) {
    const row = document.createElement("tr");

    row.innerHTML = `
        <td>${meal}</td>
        <td>${mealId}</td>
        <td><input type="text" value="${ingredient.ingredient}"></td>
        <td><input type="number" value="${ingredient.amount}"></td>
        <td><input type="text" value="${ingredient.unit}"></td>
        <td><button class="save-edit-btn">Save</button></td>
    `;

    const saveButton = row.querySelector(".save-edit-btn");
    saveButton.addEventListener("click", async () => {
        const cells = row.querySelectorAll("td");
        const updatedIngredient = {
            ingredient: cells[2].querySelector("input").value.trim(),
            amount: parseFloat(cells[3].querySelector("input").value.trim()),
            unit: cells[4].querySelector("input").value.trim(),
            meal,
            mealId,
        };

        if (updatedIngredient.ingredient && !isNaN(updatedIngredient.amount) && updatedIngredient.unit) {
            try {
                const docID = `${mealId}_${updatedIngredient.ingredient}`;
                const ingredientRef = doc(db, '541', docID);
                await setDoc(ingredientRef, updatedIngredient);

                console.log("Ingredient updated successfully:", updatedIngredient);
                renderSavedIngredientRow(table, mealId, meal, updatedIngredient);
                table.removeChild(row);
            } catch (error) {
                console.error("Error updating ingredient:", error);
            }
        } else {
            alert("Please fill out all fields correctly.");
        }
    });

    table.appendChild(row);
}

async function fetchServings(mealId) {
    if (!mealId) {
        throw new Error("Meal ID is undefined");
    }

    console.log(`Fetching servings for Meal ID: ${mealId}`);

    try {
        const recipeRef = doc(db, 'recipes', mealId + '_recipe');
        const recipeDoc = await getDoc(recipeRef);

        if (!recipeDoc.exists()) {
            console.warn(`No servings found for Meal ID: ${mealId}`);
            return null;
        }

        const recipeData = recipeDoc.data();
        console.log(`Fetched servings for Meal ID ${mealId}:`, recipeData.servings);
        return recipeData.servings;
    } catch (error) {
        console.error("Error fetching servings:", error);
        return null;
    }
}

















function editIngredient(ingredient) {
    const newAmount = prompt("Enter new amount:", ingredient.amount);
    const newUnit = prompt("Enter new unit:", ingredient.unit);
    const newName = prompt("Enter new name:", ingredient.ingredient); // Change here

    if (newAmount !== null && newUnit !== null && newName !== null) {
        // Update ingredient in Firestore
        const ingredientRef = doc(db, '541', `${ingredient.mealId}_${ingredient.ingredient}`);
        updateDoc(ingredientRef, {
            amount: parseFloat(newAmount),
            unit: newUnit,
            ingredient: newName // Change here
        }).then(() => {
            alert("Ingredient updated successfully!");
        }).catch(error => {
            console.error("Error updating ingredient:", error);
        });
    }
}




function addIngredient() {
    const ingredientName = document.getElementById('ingredientName').value;
    const ingredientQuantity = document.getElementById('ingredientQuantity').value;
    const ingredientUnit = document.getElementById('ingredientUnit').value;
    const ingredientNotes = document.getElementById('ingredientNotes').value;

    // Firestore code to add the ingredient
    const db = firebase.firestore();
    db.collection('ingredients').add({
        name: ingredientName,
        quantity: ingredientQuantity,
        unit: ingredientUnit,
        notes: ingredientNotes
    })
    .then(() => {
        console.log('Ingredient added successfully');
        // Optionally, clear the form fields
        document.getElementById('ingredientName').value = '';
        document.getElementById('ingredientQuantity').value = '';
        document.getElementById('ingredientUnit').value = '';
        document.getElementById('ingredientNotes').value = '';
    })
    .catch((error) => {
        console.error('Error adding ingredient: ', error);
    });
}





async function generateShoppingList(week) {
    console.log(`Generating shopping list for Week ${week}...`);

    try {
        if (!cache.meals[week]) {
            const mealsRef = collection(db, 'meals');
            const q = query(mealsRef, where('week', '==', week));
            const mealsSnapshot = await getDocs(q);
            cache.meals[week] = mealsSnapshot.docs.map(doc => ({ mealId: doc.id, ...doc.data() }));
        }

        if (!cache.ingredients || !Array.isArray(cache.ingredients)) {
            const ingredientsRef = collection(db, '541');
            const ingredientsSnapshot = await getDocs(ingredientsRef);
            cache.ingredients = ingredientsSnapshot.docs.map(doc => doc.data());
        }

        const meals = cache.meals[week];
        const ingredients = cache.ingredients;

        const ingredientMap = {};

        for (const meal of meals) {
            const mealIngredients = ingredients.filter(
                ing => String(ing.mealId) === String(meal.mealId) && ing.enabled
            );

            const recipeRef = doc(db, 'recipes', `${meal.mealId}_recipe`);
            const recipeDoc = await getDoc(recipeRef);

            if (!recipeDoc.exists()) {
                console.warn(`No recipe data found for Meal ID: ${meal.mealId}`);
                continue;
            }

            const recipeData = recipeDoc.data();
            const servingsPerMeal = recipeData.servings;

            mealIngredients.forEach(ing => {
                const key = ing.groupId;
                if (!ingredientMap[key]) {
                    ingredientMap[key] = { ...ing, amount: 0 };
                }
                ingredientMap[key].amount += ing.amount * servingsPerMeal;
            });
        }

        const shoppingList = Object.values(ingredientMap);

        shoppingList.forEach(item => {
            if (!item.ingredient) {
                item.ingredient = '';
            }
            item.amount = Math.ceil(item.amount); // Round up the amount to the nearest whole number
        });

        shoppingList.sort((a, b) => a.ingredient.localeCompare(b.ingredient));

        localStorage.setItem("shoppingList", JSON.stringify(shoppingList));
        window.location.href = "shoppingList.html";
    } catch (error) {
        console.error("Error generating shopping list:", error);
    }
}






function renderShoppingList() {
    const shoppingListContainer = document.getElementById("shopping-list-container");
    shoppingListContainer.innerHTML = ""; // Clear previous content

    const shoppingList = JSON.parse(localStorage.getItem("shoppingList"));

    if (!shoppingList || shoppingList.length === 0) {
        shoppingListContainer.innerHTML = "<p>No items in the shopping list.</p>";
        return;
    }

    const list = document.createElement("ul");
    shoppingList.forEach(item => {
        const listItem = document.createElement("li");
        listItem.textContent = `${item.amount} ${item.unit} of ${item.ingredient}`;
        list.appendChild(listItem);
    });

    shoppingListContainer.appendChild(list);
}

// Call renderShoppingList when the page loads
document.addEventListener("DOMContentLoaded", renderShoppingList);



document.getElementById('prevWeek').addEventListener('click', function () {
    if (currentWeek > 1) {
        currentWeek--;
        document.getElementById('currentWeek').textContent = `Week ${currentWeek}`;
        loadMenuItems(currentWeek);
    }
});

document.getElementById('nextWeek').addEventListener('click', function () {
    if (currentWeek < 4) {
        currentWeek++;
        document.getElementById('currentWeek').textContent = `Week ${currentWeek}`;
        loadMenuItems(currentWeek);
    }
});

document.getElementById('generateShoppingList').addEventListener('click', function () {
    generateShoppingList(currentWeek);
});

// Initial load
loadMenuItems(currentWeek);

async function showOptionsPopup(mealId, meal, ingredients, servings) {
    // Remove any existing popup
    const existingPopup = document.querySelector(".options-popup");
    if (existingPopup) {
        document.body.removeChild(existingPopup);
    }

    const popup = document.createElement("div");
    popup.className = "options-popup";

    const popupContent = document.createElement("div");
    popupContent.className = "options-popup-content";

    const title = document.createElement("h3");
    title.textContent = `Options for ${meal}`;
    popupContent.appendChild(title);

    const ingredientsButton = document.createElement("button");
    ingredientsButton.textContent = "View Ingredients";
    ingredientsButton.addEventListener("click", () => {
        document.body.removeChild(popup);
        showIngredientsPopup(mealId, meal, ingredients);
    });
    popupContent.appendChild(ingredientsButton);

    const servingsButton = document.createElement("button");
    servingsButton.textContent = "View/Change Servings";
    servingsButton.addEventListener("click", () => {
        document.body.removeChild(popup);
        showServingsPopup(mealId, meal, servings);
    });
    popupContent.appendChild(servingsButton);

    const recipeButton = document.createElement("button");
    recipeButton.textContent = "View/Add Recipe";
    recipeButton.addEventListener("click", async () => {
        const recipe = await fetchRecipe(mealId);
        showRecipePopup(mealId, meal, ingredients, servings, recipe ? recipe.recipe : "");
    });
    popupContent.appendChild(recipeButton);

    const closeButton = document.createElement("button");
    closeButton.textContent = "Close";
    closeButton.addEventListener("click", () => document.body.removeChild(popup));
    popupContent.appendChild(closeButton);

    popup.appendChild(popupContent);
    document.body.appendChild(popup);
}



async function showRecipePopup(mealId, meal, ingredients = [], currentServings = 1, recipeText = "") {
    const popup = document.createElement("div");
    popup.className = "recipe-popup";

    const popupContent = document.createElement("div");
    popupContent.className = "recipe-popup-content";

    const title = document.createElement("h3");
    title.textContent = `Recipe for ${meal}`;
    popupContent.appendChild(title);

    const servingsLabel = document.createElement("label");
    servingsLabel.textContent = "Servings: ";
    popupContent.appendChild(servingsLabel);

    const servingsInput = document.createElement("input");
    servingsInput.type = "number";
    servingsInput.value = currentServings;
    servingsInput.min = 1;
    popupContent.appendChild(servingsInput);

    const ingredientsTable = document.createElement("table");
    ingredientsTable.className = "ingredients-table";

    // Apply styles to make the ingredients list smaller
    ingredientsTable.style.fontSize = "12px";
    ingredientsTable.style.margin = "10px 0";
    ingredientsTable.style.width = "100%";

    // Create header row
    const headerRow = document.createElement("tr");
    headerRow.innerHTML = `
        <th>Ingredient</th>
        <th>Amount</th>
        <th>Unit</th>
    `;
    ingredientsTable.appendChild(headerRow);

    // Function to render ingredient rows based on servings
    const renderIngredientRows = (servings) => {
        // Clear existing rows
        ingredientsTable.querySelectorAll("tr:not(:first-child)").forEach(row => row.remove());

        // Populate rows with adjusted ingredients
        ingredients.forEach(ingredient => {
            const row = document.createElement("tr");
            const adjustedAmount = (ingredient.amount / currentServings) * servings;
            row.innerHTML = `
                <td>${ingredient.ingredient}</td>
                <td>${adjustedAmount.toFixed(2)}</td>
                <td>${ingredient.unit}</td>
            `;
            ingredientsTable.appendChild(row);
        });
    };

    // Initial render
    renderIngredientRows(currentServings);

    // Update ingredient amounts when servings change
    servingsInput.addEventListener("input", () => {
        const newServings = parseInt(servingsInput.value, 10);
        if (!isNaN(newServings) && newServings > 0) {
            renderIngredientRows(newServings);
        }
    });

    popupContent.appendChild(ingredientsTable);

    const recipeLabel = document.createElement("label");
    recipeLabel.textContent = "Recipe:";
    popupContent.appendChild(recipeLabel);

    const recipeTextarea = document.createElement("textarea");
    recipeTextarea.value = recipeText;
    recipeTextarea.style.width = "100%";
    recipeTextarea.style.height = "100px";
    popupContent.appendChild(recipeTextarea);

    const saveButton = document.createElement("button");
    saveButton.textContent = "Save";
    saveButton.addEventListener("click", async () => {
        const newRecipeText = recipeTextarea.value.trim();
        const newServings = parseInt(servingsInput.value, 10);

        if (newRecipeText && !isNaN(newServings) && newServings > 0) {
            try {
                const recipeRef = doc(db, 'recipes', `${mealId}_recipe`);
                await setDoc(recipeRef, { recipe: newRecipeText, servings: newServings });

                console.log("Recipe and servings updated successfully:", { meal, mealId, recipe: newRecipeText, servings: newServings });
                document.body.removeChild(popup);
            } catch (error) {
                console.error("Error updating recipe and servings:", error);
            }
        } else {
            alert("Please fill out all fields correctly.");
        }
    });
    popupContent.appendChild(saveButton);

    const closeButton = document.createElement("button");
    closeButton.className = "close-button";
    closeButton.textContent = "Close";
    closeButton.addEventListener("click", () => document.body.removeChild(popup));
    popupContent.appendChild(closeButton);

    popup.appendChild(popupContent);
    document.body.appendChild(popup);
}







async function saveRecipeToDatabase(mealId, meal, servings, recipeText) {
    try {
        const recipeRef = doc(db, 'recipes', mealId + '_recipe');
        await setDoc(recipeRef, {
            mealId: mealId,
            meal: meal, // Include the meal name
            servings: servings,
            recipe: recipeText
        });
        console.log("Recipe saved successfully:", { mealId, meal, servings, recipeText });
    } catch (error) {
        console.error("Error saving recipe:", error);
    }
}









function showServingsPopup(mealId, meal, servings) {
    // Remove any existing popup
    const existingPopup = document.querySelector(".ingredients-popup");
    if (existingPopup) {
        document.body.removeChild(existingPopup);
    }

    const popup = document.createElement("div");
    popup.className = "ingredients-popup"; // Use the same class as ingredients popup

    const popupContent = document.createElement("div");
    popupContent.className = "ingredients-popup-content"; // Use the same class as ingredients popup content

    const title = document.createElement("h3");
    title.textContent = `Servings for ${meal}`;
    popupContent.appendChild(title);

    const servingsTable = document.createElement("table");
    servingsTable.className = "ingredients-table"; // Use the same class as ingredients table

    // Create header row
    const headerRow = document.createElement("tr");
    headerRow.innerHTML = `
        <th>Meal</th>
        <th>Meal ID</th>
        <th>Servings</th>
        <th>Actions</th>
    `;
    servingsTable.appendChild(headerRow);

    // Populate row with existing servings
    const row = document.createElement("tr");
    row.innerHTML = `
        <td>${meal}</td>
        <td>${mealId}</td>
        <td><input type="number" value="${servings !== null && servings !== undefined ? servings : 1}" min="1"></td>
        <td><button class="save-servings-btn">Save</button></td>
    `;

    const saveButton = row.querySelector(".save-servings-btn");
    saveButton.addEventListener("click", async () => {
        const newServings = parseInt(row.querySelector("input").value.trim(), 10);

        if (!isNaN(newServings) && newServings > 0) {
            try {
                await saveServings(mealId, newServings);
                console.log("Servings updated successfully:", { mealId, newServings });
                document.body.removeChild(popup);
            } catch (error) {
                console.error("Error updating servings:", error);
            }
        } else {
            alert("Please enter a valid number of servings.");
        }
    });

    servingsTable.appendChild(row);
    popupContent.appendChild(servingsTable);

    const closeButton = document.createElement("button");
    closeButton.textContent = "Close";
    closeButton.addEventListener("click", () => document.body.removeChild(popup));
    popupContent.appendChild(closeButton);

    popup.appendChild(popupContent);
    document.body.appendChild(popup);
}



async function updateServingsForPeople(numberOfPeople, weekMeals) {
    try {
        for (const day in weekMeals) {
            for (const type in weekMeals[day]) {
                for (const meal of weekMeals[day][type]) {
                    const mealId = meal.mealId;
                    const servingsRef = doc(db, 'servings', mealId);
                    await setDoc(servingsRef, { servings: numberOfPeople }, { merge: true });
                    console.log(`Updated servings for Meal ID ${mealId} to ${numberOfPeople}`);
                }
            }
        }
    } catch (error) {
        console.error("Error updating servings:", error);
    }
}


// Add event listener to update servings when the number of people changes
document.getElementById("people-input").addEventListener("input", () => {
    const numberOfPeople = parseInt(document.getElementById("people-input").value, 10);
    updateServingsForPeople(numberOfPeople, cache.menu[currentWeek]);
});



// Add event listener to update servings when the number of people changes
peopleInput.addEventListener("input", () => {
    const numberOfPeople = parseInt(peopleInput.value, 10);
    updateServingsForPeople(numberOfPeople, cache.menu[currentWeek]);
});


// Ensure the event listener is correctly set up
document.getElementById('people-input').addEventListener('input', () => {
    const numberOfPeople = parseInt(document.getElementById('people-input').value, 10);
    updateServingsForPeople(numberOfPeople, cache.menu[currentWeek]);
});

async function fetchRecipe(mealId) {
    try {
        const recipeRef = doc(db, 'recipes', mealId + '_recipe');
        const recipeDoc = await getDoc(recipeRef);

        if (recipeDoc.exists()) {
            console.log("Fetched recipe:", recipeDoc.data());
            return recipeDoc.data();
        } else {
            console.warn(`No recipe found for Meal ID: ${mealId}`);
            return null;
        }
    } catch (error) {
        console.error("Error fetching recipe:", error);
        return null;
    }
}

function compareLocations(a, b) {
    if (a.location && b.location) {
        return a.location.localeCompare(b.location);
    }
    return 0; // Default to equal if either location is undefined
}

document.addEventListener("DOMContentLoaded", () => {
    const shoppingList = JSON.parse(localStorage.getItem("shoppingList"));

    if (shoppingList && shoppingList.length > 0) {
        shoppingList.sort(compareLocations);

        const shoppingListContainer = document.getElementById("shopping-list-container");
        shoppingListContainer.innerHTML = ""; // Clear previous content

        const list = document.createElement("ul");
        shoppingList.forEach(item => {
            const listItem = document.createElement("li");
            listItem.textContent = `${item.amount} ${item.unit} of ${item.ingredient}`;
            list.appendChild(listItem);
        });

        shoppingListContainer.appendChild(list);
    } else {
        console.warn("No items in the shopping list.");
    }
});

async function saveServings(mealId, newServings) {
    if (!mealId) {
        throw new Error("Meal ID is undefined");
    }

    console.log(`Saving servings for Meal ID: ${mealId}, New Servings: ${newServings}`);

    try {
        const recipeRef = doc(db, 'recipes', mealId + '_recipe');
        await updateDoc(recipeRef, {
            servings: newServings
        });

        console.log("Servings updated successfully in the recipes table.");
    } catch (error) {
        console.error("Error updating servings:", error);
    }
}







































