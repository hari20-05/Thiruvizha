const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;
const DATA_FILE = path.join(__dirname, 'data', 'events.json');
const COMPLETED_DATA_FILE = path.join(__dirname, 'data', 'completed-events.json');
const CLIENT_DIST = path.join(__dirname, '..', 'client', 'dist');

app.use(cors());
app.use(express.json());

function readEvents() {
  try {
    const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    return [];
  }
}

function writeEvents(events) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(events, null, 2));
}

function readCompletedEvents() {
  try {
    return JSON.parse(fs.readFileSync(COMPLETED_DATA_FILE, 'utf-8'));
  } catch (error) {
    return [];
  }
}

function writeCompletedEvents(events) {
  fs.writeFileSync(COMPLETED_DATA_FILE, JSON.stringify(events, null, 2));
}

function normalizeString(value = '') {
  return value.toString().trim();
}

function isCompleted(event) {
  return Boolean(event.date) && event.date < new Date().toISOString().slice(0, 10);
}

function archiveCompletedEvents() {
  const activeEvents = readEvents();
  const completedEvents = readCompletedEvents();
  const newlyCompleted = activeEvents.filter(isCompleted);

  if (newlyCompleted.length === 0) {
    return { activeEvents, completedEvents };
  }

  const remainingActiveEvents = activeEvents.filter((event) => !isCompleted(event));
  const updatedCompletedEvents = [...newlyCompleted, ...completedEvents];
  writeEvents(remainingActiveEvents);
  writeCompletedEvents(updatedCompletedEvents);

  return { activeEvents: remainingActiveEvents, completedEvents: updatedCompletedEvents };
}

function buildEvent(eventData) {
  return {
    id: eventData.id || uuidv4(),
    title: normalizeString(eventData.title),
    description: normalizeString(eventData.description),
    category: normalizeString(eventData.category),
    city: normalizeString(eventData.city),
    date: normalizeString(eventData.date),
    venue: normalizeString(eventData.venue),
    address: normalizeString(eventData.address),
    latitude: eventData.latitude === '' || eventData.latitude === undefined ? null : Number(eventData.latitude),
    longitude: eventData.longitude === '' || eventData.longitude === undefined ? null : Number(eventData.longitude),
    image: normalizeString(eventData.image),
    price: Number(eventData.price || 0),
    organizer: normalizeString(eventData.organizer)
  };
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Event Finder API is running' });
});

app.get('/api/events', (req, res) => {
  const { activeEvents, completedEvents } = archiveCompletedEvents();
  let events = req.query.status === 'completed' ? completedEvents : activeEvents;
  const { city, category, search } = req.query;

  if (city) {
    events = events.filter((event) =>
      event.city.toLowerCase().includes(city.toLowerCase())
    );
  }

  if (category) {
    events = events.filter((event) =>
      event.category.toLowerCase() === category.toLowerCase()
    );
  }

  if (search) {
    const query = search.toLowerCase();
    events = events.filter((event) =>
      event.title.toLowerCase().includes(query) ||
      event.description.toLowerCase().includes(query) ||
      event.city.toLowerCase().includes(query) ||
      event.venue.toLowerCase().includes(query) ||
      event.address.toLowerCase().includes(query)
    );
  }

  res.json(events);
});

app.get('/api/events/:id', (req, res) => {
  const { activeEvents, completedEvents } = archiveCompletedEvents();
  const events = [...activeEvents, ...completedEvents];
  const event = events.find((item) => item.id === req.params.id);

  if (!event) {
    return res.status(404).json({ message: 'Event not found' });
  }

  return res.json(event);
});

app.post('/api/events', (req, res) => {
  const { activeEvents, completedEvents } = archiveCompletedEvents();
  const newEvent = buildEvent({
    ...req.body,
    id: uuidv4()
  });

  const requiredFields = ['title', 'description', 'category', 'city', 'date', 'venue', 'address', 'organizer'];
  const missingField = requiredFields.find((field) => !newEvent[field]);

  if (missingField) {
    return res.status(400).json({
      message: `Missing required field: ${missingField}`
    });
  }

  if (isCompleted(newEvent)) {
    writeCompletedEvents([newEvent, ...completedEvents]);
  } else {
    writeEvents([newEvent, ...activeEvents]);
  }

  return res.status(201).json(newEvent);
});

app.put('/api/events/:id', (req, res) => {
  const { activeEvents, completedEvents } = archiveCompletedEvents();
  const allEvents = [...activeEvents, ...completedEvents];
  const eventIndex = allEvents.findIndex((item) => item.id === req.params.id);

  if (eventIndex === -1) {
    return res.status(404).json({ message: 'Event not found' });
  }

  const updatedEvent = buildEvent({
    ...allEvents[eventIndex],
    ...req.body,
    id: req.params.id
  });

  const remainingEvents = allEvents.filter((item) => item.id !== req.params.id);
  writeEvents([updatedEvent, ...remainingEvents].filter((event) => !isCompleted(event)));
  writeCompletedEvents([updatedEvent, ...remainingEvents].filter(isCompleted));

  return res.json(updatedEvent);
});

app.delete('/api/events/:id', (req, res) => {
  const { activeEvents, completedEvents } = archiveCompletedEvents();
  const allEvents = [...activeEvents, ...completedEvents];
  const event = allEvents.find((item) => item.id === req.params.id);

  if (!event) {
    return res.status(404).json({ message: 'Event not found' });
  }

  const organizer = normalizeString(req.get('x-organizer'));
  if (!organizer || organizer.toLowerCase() !== event.organizer.toLowerCase()) {
    return res.status(403).json({ message: 'Organizer confirmation is required to delete this event' });
  }

  writeEvents(activeEvents.filter((item) => item.id !== req.params.id));
  writeCompletedEvents(completedEvents.filter((item) => item.id !== req.params.id));
  return res.json({ message: 'Event deleted successfully' });
});

if (!fs.existsSync(path.dirname(DATA_FILE))) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
}

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify(
      [
        {
          id: uuidv4(),
          title: 'Chennai Marina Sunset Festival',
          description: 'A vibrant evening of live music, local food stalls, and coastal performances along the Marina promenade.',
          category: 'Concert',
          city: 'Chennai',
          date: '2026-10-15',
          venue: 'Marina Beach Front',
          image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80',
          price: 699,
          organizer: 'Coastal Beats Co.'
        },
        {
          id: uuidv4(),
          title: 'Madurai Heritage Market',
          description: 'A colorful local market filled with handcrafted treasures, temple sweets, and traditional art.',
          category: 'Market',
          city: 'Madurai',
          date: '2026-10-12',
          venue: 'Meenakshi Market Square',
          image: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1200&q=80',
          price: 0,
          organizer: 'Madurai Makers Guild'
        },
        {
          id: uuidv4(),
          title: 'Kumbakonam Wellness Retreat',
          description: 'A peaceful yoga and meditation morning inspired by traditional wellness practices and local herbs.',
          category: 'Workshop',
          city: 'Kumbakonam',
          date: '2026-10-18',
          venue: 'The River Courtyard',
          image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80',
          price: 1499,
          organizer: 'Sattva Collective'
        },
        {
          id: uuidv4(),
          title: 'Tirunelveli Football Derby',
          description: 'An energetic community football tournament bringing neighborhoods together in a friendly match.',
          category: 'Sports',
          city: 'Tirunelveli',
          date: '2026-10-20',
          venue: 'City Arena Grounds',
          image: 'https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&w=1200&q=80',
          price: 399,
          organizer: 'South City League'
        }
      ],
      null,
      2
    )
  );
}

if (!fs.existsSync(COMPLETED_DATA_FILE)) {
  fs.writeFileSync(COMPLETED_DATA_FILE, '[]');
}

if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return next();
    }

    return res.sendFile(path.join(CLIENT_DIST, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
