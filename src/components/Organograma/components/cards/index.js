import { PersonCard } from './PersonCard.jsx';

const cards = new Map();

export function registerCard(type, component) {
  cards.set(type, component);
}

export function getCard(type) {
  return cards.get(type) ?? PersonCard;
}

registerCard('person', PersonCard);
