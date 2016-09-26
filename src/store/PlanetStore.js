import { observable, action, map, asMap } from 'mobx';
import serverWait from 'mobx-server-wait';
import fetch from 'isomorphic-fetch';

// Default planet response
const defaultPlanet = {
  isLoading: false,
  data: {},
  hasError: false,
};

export default class PlanetStore {

  constructor(state = {}) {
    const { planets, ...rest } = state;
    this.planets = asMap(planets);
    Object.assign(this, rest);
  }

  @observable
  isLoading = false;

  @observable
  hasError = false;

  @observable
  data = [];

  @serverWait
  fetchPlanets() {
    if (!this.isLoading && this.data.length > 0) return;
    this.isLoading = true;
    return fetch('https://swapi.co/api/planets')
    .then(data => data.json())
    .then(action(data => {
      this.isLoading = false;
      this.data = data.results;
    }))
    .catch(action(err => {
      this.hasError = true;
      this.data = err;
    }));
  }

  @observable
  planets = map();

  @serverWait
  fetchPlanet(id) {
    const { planets } = this;

    if (planets.has(id)) return;

    if (!planets.has(id)) {
      planets.set(id, {
        ...defaultPlanet,
        isLoading: true,
      });
    }

    return fetch(`https://swapi.co/api/planets/${id}`)
    .then(data => data.json())
    .then(action(data => {
      const planet = planets.get(id);
      if (data.detail === 'Not found') {
        return (planet.hasError = true);
      }
      planet.isLoading = false;
      planet.data = data;
    }));
  }

  getPlanet = (id) => this.planets.get(id) || defaultPlanet;

}