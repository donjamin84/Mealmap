import dotenv from "dotenv";
dotenv.config();

// Import Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', function () {
    let currentWeek = 1;
    const cache = {
        menu: {},
        meals: {},
        ingredients: null,
        servings: null,
        recipes: null
    };

    async function loadMenuItems(week) {
        console.log(`Loading menu items for Week ${week}...`);
        if (cache.menu[week]) {
            console.log(`Using cached menu for Week ${week}`);
            renderMenuItems(cache.menu[week]);
            return;
        }

        try {
            const response = await fetch(`/api/menu/${week}`);
            if (!response.ok) {
                throw new Error(`No menu items found for Week ${week}`);
            }
            const meals = await response.json();
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

        meals.forEach(({ week, day, type, meal }) => {
            if (!grouped[week]) grouped[week] = {};
            if (!grouped[week][day]) grouped[week][day] = { 1: [], 2: [], 3: [], 4: [], 5: [] };
            grouped[week][day][type].push(meal);
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
                if (meals.length > 0) {
                    const mealList = document.createElement("ul");
                    mealList.className = "meal-list";

                    meals.forEach(meal => {
                        const mealItem = document.createElement("li");
                        mealItem.className = "meal-item";
                        mealItem.textContent = meal;
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

        // Attach days row to main content
        container.appendChild(daysRow);
    }


    async function generateShoppingList(week) {
        console.log(`Generating shopping list for Week ${week}...`);

        try {
            // Fetch data from Firestore if not already cached
            if (!cache.meals[week]) {
                const mealsRef = collection(db, 'meals');
                const q = query(mealsRef, where('week', '==', week));
                const mealsSnapshot = await getDocs(q);
                cache.meals[week] = mealsSnapshot.docs.map(doc => doc.data());
            }

            if (!cache.ingredients) {
                const ingredientsRef = collection(db, 'ingredients');
                const ingredientsSnapshot = await getDocs(ingredientsRef);
                cache.ingredients = ingredientsSnapshot.docs.map(doc => doc.data());
            }

            if (!cache.servings) {
                const servingsRef = collection(db, 'servings');
                const servingsSnapshot = await getDocs(servingsRef);
                cache.servings = servingsSnapshot.docs.map(doc => doc.data());
            }

            if (!cache.recipes) {
                const recipesRef = collection(db, 'recipes');
                const recipesSnapshot = await getDocs(recipesRef);
                cache.recipes = recipesSnapshot.docs.map(doc => doc.data());
            }

            const meals = cache.meals[week];
            const ingredients = cache.ingredients;
            const servings = cache.servings;
            const recipes = cache.recipes;

            console.log("Loaded meals:", meals);
            console.log("Loaded ingredients:", ingredients);
            console.log("Loaded servings:", servings);
            console.log("Loaded recipes:", recipes);

            // Filter meals for the selected week
            const selectedMeals = meals.filter(meal => meal.week == week);
            console.log(`Found ${selectedMeals.length} meals for Week ${week}:`, selectedMeals);

            if (selectedMeals.length === 0) {
                console.warn(`No meals found for Week ${week}.`);
            }

            // Collect matching ingredients and adjust quantities based on servings
            const shoppingList = selectedMeals.flatMap(meal => {
                console.log(`Checking meal: ${meal.meal} (mealId: ${meal.mealId})`);
                const matchedIngredients = ingredients.filter(
                    ing => String(ing.mealID) === String(meal.mealId)
                );

                const serving = servings.find(s => String(s.mealID) === String(meal.mealId));
                const servingMultiplier = serving ? serving.servings : 1;

                if (matchedIngredients.length === 0) {
                    console.warn(`No ingredients found for mealId: ${meal.mealId}`);
                } else {
                    console.log(`Matched ingredients for ${meal.meal} (mealId: ${meal.mealId}):`, matchedIngredients);
                }

                return matchedIngredients.map(ing => ({
                    ...ing,
                    amount: ing.amount * servingMultiplier,
                    unit: ing.unit // Include the unit in the shopping list
                }));
            });

            if (shoppingList.length === 0) {
                console.warn("No ingredients found for the selected week.");
            } else {
                console.log("Final Shopping List:", shoppingList);
            }

            // Save to LocalStorage
            localStorage.setItem("shoppingList", JSON.stringify(shoppingList));

            // Redirect to shopping list page
            window.location.href = "shoppingList.html";
        } catch (error) {
            console.error("Error generating shopping list:", error);
        }
    }


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
});


















