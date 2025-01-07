import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDcPkwXbdsaPAplUdZGmXhZGwEqiZmt-2A",
    authDomain: "mealplan-donja-2024.firebaseapp.com",
    projectId: "mealplan-donja-2024",
    storageBucket: "mealplan-donja-2024.firebasestorage.app",
    messagingSenderId: "1044176278835",
    appId: "1:1044176278835:web:648edf3829de455f365a46"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fetchIngredients() {
    try {
        const querySnapshot = await getDocs(collection(db, '541'));
        const ingredientsMap = new Map();
        let maxGroupId = 0;

        querySnapshot.forEach((doc) => {
            const ingredient = doc.data();
            ingredient.id = doc.id; // Add document ID

            if (!ingredientsMap.has(ingredient.ingredient)) {
                ingredientsMap.set(ingredient.ingredient, []);
            }
            ingredientsMap.get(ingredient.ingredient).push(ingredient);

            // Track the highest Group ID
            if (ingredient.groupId && ingredient.groupId > maxGroupId) {
                maxGroupId = ingredient.groupId;
            }
        });

        // Convert map to array and sort alphabetically by ingredient name
        const ingredients = Array.from(ingredientsMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));

        const ingredientsTableBody = document.querySelector('#ingredients-table tbody');
        for (const [ingredientName, ingredientGroup] of ingredients) {
            // Auto-populate Group ID if not already set
            if (!ingredientGroup[0].groupId) {
                maxGroupId++;
                for (const ing of ingredientGroup) {
                    ing.groupId = maxGroupId;
                    // Update Firestore document with new Group ID
                    const ingredientDoc = doc(db, '541', ing.id);
                    await updateDoc(ingredientDoc, { groupId: maxGroupId });
                }
            }

            // Ensure all ingredients have the enabled flag
            for (const ing of ingredientGroup) {
                if (ing.enabled === undefined) {
                    ing.enabled = true; // Default to enabled
                    const ingredientDoc = doc(db, '541', ing.id);
                    await updateDoc(ingredientDoc, { enabled: true });
                }
            }

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${ingredientName}</td>
                <td style="display:none;">${ingredientGroup.map(ing => ing.amount).join(', ')}</td> <!-- Hide amount -->
                <td style="display:none;">${ingredientGroup.map(ing => ing.unit).join(', ')}</td> <!-- Hide unit -->
                <td>
                    <input type="text" value="${ingredientGroup[0].location || ''}" data-name="${ingredientName}" class="location-input" />
                </td>
                <td>
                    <input type="text" value="${ingredientGroup[0].groupId || ''}" data-name="${ingredientName}" class="group-id-input" />
                </td>
                <td>
                    <button class="edit-button" data-name="${ingredientName}">Edit</button>
                </td>
                <td>
                    <button class="toggle-enabled-button ${ingredientGroup[0].enabled ? 'disable' : 'enable'}" data-name="${ingredientName}">
                        ${ingredientGroup[0].enabled ? 'Disable' : 'Enable'}
                    </button>
                </td>
            `;
            ingredientsTableBody.appendChild(row);
        }

        // Add event listeners to edit buttons
        document.querySelectorAll('.edit-button').forEach(button => {
            button.addEventListener('click', async (event) => {
                const name = event.target.getAttribute('data-name');
                const locationInput = document.querySelector(`input.location-input[data-name="${name}"]`);
                const groupIdInput = document.querySelector(`input.group-id-input[data-name="${name}"]`);
                const newLocation = locationInput.value;
                const newGroupId = groupIdInput.value;

                // Update Firestore documents
                const ingredientGroup = ingredientsMap.get(name);
                for (const ingredient of ingredientGroup) {
                    const ingredientDoc = doc(db, '541', ingredient.id);
                    await updateDoc(ingredientDoc, { location: newLocation, groupId: newGroupId });
                }

                alert('Location and Group ID updated successfully!');
            });
        });

        // Add event listeners to toggle enabled buttons
        document.querySelectorAll('.toggle-enabled-button').forEach(button => {
            button.addEventListener('click', async (event) => {
                const name = event.target.getAttribute('data-name');
                const ingredientGroup = ingredientsMap.get(name);
                const newEnabledState = !ingredientGroup[0].enabled;

                // Update Firestore documents
                for (const ingredient of ingredientGroup) {
                    const ingredientDoc = doc(db, '541', ingredient.id);
                    await updateDoc(ingredientDoc, { enabled: newEnabledState });
                }

                // Update button text and class
                event.target.textContent = newEnabledState ? 'Disable' : 'Enable';
                event.target.classList.toggle('enable', !newEnabledState);
                event.target.classList.toggle('disable', newEnabledState);

                alert(`Ingredients ${newEnabledState ? 'enabled' : 'disabled'} successfully!`);
            });
        });
    } catch (error) {
        console.error('Error fetching ingredients:', error);
    }
}

fetchIngredients();












