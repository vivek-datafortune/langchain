/**
 * Seed script — run once to populate the Product collection with Alexa / Echo data.
 *
 * Usage:
 *   node src/scripts/seedProducts.js
 *
 * Requires MONGODB_URI in your .env (dotenv loaded below).
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { Product } from '../models/Product.js';

const products = [
  // ── Devices ───────────────────────────────────────────────────────────────
  {
    name: 'Amazon Echo (4th Gen)',
    category: 'Device',
    description:
      'The 4th-generation Amazon Echo is a spherical smart speaker with premium 360° audio. It features a built-in Zigbee smart-home hub, a dedicated woofer and twin tweeters, and Dolby processing for rich, detailed sound. It can act as an Eero Wi-Fi mesh extender and always-on Alexa voice assistant.',
    features: [
      '360° omnidirectional sound with Dolby processing',
      'Dedicated woofer + dual tweeters',
      'Built-in Zigbee smart-home hub',
      'Built-in Eero Wi-Fi mesh extender',
      'AZ2 Neural Edge processor for on-device processing',
      'Far-field 7-microphone array',
      'LED light ring for visual feedback',
      'Bluetooth 5.0 + Wi-Fi dual-band (2.4 / 5 GHz)',
      '3.5 mm audio output (line-out)',
      'Privacy microphone off button',
    ],
    specifications: new Map([
      ['Dimensions', '5.7" x 5.7" x 5.2" (144 x 144 x 133 mm)'],
      ['Weight', '970 g'],
      ['Woofer', '3.0" down-firing'],
      ['Tweeters', '0.8" x2 side-firing'],
      ['Connectivity', 'Wi-Fi 802.11 a/b/g/n/ac (2.4/5 GHz), Bluetooth 5.0'],
      ['Audio output', '3.5 mm stereo jack'],
      ['Power', '30 W adapter'],
      ['Processor', 'AZ2 Neural Edge'],
      ['Color options', 'Charcoal, Glacier White, Twilight Blue'],
      ['Release year', '2020'],
    ]),
    tags: ['echo', 'smart speaker', 'alexa', '4th gen', 'zigbee', 'hub', 'wifi', 'bluetooth', 'audio', 'dolby', 'sphere'],
  },
  {
    name: 'Amazon Echo Dot (5th Gen)',
    category: 'Device',
    description:
      'The 5th-generation Echo Dot is Amazon\'s most popular compact smart speaker. It delivers 1.73x louder bass than its predecessor, features an improved 1.6" front-firing speaker, and introduces a new temperature and motion sensor. The Ecodesign compliant build uses 50% recycled fabric on the exterior.',
    features: [
      '1.6" front-firing full-range driver',
      'Improved bass with passive radiator',
      'Built-in temperature sensor',
      'Built-in motion sensor (supports tap-to-snooze Routines)',
      'Far-field 4-microphone array',
      'Bluetooth 5.0 + dual-band Wi-Fi',
      '50% recycled post-consumer materials',
      'LED light ring',
      'Privacy microphone off button',
      'Ecodesign compliant',
    ],
    specifications: new Map([
      ['Dimensions', '3.9" x 3.9" x 3.5" (100 x 100 x 89 mm)'],
      ['Weight', '304 g'],
      ['Speaker', '1.6" front-firing'],
      ['Connectivity', 'Wi-Fi 802.11 a/b/g/n/ac (2.4/5 GHz), Bluetooth 5.0'],
      ['Sensors', 'Temperature, Motion'],
      ['Power', '15 W adapter'],
      ['Color options', 'Charcoal, Glacier White, Deep Sea Blue, Lavender'],
      ['Release year', '2022'],
    ]),
    tags: ['echo dot', 'compact speaker', 'alexa', '5th gen', 'temperature sensor', 'motion sensor', 'budget', 'small', 'affordable'],
  },
  {
    name: 'Amazon Echo Studio',
    category: 'Device',
    description:
      'Echo Studio is Amazon\'s premium hi-fi smart speaker with five built-in drivers and automatic room acoustic calibration. It supports Dolby Atmos and Sony 360 Reality Audio spatial sound formats, and includes a 3D audio processing chip. Also acts as a built-in Zigbee hub.',
    features: [
      '5-driver array: 1x 5.25" woofer, 1x 2" mid-range, 3x 0.8" tweeters',
      'Dolby Atmos and Sony 360 Reality Audio spatial sound',
      'Automatic room acoustic adaptation',
      'Built-in Zigbee smart-home hub',
      'USB-C audio passthrough port',
      '3.5 mm audio output',
      'Far-field 5-microphone array',
      'Stereo pairing with a second Echo Studio',
      'Hi-res audio support (up to 24-bit / 192 kHz)',
      'Bluetooth aptX HD',
    ],
    specifications: new Map([
      ['Dimensions', '6.9" x 6.9" x 6.2" (175 x 175 x 158 mm)'],
      ['Weight', '3.5 kg'],
      ['Woofer', '5.25" down-firing'],
      ['Mid-range', '2.0"'],
      ['Tweeters', '0.8" x3'],
      ['Total power output', '330 W peak'],
      ['Connectivity', 'Wi-Fi 802.11 a/b/g/n/ac (2.4/5 GHz), Bluetooth 5.0 aptX HD'],
      ['Audio output', '3.5 mm + USB-C passthrough'],
      ['Hi-res audio', 'Up to 24-bit / 192 kHz'],
      ['Color options', 'Charcoal, Glacier White'],
      ['Release year', '2023'],
    ]),
    tags: ['echo studio', 'premium speaker', 'hifi', 'hi-res audio', 'dolby atmos', '360 reality audio', 'spatial audio', 'five drivers', 'woofer', 'subwoofer', 'high fidelity', 'zigbee'],
  },
  {
    name: 'Amazon Echo Show 10 (3rd Gen)',
    category: 'Device',
    description:
      'Echo Show 10 is a 10.1" HD smart display with a motorized base that automatically rotates the screen to keep you in frame during video calls. Suitable as a smart home control centre, it features a 13 MP auto-framing camera, dual side-firing front speakers, and a built-in Zigbee hub.',
    features: [
      '10.1" 1080p HD rotating display',
      'Motorized base — auto-rotates to follow you',
      '13 MP wide-angle auto-framing camera',
      'Dual 1" tweeters + 3" woofer speaker system',
      'Dolby audio',
      'Built-in Zigbee smart-home hub',
      'Video calling: Alexa, Zoom, Skype',
      'Smart home dashboard and camera live view',
      'Netflix, Prime Video, Hulu streaming',
      'Privacy shutter + microphone off button',
      'Far-field 8-microphone array',
    ],
    specifications: new Map([
      ['Dimensions', '9.9" x 9.9" x 7.4" (251 x 251 x 188 mm)'],
      ['Display', '10.1" 1080p HD IPS'],
      ['Camera', '13 MP wide-angle with auto-framing'],
      ['Woofer', '3.0"'],
      ['Tweeters', '1.0" x2'],
      ['Connectivity', 'Wi-Fi 802.11 a/b/g/n/ac (2.4/5 GHz), Bluetooth 5.0'],
      ['Color options', 'Charcoal, Glacier White'],
      ['Release year', '2021'],
    ]),
    tags: ['echo show', 'smart display', 'screen', 'video call', 'camera', 'rotating', 'touchscreen', '10 inch', 'zigbee', 'streaming', 'netflix'],
  },
  {
    name: 'Amazon Echo Show 8 (3rd Gen)',
    category: 'Device',
    description:
      'The Echo Show 8 features an 8" HD touchscreen with adaptive color, a 13 MP auto-framing camera, spatial audio with stereo speakers, and a built-in smart home hub. Its room-adaptive display automatically adjusts colour temperature based on ambient light.',
    features: [
      '8" HD touchscreen with adaptive colour',
      '13 MP auto-framing camera',
      'Spatial audio with stereo speakers',
      'Adaptive ambient light sensor for display',
      'Built-in Zigbee + Matter smart home hub',
      'Alexa video calling and Zoom support',
      'Privacy shutter cover for camera',
      'Supports Fire TV streaming with HDMI',
      'Photo frame mode with Amazon Photos',
    ],
    specifications: new Map([
      ['Dimensions', '7.9" x 5.3" x 3.9"'],
      ['Display', '8" HD 1280x800 IPS touchscreen'],
      ['Camera', '13 MP with auto-framing'],
      ['Connectivity', 'Wi-Fi 802.11 a/b/g/n/ac (2.4/5 GHz), Bluetooth 5.0'],
      ['Release year', '2023'],
    ]),
    tags: ['echo show 8', 'smart display', '8 inch', 'touchscreen', 'camera', 'matter', 'zigbee', 'spatial audio', 'photo frame'],
  },
  {
    name: 'Amazon Echo Pop',
    category: 'Device',
    description:
      'Echo Pop is Amazon\'s most affordable compact smart speaker with a unique half-sphere design and front-facing speaker for directional sound. It connects via Bluetooth and Wi-Fi and supports all Alexa voice commands.',
    features: [
      '1.95" front-firing full-range driver',
      'Half-sphere compact design',
      'Far-field 4-microphone array',
      'Bluetooth 5.0 + dual-band Wi-Fi',
      '50% recycled post-consumer materials',
      'LED light ring',
      'Full Alexa voice assistant support',
    ],
    specifications: new Map([
      ['Dimensions', '3.9" x 3.9" x 2.1"'],
      ['Speaker', '1.95" front-firing'],
      ['Connectivity', 'Wi-Fi 802.11 a/b/g/n/ac, Bluetooth 5.0'],
      ['Color options', 'Charcoal, Glacier White, Lavender, Midnight Teal'],
      ['Release year', '2023'],
    ]),
    tags: ['echo pop', 'affordable', 'budget', 'compact', 'half sphere', 'entry level', 'alexa', 'small speaker'],
  },

  // ── Software / Features ───────────────────────────────────────────────────
  {
    name: 'Alexa Voice Assistant',
    category: 'Software',
    description:
      'Alexa is Amazon\'s cloud-based AI voice assistant. It uses natural-language processing (NLP) and automatic speech recognition (ASR) to understand and respond to voice commands. Alexa runs on Amazon\'s cloud servers but also performs on-device processing via the AZ2 Neural Edge processor for low-latency responses and offline basic commands.',
    features: [
      'Natural Language Understanding (NLU) with context awareness',
      'Multi-turn conversation support',
      'On-device processing for select commands (AZ2 chip)',
      'Personalised voice profiles — recognises up to 10 voices',
      'Multilingual support: English, Spanish, French, German, Japanese, Hindi, and more',
      'Proactive suggestions based on routines and history',
      'Whisper mode — detects whispers, replies softly',
      'Follow-up mode — no need to repeat wake word',
      'Adaptive volume — adjusts to room noise',
      'Brief mode — shorter, chime-based confirmations',
    ],
    specifications: new Map([
      ['Wake word', 'Alexa (customisable to Echo, Amazon, Ziggy, Computer)'],
      ['Supported languages', '14+ languages'],
      ['NLP engine', 'Amazon Lex'],
      ['On-device chipset', 'AZ2 Neural Edge (selected Echo devices)'],
      ['Voice profiles', 'Up to 10 per household'],
      ['Cloud', 'Amazon Web Services (AWS)'],
    ]),
    tags: ['alexa', 'voice assistant', 'nlp', 'ai', 'natural language', 'speech recognition', 'wake word', 'cloud', 'on device', 'multilingual', 'voice profiles'],
  },
  {
    name: 'Alexa Skills',
    category: 'Feature',
    description:
      'Alexa Skills are third-party and first-party voice-driven apps that extend Alexa\'s capabilities. There are over 100,000 skills across categories including smart home, games, education, music, health, news, and productivity. Developers build skills using the Alexa Skills Kit (ASK) and publish them in the Alexa Skills Store.',
    features: [
      '100,000+ skills available in the Alexa Skills Store',
      'Custom skills, smart home skills, flash briefings, games, and more',
      'In-skill purchasing — buy digital goods via voice',
      'Alexa Skills Kit (ASK) for developers',
      'Supported interfaces: voice, display (APL), audio player',
      'Skill permissions: location, contacts, customer profile',
      'Routine integration — trigger skills from schedules or devices',
      'Multi-modal skills for Echo Show devices',
    ],
    specifications: new Map([
      ['Total skills', '100,000+'],
      ['Developer SDK', 'Alexa Skills Kit (ASK)'],
      ['Supported languages', 'Node.js, Python, Java, C#'],
      ['Skill types', 'Custom, Smart Home, Flash Briefing, Music/Audio, Video'],
    ]),
    tags: ['skills', 'third party', 'apps', 'ask', 'developer', 'games', 'education', 'flash briefing', 'custom skill', 'store'],
  },
  {
    name: 'Alexa Smart Home Integration',
    category: 'Feature',
    description:
      'Alexa works as a universal smart home controller supporting over 100,000 smart home devices across 9,500+ brands. It supports Zigbee, Z-Wave, Matter, and Wi-Fi protocols natively and connects with hubs like Philips Hue, Samsung SmartThings, and Google Home.',
    features: [
      'Controls 100,000+ smart home devices',
      'Protocols: Zigbee, Z-Wave, Matter, Wi-Fi, Bluetooth',
      'Works with Philips Hue, LIFX, TP-Link Kasa, Nest, Ring, and more',
      'Alexa Groups — control rooms of devices together',
      'Smart home routines — automate by time, sensor, voice, or sunrise/sunset',
      'Device discovery and auto-setup for Matter devices',
      'Local processing via Zigbee hub for faster response',
      'Alexa Guard — uses microphones to detect smoke, CO, glass break',
      'Supported categories: lights, locks, thermostats, cameras, plugs, blinds, fans, TVs',
    ],
    specifications: new Map([
      ['Compatible devices', '100,000+'],
      ['Compatible brands', '9,500+'],
      ['Protocols', 'Zigbee, Z-Wave, Matter, Wi-Fi, Bluetooth, IR (via hub)'],
      ['Built-in hub', 'Zigbee + Matter on Echo 4th Gen, Echo Show, Echo Studio'],
    ]),
    tags: ['smart home', 'zigbee', 'matter', 'z-wave', 'philips hue', 'smart lights', 'thermostat', 'lock', 'ring', 'nest', 'home automation', 'routines', 'alexa guard'],
  },
  {
    name: 'Alexa Routines',
    category: 'Feature',
    description:
      'Alexa Routines let users automate sequences of actions triggered by a voice command, schedule, device sensor, or smart home event. A single trigger can fire multiple actions: control lights, play music, announce messages, adjust thermostat, read news, and more — all at once.',
    features: [
      'Triggers: voice command, schedule, sunrise/sunset, sensor, alarm, location',
      'Actions: smart home control, Alexa announcements, music, news, skills, notifications',
      'Multi-step sequencing with delays between actions',
      'Conditional logic — if/then branching in routines',
      'Device-specific routines on Echo with motion/temperature sensor',
      'Household announcements via multi-room Echo network',
      'Routine sharing between household members',
      'Alexa app Routines editor (visual builder)',
    ],
    specifications: new Map([
      ['Max actions per routine', '32'],
      ['Supported triggers', '6 types (voice, schedule, sensor, device, location, alarm)'],
      ['Conditional logic', 'Supported (if/then)'],
    ]),
    tags: ['routines', 'automation', 'schedule', 'trigger', 'smart home', 'sequence', 'announcements', 'conditional', 'if then'],
  },
  {
    name: 'Alexa Guard',
    category: 'Feature',
    description:
      'Alexa Guard turns Echo devices into a home security sensor network. In Away mode, Echo microphones listen for the sound of smoke alarms, CO detectors, or breaking glass and send you a Smart Alert notification. Guard Plus adds professional monitoring, siren capability, and car guard features.',
    features: [
      'Listens for smoke alarms, CO detectors, and glass break sounds',
      'Smart Alerts — instant mobile push notifications',
      'Away mode activated via voice or Alexa app',
      'Smart lighting simulation — randomly toggles lights to deter intruders',
      'Guard Plus: siren activation via voice',
      'Guard Plus: 24/7 professional emergency response monitoring',
      'Guard Plus: car guard (detects car alarms)',
      'Integrates with Ring security system',
    ],
    specifications: new Map([
      ['Guard (free)', 'Sound detection, Smart Alerts, lighting simulation'],
      ['Guard Plus pricing', '$4.99/month or $49/year'],
      ['Monitored sounds', 'Smoke alarm, CO alarm, glass break'],
      ['Availability', 'US only'],
    ]),
    tags: ['alexa guard', 'security', 'smoke alarm', 'glass break', 'co detector', 'away mode', 'home security', 'siren', 'ring', 'monitoring'],
  },
  {
    name: 'Alexa Music & Audio',
    category: 'Feature',
    description:
      'Alexa supports playback from all major music and podcast streaming services including Amazon Music, Spotify, Apple Music, TuneIn, iHeartRadio, Deezer, Tidal, and Audible. It supports multi-room audio, stereo pairing, Bluetooth audio sink/source, and high-resolution streaming on Echo Studio.',
    features: [
      'Supported services: Amazon Music, Spotify, Apple Music, TuneIn, iHeartRadio, Deezer, Tidal, Audible',
      'Amazon Music Unlimited HD — lossless up to 24-bit / 192 kHz on Echo Studio',
      'Multi-room music — synchronised playback across multiple Echo devices',
      'Stereo pairing — pair two identical Echo devices for left/right stereo',
      'Bluetooth audio source (stream from phone) and sink (stream to speaker)',
      'Voice control: play, pause, skip, volume, queue, shuffle, repeat',
      'Alarm and sleep timer with music',
      'Wake to music — Alexa as a morning alarm with favourite playlist',
    ],
    specifications: new Map([
      ['Max streaming quality', '24-bit / 192 kHz (Amazon Music HD on Echo Studio)'],
      ['Multi-room groups', 'Up to all Echo devices in household'],
      ['Bluetooth profiles', 'A2DP source + sink, AVRCP'],
    ]),
    tags: ['music', 'spotify', 'amazon music', 'apple music', 'streaming', 'multi-room', 'stereo pair', 'bluetooth', 'hi-res audio', 'podcast', 'audible', 'radio', 'tunein'],
  },
  {
    name: 'Alexa Shopping & Lists',
    category: 'Feature',
    description:
      'Alexa integrates with Amazon Shopping for voice-activated product search, ordering, and order tracking. It also manages to-do and shopping lists that sync across the Alexa app and third-party apps like AnyList and OurGroceries.',
    features: [
      'Voice ordering on Amazon — add to cart or reorder by voice',
      'Order tracking — "where is my order?" queries',
      'Shopping list synced with Alexa app and Amazon Fresh',
      'To-do list management',
      'Third-party list integration: AnyList, OurGroceries, Todoist',
      'Alexa Deals — personalised voice-revealed deals',
      'Subscribe & Save voice management',
      'Amazon Fresh grocery voice ordering',
    ],
    specifications: new Map([
      ['Order confirmation', 'Requires voice confirmation or PIN'],
      ['Supported list apps', 'AnyList, OurGroceries, Todoist, Any.do'],
      ['Purchase PIN', 'Optional 4-digit voice PIN for purchases'],
    ]),
    tags: ['shopping', 'amazon shopping', 'order', 'to-do list', 'grocery', 'list', 'amazon fresh', 'reorder', 'cart', 'purchase'],
  },
];

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set');

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  await Product.deleteMany({});
  console.log('Cleared existing products');

  const inserted = await Product.insertMany(products);
  console.log(`Seeded ${inserted.length} products:`);
  inserted.forEach(p => console.log(`  • [${p.category}] ${p.name}`));

  await mongoose.disconnect();
  console.log('Done.');
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
