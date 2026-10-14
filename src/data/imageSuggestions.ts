/**
 * Automatiske billed-forslag til alle 52 kort.
 * System: hver kulør har et tema, og hver værdi har et form-/talbillede.
 *   ♣ klør   = natur & dyr
 *   ♥ hjerter = mennesker & følelser
 *   ♠ spar   = værktøj & ting
 *   ♦ ruder  = mad, penge & hverdagens København
 * Brugeren kan redigere alt. `q` er et engelsk søgeord til online billedsøgning.
 */
import type { CardId } from './cards';

export interface ImageSuggestion {
  emoji: string;
  da: string;
  en: string;
  q: string;
}

export const IMAGE_SUGGESTIONS: Record<CardId, ImageSuggestion> = {
  // ♣ Klør – natur & dyr
  AC: { emoji: '🌳', da: 'Egetræ', en: 'Oak tree', q: 'oak tree' },
  '2C': { emoji: '🦢', da: 'Svane', en: 'Swan', q: 'swan' },
  '3C': { emoji: '🦆', da: 'And i søerne', en: 'Duck', q: 'duck' },
  '4C': { emoji: '🐎', da: 'Hest', en: 'Horse', q: 'horse' },
  '5C': { emoji: '🦔', da: 'Pindsvin', en: 'Hedgehog', q: 'hedgehog' },
  '6C': { emoji: '🐌', da: 'Snegl', en: 'Snail', q: 'snail' },
  '7C': { emoji: '🌻', da: 'Solsikke', en: 'Sunflower', q: 'sunflower' },
  '8C': { emoji: '⛄', da: 'Snemand', en: 'Snowman', q: 'snowman' },
  '9C': { emoji: '🍄', da: 'Fluesvamp', en: 'Mushroom', q: 'fly agaric mushroom' },
  '10C': { emoji: '🎄', da: 'Juletræ', en: 'Christmas tree', q: 'christmas tree' },
  JC: { emoji: '🧑‍🌾', da: 'Gartner', en: 'Gardener', q: 'gardener' },
  QC: { emoji: '🧚', da: 'Elverdronning', en: 'Fairy queen', q: 'fairy' },
  KC: { emoji: '🦁', da: 'Løvekonge', en: 'Lion king', q: 'lion' },
  // ♥ Hjerter – mennesker & følelser
  AH: { emoji: '❤️', da: 'Stort hjerte', en: 'Big heart', q: 'heart shape' },
  '2H': { emoji: '💑', da: 'Kærestepar', en: 'Couple', q: 'couple' },
  '3H': { emoji: '👨‍👩‍👦', da: 'Familie', en: 'Family', q: 'family picnic' },
  '4H': { emoji: '🌹', da: 'Rose', en: 'Rose', q: 'red rose' },
  '5H': { emoji: '🖐️', da: 'High five', en: 'High five', q: 'high five' },
  '6H': { emoji: '💌', da: 'Kærlighedsbrev', en: 'Love letter', q: 'love letter' },
  '7H': { emoji: '🎂', da: 'Fødselsdagskage', en: 'Birthday cake', q: 'birthday cake' },
  '8H': { emoji: '🧸', da: 'Bamse', en: 'Teddy bear', q: 'teddy bear' },
  '9H': { emoji: '🎈', da: 'Ballon', en: 'Balloon', q: 'balloon' },
  '10H': { emoji: '💍', da: 'Vielsesring', en: 'Wedding ring', q: 'wedding ring' },
  JH: { emoji: '🤴', da: 'Prins', en: 'Prince', q: 'prince costume' },
  QH: { emoji: '👸', da: 'Prinsesse', en: 'Princess', q: 'princess' },
  KH: { emoji: '🫅', da: 'Hjerterkonge', en: 'King of hearts', q: 'king crown' },
  // ♠ Spar – værktøj & ting
  AS: { emoji: '🪓', da: 'Økse', en: 'Axe', q: 'axe' },
  '2S': { emoji: '✂️', da: 'Saks', en: 'Scissors', q: 'scissors' },
  '3S': { emoji: '🔱', da: 'Trefork', en: 'Trident', q: 'trident' },
  '4S': { emoji: '🪑', da: 'Stol', en: 'Chair', q: 'wooden chair' },
  '5S': { emoji: '🧤', da: 'Handske', en: 'Glove', q: 'glove' },
  '6S': { emoji: '🎲', da: 'Terning', en: 'Dice', q: 'dice' },
  '7S': { emoji: '⛏️', da: 'Hakke', en: 'Pickaxe', q: 'pickaxe' },
  '8S': { emoji: '🕶️', da: 'Solbriller', en: 'Sunglasses', q: 'sunglasses' },
  '9S': { emoji: '🔭', da: 'Kikkert', en: 'Telescope', q: 'telescope' },
  '10S': { emoji: '🎳', da: 'Bowling', en: 'Bowling', q: 'bowling pins' },
  JS: { emoji: '🕵️', da: 'Detektiv', en: 'Detective', q: 'detective' },
  QS: { emoji: '🧙‍♀️', da: 'Heks', en: 'Witch', q: 'witch hat' },
  KS: { emoji: '🛡️', da: 'Vikingekonge', en: 'Viking king', q: 'viking' },
  // ♦ Ruder – mad, penge & København
  AD: { emoji: '💎', da: 'Diamant', en: 'Diamond', q: 'diamond gem' },
  '2D': { emoji: '🚲', da: 'Ladcykel', en: 'Bicycle', q: 'cargo bike' },
  '3D': { emoji: '🥐', da: 'Wienerbrød', en: 'Pastry', q: 'danish pastry' },
  '4D': { emoji: '🚗', da: 'Bil', en: 'Car', q: 'vintage car' },
  '5D': { emoji: '🌭', da: 'Pølsevogn', en: 'Hot dog stand', q: 'hot dog' },
  '6D': { emoji: '🧀', da: 'Ost', en: 'Cheese', q: 'cheese' },
  '7D': { emoji: '🎰', da: 'Spilleautomat', en: 'Slot machine', q: 'slot machine' },
  '8D': { emoji: '⏳', da: 'Timeglas', en: 'Hourglass', q: 'hourglass' },
  '9D': { emoji: '🎡', da: 'Tivoli-pariserhjul', en: 'Ferris wheel', q: 'ferris wheel' },
  '10D': { emoji: '💰', da: 'Pengesæk', en: 'Money bag', q: 'money bag' },
  JD: { emoji: '🤵', da: 'Tjener', en: 'Waiter', q: 'waiter' },
  QD: { emoji: '💃', da: 'Danserinde', en: 'Dancer', q: 'dancer' },
  KD: { emoji: '🏰', da: 'Slotsherre', en: 'Castle lord', q: 'castle' },
};
