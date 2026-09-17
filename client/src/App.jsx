import { useEffect, useMemo, useState } from 'react';

const API_URL = `${import.meta.env.VITE_API_URL || '/api'}/events`;

function App() {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('upcoming');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Workshop',
    city: '',
    date: '',
    venue: '',
    address: '',
    latitude: '',
    longitude: '',
    image: '',
    price: 0,
    organizer: ''
  });

  async function fetchEvents() {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (search) params.append('search', search);
      if (city) params.append('city', city);
      if (category && category !== 'All') params.append('category', category);
      if (status === 'completed') params.append('status', 'completed');

      const response = await fetch(`${API_URL}?${params.toString()}`);
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEvents();
  }, [search, city, category, status]);

  const categories = useMemo(
    () => ['All', 'Workshop', 'Concert', 'Sports', 'Market'],
    []
  );

  const featuredCategories = ['Festivals', 'Cultural Nights', 'Food Trails', 'Wellness'];

  async function handleSubmit(event) {
    event.preventDefault();

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });

    if (!response.ok) {
      alert('Please fill in all required fields.');
      return;
    }

    setForm({
      title: '',
      description: '',
      category: 'Workshop',
      city: '',
      date: '',
      venue: '',
      address: '',
      latitude: '',
      longitude: '',
      image: '',
      price: 0,
      organizer: ''
    });

    fetchEvents();
  }

  async function handleDelete(eventItem) {
    const organizer = window.prompt(`Confirm deletion by entering the organizer name: ${eventItem.organizer}`);

    if (!organizer) return;

    const response = await fetch(`${API_URL}/${eventItem.id}`, {
      method: 'DELETE',
      headers: { 'x-organizer': organizer }
    });

    if (!response.ok) {
      const data = await response.json();
      window.alert(data.message || 'Unable to delete this event.');
      return;
    }

    fetchEvents();
  }

  return (
    <div className="page-shell">
      <header className="hero">
        <nav className="topbar container">
          <div className="brand-wrap">
            <img className="brand-mark" src="/thiruvizha-mark.svg" alt="Thiruvizha logo" />
            <span>Thiruvizha</span>
          </div>
          <div className="nav-links">
            <span>Discover</span>
            <span>Cities</span>
            <span>Festivals</span>
            <span>Organizers</span>
          </div>
        </nav>

        <div className="hero-content container">
          <div className="hero-text">
            <p className="eyebrow">Tamil Nadu experiences</p>
            <h1>Celebrate culture, cuisine, and community.</h1>
            <p className="hero-copy">
              Discover vibrant festivals, temple events, local markets, music nights, and wellness experiences across Tamil Nadu.
            </p>

            <div className="cta-row">
              <button className="primary-btn" onClick={() => document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' })}>Explore events</button>
              <button className="secondary-btn" onClick={() => document.getElementById('organizer-tools')?.scrollIntoView({ behavior: 'smooth' })}>Host an event</button>
            </div>

            <div className="stats-row">
              <div>
                <strong>18k+</strong>
                <span>happy guests</span>
              </div>
              <div>
                <strong>420</strong>
                <span>events</span>
              </div>
              <div>
                <strong>25</strong>
                <span>cities</span>
              </div>
            </div>
          </div>

          <div className="filters card">
            <label>
              <span>Search</span>
              <input
                type="text"
                placeholder="Search festivals or places"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <label>
              <span>City</span>
              <input
                type="text"
                placeholder="Chennai, Madurai..."
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </label>
            <label>
              <span>Category</span>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {categories.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </header>

      <main className="container main-layout">
        <section className="events-panel" id="events">
          <div className="section-header">
            <div>
              <p className="section-kicker">Live and upcoming</p>
              <h2>Top events in Tamil Nadu</h2>
            </div>
              <div className="status-tabs" role="tablist" aria-label="Event status">
                <button className={status === 'upcoming' ? 'active' : ''} onClick={() => setStatus('upcoming')}>Upcoming</button>
                <button className={status === 'completed' ? 'active' : ''} onClick={() => setStatus('completed')}>Completed</button>
              </div>
              <span>{events.length} listings</span>
          </div>

          <div className="category-pills">
            {featuredCategories.map((item) => (
              <span key={item} className="pill">{item}</span>
            ))}
          </div>

          {loading ? (
            <p className="empty-state">Loading events...</p>
          ) : events.length === 0 ? (
            <p className="empty-state">No events match your filters.</p>
          ) : (
            <div className="event-grid">
              {events.map((event) => (
                <article key={event.id} className="event-card card">
                  <img src={event.image || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80'} alt={event.title} />
                  <div className="event-body">
                    <div className="meta-row">
                      <span className="tag">{event.category}</span>
                      <span>{event.date}</span>
                    </div>
                    <h3>{event.title}</h3>
                    <p>{event.description}</p>
                    <ul>
                      <li><strong>City:</strong> {event.city}</li>
                      <li><strong>Venue:</strong> {event.venue}</li>
                      <li><strong>Address:</strong> {event.address || 'Address being confirmed'}</li>
                      <li><strong>Price:</strong> ₹{event.price}</li>
                    </ul>
                    {event.latitude !== null && event.longitude !== null && (
                      <a className="map-link" href={`https://www.google.com/maps/search/?api=1&query=${event.latitude},${event.longitude}`} target="_blank" rel="noreferrer">Open exact location</a>
                    )}
                    {status === 'upcoming' && (
                      <button className="delete-btn" onClick={() => handleDelete(event)}>Delete listing</button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="form-panel card" id="organizer-tools">
          <p className="section-kicker">Organizer tools</p>
          <h2>Add an event</h2>
          <form onSubmit={handleSubmit} className="event-form">
            <input
              type="text"
              placeholder="Event title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <textarea
              placeholder="Tell people what makes this event special"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="Workshop">Workshop</option>
              <option value="Concert">Concert</option>
              <option value="Sports">Sports</option>
              <option value="Market">Market</option>
            </select>
            <input
              type="text"
              placeholder="City"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
            <input
              type="text"
              placeholder="Venue"
              value={form.venue}
              onChange={(e) => setForm({ ...form, venue: e.target.value })}
            />
            <input
              type="text"
              placeholder="Exact address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              required
            />
            <div className="coordinate-row">
              <input
                type="number"
                step="any"
                placeholder="Latitude"
                value={form.latitude}
                onChange={(e) => setForm({ ...form, latitude: e.target.value })}
              />
              <input
                type="number"
                step="any"
                placeholder="Longitude"
                value={form.longitude}
                onChange={(e) => setForm({ ...form, longitude: e.target.value })}
              />
            </div>
            <input
              type="text"
              placeholder="Image URL"
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
            />
            <input
              type="number"
              placeholder="Price (₹)"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            />
            <input
              type="text"
              placeholder="Organizer"
              value={form.organizer}
              onChange={(e) => setForm({ ...form, organizer: e.target.value })}
            />
            <button type="submit">Publish event</button>
          </form>
        </aside>
      </main>
    </div>
  );
}

export default App;
