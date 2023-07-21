'use strict';

// DOM element references
const taskList = document.getElementById("taskList");
const doneList = document.getElementById("doneList");
const inputElem = document.getElementById('task');
const suggestionList = document.getElementById('suggestionList');
let selectedSuggestion = '';
const remindersMap = new Map();  // A map to keep track of task reminders

// Fetch suggestions from a JSON file
fetch('suggestions.json')
    .then(response => response.json())
    .then(data => {
        const suggestions = data.suggestions;
        // Attach input event listener when suggestions are loaded
        inputElem.addEventListener('input', event => handleInput(event, suggestions));
    })
    .catch(error => {
        console.error('Error loading suggestions:', error);
    });

// Clear suggestions when input element is focused
inputElem.addEventListener('focus', () => {
    suggestionList.innerHTML = '';
    selectedSuggestion = '';
});

// Set input value to selected suggestion when it loses focus
inputElem.addEventListener('blur', () => {
    if (selectedSuggestion) {
        inputElem.value = selectedSuggestion;
    }
});

// Handle input event to show/hide and filter suggestions
function handleInput(event, suggestions) {
    const searchTerm = event.target.value.toLowerCase().trim();
    suggestionList.classList.toggle('hidden', searchTerm.length === 0);
    suggestionList.innerHTML = '';

    if (searchTerm.length === 0) return;

    const matchingSuggestions = suggestions.filter(suggestion =>
        suggestion.toLowerCase().startsWith(searchTerm)
    );

    selectedSuggestion = '';

    // Populate suggestion list based on the input
    matchingSuggestions.forEach(suggestion => {
        const li = document.createElement('li');
        li.textContent = suggestion;
        li.addEventListener('click', function () {
            selectedSuggestion = suggestion;
            inputElem.value = selectedSuggestion;
            suggestionList.innerHTML = '';
            suggestionList.classList.add('hidden');
        });
        suggestionList.appendChild(li);
    });

    // Hide suggestion list if no matches found
    if (!matchingSuggestions.length) {
        suggestionList.classList.add('hidden');
    }
}

// Create and return a task list item
function createTaskItem(task, time) {
    const taskItem = document.createElement('li');
    const checkBox = document.createElement('input');
    checkBox.type = 'checkbox';

    // Handle task status change
    checkBox.addEventListener('change', function () {
        toggleTaskStatus(this.checked, taskItem, time);
    });

    const timeElement = document.createElement('span');
    timeElement.classList.add('time');
    timeElement.textContent = ` at ${time}hrs`;

    taskItem.appendChild(checkBox);
    taskItem.appendChild(document.createTextNode(task));
    taskItem.appendChild(timeElement);

    return taskItem;
}

// Toggle task between incomplete and completed
function toggleTaskStatus(isChecked, taskItem, time) {
    if (isChecked) {
        taskItem.querySelector('.time').remove();
        taskList.removeChild(taskItem);
        doneList.appendChild(taskItem);

        // Remove the task reminder once it's completed
        const timeoutId = remindersMap.get(taskItem);
        clearTimeout(timeoutId);
        remindersMap.delete(taskItem);
    } else {
        const timeElement = document.createElement('span');
        timeElement.classList.add('time');
        timeElement.textContent = ` at ${time}hrs`;
        taskItem.insertBefore(timeElement, taskItem.childNodes[1]);
        doneList.removeChild(taskItem);
        taskList.appendChild(taskItem);
    }
    toggleListVisibility();
}

// Validate if provided time is in HH:MM format
function isValidTime(time) {
    const pattern = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
    return pattern.test(time);
}

// Add task to the task list
function addTask() {
    const task = inputElem.value.trim();
    if (!task) return;

    const time = prompt('Enter the time for the task (format: HH:MM)');
    if (!isValidTime(time)) return;

    const taskItem = createTaskItem(task, time);
    taskList.appendChild(taskItem);
    inputElem.value = '';

    toggleListVisibility();
    setReminder(task, time, taskItem);
}

// Set a task reminder
function setReminder(task, time, taskItem) {
    const [hours, minutes] = time.split(':');
    const currentTime = new Date();
    const reminderTime = new Date(
        currentTime.getFullYear(),
        currentTime.getMonth(),
        currentTime.getDate(),
        Number(hours),
        Number(minutes)
    );

    if (reminderTime <= currentTime) return;

    const timeDifference = reminderTime.getTime() - currentTime.getTime();
    const timeoutId = setTimeout(() => showReminder(task), timeDifference);

    // Store the reminder so it can be cancelled later
    remindersMap.set(taskItem, timeoutId);
}

// Show a task reminder
function showReminder(task) {
    const audio = new Audio('./notification.mp3');
    audio.play();

    // Show a browser notification or fallback to alert
    if (!('Notification' in window)) {
        alert(`Reminder: Time to do task - ${task}`);
        return;
    }

    if (Notification.permission === 'granted') {
        const notification = new Notification(`Reminder: Time to do task - ${task}`);
        setTimeout(() => notification.close(), 30000);
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission !== 'granted') return;
            const notification = new Notification(`Reminder: Time to do task - ${task}`);
            setTimeout(() => notification.close(), 30000);
        });
    }
}

// Clear tasks from a given list
function clearList(list) {
    while (list.firstChild) {
        list.removeChild(list.firstChild);
    }
    toggleListVisibility();
}

// Toggle visibility of task and done lists
function toggleListVisibility() {
    taskList.classList.toggle('hidden', taskList.childElementCount === 0);
    doneList.classList.toggle('hidden', doneList.childElementCount === 0);
}

// Event listeners for UI buttons
document.getElementById('clear').addEventListener('click', () => inputElem.value = '');
document.getElementById('cleartodo').addEventListener('click', () => clearList(taskList));
document.getElementById('cleardone').addEventListener('click', () => clearList(doneList));
document.getElementById('add').addEventListener('click', addTask);
toggleListVisibility();
