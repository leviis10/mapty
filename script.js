"use strict";

// Workout class
class Workout {
  id = Date.now().toString().slice(-10);
  coords; // [lat, lng]
  distance; // number
  duration; // number
  date = new Date(); // date
  description; // string

  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }

  _setDescription() {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

// Running workout class
class Running extends Workout {
  type = "running";
  cadence; // number
  pace; // number

  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.pace = this.duration / this.distance;
    this._setDescription();
  }
}

// Cycling workout class
class Cycling extends Workout {
  type = "cycling";
  elevGain; // number
  speed; // number

  constructor(coords, distance, duration, elevGain) {
    super(coords, distance, duration);
    this.elevGain = elevGain;
    this.speed = this.distance / (this.duration / 60);
    this._setDescription();
  }
}

// Main application
class App {
  #workouts = [];
  #map;
  #mapEvent;
  #zoomLevel = 18;
  #form = document.querySelector(".form");
  #containerWorkouts = document.querySelector(".workouts");
  #inputType = document.querySelector(".form__input--type");
  #inputDistance = document.querySelector(".form__input--distance");
  #inputDuration = document.querySelector(".form__input--duration");
  #inputCadence = document.querySelector(".form__input--cadence");
  #inputElevation = document.querySelector(".form__input--elevation");

  constructor() {
    this.#inputType.addEventListener(
      "change",
      this._toggleElevationField.bind(this)
    );
    this.#form.addEventListener("submit", this._newWorkout.bind(this));
    this.#containerWorkouts.addEventListener(
      "click",
      this._moveToPopup.bind(this)
    );
    this._getPosition();
  }

  _getPosition() {
    navigator.geolocation?.getCurrentPosition(this._loadMap.bind(this), () =>
      alert("Could not get your position")
    );
  }

  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    const coords = [latitude, longitude];

    // Create map
    this.#map = L.map("map", { closePopupOnClick: false }).setView(
      coords,
      this.#zoomLevel
    );

    // Change tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // add data from local storage
    this._getLocalStorage();

    // Map click handler
    this.#map.on("click", this._showForm.bind(this));
  }

  _getLocalStorage() {
    const workouts = localStorage.getItem("workouts");
    if (!workouts) {
      return;
    }

    this.#workouts = JSON.parse(workouts);
    for (const workout of this.#workouts) {
      this._renderWorkout(workout);
      this._renderWorkoutMarker(workout);
    }
  }

  _showForm(e) {
    this.#mapEvent = e;
    this.#form.classList.remove("hidden");
    this.#inputDistance.focus();
  }

  _toggleElevationField() {
    this.#inputCadence
      .closest(".form__row")
      .classList.toggle("form__row--hidden");
    this.#inputElevation
      .closest(".form__row")
      .classList.toggle("form__row--hidden");
  }

  _newWorkout(e) {
    e.preventDefault();

    const { lat, lng } = this.#mapEvent.latlng;
    const coords = [lat, lng];
    const type = this.#inputType.value;
    const distance = +this.#inputDistance.value;
    const duration = +this.#inputDuration.value;
    let workout;

    // Create workout object
    if (type === "running") {
      const cadence = +this.#inputCadence.value;
      if (
        !this._validInputs(distance, duration, cadence) ||
        !this._allPositive(distance, duration, cadence)
      ) {
        return alert("Inputs have to be positive numbers!");
      }

      workout = new Running(coords, distance, duration, cadence);
    }

    if (type === "cycling") {
      const elevation = +this.#inputElevation.value;
      if (
        !this._validInputs(distance, duration, elevation) ||
        !this._allPositive(distance, duration)
      ) {
        return alert("Inputs have to be positive numbers!");
      }

      workout = new Cycling(coords, distance, duration, elevation);
    }

    // Push workout object to workouts array
    this.#workouts.push(workout);

    // Render workout marker
    this._renderWorkoutMarker(workout);

    // Render workout on the list
    this._renderWorkout(workout);

    // Hide form and Clear form value
    this._hideForm();

    // add workout to localStorage
    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    // Create popup
    const popup = L.popup({
      content: `${workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"} ${
        workout.description
      }`,
      maxWidth: 250,
      minWidth: 100,
      autoClose: false,
      className: `${workout.type}-popup`,
    });

    // Create marker
    L.marker(workout.coords).addTo(this.#map).bindPopup(popup).openPopup();
  }

  _renderWorkout(workout) {
    let html = `
      <li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
          <span class="workout__icon">${
            workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"
          }</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>
    `;

    if (workout.type === "running") {
      html += `
          <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.pace.toFixed(1)}</span>
                <span class="workout__unit">min/km</span>
              </div>
              <div class="workout__details">
                <span class="workout__icon">🦶🏼</span>
                <span class="workout__value">${workout.cadence}</span>
                <span class="workout__unit">spm</span>
              </div>
        </li>
      `;
    }

    if (workout.type === "cycling") {
      html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>
      `;
    }

    this.#form.insertAdjacentHTML("afterend", html);
  }

  _hideForm() {
    this.#inputDistance.value =
      this.#inputDuration.value =
      this.#inputCadence.value =
      this.#inputElevation.value =
        "";

    this.#form.style.display = "none";
    this.#form.classList.add("hidden");
    setTimeout(() => {
      this.#form.style.display = "grid";
    }, 1);
  }

  _setLocalStorage() {
    localStorage.setItem("workouts", JSON.stringify(this.#workouts));
  }

  _moveToPopup(e) {
    const workoutEl = e.target.closest(".workout");
    if (!workoutEl) {
      return;
    }
    const workout = this.#workouts.find((workout) => {
      return workout.id === workoutEl.dataset.id;
    });
    this.#map.setView(workout.coords, this.#zoomLevel, {
      animate: true,
      pan: { duration: 1 },
    });
  }

  _validInputs(...inputs) {
    return inputs.every((input) => Number.isFinite(input));
  }

  _allPositive(...inputs) {
    return inputs.every((input) => input > 0);
  }
}

new App();
