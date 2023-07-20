'use strict';

// Retrieve necessary DOM elements
const taskList = document.getElementById("taskList");
const doneList = document.getElementById("doneList");
const input = document.getElementById('task');
const suggestionList = document.getElementById('suggestionList');
const reminderContainer = document.getElementById('reminderContainer');
const reminderList = document.getElementById('reminderList');
let selectedSuggestion = '';

// Load the suggestions from the JSON file
fetch('suggestions.json')
  .then(response => response.json())
  .then(data => {
    const suggestions = data.suggestions;

    // Handle input event on the input field
    input.addEventListener('input', handleInput);

    function handleInput(event) {
      const searchTerm = event.target.value.toLowerCase().trim();

      if (searchTerm.length > 0) {
        suggestionList.classList.remove('hidden');
      } else {
        suggestionList.classList.add('hidden');
      }

      if (searchTerm.length === 0) {
        // Clear previous suggestions if input is empty
        suggestionList.innerHTML = '';
        return;
      }

      // Filter and display matching suggestions
      const matchingSuggestions = suggestions.filter(suggestion =>
        suggestion.toLowerCase().startsWith(searchTerm)
      );

      selectedSuggestion = ''; // Reset selected suggestion

      suggestionList.innerHTML = ''; // Clear previous suggestions

      matchingSuggestions.forEach(suggestion => {
        const li = document.createElement('li');
        li.textContent = suggestion;

        li.addEventListener('click', function () {
          selectedSuggestion = suggestion;
          input.value = selectedSuggestion;
          suggestionList.innerHTML = ''; // Clear suggestions after selection
          suggestionList.classList.add('hidden'); // Hide suggestion list after selection
        });

        suggestionList.appendChild(li);
      });

      // Check if the entered value is entirely different from the suggestions
      const isDifferent = !suggestions.some(suggestion =>
        suggestion.toLowerCase().startsWith(searchTerm)
      );

      // Hide suggestion list if the entered value is entirely different
      if (isDifferent) {
        suggestionList.classList.add('hidden');
      }
    }
  })
  .catch(error => {
    console.log('Error loading suggestions:', error);
  });

// Listen for input box focus event
input.addEventListener('focus', function () {
  // Clear suggestions and selected suggestion when input is focused
  suggestionList.innerHTML = '';
  selectedSuggestion = '';
});

// Listen for input box blur event
input.addEventListener('blur', function () {
  // Set input value to the selected suggestion on blur if available
  if (selectedSuggestion) {
    input.value = selectedSuggestion;
  }
});

// Add a task to the task list
function addTask() {
    const task = input.value.trim();
  
    if (task === '') {
      showError('Task cannot be empty.');
      return;
    }
  
    const time = prompt('Enter the time for the task (format: HH:MM)');
  
    if (!isValidTime(time)) {
      showError('Invalid time format. Please enter time in HH:MM format.');
      return;
    }
  
    const taskItem = document.createElement('li');
    const checkBox = document.createElement('input');
    checkBox.type = 'checkbox';
    checkBox.addEventListener('change', function () {
      // Move task item to the done list when checked, or back to the task list when unchecked
      if (this.checked) {
        taskItem.removeChild(timeElement); // Remove time element when task is marked as done
        taskList.removeChild(taskItem);
        doneList.appendChild(taskItem);
      } else {
        taskItem.insertBefore(timeElement, checkBox.nextSibling); // Add time element back when task is marked as undone
        doneList.removeChild(taskItem);
        taskList.insertBefore(taskItem, taskList.firstChild);
      }
      toggleListVisibility();
    });
  
    const timeElement = document.createElement('span');
    timeElement.classList.add('time');
    timeElement.textContent = ` at ${time}hrs`;
  
    taskItem.appendChild(checkBox);
    taskItem.appendChild(document.createTextNode(task));
    taskItem.appendChild(timeElement);
  
    taskList.appendChild(taskItem); // Append task item to the task list
    input.value = '';
  
    toggleListVisibility();
    setReminder(task, time, taskItem);
  }
  
  // Validate the time format (HH:MM)
  function isValidTime(time) {
    const pattern = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
    return pattern.test(time);
  }  

// Set a reminder for a task at the specified time

// Set a reminder for a task at the specified time
function setReminder(task, time) {
    const [hours, minutes] = time.split(':');
    const currentTime = new Date();
    const reminderTime = new Date(
      currentTime.getFullYear(),
      currentTime.getMonth(),
      currentTime.getDate(),
      Number(hours),
      Number(minutes)
    );
  
    if (reminderTime > currentTime) {
      const timeDifference = reminderTime.getTime() - currentTime.getTime();
      setTimeout(function () {
        showReminder(task);
      }, timeDifference);
    }
  }
  
  function showReminder(task, taskItem, reminderTimeout) {
    // Play a ring sound
    const audio = new Audio('./notification.mp3');
    audio.play();
  
    if ('Notification' in window && Notification.permission === 'granted') {
      // Display a notification
      const notification = new Notification(`Reminder: Time to do task - ${task}`);
      setTimeout(function () {
        notification.close(); // Close the notification after 30 seconds
      }, 30000);
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      // Request permission from the user to display notifications
      Notification.requestPermission().then(function (permission) {
        if (permission === 'granted') {
          // Display a notification
          const notification = new Notification(`Reminder: Time to do task - ${task}`);
          setTimeout(function () {
            notification.close(); // Close the notification after 30 seconds
          }, 30000);
        }
      });
    } else {
      // Fallback to an alert if notifications are not supported
      const alertTimeout = setTimeout(function () {
        alert(`Reminder: Time to do task - ${task}`);
      }, 0); // Delay the alert to the next event loop iteration
  
      setTimeout(function () {
        clearTimeout(alertTimeout);
      }, 30000);
    }
  
    // Remove the reminder timeout to prevent showing the reminder again
    clearTimeout(reminderTimeout);
  }
  

// Clear input field on clear button click
document.getElementById('clear').addEventListener('click', function () {
  input.value = '';
});

// Clear task list on clear todo button click
document.getElementById('cleartodo').addEventListener('click', function () {
  clearList(taskList);
});

// Clear done list on clear done button click
document.getElementById('cleardone').addEventListener('click', function () {
  clearList(doneList);
});

// Clear the given list and toggle list visibility
function clearList(list) {
  while (list.firstChild) {
    list.removeChild(list.firstChild);
  }
  toggleListVisibility();
}

// Toggle visibility of task and done lists based on their child count
function toggleListVisibility() {
  taskList.classList.toggle('hidden', taskList.childElementCount === 0);
  doneList.classList.toggle('hidden', doneList.childElementCount === 0);
}

// Retrieve the add button element and add event listener
const addButton = document.getElementById('add');
addButton.addEventListener('click', addTask);

// Initially toggle visibility of task and done lists
toggleListVisibility();
